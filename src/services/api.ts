const BASE_URL = "http://192.168.32.108:3001/api";

export async function listarProducoes() {
    const response = await fetch(`${BASE_URL}/producao`);
    return response.json();
}
export async function listarProducoesRecentes() {
    const response = await fetch(`${BASE_URL}/producao/recentes`);
    return response.json();
}