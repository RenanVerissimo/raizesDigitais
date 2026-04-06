import { db } from "../config/database.js";

export async function listar(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM compras ORDER BY data DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

export async function criar(req, res) {
  const { usuario_id, categoria, item, quantidade, preco_unitario, fornecedor, data, status, observacoes } = req.body;

  if (!usuario_id || !categoria || !item || quantidade == null || preco_unitario == null || !fornecedor || !data) {
    return res.status(400).json({ erro: "usuario_id, categoria, item, quantidade, preco_unitario, fornecedor e data são obrigatórios." });
  }

  const preco_total = parseFloat(quantidade) * parseFloat(preco_unitario);

  try {
    const [result] = await db.query(
      `INSERT INTO compras (usuario_id, categoria, item, quantidade, preco_unitario, preco_total, fornecedor, data, status, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, categoria, item, quantidade, preco_unitario, preco_total, fornecedor, data, status || "pending", observacoes || null]
    );
    res.status(201).json({
      id: result.insertId,
      usuario_id, categoria, item, quantidade,
      preco_unitario, preco_total, fornecedor,
      data, status: status || "pending", observacoes,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

export async function atualizarStatus(req, res) {
  const { status } = req.body;
  const validos = ["pending", "completed", "cancelled"];

  if (!validos.includes(status)) {
    return res.status(400).json({ erro: "Status inválido. Use: pending, completed ou cancelled." });
  }

  try {
    const [result] = await db.query("UPDATE compras SET status = ? WHERE id = ?", [status, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Compra não encontrada." });
    }
    res.json({ mensagem: "Status atualizado com sucesso.", status });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

export async function excluir(req, res) {
  try {
    const [result] = await db.query("DELETE FROM compras WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Compra não encontrada." });
    }
    res.json({ mensagem: "Compra excluída com sucesso." });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}