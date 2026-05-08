"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";

interface Destination {
  name: string;
  lat: number;
  lon: number;
}

interface MapPickerProps {
  destination: Destination | null;
  onSelect: (destination: Destination) => void;
  flyToRef: React.MutableRefObject<((lat: number, lon: number) => void) | null>;
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

export default function MapPicker({ destination, onSelect, flyToRef }: MapPickerProps) {
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
      {destination && <Marker position={[destination.lat, destination.lon]} />}
    </MapContainer>
  );
}
