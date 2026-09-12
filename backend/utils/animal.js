class AnimalValidationError extends Error {}

function invalido(mensagem) {
    throw new AnimalValidationError(mensagem);
}

function booleano(valor, campo) {
    if (valor === true || valor === 1 || valor === "1") return true;
    if (valor == null || valor === false || valor === 0 || valor === "0") return false;
    return invalido(`Valor inválido para ${campo}.`);
}

function texto(valor, campo, limite) {
    if (valor == null) return null;
    if (typeof valor !== "string") return invalido(`Informe um texto válido para ${campo}.`);
    const resultado = valor.trim();
    if (limite && [...resultado].length > limite) return invalido(`${campo} deve ter no máximo ${limite} caracteres.`);
    return resultado || null;
}

function dataISO(valor, campo, obrigatoria = false) {
    if (valor == null || valor === "") {
        if (obrigatoria) return invalido(`Informe ${campo}.`);
        return null;
    }
    // mysql2 retorna DATE como Date ao carregar um registro para atualização.
    if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
        valor = `${valor.getFullYear()}-${String(valor.getMonth() + 1).padStart(2, "0")}-${String(valor.getDate()).padStart(2, "0")}`;
    }
    if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return invalido(`Informe uma data válida para ${campo} (AAAA-MM-DD).`);
    const [ano, mes, dia] = valor.split("-").map(Number);
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    if (ano < 1000 || ano > 9999 || data.getUTCFullYear() !== ano || data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia) {
        return invalido(`Informe uma data válida para ${campo}.`);
    }
    return valor;
}

function normalizarReproducao(body) {
    const camposLegados = ["prenha", "em_cio", "abortou", "nao_emprenha"];
    const campos = ["vaca_vazia", ...camposLegados];
    const status = {
        vacaVazia: "vaca_vazia", prenha: "prenha", emCio: "em_cio", abortou: "abortou", naoEmprenha: "nao_emprenha",
    };
    if (body.status_reprodutivo !== undefined) {
        if (typeof body.status_reprodutivo !== "string" || !Object.hasOwn(status, body.status_reprodutivo)) return invalido("Selecione um status reprodutivo válido.");
        const campoAtivo = status[body.status_reprodutivo];
        for (const campo of campos) {
            if (body[campo] != null && booleano(body[campo], campo) !== (campo === campoAtivo)) {
                return invalido("Informe apenas um status reprodutivo, coerente com os indicadores enviados.");
            }
        }
        return Object.fromEntries(campos.map((campo) => [campo, campo === campoAtivo ? 1 : 0]));
    }
    // Compatibilidade com clientes que enviam os quatro indicadores existentes.
    if (camposLegados.some((campo) => body[campo] == null)) return invalido("Selecione o status reprodutivo do animal.");
    const resultado = Object.fromEntries(campos.map((campo) => [campo, booleano(body[campo], campo) ? 1 : 0]));
    const selecionados = Object.values(resultado).filter(Boolean).length;
    if (selecionados > 1) return invalido("Selecione apenas um status reprodutivo.");
    if (!selecionados) {
        // Clientes antigos representam Vaca Vazia pelos quatro indicadores zerados.
        if (body.vaca_vazia != null) return invalido("Selecione o status reprodutivo do animal.");
        resultado.vaca_vazia = 1;
    }
    return resultado;
}

function normalizarDadosAnimal(body) {
    const reproducao = normalizarReproducao(body);
    const doenca = texto(body.doenca, "doença");
    if (doenca && !["mastite", "parasitas", "outra"].includes(doenca)) return invalido("Selecione uma doença ou condição válida.");
    const mastite = booleano(body.mastite, "mastite") || doenca === "mastite";
    const parasitas = booleano(body.parasitas, "parasitas") || doenca === "parasitas";
    const outra = doenca === "outra";
    const quantidadeCondicoes = [mastite, parasitas, outra].filter(Boolean).length;
    if (quantidadeCondicoes > 1) return invalido("Selecione apenas uma doença ou condição de saúde.");
    if (booleano(body.doente, "doente") && !quantidadeCondicoes) return invalido("Informe qual doença ou condição foi identificada.");

    const tipoParasita = parasitas ? texto(body.tipo_parasita, "tipo de parasita") : null;
    if (parasitas && !["endoparasitas", "ectoparasitas", "ambos"].includes(tipoParasita)) {
        return invalido("Selecione o tipo de parasita: endoparasitas, ectoparasitas ou ambos.");
    }
    const descricaoDoenca = outra ? texto(body.descricao_doenca, "Descrição da doença", 255) : null;
    if (outra && !descricaoDoenca) return invalido("Informe qual doença ou condição de saúde foi identificada.");
    const observacoes = outra ? texto(body.observacoes_saude, "observações de saúde") : null;
    if (observacoes && Buffer.byteLength(observacoes, "utf8") > 65535) return invalido("As observações de saúde excedem o tamanho permitido.");
    const inicio = dataISO(body.data_inicio_tratamento, "início do tratamento");
    const fim = dataISO(body.data_fim_tratamento, "fim do tratamento");
    if (inicio && fim && fim < inicio) return invalido("A data de fim do tratamento não pode ser anterior à data de início.");

    return {
        nome: texto(body.nome, "nome") || "",
        identificador: texto(body.identificador, "identificador") || "",
        status: ["ativo", "inativo", "vendido"].includes(body.status) ? body.status : "ativo",
        producao_media_diaria: body.producao_media_diaria ?? null,
        raca: body.raca || null,
        peso: body.peso ?? null,
        descricao: body.descricao || null,
        data_nascimento: dataISO(body.data_nascimento, "a data de nascimento", true),
        data_ultimo_parto: dataISO(body.data_ultimo_parto, "último parto"),
        dias_descarte_leite: body.dias_descarte_leite == null || body.dias_descarte_leite === "" ? null : Number(body.dias_descarte_leite),
        ...reproducao,
        mastite: mastite ? 1 : 0,
        // Mantém a coluna existente para o tratamento de qualquer condição.
        tratamento_mastite: texto(body.tratamento_mastite === undefined ? body.tratamentoMastite : body.tratamento_mastite, "Tipo de tratamento", 255),
        doente: quantidadeCondicoes ? 1 : 0,
        doenca: mastite ? "mastite" : parasitas ? "parasitas" : outra ? "outra" : null,
        descricao_doenca: descricaoDoenca,
        parasitas: parasitas ? 1 : 0,
        tipo_parasita: tipoParasita,
        data_identificacao: quantidadeCondicoes ? dataISO(body.data_identificacao, "identificação") : null,
        observacoes_saude: observacoes,
        data_inicio_tratamento: inicio,
        data_fim_tratamento: fim,
        data_reproducao: dataISO(body.data_reproducao, "reprodução"),
        data_inseminacao: dataISO(body.data_inseminacao, "inseminação"),
        data_confirmacao_prenhez: reproducao.prenha ? dataISO(body.data_confirmacao_prenhez, "confirmação da prenhez") : null,
    };
}

module.exports = { AnimalValidationError, normalizarDadosAnimal };
