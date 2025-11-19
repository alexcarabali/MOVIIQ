"use client";

import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import {
  Home,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./page.modules.css";
import socket from "../utils/socket";
import { useAuth } from "../context/AuthContext";

/* ICONOS */
const iconConductor = new L.Icon({
  iconUrl: "/icons/car.png",
  iconSize: [35, 35],
});
const iconPasajero = new L.Icon({
  iconUrl: "/icons/passenger.png",
  iconSize: [35, 35],
});

export default function HomeConductor() {
  const auth = useAuth?.();
  const user = (auth as any)?.user ?? null;

  const [viajes, setViajes] = useState<any[]>([]);
  const [solicitud, setSolicitud] = useState<any | null>(null);
  const [posicion, setPosicion] = useState<[number, number] | null>(null);
  const [estado, setEstado] = useState<"disponible" | "ocupado">("disponible");
  const [conectado, setConectado] = useState(false);
  const [conductor, setConductor] = useState<any>(null);
  const [mostrarSidebar, setMostrarSidebar] = useState(false);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [notificaciones, setNotificaciones] = useState<string[]>([]);
  const [viajeActivo, setViajeActivo] = useState<any | null>(null);
  const [pathPoints, setPathPoints] = useState<[number, number][]>([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const socketRef = useRef<Socket | null>(socket ?? null);
  const seguimientoIntervalRef = useRef<number | null>(null);

  // load conductor from context/localStorage
  useEffect(() => {
    try {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem("conductor")
          : null;
      const parsed = saved ? JSON.parse(saved) : null;
      setConductor(user ?? parsed);
    } catch {
      setConductor(user ?? null);
    }
  }, [user]);

  // socket listeners
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    const id_conductor =
      conductor?.id_conductor ?? conductor?.id ?? conductor?.id_usuario ?? null;

    const onConnect = () => {
      setConectado(true);
      setNotificaciones((p) => [...p, "🟢 Conectado al servidor"]);
      if (id_conductor) {
        s.emit("registrar_usuario", { id: id_conductor, rol: "conductor" });
      }
    };

    const onDisconnect = () => {
      setConectado(false);
      setNotificaciones((p) => [...p, "🔴 Desconectado del servidor"]);
    };

    // Accept multiple incoming event names for compatibility
    const onSolicitud = (viaje: any) => {
      const targetId =
        conductor?.id_conductor ??
        conductor?.id ??
        conductor?.id_usuario ??
        null;
      if (!targetId) return;
      if (String(viaje.id_conductor) !== String(targetId)) return;

      setViajes((prev) => {
        // avoid duplicates by id_viaje
        if (
          prev.some(
            (v) =>
              String(v.id_viaje ?? v.id) === String(viaje.id_viaje ?? viaje.id)
          )
        )
          return prev;
        return [...prev, viaje];
      });
      setSolicitud(viaje);
      setNotificaciones((p) => [
        ...p,
        `🚖 Nueva solicitud de viaje (${viaje.id_viaje ?? viaje.id ?? "?"})`,
      ]);
      audioRef.current?.play().catch(() => {});
    };

    const onAsignado = (viaje: any) => {
      // same handling as solicitud
      onSolicitud(viaje);
    };

    const onIniciarForzado = (payload: any) => {
      const id = payload?.id_conductor ?? payload?.conductor_id;
      if (!id || String(id) !== String(id_conductor)) return;
      setViajeActivo(payload.viaje ?? payload);
      setNotificaciones((p) => [...p, `▶️ Forzando inicio viaje`]);
    };

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("viaje_solicitud", onSolicitud);
    s.on("solicitar_viaje", onSolicitud);
    s.on("nuevo_viaje", onSolicitud);
    s.on("viaje_asignado", onAsignado);
    s.on("iniciar_seguimiento", onIniciarForzado);

    if (s.connected) onConnect();

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("viaje_solicitud", onSolicitud);
      s.off("solicitar_viaje", onSolicitud);
      s.off("nuevo_viaje", onSolicitud);
      s.off("viaje_asignado", onAsignado);
      s.off("iniciar_seguimiento", onIniciarForzado);
    };
  }, [conductor]);

  // geolocation initial
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosicion([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.warn("Geo error:", err),
      { enableHighAccuracy: true }
    );
  }, []);

  // tracking: when viajeActivo is set, send location every 2s
  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;

    if (!viajeActivo) {
      if (seguimientoIntervalRef.current) {
        window.clearInterval(seguimientoIntervalRef.current);
        seguimientoIntervalRef.current = null;
      }
      return;
    }

    const sendLocation = () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosicion([lat, lng]);
          setPathPoints((prev) => [...prev, [lat, lng]]);
          s.emit("ubicacion_conductor", {
            id_viaje: viajeActivo.id_viaje ?? viajeActivo.id,
            id_conductor: conductor?.id_conductor ?? conductor?.id,
            lat,
            lng,
            timestamp: Date.now(),
          });
        },
        (err) => console.warn("Geo (seguimiento) error:", err),
        { enableHighAccuracy: true }
      );
    };

    sendLocation();
    const id = window.setInterval(sendLocation, 2000);
    seguimientoIntervalRef.current = id;
    return () => {
      if (seguimientoIntervalRef.current) {
        window.clearInterval(seguimientoIntervalRef.current);
        seguimientoIntervalRef.current = null;
      }
    };
  }, [viajeActivo, conductor]);

  // functions
  const cambiarEstado = () => {
    const nuevo = estado === "disponible" ? "ocupado" : "disponible";
    setEstado(nuevo);
    socketRef.current?.emit("actualizar_estado", {
      id_conductor: conductor?.id_conductor ?? conductor?.id,
      estado: nuevo,
    });
    setNotificaciones((p) => [...p, `🔄 Estado cambiado: ${nuevo}`]);
  };

  const responderSolicitud = (aceptado: boolean) => {
    if (!solicitud) return;
    const id_viaje = solicitud.id_viaje ?? solicitud.id;
    socketRef.current?.emit("respuesta_viaje", {
      id_viaje,
      id_conductor: conductor?.id_conductor ?? conductor?.id,
      aceptado,
      id_pasajero:
        solicitud.id_pasajero ??
        solicitud.id_usuario ??
        solicitud.id_usuario_pasajero,
    });

    setNotificaciones((p) => [
      ...p,
      aceptado
        ? `✅ Aceptaste viaje ${id_viaje}`
        : `❌ Rechazaste viaje ${id_viaje}`,
    ]);

    if (aceptado) {
      // start local viajeActivo and let server notify passenger
      setViajeActivo({ ...solicitud });
      setViajes((prev) =>
        prev.filter((v) => String(v.id_viaje ?? v.id) !== String(id_viaje))
      );
      // emit viaje_iniciado for compatibility; server likely should re-emit to passenger
      socketRef.current?.emit("viaje_iniciado", {
        id_viaje,
        id_conductor: conductor?.id_conductor ?? conductor?.id,
        id_pasajero:
          solicitud.id_pasajero ??
          solicitud.id_usuario ??
          solicitud.id_usuario_pasajero,
        viaje: solicitud,
      });
    } else {
      setViajes((prev) =>
        prev.filter((v) => v.id_viaje !== solicitud.id_viaje)
      );
    }

    setSolicitud(null);
  };

  const finalizarViaje = () => {
    if (!viajeActivo) return;
    const id_viaje = viajeActivo.id_viaje ?? viajeActivo.id;
    socketRef.current?.emit("finalizar_viaje", {
      id_viaje,
      id_conductor: conductor?.id_conductor ?? conductor?.id,
    });
    setViajeActivo(null);
    setPathPoints([]);
    setNotificaciones((p) => [...p, `🏁 Viaje ${id_viaje} finalizado`]);
  };

  const manejarEventoSidebar = (evento: string) => {
    if (evento === "abrirNoti")
      setMostrarNotificaciones(!mostrarNotificaciones);
  };

  // UI
  const menuItems = [
    { icon: <Home size={22} />, label: "Inicio" },
    { icon: <Bell size={22} />, label: "Notificaciones", evento: "abrirNoti" },
    { icon: <Settings size={22} />, label: "Configuración" },
    { icon: <LogOut size={22} />, label: "Cerrar sesión" },
  ];

  return (
    <div className="home-container">
      <audio ref={audioRef} src="/sounds/alert.mp3" preload="auto" />

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

      <div className="container-general">
        <div className="info-conductor">
          <div
            className={`estado-conexion ${
              conectado ? "text-green-600" : "text-red-500"
            }`}
          >
            {conectado ? "🟢 Conectado" : "🔴 Desconectado"}
          </div>

          <div className="card-datos">
            <p>
              <strong>Nombre:</strong> {conductor?.nombre || "—"}
            </p>
            <p>
              <strong>Vehículo:</strong> {conductor?.vehiculo || "—"} (
              {conductor?.placa || "—"})
            </p>
            <p>
              <strong>Estado:</strong>{" "}
              <span
                className={
                  estado === "disponible" ? "text-green-600" : "text-red-600"
                }
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

            {viajeActivo && (
              <button
                onClick={finalizarViaje}
                className="btn-rechazar"
                style={{ marginLeft: 12 }}
              >
                Finalizar viaje
              </button>
            )}
          </div>
        </div>

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

              {(solicitud || viajeActivo) && (
                <>
                  <Marker
                    position={[
                      (solicitud ?? viajeActivo).origen_lat,
                      (solicitud ?? viajeActivo).origen_lng,
                    ]}
                    icon={iconPasajero}
                  >
                    <Popup>Origen pasajero</Popup>
                  </Marker>
                  <Marker
                    position={[
                      (solicitud ?? viajeActivo).destino_lat,
                      (solicitud ?? viajeActivo).destino_lng,
                    ]}
                    icon={iconPasajero}
                  >
                    <Popup>Destino pasajero</Popup>
                  </Marker>
                </>
              )}

              {viajes.map((v) => (
                <Marker
                  key={v.id_viaje ?? v.id}
                  position={[v.origen_lat, v.origen_lng]}
                  icon={iconPasajero}
                >
                  <Popup>
                    <strong>{v.nombre_pasajero || "Pasajero"}</strong>
                    <br />
                    <button
                      onClick={() => setSolicitud(v)}
                      className="btn-aceptar"
                    >
                      Ver solicitud
                    </button>
                  </Popup>
                </Marker>
              ))}

              {pathPoints.length > 0 && <Polyline positions={pathPoints} />}

              {viajeActivo && posicion && (
                <Polyline
                  positions={[
                    posicion,
                    [viajeActivo.origen_lat, viajeActivo.origen_lng],
                  ]}
                />
              )}
            </MapContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-center">
            📍 Obteniendo ubicación...
          </p>
        )}
      </div>

      {mostrarNotificaciones && (
        <div className="notificaciones-panel animate-fade-in">
          <h2 className="titulo-noti">🔔 Notificaciones</h2>
          {notificaciones.length > 0 ? (
            notificaciones
              .slice()
              .reverse()
              .map((n, i) => (
                <div key={i} className="noti-item">
                  <MapPin size={16} />
                  <span>{n}</span>
                </div>
              ))
          ) : (
            <p className="text-gray-400 text-sm">Sin notificaciones.</p>
          )}
        </div>
      )}

      {solicitud && (
        <div className="popup-solicitud">
          <div className="popup-card">
            <h2>📩 Nueva solicitud</h2>
            <p>
              <strong>Origen:</strong> {solicitud.origen_lat},{" "}
              {solicitud.origen_lng}
            </p>
            <p>
              <strong>Destino:</strong> {solicitud.destino_lat},{" "}
              {solicitud.destino_lng}
            </p>
            <div className="popup-actions">
              <button
                className="btn-aceptar"
                onClick={() => responderSolicitud(true)}
              >
                Aceptar
              </button>
              <button
                className="btn-rechazar"
                onClick={() => responderSolicitud(false)}
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
