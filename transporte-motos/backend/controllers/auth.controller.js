import bcrypt from "bcrypt";
import { pool } from "../config/db.js";

export const registerUsuario = async (req, res) => {
  const { nombre, apellido, email, telefono, password } = req.body;
  if (!nombre || !apellido || !email || !telefono || !password)
    return res.status(400).json({ success: false, message: "Todos los campos son requeridos" });

  try {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (rows.length > 0) return res.status(400).json({ success: false, message: "El correo ya está registrado" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, telefono, password_hash) VALUES (?, ?, ?, ?, ?)`,
      [nombre, apellido, email, telefono, hashedPassword]
    );

    res.json({ success: true, user: { id: result.insertId, nombre, email }, message: "Usuario registrado con éxito" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: "Email y contraseña son requeridos" });

  try {
    const tablas = [
      { tabla: "usuarios", tipo: "usuario", id: "id_usuario" },
      { tabla: "administradores", tipo: "admin", id: "id_admin" },
      { tabla: "conductores", tipo: "conductor", id: "id_conductor" },
    ];

    for (const t of tablas) {
      const [rows] = await pool.query(`SELECT * FROM ${t.tabla} WHERE email = ?`, [email]);
      if (rows.length === 0) continue;
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(400).json({ success: false, message: "Contraseña incorrecta" });

      return res.json({
        success: true,
        tipo: t.tipo,
        user: {
          id: user[t.id],
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
        },
      });
    }

    return res.status(404).json({ success: false, message: "Usuario no encontrado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
};
