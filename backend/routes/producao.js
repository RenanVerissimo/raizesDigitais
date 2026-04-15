const express = require("express");
const pool = require("../database/conecction");

const router = express.Router();

router.get("/recentes", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM producao ORDER BY data DESC LIMIT 3");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar produções recentes" });
    }
});

router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM producao ORDER BY data DESC");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar produções" });
    }
});

router.post("/", async (req, res) => {
    try {
        const { date, morningProduction, afternoonProduction, quality, notes } = req.body;
        const total = morningProduction + afternoonProduction;
        const [result] = await pool.query(
            "INSERT INTO producao (data, producao_manha, producao_tarde, producao_total, qualidade, observacoes) VALUES (?, ?, ?, ?, ?, ?)",
            [date, morningProduction, afternoonProduction, total, quality, notes]
        );
        res.status(201).json({ id: result.insertId, message: "Produção registrada!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao registrar produção" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM producao WHERE id = ?", [req.params.id]);
        res.json({ message: "Registro excluído" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao excluir" });
    }
});

module.exports = router;