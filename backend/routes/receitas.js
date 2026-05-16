const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");
const { requireUsuario } = require("../utils/tenant");

async function ensureReceitasSchema() {
    const requiredColumns = [
        { name: "tipo_receita", sql: "ADD COLUMN tipo_receita VARCHAR(20) NOT NULL DEFAULT 'leite' AFTER usuario_id" },
        { name: "animal_id", sql: "ADD COLUMN animal_id INT NULL AFTER valor_total" },
        { name: "animal_nome", sql: "ADD COLUMN animal_nome VARCHAR(120) NULL AFTER animal_id" },
        { name: "animal_identificador", sql: "ADD COLUMN animal_identificador VARCHAR(80) NULL AFTER animal_nome" },
        { name: "animal_peso", sql: "ADD COLUMN animal_peso DECIMAL(10,2) NULL AFTER animal_identificador" },
        { name: "valor_animal", sql: "ADD COLUMN valor_animal DECIMAL(10,2) NULL AFTER animal_peso" },
    ];

    const [columns] = await pool.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'receitas'
    `);

    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

    for (const column of requiredColumns) {
        if (!existingColumns.has(column.name)) {
            await pool.query(`ALTER TABLE receitas ${column.sql}`);
        }
    }
}

function normalizarTipoReceita(tipoReceita) {
    return tipoReceita === "animal" ? "animal" : "leite";
}

async function prepararReceita(usuarioId, body) {
    const {
        tipoReceita = "leite",
        data,
        litros,
        precoPorLitro,
        animalId,
        animalNome,
        animalIdentificador,
        animalPeso,
        valorAnimal,
        comprador,
        observacoes,
    } = body;

    const tipo = normalizarTipoReceita(tipoReceita);

    if (!data || (tipo === "leite" && !String(comprador || "").trim())) {
        const erro = new Error("Preencha todos os campos obrigatorios");
        erro.status = 400;
        throw erro;
    }

    let litrosNumero = Number(litros || 0);
    let precoNumero = Number(precoPorLitro || 0);
    let valorTotal = litrosNumero * precoNumero;
    let animalIdFinal = null;
    let animalNomeFinal = null;
    let animalIdentificadorFinal = null;
    let animalPesoFinal = animalPeso === null || animalPeso === undefined || animalPeso === "" ? null : Number(animalPeso);
    let valorAnimalFinal = null;

    if (tipo === "leite") {
        if (!litros || !precoPorLitro || litrosNumero <= 0 || precoNumero <= 0) {
            const erro = new Error("Litros e preco por litro devem ser maiores que zero");
            erro.status = 400;
            throw erro;
        }
    } else {
        valorAnimalFinal = Number(valorAnimal);
        if (!valorAnimalFinal || valorAnimalFinal <= 0) {
            const erro = new Error("Informe o valor da venda do animal");
            erro.status = 400;
            throw erro;
        }

        litrosNumero = 0;
        precoNumero = 0;
        valorTotal = valorAnimalFinal;

        if (animalId) {
            const [animais] = await pool.query(
                "SELECT id, nome, identificador, peso FROM animais WHERE id = ? AND usuario_id = ?",
                [animalId, usuarioId]
            );

            if (!animais.length) {
                const erro = new Error("Animal nao encontrado");
                erro.status = 404;
                throw erro;
            }

            const animal = animais[0];
            animalIdFinal = animal.id;
            animalNomeFinal = animal.nome;
            animalIdentificadorFinal = animal.identificador;
            animalPesoFinal = animalPesoFinal ?? (animal.peso === null || animal.peso === undefined ? null : Number(animal.peso));
        } else {
            if (!animalNome || !String(animalNome).trim()) {
                const erro = new Error("Informe o nome ou descricao do animal vendido");
                erro.status = 400;
                throw erro;
            }
            animalNomeFinal = String(animalNome).trim();
            animalIdentificadorFinal = animalIdentificador ? String(animalIdentificador).trim() : null;
        }
    }

    return {
        tipo,
        data,
        litrosNumero,
        precoNumero,
        valorTotal,
        animalIdFinal,
        animalNomeFinal,
        animalIdentificadorFinal,
        animalPesoFinal,
        valorAnimalFinal,
        comprador: comprador ? String(comprador).trim() : "",
        observacoes: observacoes || null,
    };
}

router.get("/", async (req, res) => {
    try {
        await ensureReceitasSchema();
        const usuarioId = await requireUsuario(req, res, ["receitas"]);
        if (!usuarioId) return;

        const [rows] = await pool.query(`
            SELECT
                id,
                tipo_receita AS tipoReceita,
                DATE_FORMAT(data, '%Y-%m-%d') AS data,
                litros,
                preco_por_litro AS precoPorLitro,
                valor_total AS valorTotal,
                animal_id AS animalId,
                animal_nome AS animalNome,
                animal_identificador AS animalIdentificador,
                animal_peso AS animalPeso,
                valor_animal AS valorAnimal,
                comprador,
                observacoes
            FROM receitas
            WHERE usuario_id = ?
            ORDER BY data DESC, id DESC
        `, [usuarioId]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar receitas" });
    }
});

router.post("/", async (req, res) => {
    try {
        await ensureReceitasSchema();
        const usuarioId = await requireUsuario(req, res, ["receitas"]);
        if (!usuarioId) return;

        const receita = await prepararReceita(usuarioId, req.body);

        const [result] = await pool.query(
            `INSERT INTO receitas
             (usuario_id, tipo_receita, data, litros, preco_por_litro, valor_total, animal_id, animal_nome, animal_identificador, animal_peso, valor_animal, comprador, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuarioId,
                receita.tipo,
                receita.data,
                receita.litrosNumero,
                receita.precoNumero,
                receita.valorTotal,
                receita.animalIdFinal,
                receita.animalNomeFinal,
                receita.animalIdentificadorFinal,
                receita.animalPesoFinal,
                receita.valorAnimalFinal,
                receita.comprador,
                receita.observacoes,
            ]
        );

        if (receita.tipo === "animal" && receita.animalIdFinal) {
            await pool.query(
                "UPDATE animais SET status = 'vendido' WHERE id = ? AND usuario_id = ?",
                [receita.animalIdFinal, usuarioId]
            );
        }

        res.status(201).json({
            id: result.insertId,
            tipoReceita: receita.tipo,
            data: receita.data,
            litros: receita.litrosNumero,
            precoPorLitro: receita.precoNumero,
            valorTotal: receita.valorTotal,
            animalId: receita.animalIdFinal,
            animalNome: receita.animalNomeFinal,
            animalIdentificador: receita.animalIdentificadorFinal,
            animalPeso: receita.animalPesoFinal,
            valorAnimal: receita.valorAnimalFinal,
            comprador: receita.comprador,
            observacoes: receita.observacoes,
            mensagem: "Receita cadastrada",
        });
    } catch (err) {
        console.error(err);
        res.status(err.status || 500).json({ erro: err.message || "Erro ao cadastrar receita" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        await ensureReceitasSchema();
        const usuarioId = await requireUsuario(req, res, ["receitas"]);
        if (!usuarioId) return;

        const receita = await prepararReceita(usuarioId, req.body);

        const [result] = await pool.query(
            `UPDATE receitas
             SET tipo_receita = ?, data = ?, litros = ?, preco_por_litro = ?, valor_total = ?,
                 animal_id = ?, animal_nome = ?, animal_identificador = ?, animal_peso = ?, valor_animal = ?,
                 comprador = ?, observacoes = ?
             WHERE id = ? AND usuario_id = ?`,
            [
                receita.tipo,
                receita.data,
                receita.litrosNumero,
                receita.precoNumero,
                receita.valorTotal,
                receita.animalIdFinal,
                receita.animalNomeFinal,
                receita.animalIdentificadorFinal,
                receita.animalPesoFinal,
                receita.valorAnimalFinal,
                receita.comprador,
                receita.observacoes,
                req.params.id,
                usuarioId,
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Receita nao encontrada" });
        }

        if (receita.tipo === "animal" && receita.animalIdFinal) {
            await pool.query(
                "UPDATE animais SET status = 'vendido' WHERE id = ? AND usuario_id = ?",
                [receita.animalIdFinal, usuarioId]
            );
        }

        res.json({
            id: Number(req.params.id),
            tipoReceita: receita.tipo,
            data: receita.data,
            litros: receita.litrosNumero,
            precoPorLitro: receita.precoNumero,
            valorTotal: receita.valorTotal,
            animalId: receita.animalIdFinal,
            animalNome: receita.animalNomeFinal,
            animalIdentificador: receita.animalIdentificadorFinal,
            animalPeso: receita.animalPesoFinal,
            valorAnimal: receita.valorAnimalFinal,
            comprador: receita.comprador,
            observacoes: receita.observacoes,
            mensagem: "Receita atualizada",
        });
    } catch (err) {
        console.error(err);
        res.status(err.status || 500).json({ erro: err.message || "Erro ao atualizar receita" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await ensureReceitasSchema();
        const usuarioId = await requireUsuario(req, res, ["receitas"]);
        if (!usuarioId) return;

        const [result] = await pool.query(
            "DELETE FROM receitas WHERE id = ? AND usuario_id = ?",
            [req.params.id, usuarioId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Receita nao encontrada" });
        }

        res.json({ mensagem: "Receita excluida" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir receita" });
    }
});

module.exports = router;
