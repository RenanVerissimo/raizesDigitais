const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { AnimalValidationError, normalizarDadosAnimal } = require("../utils/animal");

const base = { nome: "", identificador: "T-1", data_nascimento: "2024-02-29", status_reprodutivo: "vacaVazia" };
const saude = {
    parasitas: true, doenca: "parasitas", tipo_parasita: "ambos", data_identificacao: "2026-09-01",
    tratamento_mastite: " Acompanhamento registrado ", data_inicio_tratamento: "2026-09-02", data_fim_tratamento: "2026-09-05",
};

test("normaliza os cinco status e aceita o formato legado com valores 0 e 1", () => {
    for (const [status, ativo] of Object.entries({ vacaVazia: "vaca_vazia", prenha: "prenha", emCio: "em_cio", abortou: "abortou", naoEmprenha: "nao_emprenha" })) {
        const animal = normalizarDadosAnimal({ ...base, status_reprodutivo: status });
        assert.deepEqual(["vaca_vazia", "prenha", "em_cio", "abortou", "nao_emprenha"].filter((campo) => animal[campo]), [ativo]);
    }
    const animal = normalizarDadosAnimal({ ...base, status_reprodutivo: undefined, prenha: "0", em_cio: "1", abortou: 0, nao_emprenha: false, mastite: "0" });
    assert.equal(animal.em_cio, 1);
    assert.equal(animal.vaca_vazia, 0);
    assert.equal(animal.mastite, 0);
    assert.equal(animal.doente, 0);
    assert.equal(animal.nome, "");
    assert.equal(normalizarDadosAnimal({ ...base, status_reprodutivo: undefined, prenha: 0, em_cio: 0, abortou: 0, nao_emprenha: 0 }).vaca_vazia, 1);
});

test("preserva os novos campos de parasitas e normaliza textos e campos condicionais", () => {
    for (const tipo of ["endoparasitas", "ectoparasitas", "ambos"]) {
        const animal = normalizarDadosAnimal({ ...base, ...saude, tipo_parasita: tipo, descricao_doenca: "Rascunho oculto", observacoes_saude: "Rascunho oculto" });
        assert.equal(animal.parasitas, 1);
        assert.equal(animal.doente, 1);
        assert.equal(animal.doenca, "parasitas");
        assert.equal(animal.tipo_parasita, tipo);
        assert.equal(animal.tratamento_mastite, "Acompanhamento registrado");
        assert.equal(animal.data_identificacao, "2026-09-01");
        assert.equal(animal.data_inicio_tratamento, "2026-09-02");
        assert.equal(animal.data_fim_tratamento, "2026-09-05");
        assert.equal(animal.descricao_doenca, null);
        assert.equal(animal.observacoes_saude, null);
    }
    const outra = normalizarDadosAnimal({ ...base, doenca: "outra", descricao_doenca: " Ferimento ", observacoes_saude: " Em acompanhamento " });
    assert.equal(outra.descricao_doenca, "Ferimento");
    assert.equal(outra.observacoes_saude, "Em acompanhamento");
    assert.equal(outra.tipo_parasita, null);
});

test("tratamento é opcional, independente de mastite, e aceita limpeza explícita", () => {
    assert.equal(normalizarDadosAnimal({ ...base, mastite: true }).tratamento_mastite, null);
    assert.equal(normalizarDadosAnimal({ ...base, tratamentoMastite: "Registro anterior" }).tratamento_mastite, "Registro anterior");
    const limpo = normalizarDadosAnimal({ ...base, tipo_parasita: "ambos", data_identificacao: "2026-01-01", observacoes_saude: "Oculto", tratamento_mastite: "   ", data_inicio_tratamento: "", data_fim_tratamento: null });
    for (const campo of ["tipo_parasita", "data_identificacao", "observacoes_saude", "tratamento_mastite", "data_inicio_tratamento", "data_fim_tratamento"]) assert.equal(limpo[campo], null);
});

