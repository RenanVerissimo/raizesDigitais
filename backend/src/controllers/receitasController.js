import { db } from "../config/database.js";

export async function listar(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM receitas ORDER BY data DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

export async function criar(req, res) {
  const { usuario_id, data, litros, preco_por_litro, comprador, observacoes } = req.body;

  if (!usuario_id || !data || litros == null || preco_por_litro == null || !comprador) {
    return res.status(400).json({ erro: "usuario_id, data, litros, preco_por_litro e comprador são obrigatórios." });
  }

  const valor_total = parseFloat(litros) * parseFloat(preco_por_litro);

  try {
    const [result] = await db.query(
      `INSERT INTO receitas (usuario_id, data, litros, preco_por_litro, valor_total, comprador, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, data, litros, preco_por_litro, valor_total, comprador, observacoes || null]
    );
    res.status(201).json({
      id: result.insertId,
      usuario_id, data, litros,
      preco_por_litro, valor_total,
      comprador, observacoes,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

export async function excluir(req, res) {
  try {
    const [result] = await db.query("DELETE FROM receitas WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Receita não encontrada." });
    }
    res.json({ mensagem: "Receita excluída com sucesso." });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}