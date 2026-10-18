import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MovimentacaoRacao } from "../../pages/controle_de_estoque/estoque_racao";
import type { Racao } from "../../pages/controle_de_estoque/estoque_racao";
import { listaDeTarefasOffline } from "./sincronizacaoOffline";

export async function salvarRacoesLocal(usuarioId: number, racoes: Racao[]): Promise<void> {
    await AsyncStorage.setItem(`@raizes_digitais:usuario:${usuarioId}:racoes`, JSON.stringify(racoes));
}

export async function aplicarSaidasPendentes(usuarioId: number, racoes: Racao[]): Promise<Racao[]> {
    const tarefas = await listaDeTarefasOffline(usuarioId);
    return racoes.map(racao => ({
        ...racao,
        quantidadeAtual: tarefas.filter(t => t.area === "Estoque de Ração" && t.acao === "Novo Registro" && t.dados.tipo === "saida" && Number(t.dados.racaoId) === racao.id)
            .reduce((saldo, t) => saldo - Number(t.dados.quantidade), racao.quantidadeAtual),
    }));
}

export async function listarRacoesLocal(usuarioId: number): Promise<Racao[]> {
    const dados = await AsyncStorage.getItem(`@raizes_digitais:usuario:${usuarioId}:racoes`);
    return aplicarSaidasPendentes(usuarioId, dados ? JSON.parse(dados) : []);
}


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
