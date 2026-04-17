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