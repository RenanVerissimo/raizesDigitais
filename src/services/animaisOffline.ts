import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Animal } from "../interfaces/interfaces";
import { normalizarId } from "../utils/normalizarId";

const gravacoesPorUsuario = new Map<number, Promise<unknown>>();

export interface AcaoAnimalOffline {
    id: string;
    tipo: "editar" | "excluir";
    animalId: number;
    nome: string;
    identificador: string;
    dados?: Omit<Animal, "id" | "usuario_id" | "salvo_offline" | "idempotency_key">;
    criadaEm: string;
}

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

function chaveCacheAnimais(usuarioId: number): string {
    chaveAnimais(usuarioId);
    return `@raizes_digitais:usuario:${usuarioId}:animais_cache`;
}

function chaveAcoesAnimais(usuarioId: number): string {
    chaveAnimais(usuarioId);
    return `@raizes_digitais:usuario:${usuarioId}:animais_acoes`;
}

function converterListaAnimais(dados: string | null, mensagemErro: string): Animal[] {
    if (dados === null) return [];
    const animais: unknown = JSON.parse(dados);
    if (!Array.isArray(animais)) throw new Error(mensagemErro);
    return animais as Animal[];
}

/** Retorna uma lista vazia somente quando ainda não há dados salvos. */
export async function listarAnimaisOffline(usuarioId: number): Promise<Animal[]> {
    const dados = await AsyncStorage.getItem(chaveAnimais(usuarioId));
    return converterListaAnimais(dados, "Os dados locais de animais não contêm uma lista válida.");
}

/** Retorna a última lista de animais recebida do servidor para este usuário. */
export async function listarCacheAnimais(usuarioId: number): Promise<Animal[]> {
    const dados = await AsyncStorage.getItem(chaveCacheAnimais(usuarioId));
    return converterListaAnimais(dados, "O cache de animais não contém uma lista válida.");
}

/** Substitui o cache somente depois que a API retorna uma lista válida. */
export async function salvarCacheAnimais(usuarioId: number, animais: Animal[]): Promise<void> {
    if (!Array.isArray(animais)) throw new Error("Informe uma lista de animais para salvar no cache.");
    await executarGravacao(usuarioId, () => gravarCache(usuarioId, animais));
}

async function gravarCache(usuarioId: number, animais: Animal[]): Promise<void> {
    await AsyncStorage.setItem(chaveCacheAnimais(usuarioId), JSON.stringify(animais));
}

async function lerAcoes(usuarioId: number): Promise<AcaoAnimalOffline[]> {
    const dados = await AsyncStorage.getItem(chaveAcoesAnimais(usuarioId));
    if (dados === null) return [];
    const acoes: unknown = JSON.parse(dados);
    if (!Array.isArray(acoes)) throw new Error("As ações offline de animais não contêm uma lista válida.");
    return acoes as AcaoAnimalOffline[];
}

async function gravarAcoes(usuarioId: number, acoes: AcaoAnimalOffline[]) {
    await AsyncStorage.setItem(chaveAcoesAnimais(usuarioId), JSON.stringify(acoes));
}

export async function listarAcoesAnimaisOffline(usuarioId: number): Promise<AcaoAnimalOffline[]> {
    chaveAnimais(usuarioId);
    return lerAcoes(usuarioId);
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

export async function editarAnimalOffline(
    usuarioId: number,
    animalId: number,
    dados: Omit<Animal, "id" | "usuario_id" | "salvo_offline" | "idempotency_key">,
): Promise<Animal> {
    return executarGravacao(usuarioId, async () => {
        const locais = await listarAnimaisOffline(usuarioId);
        const local = locais.find((animal) => animal.id === animalId && animal.salvo_offline);
        if (local) {
            const atualizado = { ...local, ...dados, id: local.id, usuario_id: usuarioId, salvo_offline: true };
            await gravarLista(usuarioId, locais.map((animal) => animal.id === animalId ? atualizado : animal));
            return atualizado;
        }

        const cache = await listarCacheAnimais(usuarioId);
        const existente = cache.find((animal) => animal.id === animalId);
        if (!existente) throw new Error("Animal não encontrado no cache deste usuário.");
        const identificador = normalizarId(dados.identificador);
        const repetidoNoCache = cache.some((animal) => animal.id !== animalId && normalizarId(animal.identificador) === identificador);
        const repetidoLocal = locais.some((animal) => normalizarId(animal.identificador) === identificador);
        if (repetidoNoCache || repetidoLocal) throw new Error("Já existe outro animal com esse identificador.");
        const atualizado: Animal = { ...existente, ...dados, id: animalId, usuario_id: usuarioId };
        const acoes = await lerAcoes(usuarioId);
        if (acoes.some((acao) => acao.animalId === animalId && acao.tipo === "excluir")) {
            throw new Error("Este animal já está aguardando exclusão.");
        }
        const acao: AcaoAnimalOffline = {
            id: `editar-${usuarioId}-${animalId}`,
            tipo: "editar",
            animalId,
            nome: atualizado.nome,
            identificador: atualizado.identificador,
            dados,
            criadaEm: new Date().toISOString(),
        };
        await gravarCache(usuarioId, cache.map((animal) => animal.id === animalId ? atualizado : animal));
        await gravarAcoes(usuarioId, [...acoes.filter((item) => item.id !== acao.id), acao]);
        return atualizado;
    });
}

export async function excluirAnimalOffline(usuarioId: number, animalId: number): Promise<{ cancelouCadastro: boolean }> {
    return executarGravacao(usuarioId, async () => {
        const locais = await listarAnimaisOffline(usuarioId);
        const local = locais.find((animal) => animal.id === animalId && animal.salvo_offline);
        if (local) {
            await gravarLista(usuarioId, locais.filter((animal) => animal.id !== animalId));
            return { cancelouCadastro: true };
        }

        const cache = await listarCacheAnimais(usuarioId);
        const existente = cache.find((animal) => animal.id === animalId);
        if (!existente) throw new Error("Animal não encontrado no cache deste usuário.");
        const acoes = await lerAcoes(usuarioId);
        const acao: AcaoAnimalOffline = {
            id: `excluir-${usuarioId}-${animalId}`,
            tipo: "excluir",
            animalId,
            nome: existente.nome,
            identificador: existente.identificador,
            criadaEm: new Date().toISOString(),
        };
        await gravarCache(usuarioId, cache.filter((animal) => animal.id !== animalId));
        await gravarAcoes(usuarioId, [
            ...acoes.filter((item) => item.animalId !== animalId),
            acao,
        ]);
        return { cancelouCadastro: false };
    });
}

export async function confirmarAcaoAnimalOffline(usuarioId: number, acaoId: string): Promise<void> {
    await executarGravacao(usuarioId, async () => {
        const acoes = await lerAcoes(usuarioId);
        await gravarAcoes(usuarioId, acoes.filter((acao) => acao.id !== acaoId));
    });
}
