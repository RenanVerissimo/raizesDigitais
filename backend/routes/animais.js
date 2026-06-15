const express = require("express");
const router = express.Router();

function normalizarStatusAnimal(status) {
    return ["ativo", "inativo", "vendido"].includes(status) ? status : "ativo";
}
const pool = require("../database/conecction");
const { requireUsuario, ensureUsuarioColumn } = require("../utils/tenant");

async function ensureAnimaisSchema() {
    await ensureUsuarioColumn("animais");
    const requiredColumns = [
        { name: "doente", sql: "ADD COLUMN doente TINYINT(1) NOT NULL DEFAULT 0 AFTER mastite" },
        { name: "doenca", sql: "ADD COLUMN doenca VARCHAR(40) NULL AFTER doente" },
        { name: "descricao_doenca", sql: "ADD COLUMN descricao_doenca VARCHAR(255) NULL AFTER doenca" },
        { name: "tratamento_mastite", sql: "ADD COLUMN tratamento_mastite VARCHAR(255) NULL AFTER descricao_doenca" },
        { name: "status", sql: "ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ativo' AFTER identificador" },
        { name: "dias_descarte_leite", sql: "ADD COLUMN dias_descarte_leite INT NULL AFTER data_ultimo_parto" },
        { name: "data_reproducao", sql: "ADD COLUMN data_reproducao DATE NULL AFTER data_ultimo_parto" },
    ];

    const [columns] = await pool.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'animais'
    `);

    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

    for (const column of requiredColumns) {
        if (!existingColumns.has(column.name)) {
            await pool.query(`ALTER TABLE animais ${column.sql}`);
        }
    }
}

// LISTAR TODOS
router.get("/", async (req, res) => {
    try {
        await ensureAnimaisSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        const [rows] = await pool.query("SELECT * FROM animais WHERE usuario_id = ? ORDER BY criado_em DESC", [usuarioId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar animais" });
    }
});

router.post("/", async (req, res) => {
    try {
        await ensureAnimaisSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        const {
            nome,
            identificador,
            status = "ativo",
            producao_media_diaria,
            raca,
            peso,
            descricao,
            data_nascimento,
            data_ultimo_parto,
            dias_descarte_leite,

            // 🔥 NOVOS CAMPOS
            prenha,
            em_cio,
            abortou,
            nao_emprenha,
            mastite,
            tratamento_mastite,
            doente,
            doenca,
            descricao_doenca,
            data_reproducao,
            data_inseminacao,
            data_confirmacao_prenhez
        } = req.body;

        if (!nome || !identificador) {
            return res.status(400).json({ erro: "Nome e identificador são obrigatórios" });
        }

        if (!data_nascimento) {
            return res.status(400).json({ erro: "A data de nascimento é obrigatória" });
        }

        const tratamentoMastite = tratamento_mastite ?? req.body.tratamentoMastite ?? null;
        const temMastite = Boolean(mastite);
        const temOutraDoenca = Boolean(doente) && doenca === "outra";
        const doenteFinal = temMastite || temOutraDoenca;
        const doencaFinal = temMastite ? "mastite" : temOutraDoenca ? "outra" : null;
        const descricaoDoencaFinal = temOutraDoenca ? descricao_doenca || null : null;

        const [result] = await pool.query(
            `INSERT INTO animais 
            (
                usuario_id,
                nome,
                identificador,
                status,
                producao_media_diaria,
                raca,
                peso,
                descricao,
                data_nascimento,
                data_ultimo_parto,
                dias_descarte_leite,

                prenha,
                em_cio,
                abortou,
                nao_emprenha,
                mastite,
                tratamento_mastite,
                doente,
                doenca,
                descricao_doenca,
                data_reproducao,
                data_inseminacao,
                data_confirmacao_prenhez
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuarioId,
                nome,
                identificador,
                normalizarStatusAnimal(status),
                producao_media_diaria ?? null,
                raca || null,
                peso ?? null,
                descricao || null,
                data_nascimento,
                data_ultimo_parto || null,
                dias_descarte_leite === null || dias_descarte_leite === undefined || dias_descarte_leite === "" ? null : Number(dias_descarte_leite),

                // 🔥 BOOLEAN → 0/1
                prenha ? 1 : 0,
                em_cio ? 1 : 0,
                abortou ? 1 : 0,
                nao_emprenha ? 1 : 0,
                temMastite ? 1 : 0,
                temMastite ? tratamentoMastite || null : null,
                doenteFinal ? 1 : 0,
                doencaFinal,
                descricaoDoencaFinal,

                data_reproducao || null,
                data_inseminacao || null,
                data_confirmacao_prenhez || null,
            ]
        );

        res.status(201).json({ id: result.insertId, mensagem: "Animal cadastrado" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao cadastrar animal" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        await ensureAnimaisSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        const {
            nome,
            identificador,
            status,
            producao_media_diaria,
            raca,
            peso,
            descricao,
            data_nascimento,
            data_ultimo_parto,

            dias_descarte_leite,
            // 🔥 NOVOS
            prenha,
            em_cio,
            abortou,
            nao_emprenha,
            mastite,
            tratamento_mastite,
            doente,
            doenca,
            descricao_doenca,
            data_reproducao,
            data_inseminacao,
            data_confirmacao_prenhez
        } = req.body;

        if (!data_nascimento) {
            return res.status(400).json({ erro: "A data de nascimento é obrigatória" });
        }

        const tratamentoMastite = tratamento_mastite ?? req.body.tratamentoMastite ?? null;
        const temMastite = Boolean(mastite);
        const temOutraDoenca = Boolean(doente) && doenca === "outra";
        const doenteFinal = temMastite || temOutraDoenca;
        const doencaFinal = temMastite ? "mastite" : temOutraDoenca ? "outra" : null;
        const descricaoDoencaFinal = temOutraDoenca ? descricao_doenca || null : null;

        const [result] = await pool.query(
            `UPDATE animais 
            SET 
                nome = ?,
                identificador = ?,
                status = ?,
                producao_media_diaria = ?,
                raca = ?,
                peso = ?,
                descricao = ?,
                data_nascimento = ?,
                data_ultimo_parto = ?,
                dias_descarte_leite = ?,

                prenha = ?,
                em_cio = ?,
                abortou = ?,
                nao_emprenha = ?,
                mastite = ?,
                tratamento_mastite = ?,
                doente = ?,
                doenca = ?,
                descricao_doenca = ?,
                data_reproducao = ?,
                data_inseminacao = ?,
                data_confirmacao_prenhez = ?

            WHERE id = ? AND usuario_id = ?`,
            [
                nome,
                identificador,
                normalizarStatusAnimal(status),
                producao_media_diaria ?? null,
                raca || null,
                peso ?? null,
                descricao || null,
                data_nascimento,
                data_ultimo_parto || null,
                dias_descarte_leite === null || dias_descarte_leite === undefined || dias_descarte_leite === "" ? null : Number(dias_descarte_leite),

                // 🔥 BOOLEAN
                prenha ? 1 : 0,
                em_cio ? 1 : 0,
                abortou ? 1 : 0,
                nao_emprenha ? 1 : 0,
                temMastite ? 1 : 0,
                temMastite ? tratamentoMastite || null : null,
                doenteFinal ? 1 : 0,
                doencaFinal,
                descricaoDoencaFinal,
                data_reproducao || null,
                data_inseminacao || null,
                data_confirmacao_prenhez || null,

                req.params.id,
                usuarioId,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Animal não encontrado" });
        }

        res.json({ mensagem: "Animal atualizado" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar animal" });
    }
});

router.patch("/:id/status", async (req, res) => {
    try {
        await ensureAnimaisSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;

        const status = normalizarStatusAnimal(req.body.status);
        const [result] = await pool.query(
            "UPDATE animais SET status = ? WHERE id = ? AND usuario_id = ?",
            [status, req.params.id, usuarioId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Animal não encontrado" });
        }

        res.json({ mensagem: "Status do animal atualizado", status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar status do animal" });
    }
});
// EXCLUIR
router.delete("/:id", async (req, res) => {
    try {
        await ensureAnimaisSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        const [result] = await pool.query("DELETE FROM animais WHERE id = ? AND usuario_id = ?", [req.params.id, usuarioId]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Animal não encontrado" });
        res.json({ mensagem: "Animal excluído" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir animal" });
    }
});

module.exports = router;
