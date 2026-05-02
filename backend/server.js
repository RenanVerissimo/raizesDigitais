const express = require("express");
const cors = require("cors");
require("dotenv").config();

const producaoRoutes = require("./routes/producao");
const animaisRoutes = require("./routes/animais");
const comprasRouter = require("./routes/compras");
const receitasRouter = require("./routes/receitas");


const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/producao", producaoRoutes);
app.use("/api/animais", animaisRoutes);
app.use("/api/compras", comprasRouter);
app.use("/api/receitas", receitasRouter);

app.get("/", (req, res) => {
    res.json({ message: "API Raízes Digitais funcionando!" });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});