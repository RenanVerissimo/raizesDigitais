const express = require("express");
const pool = require("../database/conecction");
const { requireUsuario } = require("../utils/tenant");

const router = express.Router();

async function ensureProducaoSchema() {
    const [columns] = await pool.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'producao'
    `);
    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

    if (!existingColumns.has("tanque_id")) {
        await pool.query("ALTER TABLE producao ADD COLUMN tanque_id INT NULL AFTER usuario_id");
    }
}

const SELECT_PRODUCAO = `
    SELECT
        p.id,
        p.usuario_id,
        p.tanque_id AS tanqueId,
        t.nome AS tanqueNome,
        DATE_FORMAT(p.data, '%Y-%m-%d') AS data,
        p.producao_diaria,
        p.qualidade,
        p.observacoes,
        p.criado_em
    FROM producao
    p
    LEFT JOIN tanques t ON t.id = p.tanque_id AND t.usuario_id = p.usuario_id
`;

function validarVolumeTanque(tanque, novoVolume) {
    if (!tanque) return "Tanque não encontrado";
    if (novoVolume < 0) return "Volume insuficiente no tanque";
    if (novoVolume > Number(tanque.capacidade)) return "Volume excede a capacidade do tanque";
    return null;
}

router.get("/recentes", async (req, res) => {
    try {
        await ensureProducaoSchema();
        const usuarioId = await requireUsuario(req, res, ["producao"]);
        if (!usuarioId) return;
        const [rows] = await pool.query(`${SELECT_PRODUCAO} WHERE p.usuario_id = ? ORDER BY p.criado_em DESC LIMIT 3`, [usuarioId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar produções recentes" });
    }
});

router.get("/", async (req, res) => {
    try {
        await ensureProducaoSchema();
        const usuarioId = await requireUsuario(req, res, ["producao"]);
        if (!usuarioId) return;
        const [rows] = await pool.query(`${SELECT_PRODUCAO} WHERE p.usuario_id = ? ORDER BY p.criado_em DESC`, [usuarioId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar produções" });
    }
});

router.post("/", async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await ensureProducaoSchema();
        const usuarioId = await requireUsuario(req, res, ["producao"]);
        if (!usuarioId) return;
        const { date, dailyProduction, quality = "good", notes, tanqueId } = req.body;
        const total = Number(dailyProduction);

        if (!tanqueId) return res.status(400).json({ error: "Selecione um tanque" });
        if (!date || Number.isNaN(total) || total <= 0) return res.status(400).json({ error: "Dados de produção inválidos" });

        await conn.beginTransaction();
        const [tanques] = await conn.query("SELECT * FROM tanques WHERE id = ? AND usuario_id = ? FOR UPDATE", [tanqueId, usuarioId]);
        const tanque = tanques[0];
        const novoVolume = Number(tanque?.quantidade_atual || 0) + total;
        const erroVolume = validarVolumeTanque(tanque, novoVolume);
        if (erroVolume) {
            await conn.rollback();
            return res.status(400).json({ error: erroVolume });
        }

        const [result] = await conn.query(
            "INSERT INTO producao (usuario_id, tanque_id, data, producao_diaria, qualidade, observacoes) VALUES (?, ?, ?, ?, ?, ?)",
            [usuarioId, tanqueId, date, total, quality, notes]
        );
        await conn.query("UPDATE tanques SET quantidade_atual = ? WHERE id = ? AND usuario_id = ?", [novoVolume, tanqueId, usuarioId]);
        await conn.commit();

        res.status(201).json({ id: result.insertId, message: "Produção registrada!" });
    } catch (error) {
        await conn.rollback();
        console.error(error);
        res.status(500).json({ error: "Erro ao registrar produção" });
    } finally {
        conn.release();
    }
});

router.delete("/:id", async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await ensureProducaoSchema();
        const usuarioId = await requireUsuario(req, res, ["producao"]);
        if (!usuarioId) return;

        await conn.beginTransaction();
        const [producoes] = await conn.query("SELECT * FROM producao WHERE id = ? AND usuario_id = ? FOR UPDATE", [req.params.id, usuarioId]);
        if (producoes.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: "Registro não encontrado" });
        }

        const producao = producoes[0];
        if (producao.tanque_id) {
            const [tanques] = await conn.query("SELECT * FROM tanques WHERE id = ? AND usuario_id = ? FOR UPDATE", [producao.tanque_id, usuarioId]);
            const tanque = tanques[0];
            const novoVolume = Number(tanque?.quantidade_atual || 0) - Number(producao.producao_diaria || 0);
            const erroVolume = validarVolumeTanque(tanque, novoVolume);
            if (erroVolume) {
                await conn.rollback();
                return res.status(400).json({ error: erroVolume });
            }
            await conn.query("UPDATE tanques SET quantidade_atual = ? WHERE id = ? AND usuario_id = ?", [novoVolume, producao.tanque_id, usuarioId]);
        }

        await conn.query("DELETE FROM producao WHERE id = ? AND usuario_id = ?", [req.params.id, usuarioId]);
        await conn.commit();
        res.json({ message: "Registro excluído" });
    } catch (error) {
        await conn.rollback();
        console.error(error);
        res.status(500).json({ error: "Erro ao excluir" });
    } finally {
        conn.release();
    }
});

router.put("/:id", async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await ensureProducaoSchema();
        const usuarioId = await requireUsuario(req, res, ["producao"]);
        if (!usuarioId) return;
        const { id } = req.params;
        const { date, dailyProduction, quality = "good", notes, tanqueId } = req.body;
        const total = Number(dailyProduction);

        if (!tanqueId) return res.status(400).json({ error: "Selecione um tanque" });
        if (!date || Number.isNaN(total) || total <= 0) return res.status(400).json({ error: "Dados de produção inválidos" });

        await conn.beginTransaction();
        const [producoes] = await conn.query("SELECT * FROM producao WHERE id = ? AND usuario_id = ? FOR UPDATE", [id, usuarioId]);
        if (producoes.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: "Registro não encontrado" });
        }

        const producaoAntes = producoes[0];
        const tanqueAntigoId = producaoAntes.tanque_id;
        const tanqueNovoId = Number(tanqueId);

        if (tanqueAntigoId && Number(tanqueAntigoId) !== tanqueNovoId) {
            const [tanquesAntigos] = await conn.query("SELECT * FROM tanques WHERE id = ? AND usuario_id = ? FOR UPDATE", [tanqueAntigoId, usuarioId]);
            const tanqueAntigo = tanquesAntigos[0];
            const volumeAntigo = Number(tanqueAntigo?.quantidade_atual || 0) - Number(producaoAntes.producao_diaria || 0);
            const erroAntigo = validarVolumeTanque(tanqueAntigo, volumeAntigo);
            if (erroAntigo) {
                await conn.rollback();
                return res.status(400).json({ error: erroAntigo });
            }
            await conn.query("UPDATE tanques SET quantidade_atual = ? WHERE id = ? AND usuario_id = ?", [volumeAntigo, tanqueAntigoId, usuarioId]);
        }

        const [tanquesNovos] = await conn.query("SELECT * FROM tanques WHERE id = ? AND usuario_id = ? FOR UPDATE", [tanqueNovoId, usuarioId]);
        const tanqueNovo = tanquesNovos[0];
        const baseVolumeNovo = Number(tanqueNovo?.quantidade_atual || 0);
        const novoVolume = Number(tanqueAntigoId) === tanqueNovoId
            ? baseVolumeNovo - Number(producaoAntes.producao_diaria || 0) + total
            : baseVolumeNovo + total;
        const erroNovo = validarVolumeTanque(tanqueNovo, novoVolume);
        if (erroNovo) {
            await conn.rollback();
            return res.status(400).json({ error: erroNovo });
        }

        await conn.query(
            "UPDATE producao SET tanque_id=?, data=?, producao_diaria=?, qualidade=?, observacoes=? WHERE id=? AND usuario_id=?",
            [tanqueNovoId, date, total, quality, notes, id, usuarioId]
        );
        await conn.query("UPDATE tanques SET quantidade_atual = ? WHERE id = ? AND usuario_id = ?", [novoVolume, tanqueNovoId, usuarioId]);
        await conn.commit();
        res.json({ message: "Produção atualizada!" });
    } catch (error) {
        await conn.rollback();
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar produção" });
    } finally {
        conn.release();
    }
});

module.exports = router;
