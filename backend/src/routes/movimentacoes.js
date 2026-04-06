import express from "express";
import { listar, criar } from "../controllers/movimentacoesController.js";

const router = express.Router();

router.get("/", listar);
router.post("/", criar);

export default router;