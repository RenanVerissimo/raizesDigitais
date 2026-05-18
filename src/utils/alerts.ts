export function calcularDias(data: string) {
    const hoje = inicioDoDia(new Date());
    const d = inicioDoDia(parseDataLocal(data));
    const diff = d.getTime() - hoje.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calcularDataParto(dataCobertura?: string | null) {
    if (!dataCobertura) return null;

    const data = parseDataLocal(dataCobertura);
    data.setDate(data.getDate() + 283);

    return data;
}

export function calcularDataSecagem(dataCobertura?: string | null) {
    const parto = calcularDataParto(dataCobertura);
    if (!parto) return null;

    const secagem = new Date(parto);
    secagem.setDate(secagem.getDate() - 60);
    return secagem;
}

function inicioDoDia(data: Date) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function parseDataLocal(data: string) {
    const limpa = data.slice(0, 10);
    const [ano, mes, dia] = limpa.split("-").map(Number);

    if (ano && mes && dia) {
        return new Date(ano, mes - 1, dia);
    }

    return new Date(data);
}
