"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
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

// Iconos personalizados
const iconConductor = new L.Icon({
  iconUrl: "/icons/car.png",
  iconSize: [35, 35],
});

const iconPasajero = new L.Icon({
  iconUrl: "/icons/passenger.png",
  iconSize: [35, 35],
});

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

  // Socket.io conexión
  useEffect(() => {
    const socket = io("http://localhost:4000");

    socket.on("connect", () => {
      setConectado(true);
      setNotificaciones((prev) => [
        ...prev,
        "✅ Conectado al servidor de viajes",
      ]);
    });

    socket.on("disconnect", () => {
      setConectado(false);
      setNotificaciones((prev) => [...prev, "❌ Desconectado del servidor"]);
    });

    socket.on("nuevo_viaje", (viaje: any) => {
      setViajes((prev) => [...prev, viaje]);
      setNotificaciones((prev) => [
        ...prev,
        `🆕 Nuevo viaje disponible de ${viaje.origen} a ${viaje.destino}`,
      ]);
      audioRef.current?.play();
    });

    return () => socket.disconnect();
  }, []);

  // Obtener ubicación actual
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosicion([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  const cambiarEstado = () => {
    const nuevoEstado = estado === "disponible" ? "ocupado" : "disponible";
    setEstado(nuevoEstado);
    setNotificaciones((prev) => [
      ...prev,
      `🟢 Estado cambiado a: ${nuevoEstado}`,
    ]);
  };

  const aceptarViaje = (id: number) => {
    alert(`✅ Viaje ${id} aceptado`);
    setNotificaciones((prev) => [...prev, `🚖 Aceptaste el viaje ${id}`]);
    setViajes((prev) => prev.filter((v) => v.id_viaje !== id));
  };

  const menuItems = [
    { icon: <Home size={22} />, label: "Inicio" },
    { icon: <Bell size={22} />, label: "Notificaciones", evento: "abrirNoti" },
    { icon: <Settings size={22} />, label: "Configuración" },
    { icon: <LogOut size={22} />, label: "Cerrar sesión" },
  ];

  // POE — Evento click en notificaciones
  const manejarEventoSidebar = (evento: string) => {
    if (evento === "abrirNoti") {
      setMostrarNotificaciones(!mostrarNotificaciones);
    }
  };

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

        {/* Estado conexión */}
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
            <strong>Nombre:</strong> {conductor?.nombre || "John"}{" "}
            {conductor?.apellido || "Doe"}
          </p>
          <p>
            <strong>Vehículo:</strong> Nissan Versa (ABC123)
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
                  position={[v.lat_origen || 0, v.lng_origen || 0]}
                  icon={iconPasajero}
                >
                  <Popup>
                    <strong>{v.nombre_pasajero}</strong>
                    <br />
                    {v.origen} → {v.destino}
                    <br />
                    <button
                      onClick={() => aceptarViaje(v.id_viaje)}
                      className="btn-aceptar"
                    >
                      Aceptar
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
