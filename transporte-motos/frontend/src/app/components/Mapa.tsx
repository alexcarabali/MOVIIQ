// // src/components/Mapa.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

// export default function Mapa() {
//   const { isLoaded, loadError } = useJsApiLoader({
//     googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "", // 🔑 tu API Key en .env.local
//   });

//   const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);

//   useEffect(() => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
//         (err) => {
//           console.warn("No se pudo obtener geolocalización:", err.message);
//           // fallback a Cali
//           setPos({ lat: 3.43722, lng: -76.5225 });
//         }
//       );
//     } else {
//       setPos({ lat: 3.43722, lng: -76.5225 });
//     }
//   }, []);

//   if (loadError) return <p>Error cargando Google Maps</p>;
//   if (!isLoaded) return <p>Cargando mapa...</p>;

//   return (
//     <div className="max-w-4xl mx-auto p-4">
//       <h2 className="text-2xl font-bold mb-4">Mapa</h2>
//       <GoogleMap
//         zoom={15}
//         center={pos || { lat: 3.43722, lng: -76.5225 }}
//         mapContainerStyle={{
//           width: "100%",
//           height: "500px",
//           borderRadius: "8px",
//         }}
//       >
//         {pos && <Marker position={pos} />}
//       </GoogleMap>
//     </div>
//   );
// }
