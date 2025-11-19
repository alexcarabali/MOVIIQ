import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

export const obtenerConductoresAprobados = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_conductor, nombre, apellido, telefono, foto_perfil, tipo, marca, modelo, placa, estado_verificacion FROM conductores WHERE estado_verificacion = 'aprobado'`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener conductores" });
  }
};

export const registerConductor = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      telefono,
      password,
      cedula,
      licencia_conduccion,
      fecha_vencimiento_licencia,
      tipo,
      marca,
      modelo,
      placa,
    } = req.body;

    // Validación básica
    if (
      !nombre ||
      !apellido ||
      !email ||
      !telefono ||
      !password ||
      !cedula ||
      !licencia_conduccion ||
      !fecha_vencimiento_licencia ||
      !tipo
    ) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos obligatorios son requeridos",
      });
    }

    // Verificar email repetido
    const [existente] = await pool.query(
      "SELECT * FROM conductores WHERE email = ?",
      [email]
    );

    if (existente.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El correo ya está registrado como conductor",
      });
    }

    // Encriptar contraseña
    const hashed = await bcrypt.hash(password, 10);

    // Insertar conductor
    const [result] = await pool.query(
      `INSERT INTO conductores 
      (nombre, apellido, email, telefono, password_hash, cedula, licencia_conduccion, fecha_vencimiento_licencia, tipo, marca, modelo, placa) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        apellido,
        email,
        telefono,
        hashed,
        cedula,
        licencia_conduccion,
        fecha_vencimiento_licencia,
        tipo,
        marca || null,
        modelo || null,
        placa || null,
      ]
    );

    return res.json({
      success: true,
      message: "Conductor registrado con éxito",
      conductor: { id: result.insertId, nombre, email },
    });
  } catch (err) {
    console.error("Error al registrar conductor:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};
