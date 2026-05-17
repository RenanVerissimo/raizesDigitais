const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");
const { requireUsuario, ensureUsuarioColumn } = require("../utils/tenant");

async function ensureFinanciamentosSchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS financiamentos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NULL,
            nome VARCHAR(120) NOT NULL,
            credor VARCHAR(120) NULL,
            valor_total DECIMAL(12,2) NOT NULL,
            quantidade_parcelas INT NOT NULL,
            parcelas_pagas INT NOT NULL DEFAULT 0,
            data_financiamento DATE NULL,
            data_vencimento_parcela DATE NOT NULL,
            observacoes TEXT NULL,
            status ENUM('ativo', 'quitado', 'cancelado') NOT NULL DEFAULT 'ativo',
            criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
    await ensureUsuarioColumn("financiamentos");

    const [columns] = await pool.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'financiamentos'
    `);
    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

    if (!existingColumns.has("valor_quitacao")) {
        await pool.query("ALTER TABLE financiamentos ADD COLUMN valor_quitacao DECIMAL(12,2) NULL AFTER status");
    }

    if (!existingColumns.has("desconto_quitacao")) {
        await pool.query("ALTER TABLE financiamentos ADD COLUMN desconto_quitacao DECIMAL(12,2) NULL AFTER valor_quitacao");
    }

    if (!existingColumns.has("data_quitacao")) {
        await pool.query("ALTER TABLE financiamentos ADD COLUMN data_quitacao DATE NULL AFTER desconto_quitacao");
    }
}

function prepararFinanciamento(body) {
    const nome = String(body.nome || "").trim();
    const credor = body.credor ? String(body.credor).trim() : null;
    const valorTotal = Number(body.valorTotal);
    const quantidadeParcelas = Number(body.quantidadeParcelas);
    const parcelasPagas = Number(body.parcelasPagas || 0);
    const dataFinanciamento = body.dataFinanciamento || null;
    const dataVencimentoParcela = body.dataVencimentoParcela || null;
    const observacoes = body.observacoes ? String(body.observacoes).trim() : null;

    if (!nome || !valorTotal || valorTotal <= 0 || !quantidadeParcelas || quantidadeParcelas <= 0 || !dataVencimentoParcela) {
        const erro = new Error("Preencha todos os campos obrigatorios");
        erro.status = 400;
        throw erro;
    }

    if (parcelasPagas < 0 || parcelasPagas > quantidadeParcelas) {
        const erro = new Error("Parcelas pagas invalidas");
        erro.status = 400;
        throw erro;
    }

    return {
        nome,
        credor,
        valorTotal,
        quantidadeParcelas,
        parcelasPagas,
        dataFinanciamento,
        dataVencimentoParcela,
        observacoes,
    };
}

router.get("/", async (req, res) => {
    try {
        await ensureFinanciamentosSchema();
        const usuarioId = await requireUsuario(req, res, ["financiamentos"]);
        if (!usuarioId) return;

        const [rows] = await pool.query(`
            SELECT
                id,
                nome,
                credor,
                valor_total AS valorTotal,
                quantidade_parcelas AS quantidadeParcelas,
                parcelas_pagas AS parcelasPagas,
                DATE_FORMAT(data_financiamento, '%Y-%m-%d') AS dataFinanciamento,
                DATE_FORMAT(data_vencimento_parcela, '%Y-%m-%d') AS dataVencimentoParcela,
                observacoes,
                status,
                valor_quitacao AS valorQuitacao,
                desconto_quitacao AS descontoQuitacao,
                DATE_FORMAT(data_quitacao, '%Y-%m-%d') AS dataQuitacao
            FROM financiamentos
            WHERE usuario_id = ?
            ORDER BY criado_em DESC, id DESC
        `, [usuarioId]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar financiamentos" });
    }
});

router.post("/", async (req, res) => {
    try {
        await ensureFinanciamentosSchema();
        const usuarioId = await requireUsuario(req, res, ["financiamentos"]);
        if (!usuarioId) return;

        const financiamento = prepararFinanciamento(req.body);

        const [result] = await pool.query(
            `INSERT INTO financiamentos
             (usuario_id, nome, credor, valor_total, quantidade_parcelas, parcelas_pagas, data_financiamento, data_vencimento_parcela, observacoes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo')`,
            [
                usuarioId,
                financiamento.nome,
                financiamento.credor,
                financiamento.valorTotal,
                financiamento.quantidadeParcelas,
                financiamento.parcelasPagas,
                financiamento.dataFinanciamento,
                financiamento.dataVencimentoParcela,
                financiamento.observacoes,
            ]
        );

        res.status(201).json({ id: result.insertId, status: "ativo", ...financiamento });
    } catch (err) {
        console.error(err);
        res.status(err.status || 500).json({ erro: err.message || "Erro ao cadastrar financiamento" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        await ensureFinanciamentosSchema();
        const usuarioId = await requireUsuario(req, res, ["financiamentos"]);
        if (!usuarioId) return;

        const id = Number(req.params.id);
        const financiamento = prepararFinanciamento(req.body);

        const [existentes] = await pool.query(
            "SELECT id FROM financiamentos WHERE id = ? AND usuario_id = ?",
            [id, usuarioId]
        );

        if (!existentes.length) {
            return res.status(404).json({ erro: "Financiamento nao encontrado" });
        }

        await pool.query(
            `UPDATE financiamentos
             SET nome = ?,
                 credor = ?,
                 valor_total = ?,
                 quantidade_parcelas = ?,
                 parcelas_pagas = ?,
                 data_financiamento = ?,
                 data_vencimento_parcela = ?,
                 observacoes = ?
             WHERE id = ? AND usuario_id = ?`,
            [
                financiamento.nome,
                financiamento.credor,
                financiamento.valorTotal,
                financiamento.quantidadeParcelas,
                financiamento.parcelasPagas,
                financiamento.dataFinanciamento,
                financiamento.dataVencimentoParcela,
                financiamento.observacoes,
                id,
                usuarioId,
            ]
        );

        res.json({ id, ...financiamento });
    } catch (err) {
        console.error(err);
        res.status(err.status || 500).json({ erro: err.message || "Erro ao atualizar financiamento" });
    }
});

router.patch("/:id/quitar", async (req, res) => {
    try {
        await ensureFinanciamentosSchema();
        const usuarioId = await requireUsuario(req, res, ["financiamentos"]);
        if (!usuarioId) return;

        const id = Number(req.params.id);
        const valorQuitacao = Number(req.body.valorQuitacao);
        const descontoQuitacao = Number(req.body.descontoQuitacao || 0);
        const dataQuitacao = req.body.dataQuitacao || new Date().toISOString().slice(0, 10);

        if (!id || !valorQuitacao || valorQuitacao <= 0 || descontoQuitacao < 0) {
            return res.status(400).json({ erro: "Dados de quitacao invalidos" });
        }

        const [financiamentos] = await pool.query(
            "SELECT id, quantidade_parcelas FROM financiamentos WHERE id = ? AND usuario_id = ?",
            [id, usuarioId]
        );

        if (!financiamentos.length) {
            return res.status(404).json({ erro: "Financiamento nao encontrado" });
        }

        await pool.query(
            `UPDATE financiamentos
             SET status = 'quitado',
                 parcelas_pagas = quantidade_parcelas,
                 valor_quitacao = ?,
                 desconto_quitacao = ?,
                 data_quitacao = ?
             WHERE id = ? AND usuario_id = ?`,
            [valorQuitacao, descontoQuitacao, dataQuitacao, id, usuarioId]
        );

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao quitar financiamento" });
    }
});

module.exports = router;
