const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { normalizarDadosAnimal } = require("../backend/utils/animal");

function carregarTypeScript(arquivo) {
    const moduleState = { exports: {} };
    const codigo = ts.transpileModule(fs.readFileSync(arquivo, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInNewContext(codigo, {
        exports: moduleState.exports, module: moduleState,
        require: (nome) => carregarTypeScript(path.resolve(path.dirname(arquivo), nome + ".ts")),
    });
    return moduleState.exports;
}
const { carregarSaudeAnimal, prepararSaudeAnimal } = carregarTypeScript(path.resolve(__dirname, "../src/utils/saudeAnimal.ts"));
const { obterStatusReprodutivo } = carregarTypeScript(path.resolve(__dirname, "../src/utils/statusReprodutivo.ts"));
const base = { nome: "Teste", identificador: "1", data_nascimento: "2024-01-01", status_reprodutivo: "vacaVazia" };

for (const tipoParasita of ["endoparasitas", "ectoparasitas", "ambos"]) {
    test(`cadastro e reabertura de ${tipoParasita} preservam os campos e as datas`, () => {
        const form = { ...carregarSaudeAnimal(), parasitas: true, tipoParasita, dataIdentificacao: "01/09/2026", tratamento: "Cuidados registrados", dataInicioTratamento: "02/09/2026", dataFimTratamento: "05/09/2026" };
        const enviado = prepararSaudeAnimal(form);
        const banco = normalizarDadosAnimal({ ...base, ...enviado });
        const reaberto = carregarSaudeAnimal(banco);
        assert.equal(reaberto.parasitas, true);
        assert.equal(reaberto.tipoParasita, tipoParasita);
        assert.equal(reaberto.dataIdentificacao, "01/09/2026");
        assert.equal(reaberto.dataInicioTratamento, "02/09/2026");
        assert.equal(reaberto.dataFimTratamento, "05/09/2026");
        assert.deepEqual(prepararSaudeAnimal(reaberto), enviado);
    });
}

test("outra condição salva observações e trocar de condição limpa somente campos ocultos", () => {
    const form = { ...carregarSaudeAnimal(), outraDoenca: true, descricaoDoenca: " Ferimento ", observacoesSaude: " Evoluindo bem ", tratamento: "Acompanhamento", dataIdentificacao: "29/02/2024" };
    const banco = normalizarDadosAnimal({ ...base, ...prepararSaudeAnimal(form) });
    const reaberto = carregarSaudeAnimal(banco);
    assert.equal(reaberto.descricaoDoenca, "Ferimento");
    assert.equal(reaberto.observacoesSaude, "Evoluindo bem");
    const mastite = prepararSaudeAnimal({ ...reaberto, outraDoenca: false, mastite: true });
    assert.equal(mastite.descricao_doenca, null);
    assert.equal(mastite.observacoes_saude, null);
    assert.equal(mastite.tratamento_mastite, "Acompanhamento");
    const limpo = prepararSaudeAnimal({ ...reaberto, outraDoenca: false, tratamento: "", dataInicioTratamento: "", dataFimTratamento: "" });
    for (const campo of ["doenca", "descricao_doenca", "observacoes_saude", "data_identificacao", "tratamento_mastite", "data_inicio_tratamento", "data_fim_tratamento"]) assert.equal(limpo[campo], null);
});

test("dados antigos sem novos campos continuam editáveis", () => {
    const form = carregarSaudeAnimal({ ...base, mastite: 1, tratamento_mastite: "Registro anterior" });
    assert.equal(form.mastite, true);
    assert.equal(form.tratamento, "Registro anterior");
    assert.equal(form.dataIdentificacao, "");
    assert.equal(prepararSaudeAnimal(form).data_inicio_tratamento, null);
});

test("formulário bloqueia entradas inválidas antes de enviar à API", () => {
    const form = carregarSaudeAnimal();
    assert.throws(() => prepararSaudeAnimal({ ...form, parasitas: true }), /tipo de parasita/);
    assert.throws(() => prepararSaudeAnimal({ ...form, outraDoenca: true }), /condição/);
    assert.throws(() => prepararSaudeAnimal({ ...form, dataInicioTratamento: "31/02/2026" }), /data válida/);
    assert.throws(() => prepararSaudeAnimal({ ...form, dataInicioTratamento: "12/09/2026", dataFimTratamento: "11/09/2026" }), /anterior/);
    assert.throws(() => prepararSaudeAnimal({ ...form, tratamento: "a".repeat(256) }), /255/);
});

test("edição carrega os cinco status salvos, incluindo a coluna Vaca Vazia", () => {
    for (const status of ["vacaVazia", "prenha", "emCio", "abortou", "naoEmprenha"]) {
        const salvo = normalizarDadosAnimal({ ...base, status_reprodutivo: status });
        assert.equal(obterStatusReprodutivo(salvo), status);
        assert.equal(salvo.vaca_vazia, status === "vacaVazia" ? 1 : 0);
    }
});

test("status legado é reconhecido e indicadores ausentes ou conflitantes pedem seleção", () => {
    const antigos = { prenha: 0, em_cio: 0, abortou: 0, nao_emprenha: 0 };
    assert.equal(obterStatusReprodutivo(antigos), "vacaVazia");
    assert.equal(obterStatusReprodutivo({ ...antigos, vaca_vazia: 1 }), "vacaVazia");
    assert.equal(obterStatusReprodutivo({ ...antigos, vaca_vazia: 0 }), "");
    assert.equal(obterStatusReprodutivo({ ...antigos, vaca_vazia: 1, prenha: 1 }), "");
    assert.equal(obterStatusReprodutivo({ ...antigos, prenha: null }), "");
});
