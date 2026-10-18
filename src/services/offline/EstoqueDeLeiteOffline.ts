import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Movimentacao, Tanque } from "../../pages/controle_de_estoque/estoque";

export type MovimentacaoLocal = Omit<Movimentacao, "id"> & {
    id: string;
};


function chaveTanques(usuarioId: number): string {
    return `@raizes_digitais:usuario:${usuarioId}:tanques`;
}

function chaveMovimentacoes(usuarioId: number, tanqueId: number): string {
    return `@raizes_digitais:usuario:${usuarioId}:tanque:${tanqueId}:movimentacoes`;
}

export async function salvarTanquesLocal(
    usuarioId: number,
    tanques: Tanque[]
): Promise<void> {
    const chave = chaveTanques(usuarioId);

    await AsyncStorage.setItem(
        chave,
        JSON.stringify(tanques)
    );

    console.log(
        "Tanques salvos localmente:",
        JSON.stringify(tanques)
    );
}

export async function listarTanquesLocal(
    usuarioId: number
): Promise<Tanque[]> {
    const chave = chaveTanques(usuarioId);

    const dados = await AsyncStorage.getItem(chave);

    if (!dados) {
        return [];
    }

    return JSON.parse(dados) as Tanque[];
}



export async function salvarMovimentacaoLocal(
    usuarioId: number,
    tanqueId: number,
    movimentacao: MovimentacaoLocal
): Promise<void> {

    const chave = chaveMovimentacoes(usuarioId, tanqueId);

    const dadosSalvos = await AsyncStorage.getItem(chave);

    const movimentacoes: MovimentacaoLocal[] = dadosSalvos
        ? JSON.parse(dadosSalvos)
        : [];

    movimentacoes.push(movimentacao);

    await AsyncStorage.setItem(
        chave,
        JSON.stringify(movimentacoes)
    );

    console.log(
        "Movimentação salva localmente:",
        JSON.stringify(movimentacao)
    );
}
