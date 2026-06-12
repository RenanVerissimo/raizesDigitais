const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");

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
}

// CADASTRAR
router.post("/cadastrar", async (req, res) => {
    try {
        await ensureUsuariosSchema();
        const { nome, email, telefone, nome_fazenda, senha, confirmar_senha } = req.body;
        const cpfRg = somenteNumeros(req.body.cpf_rg);

        if (!nome || !email || !cpfRg || !senha) {
            return res.status(400).json({ erro: "Nome, e-mail, CPF/RG e senha são obrigatórios" });
        }

        if (senha !== confirmar_senha) {
            return res.status(400).json({ erro: "As senhas não coincidem" });
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

        const [result] = await pool.query(
            `INSERT INTO usuarios (nome, email, cpf_rg, telefone, nome_fazenda, senha)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, email, cpfRg, telefone || null, nome_fazenda || null, senha]
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

router.post("/verificar-cpf", async (req, res) => {
    try {
        await ensureUsuariosSchema();
        const cpfRg = somenteNumeros(req.body.cpf_rg);

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
        const cpfRg = somenteNumeros(req.body.cpf_rg);
        const { senha, confirmar_senha } = req.body;

        if (!cpfRg || !senha) {
            return res.status(400).json({ erro: "CPF/RG e senha são obrigatórios" });
        }

        if (senha !== confirmar_senha) {
            return res.status(400).json({ erro: "As senhas não coincidem" });
        }

        const [result] = await pool.query("UPDATE usuarios SET senha = ? WHERE cpf_rg = ?", [senha, cpfRg]);

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
