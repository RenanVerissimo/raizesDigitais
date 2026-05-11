const express = require("express");
const pool = require("../database/conecction");
const { requireUsuario } = require("../utils/tenant");

const router = express.Router();

router.get("/recentes", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res, ["producao"]);
        if (!usuarioId) return;
        const [rows] = await pool.query("SELECT * FROM producao WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 3", [usuarioId]);
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
        const [rows] = await pool.query("SELECT * FROM producao WHERE usuario_id = ? ORDER BY criado_em DESC", [usuarioId]);
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
        const { date, morningProduction, afternoonProduction, quality, notes } = req.body;
        const total = Number(morningProduction) + Number(afternoonProduction);

        const [result] = await pool.query(
            "INSERT INTO producao (usuario_id, data, producao_manha, producao_tarde, producao_total, qualidade, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [usuarioId, date, morningProduction, afternoonProduction, total, quality, notes]
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
        const { date, morningProduction, afternoonProduction, quality, notes } = req.body;
        const total = Number(morningProduction) + Number(afternoonProduction);
        await pool.query(
            "UPDATE producao SET data=?, producao_manha=?, producao_tarde=?, producao_total=?, qualidade=?, observacoes=? WHERE id=? AND usuario_id=?",
            [date, morningProduction, afternoonProduction, total, quality, notes, id, usuarioId]
        );
        res.json({ message: "Produção atualizada!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar produção" });
    }
});

module.exports = router;
