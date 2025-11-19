import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

export const obtenerUsuarios = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id_usuario, nombre, apellido, email, telefono FROM usuarios"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener usuarios" });
  }
};

export const registerUsuario = async (req, res) => {
  const { nombre, apellido, email, telefono, password } = req.body;
  if (!nombre || !apellido || !email || !telefono || !password)
    return res
      .status(400)
      .json({ success: false, message: "Todos los campos son requeridos" });

  try {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);
    if (rows.length > 0)
      return res
        .status(400)
        .json({ success: false, message: "El correo ya está registrado" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, telefono, password_hash) VALUES (?, ?, ?, ?, ?)`,
      [nombre, apellido, email, telefono, hashedPassword]
    );

    res.json({
      success: true,
      user: { id: result.insertId, nombre, email },
      message: "Usuario registrado con éxito",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};
