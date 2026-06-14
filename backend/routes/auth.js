const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require("../database/conecction");

const SALT_ROUNDS = 10;

function somenteNumeros(valor) {
    return String(valor || "").replace(/\D/g, "");
}

async function ensureUsuariosSchema() {
    const [columns] = await pool.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'usuarios'
    `);
    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

    if (!existingColumns.has("cpf_rg")) {
        await pool.query("ALTER TABLE usuarios ADD COLUMN cpf_rg VARCHAR(20) NULL AFTER email");
    }

    if (existingColumns.has("senha")) {
        await pool.query("ALTER TABLE usuarios MODIFY COLUMN senha VARCHAR(255) NOT NULL");
    }
}

// CADASTRAR
router.post("/cadastrar", async (req, res) => {
    try {
        await ensureUsuariosSchema();
        const body = req.body || {};
        const { nome, email, telefone, nome_fazenda, senha, confirmar_senha } = body;
        const cpfRg = somenteNumeros(body.cpf_rg);
        const senhaCadastro = String(senha || "");

        if (!nome || !email || !cpfRg || !senhaCadastro) {
            return res.status(400).json({ erro: "Nome, e-mail, CPF/RG e senha são obrigatórios" });
        }

        if (senhaCadastro !== String(confirmar_senha || "")) {
            return res.status(400).json({ erro: "As senhas não coincidem" });
        }

        if (senhaCadastro.length < 6) {
            return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres" });
        }

        // Verifica se email já existe
        const [existente] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
        if (existente.length > 0) {
            return res.status(400).json({ erro: "Este e-mail já está cadastrado" });
        }

        const [documentoExistente] = await pool.query("SELECT id FROM usuarios WHERE cpf_rg = ?", [cpfRg]);
        if (documentoExistente.length > 0) {
            return res.status(400).json({ erro: "Este CPF/RG já está cadastrado" });
        }

        const senhaHash = await bcrypt.hash(senhaCadastro, SALT_ROUNDS);

        const [result] = await pool.query(
            `INSERT INTO usuarios (nome, email, cpf_rg, telefone, nome_fazenda, senha)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, email, cpfRg, telefone || null, nome_fazenda || null, senhaHash]
        );

        res.status(201).json({
            id: result.insertId,
            nome,
            email,
            cpf_rg: cpfRg,
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
        await ensureUsuariosSchema();
        const body = req.body || {};
        const email = String(body.email || "").trim();
        const senha = String(body.senha || "");

        if (!email || !senha) {
            return res.status(400).json({ erro: "E-mail e senha são obrigatórios" });
        }

        const [rows] = await pool.query(
            "SELECT id, nome, email, telefone, nome_fazenda, senha FROM usuarios WHERE email = ? LIMIT 1",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos" });
        }

        const usuario = rows[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ erro: "E-mail ou senha incorretos" });
        }

        delete usuario.senha;

        res.json({
            usuario,
            mensagem: "Login realizado com sucesso",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao realizar login" });
    }
});

router.post("/verificar-cpf", async (req, res) => {
    try {
        await ensureUsuariosSchema();
        const body = req.body || {};
        const cpfRg = somenteNumeros(body.cpf_rg);

        if (!cpfRg) {
            return res.status(400).json({ erro: "Digite somente os números do CPF/RG" });
        }

        const [rows] = await pool.query("SELECT id FROM usuarios WHERE cpf_rg = ? LIMIT 1", [cpfRg]);

        if (rows.length === 0) {
            return res.status(404).json({ erro: "CPF/RG digitado está errado" });
        }

        res.json({ ok: true, mensagem: "CPF/RG encontrado" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao verificar CPF/RG" });
    }
});

router.post("/redefinir-senha", async (req, res) => {
    try {
        await ensureUsuariosSchema();
        const body = req.body || {};
        const cpfRg = somenteNumeros(body.cpf_rg);
        const senha = String(body.senha || "");
        const confirmarSenha = String(body.confirmar_senha || body.confirmarSenha || "");

        if (!cpfRg || !senha) {
            return res.status(400).json({ erro: "CPF/RG e senha são obrigatórios" });
        }

        if (senha !== confirmarSenha) {
            return res.status(400).json({ erro: "As senhas não coincidem" });
        }

        if (senha.length < 6) {
            return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres" });
        }

        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
        const [result] = await pool.query("UPDATE usuarios SET senha = ? WHERE cpf_rg = ?", [senhaHash, cpfRg]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "CPF/RG digitado está errado" });
        }

        res.json({ mensagem: "Senha redefinida com sucesso" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao redefinir senha" });
    }
});

module.exports = router;
