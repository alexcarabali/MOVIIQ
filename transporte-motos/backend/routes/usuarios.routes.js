import express from "express";
import { obtenerUsuarios } from "../controllers/usuarios.controller.js";

const router = express.Router();
router.get("/", obtenerUsuarios);
export default router;
