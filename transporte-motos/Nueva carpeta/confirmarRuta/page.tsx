"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "./page.modules.css";
import dynamic from "next/dynamic";

export default function ConfirmarRutaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const MapaLeaflet = dynamic(() => import("../components/MapaLeaflet"), {
    ssr: false,
  });

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
  const [loadingConfirmar, setLoadingConfirmar] = useState(false);
  const [loadingConductores, setLoadingConductores] = useState(true);

  // ========================= EFECTO CARGAR CONDUCTORES =========================
  useEffect(() => {
    const cargarConductores = async () => {
      setLoadingConductores(true);
      try {
        const res = await fetch("http://localhost:4000/api/conductores");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Error al obtener conductores");
        }
        const data = await res.json();
        const lista = Array.isArray(data) ? data : [];
        setConductores(lista);
        setEstado("confirmando");
      } catch (err: any) {
        console.error("Error al cargar conductores:", err);
        setConductores([]);
        setEstado("buscando");
        // muestra alerta ligera
        alert(
          "No se pudieron cargar conductores. Revisa tu backend o tu conexión. Ver consola para más detalles."
        );
      } finally {
        setLoadingConductores(false);
      }
    };

    cargarConductores();
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
    setDuracion((distanciaKm / 40) * 60); // minutos (asumiendo 40 km/h)
  }, [origen, destino]);

  // ========================= EVENTOS =========================
  const handleConfirmar = async () => {
    if (!conductorSeleccionado) return alert("Selecciona un conductor");

    // Obtener id_pasajero desde localStorage (si existe) o fallback a 4
    let idPasajero = 4;
    try {
      const usuario =
        localStorage.getItem("usuario") || localStorage.getItem("pasajero");
      if (usuario) {
        const obj = JSON.parse(usuario);
        if (obj?.id) idPasajero = obj.id;
        if (obj?.id_usuario) idPasajero = obj.id_usuario;
      }
    } catch {
      // si falla, mantener 4
    }

    const viajePayload = {
      id_pasajero: idPasajero,
      id_conductor: conductorSeleccionado.id_conductor,
      id_vehiculo: null,
      origen_lat: origen[0],
      origen_lng: origen[1],
      destino_lat: destino[0],
      destino_lng: destino[1],
      precio,
      distancia_km: distancia ?? 0,
      duracion_minutos: duracion ? Math.round(duracion) : 0,
      metodo_pago: "efectivo",
    };

    const confirmar = window.confirm(
      `¿Confirmas el viaje?\n\nConductor: ${conductorSeleccionado.nombre} ${
        conductorSeleccionado.apellido
      }\n📍 Desde: ${origen[0].toFixed(5)}, ${origen[1].toFixed(
        5
      )}\n🏁 Hasta: ${destino[0].toFixed(5)}, ${destino[1].toFixed(
        5
      )}\n💰 Precio estimado: $${(precio ?? 0).toLocaleString()}`
    );

    if (!confirmar) return;

    setLoadingConfirmar(true);

    try {
      // 1) Guardar viaje
      const res = await fetch("http://localhost:4000/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(viajePayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al crear el viaje");
      }

      // 2) Intentar notificar al conductor mediante endpoint de notificación
      try {
        const notiRes = await fetch(
          "http://localhost:4000/api/notificar-conductor",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_conductor: conductorSeleccionado.id_conductor,
              viaje: {
                ...viajePayload,
                id_viaje:
                  data.id_viaje ?? (data.id_viaje || data.id || data.id_viaje),
              },
            }),
          }
        );

        const notiData = await notiRes.json().catch(() => ({}));
        if (notiRes.ok && notiData.ok !== false) {
          // Notificación enviada o al menos el backend la aceptó
          alert("Viaje confirmado y notificación enviada al conductor.");
        } else {
          // Backend respondió no conectado o falló, mostrar aviso pero continuar
          console.warn(
            "Advertencia: notificación no enviada o conductor no conectado.",
            notiData
          );
          alert(
            "Viaje confirmado, pero el conductor no está conectado. El conductor verá el viaje cuando se conecte."
          );
        }
      } catch (err) {
        console.error("Error al notificar conductor:", err);
        alert(
          "Viaje confirmado, pero ocurrió un error al notificar al conductor (ver consola)."
        );
      }

      setEstado("confirmado");

      // 3) Redirigir a página de confirmación final (o estado)
      router.push("/viajeConfirmado");
    } catch (error: any) {
      console.error("Error al guardar el viaje:", error);
      alert(
        "Error al guardar el viaje: " + (error.message || "Error desconocido")
      );
    } finally {
      setLoadingConfirmar(false);
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
                {loadingConductores ? (
                  <p>Cargando conductores...</p>
                ) : conductores.length === 0 ? (
                  <p>No hay conductores disponibles en este momento.</p>
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
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            setConductorSeleccionado(c);
                        }}
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
              <h3>✅ Viaje confirmado</h3>
              <p>Se notificó al conductor seleccionado.</p>
            </div>
          )}

          {estado === "cancelado" && (
            <div className="cancelado">
              <h3>✖ Viaje cancelado</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
