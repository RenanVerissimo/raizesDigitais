import { db } from "../config/database.js";

export async function listar(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM tanques ORDER BY nome_tanque");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

export async function criar(req, res) {
  const { usuario_id, nome_tanque, capacidade, volume_atual, temperatura, qualidade, localizacao } = req.body;

  if (!usuario_id || !nome_tanque || capacidade == null) {
    return res.status(400).json({ erro: "usuario_id, nome_tanque e capacidade são obrigatórios." });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO tanques (usuario_id, nome_tanque, capacidade, volume_atual, temperatura, qualidade, localizacao)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, nome_tanque, capacidade, volume_atual || 0, temperatura || null, qualidade || "good", localizacao || null]
    );
    res.status(201).json({
      id: result.insertId,
      usuario_id, nome_tanque, capacidade,
      volume_atual: volume_atual || 0,
      temperatura, qualidade: qualidade || "good", localizacao,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

export async function atualizar(req, res) {
  const { nome_tanque, capacidade, volume_atual, temperatura, qualidade, localizacao } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE tanques SET
        nome_tanque = COALESCE(?, nome_tanque),
        capacidade = COALESCE(?, capacidade),
        volume_atual = COALESCE(?, volume_atual),
        temperatura = COALESCE(?, temperatura),
        qualidade = COALESCE(?, qualidade),
        localizacao = COALESCE(?, localizacao)
       WHERE id = ?`,
      [nome_tanque, capacidade, volume_atual, temperatura, qualidade, localizacao, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Tanque não encontrado." });
    }
    res.json({ mensagem: "Tanque atualizado com sucesso." });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

export async function excluir(req, res) {
  try {
    const [result] = await db.query("DELETE FROM tanques WHERE id = ?", [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: "Tanque não encontrado." });
    }
    res.json({ mensagem: "Tanque excluído com sucesso." });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}