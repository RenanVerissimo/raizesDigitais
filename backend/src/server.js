import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import { db } from "./config/database.js";
import animaisRouter from "./routes/animais.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas da API
app.use("/api/animais", animaisRouter);

// Serve o frontend
app.use(express.static(path.join(__dirname, "../../build")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});