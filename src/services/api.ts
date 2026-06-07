import AsyncStorage from "@react-native-async-storage/async-storage";
import { Animal, Compra, Financiamento, Receita, StatusCompra } from "../interfaces/interfaces";

const BASE_URL = "http://192.168.32.108:3001/api";
const USUARIO_STORAGE_KEY = "@raizes_digitais_usuario";

export interface UsuarioLogado {
    id: number;
    nome: string;
    email: string;
    telefone?: string | null;
    nome_fazenda?: string | null;
}

export async function getUsuarioLogado() {
    const raw = await AsyncStorage.getItem(USUARIO_STORAGE_KEY);
    return raw ? JSON.parse(raw) as UsuarioLogado : null;
}

export async function salvarUsuarioLogado(usuario: UsuarioLogado) {
    await AsyncStorage.setItem(USUARIO_STORAGE_KEY, JSON.stringify(usuario));
}

export async function limparUsuarioLogado() {
    await AsyncStorage.removeItem(USUARIO_STORAGE_KEY);
}

async function apiFetch(path: string, init: RequestInit = {}) {
    const usuario = await getUsuarioLogado();
    const headers = {
        ...(init.headers || {}),
        ...(usuario?.id ? { "x-usuario-id": String(usuario.id) } : {}),
    };

    return fetch(`${BASE_URL}${path}`, { ...init, headers });
}

export async function listarProducoes() {
    const response = await apiFetch("/producao");
    return response.json();
}
export async function listarProducoesRecentes() {
    const response = await apiFetch("/producao/recentes");
    return response.json();
}

