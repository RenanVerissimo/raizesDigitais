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
const mysql = require("mysql2/promise");
require("dotenv").config();
const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "12340",
    database: process.env.DB_NAME || "raizes_digitais",
    port: process.env.DB_PORT || 3306,

    waitForConnections: true,
    connectionLimit: 10,
});

console.log({
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
});

module.exports = pool;