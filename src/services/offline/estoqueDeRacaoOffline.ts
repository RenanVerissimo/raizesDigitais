import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MovimentacaoRacao } from "../../pages/controle_de_estoque/estoque_racao";


function chaveRacao(usuarioId: number): string {
    return `@raizes_digitais:usuario:${usuarioId}:racao`;
}




export async function listarRacaoLocal(
    usuarioId: number
): Promise<MovimentacaoRacao[]> {
    const chave = chaveRacao(usuarioId);
    const dados = await AsyncStorage.getItem(chave);

    if (dados === null) {
        return [];
    }

    return JSON.parse(dados) as MovimentacaoRacao[];
}


export async function salvarNovaMovimentacaoLocal(
    usuarioId: number,
    novaMovimentacao: MovimentacaoRacao
): Promise<void> {

    const chave = chaveRacao(usuarioId);

    // Pega as movimentações que já estão salvas
    const movimentacoes = await listarRacaoLocal(usuarioId);

    // Adiciona a nova movimentação
    movimentacoes.unshift(novaMovimentacao);

    // Salva a lista atualizada
    await AsyncStorage.setItem(
        chave,
        JSON.stringify(movimentacoes)
    );
}
