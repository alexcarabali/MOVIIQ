"use client";

import { useState } from "react";
import MapaLeaflet from "../components/MapaLeaflet";
import "./page.modules.css";
import { useRouter } from "next/navigation";
import {
  Home,
  Star,
  Settings,
  Phone,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function PageMapa() {
  // 🔹 Coordenadas iniciales [lat, lng]
  const [origen, setOrigen] = useState<[number, number]>([3.4516, -76.532]);
  const [destino, setDestino] = useState<[number, number]>([3.41, -76.52]);
  const [direccionOrigen, setDireccionOrigen] = useState<string>("");
  const [direccionDestino, setDireccionDestino] = useState<string>("");
  const [precio, setPrecio] = useState<number | null>(null);
  const [mostrarSidebar, setMostrarSidebar] = useState(false);

  const router = useRouter();

  const menuItems = [
    { icon: <Home size={22} />, label: "Inicio" },
    { icon: <Star size={22} />, label: "Favoritos" },
    { icon: <Settings size={22} />, label: "Configuración" },
    { icon: <Phone size={22} />, label: "Contacto" },
    { icon: <Lock size={22} />, label: "Cerrar sesión" },
  ];

  // 📍 Obtener ubicación actual
  const obtenerUbicacionActual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ]; // [lat,lng]
        setOrigen(coords);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords[0]}&lon=${coords[1]}&format=json`
          );
          const data = await res.json();
          setDireccionOrigen(data.display_name || "");
        } catch {
          setDireccionOrigen("");
        }
      });
    }
  };

  // 🚗 Pedir viaje
  const handlePedirViaje = (e: React.FormEvent) => {
    e.preventDefault();
    alert("¡Buscando conductor disponible...");
  };

  // 💾 Registrar viaje y redirigir
  const handleAceptar = async () => {
    const nuevoViaje = {
      id_pasajero: 1, // 🔹 Cambia por el id del usuario logueado
      id_conductor: null,
      id_vehiculo: null,
      origen_lat: origen[0],
      origen_lng: origen[1],
      destino_lat: destino[0],
      destino_lng: destino[1],
      precio: precio ?? 0,
    };

    try {
      const res = await fetch("http://localhost:4000/api/viajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoViaje),
      });

      const data = await res.json();
      console.log("✅ Viaje registrado:", data);

      // Redirigir a ConfirmarRuta
      const query = new URLSearchParams({
        origenLat: origen[0].toString(),
        origenLng: origen[1].toString(),
        destinoLat: destino[0].toString(),
        destinoLng: destino[1].toString(),
        precio: (precio ?? 0).toString(),
      });

      router.push(`/confirmarRuta?${query.toString()}`);
    } catch (error) {
      console.error("❌ Error al registrar el viaje:", error);
      alert("Hubo un problema al guardar el viaje. Intenta de nuevo.");
    }
  };

  return (
    <div className="home-container">
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

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div className="container-general">
        {/* Menú flotante */}
        <div className="menu-viaje-flotante">
          <form onSubmit={handlePedirViaje}>
            <input
              type="text"
              placeholder="¿Dónde te recogemos?"
              value={direccionOrigen}
              onFocus={obtenerUbicacionActual}
              onChange={(e) => setDireccionOrigen(e.target.value)}
            />
            <input
              type="text"
              placeholder="¿Pa' donde vamos?"
              value={direccionDestino}
              readOnly
            />

            {/* Botones rápidos */}
            <div className="botones-rapidos">
              <button type="button" onClick={() => setOrigen([3.45, -76.53])}>
                🏠 Casa
              </button>
              <button type="button" onClick={() => setOrigen([3.46, -76.54])}>
                🏢 Oficina
              </button>
              <button type="button" onClick={() => setOrigen([3.47, -76.55])}>
                ⭐ Favoritos
              </button>
            </div>

            {/* Direcciones guardadas */}
            <div className="direcciones-guardadas">
              <button
                className="btn-dir-1"
                onClick={() => alert("Dirección confirmada")}
              >
                Dirección uno
              </button>
              <button
                className="btn-dir-1"
                onClick={() => alert("Dirección confirmada")}
              >
                Dirección dos
              </button>
            </div>

            {/* Salmo */}
            <div className="salmito">
              <p>
                El que habita al abrigo del Altísimo Morará bajo la sombra del
                Omnipotente. Diré yo a Jehová: Esperanza mía, y castillo mío; mi
                Dios, en quien confiaré. Él te librará del lazo del cazador, de
                la peste destructora.
              </p>
            </div>
          </form>

          <button className="btn-aceptar" onClick={handleAceptar}>
            Aceptar
          </button>
        </div>

        {/* ================= MAPA ================= */}
        <div className="map-container">
          <MapaLeaflet
            origen={origen}
            destino={destino}
            setPrecio={setPrecio}
            onClickMapa={(coords) => {
              // coords ya vienen como [lat,lng]
              setDestino(coords);
              fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${coords[0]}&lon=${coords[1]}&format=json`
              )
                .then((res) => res.json())
                .then((data) => setDireccionDestino(data.display_name || ""))
                .catch(() => setDireccionDestino(""));
            }}
          />
        </div>
      </div>
    </div>
  );
}
