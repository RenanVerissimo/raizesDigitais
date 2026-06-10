/* const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "12340",
    database: process.env.DB_NAME || "raizes_digitais",
    waitForConnections: true,
    connectionLimit: 10,
});

module.exports = pool; */

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "12340",
    database: process.env.DB_NAME || "raizes_digitais",
    port: process.env.DB_PORT || 3306,

    waitForConnections: true,
    connectionLimit: 10,
});

module.exports = pool;