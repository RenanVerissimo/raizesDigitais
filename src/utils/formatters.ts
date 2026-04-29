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

export function formatarData2(iso: string | null | undefined): string {
    if (!iso) return "-";
    const data = iso.substring(0, 10); // "2025-08-20"
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

export function toIso(br: string): string | null {
    const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    return `${m[3]}-${m[2]}-${m[1]}`;
}

export function toBr(iso: string | null | undefined): string {
    if (!iso) return "";
    const d = iso.substring(0, 10);
    const [ano, mes, dia] = d.split("-");
    if (!ano || !mes || !dia) return "";
    return `${dia}/${mes}/${ano}`;
}