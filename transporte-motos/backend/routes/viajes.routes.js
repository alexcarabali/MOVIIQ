import express from "express";
import { crearViaje, confirmarViaje } from "../controllers/viajes.controller.js";

const router = express.Router();

router.post("/", crearViaje);
router.post("/confirmar", confirmarViaje);

export default router;
