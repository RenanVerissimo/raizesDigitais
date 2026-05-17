const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");
const { requireUsuario, ensureUsuarioColumn } = require("../utils/tenant");

async function ensurePrevisoesReceitaSchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS previsoes_receita (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NULL,
            ano_mes CHAR(7) NOT NULL,
            valor_estimado DECIMAL(12,2) NOT NULL,
            valor_real DECIMAL(12,2) NOT NULL,
            ccs INT NULL,
            cbt INT NULL,
            observacoes TEXT NULL,
            confirmado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_previsao_usuario_mes (usuario_id, ano_mes)
        )
    `);
    await ensureColumn("previsoes_receita", "ccs", "INT NULL");
    await ensureColumn("previsoes_receita", "cbt", "INT NULL");
    await ensureUsuarioColumn("previsoes_receita");
}

async function ensureColumn(tableName, columnName, definition) {
    const [columns] = await pool.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);
    if (columns.length === 0) {
        await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    }
}

router.get("/", async (req, res) => {
    try {
        await ensurePrevisoesReceitaSchema();
        const usuarioId = await requireUsuario(req, res, ["previsoes_receita"]);
        if (!usuarioId) return;

        const [rows] = await pool.query(`
            SELECT
                id,
                ano_mes AS anoMes,
                valor_estimado AS valorEstimado,
                valor_real AS valorReal,
                ccs,
                cbt,
                observacoes,
                DATE_FORMAT(confirmado_em, '%Y-%m-%d') AS confirmadoEm
            FROM previsoes_receita
            WHERE usuario_id = ?
            ORDER BY ano_mes DESC
        `, [usuarioId]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar previsoes de receita" });
    }
});

router.get("/:anoMes", async (req, res) => {
    try {
        await ensurePrevisoesReceitaSchema();
        const usuarioId = await requireUsuario(req, res, ["previsoes_receita"]);
        if (!usuarioId) return;

        const [rows] = await pool.query(`
            SELECT
                id,
                ano_mes AS anoMes,
                valor_estimado AS valorEstimado,
                valor_real AS valorReal,
                ccs,
                cbt,
                observacoes,
                DATE_FORMAT(confirmado_em, '%Y-%m-%d') AS confirmadoEm
            FROM previsoes_receita
            WHERE usuario_id = ? AND ano_mes = ?
            LIMIT 1
        `, [usuarioId, req.params.anoMes]);

        res.json(rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao buscar previsao de receita" });
    }
});

router.post("/", async (req, res) => {
    try {
        await ensurePrevisoesReceitaSchema();
        const usuarioId = await requireUsuario(req, res, ["previsoes_receita"]);
        if (!usuarioId) return;

        const anoMes = String(req.body.anoMes || "").trim();
        const valorEstimado = Number(req.body.valorEstimado);
        const valorReal = Number(req.body.valorReal);
        const ccs = req.body.ccs === null || req.body.ccs === undefined || req.body.ccs === "" ? null : Number(req.body.ccs);
        const cbt = req.body.cbt === null || req.body.cbt === undefined || req.body.cbt === "" ? null : Number(req.body.cbt);
        const observacoes = req.body.observacoes ? String(req.body.observacoes).trim() : null;

        if (
            !/^\d{4}-\d{2}$/.test(anoMes) ||
            Number.isNaN(valorEstimado) ||
            Number.isNaN(valorReal) ||
            valorEstimado < 0 ||
            valorReal < 0 ||
            (ccs !== null && (Number.isNaN(ccs) || ccs < 0)) ||
            (cbt !== null && (Number.isNaN(cbt) || cbt < 0))
        ) {
            return res.status(400).json({ erro: "Dados da previsao invalidos" });
        }

        await pool.query(`
            INSERT INTO previsoes_receita (usuario_id, ano_mes, valor_estimado, valor_real, ccs, cbt, observacoes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                valor_estimado = VALUES(valor_estimado),
                valor_real = VALUES(valor_real),
                ccs = VALUES(ccs),
                cbt = VALUES(cbt),
                observacoes = VALUES(observacoes),
                confirmado_em = CURRENT_TIMESTAMP
        `, [usuarioId, anoMes, valorEstimado, valorReal, ccs, cbt, observacoes]);

        res.status(201).json({ anoMes, valorEstimado, valorReal, ccs, cbt, observacoes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao salvar previsao de receita" });
    }
});

module.exports = router;
