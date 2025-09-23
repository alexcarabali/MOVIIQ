"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type Props = {
  origen: [number, number];
  destino: [number, number];
  setPrecio: (precio: number) => void;
  onClickMapa?: (coords: [number, number]) => void;
};

// 🔹 Corregir icono por defecto de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapaLeaflet({
  origen,
  destino,
  setPrecio,
  onClickMapa,
}: Props) {
  useEffect(() => {
    if (origen && destino) {
      const distancia = calcularDistancia(origen, destino);
      const precioEstimado = Math.round(distancia * 2500);
      setPrecio(precioEstimado);
    }
  }, [origen, destino, setPrecio]);

  // Centro dinámico del mapa al cambiar origen
  const CenterMap = () => {
    const map = useMap();
    useEffect(() => {
      map.setView([origen[1], origen[0]], map.getZoom(), {
        animate: true,
      });
    }, [origen, map]);
    return null;
  };

  // Detecta clicks en el mapa para seleccionar destino
  const ClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const coords: [number, number] = [e.latlng.lng, e.latlng.lat];
        if (onClickMapa) onClickMapa(coords);
      },
    });
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <MapContainer
        center={[origen[1], origen[0]]}
        zoom={14}
        style={{ width: "100%", height: "650px", borderRadius: "8px" }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Centro automático en origen */}
        <CenterMap />

        {/* Marcador origen */}
        <Marker position={[origen[1], origen[0]]}>
          <Popup>Origen</Popup>
        </Marker>

        {/* Marcador destino */}
        {destino && (
          <Marker position={[destino[1], destino[0]]}>
            <Popup>Destino</Popup>
          </Marker>
        )}

        {/* Línea entre origen y destino */}
        <Polyline
          positions={[
            [origen[1], origen[0]],
            [destino[1], destino[0]],
          ]}
          color="blue"
        />

        {/* Click para seleccionar destino */}
        <ClickHandler />
      </MapContainer>
    </div>
  );
}

// 🔹 Función auxiliar: distancia Haversine en km
function calcularDistancia(
  origen: [number, number],
  destino: [number, number]
): number {
  const R = 6371;
  const dLat = deg2rad(destino[1] - origen[1]);
  const dLon = deg2rad(destino[0] - origen[0]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(origen[1])) *
      Math.cos(deg2rad(destino[1])) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
