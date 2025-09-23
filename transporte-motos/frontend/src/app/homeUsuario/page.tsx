"use client";

import { useState } from "react";
import MapaLeaflet from "../components/MapaLeaflet";
import "./page.modules.css";
import { useRouter } from "next/navigation";

export default function PageMapa() {
  const [origen, setOrigen] = useState<[number, number]>([-76.532, 3.4516]);
  const [destino, setDestino] = useState<[number, number]>([-76.52, 3.41]);
  const [direccionOrigen, setDireccionOrigen] = useState<string>("");
  const [direccionDestino, setDireccionDestino] = useState<string>("");
  const [precio, setPrecio] = useState<number | null>(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [mostrarSidebar, setMostrarSidebar] = useState(true);
  const router = useRouter();
  // Obtener ubicación actual y dirección
  const obtenerUbicacionActual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const coords: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        setOrigen(coords);

        // Reverse geocoding
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords[1]}&lon=${coords[0]}&format=json`
          );
          const data = await res.json();
          setDireccionOrigen(data.display_name || "");
        } catch {
          setDireccionOrigen("");
        }
      });
    }
  };

  // Cuando se pide viaje
  const handlePedirViaje = (e: React.FormEvent) => {
    e.preventDefault();
    alert("¡Buscando conductor disponible...");
  };

  const handleAceptar = () => {
    // Aquí puedes pasar datos por query o state
    router.push("./confirmarRuta"); // <-- Cambia por la ruta que necesites
  };

  return (
    <div className="home-container">
      <aside className={`sidebar ${mostrarSidebar ? "visible" : "oculta"}`}>
        <button
          className="btn-toggle-sidebar"
          onClick={() => setMostrarSidebar(!mostrarSidebar)}
        >
          {mostrarSidebar ? "⮜" : "⮞"}
        </button>

        {mostrarSidebar && (
          <nav className="sidebar-menu">
            <button>🏍️ </button>
            <button>⭐ </button>
            <button>⚙️ </button>
            <button>📞 </button>
            <button>🔒 </button>
          </nav>
        )}
      </aside>

      <div className="map-container">
        <MapaLeaflet
          origen={origen}
          destino={destino}
          setPrecio={setPrecio}
          onClickMapa={async (coords) => {
            setDestino(coords);
            try {
              const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${coords[1]}&lon=${coords[0]}&format=json`
              );
              const data = await res.json();
              setDireccionDestino(data.display_name || "");
            } catch {
              setDireccionDestino("");
            }
          }}
        />

        {/* Menú flotante sobre el mapa */}
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
              <button type="button" onClick={() => setOrigen([-76.53, 3.45])}>
                🏠 Casa
              </button>
              <button type="button" onClick={() => setOrigen([-76.54, 3.46])}>
                🏢 Oficina
              </button>
              <button type="button" onClick={() => setOrigen([-76.55, 3.47])}>
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
              <button
                className="btn-dir-1"
                onClick={() => alert("Dirección confirmada")}
              >
                Dirección tres
              </button>
            </div>

            {/* Salmo */}
            <div className="salmito">
              <p>
                El que habita al abrigo del Altísimo Morará bajo la sombra del
                Omnipotente. 2 Diré yo a Jehová: Esperanza mía, y castillo mío;
                Mi Dios, en quien confiaré. 3 Él te librará del lazo del
                cazador, De la peste destructora.
              </p>
            </div>
          </form>
        </div>

        <div className="menu-flotante-aceptar">
          <button
            className="btn-aceptar"
            // onClick={() => setMostrarDetalles(true)}
            onClick={handleAceptar}
          >
            Aceptar
          </button>
        </div>
      </div>

      <div className="moto-container">
        <img src="/moticoRun.png" alt="Moto" className="moto" />
      </div>
    </div>
  );
}
