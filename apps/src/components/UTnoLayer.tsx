"use client";

import { useEffect, useRef, useState } from "react";
import { GeoJSON, Marker, Popup } from "react-leaflet";
import L from "leaflet";

interface Cabin {
  id: number;
  name: string;
  serviceLevel: string;
  geojson: { type: string; coordinates: number[] } | null;
}

interface Route {
  id: string;
  name: string;
  geojson: { type: string; coordinates: number[][] } | null;
}

interface UTnoLayerProps {
  center: { lat: number; lon: number };
}

const CABIN_COLORS: Record<string, string> = {
  STAFFED: "#16a34a",
  SELF_SERVICE: "#d97706",
  NO_SERVICE: "#6b7280",
  RENTAL: "#7c3aed",
};

const SERVICE_LEVEL_LABELS: Record<string, string> = {
  STAFFED: "Betjent",
  SELF_SERVICE: "Selvbetjent",
  NO_SERVICE: "Ubetjent",
  RENTAL: "Utleiehytte",
};

function cabinSvg(color: string) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.45));">
      <path d="M3 11 L12 3 L21 11 L21 21 L3 21 Z"
        fill="${color}" stroke="white" stroke-width="1.6" stroke-linejoin="round"/>
      <rect x="10" y="14" width="4" height="7" fill="white" opacity="0.85"/>
    </svg>
  `;
}

async function queryUtno(query: string) {
  const res = await fetch("/api/utno", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

export default function UTnoLayer({ center }: UTnoLayerProps) {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const prevCenter = useRef<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    const prev = prevCenter.current;
    if (prev && Math.abs(prev.lat - center.lat) < 0.01 && Math.abs(prev.lon - center.lon) < 0.01) return;
    prevCenter.current = center;

    const { lat, lon } = center;

    Promise.all([
      queryUtno(`{
        cabinsNear(input: { coordinates: [${lon}, ${lat}], maxDistance: 30000 }) {
          cabin { id name serviceLevel geojson }
        }
      }`),
      queryUtno(`{
        routes(paging: { first: 30 }) {
          edges { node { id name geojson } }
        }
      }`),
    ]).then(([cabinsData, routesData]) => {
      setCabins(
        cabinsData.data?.cabinsNear
          ?.map((edge: { cabin: Cabin }) => edge.cabin)
          .filter((c: Cabin | null): c is Cabin => Boolean(c)) ?? []
      );
      setRoutes(routesData.data?.routes?.edges?.map((e: { node: Route }) => e.node) ?? []);
    });
  }, [center.lat, center.lon]);

  return (
    <>
      {cabins.map((cabin) => {
        const coords = cabin.geojson?.coordinates;
        if (!coords || coords.length < 2) return null;
        const [lon, lat] = coords;
        const color = CABIN_COLORS[cabin.serviceLevel] ?? "#6b7280";
        const icon = L.divIcon({
          className: "fk-cabin-icon",
          html: cabinSvg(color),
          iconSize: [22, 22],
          iconAnchor: [11, 20],
          popupAnchor: [0, -18],
        });
        return (
          <Marker key={cabin.id} position={[lat, lon]} icon={icon}>
            <Popup>
              <strong>{cabin.name}</strong>
              <br />
              {SERVICE_LEVEL_LABELS[cabin.serviceLevel] ?? cabin.serviceLevel}
            </Popup>
          </Marker>
        );
      })}
      {routes.map((route) => {
        if (!route.geojson) return null;
        return (
          <GeoJSON
            key={route.id}
            data={route.geojson as GeoJSON.GeoJsonObject}
            style={{ color: "#ef4444", weight: 2, opacity: 0.65 }}
          />
        );
      })}
    </>
  );
}
