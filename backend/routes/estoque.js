const express = require("express");
const router = express.Router();
const pool = require("../database/conecction");
const { requireUsuario, ensureUsuarioColumn } = require("../utils/tenant");

// ============================================
// TANQUES
// ============================================

// LISTAR TODOS OS TANQUES
router.get("/tanques", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res, ["tanques"]);
        if (!usuarioId) return;
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
            WHERE usuario_id = ?
            ORDER BY nome ASC
        `, [usuarioId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar tanques" });
    }
});

// CRIAR TANQUE
router.post("/tanques", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res, ["tanques"]);
        if (!usuarioId) return;
        const { nome, capacidade, volumeAtual, temperatura, qualidade, localizacao, observacoes } = req.body;

        if (!nome || !capacidade) {
            return res.status(400).json({ erro: "Preencha os campos obrigatórios" });
        }

        const [result] = await pool.query(
            `INSERT INTO tanques (usuario_id, nome, capacidade, quantidade_atual, temperatura, qualidade, localizacao, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuarioId,
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
             FROM tanques WHERE id = ? AND usuario_id = ?`,
            [result.insertId, usuarioId]
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
        const usuarioId = await requireUsuario(req, res, ["tanques"]);
        if (!usuarioId) return;
        const { nome, capacidade, volumeAtual, temperatura, qualidade, localizacao, observacoes } = req.body;

        const [result] = await pool.query(
            `UPDATE tanques SET nome=?, capacidade=?, quantidade_atual=?, temperatura=?, qualidade=?, localizacao=?, observacoes=?
             WHERE id=? AND usuario_id=?`,
            [
                nome,
                Number(capacidade),
                Number(volumeAtual || 0),
                Number(temperatura || 0),
                qualidade || "boa",
                localizacao || null,
                observacoes || null,
                req.params.id,
                usuarioId,
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
        const usuarioId = await requireUsuario(req, res, ["tanques"]);
        if (!usuarioId) return;
        const [result] = await pool.query("DELETE FROM tanques WHERE id=? AND usuario_id=?", [req.params.id, usuarioId]);
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
        const usuarioId = await requireUsuario(req, res, ["tanques"]);
        if (!usuarioId) return;
        const [rows] = await pool.query(`
            SELECT
                m.id,
                m.tanque_id AS tanqueId,
                t.nome AS tanqueNome,
                m.tipo,
                m.quantidade AS volume,
                DATE_FORMAT(m.data, '%Y-%m-%d') AS data,
                m.motivo,
                m.comprador,
                m.temperatura,
                m.consumo_proprio AS consumoProprio,
                m.observacoes
            FROM movimentacoes_estoque m
            INNER JOIN tanques t ON t.id = m.tanque_id
            WHERE t.usuario_id = ?
            ORDER BY m.data DESC, m.id DESC
        `, [usuarioId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar movimentações" });
    }
});

// CRIAR MOVIMENTAÇÃO
router.post("/movimentacoes", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res, ["tanques"]);
        if (!usuarioId) return;
        const { tanqueId, tipo, volume, data, motivo, comprador, temperatura, consumoProprio, observacoes } = req.body;

        if (!tanqueId || !tipo || !data || !motivo) {
            return res.status(400).json({ erro: "Preencha os campos obrigatórios" });
        }

        // Busca tanque e valida volume
        const [tanques] = await pool.query("SELECT * FROM tanques WHERE id=? AND usuario_id=?", [tanqueId, usuarioId]);
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
            `INSERT INTO movimentacoes_estoque (tanque_id, tipo, quantidade, data, motivo, comprador, temperatura, consumo_proprio, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                tanqueId,
                tipo,
                vol,
                data,
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
        const usuarioId = await requireUsuario(req, res, ["tanques"]);
        if (!usuarioId) return;
        await conn.beginTransaction();

        const [movs] = await conn.query(`
            SELECT m.*
            FROM movimentacoes_estoque m
            INNER JOIN tanques t ON t.id = m.tanque_id
            WHERE m.id=? AND t.usuario_id=?
        `, [req.params.id, usuarioId]);
        if (movs.length === 0) {
            await conn.rollback();
            return res.status(404).json({ erro: "Movimentação não encontrada" });
        }

        const mov = movs[0];
        const tanque = await buscarTanquePorId(conn, mov.tanque_id, usuarioId);
        const novoVolume = Number(tanque.quantidade_atual) - efeitoMovimentacao(mov);
        const erroVolume = validarVolumeTanque(tanque, novoVolume);
        if (erroVolume) {
            await conn.rollback();
            const mensagem = mov.tipo === "entrada" && novoVolume < 0
                ? "Não é possível excluir esta entrada porque parte desse leite já saiu do tanque."
                : erroVolume;
            return res.status(400).json({ erro: mensagem });
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
        const usuarioId = await requireUsuario(req, res, ["tanques"]);
        if (!usuarioId) return;
        const [result] = await pool.query(`
            DELETE m FROM movimentacoes_estoque m
            INNER JOIN tanques t ON t.id = m.tanque_id
            WHERE m.id=? AND t.usuario_id=?
        `, [req.params.id, usuarioId]);
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

async function buscarTanquePorId(conn, id, usuarioId) {
    const [tanques] = await conn.query("SELECT * FROM tanques WHERE id=? AND usuario_id=?", [id, usuarioId]);
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
        const usuarioId = await requireUsuario(req, res, ["tanques"]);
        if (!usuarioId) return;
        const { tanqueId, tipo, volume, data, motivo, comprador, temperatura, consumoProprio, observacoes } = req.body;

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

        const [movs] = await conn.query(`
            SELECT m.*
            FROM movimentacoes_estoque m
            INNER JOIN tanques t ON t.id = m.tanque_id
            WHERE m.id=? AND t.usuario_id=?
        `, [req.params.id, usuarioId]);
        if (movs.length === 0) {
            await conn.rollback();
            return res.status(404).json({ erro: "Movimentação não encontrada" });
        }

        const movAntiga = movs[0];
        const tanqueAntigo = await buscarTanquePorId(conn, movAntiga.tanque_id, usuarioId);
        const tanqueNovo = await buscarTanquePorId(conn, tanqueId, usuarioId);
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
             SET tanque_id=?, tipo=?, quantidade=?, data=?, motivo=?, comprador=?, temperatura=?, consumo_proprio=?, observacoes=?
             WHERE id=?`,
            [
                tanqueId,
                tipo,
                vol,
                data,
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

// ============================================
// ESTOQUE DE RACAO
// ============================================

const TIPOS_RACAO_LABEL = {
    milho: "Milho",
    farelo_soja: "Farelo de soja",
    nucleo_mineral: "Núcleo mineral",
};

function normalizarTexto(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function normalizarTipoRacao(tipoRacao, item) {
    if (tipoRacao && TIPOS_RACAO_LABEL[tipoRacao]) return tipoRacao;
    const itemNormalizado = normalizarTexto(item);
    const encontrado = Object.entries(TIPOS_RACAO_LABEL).find(([, label]) => normalizarTexto(label) === itemNormalizado);
    return encontrado ? encontrado[0] : null;
}

async function ensureRacaoSchema() {
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

    await pool.query(`
        CREATE TABLE IF NOT EXISTS movimentacoes_racao (
            id INT AUTO_INCREMENT PRIMARY KEY,
            racao_id INT NOT NULL,
            tipo VARCHAR(20) NOT NULL,
            quantidade DECIMAL(12,2) NOT NULL,
            data DATE NOT NULL,
            motivo VARCHAR(120) NOT NULL,
            destino VARCHAR(120) NULL,
            observacoes TEXT NULL,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_movimentacoes_racao_item
                FOREIGN KEY (racao_id) REFERENCES estoque_racao(id)
                ON DELETE CASCADE
        )
    `);
    await ensureUsuarioColumn("estoque_racao");

    const [columns] = await pool.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'movimentacoes_racao'
    `);
    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

    if (!existingColumns.has("idempotency_key")) {
        await pool.query("ALTER TABLE movimentacoes_racao ADD COLUMN idempotency_key VARCHAR(80) NULL AFTER observacoes");
    }

    const [indexes] = await pool.query(`
        SELECT INDEX_NAME
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'movimentacoes_racao'
          AND INDEX_NAME = 'ux_movimentacoes_racao_idempotency'
    `);

    if (indexes.length === 0) {
        await pool.query(`
            CREATE UNIQUE INDEX ux_movimentacoes_racao_idempotency
            ON movimentacoes_racao (idempotency_key)
        `);
    }
}

async function ensureComprasRacaoSchema() {
    await ensureUsuarioColumn("compras");
    const [columns] = await pool.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'compras'
    `);
    const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

    if (!existingColumns.has("tipo_racao")) {
        await pool.query("ALTER TABLE compras ADD COLUMN tipo_racao VARCHAR(40) NULL AFTER categoria");
    }
    if (!existingColumns.has("unidade_compra")) {
        await pool.query("ALTER TABLE compras ADD COLUMN unidade_compra VARCHAR(20) NULL AFTER tipo_racao");
    }
    if (!existingColumns.has("peso_unidade_kg")) {
        await pool.query("ALTER TABLE compras ADD COLUMN peso_unidade_kg DECIMAL(12,2) NULL AFTER unidade_compra");
    }
    if (!existingColumns.has("quantidade_estoque_kg")) {
        await pool.query("ALTER TABLE compras ADD COLUMN quantidade_estoque_kg DECIMAL(12,2) NULL AFTER peso_unidade_kg");
    }
}

async function sincronizarRacoesCompradas(usuarioId) {
    await ensureRacaoSchema();
    await ensureComprasRacaoSchema();

    const [compras] = await pool.query(`
        SELECT
            tipo_racao,
            item,
            quantidade,
            quantidade_estoque_kg,
            preco_total,
            fornecedor
        FROM compras
        WHERE categoria = 'racao'
          AND status = 'concluido'
          AND usuario_id = ?
    `, [usuarioId]);

    const agregadas = new Map();
    compras.forEach((compra) => {
        const tipo = normalizarTipoRacao(compra.tipo_racao, compra.item);
        if (!tipo) return;

        const quantidade = Number(compra.quantidade_estoque_kg ?? compra.quantidade ?? 0);
        if (Number.isNaN(quantidade) || quantidade <= 0) return;

        const atual = agregadas.get(tipo) || { quantidade: 0, valor: 0, fornecedor: null };
        agregadas.set(tipo, {
            quantidade: atual.quantidade + quantidade,
            valor: atual.valor + Number(compra.preco_total || 0),
            fornecedor: compra.fornecedor || atual.fornecedor,
        });
    });

    for (const [tipo, dados] of agregadas.entries()) {
        const custoUnitario = dados.quantidade > 0 ? dados.valor / dados.quantidade : null;
        const [racoes] = await pool.query("SELECT id, quantidade_atual, custo_unitario, fornecedor FROM estoque_racao WHERE tipo = ? AND usuario_id = ? ORDER BY id ASC LIMIT 1", [tipo, usuarioId]);

        if (racoes.length === 0) {
            await pool.query(
                `INSERT INTO estoque_racao (usuario_id, nome, tipo, unidade, quantidade_atual, estoque_minimo, custo_unitario, fornecedor)
                 VALUES (?, ?, ?, 'kg', ?, 0, ?, ?)`,
                [usuarioId, TIPOS_RACAO_LABEL[tipo], tipo, dados.quantidade, custoUnitario, dados.fornecedor]
            );
            continue;
        }

        const racao = racoes[0];
        const [movs] = await pool.query("SELECT COUNT(*) AS total FROM movimentacoes_racao WHERE racao_id = ?", [racao.id]);
        const semMovimentacao = Number(movs[0]?.total || 0) === 0;
        const quantidadeAtual = Number(racao.quantidade_atual || 0);

        if (semMovimentacao && quantidadeAtual === 0) {
            await pool.query(
                "UPDATE estoque_racao SET quantidade_atual=?, custo_unitario=?, fornecedor=COALESCE(fornecedor, ?) WHERE id=?",
                [dados.quantidade, custoUnitario, dados.fornecedor, racao.id]
            );
        } else if (racao.custo_unitario === null || racao.fornecedor === null) {
            await pool.query(
                "UPDATE estoque_racao SET custo_unitario=COALESCE(custo_unitario, ?), fornecedor=COALESCE(fornecedor, ?) WHERE id=?",
                [custoUnitario, dados.fornecedor, racao.id]
            );
        }
    }
}

router.get("/racoes", async (req, res) => {
    try {
        const usuarioId = await requireUsuario(req, res, ["estoque_racao", "compras"]);
        if (!usuarioId) return;
        await sincronizarRacoesCompradas(usuarioId);
        const [rows] = await pool.query(`
            SELECT
                id,
                nome,
                tipo,
                unidade,
                quantidade_atual AS quantidadeAtual,
                estoque_minimo AS estoqueMinimo,
                custo_unitario AS custoUnitario,
                fornecedor,
                localizacao,
                DATE_FORMAT(validade, '%Y-%m-%d') AS validade,
                observacoes,
                atualizado_em AS atualizadoEm
            FROM estoque_racao
            WHERE usuario_id = ?
            ORDER BY nome ASC
        `, [usuarioId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar racoes" });
    }
});

router.post("/racoes", async (req, res) => {
    try {
        await ensureRacaoSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        const { nome, tipo, unidade, quantidadeAtual, estoqueMinimo, custoUnitario, fornecedor, localizacao, validade, observacoes } = req.body;

        if (!nome || !tipo || !unidade) {
            return res.status(400).json({ erro: "Preencha nome, tipo e unidade" });
        }

        const quantidade = Number(quantidadeAtual || 0);
        const minimo = Number(estoqueMinimo || 0);
        const custo = custoUnitario === null || custoUnitario === undefined || custoUnitario === "" ? null : Number(custoUnitario);

        if (Number.isNaN(quantidade) || Number.isNaN(minimo) || quantidade < 0 || minimo < 0 || (custo !== null && (Number.isNaN(custo) || custo < 0))) {
            return res.status(400).json({ erro: "Valores numericos invalidos" });
        }

        const [result] = await pool.query(
            `INSERT INTO estoque_racao
             (usuario_id, nome, tipo, unidade, quantidade_atual, estoque_minimo, custo_unitario, fornecedor, localizacao, validade, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                usuarioId,
                nome,
                tipo,
                unidade,
                quantidade,
                minimo,
                custo,
                fornecedor || null,
                localizacao || null,
                validade || null,
                observacoes || null,
            ]
        );

        res.status(201).json({ id: result.insertId, mensagem: "Racao cadastrada" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao cadastrar racao" });
    }
});

router.put("/racoes/:id", async (req, res) => {
    try {
        await ensureRacaoSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        const { nome, tipo, unidade, quantidadeAtual, estoqueMinimo, custoUnitario, fornecedor, localizacao, validade, observacoes } = req.body;
        const quantidade = Number(quantidadeAtual || 0);
        const minimo = Number(estoqueMinimo || 0);
        const custo = custoUnitario === null || custoUnitario === undefined || custoUnitario === "" ? null : Number(custoUnitario);

        if (!nome || !tipo || !unidade) return res.status(400).json({ erro: "Preencha nome, tipo e unidade" });
        if (Number.isNaN(quantidade) || Number.isNaN(minimo) || quantidade < 0 || minimo < 0 || (custo !== null && (Number.isNaN(custo) || custo < 0))) {
            return res.status(400).json({ erro: "Valores numericos invalidos" });
        }

        const [result] = await pool.query(
            `UPDATE estoque_racao
             SET nome=?, tipo=?, unidade=?, quantidade_atual=?, estoque_minimo=?, custo_unitario=?, fornecedor=?, localizacao=?, validade=?, observacoes=?
             WHERE id=? AND usuario_id=?`,
            [
                nome,
                tipo,
                unidade,
                quantidade,
                minimo,
                custo,
                fornecedor || null,
                localizacao || null,
                validade || null,
                observacoes || null,
                req.params.id,
                usuarioId,
            ]
        );

        if (result.affectedRows === 0) return res.status(404).json({ erro: "Racao nao encontrada" });
        res.json({ mensagem: "Racao atualizada" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao atualizar racao" });
    }
});

router.delete("/racoes/:id", async (req, res) => {
    try {
        await ensureRacaoSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        const [result] = await pool.query("DELETE FROM estoque_racao WHERE id=? AND usuario_id=?", [req.params.id, usuarioId]);
        if (result.affectedRows === 0) return res.status(404).json({ erro: "Racao nao encontrada" });
        res.json({ mensagem: "Racao excluida" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao excluir racao" });
    }
});

router.get("/racoes/movimentacoes", async (req, res) => {
    try {
        await ensureRacaoSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        const [rows] = await pool.query(`
            SELECT
                m.id,
                m.racao_id AS racaoId,
                r.nome AS racaoNome,
                r.unidade,
                m.tipo,
                m.quantidade,
                DATE_FORMAT(m.data, '%Y-%m-%d') AS data,
                m.motivo,
                m.destino,
                m.observacoes
            FROM movimentacoes_racao m
            INNER JOIN estoque_racao r ON r.id = m.racao_id
            WHERE r.usuario_id = ?
            ORDER BY m.data DESC, m.id DESC
            LIMIT 20
        `, [usuarioId]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: "Erro ao listar movimentacoes de racao" });
    }
});

router.post("/racoes/movimentacoes", async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await ensureRacaoSchema();
        const usuarioId = await requireUsuario(req, res);
        if (!usuarioId) return;
        const { racaoId, tipo, quantidade, data, motivo, destino, observacoes } = req.body;
        const idempotencyKey = String(req.headers["x-idempotency-key"] || req.body.idempotencyKey || "").trim() || null;
        const qtd = Number(quantidade || 0);

        if (!racaoId || !tipo || !data || !motivo) return res.status(400).json({ erro: "Preencha os campos obrigatorios" });
        if (tipo === "entrada") return res.status(400).json({ erro: "Entrada de racao deve ser registrada pela compra concluida" });
        if (!["saida", "ajuste"].includes(tipo)) return res.status(400).json({ erro: "Tipo de movimentacao invalido" });
        if (Number.isNaN(qtd) || qtd < 0 || (tipo !== "ajuste" && qtd <= 0)) return res.status(400).json({ erro: "Quantidade invalida" });

        if (idempotencyKey) {
            const [movimentacoesExistentes] = await pool.query(
                `SELECT m.id
                 FROM movimentacoes_racao m
                 INNER JOIN estoque_racao r ON r.id = m.racao_id
                 WHERE m.idempotency_key = ? AND r.usuario_id = ?
                 LIMIT 1`,
                [idempotencyKey, usuarioId]
            );

            if (movimentacoesExistentes.length > 0) {
                return res.status(200).json({
                    id: movimentacoesExistentes[0].id,
                    mensagem: "Movimentacao de racao ja registrada",
                    duplicada: true,
                });
            }
        }

        await conn.beginTransaction();

        const [racoes] = await conn.query("SELECT * FROM estoque_racao WHERE id=? AND usuario_id=?", [racaoId, usuarioId]);
        if (racoes.length === 0) {
            await conn.rollback();
            return res.status(404).json({ erro: "Racao nao encontrada" });
        }

        const racao = racoes[0];
        const novaQuantidade = tipo === "entrada"
            ? Number(racao.quantidade_atual) + qtd
            : tipo === "saida"
                ? Number(racao.quantidade_atual) - qtd
                : qtd;

        if (novaQuantidade < 0) {
            await conn.rollback();
            return res.status(400).json({ erro: "Quantidade insuficiente em estoque" });
        }

        const [result] = await conn.query(
            `INSERT INTO movimentacoes_racao (racao_id, tipo, quantidade, data, motivo, destino, observacoes, idempotency_key)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [racaoId, tipo, qtd, data, motivo, destino || null, observacoes || null, idempotencyKey]
        );
        await conn.query("UPDATE estoque_racao SET quantidade_atual=? WHERE id=?", [novaQuantidade, racaoId]);

        await conn.commit();
        res.status(201).json({ id: result.insertId, mensagem: "Movimentacao de racao registrada" });
    } catch (err) {
        await conn.rollback();
        const idempotencyKey = String(req.headers["x-idempotency-key"] || req.body?.idempotencyKey || "").trim() || null;
        if (err?.code === "ER_DUP_ENTRY" && idempotencyKey) {
            const usuarioId = await requireUsuario(req, res);
            if (!usuarioId) return;
            const [movimentacoesExistentes] = await pool.query(
                `SELECT m.id
                 FROM movimentacoes_racao m
                 INNER JOIN estoque_racao r ON r.id = m.racao_id
                 WHERE m.idempotency_key = ? AND r.usuario_id = ?
                 LIMIT 1`,
                [idempotencyKey, usuarioId]
            );

            if (movimentacoesExistentes.length > 0) {
                return res.status(200).json({
                    id: movimentacoesExistentes[0].id,
                    mensagem: "Movimentacao de racao ja registrada",
                    duplicada: true,
                });
            }
        }

        console.error(err);
        res.status(500).json({ erro: "Erro ao movimentar racao" });
    } finally {
        conn.release();
    }
});

module.exports = router;
