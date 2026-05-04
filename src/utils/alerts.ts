export function calcularDias(data: string) {
    const hoje = new Date();
    const d = new Date(data);
    const diff = d.getTime() - hoje.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calcularDataParto(dataCobertura?: string | null) {
    if (!dataCobertura) return null;

    const data = new Date(dataCobertura);
    data.setDate(data.getDate() + 283);

    return data;
}