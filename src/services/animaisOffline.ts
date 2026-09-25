import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Animal } from "../interfaces/interfaces";
import { normalizarId } from "../utils/normalizarId";

const gravacoesPorUsuario = new Map<number, Promise<unknown>>();

function gerarChaveCadastro() {
    return `animal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function executarGravacao<T>(usuarioId: number, operacao: () => Promise<T>): Promise<T> {
    chaveAnimais(usuarioId);
    const anterior = gravacoesPorUsuario.get(usuarioId);
    const gravacao = Promise.resolve(anterior).catch(() => undefined).then(operacao);
    gravacoesPorUsuario.set(usuarioId, gravacao);
    try {
        return await gravacao;
    } finally {
        if (gravacoesPorUsuario.get(usuarioId) === gravacao) gravacoesPorUsuario.delete(usuarioId);
    }
}

function chaveAnimais(usuarioId: number): string {
    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
        throw new Error("Usuário inválido para o armazenamento offline de animais.");
    }

    return `@raizes_digitais:usuario:${usuarioId}:animais`;
}

/** Retorna uma lista vazia somente quando ainda não há dados salvos. */
export async function listarAnimaisOffline(usuarioId: number): Promise<Animal[]> {
    const dados = await AsyncStorage.getItem(chaveAnimais(usuarioId));
    if (dados === null) return [];

    const animais: unknown = JSON.parse(dados);
    if (!Array.isArray(animais)) {
        throw new Error("Os dados locais de animais não contêm uma lista válida.");
    }

    return animais as Animal[];
}

/** Substitui a lista completa do usuário; não adiciona registros individualmente. */
async function gravarLista(usuarioId: number, animais: Animal[]): Promise<void> {
    const chave = chaveAnimais(usuarioId);
    if (!Array.isArray(animais)) {
        throw new Error("Informe uma lista de animais para salvar offline.");
    }

    await AsyncStorage.setItem(chave, JSON.stringify(animais));
}

export async function salvarAnimaisOffline(usuarioId: number, animais: Animal[]): Promise<void> {
    await executarGravacao(usuarioId, () => gravarLista(usuarioId, animais));
}

/** Acrescenta um cadastro local, preservando os anteriores e a associação ao usuário. */
export async function criarAnimalOffline(
    usuarioId: number,
    dados: Omit<Animal, "id" | "usuario_id" | "salvo_offline" | "idempotency_key">,
): Promise<Animal> {
    return executarGravacao(usuarioId, async () => {
        const animais = await listarAnimaisOffline(usuarioId);
        const identificador = normalizarId(dados.identificador);
        if (!identificador) throw new Error("Informe o número/identificação do animal.");
        if (animais.some((animal) => normalizarId(animal.identificador) === identificador)) {
            throw new Error("Já existe um animal salvo neste dispositivo com esse identificador.");
        }

        // IDs negativos são locais; os IDs positivos continuam sendo os do servidor.
        const id = animais.reduce((menor, animal) => Math.min(menor, animal.id - 1), -Date.now());
        const animal: Animal = {
            ...dados,
            identificador: dados.identificador.trim(),
            status: dados.status ?? "ativo",
            id,
            usuario_id: usuarioId,
            salvo_offline: true,
            idempotency_key: gerarChaveCadastro(),
        };
        await gravarLista(usuarioId, [animal, ...animais]);
        return animal;
    });
}

/** Também prepara os animais cadastrados antes da implementação da sincronização. */
export async function prepararAnimaisParaSincronizacao(usuarioId: number): Promise<Animal[]> {
    return executarGravacao(usuarioId, async () => {
        const animais = await listarAnimaisOffline(usuarioId);
        let alterou = false;
        const preparados = animais.map((animal) => {
            if (!animal.salvo_offline) return animal;
            if (animal.usuario_id != null && animal.usuario_id !== usuarioId) {
                throw new Error("O cadastro local pertence a outro usuário.");
            }
            if (animal.idempotency_key) return animal;
            alterou = true;
            return { ...animal, usuario_id: usuarioId, idempotency_key: gerarChaveCadastro() };
        });
        // A chave precisa estar persistida antes do primeiro envio, inclusive nos cadastros antigos.
        if (alterou) await gravarLista(usuarioId, preparados);
        return preparados.filter((animal) => animal.salvo_offline);
    });
}

/** Remove apenas a pendência que o servidor confirmou, preservando cadastros concorrentes. */
export async function confirmarAnimalSincronizado(usuarioId: number, chave: string): Promise<void> {
    await executarGravacao(usuarioId, async () => {
        const animais = await listarAnimaisOffline(usuarioId);
        await gravarLista(usuarioId, animais.filter((animal) => animal.idempotency_key !== chave));
    });
}
