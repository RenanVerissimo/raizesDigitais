const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");

// ============================================
// TANQUES
// ============================================

// LISTAR TODOS OS TANQUES
router.get("/tanques", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                id,
                nome,
                capacidade,
                quantidade_atual AS volumeAtual,
                temperatura,
                qualidade,
                localizacao,
                observacoes,
                criado_em AS atualizadoEm
            FROM tanques
            ORDER BY nome ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar tanques" });
    }
});

// CRIAR TANQUE
router.post("/tanques", async (req, res) => {
    try {
        const { nome, capacidade, volumeAtual, temperatura, qualidade, localizacao, observacoes } = req.body;

        if (!nome || !capacidade) {
            return res.status(400).json({ erro: "Preencha os campos obrigatórios" });
        }

        const [result] = await pool.query(
            `INSERT INTO tanques (nome, capacidade, quantidade_atual, temperatura, qualidade, localizacao, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                nome,
                Number(capacidade),
                Number(volumeAtual || 0),
                Number(temperatura || 0),
                qualidade || "boa",
                localizacao || null,
                observacoes || null,
            ]
        );

        const [rows] = await pool.query(
            `SELECT id, nome, capacidade, quantidade_atual AS volumeAtual, temperatura, qualidade, localizacao, observacoes, criado_em AS atualizadoEm
             FROM tanques WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao cadastrar tanque" });
    }
});

// ATUALIZAR TANQUE
router.put("/tanques/:id", async (req, res) => {
    try {
        const { nome, capacidade, volumeAtual, temperatura, qualidade, localizacao, observacoes } = req.body;

        const [result] = await pool.query(
            `UPDATE tanques SET nome=?, capacidade=?, quantidade_atual=?, temperatura=?, qualidade=?, localizacao=?, observacoes=?
             WHERE id=?`,
            [
                nome,
                Number(capacidade),
                Number(volumeAtual || 0),
                Number(temperatura || 0),
                qualidade || "boa",
                localizacao || null,
                observacoes || null,
                req.params.id,
            ]
        );

        if (result.affectedRows === 0) return res.status(404).json({ erro: "Tanque não encontrado" });

        res.json({ mensagem: "Tanque atualizado" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar tanque" });
    }
});

// EXCLUIR TANQUE
router.delete("/tanques/:id", async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM tanques WHERE id=?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Tanque não encontrado" });
        res.json({ mensagem: "Tanque excluído" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir tanque" });
    }
});

// ============================================
// MOVIMENTAÇÕES
// ============================================

// LISTAR MOVIMENTAÇÕES
router.get("/movimentacoes", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                m.id,
                m.tanque_id AS tanqueId,
                t.nome AS tanqueNome,
                m.tipo,
                m.quantidade AS volume,
                DATE_FORMAT(m.data, '%Y-%m-%d') AS data,
                m.hora,
                m.motivo,
                m.comprador,
                m.temperatura,
                m.consumo_proprio AS consumoProprio,
                m.observacoes
            FROM movimentacoes_estoque m
            INNER JOIN tanques t ON t.id = m.tanque_id
            ORDER BY m.data DESC, m.hora DESC, m.id DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar movimentações" });
    }
});

// CRIAR MOVIMENTAÇÃO
router.post("/movimentacoes", async (req, res) => {
    try {
        const { tanqueId, tipo, volume, data, hora, motivo, comprador, temperatura, consumoProprio, observacoes } = req.body;

        if (!tanqueId || !tipo || !data || !motivo) {
            return res.status(400).json({ erro: "Preencha os campos obrigatórios" });
        }

        // Busca tanque e valida volume
        const [tanques] = await pool.query("SELECT * FROM tanques WHERE id=?", [tanqueId]);
        if (tanques.length === 0) return res.status(404).json({ erro: "Tanque não encontrado" });

        const tanque = tanques[0];
        const vol = Number(volume || 0);
        const consumo = tipo === "saida" ? Number(consumoProprio || 0) : 0;
        if (Number.isNaN(vol) || Number.isNaN(consumo) || vol < 0 || consumo < 0) return res.status(400).json({ erro: "Volume inválido" });
        if ((tipo === "entrada" && vol <= 0) || (tipo === "saida" && vol + consumo <= 0)) {
            return res.status(400).json({ erro: "Informe pelo menos um volume maior que 0" });
        }

        const novoVolume = tipo === "entrada"
            ? Number(tanque.quantidade_atual) + vol
            : Number(tanque.quantidade_atual) - vol - consumo;

        if (novoVolume < 0) return res.status(400).json({ erro: "Volume insuficiente no tanque" });
        if (novoVolume > Number(tanque.capacidade)) return res.status(400).json({ erro: "Volume excede a capacidade do tanque" });

        // Insere movimentação
        const [result] = await pool.query(
            `INSERT INTO movimentacoes_estoque (tanque_id, tipo, quantidade, data, hora, motivo, comprador, temperatura, consumo_proprio, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                tanqueId,
                tipo,
                vol,
                data,
                hora || "00:00",
                motivo,
                comprador || null,
                tipo === "saida" && temperatura !== null && temperatura !== undefined && temperatura !== "" ? Number(temperatura) : null,
                consumo,
                observacoes || null,
            ]
        );

        // Atualiza volume do tanque e, em entregas, registra a temperatura medida.
        if (tipo === "saida" && temperatura !== null && temperatura !== undefined && temperatura !== "") {
            await pool.query("UPDATE tanques SET quantidade_atual=?, temperatura=? WHERE id=?", [novoVolume, Number(temperatura), tanqueId]);
        } else {
            await pool.query("UPDATE tanques SET quantidade_atual=? WHERE id=?", [novoVolume, tanqueId]);
        }

        res.status(201).json({
            id: result.insertId,
            tanqueId,
            tanqueNome: tanque.nome,
            tipo,
            volume: vol,
            data,
            hora: hora || "00:00",
            motivo,
            comprador: comprador || null,
            temperatura: tipo === "saida" && temperatura !== null && temperatura !== undefined && temperatura !== "" ? Number(temperatura) : null,
            consumoProprio: consumo,
            observacoes: observacoes || null,
            mensagem: "Movimentação registrada",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao registrar movimentação" });
    }
});

// EXCLUIR MOVIMENTAÇÃO
router.delete("/movimentacoes/:id", async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM movimentacoes_estoque WHERE id=?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Movimentação não encontrada" });
        res.json({ mensagem: "Movimentação excluída" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir movimentação" });
    }
});

module.exports = router;
