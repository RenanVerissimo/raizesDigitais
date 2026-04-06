import express from "express";
import { listar, criar, excluir } from "../controllers/producoesController.js";

const router = express.Router();

router.get("/", listar);
router.post("/", criar);
router.delete("/:id", excluir);

export default router;