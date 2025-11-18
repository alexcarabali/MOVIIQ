import express from "express";
import { registerUsuario, login } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerUsuario);
router.post("/login", login);

export default router;
