const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");
const { requireUsuario } = require("../utils/tenant");

async function ensureAvaliacoesSchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS avaliacoes_app (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            estrelas TINYINT NOT NULL,
            descricao TEXT NOT NULL,
            criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_avaliacoes_app_usuario_id (usuario_id),
            CONSTRAINT chk_avaliacoes_app_estrelas CHECK (estrelas BETWEEN 1 AND 5)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
}

router.post("/", async (req, res) => {
    try {
        await ensureAvaliacoesSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;

        const estrelas = Number(req.body.estrelas);
        const descricao = String(req.body.descricao || "").trim();

        if (!Number.isInteger(estrelas) || estrelas < 1 || estrelas > 5 || !descricao) {
            return res.status(400).json({ erro: "Informe a nota e a descrição da experiência." });
        }

        const [result] = await pool.query(
            "INSERT INTO avaliacoes_app (usuario_id, estrelas, descricao) VALUES (?, ?, ?)",
            [usuarioId, estrelas, descricao]
        );

        res.status(201).json({ id: result.insertId, mensagem: "Avaliação registrada" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao registrar avaliação" });
    }
});

module.exports = router;
