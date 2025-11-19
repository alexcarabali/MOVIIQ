import {
  usuariosConectados,
  conductoresConectados,
  pendingResponseTimers,
  DRIVER_RESPONSE_TIMEOUT_MS,
} from "../utils/socketMaps.js";
import { pool } from "../config/db.js";

export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Cliente conectado:", socket.id);

    socket.on("registrar_usuario", (payload) => {
      try {
        if (!payload) return;

        let id =
          payload.id ||
          payload.id_conductor ||
          payload.id_usuario ||
          payload.id_user ||
          null;

        // NORMALIZACIÓN DE ROL (esta parte arregla tu problema)
        let rol =
          payload.rol?.toLowerCase?.() ||
          payload.role?.toLowerCase?.() ||
          payload.tipo?.toLowerCase?.() ||
          payload.user_type?.toLowerCase?.() ||
          null;

        if (!id) return;

        const key = String(id);

        if (rol === "conductor" || rol === "driver") {
          conductoresConectados.set(key, socket.id);
          console.log(
            `🚗 Conductor ${key} registrado correctamente (socket ${socket.id})`
          );
        } else {
          usuariosConectados.set(key, socket.id);
          console.log(
            `👤 Usuario/pasajero ${key} registrado (socket ${socket.id})`
          );
        }

        // OPCIONAL: meter al usuario a una room con su ID
        socket.join(`user_${key}`);
      } catch (err) {
        console.warn("Error procesando registrar_usuario:", err);
      }
    });

    socket.on("respuesta_viaje", async (payload) => {
      try {
        if (!payload || payload.id_viaje == null) return;
        const { id_viaje, id_conductor, aceptado } = payload;

        console.log(
          `📩 Respuesta received from conductor ${id_conductor} for viaje ${id_viaje}: aceptado=${aceptado}`
        );

        const timer = pendingResponseTimers.get(String(id_viaje));
        if (timer) {
          clearTimeout(timer);
          pendingResponseTimers.delete(String(id_viaje));
        }

        if (aceptado) {
          try {
            await pool.query(
              `UPDATE viajes SET id_conductor = ?, estado = 'aceptado' WHERE id_viaje = ?`,
              [id_conductor, id_viaje]
            );
          } catch (err) {
            console.error("Error actualizando viaje a aceptado:", err);
          }
        } else {
          try {
            await pool.query(
              `UPDATE viajes SET estado = 'rechazado' WHERE id_viaje = ?`,
              [id_viaje]
            );
          } catch (err) {
            console.error("Error actualizando viaje a rechazado:", err);
          }
        }

        let id_pasajero = payload.id_pasajero;
        if (!id_pasajero) {
          try {
            const [rows] = await pool.query(
              `SELECT id_pasajero FROM viajes WHERE id_viaje = ?`,
              [id_viaje]
            );
            if (rows.length > 0) id_pasajero = rows[0].id_pasajero;
          } catch (err) {
            console.error("Error obteniendo pasajero para notificar:", err);
          }
        }

        if (id_pasajero != null) {
          const userSocketId = usuariosConectados.get(String(id_pasajero));
          if (userSocketId) {
            io.to(userSocketId).emit("viaje_respuesta", {
              id_viaje,
              id_conductor,
              aceptado,
            });
            console.log(
              `🔔 Notificación enviada al pasajero ${id_pasajero} (socket ${userSocketId}) -> aceptado=${aceptado}`
            );
          } else {
            console.log(
              `⚠️ Pasajero ${id_pasajero} no conectado; no se pudo notificar en tiempo real.`
            );
          }
        } else {
          console.log("⚠️ No se encontró id_pasajero para el viaje", id_viaje);
        }
      } catch (err) {
        console.error("Error manejando respuesta_viaje:", err);
      }
    });

    socket.on("conductor_acepta_viaje", async ({ id_viaje, id_conductor }) => {
      console.log(
        `✅ Conductor ${id_conductor} aceptó viaje ${id_viaje} (evento conductor_acepta_viaje)`
      );
      socket.emit("respuesta_viaje", {
        id_viaje,
        id_conductor,
        aceptado: true,
      });
    });

    socket.on("disconnect", () => {
      for (const [id, sId] of usuariosConectados.entries()) {
        if (sId === socket.id) {
          usuariosConectados.delete(id);
          console.log(`🔴 Usuario/pasajero ${id} desconectado`);
          break;
        }
      }
      for (const [id, sId] of conductoresConectados.entries()) {
        if (sId === socket.id) {
          conductoresConectados.delete(id);
          console.log(`🔴 Conductor ${id} desconectado`);
          break;
        }
      }
    });
  });
};
