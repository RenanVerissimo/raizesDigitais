const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");

const TIPOS_RACAO_LABEL = {
    milho: "Milho",
    farelo_soja: "Farelo de soja",
    nucleo_mineral: "Núcleo mineral",
    vitaminas: "Vitaminas",
};

const UNIDADES_RACAO = new Set(["kg", "saco", "saca", "fardo", "unidade"]);

function normalizarTipoRacao(tipoRacao, item) {
    if (tipoRacao && TIPOS_RACAO_LABEL[tipoRacao]) return tipoRacao;
    const itemNormalizado = String(item || "").trim().toLowerCase();
    const encontrado = Object.entries(TIPOS_RACAO_LABEL).find(([, label]) => label.toLowerCase() === itemNormalizado);
    return encontrado ? encontrado[0] : null;
}

function calcularQuantidadeEstoqueKg(categoria, quantidade, unidadeCompra, pesoPorUnidadeKg) {
    if (categoria !== "racao") return null;

    const qtd = Number(quantidade);
    if (Number.isNaN(qtd) || qtd <= 0) return null;

    const unidade = unidadeCompra || "kg";
    if (!UNIDADES_RACAO.has(unidade)) return null;
    if (unidade === "kg") return qtd;

    const peso = Number(pesoPorUnidadeKg || 0);
    if (Number.isNaN(peso) || peso <= 0) return null;

    return qtd * peso;
}

async function ensureEstoqueRacaoSchema() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS estoque_racao (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(120) NOT NULL,
            tipo VARCHAR(40) NOT NULL DEFAULT 'milho',
            unidade VARCHAR(20) NOT NULL DEFAULT 'kg',
            quantidade_atual DECIMAL(12,2) NOT NULL DEFAULT 0,
            estoque_minimo DECIMAL(12,2) NOT NULL DEFAULT 0,
            custo_unitario DECIMAL(12,2) NULL,
            fornecedor VARCHAR(120) NULL,
            localizacao VARCHAR(120) NULL,
            validade DATE NULL,
            observacoes TEXT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);
}

