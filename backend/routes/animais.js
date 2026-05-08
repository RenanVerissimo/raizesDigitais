const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");

async function ensureAnimaisSchema() {
    const requiredColumns = [
        { name: "doente", sql: "ADD COLUMN doente TINYINT(1) NOT NULL DEFAULT 0 AFTER mastite" },
        { name: "doenca", sql: "ADD COLUMN doenca VARCHAR(40) NULL AFTER doente" },
        { name: "descricao_doenca", sql: "ADD COLUMN descricao_doenca VARCHAR(255) NULL AFTER doenca" },
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
        const [rows] = await pool.query("SELECT * FROM animais ORDER BY criado_em DESC");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar animais" });
    }
});

router.post("/", async (req, res) => {
    try {
        await ensureAnimaisSchema();
        const {
            nome,
            identificador,
            producao_media_diaria,
            raca,
            peso,
            descricao,
            data_nascimento,
            data_ultimo_parto,

            // 🔥 NOVOS CAMPOS
            prenha,
            em_cio,
            abortou,
            nao_emprenha,
            mastite,
            doente,
            doenca,
            descricao_doenca,
            data_cobertura,
            data_inseminacao,
            data_confirmacao_prenhez
        } = req.body;

        if (!nome || !identificador) {
            return res.status(400).json({ erro: "Nome e identificador são obrigatórios" });
        }

        if (!data_nascimento) {
            return res.status(400).json({ erro: "A data de nascimento é obrigatória" });
        }

        const [result] = await pool.query(
            `INSERT INTO animais 
            (
                nome,
                identificador,
                producao_media_diaria,
                raca,
                peso,
                descricao,
                data_nascimento,
                data_ultimo_parto,

                prenha,
                em_cio,
                abortou,
                nao_emprenha,
                mastite,
                doente,
                doenca,
                descricao_doenca,
                data_cobertura,
                data_inseminacao,
                data_confirmacao_prenhez
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome,
                identificador,
                producao_media_diaria ?? null,
                raca || null,
                peso ?? null,
                descricao || null,
                data_nascimento,
                data_ultimo_parto || null,

                // 🔥 BOOLEAN → 0/1
                prenha ? 1 : 0,
                em_cio ? 1 : 0,
                abortou ? 1 : 0,
                nao_emprenha ? 1 : 0,
                mastite ? 1 : 0,
                doente ? 1 : 0,
                doente ? doenca || null : null,
                doente && doenca === "outra" ? descricao_doenca || null : null,

                data_cobertura || null,
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
        const {
            nome,
            identificador,
            producao_media_diaria,
            raca,
            peso,
            descricao,
            data_nascimento,
            data_ultimo_parto,

            // 🔥 NOVOS
            prenha,
            em_cio,
            abortou,
            nao_emprenha,
            mastite,
            doente,
            doenca,
            descricao_doenca,
            data_cobertura,
            data_inseminacao,
            data_confirmacao_prenhez
        } = req.body;

        if (!data_nascimento) {
            return res.status(400).json({ erro: "A data de nascimento é obrigatória" });
        }

        const [result] = await pool.query(
            `UPDATE animais 
            SET 
                nome = ?,
                identificador = ?,
                producao_media_diaria = ?,
                raca = ?,
                peso = ?,
                descricao = ?,
                data_nascimento = ?,
                data_ultimo_parto = ?,

                prenha = ?,
                em_cio = ?,
                abortou = ?,
                nao_emprenha = ?,
                mastite = ?,
                doente = ?,
                doenca = ?,
                descricao_doenca = ?,
                data_cobertura = ?,
                data_inseminacao = ?,
                data_confirmacao_prenhez = ?

            WHERE id = ?`,
            [
                nome,
                identificador,
                producao_media_diaria ?? null,
                raca || null,
                peso ?? null,
                descricao || null,
                data_nascimento,
                data_ultimo_parto || null,

                // 🔥 BOOLEAN
                prenha ? 1 : 0,
                em_cio ? 1 : 0,
                abortou ? 1 : 0,
                nao_emprenha ? 1 : 0,
                mastite ? 1 : 0,
                doente ? 1 : 0,
                doente ? doenca || null : null,
                doente && doenca === "outra" ? descricao_doenca || null : null,
                data_cobertura || null,
                data_inseminacao || null,
                data_confirmacao_prenhez || null,

                req.params.id,
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
// EXCLUIR
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM animais WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Animal não encontrado" });
        res.json({ mensagem: "Animal excluído" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir animal" });
    }
});

module.exports = router;
