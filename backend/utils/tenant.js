const pool = require("../database/conecction");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function getUsuarioId(req) {
    const authorization = String(req.headers.authorization || "");
    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token || !JWT_SECRET) {
        return null;
    }

    const payload = jwt.verify(token, JWT_SECRET);
    const usuarioId = Number(payload.usuarioId);
    return Number.isFinite(usuarioId) && usuarioId > 0 ? usuarioId : null;
}

async function getPrimeiroUsuarioId() {
    const [usuarios] = await pool.query("SELECT id FROM usuarios ORDER BY id ASC LIMIT 1");
    return usuarios[0]?.id || null;
}

async function ensureUsuarioColumn(tableName) {
    const [columns] = await pool.query(
        `
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
        `,
        [tableName]
    );
    const columnNames = new Set(columns.map((column) => column.COLUMN_NAME));

    if (!columnNames.has("usuario_id")) {
        const afterColumn = tableName === "animais" && columnNames.has("id_animal") ? "id_animal" : "id";
        await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN usuario_id INT NULL AFTER \`${afterColumn}\``);
    }

    const primeiroUsuarioId = await getPrimeiroUsuarioId();
    if (primeiroUsuarioId) {
        await pool.query(`UPDATE \`${tableName}\` SET usuario_id = ? WHERE usuario_id IS NULL`, [primeiroUsuarioId]);
    }
}

async function requireUsuario(req, res, tables = []) {
    for (const table of tables) {
        await ensureUsuarioColumn(table);
    }

    let usuarioId = null;

    try {
        usuarioId = getUsuarioId(req);
    } catch (err) {
        res.status(401).json({ erro: "Sessão inválida ou expirada. Faça login novamente." });
        return null;
    }
    if (!usuarioId) {
        res.status(401).json({ erro: "Usuário não identificado. Faça login novamente." });
        return null;
    }

    return usuarioId;
}

module.exports = {
    ensureUsuarioColumn,
    getUsuarioId,
    requireUsuario,
};
