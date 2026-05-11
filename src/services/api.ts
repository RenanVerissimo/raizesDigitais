import { Animal, Receita, StatusCompra } from "../interfaces/interfaces";

const BASE_URL = "http://192.168.32.108:3001/api";

export async function listarProducoes() {
    const response = await fetch(`${BASE_URL}/producao`);
    return response.json();
}
export async function listarProducoesRecentes() {
    const response = await fetch(`${BASE_URL}/producao/recentes`);
    return response.json();
}

export async function criarProducao(dados: {
    date: string;
    morningProduction: number;
    afternoonProduction: number;
    quality: string;
    notes: string | null;
}) {
    const response = await fetch(`${BASE_URL}/producao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!response.ok) {
        throw new Error("Erro ao salvar produção");
    }
    return response.json();


}

export async function excluirProducao(id: number) {
    const response = await fetch(`${BASE_URL}/producao/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Erro ao excluir");
    return response.json();
}

export async function atualizarProducao(id: number, dados: {
    date: string;
    morningProduction: number;
    afternoonProduction: number;
    quality: string;
    notes: string | null;
}) {
    const response = await fetch(`${BASE_URL}/producao/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!response.ok) throw new Error("Erro ao atualizar");
    return response.json();
}

// ============================================
// ANIMAIS
// ============================================

// ============================================
// ANIMAIS
// ============================================

export async function listarAnimais(): Promise<Animal[]> {
    try {
        const response = await fetch(`${BASE_URL}/animais`);

        if (!response.ok) {
            throw new Error(`Erro ao listar animais (status ${response.status})`);
        }

        return await response.json();

    } catch (err) {
        console.error("Falha em listarAnimais:", err);
        throw new Error("Não foi possível carregar os animais. Verifique a conexão.");
    }
}

export async function criarAnimal(dados: {
    nome: string;
    identificador: string;

    producao_media_diaria: number | null;
    raca?: string | null;
    peso?: number | null;
    descricao?: string | null;

    data_nascimento: string;
    data_ultimo_parto?: string | null;

    // 🔥 NOVOS CAMPOS
    prenha: boolean;
    em_cio: boolean;
    abortou: boolean;
    nao_emprenha: boolean;
    mastite: boolean;
    doente?: boolean;
    doenca?: "mastite" | "outra" | null;
    descricao_doenca?: string | null;

    data_cobertura?: string | null;
    data_inseminacao?: string | null;
    data_confirmacao_prenhez?: string | null;
}) {
    try {
        const response = await fetch(`${BASE_URL}/animais`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        });

        if (!response.ok) {
            throw new Error(`Erro ao cadastrar (status ${response.status})`);
        }

        return await response.json();

    } catch (err) {
        console.error("Falha em criarAnimal:", err);
        throw new Error("Não foi possível cadastrar o animal. Verifique a conexão.");
    }
}

export async function atualizarAnimal(id: number, dados: {
    nome: string;
    identificador: string;

    producao_media_diaria: number | null;
    raca?: string | null;
    peso?: number | null;
    descricao?: string | null;

    data_nascimento: string;
    data_ultimo_parto?: string | null;

    // 🔥 NOVOS CAMPOS
    prenha: boolean;
    em_cio: boolean;
    abortou: boolean;
    nao_emprenha: boolean;
    mastite: boolean;
    doente?: boolean;
    doenca?: "mastite" | "outra" | null;
    descricao_doenca?: string | null;

    data_cobertura?: string | null;
    data_inseminacao?: string | null;
    data_confirmacao_prenhez?: string | null;
}) {
    try {
        const response = await fetch(`${BASE_URL}/animais/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        });

        if (!response.ok) {
            throw new Error(`Erro ao atualizar (status ${response.status})`);
        }

        return await response.json();

    } catch (err) {
        console.error("Falha em atualizarAnimal:", err);
        throw new Error("Não foi possível atualizar o animal. Verifique a conexão.");
    }
}

