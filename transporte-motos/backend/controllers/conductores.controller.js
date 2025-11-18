import { pool } from "../config/db.js";

export const obtenerConductoresAprobados = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id_conductor, nombre, apellido, telefono, foto_perfil, tipo, marca, modelo, placa, estado_verificacion FROM conductores WHERE estado_verificacion = 'aprobado'`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error al obtener conductores" });
  }
};