const invalidos = [
    ["status ausente", { status_reprodutivo: undefined }],
    ["status desconhecido", { status_reprodutivo: "outro" }],
    ["tipo de status inválido", { status_reprodutivo: ["prenha"] }],
    ["mais de um status", { status_reprodutivo: undefined, prenha: 1, em_cio: 1, abortou: 0, nao_emprenha: 0 }],
    ["status contraditório", { status_reprodutivo: "vacaVazia", prenha: 1 }],
    ["vaca vazia contraditória", { status_reprodutivo: "prenha", vaca_vazia: true }],
    ["nenhum dos cinco status", { status_reprodutivo: undefined, vaca_vazia: 0, prenha: 0, em_cio: 0, abortou: 0, nao_emprenha: 0 }],
    ["vaca vazia junto com prenha", { status_reprodutivo: undefined, vaca_vazia: 1, prenha: 1, em_cio: 0, abortou: 0, nao_emprenha: 0 }],
    ["doença desconhecida", { doenca: "desconhecida" }],
    ["condições simultâneas", { mastite: true, ...saude }],
    ["doente sem condição", { doente: true }],
    ["tipo de parasita ausente", { parasitas: true }],
    ["tipo de parasita desconhecido", { parasitas: true, tipo_parasita: "outro" }],
    ["outra doença sem descrição", { doenca: "outra", descricao_doenca: " " }],
    ["tratamento longo", { tratamento_mastite: "a".repeat(256) }],
    ["data impossível", { data_inicio_tratamento: "2026-02-30" }],
    ["ano não bissexto", { mastite: true, data_identificacao: "2025-02-29" }],
    ["formato de data", { data_fim_tratamento: "12/09/2026" }],
    ["fim antes do início", { data_inicio_tratamento: "2026-09-05", data_fim_tratamento: "2026-09-01" }],
];
for (const [nome, dados] of invalidos) test(`rejeita ${nome}`, () => {
    assert.throws(() => normalizarDadosAnimal({ ...base, ...dados }), AnimalValidationError);
});

function criarRotas() {
    const handlers = {}, registros = new Map(), queries = [];
    let proximoId = 1;
    const router = {};
    for (const metodo of ["get", "post", "put", "patch", "delete"]) router[metodo] = (url, handler) => { handlers[metodo + url] = handler; };
    const pool = { async query(sql, valores = []) {
        queries.push({ sql, valores });
        if (sql.includes("INFORMATION_SCHEMA")) return [["doente", "doenca", "descricao_doenca", "tratamento_mastite", "status", "dias_descarte_leite", "data_reproducao", "vaca_vazia", "parasitas", "tipo_parasita", "data_identificacao", "observacoes_saude", "data_inicio_tratamento", "data_fim_tratamento"].map(COLUMN_NAME => ({ COLUMN_NAME }))];
        if (sql.startsWith("INSERT INTO animais")) {
            const colunas = sql.match(/\(([^)]+)\)/)[1].split(", ");
            assert.equal((sql.match(/\?/g) || []).length, valores.length);
            const id = proximoId++;
            registros.set(id, { ...Object.fromEntries(colunas.map((campo, i) => [campo, valores[i]])), id_animal: id });
            return [{ insertId: id }];
        }
        if (sql.startsWith("SELECT *")) {
            const registro = registros.get(Number(valores[0]));
            return [registro?.usuario_id === valores[1] ? [{ ...registro }] : []];
        }
        if (sql.startsWith("UPDATE animais SET")) {
            assert.match(sql, /WHERE id_animal = \? AND usuario_id = \?/);
            assert.equal((sql.match(/\?/g) || []).length, valores.length);
            const registro = registros.get(Number(valores.at(-2)));
            if (!registro || registro.usuario_id !== valores.at(-1)) return [{ affectedRows: 0 }];
            const campos = sql.match(/SET (.+) WHERE/)[1].split(", ").map(campo => campo.split(" = ")[0]);
            campos.forEach((campo, i) => { registro[campo] = valores[i]; });
            return [{ affectedRows: 1 }];
        }
        if (sql.includes("SELECT animais.*")) {
            assert.match(sql, /DATE_FORMAT\(data_identificacao/);
            return [[...registros.values()].filter(registro => registro.usuario_id === valores[0]).map(registro => ({ ...registro, id: registro.id_animal }))];
        }
        throw new Error(`SQL inesperado: ${sql}`);
    } };
    const moduleState = { exports: {} };
    const dependencies = {
        express: { Router: () => router }, "../database/conecction": pool,
        "../utils/animal": { AnimalValidationError, normalizarDadosAnimal },
        "../utils/tenant": { ensureUsuarioColumn: async () => {}, requireUsuario: async (req, res) => {
            if (!req.usuarioId) { res.status(401).json({ erro: "Não autorizado" }); return null; }
            return req.usuarioId;
        } },
    };
    vm.runInNewContext(fs.readFileSync(require.resolve("../routes/animais"), "utf8"), { module: moduleState, console, require: name => dependencies[name] });
    async function chamar(metodo, body = {}, usuarioId = 7, id = 1) {
        const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
        await handlers[metodo]({ body, usuarioId, params: { id } }, res);
        return res;
    }
    return { chamar, queries };
}

