export function formatarData(data: string, completa: boolean = true): string {
    const d = new Date(data);
    if (isNaN(d.getTime())) return data;

    if (completa) {
        return d.toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    }

    return d.toLocaleDateString("pt-BR");
}