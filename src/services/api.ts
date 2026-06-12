import AsyncStorage from "@react-native-async-storage/async-storage";
import { Animal, Compra, Financiamento, Receita, StatusCompra } from "../interfaces/interfaces";
import { API_URL } from "../config";

const BASE_URL = API_URL;

console.log("BASE_URL:", BASE_URL);


const USUARIO_STORAGE_KEY = "@raizes_digitais_usuario";
let usuarioLogadoMemoria: UsuarioLogado | null = null;
const REQUEST_TIMEOUT_MS = 60000;
const NETWORK_RETRY_DELAYS_MS = [1500, 3500, 7000];
const NETWORK_ERROR_MESSAGE = "Conexão instável. Verifique a internet e tente novamente.";

type ApiFetchInit = RequestInit & {
    retryUnsafe?: boolean;
    silentNetworkError?: boolean;
    timeoutMs?: number;
    omitUsuarioHeader?: boolean;
};

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function gerarIdempotencyKey(prefixo: string) {
    return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isNetworkError(error: unknown) {
    const errorName = typeof error === "object" && error !== null && "name" in error
        ? String((error as { name?: unknown }).name)
        : "";
    const errorText = String(error);

    return (
        error instanceof TypeError ||
        errorName === "AbortError" ||
        errorText.includes("Network request failed") ||
        errorText.includes("AbortError") ||
        errorText.includes("Aborted")
    );
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...init,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }
}



export interface UsuarioLogado {
    id: number;
    nome: string;
    email: string;
    telefone?: string | null;
    nome_fazenda?: string | null;
}

export async function getUsuarioLogado() {
    try {
        const raw = await AsyncStorage.getItem(USUARIO_STORAGE_KEY);
        if (raw) {
            usuarioLogadoMemoria = JSON.parse(raw) as UsuarioLogado;
            return usuarioLogadoMemoria;
        }
    } catch (error) {
        console.warn("Não foi possível ler o usuário salvo:", error);
    }

    return usuarioLogadoMemoria;
}

export async function salvarUsuarioLogado(usuario: UsuarioLogado) {
    usuarioLogadoMemoria = usuario;

    try {
        await AsyncStorage.setItem(USUARIO_STORAGE_KEY, JSON.stringify(usuario));
    } catch (error) {
        console.warn("Não foi possível salvar o usuário no armazenamento local:", error);
    }
}

export async function limparUsuarioLogado() {
    usuarioLogadoMemoria = null;

    try {
        await AsyncStorage.removeItem(USUARIO_STORAGE_KEY);
    } catch (error) {
        console.warn("Não foi possível limpar o usuário salvo:", error);
    }
}

async function apiFetch(path: string, init: ApiFetchInit = {}) {
    const { retryUnsafe = false, silentNetworkError = false, timeoutMs, omitUsuarioHeader = false, ...fetchInit } = init;
    const usuario = omitUsuarioHeader ? null : await getUsuarioLogado();
    const headers = {
        ...(fetchInit.headers || {}),
        ...(usuario?.id ? { "x-usuario-id": String(usuario.id) } : {}),
    };
    const url = `${BASE_URL}${path}`;
    const method = String(fetchInit.method || "GET").toUpperCase();
    const canRetry = method === "GET" || method === "HEAD" || retryUnsafe;
    const maxAttempts = canRetry ? NETWORK_RETRY_DELAYS_MS.length + 1 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fetchWithTimeout(url, { ...fetchInit, headers }, timeoutMs);
        } catch (error) {
            const shouldRetry = canRetry && isNetworkError(error) && attempt < maxAttempts - 1;

            if (!shouldRetry) {
                if (!silentNetworkError) {
                    console.error("Falha de rede na API:", {
                        url,
                        method,
                        erro: error,
                    });
                }
                if (isNetworkError(error)) {
                    throw new Error(NETWORK_ERROR_MESSAGE);
                }
                throw error;
            }

            await delay(NETWORK_RETRY_DELAYS_MS[attempt]);
        }
    }

    throw new Error(NETWORK_ERROR_MESSAGE);
}

