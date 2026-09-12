export const opcoesStatusReprodutivo = [
    { key: "vacaVazia", label: "Vaca Vazia", cor: "#4a90e2", icon: "circle" },
    { key: "prenha", label: "Prenha", cor: "#22c55e", icon: "check-circle" },
    { key: "emCio", label: "Em Cio", cor: "#f59e0b", icon: "alert-circle" },
    { key: "abortou", label: "Abortou", cor: "#ef4444", icon: "x-circle" },
    { key: "naoEmprenha", label: "Não Emprenha", cor: "#6b7280", icon: "slash" },
] as const;

export type StatusReprodutivo = "" | typeof opcoesStatusReprodutivo[number]["key"];

type IndicadoresReprodutivos = {
    prenha?: boolean | number | null;
    em_cio?: boolean | number | null;
    abortou?: boolean | number | null;
    nao_emprenha?: boolean | number | null;
};

export function obterStatusReprodutivo(animal?: IndicadoresReprodutivos): StatusReprodutivo {
    if (!animal) return "";

    const indicadores = [
        { key: "prenha", valor: animal.prenha },
        { key: "emCio", valor: animal.em_cio },
        { key: "abortou", valor: animal.abortou },
        { key: "naoEmprenha", valor: animal.nao_emprenha },
    ] as const;
    const selecionados = indicadores.filter(({ valor }) => Number(valor) === 1);

    // Registros antigos com vários indicadores precisam de uma nova escolha.
    if (selecionados.length > 1) return "";
    if (selecionados.length === 1) return selecionados[0].key;
    if (indicadores.some(({ valor }) => valor == null)) return "";

    // No formato atual da API, Vaca Vazia usa os quatro indicadores desmarcados.
    return "vacaVazia";
}
