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
  destination: Destination | null;
  onSelect: (destination: Destination) => void;
}

const GRADING_FOR_LEVEL: Record<ActivityLevel, Grading[]> = {
  low: ["EASY"],
  medium: ["MODERATE"],
  high: ["TOUGH", "VERY_TOUGH"],
};

const GRADING_FILTER_ARG: Record<ActivityLevel, string> = {
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
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
}

async function fetchRoutesNear(destination: Destination, activityLevel: ActivityLevel): Promise<Route[]> {
  const res = await fetch("/api/utno", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{
        routesNear(input: { coordinates: [${destination.lon}, ${destination.lat}], maxDistance: 50000 }) {
          route { id name distance gradingAb geojson }
        }
      }`,
    }),
  });
  const data = await res.json();
  const all: Route[] = (data.data?.routesNear ?? []).map(
    (item: { route: Route }) => item.route
  );
  const allowed = GRADING_FOR_LEVEL[activityLevel];
  return all
    .filter((r) => r.geojson?.coordinates?.length && r.gradingAb && allowed.includes(r.gradingAb))
    .slice(0, 6);
}

async function fetchRoutesByGrading(activityLevel: ActivityLevel): Promise<Route[]> {
  const res = await fetch("/api/utno", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{
        routes(paging: { first: 6 }, ${GRADING_FILTER_ARG[activityLevel]}) {
          edges { node { id name distance gradingAb geojson } }
        }
      }`,
    }),
  });
  const data = await res.json();
  return (data.data?.routes?.edges ?? [])
    .map((e: { node: Route }) => e.node)
    .filter((r: Route) => r.geojson?.coordinates?.length);
}

export default function TripRecommendations({ activityLevel, destination, onSelect }: TripRecommendationsProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetch = destination
      ? fetchRoutesNear(destination, activityLevel)
      : fetchRoutesByGrading(activityLevel);

    fetch.then(setRoutes).finally(() => setLoading(false));
  }, [activityLevel, destination]);

  function handleSelect(route: Route) {
    const coords = route.geojson?.coordinates;
    if (!coords?.length) return;
    const [lon, lat] = coords[0];
    onSelect({ name: route.name, lat, lon });
  }

  const heading = destination
    ? `Ruter nær ${destination.name} — ${seasonLabel()}`
    : `Anbefalte ruter — ${seasonLabel()}`;

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 leading-tight">
        {heading}
      </p>
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}
      {!loading && routes.length === 0 && (
        <p className="text-xs text-gray-400">Ingen ruter funnet for dette nivået.</p>
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
