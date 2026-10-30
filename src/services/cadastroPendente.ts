import type { cadastrar } from "./api";

// Dados temporários em memória; senhas não são persistidas nem enviadas nas rotas.
let cadastroPendente: Parameters<typeof cadastrar>[0] | null = null;

export function definirCadastroPendente(dados: Parameters<typeof cadastrar>[0]) {
    cadastroPendente = dados;
}

export function obterCadastroPendente() {
    return cadastroPendente;
}

export function limparCadastroPendente() {
    cadastroPendente = null;
}
