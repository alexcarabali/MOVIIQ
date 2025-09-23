// server.js
import express from "express";
import pkg from "pg";
import bcrypt from "bcrypt";
import cors from "cors";

const { Pool } = pkg;

const app = express();
app.use(express.json());
app.use(cors());

// conexión a la base de datos
const pool = new Pool({
  user: "desarrollo",
  host: "localhost",
  database: "moviiq",
  password: "1234",
  port: 5432,
});

// ====================== RUTA REGISTER ======================
app.post("/register", async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Todos los campos son requeridos" });
  }

  try {
    // verificar si ya existe el usuario
    const existe = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (existe.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (nombre, email, password) VALUES ($1, $2, $3) RETURNING id, email",
      [nombre, email, hashedPassword]
    );

    res.json({
      success: true,
      user: result.rows[0],
      message: "Usuario registrado con éxito",
    });
  } catch (err) {
    console.error("Error en /register:", err);
    res.status(500).json({ success: false, error: "Error en el registro" });
  }
});

// ====================== RUTA LOGIN ======================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Email y contraseña son requeridos" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res
        .status(400)
        .json({ success: false, message: "Contraseña incorrecta" });
    }

    res.json({
      success: true,
      message: "Login exitoso",
      user: { id: user.id, email: user.email, nombre: user.nombre },
    });
  } catch (err) {
    console.error("Error en /login:", err);
    res.status(500).json({ success: false, error: "Error en el servidor" });
  }
});

// ====================== SERVIDOR ======================
app.listen(4000, () => {
  console.log("✅ Servidor corriendo en http://localhost:4000");
});
