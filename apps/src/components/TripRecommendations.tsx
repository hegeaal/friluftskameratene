"use client";

import { useEffect, useState } from "react";

type ActivityLevel = "low" | "medium" | "high";
type Grading = "EASY" | "MODERATE" | "TOUGH" | "VERY_TOUGH";
type DurationFilter = "all" | "short" | "medium" | "long";

interface Destination {
  name: string;
  lat: number;
  lon: number;
}

interface Route {
  id: string;
  name: string;
  distance: number | null;
  durationHoursAb: number | null;
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

const DURATION_OPTIONS: { value: DurationFilter; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "short", label: "< 3t" },
  { value: "medium", label: "3–6t" },
  { value: "long", label: "> 6t" },
];

function matchesDuration(route: Route, filter: DurationFilter): boolean {
  if (filter === "all") return true;
  const h = route.durationHoursAb;
  if (!h) {
    // Fall back to distance as proxy when duration is missing
    const km = (route.distance ?? 0) / 1000;
    if (filter === "short") return km <= 5;
    if (filter === "medium") return km > 5 && km <= 15;
    if (filter === "long") return km > 15;
  } else {
    if (filter === "short") return h <= 3;
    if (filter === "medium") return h > 3 && h <= 6;
    if (filter === "long") return h > 6;
  }
  return true;
}

function seasonLabel(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "Vår";
  if (month >= 6 && month <= 8) return "Sommer";
  if (month >= 9 && month <= 11) return "Høst";
  return "Vinter";
}

function formatMeta(route: Route): string {
  const parts: string[] = [];
  if (route.durationHoursAb) parts.push(`${route.durationHoursAb} t`);
  if (route.distance) {
    const km = route.distance / 1000;
    parts.push(`${km.toFixed(1)} km`);
  }
  return parts.join(" · ");
}

async function fetchRoutesNear(destination: Destination, activityLevel: ActivityLevel): Promise<Route[]> {
  const res = await fetch("/api/utno", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{
        routesNear(input: { coordinates: [${destination.lon}, ${destination.lat}], maxDistance: 50000 }) {
          route { id name distance durationHoursAb gradingAb geojson }
        }
      }`,
    }),
  });
  const data = await res.json();
  const all: Route[] = (data.data?.routesNear ?? []).map((item: { route: Route }) => item.route);
  const allowed = GRADING_FOR_LEVEL[activityLevel];
  return all.filter((r) => r.geojson?.coordinates?.length && r.gradingAb && allowed.includes(r.gradingAb));
}

async function fetchRoutesByGrading(activityLevel: ActivityLevel): Promise<Route[]> {
  const res = await fetch("/api/utno", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{
        routes(paging: { first: 30 }, ${GRADING_FILTER_ARG[activityLevel]}) {
          edges { node { id name distance durationHoursAb gradingAb geojson } }
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
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");

  useEffect(() => {
    setLoading(true);
    const fetcher = destination
      ? fetchRoutesNear(destination, activityLevel)
      : fetchRoutesByGrading(activityLevel);
    fetcher.then(setAllRoutes).finally(() => setLoading(false));
  }, [activityLevel, destination]);

  const filtered = allRoutes
    .filter((r) => !search || r.name.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => matchesDuration(r, durationFilter))
    .slice(0, 6);

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
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide leading-tight">
        {heading}
      </p>

      {/* Name search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Søk i ruter..."
        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />

      {/* Duration filter */}
      <div className="flex gap-1">
        {DURATION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDurationFilter(opt.value)}
            className={`flex-1 py-1 text-xs rounded-md border transition-colors ${
              durationFilter === opt.value
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <p className="text-xs text-gray-400">Ingen ruter funnet.</p>
      )}
      <ul className="space-y-1.5">
        {filtered.map((route) => {
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
                  {formatMeta(route)}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
