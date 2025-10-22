"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MapaLeaflet from "../components/MapaLeaflet";
import "./page.modules.css";

export default function ConfirmarRutaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ========================= DATOS DE RUTA =========================
  const origenLng = parseFloat(searchParams.get("origenLng") || "-76.532");
  const origenLat = parseFloat(searchParams.get("origenLat") || "3.4516");
  const destinoLng = parseFloat(searchParams.get("destinoLng") || "-76.52");
  const destinoLat = parseFloat(searchParams.get("destinoLat") || "3.41");
  const precio = parseInt(searchParams.get("precio") || "8000");

  const [origen] = useState<[number, number]>([origenLat, origenLng]);
  const [destino] = useState<[number, number]>([destinoLat, destinoLng]);
  const [distancia, setDistancia] = useState<number | null>(null);
  const [duracion, setDuracion] = useState<number | null>(null);

  const [estado, setEstado] = useState<
    "buscando" | "confirmando" | "confirmado" | "cancelado"
  >("buscando");

  const [conductores, setConductores] = useState<any[]>([]);
  const [conductorSeleccionado, setConductorSeleccionado] = useState<any>(null);

  // ========================= EFECTO CARGAR CONDUCTORES =========================
  useEffect(() => {
    fetch("http://localhost:4000/api/conductores")
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error.message || "Error al obtener conductores");
        }
        return res.json();
      })
      .then((data) => {
        console.log("Respuesta del backend:", data);
        const lista = Array.isArray(data) ? data : [];
        setConductores(lista);
        setEstado("confirmando");
      })
      .catch((err) => {
        console.error("Error al cargar conductores:", err);
        setConductores([]);
        setEstado("buscando");
      });
  }, []);

  // ========================= EFECTO CALCULAR DISTANCIA =========================
  useEffect(() => {
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
    setDuracion((distanciaKm / 40) * 60); // minutos
  }, [origen, destino]);

  // ========================= EVENTOS =========================
  const handleConfirmar = async () => {
    if (!conductorSeleccionado) return alert("Selecciona un conductor");

    try {
      const viaje = {
        id_pasajero: 4, // <-- reemplázalo con el usuario logueado
        id_conductor: conductorSeleccionado.id_conductor,
        origen_lat: origen[0],
        origen_lng: origen[1],
        destino_lat: destino[0],
        destino_lng: destino[1],
        precio,
        distancia_km: distancia ?? 0,
        duracion_minutos: duracion ? Math.round(duracion) : 0,
        metodo_pago: "efectivo",
      };

      const res = await fetch("http://localhost:4000/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(viaje),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Error desconocido");

      setEstado("confirmado");
      router.push("/confirmarRuta");
    } catch (error: any) {
      console.error("Error al guardar el viaje:", error);
      alert("Error al guardar el viaje: " + error.message);
    }
  };

  const handleCancelar = () => {
    setEstado("cancelado");
    setTimeout(() => router.push("/inicio"), 800);
  };

  // ========================= RENDER =========================
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
              <p>Buscando conductores disponibles...</p>
            </div>
          )}

          {estado === "confirmando" && (
            <div className="confirmar-viaje-container">
              <h3>Selecciona un conductor disponible</h3>

              <div className="lista-conductores">
                {conductores.map((c) => {
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
                        alt={c.nombre}
                        className="foto-conductor"
                      />
                      <div className="info-conductor">
                        <h4>
                          {c.nombre} {c.apellido}
                        </h4>
                        <p className="vehiculo">
                          {c.tipo || "-"} {c.marca || "-"} {c.modelo || "-"} —{" "}
                          {c.placa || "-"}
                        </p>
                        <p className="telefono">
                          {c.telefono || "Sin teléfono"}
                        </p>
                        <p
                          className={`estado-verificacion ${c.estado_verificacion}`}
                        >
                          {c.estado_verificacion?.toUpperCase() || "PENDIENTE"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="info-ruta">
                <p>
                  <strong>Distancia:</strong>{" "}
                  {distancia ? `${distancia.toFixed(2)} km` : "..."}
                </p>
                <p>
                  <strong>Duración estimada:</strong>{" "}
                  {duracion ? `${Math.round(duracion)} min` : "..."}
                </p>
                <p>
                  <strong>Precio estimado:</strong> $
                  {precio?.toLocaleString() || "0"}
                </p>
              </div>

              <div className="acciones-viaje">
                <button
                  className="btn-confirmar"
                  onClick={handleConfirmar}
                  disabled={!conductorSeleccionado}
                >
                  Confirmar viaje
                </button>
                <button className="btn-cancelar" onClick={handleCancelar}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
