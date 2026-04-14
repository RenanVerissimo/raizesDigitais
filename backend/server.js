const express = require("express");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/auth");
const producaoRoutes = require("./routes/producao");
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/producao", producaoRoutes);
app.get("/", (req, res) => {
    res.json({ message: "API Raízes Digitais funcionando!" });
});
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});