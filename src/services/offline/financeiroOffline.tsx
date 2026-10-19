import type { Compra } from "../../interfaces/interfaces";
import { adicionarTarefaOffline } from "./sincronizacaoOffline";

export type CompraOfflineDados = Omit<Compra, "id" | "precoTotal">;

export type ReceitaOfflineDados = {
    tipoReceita?: "leite" | "animal";
    data: string;
    litros?: number;
    precoPorLitro?: number;
    animalId?: number | null;
    animalNome?: string | null;
    animalIdentificador?: string | null;
    animalPeso?: number | null;
    valorAnimal?: number | null;
    comprador: string;
    observacoes?: string | null;
};

async function salvarRegistroFinanceiroOffline(
    usuarioId: number,
    tarefaId: string,
    area: "Compras" | "Financeiro",
    dados: CompraOfflineDados | ReceitaOfflineDados
) {
    await adicionarTarefaOffline(usuarioId, {
        id: tarefaId,
        usuarioId,
        acao: "Novo Registro",
        area,
        dados: { ...dados, idempotencyKey: tarefaId },
        criadaEm: new Date().toISOString(),
    });

    return { salvo_offline: true as const, tarefaId };
}

export async function salvarCompraOffline(usuarioId: number, tarefaId: string, dados: CompraOfflineDados) {
    return salvarRegistroFinanceiroOffline(usuarioId, tarefaId, "Compras", dados);
}

export async function salvarReceitaOffline(usuarioId: number, tarefaId: string, dados: ReceitaOfflineDados) {
    return salvarRegistroFinanceiroOffline(usuarioId, tarefaId, "Financeiro", dados);
}
