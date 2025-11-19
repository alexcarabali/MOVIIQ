// app/(whatever)/ConfirmarRutaPage.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "./page.modules.css";
import dynamic from "next/dynamic";
import socket from "../utils/socket"; // instancia cliente socket.io (singleton)
import { API_URL } from "../utils/api";
import {
  Home,
  Star,
  Settings,
  Phone,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/**
 * ConfirmarRutaPage
 * - Confirma el viaje con un conductor
 * - Escucha eventos socket para iniciar seguimiento:
 *    -> 'viaje_iniciado'  (conductor aceptó y/o backend lo notifica)
 *    -> 'ubicacion_conductor' (posiciones periódicas del conductor)
 *    -> 'finalizar_viaje' (viaje finalizado)
 *
 * Requiere que en ../components/MapaLeaflet exista soporte para:
 *   props: origen, destino, setPrecio, conductorPos?, conductorPath?, viajeActivo?
 *
 * También requiere ../utils/socket que exporte la instancia singleton del cliente.
 */

export default function ConfirmarRutaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ready, setReady] = useState(false);
  const [paramsListos, setParamsListos] = useState(false);

  const [origen, setOrigen] = useState<[number, number] | null>(null);
  const [destino, setDestino] = useState<[number, number] | null>(null);
  const [precioViaje, setPrecioViaje] = useState<number>(0);
  const [mostrarSidebar, setMostrarSidebar] = useState(false);

  const menuItems = [
    { icon: <Home size={22} />, label: "Inicio" },
    { icon: <Star size={22} />, label: "Favoritos" },
    { icon: <Settings size={22} />, label: "Configuración" },
    { icon: <Phone size={22} />, label: "Contacto" },
    { icon: <Lock size={22} />, label: "Cerrar sesión" },
  ];

  // activar render en cliente
  useEffect(() => setReady(true), []);

  // Import dinámico para evitar SSR con Leaflet
  const MapaLeaflet = dynamic(() => import("../components/MapaLeaflet"), {
    ssr: false,
  });

  // lectura segura de coords desde query params
  useEffect(() => {
    const oLng = parseFloat(searchParams.get("origenLng") || "-76.532");
    const oLat = parseFloat(searchParams.get("origenLat") || "3.4516");
    const dLng = parseFloat(searchParams.get("destinoLng") || "-76.52");
    const dLat = parseFloat(searchParams.get("destinoLat") || "3.41");
    const p = parseInt(searchParams.get("precio") || "8000", 10) || 0;

    setOrigen([oLat, oLng]);
    setDestino([dLat, dLng]);
    setPrecioViaje(p);

    setParamsListos(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // estados principales
  const [distancia, setDistancia] = useState<number | null>(null);
  const [duracion, setDuracion] = useState<number | null>(null);
  const [estado, setEstado] = useState<
    | "buscando"
    | "confirmando"
    | "confirmado"
    | "viaje_en_curso"
    | "finalizado"
    | "cancelado"
  >("buscando");

  const [conductores, setConductores] = useState<any[]>([]);
  const [conductorSeleccionado, setConductorSeleccionado] = useState<any>(null);
  const [loadingConfirmar, setLoadingConfirmar] = useState(false);
  const [loadingConductores, setLoadingConductores] = useState(true);

  // datos para seguimiento en tiempo real (pasajero)
  const [viajeActivo, setViajeActivo] = useState<any | null>(null); // objeto viaje con id_viaje etc.
  const [ubicacionConductor, setUbicacionConductor] = useState<
    [number, number] | null
  >(null);
  const [pathConductor, setPathConductor] = useState<[number, number][]>([]);

  // ref para comparar eventos con el viaje actual
  const viajeIdRef = useRef<number | null>(null);

  // ------------------------------
  // registrar pasajero en socket
  // ------------------------------
  useEffect(() => {
    try {
      const usuario =
        localStorage.getItem("usuario") || localStorage.getItem("pasajero");

      if (usuario) {
        const obj = JSON.parse(usuario);
        const idPasajero =
          obj?.id || obj?.id_usuario || obj?.id_pasajero || null;

        if (idPasajero) {
          socket.emit("registrarPasajero", idPasajero);
          console.log("✔ Pasajero registrado en socket:", idPasajero);
        }
      }
    } catch (e) {
      console.warn("No se pudo registrar pasajero en socket.", e);
    }
  }, []);

  // ------------------------------
  // cargar conductores disponibles
  // ------------------------------
  useEffect(() => {
    const cargarConductores = async () => {
      setLoadingConductores(true);
      try {
        const res = await fetch(`${API_URL}/api/conductores/aprobados`);
        const data = await res.json();
        setConductores(Array.isArray(data) ? data : []);
        setEstado("confirmando");
      } catch (error) {
        console.error("Error al obtener conductores", error);
        alert("Error cargando conductores.");
      } finally {
        setLoadingConductores(false);
      }
    };

    cargarConductores();
  }, []);

  // ------------------------------
  // calcular distancia y duración (haversine simple)
  // ------------------------------
  useEffect(() => {
    if (!origen || !destino) return;

    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(destino[0] - origen[0]);
    const dLng = toRad(destino[1] - origen[1]);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(origen[0])) *
        Math.cos(toRad(destino[0])) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanciaKm = R * c;

    setDistancia(distanciaKm);
    setDuracion((distanciaKm / 40) * 60); // asumiendo 40 km/h promedio
  }, [origen, destino]);

  // ------------------------------
  // confirmar viaje: guarda en BD y notifica conductor vía socket
  // ------------------------------
  const handleConfirmar = async () => {
    if (!conductorSeleccionado)
      return alert("Selecciona un conductor antes de confirmar.");
    if (!origen || !destino) return alert("Error en las coordenadas.");

    // obtener id pasajero desde storage (fallback a 4)
    let idPasajero = 4;
    try {
      const usuario =
        localStorage.getItem("usuario") || localStorage.getItem("pasajero");
      if (usuario) {
        const obj = JSON.parse(usuario);
        idPasajero =
          obj?.id || obj?.id_usuario || obj?.id_pasajero || idPasajero;
      }
    } catch {}

    const viajePayload = {
      id_pasajero: idPasajero,
      id_conductor: conductorSeleccionado.id_conductor,
      id_vehiculo: null,
      origen_lat: origen[0],
      origen_lng: origen[1],
      destino_lat: destino[0],
      destino_lng: destino[1],
      precio: precioViaje,
      distancia_km: distancia ?? 0,
      duracion_minutos: duracion ? Math.round(duracion) : 0,
      metodo_pago: "efectivo",
    };

    const confirmar = window.confirm(
      `¿Confirmas este viaje con ${conductorSeleccionado.nombre}?`
    );
    if (!confirmar) return;

    setLoadingConfirmar(true);

    try {
      const res = await fetch("http://localhost:4000/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(viajePayload),
      });

      const data = await res.json();
      if (!res.ok) {
        // si el backend devuelve ok=false, data puede tener message
        throw new Error(data?.message || "Error guardando viaje");
      }

      const idViaje = data.id_viaje || data.id || data.insertId || null;
      viajeIdRef.current = idViaje; // guardamos ref para filtrar eventos

      // Emitir evento para notificar al conductor
      socket.emit("solicitar-viaje", {
        id_conductor: conductorSeleccionado.id_conductor,
        id_pasajero: idPasajero,
        id_viaje: idViaje,
        viaje: { ...viajePayload, id_viaje: idViaje },
      });

      console.log("📡 Notificación emitida al conductor:", {
        id_conductor: conductorSeleccionado.id_conductor,
        id_viaje: idViaje,
      });

      setEstado("confirmado");
      alert("Viaje confirmado. El conductor fue notificado.");
    } catch (err: any) {
      console.error("Error confirmando viaje:", err);
      alert("Error al confirmar el viaje.");
    } finally {
      setLoadingConfirmar(false);
    }
  };

  // cancelar
  const handleCancelar = () => {
    setEstado("cancelado");
    setTimeout(() => router.push("/inicio"), 800);
  };

  // ------------------------------
  // sockets: seguimiento (pasajero)
  // ------------------------------
  useEffect(() => {
    // Handler: conductor aceptó y backend emite 'viaje_iniciado'
    const handleViajeIniciado = (payload: any) => {
      // payload expected: { id_viaje, id_conductor, viaje, ubicacion_inicial? }
      const id_viaje =
        payload?.id_viaje ?? payload?.viaje?.id_viaje ?? payload?.viaje?.id;
      if (!id_viaje || String(id_viaje) !== String(viajeIdRef.current)) {
        // evento no es para este viaje
        return;
      }

      console.log("🚖 viaje_iniciado recibido:", payload);

      setEstado("viaje_en_curso");
      setViajeActivo(payload.viaje ?? payload);

      // si viene ubicación inicial, úsala
      if (payload?.ubicacion_inicial) {
        const { lat, lng } = payload.ubicacion_inicial;
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setUbicacionConductor([lat, lng]);
          setPathConductor([[lat, lng]]);
        }
      } else if (payload?.viaje?.origen_lat && payload?.viaje?.origen_lng) {
        // fallback: colocar conductor en origen del pasajero al inicio
        setUbicacionConductor([
          payload.viaje.origen_lat,
          payload.viaje.origen_lng,
        ]);
        setPathConductor([
          [payload.viaje.origen_lat, payload.viaje.origen_lng],
        ]);
      }

      // feedback usuario
      try {
        // no abuses de alert en producción, aquí es útil para debug
        alert("¡El conductor aceptó tu viaje! Está en camino.");
      } catch {}
    };

    // Handler: ubicaciones periódicas enviadas por el backend (reenviado por servidor)
    const handleUbicacionConductor = (data: any) => {
      // data expected: { id_viaje, lat, lng, timestamp }
      if (!data || String(data.id_viaje) !== String(viajeIdRef.current)) return;

      const lat = Number(data.lat);
      const lng = Number(data.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setUbicacionConductor([lat, lng]);
        setPathConductor((prev) => {
          // evita agregar duplicados exactos consecutivos
          const last = prev.length ? prev[prev.length - 1] : null;
          if (last && last[0] === lat && last[1] === lng) return prev;
          return [...prev, [lat, lng]];
        });
      }
    };

    // Handler: backend notifica que viaje finalizó
    const handleViajeFinalizado = (data: any) => {
      if (!data || String(data.id_viaje) !== String(viajeIdRef.current)) return;

      setEstado("finalizado");
      alert("El viaje ha finalizado.");
      // limpieza seguimiento
      setViajeActivo(null);
      viajeIdRef.current = null;
      setUbicacionConductor(null);
      setPathConductor([]);
    };

    // Registrar eventos (asegurando que socket esté disponible)
    if (socket) {
      socket.on("viaje_iniciado", handleViajeIniciado);
      socket.on("ubicacion_conductor", handleUbicacionConductor);
      socket.on("finalizar_viaje", handleViajeFinalizado);
    } else {
      console.warn("Socket no disponible en ConfirmarRutaPage.");
    }

    return () => {
      if (socket) {
        socket.off("viaje_iniciado", handleViajeIniciado);
        socket.off("ubicacion_conductor", handleUbicacionConductor);
        socket.off("finalizar_viaje", handleViajeFinalizado);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // permitir al usuario finalizar / cancelar seguimiento localmente
  const handleFinalizarLocal = () => {
    if (!viajeActivo) return;
    const id_viaje = viajeActivo.id_viaje ?? viajeActivo.id;
    socket.emit("finalizar_viaje", { id_viaje });
    setEstado("finalizado");
    setViajeActivo(null);
    setUbicacionConductor(null);
    setPathConductor([]);
    viajeIdRef.current = null;
  };

  // RENDER
  if (!ready || !paramsListos || !origen || !destino) return null;

  return (
    <div className="home-container dark-theme">
      {/* SIDEBAR */}
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
            <button key={idx} className="sidebar-btn">
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

      {/* MAIN */}
      <div className="container-confirmar">
        <div className="mapa-confirmar-container">
          <MapaLeaflet
            origen={origen}
            destino={destino}
            setPrecio={() => {}}
            // props de seguimiento:
            conductorPos={ubicacionConductor}
            conductorPath={pathConductor}
            viajeActivo={viajeActivo}
          />
        </div>

        <div className="container-panel">
          <div className="panel-info-ruta">
            <div className="info-ruta">
              <div className="card-ruta">
                <p>
                  <strong>Distancia:</strong>{" "}
                  {distancia ? distancia.toFixed(2) + " km" : "..."}
                </p>
              </div>
              <div className="card-ruta">
                <p>
                  <strong>Duración:</strong>{" "}
                  {duracion ? Math.round(duracion) + " min" : "..."}
                </p>
              </div>
              <div className="card-ruta">
                <p>
                  <strong>Precio:</strong> ${precioViaje.toLocaleString()}
                </p>
              </div>

              <div className="acciones-viaje">
                {estado !== "viaje_en_curso" && (
                  <>
                    <button
                      className="btn-confirmar"
                      onClick={handleConfirmar}
                      disabled={!conductorSeleccionado || loadingConfirmar}
                    >
                      {loadingConfirmar ? "Confirmando..." : "Confirmar viaje"}
                    </button>

                    <button className="btn-cancelar" onClick={handleCancelar}>
                      Cancelar
                    </button>
                  </>
                )}

                {estado === "viaje_en_curso" && (
                  <>
                    <button
                      className="btn-confirmar"
                      onClick={handleFinalizarLocal}
                    >
                      Finalizar viaje
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="panel-viaje">
            {estado === "buscando" && (
              <div className="panel-busqueda">
                <div className="loader"></div>
                <p>Buscando conductores...</p>
              </div>
            )}

            {estado === "confirmando" && (
              <div className="confirmar-viaje-container">
                <div className="lista-conductores">
                  {loadingConductores ? (
                    <p>Cargando...</p>
                  ) : conductores.length === 0 ? (
                    <p>No hay conductores disponibles.</p>
                  ) : (
                    conductores.map((c) => {
                      const isSelected =
                        conductorSeleccionado?.id_conductor === c.id_conductor;
                      const foto =
                        c.foto_perfil ||
                        "https://randomuser.me/api/portraits/lego/1.jpg";

                      return (
                        <div
                          key={c.id_conductor}
                          className={`card-conductor ${
                            isSelected ? "seleccionado" : ""
                          }`}
                          onClick={() => setConductorSeleccionado(c)}
                        >
                          <img
                            src={foto}
                            className="foto-conductor"
                            alt="foto conductor"
                          />
                          <div className="info-conductor">
                            <h4>
                              {c.nombre} {c.apellido}
                            </h4>
                            <p className="vehiculo">
                              {c.tipo || "-"} {c.marca || "-"} {c.modelo || "-"}{" "}
                              – {c.placa || "-"}
                            </p>
                            <p className="telefono">{c.telefono}</p>
                            <p className={`estado ${c.estado_verificacion}`}>
                              {c.estado_verificacion?.toUpperCase() ||
                                "PENDIENTE"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {estado === "confirmado" && (
              <div className="confirmacion-exitosa">
                <h3>¡Viaje confirmado!</h3>
                <p>Esperando a que el conductor acepte...</p>
              </div>
            )}

            {estado === "viaje_en_curso" && viajeActivo && (
              <div className="seguimiento-panel">
                <h3>Seguimiento en tiempo real</h3>
                <p>
                  Conductor:{" "}
                  {viajeActivo?.conductor?.nombre ||
                    conductorSeleccionado?.nombre ||
                    "—"}
                </p>
                <p>
                  ID viaje: {viajeActivo?.id_viaje ?? viajeActivo?.id ?? "—"}
                </p>
                <p>
                  Ubicación conductor:{" "}
                  {ubicacionConductor
                    ? `${ubicacionConductor[0].toFixed(
                        6
                      )}, ${ubicacionConductor[1].toFixed(6)}`
                    : "Cargando..."}
                </p>
              </div>
            )}

            {estado === "finalizado" && (
              <div className="confirmacion-exitosa">
                <h3>Viaje finalizado</h3>
                <p>Gracias por usar Moviiq.</p>
              </div>
            )}

            {estado === "cancelado" && (
              <div className="cancelado">
                <h3>Has cancelado el viaje.</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
