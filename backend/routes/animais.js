const express = require("express");
const router = express.Router();

function normalizarStatusAnimal(status) {
    return ["ativo", "inativo", "vendido"].includes(status) ? status : "ativo";
}
const pool = require("../database/conecction");
const { requireUsuario, ensureUsuarioColumn } = require("../utils/tenant");
const { AnimalValidationError, normalizarDadosAnimal } = require("../utils/animal");

async function ensureAnimaisSchema() {
    await ensureUsuarioColumn("animais");
    const requiredColumns = [
        { name: "doente", sql: "ADD COLUMN doente TINYINT(1) NOT NULL DEFAULT 0 AFTER mastite" },
        { name: "doenca", sql: "ADD COLUMN doenca VARCHAR(40) NULL AFTER doente" },
        { name: "descricao_doenca", sql: "ADD COLUMN descricao_doenca VARCHAR(255) NULL AFTER doenca" },
        { name: "tratamento_mastite", sql: "ADD COLUMN tratamento_mastite VARCHAR(255) NULL AFTER descricao_doenca" },
        { name: "status", sql: "ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ativo' AFTER identificador" },
        { name: "dias_descarte_leite", sql: "ADD COLUMN dias_descarte_leite INT NULL AFTER data_ultimo_parto" },
        { name: "data_reproducao", sql: "ADD COLUMN data_reproducao DATE NULL AFTER data_ultimo_parto" },
        { name: "vaca_vazia", sql: "ADD COLUMN vaca_vazia TINYINT(1) NOT NULL DEFAULT 0 AFTER nao_emprenha" },
        { name: "parasitas", sql: "ADD COLUMN parasitas TINYINT(1) NOT NULL DEFAULT 0" },
        { name: "tipo_parasita", sql: "ADD COLUMN tipo_parasita ENUM('endoparasitas', 'ectoparasitas', 'ambos') NULL" },
        { name: "data_identificacao", sql: "ADD COLUMN data_identificacao DATE NULL" },
        { name: "observacoes_saude", sql: "ADD COLUMN observacoes_saude TEXT NULL" },
        { name: "data_inicio_tratamento", sql: "ADD COLUMN data_inicio_tratamento DATE NULL" },
        { name: "data_fim_tratamento", sql: "ADD COLUMN data_fim_tratamento DATE NULL" },
    ];

    const [columns] = await pool.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'animais'
    `);

    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

    for (const column of requiredColumns) {
        if (!existingColumns.has(column.name)) {
            await pool.query(`ALTER TABLE animais ${column.sql}`);
            if (column.name === "vaca_vazia") {
                await pool.query(`
                    UPDATE animais SET vaca_vazia = 1
                    WHERE id_animal > 0 AND vaca_vazia = 0
                      AND prenha = 0 AND em_cio = 0 AND abortou = 0 AND nao_emprenha = 0
                `);
            }
        }
    }
}

// LISTAR TODOS
router.get("/", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        await ensureAnimaisSchema();
        const [rows] = await pool.query(`
            SELECT animais.*, id_animal AS id,
                DATE_FORMAT(data_identificacao, '%Y-%m-%d') AS data_identificacao,
                DATE_FORMAT(data_inicio_tratamento, '%Y-%m-%d') AS data_inicio_tratamento,
                DATE_FORMAT(data_fim_tratamento, '%Y-%m-%d') AS data_fim_tratamento
            FROM animais WHERE usuario_id = ? ORDER BY criado_em DESC
        `, [usuarioId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar animais" });
    }
});

router.post("/", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        const dados = normalizarDadosAnimal(req.body || {});
        await ensureAnimaisSchema();
        // As colunas vêm da lista fixa de campos normalizados, nunca do cliente.
        const colunas = ["usuario_id", ...Object.keys(dados)];
        const valores = [usuarioId, ...Object.values(dados)];
        const [result] = await pool.query(
            `INSERT INTO animais (${colunas.join(", ")}) VALUES (${colunas.map(() => "?").join(", ")})`,
            valores
        );
        res.status(201).json({ id: result.insertId, id_animal: result.insertId, mensagem: "Animal cadastrado" });
    } catch (err) {
        if (err instanceof AnimalValidationError) return res.status(400).json({ erro: err.message });
        console.error(err);
        res.status(500).json({ erro: "Erro ao cadastrar animal" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        await ensureAnimaisSchema();
        const [animais] = await pool.query(
            "SELECT * FROM animais WHERE id_animal = ? AND usuario_id = ? LIMIT 1",
            [req.params.id, usuarioId]
        );
        if (!animais.length) return res.status(404).json({ erro: "Animal não encontrado" });

        // Campos omitidos por clientes antigos ou pela solução de alertas são preservados.
        const alteracoes = req.body || {};
        const body = { ...animais[0], ...alteracoes };
        const indicadoresLegados = ["prenha", "em_cio", "abortou", "nao_emprenha"];
        if (alteracoes.status_reprodutivo !== undefined) {
            for (const campo of ["vaca_vazia", ...indicadoresLegados]) body[campo] = alteracoes[campo];
        } else if (alteracoes.vaca_vazia === undefined && indicadoresLegados.some((campo) => alteracoes[campo] !== undefined)) {
            // A solução de alertas e clientes antigos ainda enviam só os quatro indicadores.
            body.vaca_vazia = undefined;
        }
        if (alteracoes.tratamento_mastite === undefined && alteracoes.tratamentoMastite !== undefined) {
            body.tratamento_mastite = alteracoes.tratamentoMastite;
        }
        const dados = normalizarDadosAnimal(body);
        const [result] = await pool.query(
            `UPDATE animais SET ${Object.keys(dados).map((coluna) => coluna + " = ?").join(", ")} WHERE id_animal = ? AND usuario_id = ?`,
            [...Object.values(dados), req.params.id, usuarioId]
        );
        if (!result.affectedRows) return res.status(404).json({ erro: "Animal não encontrado" });
        res.json({ mensagem: "Animal atualizado" });
    } catch (err) {
        if (err instanceof AnimalValidationError) return res.status(400).json({ erro: err.message });
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar animal" });
    }
});

router.patch("/:id/status", async (req, res) => {
    try {
        await ensureAnimaisSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;

        const status = normalizarStatusAnimal(req.body.status);
        const [result] = await pool.query(
            "UPDATE animais SET status = ? WHERE id_animal = ? AND usuario_id = ?",
            [status, req.params.id, usuarioId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Animal não encontrado" });
        }

        res.json({ mensagem: "Status do animal atualizado", status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar status do animal" });
    }
});
// EXCLUIR
router.delete("/:id", async (req, res) => {
    try {
        await ensureAnimaisSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        const [result] = await pool.query("DELETE FROM animais WHERE id_animal = ? AND usuario_id = ?", [req.params.id, usuarioId]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Animal não encontrado" });
        res.json({ mensagem: "Animal excluído" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir animal" });
    }
});

module.exports = router;
