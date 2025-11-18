"use client";

import { useEffect, useState } from "react";
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
  origen: [number, number]; // [lat, lng]
  destino: [number, number]; // [lat, lng]
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
  const [ruta, setRuta] = useState<[number, number][]>([]);
  const [ubicacionActual, setUbicacionActual] = useState<
    [number, number] | null
  >(null);

  // 🔹 Obtener ubicación actual
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUbicacionActual([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.warn("No se pudo obtener ubicación:", err)
      );
    }
  }, []);

  // 🔹 Calcular ruta (directamente a OSRM)
  useEffect(() => {
    if (!origen || !destino) return;
    if (
      isNaN(origen[0]) ||
      isNaN(origen[1]) ||
      isNaN(destino[0]) ||
      isNaN(destino[1])
    ) {
      console.warn("⚠️ Coordenadas inválidas:", origen, destino);
      return;
    }

    const obtenerRuta = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origen[1]},${origen[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const coords: [number, number][] =
            data.routes[0].geometry.coordinates.map(
              ([lng, lat]: [number, number]) => [lat, lng]
            );
          setRuta(coords);

          // Precio estimado por distancia (ejemplo: $2500 por km)
          const distanciaKm = data.routes[0].distance / 1000;
          setPrecio(Math.round(distanciaKm * 2500));
        } else {
          console.warn("No se encontraron rutas válidas:", data);
          setRuta([origen, destino]); // fallback línea recta
        }
      } catch (error: any) {
        console.error("❌ Error al obtener la ruta:", error.message);
        setRuta([origen, destino]); // fallback
      }
    };

    obtenerRuta();
  }, [origen, destino, setPrecio]);

  // 🔹 Centrar mapa
  const CenterMap = () => {
    const map = useMap();
    const [centrado, setCentrado] = useState(false);

    useEffect(() => {
      if (!centrado && origen && destino) {
        const bounds = L.latLngBounds([origen, destino]);
        map.fitBounds(bounds, { padding: [50, 50] });
        setCentrado(true);
      }
    }, [map, origen, destino, centrado]);

    return null;
  };

  // 🔹 Manejar clics en el mapa
  const ClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
        if (onClickMapa) onClickMapa(coords);
      },
    });
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <MapContainer
        center={ubicacionActual || origen}
        zoom={14}
        style={{ width: "100%", height: "650px", borderRadius: "8px" }}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <CenterMap />

        {/* Marcadores */}
        <Marker position={origen}>
          <Popup>Origen</Popup>
        </Marker>

        {destino && (
          <Marker position={destino}>
            <Popup>Destino</Popup>
          </Marker>
        )}

        {/* Ruta */}
        {ruta.length > 0 && (
          <Polyline positions={ruta} color="blue" weight={5} />
        )}

        <ClickHandler />
      </MapContainer>
    </div>
  );
}
