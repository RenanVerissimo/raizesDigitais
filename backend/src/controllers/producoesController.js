import { db } from "../config/database.js";

// GET /api/producoes
export async function listar(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM producoes ORDER BY data DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

// POST /api/producoes
export async function criar(req, res) {
  const { usuario_id, data, producao_manha, producao_tarde, qualidade, observacoes } = req.body;

  if (!usuario_id || !data || producao_manha == null || producao_tarde == null || !qualidade) {
    return res.status(400).json({ erro: "usuario_id, data, producao_manha, producao_tarde e qualidade são obrigatórios." });
  }

  const producao_total = parseFloat(producao_manha) + parseFloat(producao_tarde);

  try {
    const [result] = await db.query(
      `INSERT INTO producoes (usuario_id, data, producao_manha, producao_tarde, producao_total, qualidade, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, data, producao_manha, producao_tarde, producao_total, qualidade, observacoes || null]
    );
    res.status(201).json({
      id: result.insertId,
      usuario_id,
      data,
      producao_manha,
      producao_tarde,
      producao_total,
      qualidade,
      observacoes,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

// DELETE /api/producoes/:id
export async function excluir(req, res) {
  try {
    const [result] = await db.query("DELETE FROM producoes WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Produção não encontrada." });
    }
    res.json({ mensagem: "Produção excluída com sucesso." });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}