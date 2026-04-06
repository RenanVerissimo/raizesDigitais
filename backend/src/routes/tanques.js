import express from "express";
import { listar, criar, atualizar, excluir } from "../controllers/tanquesController.js";

const router = express.Router();

router.get("/", listar);
router.post("/", criar);
router.patch("/:id", atualizar);
router.delete("/:id", excluir);

export default router;