export async function listarProducoes(options?: { silentNetworkError?: boolean }) {
    const response = await apiFetch("/producao", {
        silentNetworkError: options?.silentNetworkError,
    });
    return response.json();
}
export async function listarProducoesRecentes() {
    const response = await apiFetch("/producao/recentes");
    return response.json();
}

export async function criarProducao(dados: {
    date: string;
    dailyProduction: number;
    tanqueId: number;
    notes: string | null;
}) {
    const response = await apiFetch(`/producao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
        silentNetworkError: true,
        timeoutMs: 90000,
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
    tanqueId: number;
    notes: string | null;
}) {
    const response = await apiFetch(`/producao/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
        silentNetworkError: true,
        timeoutMs: 90000,
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
        throw new Error(err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE);
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
        throw new Error(err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE);
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
        throw new Error(err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE);
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
        throw new Error(err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE);
    }
}

export async function atualizarStatusAnimal(id: number, status: "ativo" | "inativo" | "vendido") {
    try {
        const response = await apiFetch(`/animais/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
            retryUnsafe: true,
            silentNetworkError: true,
            timeoutMs: 90000,
        });

        if (!response.ok) {
            const erroData = await response.json().catch(() => ({}));
            throw new Error(erroData.erro || `Erro ao atualizar status (status ${response.status})`);
        }

        return await response.json();
    } catch (err) {
        if (!(err instanceof Error && err.message === NETWORK_ERROR_MESSAGE)) {
            console.error("Falha em atualizarStatusAnimal:", err);
        }
        throw new Error(err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE);
    }
}

function compraCorresponde(dados: Omit<Compra, "id" | "precoTotal">, compra: Compra) {
    const valorIgual = (a?: number | null, b?: number | null) => Math.abs(Number(a || 0) - Number(b || 0)) <= 0.01;
    const texto = (valor?: string | null) => String(valor || "").trim();

    if (compra.categoria !== dados.categoria) return false;
    if (texto(compra.item) !== texto(dados.item)) return false;
    if (!valorIgual(compra.quantidade, dados.quantidade)) return false;
    if (!valorIgual(compra.precoUnitario, dados.precoUnitario)) return false;
    if (texto(compra.fornecedor) !== texto(dados.fornecedor)) return false;
    if (String(compra.data).slice(0, 10) !== dados.data) return false;
    if (compra.status !== dados.status) return false;

    if (dados.categoria === "racao") {
        if ((compra.tipoRacao || null) !== (dados.tipoRacao || null)) return false;
        if ((compra.unidadeCompra || null) !== (dados.unidadeCompra || null)) return false;
        if (!valorIgual(compra.pesoPorUnidadeKg, dados.pesoPorUnidadeKg)) return false;
        if (!valorIgual(compra.quantidadeEstoqueKg, dados.quantidadeEstoqueKg)) return false;
    }

    if (dados.categoria === "medicamento") {
        if ((compra.finalidadeTratamento || null) !== (dados.finalidadeTratamento || null)) return false;
        if (texto(compra.finalidadeDescricao) !== texto(dados.finalidadeDescricao)) return false;
    }

    return texto(compra.observacoes) === texto(dados.observacoes);
}

// LISTAR COMPRAS
export async function listarCompras(options?: { silentNetworkError?: boolean }): Promise<Compra[]> {
    const res = await apiFetch(`/compras`, {
        silentNetworkError: options?.silentNetworkError,
        timeoutMs: 90000,
    });
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
    const idempotencyKey = gerarIdempotencyKey("compra");

    try {
        const res = await apiFetch(`/compras`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-idempotency-key": idempotencyKey,
            },
            body: JSON.stringify({ ...dados, idempotencyKey }),
            silentNetworkError: true,
            timeoutMs: 120000,
        });
        if (!res.ok) {
            const erroData = await res.json().catch(() => ({}));
            throw new Error(erroData.erro || `Erro ao cadastrar compra (status ${res.status})`);
        }
        return res.json();
    } catch (err) {
        if (err instanceof Error && err.message === NETWORK_ERROR_MESSAGE) {
            const compras = await listarCompras({ silentNetworkError: true }).catch(() => []);
            const compraConfirmada = compras.find((compra) => compraCorresponde(dados, compra));
            if (compraConfirmada) return compraConfirmada;

            return {
                mensagem: "Compra cadastrada",
                confirmadoPorResposta: false,
            };
        }

        throw new Error(err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE);
    }
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


export async function listarReceitas(options?: { silentNetworkError?: boolean }): Promise<Receita[]> {
    const res = await apiFetch(`/receitas`, {
        silentNetworkError: options?.silentNetworkError,
        timeoutMs: 90000,
    });

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

type CriarReceitaDados = {
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

function receitaCorresponde(dados: CriarReceitaDados, receita: Receita) {
    const tipo = dados.tipoReceita || "leite";
    const comprador = String(dados.comprador || "").trim();
    const observacoes = dados.observacoes || null;
    const valorTotalEsperado = tipo === "animal"
        ? Number(dados.valorAnimal || 0)
        : Number(dados.litros || 0) * Number(dados.precoPorLitro || 0);

    if ((receita.tipoReceita || "leite") !== tipo) return false;
    if (receita.data !== dados.data) return false;
    if (String(receita.comprador || "").trim() !== comprador) return false;
    if ((receita.observacoes || null) !== observacoes) return false;
    if (Math.abs(Number(receita.valorTotal || 0) - valorTotalEsperado) > 0.01) return false;

    if (tipo === "animal") {
        if ((dados.animalId ?? null) !== null) return receita.animalId === Number(dados.animalId);
        return String(receita.animalNome || "").trim() === String(dados.animalNome || "").trim();
    }

    return (
        Math.abs(Number(receita.litros || 0) - Number(dados.litros || 0)) <= 0.01 &&
        Math.abs(Number(receita.precoPorLitro || 0) - Number(dados.precoPorLitro || 0)) <= 0.01
    );
}

export async function criarReceita(dados: CriarReceitaDados) {
    const idempotencyKey = gerarIdempotencyKey("receita");

    try {
        const res = await apiFetch(`/receitas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-idempotency-key": idempotencyKey,
            },
            body: JSON.stringify({ ...dados, idempotencyKey }),
            silentNetworkError: true,
            timeoutMs: 120000,
        });

        if (!res.ok) {
            const erroData = await res.json().catch(() => ({}));
            throw new Error(erroData.erro || "Erro ao cadastrar receita");
        }

        return res.json();
    } catch (err) {
        if (err instanceof Error && err.message === NETWORK_ERROR_MESSAGE) {
            const receitas = await listarReceitas({ silentNetworkError: true }).catch(() => []);
            const receitaConfirmada = receitas.find((receita) => receitaCorresponde(dados, receita));
            if (receitaConfirmada) return receitaConfirmada;
        }

        throw new Error(err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE);
    }
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
    try {
        const res = await apiFetch(`/receitas/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
            silentNetworkError: true,
            timeoutMs: 120000,
        });

        if (!res.ok) {
            const erroData = await res.json().catch(() => ({}));
            throw new Error(erroData.erro || "Erro ao atualizar receita");
        }

        return res.json();
    } catch (err) {
        if (err instanceof Error && err.message === NETWORK_ERROR_MESSAGE) {
            const receitas = await listarReceitas({ silentNetworkError: true }).catch(() => []);
            const receitaAtualizada = receitas.find((receita) => receita.id === id && receitaCorresponde(dados, receita));
            if (receitaAtualizada) return receitaAtualizada;

            return {
                id,
                mensagem: "Receita atualizada",
                confirmadoPorResposta: false,
            };
        }

        throw new Error(err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE);
    }
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

export async function listarFinanciamentos(options?: { silentNetworkError?: boolean }): Promise<Financiamento[]> {
    const res = await apiFetch(`/financiamentos`, {
        silentNetworkError: options?.silentNetworkError,
    });

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
    try {
        const res = await apiFetch(`/financiamentos/${id}/quitar`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
            retryUnsafe: true,
            silentNetworkError: true,
            timeoutMs: 90000,
        });

        if (!res.ok) {
            const erroData = await res.json().catch(() => ({}));
            throw new Error(erroData.erro || "Erro ao quitar financiamento");
        }

        return res.json();
    } catch (err) {
        if (err instanceof Error && err.message === NETWORK_ERROR_MESSAGE) {
            const financiamentos = await listarFinanciamentos({ silentNetworkError: true }).catch(() => []);
            const financiamentoConfirmado = financiamentos.find((item) => item.id === id && item.status === "quitado");
            if (financiamentoConfirmado) return { ok: true, confirmadoPorConsulta: true };
        }

        throw new Error(err instanceof Error ? err.message : NETWORK_ERROR_MESSAGE);
    }
}

export async function quitarParcelaFinanciamento(id: number, dados: {
    valorPago: number;
    dataPagamento: string;
}) {
    const res = await apiFetch(`/financiamentos/${id}/quitar-parcela`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
        silentNetworkError: true,
        timeoutMs: 90000,
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

export async function listarTanques(options?: { silentNetworkError?: boolean }) {
    const res = await apiFetch(`/estoque/tanques`, {
        silentNetworkError: options?.silentNetworkError,
    });
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
        silentNetworkError: true,
        timeoutMs: 90000,
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
    try {
        const res = await apiFetch(`/estoque/tanques/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
            silentNetworkError: true,
            timeoutMs: 120000,
        });
        if (!res.ok) throw new Error("Erro ao atualizar tanque");
        return res.json();
    } catch (err) {
        if (err instanceof Error && err.message === NETWORK_ERROR_MESSAGE) {
            const tanques = await listarTanques({ silentNetworkError: true }).catch(() => []);
            const tanqueAtualizado = tanques.find((tanque: any) => (
                Number(tanque.id) === id &&
                String(tanque.nome || "").trim() === String(dados.nome || "").trim() &&
                Math.abs(Number(tanque.capacidade || 0) - Number(dados.capacidade || 0)) <= 0.01 &&
                Math.abs(Number(tanque.volumeAtual || 0) - Number(dados.volumeAtual || 0)) <= 0.01 &&
                String(tanque.localizacao || "").trim() === String(dados.localizacao || "").trim() &&
                String(tanque.observacoes || "").trim() === String(dados.observacoes || "").trim()
            ));

            if (tanqueAtualizado) return tanqueAtualizado;

            return {
                id,
                mensagem: "Tanque atualizado",
                confirmadoPorResposta: false,
            };
        }

        throw err;
    }
}

