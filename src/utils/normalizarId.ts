export function normalizarId(id: string | number | null | undefined): string {
    const limpo = String(id ?? "").trim().toLowerCase();
    if (!limpo) return "";
    // se for SÓ número, remove zeros à esquerda ("002" → "2", "001" → "1", "0" → "0")
    if (/^\d+$/.test(limpo)) {
        return limpo.replace(/^0+/, "") || "0";
    }
    return limpo;
}