export async function criarProducao(dados: {
    date: string;
    dailyProduction: number;
    notes: string | null;
}) {
    const response = await apiFetch(`/producao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!response.ok) {
        const erroData = await response.json().catch(() => ({}));
        throw new Error(erroData.erro || erroData.error || "Erro ao salvar produção");
    }
    return response.json();


}

export async function excluirProducao(id: number) {
    const response = await apiFetch(`/producao/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Erro ao excluir");
    return response.json();
}

export async function atualizarProducao(id: number, dados: {
    date: string;
    dailyProduction: number;
    notes: string | null;
}) {
    const response = await apiFetch(`/producao/${id}`, {
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
        const response = await apiFetch(`/animais`);

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
    status?: "ativo" | "inativo" | "vendido";

    producao_media_diaria: number | null;
    raca?: string | null;
    peso?: number | null;
    descricao?: string | null;

    data_nascimento: string;
    data_ultimo_parto?: string | null;
    dias_descarte_leite?: number | null;

    // 🔥 NOVOS CAMPOS
    prenha: boolean;
    em_cio: boolean;
    abortou: boolean;
    nao_emprenha: boolean;
    mastite: boolean;
    tratamento_mastite?: string | null;
    doente?: boolean;
    doenca?: "mastite" | "outra" | null;
    descricao_doenca?: string | null;

    data_reproducao?: string | null;
    data_base_gestacao?: string | null;
    data_cobertura?: string | null;
    data_inseminacao?: string | null;
    data_confirmacao_prenhez?: string | null;
}) {
    try {
        const response = await apiFetch(`/animais`, {
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
    status?: "ativo" | "inativo" | "vendido";

    producao_media_diaria: number | null;
    raca?: string | null;
    peso?: number | null;
    descricao?: string | null;

    data_nascimento: string;
    data_ultimo_parto?: string | null;
    dias_descarte_leite?: number | null;

    // 🔥 NOVOS CAMPOS
    prenha: boolean;
    em_cio: boolean;
    abortou: boolean;
    nao_emprenha: boolean;
    mastite: boolean;
    tratamento_mastite?: string | null;
    doente?: boolean;
    doenca?: "mastite" | "outra" | null;
    descricao_doenca?: string | null;

    data_reproducao?: string | null;
    data_base_gestacao?: string | null;
    data_cobertura?: string | null;
    data_inseminacao?: string | null;
    data_confirmacao_prenhez?: string | null;
}) {
    try {
        const response = await apiFetch(`/animais/${id}`, {
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
        const response = await apiFetch(`/animais/${id}`, {
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

export async function atualizarStatusAnimal(id: number, status: "ativo" | "inativo" | "vendido") {
    try {
        const response = await apiFetch(`/animais/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });

        if (!response.ok) {
            throw new Error(`Erro ao atualizar status (status ${response.status})`);
        }

        return await response.json();
    } catch (err) {
        console.error("Falha em atualizarStatusAnimal:", err);
        throw new Error("Não foi possível atualizar o status do animal. Verifique a conexão.");
    }
}

// LISTAR COMPRAS
export async function listarCompras(): Promise<Compra[]> {
    const res = await apiFetch(`/compras`);
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
    const res = await apiFetch(`/compras`, {
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
    const res = await apiFetch(`/compras/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Erro ao atualizar status");
    return res.json();
}

// EXCLUIR COMPRA
export async function excluirCompra(id: number) {
    const res = await apiFetch(`/compras/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao excluir compra");
    return res.json();
}

export async function atualizarCompra(id: number, dados: Omit<Compra, "id" | "precoTotal">) {
    const res = await apiFetch(`/compras/${id}`, {
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
    const res = await apiFetch(`/receitas`);

    if (!res.ok) {
        throw new Error("Erro ao listar receitas");
    }

    const dados = await res.json();

    return dados.map((r: any) => ({
        ...r,
        tipoReceita: r.tipoReceita || "leite",
        litros: Number(r.litros),
        precoPorLitro: Number(r.precoPorLitro),
        valorTotal: Number(r.valorTotal),
        animalId: r.animalId === null || r.animalId === undefined ? null : Number(r.animalId),
        animalPeso: r.animalPeso === null || r.animalPeso === undefined ? null : Number(r.animalPeso),
        valorAnimal: r.valorAnimal === null || r.valorAnimal === undefined ? null : Number(r.valorAnimal),
    }));
}

export async function criarReceita(dados: {
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
}) {
    const res = await apiFetch(`/receitas`, {
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
    tipoReceita?: "leite" | "animal";
    data: string;
    litros?: number;
    precoPorLitro?: number;
    valorTotal?: number;
    animalId?: number | null;
    animalNome?: string | null;
    animalIdentificador?: string | null;
    animalPeso?: number | null;
    valorAnimal?: number | null;
    comprador: string;
    observacoes?: string | null;
}) {
    const res = await apiFetch(`/receitas/${id}`, {
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
    const res = await apiFetch(`/receitas/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        throw new Error("Erro ao excluir receita");
    }

    return res.json();
}

export interface PrevisaoReceitaConfirmada {
    id?: number;
    anoMes: string;
    valorEstimado: number;
    valorReal: number;
    ccs?: number | null;
    cbt?: number | null;
    observacoes?: string | null;
    confirmadoEm?: string | null;
}

export async function buscarPrevisaoReceita(anoMes: string): Promise<PrevisaoReceitaConfirmada | null> {
    const res = await apiFetch(`/previsoes-receita/${anoMes}`);

    if (!res.ok) {
        throw new Error("Erro ao buscar previsao de receita");
    }

    const dados = await res.json();
    if (!dados) return null;

    return {
        ...dados,
        valorEstimado: Number(dados.valorEstimado),
        valorReal: Number(dados.valorReal),
        ccs: dados.ccs === null || dados.ccs === undefined ? null : Number(dados.ccs),
        cbt: dados.cbt === null || dados.cbt === undefined ? null : Number(dados.cbt),
    };
}

export async function listarPrevisoesReceita(): Promise<PrevisaoReceitaConfirmada[]> {
    const res = await apiFetch(`/previsoes-receita`);

    if (!res.ok) {
        throw new Error("Erro ao listar previsoes de receita");
    }

    const dados = await res.json();

    return dados.map((item: any) => ({
        ...item,
        valorEstimado: Number(item.valorEstimado),
        valorReal: Number(item.valorReal),
        ccs: item.ccs === null || item.ccs === undefined ? null : Number(item.ccs),
        cbt: item.cbt === null || item.cbt === undefined ? null : Number(item.cbt),
    }));
}

export async function salvarPrevisaoReceita(dados: {
    anoMes: string;
    valorEstimado: number;
    valorReal: number;
    ccs?: number | null;
    cbt?: number | null;
    observacoes?: string | null;
}) {
    const res = await apiFetch(`/previsoes-receita`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });

    if (!res.ok) {
        const erroData = await res.json().catch(() => ({}));
        throw new Error(erroData.erro || "Erro ao salvar previsao de receita");
    }

    const resposta = await res.json();
    return {
        ...resposta,
        valorEstimado: Number(resposta.valorEstimado),
        valorReal: Number(resposta.valorReal),
        ccs: resposta.ccs === null || resposta.ccs === undefined ? null : Number(resposta.ccs),
        cbt: resposta.cbt === null || resposta.cbt === undefined ? null : Number(resposta.cbt),
    };
}

export async function listarFinanciamentos(): Promise<Financiamento[]> {
    const res = await apiFetch(`/financiamentos`);

    if (!res.ok) {
        throw new Error("Erro ao listar financiamentos");
    }

    const dados = await res.json();

    return dados.map((f: any) => ({
        ...f,
        valorTotal: Number(f.valorTotal),
        quantidadeParcelas: Number(f.quantidadeParcelas),
        parcelasPagas: Number(f.parcelasPagas),
        valorQuitacao: f.valorQuitacao === null || f.valorQuitacao === undefined ? null : Number(f.valorQuitacao),
        descontoQuitacao: f.descontoQuitacao === null || f.descontoQuitacao === undefined ? null : Number(f.descontoQuitacao),
    }));
}

export async function criarFinanciamento(dados: {
    nome: string;
    credor?: string | null;
    valorTotal: number;
    quantidadeParcelas: number;
    parcelasPagas: number;
    dataFinanciamento?: string | null;
    dataVencimentoParcela: string;
    observacoes?: string | null;
}) {
    const res = await apiFetch(`/financiamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });

    if (!res.ok) {
        const erroData = await res.json().catch(() => ({}));
        throw new Error(erroData.erro || "Erro ao cadastrar financiamento");
    }

    return res.json();
}

export async function atualizarFinanciamento(id: number, dados: {
    nome: string;
    credor?: string | null;
    valorTotal: number;
    quantidadeParcelas: number;
    parcelasPagas: number;
    dataFinanciamento?: string | null;
    dataVencimentoParcela: string;
    observacoes?: string | null;
}) {
    const res = await apiFetch(`/financiamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });

    if (!res.ok) {
        const erroData = await res.json().catch(() => ({}));
        throw new Error(erroData.erro || "Erro ao atualizar financiamento");
    }

    return res.json();
}

export async function quitarFinanciamento(id: number, dados: {
    valorQuitacao: number;
    descontoQuitacao: number;
    dataQuitacao: string;
}) {
    const res = await apiFetch(`/financiamentos/${id}/quitar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });

    if (!res.ok) {
        const erroData = await res.json().catch(() => ({}));
        throw new Error(erroData.erro || "Erro ao quitar financiamento");
    }

    return res.json();
}

export async function quitarParcelaFinanciamento(id: number, dados: {
    valorPago: number;
    dataPagamento: string;
}) {
    const res = await apiFetch(`/financiamentos/${id}/quitar-parcela`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });

    if (!res.ok) {
        const erroData = await res.json().catch(() => ({}));
        throw new Error(erroData.erro || "Erro ao quitar parcela do financiamento");
    }

    return res.json();
}


// ============================================
// ESTOQUE — TANQUES
// ============================================

export async function listarTanques() {
    const res = await apiFetch(`/estoque/tanques`);
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
    localizacao?: string | null;
    observacoes?: string | null;
}) {
    const res = await apiFetch(`/estoque/tanques`, {
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
    localizacao?: string | null;
    observacoes?: string | null;
}) {
    const res = await apiFetch(`/estoque/tanques/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    if (!res.ok) throw new Error("Erro ao atualizar tanque");
    return res.json();
}

export async function excluirTanque(id: number) {
    const res = await apiFetch(`/estoque/tanques/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Erro ao excluir tanque");
    return res.json();
}

// ============================================
// ESTOQUE — MOVIMENTAÇÕES
// ============================================

export async function listarMovimentacoes() {
    const res = await apiFetch(`/estoque/movimentacoes`);
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
    motivo: string;
    comprador?: string | null;
    temperatura?: number | null;
    consumoProprio?: number;
    observacoes?: string | null;
}) {
    const res = await apiFetch(`/estoque/movimentacoes`, {
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
    motivo: string;
    comprador?: string | null;
    temperatura?: number | null;
    consumoProprio?: number;
    observacoes?: string | null;
}) {
    const res = await apiFetch(`/estoque/movimentacoes/${id}`, {
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
    const res = await apiFetch(`/estoque/movimentacoes/${id}`, { method: "DELETE" });
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
    const res = await apiFetch(`/estoque/racoes`);
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
    const res = await apiFetch(`/estoque/racoes`, {
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
    const res = await apiFetch(`/estoque/racoes/${id}`, {
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
    const res = await apiFetch(`/estoque/racoes/${id}`, { method: "DELETE" });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao excluir racao");
    }
    return res.json();
}

export async function listarMovimentacoesRacao() {
    const res = await apiFetch(`/estoque/racoes/movimentacoes`);
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
    const res = await apiFetch(`/estoque/racoes/movimentacoes`, {
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
    const dados = await res.json();
    if (dados.usuario) await salvarUsuarioLogado(dados.usuario);
    return dados;
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
    const resposta = await res.json();
    return resposta;
}

