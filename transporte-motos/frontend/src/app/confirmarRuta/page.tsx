"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "./page.modules.css";
import dynamic from "next/dynamic";
import socket from "../utils/socket"; // ⬅⬅⬅ IMPORTANTE: socket.io cliente
import { API_URL } from "../utils/api";

export default function ConfirmarRutaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [ready, setReady] = useState(false);
  const [paramsListos, setParamsListos] = useState(false);

  const [origen, setOrigen] = useState<[number, number] | null>(null);
  const [destino, setDestino] = useState<[number, number] | null>(null);
  const [precioViaje, setPrecioViaje] = useState<number>(0);

  // =====================================================
  // Activar render en cliente
  // =====================================================
  useEffect(() => {
    setReady(true);
  }, []);

  const MapaLeaflet = dynamic(() => import("../components/MapaLeaflet"), {
    ssr: false,
  });

  // =====================================================
  // LECTURA SEGURA DE COORDENADAS
  // (Se ejecuta SOLO cuando searchParams ya está cargado)
  // =====================================================
  useEffect(() => {
    const oLng = parseFloat(searchParams.get("origenLng") || "-76.532");
    const oLat = parseFloat(searchParams.get("origenLat") || "3.4516");
    const dLng = parseFloat(searchParams.get("destinoLng") || "-76.52");
    const dLat = parseFloat(searchParams.get("destinoLat") || "3.41");
    const p = parseInt(searchParams.get("precio") || "8000");

    setOrigen([oLat, oLng]);
    setDestino([dLat, dLng]);
    setPrecioViaje(p);

    setParamsListos(true);
  }, [searchParams]);

  // =====================================================
  // ESTADOS
  // =====================================================
  const [distancia, setDistancia] = useState<number | null>(null);
  const [duracion, setDuracion] = useState<number | null>(null);
  const [estado, setEstado] = useState<
    "buscando" | "confirmando" | "confirmado" | "cancelado"
  >("buscando");

  const [conductores, setConductores] = useState<any[]>([]);
  const [conductorSeleccionado, setConductorSeleccionado] = useState<any>(null);
  const [loadingConfirmar, setLoadingConfirmar] = useState(false);
  const [loadingConductores, setLoadingConductores] = useState(true);

  // =====================================================
  // REGISTRAR PASAJERO EN SOCKET
  // =====================================================
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
      console.warn("No se pudo registrar pasajero en socket.");
    }
  }, []);

  // =====================================================
  // CARGAR CONDUCTORES
  // =====================================================
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

  // =====================================================
  // CALCULAR DISTANCIA Y TIEMPO
  // =====================================================
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
    setDuracion((distanciaKm / 40) * 60);
  }, [origen, destino]);

  // =====================================================
  // CONFIRMAR VIAJE
  // =====================================================
  const handleConfirmar = async () => {
    if (!conductorSeleccionado)
      return alert("Selecciona un conductor antes de confirmar.");
    if (!origen || !destino) return alert("Error en las coordenadas.");

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
      if (!res.ok) throw new Error(data.message);

      const idViaje = data.id_viaje || data.id || data.insertId || null;

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

      router.push("#");
    } catch (err: any) {
      console.error("Error confirmando viaje:", err);
      alert("Error al confirmar el viaje.");
    } finally {
      setLoadingConfirmar(false);
    }
  };

  // =====================================================
  // CANCELAR VIAJE
  // =====================================================
  const handleCancelar = () => {
    setEstado("cancelado");
    setTimeout(() => router.push("/inicio"), 800);
  };

  // =====================================================
  // RENDER FINAL
  // =====================================================
  if (!ready || !paramsListos || !origen || !destino) return null;

  return (
    <div className="home-container dark-theme">
      <div className="container-confirmar">
        <div className="mapa-confirmar-container">
          <MapaLeaflet origen={origen} destino={destino} setPrecio={() => {}} />
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
              <h3>Selecciona un conductor</h3>

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
                        <img src={foto} className="foto-conductor" />
                        <div className="info-conductor">
                          <h4>
                            {c.nombre} {c.apellido}
                          </h4>
                          <p className="vehiculo">
                            {c.tipo || "-"} {c.marca || "-"} {c.modelo || "-"} –{" "}
                            {c.placa || "-"}
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

              <div className="info-ruta">
                <p>
                  <strong>Distancia:</strong>{" "}
                  {distancia ? distancia.toFixed(2) + " km" : "..."}
                </p>
                <p>
                  <strong>Duración:</strong>{" "}
                  {duracion ? Math.round(duracion) + " min" : "..."}
                </p>
                <p>
                  <strong>Precio:</strong> ${precioViaje.toLocaleString()}
                </p>
              </div>

              <div className="acciones-viaje">
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
              </div>
            </div>
          )}

          {estado === "confirmado" && (
            <div className="confirmacion-exitosa">
              <h3>¡Viaje confirmado!</h3>
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
  );
}
