// server.js
import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import cors from "cors";
import { Server } from "socket.io";
import http from "http";

const app = express();
app.use(express.json());

// Configura CORS según tu frontend
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// ====================== CONEXIÓN MYSQL ======================
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "moviiq",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ====================== RUTA REGISTER ======================
app.post("/register", async (req, res) => {
  const { nombre, apellido, email, telefono, password } = req.body;

  if (!nombre || !apellido || !email || !telefono || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Todos los campos son requeridos" });
  }

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
      `INSERT INTO usuarios (nombre, apellido, email, telefono, password_hash) 
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, apellido, email, telefono, hashedPassword]
    );

    res.json({
      success: true,
      user: { id: result.insertId, email, nombre },
      message: "Usuario registrado con éxito",
    });
  } catch (err) {
    console.error("Error en /register:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================== LOGIN UNIFICADO ======================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({
      success: false,
      message: "Email y contraseña son requeridos",
    });

  try {
    console.log("🟡 Intentando login para:", email);

    // Buscar en USUARIOS
    const [usuarios] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );
    if (usuarios.length > 0) {
      const user = usuarios[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match)
        return res
          .status(400)
          .json({ success: false, message: "Contraseña incorrecta" });

      return res.json({
        success: true,
        tipo: "usuario",
        message: "Login exitoso (usuario)",
        user: {
          id: user.id_usuario,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
        },
      });
    }

    // Buscar en ADMINISTRADORES
    const [admins] = await pool.query(
      "SELECT * FROM administradores WHERE email = ?",
      [email]
    );
    if (admins.length > 0) {
      const admin = admins[0];
      const match = await bcrypt.compare(password, admin.password_hash);
      if (!match)
        return res
          .status(400)
          .json({ success: false, message: "Contraseña incorrecta" });

      return res.json({
        success: true,
        tipo: "admin",
        message: "Login exitoso (admin)",
        user: {
          id: admin.id_admin,
          nombre: admin.nombre,
          email: admin.email,
        },
      });
    }

    // Buscar en CONDUCTORES
    const [conductores] = await pool.query(
      "SELECT * FROM conductores WHERE email = ?",
      [email]
    );

    if (conductores.length > 0) {
      const conductor = conductores[0];
      const match = await bcrypt.compare(password, conductor.password_hash);
      if (!match)
        return res
          .status(400)
          .json({ success: false, message: "Contraseña incorrecta" });

      return res.json({
        success: true,
        tipo: "conductor",
        message: "Login exitoso (conductor)",
        user: {
          id: conductor.id_conductor,
          nombre: conductor.nombre,
          apellido: conductor.apellido,
          email: conductor.email,
          telefono: conductor.telefono,
        },
      });
    }

    res.status(404).json({ success: false, message: "Usuario no encontrado" });
  } catch (err) {
    console.error("❌ Error en /login:", err);
    res.status(500).json({
      success: false,
      message: "Error en el servidor",
      error: err.message,
    });
  }
});

// ====================== OBTENER CONDUCTORES ======================
app.get("/api/conductores", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id_conductor,
        nombre,
        apellido,
        telefono,
        foto_perfil,
        tipo,
        marca,
        modelo,
        placa,
        estado_verificacion
      FROM conductores
      WHERE estado_verificacion = 'aprobado'
    `);

    res.json(rows);
  } catch (err) {
    console.error("Error al obtener conductores:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Registro de usuario (alternativo)
app.post("/register-usuario", async (req, res) => {
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
      "INSERT INTO usuarios (nombre, apellido, email, telefono, password_hash) VALUES (?, ?, ?, ?, ?)",
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
});

// Registro de conductor directamente en tabla conductores
app.post("/register-conductor", async (req, res) => {
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

  // Validar campos obligatorios
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

  try {
    const [rows] = await pool.query(
      "SELECT * FROM conductores WHERE email = ?",
      [email]
    );
    if (rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO conductores (
        nombre, apellido, email, password_hash, telefono,
        cedula, licencia_conduccion, fecha_vencimiento_licencia,
        tipo, marca, modelo, placa, estado_verificacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
      [
        nombre,
        apellido,
        email,
        hashedPassword,
        telefono,
        cedula,
        licencia_conduccion,
        fecha_vencimiento_licencia,
        tipo,
        marca || null,
        modelo || null,
        placa || null,
      ]
    );

    res.json({
      success: true,
      message: "Conductor registrado con éxito",
      id_conductor: result.insertId,
    });
  } catch (err) {
    console.error("Error en /register-conductor:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// ================== VIAJES PENDIENTES ==================
app.get("/api/viajesPendientes", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT v.id_viaje, u.nombre AS nombre_pasajero, v.origen, v.destino
      FROM viajes v
      JOIN usuarios u ON u.id_usuario = v.id_usuario
      WHERE v.estado = 'pendiente'
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================== ACTUALIZAR ESTADO CONDUCTOR ==================
app.post("/api/actualizarEstadoConductor", async (req, res) => {
  const { id_conductor, estado } = req.body;
  try {
    await pool.query(
      `UPDATE conductores SET estado = ? WHERE id_conductor = ?`,
      [estado, id_conductor]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

//================= NOTIFICAR NUEVO VIAJE Y SOCKET.IO SETUP ===================

// Crear servidor HTTP y Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // puedes restringir a tu frontend: "http://localhost:3000"
    methods: ["GET", "POST"],
  },
});

// Mapa para almacenar usuarios conectados
// clave = string(id_usuario) -> socket.id
const usuariosConectados = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Usuario conectado:", socket.id);

  // Registrar el usuario (conductor)
  // Aceptamos que el cliente envíe: idUsuario (number|string) o { id, rol }
  socket.on("registrar_usuario", (payload) => {
    try {
      if (!payload) return;
      let idUsuario = payload;
      if (typeof payload === "object") {
        // puede venir { id, rol } o { id_conductor }
        idUsuario = payload.id ?? payload.id_conductor ?? payload.idUsuario;
      }
      if (!idUsuario && idUsuario !== 0) return;
      const key = String(idUsuario);
      usuariosConectados.set(key, socket.id);
      console.log(`✅ Conductor ${key} registrado con socket ${socket.id}`);
    } catch (err) {
      console.warn("Error procesando registrar_usuario:", err);
    }
  });

  // Eliminar usuario al desconectarse
  socket.on("disconnect", () => {
    for (const [id, sId] of usuariosConectados.entries()) {
      if (sId === socket.id) {
        usuariosConectados.delete(id);
        console.log(`🔴 Usuario ${id} desconectado`);
        break;
      }
    }
  });

  // Opcional: conductor acepta viaje (si lo usas)
  socket.on("conductor_acepta_viaje", ({ id_viaje, id_conductor }) => {
    console.log(`✅ Conductor ${id_conductor} aceptó viaje ${id_viaje}`);
    // Podrías actualizar DB aquí o emitir al pasajero, etc.
  });
});

// 📩 Endpoint para notificar al conductor cuando se confirma un viaje
app.post("/api/notificar-conductor", (req, res) => {
  const { id_conductor, viaje } = req.body;

  if (id_conductor == null || !viaje) {
    return res.status(400).json({ ok: false, message: "Datos incompletos" });
  }

  const key = String(id_conductor);
  const socketId = usuariosConectados.get(key);

  if (socketId) {
    io.to(socketId).emit("viaje_asignado", viaje);
    console.log(
      `🚗 Notificación enviada al conductor ${id_conductor} (socket ${socketId})`
    );
    return res.json({ ok: true, message: "Notificación enviada" });
  } else {
    console.log(`⚠️ Conductor ${id_conductor} no conectado`);
    return res.json({ ok: false, message: "Conductor no conectado" });
  }
});

// ================== ACEPTAR VIAJE ==================
app.post("/api/aceptarViaje", async (req, res) => {
  const { id_viaje, id_conductor } = req.body;
  try {
    await pool.query(
      `UPDATE viajes SET id_conductor = ?, estado = 'aceptado' WHERE id_viaje = ?`,
      [id_conductor, id_viaje]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---- Crear viaje (LA VERSIÓN CORREGIDA) ----
app.post("/api/viajes", async (req, res) => {
  const {
    id_pasajero,
    id_conductor,
    id_vehiculo,
    origen_lat,
    origen_lng,
    destino_lat,
    destino_lng,
    precio,
    distancia_km,
    duracion_minutos,
    metodo_pago,
  } = req.body;

  // VALIDACIÓN CORREGIDA (usamos == null para solo bloquear null/undefined)
  if (
    id_pasajero == null ||
    id_conductor == null ||
    origen_lat == null ||
    origen_lng == null ||
    destino_lat == null ||
    destino_lng == null ||
    precio == null
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Faltan campos requeridos" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO viajes (
        id_pasajero, id_conductor, id_vehiculo, origen_lat, origen_lng, destino_lat, destino_lng,
        precio, distancia_km, duracion_minutos, metodo_pago
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_pasajero,
        id_conductor,
        id_vehiculo || null,
        origen_lat,
        origen_lng,
        destino_lat,
        destino_lng,
        precio,
        distancia_km,
        duracion_minutos,
        metodo_pago || "efectivo",
      ]
    );

    const id_viaje = result.insertId;

    // Intentar notificar AL conductor asignado (solo a él) usando usuariosConectados
    const key = String(id_conductor);
    const socketId = usuariosConectados.get(key);

    const payload = {
      id_viaje,
      id_pasajero,
      id_conductor,
      id_vehiculo,
      origen_lat,
      origen_lng,
      destino_lat,
      destino_lng,
      precio,
      distancia_km,
      duracion_minutos,
      metodo_pago: metodo_pago || "efectivo",
    };

    if (socketId) {
      io.to(socketId).emit("viaje_asignado", payload);
      console.log(
        `🚗 Notificación enviada al conductor ${id_conductor} (socket ${socketId})`
      );
    } else {
      console.log(
        `⚠️ Conductor ${id_conductor} no conectado - no se pudo notificar en tiempo real`
      );
    }

    res.status(201).json({ success: true, id_viaje });
  } catch (err) {
    console.error("Error al crear el viaje:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===================== CRUD GENÉRICO =====================

// Obtener todos los registros de cualquier tabla
app.get("/api/:tabla", async (req, res) => {
  const tabla = req.params.tabla;
  try {
    const [rows] = await pool.query(`SELECT * FROM ${tabla}`);
    res.json(rows);
  } catch (err) {
    console.error(`Error al obtener datos de ${tabla}:`, err);
    res
      .status(500)
      .json({ success: false, message: "Error al cargar los datos" });
  }
});

// Eliminar un registro de cualquier tabla
app.delete("/api/:tabla/:id", async (req, res) => {
  const { tabla, id } = req.params;
  try {
    const campoId =
      tabla === "administradores"
        ? "id_admin"
        : tabla === "conductores"
        ? "id_conductor"
        : tabla === "usuarios"
        ? "id_usuario"
        : tabla === "viajes"
        ? "id_viaje"
        : tabla === "calificaciones"
        ? "id_calificacion"
        : null;

    if (!campoId)
      return res
        .status(400)
        .json({ success: false, message: "Tabla no válida" });

    await pool.query(`DELETE FROM ${tabla} WHERE ${campoId} = ?`, [id]);
    res.json({ success: true, message: "Registro eliminado" });
  } catch (err) {
    console.error(`Error al eliminar en ${tabla}:`, err);
    res
      .status(500)
      .json({ success: false, message: "Error al eliminar el registro" });
  }
});

// Actualizar un registro (PUT) genérico
app.put("/api/:tabla/:id", async (req, res) => {
  const { tabla, id } = req.params;
  const data = req.body;

  try {
    const valores = { ...data };

    // Si se actualiza la contraseña de admin/conductor/usuario
    if (
      (tabla === "administradores" ||
        tabla === "conductores" ||
        tabla === "usuarios") &&
      data.password
    ) {
      valores.password_hash = await bcrypt.hash(data.password, 10);
      delete valores.password;
    }

    const campos = Object.keys(valores)
      .map((key) => `${key} = ?`)
      .join(", ");
    const valoresArray = Object.values(valores);

    const campoId =
      tabla === "administradores"
        ? "id_admin"
        : tabla === "conductores"
        ? "id_conductor"
        : tabla === "usuarios"
        ? "id_usuario"
        : tabla === "viajes"
        ? "id_viaje"
        : tabla === "calificaciones"
        ? "id_calificacion"
        : "id";

    await pool.query(`UPDATE ${tabla} SET ${campos} WHERE ${campoId} = ?`, [
      ...valoresArray,
      id,
    ]);

    res.json({ success: true, message: "Registro actualizado" });
  } catch (err) {
    console.error(`Error al actualizar ${tabla}:`, err);
    res.status(500).json({ success: false, message: "Error al actualizar" });
  }
});

// Crear un registro genérico (POST)
app.post("/api/:tabla", async (req, res) => {
  const { tabla } = req.params;
  const data = req.body; // objeto con los campos a insertar

  try {
    const valores = { ...data };

    // Si es administrador o conductor y envían password, encriptarla
    if (
      (tabla === "administradores" ||
        tabla === "conductores" ||
        tabla === "usuarios") &&
      data.password
    ) {
      valores.password_hash = await bcrypt.hash(data.password, 10);
      delete valores.password; // eliminamos la contraseña en texto plano
    }

    const columnas = Object.keys(valores).join(", ");
    const placeholders = Object.keys(valores)
      .map(() => "?")
      .join(", ");

    const [result] = await pool.query(
      `INSERT INTO ${tabla} (${columnas}) VALUES (${placeholders})`,
      Object.values(valores)
    );

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(`Error al crear en ${tabla}:`, err);
    res
      .status(500)
      .json({ success: false, message: "Error al crear el registro" });
  }
});

// ====================== SERVIDOR ======================
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
