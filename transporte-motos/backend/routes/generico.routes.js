import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

// Identificar el primary key según la tabla
const primaryKeys = {
  administradores: "id_admin",
  usuarios: "id_usuario",
  conductores: "id_conductor",
  viajes: "id_viaje",
  calificaciones: "id_calificacion",
};

// GET - obtener todos
router.get("/:tabla", async (req, res) => {
  const { tabla } = req.params;
  try {
    const [rows] = await pool.query(`SELECT * FROM ??`, [tabla]);
    res.json(rows);
  } catch (err) {
    console.error("❌ ERROR GET:", err);
    res
      .status(500)
      .json({ success: false, message: "Error al cargar los datos" });
  }
});

// POST - crear
router.post("/:tabla", async (req, res) => {
  const { tabla } = req.params;
  const data = req.body;

  try {
    const [result] = await pool.query(`INSERT INTO ?? SET ?`, [tabla, data]);
    res.json({ success: true, insertId: result.insertId });
  } catch (err) {
    console.error("❌ ERROR POST:", err);
    res
      .status(500)
      .json({ success: false, message: "Error al crear el registro" });
  }
});

// PUT - actualizar
router.put("/:tabla/:id", async (req, res) => {
  const { tabla, id } = req.params;
  const data = req.body;

  try {
    const primaryKey = primaryKeys[tabla];
    if (!primaryKey) {
      return res
        .status(400)
        .json({ success: false, message: "Tabla no válida" });
    }

    // Evitar que intente modificar el ID
    delete data[primaryKey];

    const [result] = await pool.query(`UPDATE ?? SET ? WHERE ?? = ?`, [
      tabla,
      data,
      primaryKey,
      id,
    ]);

    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error("❌ ERROR PUT:", err);
    res
      .status(500)
      .json({ success: false, message: "Error al actualizar el registro" });
  }
});

// DELETE - eliminar
router.delete("/:tabla/:id", async (req, res) => {
  const { tabla, id } = req.params;

  try {
    const primaryKey = primaryKeys[tabla];
    if (!primaryKey) {
      return res
        .status(400)
        .json({ success: false, message: "Tabla no válida" });
    }

    const [result] = await pool.query(`DELETE FROM ?? WHERE ?? = ?`, [
      tabla,
      primaryKey,
      id,
    ]);

    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error("❌ ERROR DELETE:", err);
    res
      .status(500)
      .json({ success: false, message: "Error al eliminar el registro" });
  }
});

export default router;
