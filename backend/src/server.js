import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { db } from "./config/database.js";
import animaisRouter from "./routes/animais.js";
import usuariosRouter from "./routes/usuarios.js";
import producoesRouter from "./routes/producoes.js";
import comprasRouter from "./routes/compras.js";
import receitasRouter from "./routes/receitas.js";
import tanquesRouter from "./routes/tanques.js";
import movimentacoesRouter from "./routes/movimentacoes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas da API
app.use("/api/animais", animaisRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/producoes", producoesRouter);
app.use("/api/compras", comprasRouter);
app.use("/api/receitas", receitasRouter);
app.use("/api/tanques", tanquesRouter);
app.use("/api/movimentacoes", movimentacoesRouter);

// Serve o frontend
app.use(express.static(path.join(__dirname, "../../build")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});