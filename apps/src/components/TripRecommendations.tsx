"use client";

import { useEffect, useState } from "react";

interface Destination {
  name: string;
  lat: number;
  lon: number;
}

interface Route {
  id: string;
  name: string;
  distance: number | null;
  geojson: { type: string; coordinates: number[][] } | null;
}

interface TripRecommendationsProps {
  onSelect: (destination: Destination) => void;
}

function seasonLabel(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "Vår";
  if (month >= 6 && month <= 8) return "Sommer";
  if (month >= 9 && month <= 11) return "Høst";
  return "Vinter";
}

function formatDistance(meters: number | null): string {
  if (!meters) return "";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${meters} m`;
}


export default function TripRecommendations({ onSelect }: TripRecommendationsProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/utno", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          routes(paging: { first: 6 }) {
            edges {
              node {
                id
                name
                distance
                geojson
              }
            }
          }
        }`,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        const fetched: Route[] =
          data.data?.routes?.edges?.map((e: { node: Route }) => e.node) ?? [];
        setRoutes(fetched.filter((r) => r.geojson?.coordinates?.length));
      })
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(route: Route) {
    const coords = route.geojson?.coordinates;
    if (!coords?.length) return;
    const [lon, lat] = coords[0];
    onSelect({ name: route.name, lat, lon });
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Populære ruter — {seasonLabel()}
      </p>
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}
      {!loading && routes.length === 0 && (
        <p className="text-xs text-gray-400">Ingen ruter tilgjengelig.</p>
      )}
      <ul className="space-y-1.5">
        {routes.map((route) => {
          const meta = formatDistance(route.distance);
          return (
            <li key={route.id}>
              <button
                onClick={() => handleSelect(route)}
                className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors group"
              >
                <p className="text-sm font-medium text-gray-800 group-hover:text-emerald-800 leading-tight truncate">
                  {route.name}
                </p>
                {meta && (
                  <p className="text-xs text-gray-400 mt-0.5">{meta}</p>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
