import type { Animal } from "../interfaces/interfaces";
import type { SaudeAnimalForm } from "../components/AnimalHealthSection";
import { toBr, toIso } from "./formatters";

export function carregarSaudeAnimal(animal?: Animal): SaudeAnimalForm {
    return {
        mastite: Number(animal?.mastite) === 1 || animal?.doenca === "mastite",
        parasitas: Number(animal?.parasitas) === 1 || animal?.doenca === "parasitas",
        outraDoenca: animal?.doenca === "outra",
        tipoParasita: animal?.tipo_parasita ?? "",
        descricaoDoenca: animal?.descricao_doenca ?? "",
        dataIdentificacao: toBr(animal?.data_identificacao),
        observacoesSaude: animal?.observacoes_saude ?? "",
        tratamento: animal?.tratamento_mastite ?? "",
        dataInicioTratamento: toBr(animal?.data_inicio_tratamento),
        dataFimTratamento: toBr(animal?.data_fim_tratamento),
    };
}

function converterData(valor: string, campo: string): string | null {
    if (!valor.trim()) return null;
    const iso = toIso(valor.trim());
    if (iso) {
        const [ano, mes, dia] = iso.split("-").map(Number);
        const data = new Date(Date.UTC(ano, mes - 1, dia));
        if (ano >= 1000 && data.getUTCFullYear() === ano && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia) return iso;
    }
    throw new Error(`Informe uma data válida para ${campo} (DD/MM/AAAA).`);
}

export function prepararSaudeAnimal(form: SaudeAnimalForm) {
    if ([form.mastite, form.parasitas, form.outraDoenca].filter(Boolean).length > 1) {
        throw new Error("Selecione apenas uma doença ou condição de saúde.");
    }
    const doenca: Animal["doenca"] = form.mastite ? "mastite" : form.parasitas ? "parasitas" : form.outraDoenca ? "outra" : null;
    if (form.parasitas && !["endoparasitas", "ectoparasitas", "ambos"].includes(form.tipoParasita)) {
        throw new Error("Selecione o tipo de parasita: endoparasitas, ectoparasitas ou ambos.");
    }
    const descricao = form.outraDoenca ? form.descricaoDoenca.trim() : null;
    if (form.outraDoenca && !descricao) throw new Error("Informe qual doença ou condição de saúde foi identificada.");
    if (descricao && [...descricao].length > 255) throw new Error("A descrição da doença deve ter no máximo 255 caracteres.");
    const tratamento = form.tratamento.trim();
    if ([...tratamento].length > 255) throw new Error("O tipo de tratamento deve ter no máximo 255 caracteres.");
    const inicio = converterData(form.dataInicioTratamento, "início do tratamento");
    const fim = converterData(form.dataFimTratamento, "fim do tratamento");
    if (inicio && fim && fim < inicio) throw new Error("A data de fim do tratamento não pode ser anterior à data de início.");

    return {
        mastite: form.mastite,
        parasitas: form.parasitas,
        doente: Boolean(doenca),
        doenca,
        descricao_doenca: descricao || null,
        tipo_parasita: form.parasitas && form.tipoParasita ? form.tipoParasita : null,
        data_identificacao: doenca ? converterData(form.dataIdentificacao, "identificação") : null,
        observacoes_saude: form.outraDoenca ? form.observacoesSaude.trim() || null : null,
        tratamento_mastite: tratamento || null,
        data_inicio_tratamento: inicio,
        data_fim_tratamento: fim,
    };
}
