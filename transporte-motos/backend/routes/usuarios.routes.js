import express from "express";
import { obtenerUsuarios } from "../controllers/usuarios.controller.js";
import { registerUsuario } from "../controllers/usuarios.controller.js";

const router = express.Router();
router.get("/", obtenerUsuarios);
router.post("/register", registerUsuario);
export default router;