async function aplicarDeltaEstoqueRacao(compra, deltaQuantidade) {
    if (!compra || compra.categoria !== "racao" || compra.status !== "concluido" || Number(deltaQuantidade) === 0) return;

    const tipoRacao = normalizarTipoRacao(compra.tipo_racao || compra.tipoRacao, compra.item);
    if (!tipoRacao) return;

    await ensureEstoqueRacaoSchema();

    const [racoes] = await pool.query("SELECT id, quantidade_atual FROM estoque_racao WHERE tipo = ? ORDER BY id ASC LIMIT 1", [tipoRacao]);
    const novaQuantidade = Math.max(0, (racoes[0] ? Number(racoes[0].quantidade_atual) : 0) + Number(deltaQuantidade));

    if (racoes.length > 0) {
        await pool.query(
            "UPDATE estoque_racao SET quantidade_atual=?, custo_unitario=?, fornecedor=? WHERE id=?",
            [
                novaQuantidade,
                compra.preco_unitario ?? compra.precoUnitario ?? null,
                compra.fornecedor || null,
                racoes[0].id,
            ]
        );
        return;
    }

    await pool.query(
        `INSERT INTO estoque_racao (nome, tipo, unidade, quantidade_atual, estoque_minimo, custo_unitario, fornecedor)
         VALUES (?, ?, 'kg', ?, 0, ?, ?)`,
        [
            TIPOS_RACAO_LABEL[tipoRacao],
            tipoRacao,
            novaQuantidade,
            compra.preco_unitario ?? compra.precoUnitario ?? null,
            compra.fornecedor || null,
        ]
    );
}

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

    if (!existingColumns.has("tipo_racao")) {
        await pool.query(`
            ALTER TABLE compras
            ADD COLUMN tipo_racao VARCHAR(40) NULL AFTER categoria
        `);
    }

    if (!existingColumns.has("unidade_compra")) {
        await pool.query(`
            ALTER TABLE compras
            ADD COLUMN unidade_compra VARCHAR(20) NULL AFTER tipo_racao
        `);
    }

    if (!existingColumns.has("peso_unidade_kg")) {
        await pool.query(`
            ALTER TABLE compras
            ADD COLUMN peso_unidade_kg DECIMAL(12,2) NULL AFTER unidade_compra
        `);
    }

    if (!existingColumns.has("quantidade_estoque_kg")) {
        await pool.query(`
            ALTER TABLE compras
            ADD COLUMN quantidade_estoque_kg DECIMAL(12,2) NULL AFTER peso_unidade_kg
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
                tipo_racao AS tipoRacao,
                unidade_compra AS unidadeCompra,
                peso_unidade_kg AS pesoPorUnidadeKg,
                quantidade_estoque_kg AS quantidadeEstoqueKg,
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
            fornecedor, data, status, tipoRacao, unidadeCompra, pesoPorUnidadeKg, finalidadeTratamento, finalidadeDescricao, observacoes
        } = req.body;

        if (!categoria || !item || !quantidade || !precoUnitario || !fornecedor || !data) {
            return res.status(400).json({ erro: "Preencha todos os campos obrigatórios" });
        }

        const precoTotal = Number(quantidade) * Number(precoUnitario);

        const tipoRacaoNormalizado = categoria === "racao" ? normalizarTipoRacao(tipoRacao, item) : null;
        const unidadeCompraNormalizada = categoria === "racao" ? unidadeCompra || "kg" : null;
        const quantidadeEstoqueKg = calcularQuantidadeEstoqueKg(categoria, quantidade, unidadeCompraNormalizada, pesoPorUnidadeKg);
        if (categoria === "racao" && quantidadeEstoqueKg === null) {
            return res.status(400).json({ erro: "Informe a unidade e o peso por unidade da racao" });
        }

        const [result] = await pool.query(
            `INSERT INTO compras
             (categoria, tipo_racao, unidade_compra, peso_unidade_kg, quantidade_estoque_kg, item, quantidade, preco_unitario, preco_total, fornecedor, data, status, finalidade_tratamento, finalidade_descricao, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                categoria,
                tipoRacaoNormalizado,
                unidadeCompraNormalizada,
                categoria === "racao" && unidadeCompraNormalizada !== "kg" ? Number(pesoPorUnidadeKg) : null,
                quantidadeEstoqueKg,
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

        await aplicarDeltaEstoqueRacao({
            categoria,
            tipo_racao: tipoRacaoNormalizado,
            unidade_compra: unidadeCompraNormalizada,
            peso_unidade_kg: categoria === "racao" && unidadeCompraNormalizada !== "kg" ? Number(pesoPorUnidadeKg) : null,
            quantidade_estoque_kg: quantidadeEstoqueKg,
            item,
            quantidade,
            preco_unitario: precoUnitario,
            fornecedor,
            status: status || "pendente",
        }, Number(quantidadeEstoqueKg));

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
        const [compras] = await pool.query("SELECT * FROM compras WHERE id = ?", [req.params.id]);
        if (compras.length === 0) return res.status(404).json({ erro: "Compra nao encontrada" });
        const compraAntes = compras[0];
        const [result] = await pool.query(
            "UPDATE compras SET status = ? WHERE id = ?",
            [status, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Compra não encontrada" });
        const compraDepois = { ...compraAntes, status };
        const qtdAntes = compraAntes.categoria === "racao" && compraAntes.status === "concluido" ? Number(compraAntes.quantidade_estoque_kg || compraAntes.quantidade) : 0;
        const qtdDepois = compraDepois.categoria === "racao" && compraDepois.status === "concluido" ? Number(compraDepois.quantidade_estoque_kg || compraDepois.quantidade) : 0;
        await aplicarDeltaEstoqueRacao(compraDepois, qtdDepois - qtdAntes);
        res.json({ mensagem: "Status atualizado" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar status" });
    }
});

// EXCLUIR
router.delete("/:id", async (req, res) => {
    try {
        await ensureComprasSchema();
        const [compras] = await pool.query("SELECT * FROM compras WHERE id = ?", [req.params.id]);
        if (compras.length === 0) return res.status(404).json({ erro: "Compra nao encontrada" });
        const compraAntes = compras[0];
        const [result] = await pool.query("DELETE FROM compras WHERE id = ?", [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Compra não encontrada" });
        const qtdAntes = compraAntes.categoria === "racao" && compraAntes.status === "concluido" ? Number(compraAntes.quantidade_estoque_kg || compraAntes.quantidade) : 0;
        await aplicarDeltaEstoqueRacao(compraAntes, -qtdAntes);
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
            tipoRacao,
            unidadeCompra,
            pesoPorUnidadeKg,
            finalidadeTratamento,
            finalidadeDescricao,
            observacoes
        } = req.body;

        const precoTotal = Number(quantidade) * Number(precoUnitario);
        const tipoRacaoNormalizado = categoria === "racao" ? normalizarTipoRacao(tipoRacao, item) : null;
        const unidadeCompraNormalizada = categoria === "racao" ? unidadeCompra || "kg" : null;
        const quantidadeEstoqueKg = calcularQuantidadeEstoqueKg(categoria, quantidade, unidadeCompraNormalizada, pesoPorUnidadeKg);
        if (categoria === "racao" && quantidadeEstoqueKg === null) {
            return res.status(400).json({ erro: "Informe a unidade e o peso por unidade da racao" });
        }
        const [comprasAntes] = await pool.query("SELECT * FROM compras WHERE id = ?", [id]);
        if (comprasAntes.length === 0) return res.status(404).json({ erro: "Compra nao encontrada" });
        const compraAntes = comprasAntes[0];

        await pool.query(
            `UPDATE compras SET 
                categoria = ?, 
                tipo_racao = ?,
                unidade_compra = ?,
                peso_unidade_kg = ?,
                quantidade_estoque_kg = ?,
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
                tipoRacaoNormalizado,
                unidadeCompraNormalizada,
                categoria === "racao" && unidadeCompraNormalizada !== "kg" ? Number(pesoPorUnidadeKg) : null,
                quantidadeEstoqueKg,
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

        const compraDepois = {
            categoria,
            tipo_racao: tipoRacaoNormalizado,
            unidade_compra: unidadeCompraNormalizada,
            peso_unidade_kg: categoria === "racao" && unidadeCompraNormalizada !== "kg" ? Number(pesoPorUnidadeKg) : null,
            quantidade_estoque_kg: quantidadeEstoqueKg,
            item,
            quantidade,
            preco_unitario: precoUnitario,
            fornecedor,
            status,
        };
        const qtdAntes = compraAntes.categoria === "racao" && compraAntes.status === "concluido" ? Number(compraAntes.quantidade_estoque_kg || compraAntes.quantidade) : 0;
        const qtdDepois = compraDepois.categoria === "racao" && compraDepois.status === "concluido" ? Number(compraDepois.quantidade_estoque_kg || compraDepois.quantidade) : 0;
        if (compraAntes.categoria === "racao" && (compraDepois.categoria !== "racao" || normalizarTipoRacao(compraAntes.tipo_racao, compraAntes.item) !== tipoRacaoNormalizado)) {
            await aplicarDeltaEstoqueRacao(compraAntes, -qtdAntes);
            await aplicarDeltaEstoqueRacao(compraDepois, qtdDepois);
        } else {
            await aplicarDeltaEstoqueRacao(compraDepois, qtdDepois - qtdAntes);
        }

        res.json({ message: "Compra atualizada com sucesso" });

    } catch (error) {
        console.error("Erro ao atualizar compra:", error);
        res.status(500).json({ erro: "Erro ao atualizar compra" });
    }
});

module.exports = router;
