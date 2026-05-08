"use client";

import { useEffect, useState } from "react";

type ActivityLevel = "low" | "medium" | "high";
type Grading = "EASY" | "MODERATE" | "TOUGH" | "VERY_TOUGH";

interface Destination {
  name: string;
  lat: number;
  lon: number;
}

interface Route {
  id: string;
  name: string;
  distance: number | null;
  gradingAb: Grading | null;
  geojson: { type: string; coordinates: number[][] } | null;
}

interface TripRecommendationsProps {
  activityLevel: ActivityLevel;
  onSelect: (destination: Destination) => void;
}

const GRADING_FILTER: Record<ActivityLevel, string> = {
  low: "filter: { gradingAb: { eq: EASY } }",
  medium: "filter: { gradingAb: { eq: MODERATE } }",
  high: "filter: { gradingAb: { in: [TOUGH, VERY_TOUGH] } }",
};

const GRADING_LABEL: Record<Grading, { label: string; color: string }> = {
  EASY: { label: "Enkel", color: "text-green-600" },
  MODERATE: { label: "Middels", color: "text-blue-600" },
  TOUGH: { label: "Krevende", color: "text-red-600" },
  VERY_TOUGH: { label: "Ekstra krevende", color: "text-gray-900" },
};

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

export default function TripRecommendations({ activityLevel, onSelect }: TripRecommendationsProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/utno", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `{
          routes(paging: { first: 6 }, ${GRADING_FILTER[activityLevel]}) {
            edges {
              node {
                id
                name
                distance
                gradingAb
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
  }, [activityLevel]);

  function handleSelect(route: Route) {
    const coords = route.geojson?.coordinates;
    if (!coords?.length) return;
    const [lon, lat] = coords[0];
    onSelect({ name: route.name, lat, lon });
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        Anbefalte ruter — {seasonLabel()}
      </p>
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}
      {!loading && routes.length === 0 && (
        <p className="text-xs text-gray-400">Ingen ruter for dette nivået.</p>
      )}
      <ul className="space-y-1.5">
        {routes.map((route) => {
          const grading = route.gradingAb ? GRADING_LABEL[route.gradingAb] : null;
          return (
            <li key={route.id}>
              <button
                onClick={() => handleSelect(route)}
                className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-colors group"
              >
                <p className="text-sm font-medium text-gray-800 group-hover:text-emerald-800 leading-tight truncate">
                  {route.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex gap-2">
                  {grading && <span className={grading.color}>{grading.label}</span>}
                  {formatDistance(route.distance)}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
