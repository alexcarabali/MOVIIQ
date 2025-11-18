import { pool } from "../config/db.js";
import { conductoresConectados, pendingResponseTimers, DRIVER_RESPONSE_TIMEOUT_MS } from "../utils/socketMaps.js";
import { io } from "../server.js"; // server exports io

export const crearViaje = async (req, res) => {
  try {
    const {
      id_pasajero,
      id_conductor,
      origen_lat,
      origen_lng,
      destino_lat,
      destino_lng,
      precio,
      distancia_km,
      duracion_minutos,
      metodo_pago,
    } = req.body;

    if (
      id_pasajero == null ||
      id_conductor == null ||
      origen_lat == null ||
      origen_lng == null ||
      destino_lat == null ||
      destino_lng == null ||
      precio == null
    ) {
      return res.status(400).json({ message: "Faltan datos obligatorios para crear el viaje" });
    }

    const sql = `INSERT INTO viajes (id_pasajero, id_conductor, origen_lat, origen_lng, destino_lat, destino_lng, precio, distancia_km, duracion_minutos, metodo_pago, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`;

    const values = [
      id_pasajero,
      id_conductor,
      origen_lat,
      origen_lng,
      destino_lat,
      destino_lng,
      precio,
      distancia_km || 0,
      duracion_minutos || 0,
      metodo_pago || "efectivo",
    ];

    const [result] = await pool.query(sql, values);
    const id_viaje = result.insertId;

    const key = String(id_conductor);
    const socketId = conductoresConectados.get(key);

    const payload = { id_viaje, id_pasajero, id_conductor, origen_lat, origen_lng, destino_lat, destino_lng, precio, distancia_km: distancia_km || 0, duracion_minutos: duracion_minutos || 0, metodo_pago: metodo_pago || "efectivo" };

    if (socketId) {
      io.to(socketId).emit("viaje_solicitud", payload);

      const timeoutId = setTimeout(async () => {
        try {
          await pool.query(`UPDATE viajes SET estado = 'rechazado' WHERE id_viaje = ?`, [id_viaje]);
          // passenger notification handled in sockets module if needed
        } catch (err) {
          console.error("Error manejando timeout de respuesta del conductor:", err);
        } finally {
          pendingResponseTimers.delete(String(id_viaje));
        }
      }, DRIVER_RESPONSE_TIMEOUT_MS);

      pendingResponseTimers.set(String(id_viaje), timeoutId);
    }

    return res.status(201).json({ message: "Viaje creado correctamente", id_viaje });
  } catch (error) {
    console.error("Error en crearViaje:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const confirmarViaje = async (req, res) => {
  return crearViaje(req, res);
};
