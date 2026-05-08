"use client";

import { useEffect, useRef, useState } from "react";
import { GeoJSON, Marker, Popup } from "react-leaflet";
import L from "leaflet";

interface Cabin {
  id: string;
  name: string;
  serviceLevel: string;
  geojson: { type: string; coordinates: number[] };
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

const cabinIcon = L.divIcon({
  className: "",
  html: `<div style="width:10px;height:10px;background:#16a34a;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

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
        cabinsNear(input: { coordinates: { lat: ${lat}, lon: ${lon} }, distance: 30000 }) {
          edges { node { id name serviceLevel geojson } }
        }
      }`),
      queryUtno(`{
        routes(paging: { first: 30 }) {
          edges { node { id name geojson } }
        }
      }`),
    ]).then(([cabinsData, routesData]) => {
      setCabins(cabinsData.data?.cabinsNear?.edges?.map((e: { node: Cabin }) => e.node) ?? []);
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
          className: "",
          html: `<div style="width:10px;height:10px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });
        return (
          <Marker key={cabin.id} position={[lat, lon]} icon={icon}>
            <Popup>
              <strong>{cabin.name}</strong>
              <br />
              {cabin.serviceLevel}
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
