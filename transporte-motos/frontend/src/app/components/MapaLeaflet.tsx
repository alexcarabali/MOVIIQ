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
  origen: [number, number];
  destino: [number, number];
  setPrecio: (precio: number) => void;
  onClickMapa?: (coords: [number, number]) => void;
  conductorPos?: [number, number] | null;
  conductorPath?: [number, number][];
  viajeActivo?: any | null;
};

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// small icons for driver/passenger (you can keep your custom icons)
const driverIcon = new L.Icon({
  iconUrl: "/icons/car.png",
  iconSize: [35, 35],
});
const passengerIcon = new L.Icon({
  iconUrl: "/icons/passenger.png",
  iconSize: [35, 35],
});

export default function MapaLeaflet({
  origen,
  destino,
  setPrecio,
  onClickMapa,
  conductorPos,
  conductorPath,
  viajeActivo,
}: Props) {
  const [ruta, setRuta] = useState<[number, number][]>([]);
  const [ubicacionActual, setUbicacionActual] = useState<
    [number, number] | null
  >(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUbicacionActual([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn("No se pudo obtener ubicación:", err)
      );
    }
  }, []);

  useEffect(() => {
    if (!origen || !destino) return;
    if ([origen[0], origen[1], destino[0], destino[1]].some(Number.isNaN))
      return;

    const obtenerRuta = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origen[1]},${origen[0]};${destino[1]},${destino[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords: [number, number][] =
            data.routes[0].geometry.coordinates.map(
              ([lng, lat]: [number, number]) => [lat, lng]
            );
          setRuta(coords);
          const distanciaKm = data.routes[0].distance / 1000;
          setPrecio(Math.round(distanciaKm * 2500));
        } else {
          setRuta([origen, destino]);
        }
      } catch (error) {
        console.warn("Error ruta:", error);
        setRuta([origen, destino]);
      }
    };

    obtenerRuta();
  }, [origen, destino, setPrecio]);

  const CenterMap = () => {
    const map = useMap();
    useEffect(() => {
      if (origen && destino) {
        const bounds = L.latLngBounds([origen, destino]);
        if (conductorPos)
          bounds.extend(L.latLng(conductorPos[0], conductorPos[1]));
        map.fitBounds(bounds, { padding: [50, 50] });
      } else if (ubicacionActual) {
        map.setView(ubicacionActual, 14);
      }
    }, [map, origen, destino, ubicacionActual, conductorPos]);
    return null;
  };

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
        style={{ width: "100%", height: "650px", borderRadius: 8 }}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <CenterMap />

        <Marker position={origen}>
          <Popup>Origen</Popup>
        </Marker>

        {destino && (
          <Marker position={destino}>
            <Popup>Destino</Popup>
          </Marker>
        )}

        {ruta.length > 0 && <Polyline positions={ruta} weight={5} />}

        {/* Conductor (si hay) */}
        {conductorPos && (
          <Marker position={conductorPos} icon={driverIcon}>
            <Popup>Conductor</Popup>
          </Marker>
        )}

        {/* Path histórico del conductor */}
        {conductorPath && conductorPath.length > 0 && (
          <Polyline positions={conductorPath} weight={4} dashArray="6" />
        )}

        {/* marcador del pasajero si hay viajeActivo */}
        {viajeActivo && viajeActivo.origen_lat && (
          <Marker
            position={[viajeActivo.origen_lat, viajeActivo.origen_lng]}
            icon={passengerIcon}
          >
            <Popup>Origen pasajero</Popup>
          </Marker>
        )}

        <ClickHandler />
      </MapContainer>
    </div>
  );
}
