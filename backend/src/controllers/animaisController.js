import { db } from "../config/database.js";

// GET /api/animais
export async function listar(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM animais ORDER BY nome");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

// POST /api/animais
export async function criar(req, res) {
  const { usuario_id, nome, identificador, producao_media_diaria, raca, idade } = req.body;

  if (!usuario_id || !nome || !identificador) {
    return res.status(400).json({ erro: "usuario_id, nome e identificador são obrigatórios." });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO animais (usuario_id, nome, identificador, producao_media_diaria, raca, idade) VALUES (?, ?, ?, ?, ?, ?)",
      [usuario_id, nome, identificador, producao_media_diaria || 0, raca || null, idade || null]
    );
    res.status(201).json({
      id: result.insertId,
      usuario_id,
      nome,
      identificador,
      producao_media_diaria: producao_media_diaria || 0,
      raca,
      idade,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

// DELETE /api/animais/:id
export async function excluir(req, res) {
  try {
    const [result] = await db.query("DELETE FROM animais WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Animal não encontrado." });
    }
    res.json({ mensagem: "Animal excluído com sucesso." });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}