const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");

// CADASTRAR
router.post("/cadastrar", async (req, res) => {
    try {
        const { nome, email, telefone, nome_fazenda, senha, confirmar_senha } = req.body;

        if (!nome || !email || !senha) {
            return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios" });
        }

        if (senha !== confirmar_senha) {
            return res.status(400).json({ erro: "As senhas não coincidem" });
        }

        // Verifica se email já existe
        const [existente] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
        if (existente.length > 0) {
            return res.status(400).json({ erro: "Este e-mail já está cadastrado" });
        }

        const [result] = await pool.query(
            `INSERT INTO usuarios (nome, email, telefone, nome_fazenda, senha)
             VALUES (?, ?, ?, ?, ?)`,
            [nome, email, telefone || null, nome_fazenda || null, senha]
        );

        res.status(201).json({
            id: result.insertId,
            nome,
            email,
            telefone: telefone || null,
            nome_fazenda: nome_fazenda || null,
            mensagem: "Usuário cadastrado com sucesso",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao cadastrar usuário" });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ erro: "E-mail e senha são obrigatórios" });
        }

        const [rows] = await pool.query(
            "SELECT id, nome, email, telefone, nome_fazenda FROM usuarios WHERE email = ? AND senha = ?",
            [email, senha]
        );

        if (rows.length === 0) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos" });
        }

        res.json({
            usuario: rows[0],
            mensagem: "Login realizado com sucesso",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao realizar login" });
    }
});

module.exports = router;