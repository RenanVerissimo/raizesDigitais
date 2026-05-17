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
            observacoes TEXT NULL,
            confirmado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_previsao_usuario_mes (usuario_id, ano_mes)
        )
    `);
    await ensureUsuarioColumn("previsoes_receita");
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
        const observacoes = req.body.observacoes ? String(req.body.observacoes).trim() : null;

        if (!/^\d{4}-\d{2}$/.test(anoMes) || Number.isNaN(valorEstimado) || Number.isNaN(valorReal) || valorEstimado < 0 || valorReal < 0) {
            return res.status(400).json({ erro: "Dados da previsao invalidos" });
        }

        await pool.query(`
            INSERT INTO previsoes_receita (usuario_id, ano_mes, valor_estimado, valor_real, observacoes)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                valor_estimado = VALUES(valor_estimado),
                valor_real = VALUES(valor_real),
                observacoes = VALUES(observacoes),
                confirmado_em = CURRENT_TIMESTAMP
        `, [usuarioId, anoMes, valorEstimado, valorReal, observacoes]);

        res.status(201).json({ anoMes, valorEstimado, valorReal, observacoes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao salvar previsao de receita" });
    }
});

module.exports = router;
