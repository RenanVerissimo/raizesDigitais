import { Animal } from "../interfaces/interfaces";

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

export async function listarAnimais(): Promise<Animal[]> {
    try {
        const response = await fetch(`${BASE_URL}/animais`);
        if (!response.ok) throw new Error(`Erro ao listar animais (status ${response.status})`);
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
    peso?: number | null;                  // ← NOVO
    descricao?: string | null;
    data_nascimento: string;               // ← AGORA OBRIGATÓRIO
    data_ultimo_parto?: string | null;
}) {
    try {
        const response = await fetch(`${BASE_URL}/animais`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        });
        if (!response.ok) throw new Error(`Erro ao cadastrar (status ${response.status})`);
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
    peso?: number | null;                  // ← NOVO
    descricao?: string | null;
    data_nascimento: string;               // ← AGORA OBRIGATÓRIO
    data_ultimo_parto?: string | null;
}) {
    try {
        const response = await fetch(`${BASE_URL}/animais/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        });
        if (!response.ok) throw new Error(`Erro ao atualizar (status ${response.status})`);
        return await response.json();
    } catch (err) {
        console.error("Falha em atualizarAnimal:", err);
        throw new Error("Não foi possível atualizar o animal. Verifique a conexão.");
    }
}

export async function excluirAnimal(id: number) {
    try {
        const response = await fetch(`${BASE_URL}/animais/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error(`Erro ao excluir (status ${response.status})`);
        return await response.json();
    } catch (err) {
        console.error("Falha em excluirAnimal:", err);
        throw new Error("Não foi possível excluir o animal. Verifique a conexão.");
    }
}