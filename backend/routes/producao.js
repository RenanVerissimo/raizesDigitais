const express = require("express");
const pool = require("../database/conecction");
const { requireUsuario } = require("../utils/tenant");

const router = express.Router();

const SELECT_PRODUCAO = `
    SELECT
        id,
        usuario_id,
        DATE_FORMAT(data, '%Y-%m-%d') AS data,
        producao_diaria,
        qualidade,
        observacoes,
        criado_em
    FROM producao
`;

router.get("/recentes", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res, ["producao"]);
        if (!usuarioId) return;
        const [rows] = await pool.query(`${SELECT_PRODUCAO} WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 3`, [usuarioId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar produções recentes" });
    }
});

router.get("/", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res, ["producao"]);
        if (!usuarioId) return;
        const [rows] = await pool.query(`${SELECT_PRODUCAO} WHERE usuario_id = ? ORDER BY criado_em DESC`, [usuarioId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar produções" });
    }
});

router.post("/", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res, ["producao"]);
        if (!usuarioId) return;
        const { date, dailyProduction, quality = "good", notes } = req.body;
        const total = Number(dailyProduction);

        const [result] = await pool.query(
            "INSERT INTO producao (usuario_id, data, producao_diaria, qualidade, observacoes) VALUES (?, ?, ?, ?, ?)",
            [usuarioId, date, total, quality, notes]
        );

        res.status(201).json({ id: result.insertId, message: "Produção registrada!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao registrar produção" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res, ["producao"]);
        if (!usuarioId) return;
        await pool.query("DELETE FROM producao WHERE id = ? AND usuario_id = ?", [req.params.id, usuarioId]);
        res.json({ message: "Registro excluído" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao excluir" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res, ["producao"]);
        if (!usuarioId) return;
        const { id } = req.params;
        const { date, dailyProduction, quality = "good", notes } = req.body;
        const total = Number(dailyProduction);
        await pool.query(
            "UPDATE producao SET data=?, producao_diaria=?, qualidade=?, observacoes=? WHERE id=? AND usuario_id=?",
            [date, total, quality, notes, id, usuarioId]
        );
        res.json({ message: "Produção atualizada!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar produção" });
    }
});

module.exports = router;
