import type { Financiamento } from "../interfaces/interfaces";

export function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatarData(dataIso?: string | null) {
    if (!dataIso) return "-";
    return new Date(`${dataIso}T12:00:00`).toLocaleDateString("pt-BR");
}

export function calcularValorParcela(financiamento: Financiamento) {
    return financiamento.valorTotal / financiamento.quantidadeParcelas;
}

export function calcularSaldoRestante(financiamento: Financiamento) {
    const valorParcela = calcularValorParcela(financiamento);
    return Math.max(financiamento.valorTotal - valorParcela * financiamento.parcelasPagas, 0);
}