export async function excluirAnimal(id: number) {
    try {
        const response = await fetch(`${BASE_URL}/animais/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`Erro ao excluir (status ${response.status})`);
        }

        return await response.json();

    } catch (err) {
        console.error("Falha em excluirAnimal:", err);
        throw new Error("Não foi possível excluir o animal. Verifique a conexão.");
    }
}

import { Compra } from "../interfaces/interfaces";

// LISTAR COMPRAS
export async function listarCompras(): Promise<Compra[]> {
    const res = await fetch(`${BASE_URL}/compras`);
    if (!res.ok) throw new Error("Erro ao listar compras");
    const dados = await res.json();
    // 🛡️ Converte os DECIMAL do MySQL (que vêm como string) para number
    return dados.map((c: any) => ({
        ...c,
        quantidade: Number(c.quantidade),
        precoUnitario: Number(c.precoUnitario),
        precoTotal: Number(c.precoTotal),
        finalidadeTratamento: c.finalidadeTratamento || null,
        finalidadeDescricao: c.finalidadeDescricao || null,
        tipoRacao: c.tipoRacao || null,
        unidadeCompra: c.unidadeCompra || null,
        pesoPorUnidadeKg: c.pesoPorUnidadeKg === null || c.pesoPorUnidadeKg === undefined ? null : Number(c.pesoPorUnidadeKg),
        quantidadeEstoqueKg: c.quantidadeEstoqueKg === null || c.quantidadeEstoqueKg === undefined ? null : Number(c.quantidadeEstoqueKg),
    }));
}

// CRIAR COMPRA
export async function criarCompra(dados: Omit<Compra, "id" | "precoTotal">) {
    const res = await fetch(`${BASE_URL}/compras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!res.ok) {
        const erroData = await res.json().catch(() => ({}));
        console.error("❌ Erro do servidor:", res.status, erroData);
        throw new Error(erroData.erro || `Erro ao cadastrar compra (status ${res.status})`);
    }
    return res.json();
}

// ATUALIZAR STATUS
export async function atualizarStatusCompra(id: number, status: StatusCompra) {
    const res = await fetch(`${BASE_URL}/compras/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Erro ao atualizar status");
    return res.json();
}

// EXCLUIR COMPRA
export async function excluirCompra(id: number) {
    const res = await fetch(`${BASE_URL}/compras/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao excluir compra");
    return res.json();
}

export async function atualizarCompra(id: number, dados: Omit<Compra, "id" | "precoTotal">) {
    const res = await fetch(`${BASE_URL}/compras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!res.ok) {
        const erroData = await res.json().catch(() => ({}));
        console.error("❌ Erro do servidor:", res.status, erroData);
        throw new Error(erroData.erro || `Erro ao atualizar compra (status ${res.status})`);
    }
    return res.json();
}


export async function listarReceitas(): Promise<Receita[]> {
    const res = await fetch(`${BASE_URL}/receitas`);

    if (!res.ok) {
        throw new Error("Erro ao listar receitas");
    }

    const dados = await res.json();

    return dados.map((r: any) => ({
        ...r,
        litros: Number(r.litros),
        precoPorLitro: Number(r.precoPorLitro),
        valorTotal: Number(r.valorTotal),
    }));
}

export async function criarReceita(dados: {
    data: string;
    litros: number;
    precoPorLitro: number;
    comprador: string;
    observacoes?: string | null;
}) {
    const res = await fetch(`${BASE_URL}/receitas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });

    if (!res.ok) {
        const erroData = await res.json().catch(() => ({}));
        throw new Error(erroData.erro || "Erro ao cadastrar receita");
    }

    return res.json();
}

export async function atualizarReceita(id: number, dados: {
    data: string;
    litros: number;
    precoPorLitro: number;
    valorTotal: number;
    comprador: string;
    observacoes?: string | null;
}) {
    const res = await fetch(`${BASE_URL}/receitas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });

    if (!res.ok) {
        const erroData = await res.json().catch(() => ({}));
        throw new Error(erroData.erro || "Erro ao atualizar receita");
    }

    return res.json();
}

export async function excluirReceita(id: number) {
    const res = await fetch(`${BASE_URL}/receitas/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        throw new Error("Erro ao excluir receita");
    }

    return res.json();
}


// ============================================
// ESTOQUE — TANQUES
// ============================================

export async function listarTanques() {
    const res = await fetch(`${BASE_URL}/estoque/tanques`);
    if (!res.ok) throw new Error("Erro ao listar tanques");
    const dados = await res.json();
    return dados.map((t: any) => ({
        ...t,
        capacidade: Number(t.capacidade),
        volumeAtual: Number(t.volumeAtual),
        temperatura: Number(t.temperatura),
    }));
}

export async function criarTanque(dados: {
    nome: string;
    capacidade: number;
    volumeAtual: number;
    temperatura: number;
    qualidade: string;
    localizacao?: string | null;
    observacoes?: string | null;
}) {
    const res = await fetch(`${BASE_URL}/estoque/tanques`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao cadastrar tanque");
    }
    return res.json();
}

export async function atualizarTanque(id: number, dados: {
    nome: string;
    capacidade: number;
    volumeAtual: number;
    temperatura: number;
    qualidade: string;
    localizacao?: string | null;
    observacoes?: string | null;
}) {
    const res = await fetch(`${BASE_URL}/estoque/tanques/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error("Erro ao atualizar tanque");
    return res.json();
}

export async function excluirTanque(id: number) {
    const res = await fetch(`${BASE_URL}/estoque/tanques/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao excluir tanque");
    return res.json();
}

// ============================================
// ESTOQUE — MOVIMENTAÇÕES
// ============================================

export async function listarMovimentacoes() {
    const res = await fetch(`${BASE_URL}/estoque/movimentacoes`);
    if (!res.ok) throw new Error("Erro ao listar movimentações");
    const dados = await res.json();
    return dados.map((m: any) => ({
        ...m,
        volume: Number(m.volume),
        temperatura: m.temperatura === null || m.temperatura === undefined ? null : Number(m.temperatura),
        consumoProprio: m.consumoProprio === null || m.consumoProprio === undefined ? 0 : Number(m.consumoProprio),
    }));
}

export async function criarMovimentacao(dados: {
    tanqueId: number;
    tipo: "entrada" | "saida";
    volume: number;
    data: string;
    hora: string;
    motivo: string;
    comprador?: string | null;
    temperatura?: number | null;
    consumoProprio?: number;
    observacoes?: string | null;
}) {
    const res = await fetch(`${BASE_URL}/estoque/movimentacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao registrar movimentação");
    }
    return res.json();
}

export async function atualizarMovimentacao(id: number, dados: {
    tanqueId: number;
    tipo: "entrada" | "saida";
    volume: number;
    data: string;
    hora: string;
    motivo: string;
    comprador?: string | null;
    temperatura?: number | null;
    consumoProprio?: number;
    observacoes?: string | null;
}) {
    const res = await fetch(`${BASE_URL}/estoque/movimentacoes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao atualizar movimentação");
    }
    return res.json();
}

export async function excluirMovimentacao(id: number) {
    const res = await fetch(`${BASE_URL}/estoque/movimentacoes/${id}`, { method: "DELETE" });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao excluir movimentação");
    }
    return res.json();
}

// ============================================
// ESTOQUE - RACOES
// ============================================

export async function listarRacoes() {
    const res = await fetch(`${BASE_URL}/estoque/racoes`);
    if (!res.ok) throw new Error("Erro ao listar racoes");
    const dados = await res.json();
    return dados.map((r: any) => ({
        ...r,
        quantidadeAtual: Number(r.quantidadeAtual),
        estoqueMinimo: Number(r.estoqueMinimo),
        custoUnitario: r.custoUnitario === null || r.custoUnitario === undefined ? null : Number(r.custoUnitario),
    }));
}

export async function criarRacao(dados: {
    nome: string;
    tipo: string;
    unidade: string;
    quantidadeAtual: number;
    estoqueMinimo: number;
    custoUnitario?: number | null;
    fornecedor?: string | null;
    localizacao?: string | null;
    validade?: string | null;
    observacoes?: string | null;
}) {
    const res = await fetch(`${BASE_URL}/estoque/racoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao cadastrar racao");
    }
    return res.json();
}

export async function atualizarRacao(id: number, dados: {
    nome: string;
    tipo: string;
    unidade: string;
    quantidadeAtual: number;
    estoqueMinimo: number;
    custoUnitario?: number | null;
    fornecedor?: string | null;
    localizacao?: string | null;
    validade?: string | null;
    observacoes?: string | null;
}) {
    const res = await fetch(`${BASE_URL}/estoque/racoes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao atualizar racao");
    }
    return res.json();
}

export async function excluirRacao(id: number) {
    const res = await fetch(`${BASE_URL}/estoque/racoes/${id}`, { method: "DELETE" });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao excluir racao");
    }
    return res.json();
}

export async function listarMovimentacoesRacao() {
    const res = await fetch(`${BASE_URL}/estoque/racoes/movimentacoes`);
    if (!res.ok) throw new Error("Erro ao listar movimentacoes de racao");
    const dados = await res.json();
    return dados.map((m: any) => ({
        ...m,
        quantidade: Number(m.quantidade),
    }));
}

export async function criarMovimentacaoRacao(dados: {
    racaoId: number;
    tipo: "saida" | "ajuste";
    quantidade: number;
    data: string;
    motivo: string;
    destino?: string | null;
    observacoes?: string | null;
}) {
    const res = await fetch(`${BASE_URL}/estoque/racoes/movimentacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao movimentar racao");
    }
    return res.json();
}

// ============================================
// AUTH
// ============================================

export async function login(email: string, senha: string) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
    });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao realizar login");
    }
    return res.json();
}

export async function cadastrar(dados: {
    nome: string;
    email: string;
    telefone?: string;
    nome_fazenda?: string;
    senha: string;
    confirmar_senha: string;
}) {
    const res = await fetch(`${BASE_URL}/auth/cadastrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao cadastrar");
    }
    return res.json();
}
