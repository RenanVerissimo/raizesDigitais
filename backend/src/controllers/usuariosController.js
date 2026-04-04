import { db } from "../config/database.js";

// GET /api/usuarios
export async function listar(req, res) {
  try {
    const [rows] = await db.query("SELECT id, nome, email, telefone, nome_fazenda, criado_em FROM usuarios ORDER BY nome");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

// POST /api/usuarios
export async function criar(req, res) {
  const { nome, email, telefone, nome_fazenda, senha_hash } = req.body;

  if (!nome || !email || !nome_fazenda || !senha_hash) {
    return res.status(400).json({ erro: "nome, email, nome_fazenda e senha_hash são obrigatórios." });
  }

  try {
    const [existe] = await db.query("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (existe.length > 0) {
      return res.status(409).json({ erro: "Este e-mail já está cadastrado." });
    }

    const [result] = await db.query(
      "INSERT INTO usuarios (nome, email, telefone, nome_fazenda, senha_hash) VALUES (?, ?, ?, ?, ?)",
      [nome, email, telefone || null, nome_fazenda, senha_hash]
    );
    res.status(201).json({
      id: result.insertId,
      nome,
      email,
      telefone,
      nome_fazenda,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

// DELETE /api/usuarios/:id
export async function excluir(req, res) {
  try {
    const [result] = await db.query("DELETE FROM usuarios WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }
    res.json({ mensagem: "Usuário excluído com sucesso." });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}