const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");

// LISTAR TODAS AS RECEITAS
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                id,
                DATE_FORMAT(data, '%Y-%m-%d') AS data,
                litros,
                preco_por_litro AS precoPorLitro,
                valor_total AS valorTotal,
                comprador,
                observacoes
            FROM receitas
            ORDER BY data DESC, id DESC
        `);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar receitas" });
    }
});

// CRIAR RECEITA
router.post("/", async (req, res) => {
    try {
        const {
            data,
            litros,
            precoPorLitro,
            comprador,
            observacoes
        } = req.body;

        if (!data || !litros || !precoPorLitro || !comprador) {
            return res.status(400).json({
                erro: "Preencha todos os campos obrigatórios"
            });
        }

        const litrosNumero = Number(litros);
        const precoNumero = Number(precoPorLitro);

        if (litrosNumero <= 0 || precoNumero <= 0) {
            return res.status(400).json({
                erro: "Litros e preço por litro devem ser maiores que zero"
            });
        }

        const valorTotal = litrosNumero * precoNumero;

        const [result] = await pool.query(
            `INSERT INTO receitas
             (data, litros, preco_por_litro, valor_total, comprador, observacoes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                data,
                litrosNumero,
                precoNumero,
                valorTotal,
                comprador,
                observacoes || null
            ]
        );

        res.status(201).json({
            id: result.insertId,
            data,
            litros: litrosNumero,
            precoPorLitro: precoNumero,
            valorTotal,
            comprador,
            observacoes: observacoes || null,
            mensagem: "Receita cadastrada"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao cadastrar receita" });
    }
});

// ATUALIZAR RECEITA
router.put("/:id", async (req, res) => {
    try {
        const {
            data,
            litros,
            precoPorLitro,
            comprador,
            observacoes
        } = req.body;

        if (!data || !litros || !precoPorLitro || !comprador) {
            return res.status(400).json({
                erro: "Preencha todos os campos obrigatÃ³rios"
            });
        }

        const litrosNumero = Number(litros);
        const precoNumero = Number(precoPorLitro);

        if (litrosNumero <= 0 || precoNumero <= 0) {
            return res.status(400).json({
                erro: "Litros e preÃ§o por litro devem ser maiores que zero"
            });
        }

        const valorTotal = litrosNumero * precoNumero;

        const [result] = await pool.query(
            `UPDATE receitas
             SET data = ?, litros = ?, preco_por_litro = ?, valor_total = ?, comprador = ?, observacoes = ?
             WHERE id = ?`,
            [
                data,
                litrosNumero,
                precoNumero,
                valorTotal,
                comprador,
                observacoes || null,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Receita nÃ£o encontrada" });
        }

        res.json({
            id: Number(req.params.id),
            data,
            litros: litrosNumero,
            precoPorLitro: precoNumero,
            valorTotal,
            comprador,
            observacoes: observacoes || null,
            mensagem: "Receita atualizada"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar receita" });
    }
});

// EXCLUIR RECEITA
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await pool.query(
            "DELETE FROM receitas WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Receita não encontrada" });
        }

        res.json({ mensagem: "Receita excluída" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir receita" });
    }
});

module.exports = router;
