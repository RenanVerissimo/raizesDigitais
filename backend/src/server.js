import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { db } from "./config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve os arquivos do frontend
app.use(express.static(path.join(__dirname, "../../build")));

// Abre o frontend na rota principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../build", "index.html"));
});

// Rota de teste da API
app.get("/api/status", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ mensagem: "🌱 API funcionando!", db: "✅ Conectado ao MySQL!" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});