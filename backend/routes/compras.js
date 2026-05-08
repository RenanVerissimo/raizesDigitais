const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");

async function ensureComprasSchema() {
    const [columns] = await pool.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'compras'
    `);
    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

    if (!existingColumns.has("finalidade_tratamento")) {
        await pool.query(`
            ALTER TABLE compras
            ADD COLUMN finalidade_tratamento VARCHAR(40) NULL AFTER status
        `);
    }

    if (!existingColumns.has("finalidade_descricao")) {
        await pool.query(`
            ALTER TABLE compras
            ADD COLUMN finalidade_descricao VARCHAR(120) NULL AFTER finalidade_tratamento
        `);
    }
}

// LISTAR TODAS
router.get("/", async (req, res) => {
    try {
        await ensureComprasSchema();
        const [rows] = await pool.query(`
            SELECT 
                id,
                categoria,
                item,
                quantidade,
                preco_unitario AS precoUnitario,
                preco_total AS precoTotal,
                fornecedor,
                DATE_FORMAT(data, '%Y-%m-%d') AS data,
                status,
                finalidade_tratamento AS finalidadeTratamento,
                finalidade_descricao AS finalidadeDescricao,
                observacoes
            FROM compras
            ORDER BY data DESC, id DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar compras" });
    }
});

// CRIAR
router.post("/", async (req, res) => {
    try {
        await ensureComprasSchema();
        const {
            categoria, item, quantidade, precoUnitario,
            fornecedor, data, status, finalidadeTratamento, finalidadeDescricao, observacoes
        } = req.body;

        if (!categoria || !item || !quantidade || !precoUnitario || !fornecedor || !data) {
            return res.status(400).json({ erro: "Preencha todos os campos obrigatórios" });
        }

        const precoTotal = Number(quantidade) * Number(precoUnitario);

        const [result] = await pool.query(
            `INSERT INTO compras
             (categoria, item, quantidade, preco_unitario, preco_total, fornecedor, data, status, finalidade_tratamento, finalidade_descricao, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                categoria,
                item,
                quantidade,
                precoUnitario,
                precoTotal,
                fornecedor,
                data,
                status || "pendente",
                categoria === "medicamento" ? finalidadeTratamento || "uso_geral" : null,
                categoria === "medicamento" && finalidadeTratamento === "outro_tratamento" ? finalidadeDescricao || null : null,
                observacoes || null,
            ]
        );

        res.status(201).json({ id: result.insertId, mensagem: "Compra cadastrada" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao cadastrar compra" });
    }
});

// ATUALIZAR STATUS (bônus — útil pro botão de marcar como concluído)
router.patch("/:id/status", async (req, res) => {
    try {
        await ensureComprasSchema();
        const { status } = req.body;
        const [result] = await pool.query(
            "UPDATE compras SET status = ? WHERE id = ?",
            [status, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Compra não encontrada" });
        res.json({ mensagem: "Status atualizado" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar status" });
    }
});

// EXCLUIR
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM compras WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Compra não encontrada" });
        res.json({ mensagem: "Compra excluída" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir compra" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        await ensureComprasSchema();
        const { id } = req.params;
        const {
            categoria,
            item,
            quantidade,
            precoUnitario,
            fornecedor,
            data,
            status,
            finalidadeTratamento,
            finalidadeDescricao,
            observacoes
        } = req.body;

        const precoTotal = Number(quantidade) * Number(precoUnitario);

        await pool.query(
            `UPDATE compras SET 
                categoria = ?, 
                item = ?, 
                quantidade = ?, 
                preco_unitario = ?,  
                preco_total = ?,
                fornecedor = ?, 
                data = ?, 
                status = ?, 
                finalidade_tratamento = ?,
                finalidade_descricao = ?,
                observacoes = ?
             WHERE id = ?`,
            [
                categoria,
                item,
                quantidade,
                precoUnitario, 
                precoTotal,
                fornecedor,
                data,
                status,
                categoria === "medicamento" ? finalidadeTratamento || "uso_geral" : null,
                categoria === "medicamento" && finalidadeTratamento === "outro_tratamento" ? finalidadeDescricao || null : null,
                observacoes || null,
                id
            ]
        );

        res.json({ message: "Compra atualizada com sucesso" });

    } catch (error) {
        console.error("Erro ao atualizar compra:", error);
        res.status(500).json({ erro: "Erro ao atualizar compra" });
    }
});

module.exports = router;
