/**
 * Calcula a idade exata de um animal a partir da data de nascimento.
 * Sempre certinho — sem precisar atualizar nada no banco.
 *
 * Exemplos:
 *  "Hoje"
 *  "15 dias"
 *  "8 meses"
 *  "1 ano"
 *  "2 anos"
 *  "2 anos e 3 meses"
 */
export function calcularIdade(dataNascimento: string | null | undefined): string {
    if (!dataNascimento) return "—";

    // Aceita "AAAA-MM-DD" ou ISO completo "AAAA-MM-DDTHH:mm:ss.sssZ"
    const dataStr = dataNascimento.substring(0, 10);
    const [ano, mes, dia] = dataStr.split("-").map(Number);
    if (!ano || !mes || !dia) return "—";

    const nascimento = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (nascimento > hoje) return "—"; // data no futuro

    let anos = hoje.getFullYear() - nascimento.getFullYear();
    let meses = hoje.getMonth() - nascimento.getMonth();
    let dias = hoje.getDate() - nascimento.getDate();

    // Ajusta se ainda não fez aniversário do dia este mês
    if (dias < 0) {
        meses--;
        // pega quantos dias tinha o mês anterior
        const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();
        dias += ultimoDiaMesAnterior;
    }

    // Ajusta se ainda não fez aniversário do mês este ano
    if (meses < 0) {
        anos--;
        meses += 12;
    }

    // Total de dias (pra casos < 1 mês)
    const diffMs = hoje.getTime() - nascimento.getTime();
    const totalDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (totalDias === 0) return "Hoje";
    if (anos === 0 && meses === 0) {
        return totalDias === 1 ? "1 dia" : `${totalDias} dias`;
    }
    if (anos === 0) {
        return meses === 1 ? "1 mês" : `${meses} meses`;
    }
    if (meses === 0) {
        return anos === 1 ? "1 ano" : `${anos} anos`;
    }
    const txtAnos = anos === 1 ? "1 ano" : `${anos} anos`;
    const txtMeses = meses === 1 ? "1 mês" : `${meses} meses`;
    return `${txtAnos} e ${txtMeses}`;
}