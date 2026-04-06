import { db } from "../config/database.js";

export async function listar(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM movimentacoes_estoque ORDER BY data DESC, hora DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

export async function criar(req, res) {
  const { usuario_id, tanque_id, nome_tanque, tipo, volume, data, hora, motivo, comprador, observacoes } = req.body;

  if (!usuario_id || !tanque_id || !tipo || volume == null || !data || !hora || !motivo) {
    return res.status(400).json({ erro: "usuario_id, tanque_id, tipo, volume, data, hora e motivo são obrigatórios." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO movimentacoes_estoque (usuario_id, tanque_id, nome_tanque, tipo, volume, data, hora, motivo, comprador, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, tanque_id, nome_tanque || null, tipo, volume, data, hora, motivo, comprador || null, observacoes || null]
    );
    res.status(201).json({
      id: result.insertId,
      usuario_id, tanque_id, nome_tanque,
      tipo, volume, data, hora,
      motivo, comprador, observacoes,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}