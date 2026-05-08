"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, GeoJSON, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import UTnoLayer from "./UTnoLayer";

// Fix Leaflet default icons (must be inside the ssr:false component)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface Destination {
  name: string;
  lat: number;
  lon: number;
}

interface AiRoute {
  id: string;
  name: string;
  geojson: { type: string; coordinates: number[][] } | null;
}

interface MapPickerProps {
  destination: Destination | null;
  onSelect: (destination: Destination) => void;
  flyToRef: React.MutableRefObject<((lat: number, lon: number) => void) | null>;
  aiRoutes?: AiRoute[];
}

function ClickHandler({ onSelect }: { onSelect: (destination: Destination) => void }) {
  useMapEvents({
    click(e) {
      const lat = parseFloat(e.latlng.lat.toFixed(4));
      const lon = parseFloat(e.latlng.lng.toFixed(4));
      onSelect({ name: `${lat}, ${lon}`, lat, lon });
    },
  });
  return null;
}

function FlyToController({
  flyToRef,
}: {
  flyToRef: React.MutableRefObject<((lat: number, lon: number) => void) | null>;
}) {
  const map = useMap();
  useEffect(() => {
    flyToRef.current = (lat: number, lon: number) => {
      map.flyTo([lat, lon], 12, { duration: 1 });
    };
  }, [map, flyToRef]);
  return null;
}

export default function MapPicker({ destination, onSelect, flyToRef, aiRoutes = [] }: MapPickerProps) {
  return (
    <MapContainer
      center={[62.0, 9.8]}
      zoom={7}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        url="https://cache.kartverket.no/v1/wmts/1.0.0/toporaster/default/webmercator/{z}/{y}/{x}.png"
        attribution='&copy; <a href="https://kartverket.no">Kartverket</a>'
      />
      <ClickHandler onSelect={onSelect} />
      <FlyToController flyToRef={flyToRef} />
      <UTnoLayer center={destination ?? { lat: 62.0, lon: 9.8 }} />
      {destination && <Marker position={[destination.lat, destination.lon]} />}
      {aiRoutes.map((route) =>
        route.geojson ? (
          <GeoJSON
            key={route.id}
            data={route.geojson as GeoJSON.GeoJsonObject}
            style={{ color: "#3b82f6", weight: 4, opacity: 0.85 }}
          />
        ) : null
      )}
    </MapContainer>
  );
}
