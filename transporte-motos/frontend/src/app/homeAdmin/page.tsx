"use client";

import { useState, useEffect } from "react";
import "./page.modules.css";
import {
  Home,
  Star,
  Settings,
  Phone,
  Lock,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { API_URL } from "../utils/api";

type TableName =
  | "administradores"
  | "usuarios"
  | "conductores"
  | "viajes"
  | "calificaciones";

export default function HomeAdmin() {
  const [tabla, setTabla] = useState<TableName>("conductores");
  const [datos, setDatos] = useState<any[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [mostrarSidebar, setMostrarSidebar] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false); // <-- controla la visibilidad del formulario

  const menuItems = [
    { icon: <Home size={22} />, label: "Inicio" },
    { icon: <Star size={22} />, label: "Favoritos" },
    { icon: <Settings size={22} />, label: "Configuración" },
    { icon: <Phone size={22} />, label: "Contacto" },
    { icon: <Lock size={22} />, label: "Cerrar sesión" },
    {
      icon: <Plus size={22} />,
      label: "Agregar registro",
      action: () => setMostrarForm(!mostrarForm), // <-- alterna el formulario
    },
  ];

  const getRowId = (row: any) =>
    row.id ??
    row.id_admin ??
    row.id_conductor ??
    row.id_usuario ??
    row.id_calificacion ??
    row.id_viaje;

  const fetchDatos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/generico/${tabla}`);
      const data = await res.json();
      setDatos(data);

      if (data[0]) {
        const emptyForm: any = {};
        Object.keys(data[0]).forEach((col) => (emptyForm[col] = ""));
        setForm(emptyForm);
      } else {
        setForm({});
      }

      setEditing(null);
    } catch (err) {
      console.error(err);
      setMensaje("⚠️ Error al cargar los datos");
    }
  };

  useEffect(() => {
    fetchDatos();
  }, [tabla]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editing
        ? `${API_URL}/api/generico/${tabla}/${getRowId(editing)}`
        : `${API_URL}/api/generico/${tabla}`;
      const method = editing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        setMensaje(editing ? "✅ Registro actualizado" : "✅ Registro creado");
        setEditing(null);
        setForm({});
        fetchDatos();
        setMostrarForm(false); // <-- oculta el formulario después de agregar/editar
      } else {
        setMensaje("❌ " + (data.message || "Error desconocido"));
      }
    } catch (err) {
      console.error(err);
      setMensaje("⚠️ Error en el servidor");
    }
  };

  const handleEdit = (registro: any) => {
    setEditing(registro);
    setForm({ ...registro });
    setMostrarForm(true); // <-- mostrar el formulario al editar
  };

  const handleDelete = async (row: any) => {
    if (!confirm("¿Seguro que deseas eliminar este registro?")) return;

    try {
      const res = await fetch(
        `${API_URL}/api/generico/${tabla}/${getRowId(row)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        setMensaje("✅ Registro eliminado");
        fetchDatos();
      } else {
        setMensaje("❌ " + (data.message || "Error desconocido"));
      }
    } catch (err) {
      console.error(err);
      setMensaje("⚠️ Error en el servidor");
    }
  };

  return (
    <div className="admin-container">
      {/* ================= SIDEBAR ================= */}
      <aside className={`sidebar ${mostrarSidebar ? "visible" : "oculta"}`}>
        <div className="sidebar-header">
          <h1 className={`sidebar-title ${!mostrarSidebar ? "hidden" : ""}`}>
            Moviiq
          </h1>
          <button
            onClick={() => setMostrarSidebar(!mostrarSidebar)}
            className="btn-toggle"
          >
            {mostrarSidebar ? <ChevronLeft /> : <ChevronRight />}
          </button>
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              className="sidebar-btn"
              onClick={item.action ? item.action : undefined}
            >
              {item.icon}
              <span className={`${!mostrarSidebar ? "hidden" : ""}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {mostrarSidebar && <p>© 2025 Moviiq</p>}
        </div>
      </aside>

      <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
        <header className="admin-header">
          <h1>Panel Admin - CRUD</h1>
        </header>

        {mensaje && <div className="admin-message">{mensaje}</div>}

        <section className="admin-controls">
          <label htmlFor="tabla-select">Seleccionar tabla:</label>
          <select
            id="tabla-select"
            value={tabla}
            onChange={(e) => setTabla(e.target.value as TableName)}
          >
            <option value="administradores">Administradores</option>
            <option value="usuarios">Usuarios</option>
            <option value="conductores">Conductores</option>
            <option value="viajes">Viajes</option>
            <option value="calificaciones">Calificaciones</option>
          </select>
        </section>

        {mostrarForm && (
          <section className="admin-form-section">
            <form onSubmit={handleSubmit} className="admin-form">
              <h2>{editing ? "Editar Registro" : "Agregar Registro"}</h2>

              {Object.keys(form).length === 0 && !editing && (
                <p className="form-info">
                  Selecciona un registro o ingresa datos manualmente.
                </p>
              )}

              {Object.keys(form).map((key) => (
                <input
                  key={key}
                  className="admin-input"
                  placeholder={key}
                  value={form[key] ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              ))}

              <div className="form-buttons">
                <button type="submit" className="btn-primary">
                  {editing ? "Actualizar" : "Agregar"}
                </button>
                {editing && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditing(null);
                      setForm({});
                      setMostrarForm(false);
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        <section className="admin-table-section">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  {datos[0] &&
                    Object.keys(datos[0]).map((col) => (
                      <th key={col}>{col.replace(/_/g, " ")}</th>
                    ))}
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {datos.map((row: any) => (
                  <tr key={getRowId(row)}>
                    {Object.keys(row).map((col) => (
                      <td key={col}>{row[col]}</td>
                    ))}

                    <td className="table-actions">
                      <button
                        className="btn-table edit"
                        onClick={() => handleEdit(row)}
                      >
                        Editar
                      </button>

                      <button
                        className="btn-table delete"
                        onClick={() => handleDelete(row)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

                {datos.length === 0 && (
                  <tr>
                    <td colSpan={Object.keys(form).length + 1}>
                      No hay registros para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
