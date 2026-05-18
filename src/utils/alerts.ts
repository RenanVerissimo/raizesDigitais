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

export function calcularFimDescarteLeite(dataUltimoParto?: string | null, diasDescarte?: number | string | null) {
    if (!dataUltimoParto || diasDescarte === null || diasDescarte === undefined || diasDescarte === "") return null;

    const dias = Number(diasDescarte);
    if (!Number.isFinite(dias) || dias <= 0) return null;

    const fimDescarte = parseDataLocal(dataUltimoParto);
    fimDescarte.setDate(fimDescarte.getDate() + Math.floor(dias));
    return fimDescarte;
}

export function calcularAvisoDescarteLeite(dataUltimoParto?: string | null, diasDescarte?: number | string | null) {
    const fimDescarte = calcularFimDescarteLeite(dataUltimoParto, diasDescarte);
    if (!fimDescarte) return null;

    const diasRestantes = calcularDias(fimDescarte.toISOString());
    if (diasRestantes < 0) return null;

    return {
        fimDescarte,
        diasRestantes,
        texto: diasRestantes === 0
            ? "Leite em descarte ate hoje: atencao a antibiotico/terapia de vaca seca"
            : `Leite em descarte por mais ${diasRestantes} dia(s): atencao a antibiotico/terapia de vaca seca`,
    };
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
