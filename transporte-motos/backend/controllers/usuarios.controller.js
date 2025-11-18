import { pool } from "../config/db.js";

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
