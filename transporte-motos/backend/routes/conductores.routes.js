import express from "express";
import { obtenerConductoresAprobados } from "../controllers/conductores.controller.js";
import { registerConductor } from "../controllers/conductores.controller.js";

const router = express.Router();
router.get("/aprobados", obtenerConductoresAprobados);
router.post("/register", registerConductor);
export default router;
