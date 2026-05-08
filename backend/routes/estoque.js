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
router.delete("/movimentacoes/:id", async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [movs] = await conn.query("SELECT * FROM movimentacoes_estoque WHERE id=?", [req.params.id]);
        if (movs.length === 0) {
            await conn.rollback();
            return res.status(404).json({ erro: "Movimentação não encontrada" });
        }

        const mov = movs[0];
        const tanque = await buscarTanquePorId(conn, mov.tanque_id);
        const novoVolume = Number(tanque.quantidade_atual) - efeitoMovimentacao(mov);
        const erroVolume = validarVolumeTanque(tanque, novoVolume);
        if (erroVolume) {
            await conn.rollback();
            return res.status(400).json({ erro: erroVolume });
        }

        await conn.query("UPDATE tanques SET quantidade_atual=? WHERE id=?", [novoVolume, tanque.id]);
        await conn.query("DELETE FROM movimentacoes_estoque WHERE id=?", [req.params.id]);

        await conn.commit();
        return res.json({ mensagem: "Movimentação excluída" });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        return res.status(500).json({ erro: "Erro ao excluir movimentação" });
    } finally {
        conn.release();
    }
});

router.delete("/movimentacoes/:id/legado", async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM movimentacoes_estoque WHERE id=?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Movimentação não encontrada" });
        res.json({ mensagem: "Movimentação excluída" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir movimentação" });
    }
});

function efeitoMovimentacao(mov) {
    const volume = Number(mov.quantidade ?? mov.volume ?? 0);
    const consumoProprio = mov.tipo === "saida" ? Number(mov.consumo_proprio ?? mov.consumoProprio ?? 0) : 0;
    return mov.tipo === "entrada" ? volume : -volume - consumoProprio;
}

async function buscarTanquePorId(conn, id) {
    const [tanques] = await conn.query("SELECT * FROM tanques WHERE id=?", [id]);
    return tanques[0];
}

function validarVolumeTanque(tanque, novoVolume) {
    if (novoVolume < 0) return "Volume insuficiente no tanque";
    if (novoVolume > Number(tanque.capacidade)) return "Volume excede a capacidade do tanque";
    return null;
}

router.put("/movimentacoes/:id", async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { tanqueId, tipo, volume, data, hora, motivo, comprador, temperatura, consumoProprio, observacoes } = req.body;

        if (!tanqueId || !tipo || !data || !motivo) {
            return res.status(400).json({ erro: "Preencha os campos obrigatórios" });
        }

        const vol = Number(volume || 0);
        const consumo = tipo === "saida" ? Number(consumoProprio || 0) : 0;
        if (Number.isNaN(vol) || Number.isNaN(consumo) || vol < 0 || consumo < 0) {
            return res.status(400).json({ erro: "Volume inválido" });
        }
        if ((tipo === "entrada" && vol <= 0) || (tipo === "saida" && vol + consumo <= 0)) {
            return res.status(400).json({ erro: "Informe pelo menos um volume maior que 0" });
        }

        await conn.beginTransaction();

        const [movs] = await conn.query("SELECT * FROM movimentacoes_estoque WHERE id=?", [req.params.id]);
        if (movs.length === 0) {
            await conn.rollback();
            return res.status(404).json({ erro: "Movimentação não encontrada" });
        }

        const movAntiga = movs[0];
        const tanqueAntigo = await buscarTanquePorId(conn, movAntiga.tanque_id);
        const tanqueNovo = await buscarTanquePorId(conn, tanqueId);
        if (!tanqueNovo) {
            await conn.rollback();
            return res.status(404).json({ erro: "Tanque não encontrado" });
        }

        const volumeAntigoRevertido = Number(tanqueAntigo.quantidade_atual) - efeitoMovimentacao(movAntiga);
        const novaMovimentacao = { tipo, volume: vol, consumoProprio: consumo };
        const novoVolumeTanqueNovo = Number(tanqueNovo.id) === Number(tanqueAntigo.id)
            ? volumeAntigoRevertido + efeitoMovimentacao(novaMovimentacao)
            : Number(tanqueNovo.quantidade_atual) + efeitoMovimentacao(novaMovimentacao);

        const erroTanqueAntigo = validarVolumeTanque(tanqueAntigo, volumeAntigoRevertido);
        const erroTanqueNovo = validarVolumeTanque(tanqueNovo, novoVolumeTanqueNovo);
        if (erroTanqueAntigo || erroTanqueNovo) {
            await conn.rollback();
            return res.status(400).json({ erro: erroTanqueAntigo || erroTanqueNovo });
        }

        await conn.query(
            `UPDATE movimentacoes_estoque
             SET tanque_id=?, tipo=?, quantidade=?, data=?, hora=?, motivo=?, comprador=?, temperatura=?, consumo_proprio=?, observacoes=?
             WHERE id=?`,
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
                req.params.id,
            ]
        );

        if (Number(tanqueNovo.id) === Number(tanqueAntigo.id)) {
            await conn.query("UPDATE tanques SET quantidade_atual=? WHERE id=?", [novoVolumeTanqueNovo, tanqueNovo.id]);
        } else {
            await conn.query("UPDATE tanques SET quantidade_atual=? WHERE id=?", [volumeAntigoRevertido, tanqueAntigo.id]);
            await conn.query("UPDATE tanques SET quantidade_atual=? WHERE id=?", [novoVolumeTanqueNovo, tanqueNovo.id]);
        }

        if (tipo === "saida" && temperatura !== null && temperatura !== undefined && temperatura !== "") {
            await conn.query("UPDATE tanques SET temperatura=? WHERE id=?", [Number(temperatura), tanqueId]);
        }

        await conn.commit();
        res.json({ mensagem: "Movimentação atualizada" });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar movimentação" });
    } finally {
        conn.release();
    }
});

module.exports = router;
