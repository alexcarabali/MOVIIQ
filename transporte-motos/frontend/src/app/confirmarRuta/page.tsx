// /app/confirmarRuta/page.tsx
"use client";

import { useState } from "react";
import MapaLeaflet from "../components/MapaLeaflet";
import { useRouter, useSearchParams } from "next/navigation";
import "./page.modules.css";

export default function ConfirmarRutaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Se podrían pasar coordenadas y precio por query string
  const origenLng = parseFloat(searchParams.get("origenLng") || "-76.532");
  const origenLat = parseFloat(searchParams.get("origenLat") || "3.4516");
  const destinoLng = parseFloat(searchParams.get("destinoLng") || "-76.52");
  const destinoLat = parseFloat(searchParams.get("destinoLat") || "3.41");
  const precio = parseInt(searchParams.get("precio") || "0");

  const [origen] = useState<[number, number]>([origenLng, origenLat]);
  const [destino] = useState<[number, number]>([destinoLng, destinoLat]);

  const handleConfirmar = () => {
    // Redirige a otra página tras confirmar
    router.push("/viajeEnCurso"); // <-- cambia según tu flujo
  };

  return (
    <div className="home-container">
      <h1 className="titulo-confirmar">Confirmar tu viaje</h1>

      <div className="mapa-confirmar-container">
        <MapaLeaflet origen={origen} destino={destino} setPrecio={() => {}} />
      </div>

      <div className="detalles-viaje">
        <p>
          <strong>Origen:</strong> {origenLat.toFixed(5)},{" "}
          {origenLng.toFixed(5)}
        </p>
        <p>
          <strong>Destino:</strong> {destinoLat.toFixed(5)},{" "}
          {destinoLng.toFixed(5)}
        </p>
        <p>
          <strong>Precio estimado:</strong> ${precio.toLocaleString()}
        </p>
        <p>
          <strong>Conductor:</strong> Juan Pérez
        </p>
        <p>
          <strong>Vehículo:</strong> Moto AKT 125
        </p>

        <button className="btn-confirmar-viaje" onClick={handleConfirmar}>
          Confirmar viaje
        </button>
      </div>
    </div>
  );
}