export async function excluirTanque(id: number) {
    const res = await apiFetch(`/estoque/tanques/${id}`, {
        method: "DELETE",
        silentNetworkError: true,
        timeoutMs: 90000,
    });
    if (!res.ok) throw new Error("Erro ao excluir tanque");
    return res.json();
}

// ============================================
// ESTOQUE — MOVIMENTAÇÕES
// ============================================

export async function listarMovimentacoes(options?: { silentNetworkError?: boolean }) {
    const res = await apiFetch(`/estoque/movimentacoes`, {
        silentNetworkError: options?.silentNetworkError,
    });
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
        silentNetworkError: true,
        timeoutMs: 90000,
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
        silentNetworkError: true,
        timeoutMs: 90000,
    });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao atualizar movimentação");
    }
    return res.json();
}

export async function excluirMovimentacao(id: number) {
    const res = await apiFetch(`/estoque/movimentacoes/${id}`, {
        method: "DELETE",
        silentNetworkError: true,
        timeoutMs: 90000,
    });
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
    const res = await apiFetch(`/estoque/racoes/movimentacoes`, {
        silentNetworkError: true,
        timeoutMs: 90000,
    });
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
    const idempotencyKey = gerarIdempotencyKey("mov-racao");

    try {
        const res = await apiFetch(`/estoque/racoes/movimentacoes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-idempotency-key": idempotencyKey,
            },
            body: JSON.stringify({ ...dados, idempotencyKey }),
            silentNetworkError: true,
            timeoutMs: 120000,
        });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.erro || "Erro ao movimentar racao");
        }
        return res.json();
    } catch (err) {
        if (err instanceof Error && err.message === NETWORK_ERROR_MESSAGE) {
            const movimentacoes = await listarMovimentacoesRacao().catch(() => []);
            const confirmada = movimentacoes.find((mov: any) => {
                return (
                    Number(mov.racaoId) === Number(dados.racaoId) &&
                    mov.tipo === dados.tipo &&
                    Number(mov.quantidade) === Number(dados.quantidade) &&
                    mov.data === dados.data &&
                    String(mov.motivo || "") === String(dados.motivo || "") &&
                    (mov.destino || null) === (dados.destino || null)
                );
            });

            if (confirmada) return confirmada;

            return {
                mensagem: "Movimentacao de racao registrada",
                confirmadoPorResposta: false,
            };
        }

        throw err;
    }
}

// ============================================
// AUTH
// ============================================

export async function login(email: string, senha: string) {
    let res: Response;

    try {
        res = await apiFetch(`/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            body: [
                `email=${encodeURIComponent(email)}`,
                `senha=${encodeURIComponent(senha)}`,
            ].join("&"),
            retryUnsafe: true,
            silentNetworkError: true,
            omitUsuarioHeader: true,
            timeoutMs: 120000,
        });
    } catch (err) {
        if (!(err instanceof Error && err.message === NETWORK_ERROR_MESSAGE)) {
            throw err;
        }

        res = await apiFetch(`/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha }),
            retryUnsafe: true,
            silentNetworkError: true,
            omitUsuarioHeader: true,
            timeoutMs: 120000,
        });
    }

    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao realizar login");
    }
    const dados = await res.json();
    if (!dados.usuario) {
        throw new Error("Resposta de login inválida. Tente novamente.");
    }
    await salvarUsuarioLogado(dados.usuario);
    return dados;
}

export async function cadastrar(dados: {
    nome: string;
    email: string;
    cpf_rg: string;
    telefone?: string;
    nome_fazenda?: string;
    senha: string;
    confirmar_senha: string;
}) {
    const res = await apiFetch(`/auth/cadastrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
        retryUnsafe: true,
        omitUsuarioHeader: true,
        timeoutMs: 120000,
    });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Erro ao cadastrar");
    }
    const resposta = await res.json();
    return resposta;
}

export async function verificarCpfRecuperacao(cpf_rg: string) {
    const res = await apiFetch(`/auth/verificar-cpf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf_rg }),
        retryUnsafe: true,
        omitUsuarioHeader: true,
        timeoutMs: 120000,
    });
    if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error(erro.erro || "Recurso de recuperação de senha ainda não está publicado no servidor");
    }
    return res.json();
}

export async function redefinirSenhaPorCpf(dados: {
    cpf_rg: string;
    senha: string;
    confirmar_senha: string;
}) {
    try {
        const res = await apiFetch(`/auth/redefinir-senha`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
            retryUnsafe: true,
            silentNetworkError: true,
            omitUsuarioHeader: true,
            timeoutMs: 120000,
        });
        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.erro || "Erro ao redefinir senha");
        }
        return res.json();
    } catch (err) {
        if (err instanceof Error && err.message === NETWORK_ERROR_MESSAGE) {
            return {
                mensagem: "Senha redefinida com sucesso",
                confirmadoPorResposta: false,
            };
        }

        throw err;
    }
}

