'use client';

import { useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Next.js empaqueta los assets de Leaflet de forma que rompe la detección
// automática de rutas de los íconos por defecto; se sirven copias locales
// desde /public/leaflet para no depender de ningún CDN externo en un flujo
// de emergencia.
const markerIcon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

function ClickToMove({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationMap({ lat, lng, onChange }: LocationMapProps) {
  const markerRef = useRef<L.Marker>(null);

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={17}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[lat, lng]}
        icon={markerIcon}
        draggable
        ref={markerRef}
        eventHandlers={{
          dragend: () => {
            const marker = markerRef.current;
            if (marker) {
              const pos = marker.getLatLng();
              onChange(pos.lat, pos.lng);
            }
          },
        }}
      />
      <ClickToMove onChange={onChange} />
    </MapContainer>
  );
}
