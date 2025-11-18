import express from "express";
import { obtenerConductoresAprobados } from "../controllers/conductores.controller.js";

const router = express.Router();
router.get("/aprobados", obtenerConductoresAprobados);
export default router;
