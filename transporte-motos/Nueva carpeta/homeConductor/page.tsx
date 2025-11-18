"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  Home,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./page.modules.css";

// ================= ICONOS =================
const iconConductor = new L.Icon({
  iconUrl: "/icons/car.png",
  iconSize: [35, 35],
});

const iconPasajero = new L.Icon({
  iconUrl: "/icons/passenger.png",
  iconSize: [35, 35],
});

// =====================================================
// ===============  COMPONENTE PRINCIPAL  ==============
// =====================================================

export default function HomeConductor() {
  const [viajes, setViajes] = useState<any[]>([]);
  const [posicion, setPosicion] = useState<[number, number] | null>(null);
  const [conectado, setConectado] = useState(false);
  const [estado, setEstado] = useState("disponible");
  const [conductor, setConductor] = useState<any>(null);
  const [mostrarSidebar, setMostrarSidebar] = useState(false);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [notificaciones, setNotificaciones] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // =====================================================
  // ===================== SOCKET.IO =====================
  // =====================================================
  useEffect(() => {
    // Cargar datos del conductor desde localStorage
    const data = localStorage.getItem("conductor");
    const conductorGuardado = data ? JSON.parse(data) : null;
    setConductor(conductorGuardado);

    const socket = io("http://localhost:4000");
    socketRef.current = socket;

    // 🔵 Conexión
    socket.on("connect", () => {
      setConectado(true);
      setNotificaciones((prev) => [...prev, "🟢 Conectado al servidor"]);

      if (conductorGuardado) {
        // Registrar el conductor con su id REAL
        socket.emit("registrar_usuario", conductorGuardado.id);
        console.log("🟢 Conductor registrado en socket:", conductorGuardado.id);
      }
    });

    // 🔴 Desconexión
    socket.on("disconnect", () => {
      setConectado(false);
      setNotificaciones((prev) => [...prev, "🔴 Desconectado del servidor"]);
    });

    // =====================================================
    // =============  VIAJE ASIGNADO CORRECTO  =============
    // =====================================================
    socket.on("viaje_asignado", (viaje) => {
      console.log("📩 Evento viaje_asignado recibido:", viaje);

      if (!conductor || viaje.id_conductor !== conductor.id) {
        console.log("⛔ Este viaje no es para este conductor");
        return;
      }

      setViajes((prev) => [...prev, viaje]);

      setNotificaciones((prev) => [
        ...prev,
        `🚖 Viaje asignado: (${viaje.origen_lat}, ${viaje.origen_lng}) → (${viaje.destino_lat}, ${viaje.destino_lng})`,
      ]);

      audioRef.current?.play();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // =====================================================
  // =================== GEOLOCALIZACIÓN =================
  // =====================================================
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosicion([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  // =====================================================
  // ===================== FUNCIONES =====================
  // =====================================================

  const cambiarEstado = () => {
    const nuevo = estado === "disponible" ? "ocupado" : "disponible";
    setEstado(nuevo);

    setNotificaciones((prev) => [...prev, `🔄 Estado cambiado a: ${nuevo}`]);
  };

  const aceptarViaje = (id: number) => {
    alert(`✔ Viaje ${id} aceptado`);

    setNotificaciones((prev) => [...prev, `🚖 Aceptaste el viaje ${id}`]);

    setViajes((prev) => prev.filter((v) => v.id_viaje !== id));

    if (socketRef.current && conductor) {
      socketRef.current.emit("conductor_acepta_viaje", {
        id_viaje: id,
        id_conductor: conductor.id,
      });
    }
  };

  const manejarEventoSidebar = (evento: string) => {
    if (evento === "abrirNoti") {
      setMostrarNotificaciones(!mostrarNotificaciones);
    }
  };

  // =====================================================
  // ========================= UI ========================
  // =====================================================

  const menuItems = [
    { icon: <Home size={22} />, label: "Inicio" },
    { icon: <Bell size={22} />, label: "Notificaciones", evento: "abrirNoti" },
    { icon: <Settings size={22} />, label: "Configuración" },
    { icon: <LogOut size={22} />, label: "Cerrar sesión" },
  ];

  return (
    <div className="home-container">
      <audio ref={audioRef} src="/sounds/alert.mp3" preload="auto" />

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
              onClick={() =>
                manejarEventoSidebar(item.evento || item.label.toLowerCase())
              }
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

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div className="container-general">
        <h1 className="titulo-conductor">🚗 Panel del Conductor</h1>

        <div
          className={`estado-conexion ${
            conectado ? "text-green-600" : "text-red-500"
          }`}
        >
          {conectado ? "🟢 Conectado al servidor" : "🔴 Desconectado"}
        </div>

        {/* Info conductor */}
        <div className="card-datos">
          <p>
            <strong>Nombre:</strong> {conductor?.nombre || "—"}
          </p>
          <p>
            <strong>Vehículo:</strong> {conductor?.vehiculo || "Desconocido"} (
            {conductor?.placa || "—"})
          </p>
          <p>
            <strong>Estado:</strong>{" "}
            <span
              className={`${
                estado === "disponible" ? "text-green-600" : "text-red-500"
              }`}
            >
              {estado}
            </span>
          </p>
          <button
            onClick={cambiarEstado}
            className={`btn-estado ${
              estado === "disponible"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            Cambiar a {estado === "disponible" ? "ocupado" : "disponible"}
          </button>
        </div>

        {/* Mapa */}
        {posicion ? (
          <div className="mapa-container">
            <MapContainer center={posicion} zoom={14} className="mapa-leaflet">
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker position={posicion} icon={iconConductor}>
                <Popup>Tu ubicación actual</Popup>
              </Marker>

              {viajes.map((v) => (
                <Marker
                  key={v.id_viaje}
                  position={[v.origen_lat, v.origen_lng]}
                  icon={iconPasajero}
                >
                  <Popup>
                    <strong>{v.nombre_pasajero || "Pasajero"}</strong>
                    <br />({v.origen_lat}, {v.origen_lng}) → ({v.destino_lat},{" "}
                    {v.destino_lng})
                    <br />
                    <button
                      onClick={() => aceptarViaje(v.id_viaje)}
                      className="btn-aceptar"
                    >
                      Aceptar viaje
                    </button>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-center">
            📍 Obteniendo tu ubicación...
          </p>
        )}
      </div>

      {/* ================= PANEL DE NOTIFICACIONES ================= */}
      {mostrarNotificaciones && (
        <div className="notificaciones-panel animate-fade-in">
          <h2 className="titulo-noti">🔔 Notificaciones</h2>
          {notificaciones.length > 0 ? (
            notificaciones
              .slice()
              .reverse()
              .map((n, idx) => (
                <div key={idx} className="noti-item">
                  <MapPin size={16} />
                  <span>{n}</span>
                </div>
              ))
          ) : (
            <p className="text-gray-400 text-sm">Sin notificaciones aún.</p>
          )}
        </div>
      )}
    </div>
  );
}
