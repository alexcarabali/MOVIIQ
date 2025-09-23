// src/app/map/page.tsx
// "use client"; // ⚠️ Obligatorio para usar Mapa

// import Mapa from "../components/Mapa";

// export default function PageMapa() {
//   return <Mapa />;
// }

// src/app/map/page.tsx

// "use client";

// import MapaLeaflet from "../components/MapaLeaflet";

// export default function PageMapa() {
//   return <MapaLeaflet />;
// }

"use client";

import { useState, useRef } from "react";
import MapaLeaflet from "../components/MapaLeaflet";

export default function PageMapa() {
  const [origen, setOrigen] = useState<[number, number]>([-76.532, 3.4516]);
  const [destino, setDestino] = useState<[number, number]>([-76.52, 3.41]);
  const [precio, setPrecio] = useState<number | null>(null);
  const mapContainer = useRef<HTMLDivElement | null>(null);

  const handlePedirViaje = (e: React.FormEvent) => {
    e.preventDefault();
    alert("¡Buscando conductor disponible...");
  };

  return (
    <div className="home-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>🚖 Pedir viaje</h2>
        <form onSubmit={handlePedirViaje} className="form-viaje">
          <div className="input-group">
            <label htmlFor="origen">Origen:</label>
            <input
              id="origen"
              type="text"
              placeholder="Ej: Universidad del Valle"
              onBlur={() => setOrigen([-76.532, 3.4516])}
            />
          </div>
          <div className="input-group">
            <label htmlFor="destino">Destino:</label>
            <input
              id="destino"
              type="text"
              placeholder="Ej: Terminal de Cali"
              onBlur={() => setDestino([-76.52, 3.41])}
            />
          </div>
          <button type="submit" className="btn-pedir">
            Pedir viaje
          </button>
        </form>

        {precio && (
          <div className="viaje-info">
            <h3>Detalles del viaje</h3>
            <p>
              Conductor: <strong>Juan Pérez</strong>
            </p>
            <p>
              Vehículo: <strong>Moto AKT 125</strong>
            </p>
            <p>
              Precio estimado: <strong>${precio}</strong>
            </p>
            <button
              className="btn-confirmar"
              onClick={() => alert("Viaje confirmado")}
            >
              Confirmar viaje
            </button>
          </div>
        )}
      </aside>

      {/* Mapa */}
      <div ref={mapContainer} className="map-container">
        <MapaLeaflet origen={origen} destino={destino} setPrecio={setPrecio} />
      </div>
    </div>
  );
}