test("cadastro, consulta, edição, troca de condição e limpeza dos novos campos", async () => {
    const { chamar } = criarRotas();
    assert.equal((await chamar("post/", { ...base, ...saude })).code, 201);
    let animal = (await chamar("get/")).body[0];
    assert.equal(animal.tipo_parasita, "ambos");
    assert.equal(animal.data_fim_tratamento, "2026-09-05");
    assert.equal((await chamar("put/:id", { nome: "Nome editado" })).code, 200);
    animal = (await chamar("get/")).body[0];
    assert.equal(animal.nome, "Nome editado");
    assert.equal(animal.tipo_parasita, "ambos", "uma atualização parcial preserva os dados de saúde");
    assert.equal((await chamar("put/:id", { parasitas: false, doenca: "outra", descricao_doenca: "Ferimento", observacoes_saude: "Melhorando" })).code, 200);
    animal = (await chamar("get/")).body[0];
    assert.equal(animal.parasitas, 0);
    assert.equal(animal.tipo_parasita, null);
    assert.equal(animal.observacoes_saude, "Melhorando");
    assert.equal((await chamar("put/:id", { doente: false, doenca: null, tratamento_mastite: null, data_inicio_tratamento: null, data_fim_tratamento: null })).code, 200);
    animal = (await chamar("get/")).body[0];
    for (const campo of ["doenca", "tipo_parasita", "descricao_doenca", "data_identificacao", "observacoes_saude", "tratamento_mastite", "data_inicio_tratamento", "data_fim_tratamento"]) assert.equal(animal[campo], null);
});

test("erros retornam 400 sem gravação; acesso permanece restrito ao usuário", async () => {
    const { chamar, queries } = criarRotas();
    assert.equal((await chamar("post/", { ...base, ...saude }, null)).code, 401);
    assert.equal(queries.length, 0);
    assert.equal((await chamar("post/", { ...base, parasitas: true })).code, 400);
    assert.equal(queries.length, 0);
    await chamar("post/", { ...base, ...saude });
    assert.deepEqual((await chamar("get/", {}, 8)).body, []);
    assert.equal((await chamar("put/:id", { nome: "Outro usuário" }, 8)).code, 404);
    assert.equal((await chamar("put/:id", { data_fim_tratamento: "2026-01-01" })).code, 400);
    assert.equal((await chamar("get/")).body[0].data_fim_tratamento, "2026-09-05");
});

test("Vaca Vazia persiste e acompanha a troca de status e a solução de alertas", async () => {
    const { chamar } = criarRotas();
    assert.equal((await chamar("post/", { ...base, vaca_vazia: true })).code, 201);
    assert.equal((await chamar("get/")).body[0].vaca_vazia, 1);
    assert.equal((await chamar("put/:id", { nome: "Edição sem alterar reprodução" })).code, 200);
    assert.equal((await chamar("get/")).body[0].vaca_vazia, 1);

    for (const [status, ativo] of Object.entries({ prenha: "prenha", emCio: "em_cio", abortou: "abortou", naoEmprenha: "nao_emprenha", vacaVazia: "vaca_vazia" })) {
        assert.equal((await chamar("put/:id", { status_reprodutivo: status })).code, 200);
        const animal = (await chamar("get/")).body[0];
        assert.deepEqual(["vaca_vazia", "prenha", "em_cio", "abortou", "nao_emprenha"].filter((campo) => animal[campo]), [ativo]);
    }

    // O cliente antigo não conhece vaca_vazia; o servidor recalcula o indicador.
    assert.equal((await chamar("put/:id", { prenha: true, em_cio: false, abortou: false, nao_emprenha: false, data_confirmacao_prenhez: "2026-09-12" })).code, 200);
    let animal = (await chamar("get/")).body[0];
    assert.equal(animal.vaca_vazia, 0);
    assert.equal(animal.prenha, 1);
    assert.equal((await chamar("put/:id", { prenha: false, em_cio: false, abortou: false, nao_emprenha: false })).code, 200);
    animal = (await chamar("get/")).body[0];
    assert.equal(animal.vaca_vazia, 1);
    assert.equal(animal.data_confirmacao_prenhez, null);
    assert.equal((await chamar("put/:id", { vaca_vazia: true, prenha: true })).code, 400);
    assert.equal((await chamar("get/")).body[0].prenha, 0);
});
