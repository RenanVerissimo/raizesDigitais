const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");

// LISTAR TODOS
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM animais ORDER BY criado_em DESC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar animais" });
    }
});

// CRIAR
router.post("/", async (req, res) => {
    try {
        const {
            nome, identificador, producao_media_diaria,
            raca, peso, descricao, data_nascimento, data_ultimo_parto
        } = req.body;

        if (!nome || !identificador) {
            return res.status(400).json({ erro: "Nome e identificador são obrigatórios" });
        }
        if (!data_nascimento) {
            return res.status(400).json({ erro: "A data de nascimento é obrigatória" });
        }

        const [result] = await pool.query(
            `INSERT INTO animais 
             (nome, identificador, producao_media_diaria, raca, peso, descricao, data_nascimento, data_ultimo_parto)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome,
                identificador,
                producao_media_diaria ?? null,
                raca || null,
                peso ?? null,
                descricao || null,
                data_nascimento,
                data_ultimo_parto || null,
            ]
        );

        res.status(201).json({ id: result.insertId, mensagem: "Animal cadastrado" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao cadastrar animal" });
    }
});

// ATUALIZAR
router.put("/:id", async (req, res) => {
    try {
        const {
            nome, identificador, producao_media_diaria,
            raca, peso, descricao, data_nascimento, data_ultimo_parto
        } = req.body;

        if (!data_nascimento) {
            return res.status(400).json({ erro: "A data de nascimento é obrigatória" });
        }

        const [result] = await pool.query(
            `UPDATE animais 
             SET nome = ?, identificador = ?, producao_media_diaria = ?,
                 raca = ?, peso = ?, descricao = ?,
                 data_nascimento = ?, data_ultimo_parto = ?
             WHERE id = ?`,
            [
                nome,
                identificador,
                producao_media_diaria ?? null,
                raca || null,
                peso ?? null,
                descricao || null,
                data_nascimento,
                data_ultimo_parto || null,
                req.params.id,
            ]
        );

        if (result.affectedRows === 0) return res.status(404).json({ erro: "Animal não encontrado" });
        res.json({ mensagem: "Animal atualizado" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar animal" });
    }
});

// EXCLUIR
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM animais WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Animal não encontrado" });
        res.json({ mensagem: "Animal excluído" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir animal" });
    }
});

module.exports = router;