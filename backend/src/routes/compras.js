import express from "express";
import { listar, criar, atualizarStatus, excluir } from "../controllers/comprasController.js";

const router = express.Router();

router.get("/", listar);
router.post("/", criar);
router.patch("/:id/status", atualizarStatus);
router.delete("/:id", excluir);

export default router;