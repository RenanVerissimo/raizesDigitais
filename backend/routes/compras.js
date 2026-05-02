const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");

// LISTAR TODAS
router.get("/", async (req, res) => {
    try {
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
        const {
            categoria, item, quantidade, precoUnitario,
            fornecedor, data, status, observacoes
        } = req.body;

        if (!categoria || !item || !quantidade || !precoUnitario || !fornecedor || !data) {
            return res.status(400).json({ erro: "Preencha todos os campos obrigatórios" });
        }

        const precoTotal = Number(quantidade) * Number(precoUnitario);

        const [result] = await pool.query(
            `INSERT INTO compras
             (categoria, item, quantidade, preco_unitario, preco_total, fornecedor, data, status, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                categoria,
                item,
                quantidade,
                precoUnitario,
                precoTotal,
                fornecedor,
                data,
                status || "pendente",
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
        const { id } = req.params;
        const {
            categoria,
            item,
            quantidade,
            precoUnitario,
            fornecedor,
            data,
            status,
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