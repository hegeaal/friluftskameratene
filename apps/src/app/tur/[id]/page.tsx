"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import PlaceSearch from "@/components/PlaceSearch";
import ActivitySelector from "@/components/ActivitySelector";
import TripRecommendations from "@/components/TripRecommendations";
import ChatPanel from "@/components/ChatPanel";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

type ActivityLevel = "low" | "medium" | "high";

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
  gradingAb: string | null;
  geojson: { type: string; coordinates: number[][] } | null;
}

interface WeatherDay {
  day: string;
  emoji: string;
  tempMin: number;
  tempMax: number;
  nedbor: number;
}

interface TurPlan {
  routes: Route[];
  weather: WeatherDay[];
  packingList: string[];
}

const GRADING_LABEL: Record<string, { label: string; color: string }> = {
  EASY: { label: "Enkel", color: "text-green-600" },
  MODERATE: { label: "Middels", color: "text-blue-600" },
  TOUGH: { label: "Krevende", color: "text-red-600" },
  VERY_TOUGH: { label: "Ekstra krevende", color: "text-gray-900" },
};

function emptyPlan(): TurPlan {
  return { routes: [], weather: [], packingList: [] };
}

export default function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("medium");
  const [turplan, setTurplan] = useState<TurPlan>(emptyPlan());
  const flyToRef = useRef<((lat: number, lon: number) => void) | null>(null);

  // Load from localStorage
  useEffect(() => {
    const raw = localStorage.getItem(`trip_${id}`);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.destination) setDestination(saved.destination);
      if (saved.activityLevel) setActivityLevel(saved.activityLevel);
    }
    const plan = localStorage.getItem(`turplan_${id}`);
    if (plan) setTurplan(JSON.parse(plan));
  }, [id]);

  // Persist trip state on changes
  useEffect(() => {
    const trip = { id, destination, activityLevel, createdAt: new Date().toISOString() };
    localStorage.setItem(`trip_${id}`, JSON.stringify(trip));
  }, [id, destination, activityLevel]);

  const savePlan = useCallback((plan: TurPlan) => {
    localStorage.setItem(`turplan_${id}`, JSON.stringify(plan));
  }, [id]);

  const onRoutesUpdate = useCallback((routes: Route[]) => {
    setTurplan((prev) => {
      const next = { ...prev, routes };
      savePlan(next);
      return next;
    });
    if (routes[0]?.geojson?.coordinates?.[0]) {
      const [lon, lat] = routes[0].geojson.coordinates[0];
      flyToRef.current?.(lat, lon);
    }
  }, [savePlan]);

  const onWeatherUpdate = useCallback((weather: WeatherDay[]) => {
    setTurplan((prev) => {
      const next = { ...prev, weather };
      savePlan(next);
      return next;
    });
  }, [savePlan]);

  const onPackingUpdate = useCallback((packingList: string[]) => {
    setTurplan((prev) => {
      const next = { ...prev, packingList };
      savePlan(next);
      return next;
    });
  }, [savePlan]);

  function handlePlaceSelect(place: Destination) {
    setDestination(place);
    flyToRef.current?.(place.lat, place.lon);
  }

  const hasPlan =
    turplan.routes.length > 0 ||
    turplan.weather.length > 0 ||
    turplan.packingList.length > 0;

  const tripContext = destination
    ? { destination, activityLevel }
    : null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left sidebar */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">

        {/* Place search + activity */}
        <div className="p-4 flex flex-col gap-4 flex-shrink-0 border-b border-gray-100">
          <div>
            <h1 className="text-base font-bold text-gray-900">Planlegg tur</h1>
            <p className="text-xs text-gray-400 mt-0.5">Søk etter sted eller klikk på kartet.</p>
          </div>
          <PlaceSearch onSelect={handlePlaceSelect} />
          {destination && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Valgt destinasjon</p>
              <p className="text-sm text-emerald-900 font-semibold mt-0.5 truncate">{destination.name}</p>
            </div>
          )}
          <ActivitySelector value={activityLevel} onChange={setActivityLevel} />
        </div>

        {/* Hytter legend */}
        <div className="flex-shrink-0 border-b border-gray-100 px-4 py-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            Hytter i kartet
          </p>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
            <li className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#16a34a" }} />
              Betjent
            </li>
            <li className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#d97706" }} />
              Selvbetjent
            </li>
            <li className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#6b7280" }} />
              Ubetjent
            </li>
            <li className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#7c3aed" }} />
              Utleiehytte
            </li>
          </ul>
        </div>

        {/* UT.no route recommendations */}
        <div className="flex-shrink-0 max-h-52 overflow-y-auto border-b border-gray-100 p-4">
          <TripRecommendations
            activityLevel={activityLevel}
            destination={destination}
            onSelect={handlePlaceSelect}
          />
        </div>

        {/* AI Chat */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {tripContext ? (
            <ChatPanel
              tripContext={tripContext}
              onRoutesUpdate={onRoutesUpdate}
              onWeatherUpdate={onWeatherUpdate}
              onPackingUpdate={onPackingUpdate}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-xs text-gray-400 text-center">
                Velg en destinasjon for å starte AI-assistenten.
              </p>
            </div>
          )}
        </div>

        {/* Turplan */}
        {hasPlan && (
          <div className="border-t border-gray-200 p-4 space-y-3 flex-shrink-0 max-h-52 overflow-y-auto bg-gray-50">
            {turplan.routes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  🥾 Foreslåtte ruter
                </p>
                <ul className="space-y-1">
                  {turplan.routes.map((route) => {
                    const grading = route.gradingAb ? GRADING_LABEL[route.gradingAb] : null;
                    return (
                      <li key={route.id} className="text-xs text-gray-700">
                        <span className="font-medium">{route.name}</span>
                        {grading && <span className={`ml-1 ${grading.color}`}> · {grading.label}</span>}
                        {route.durationHoursAb && <span className="text-gray-400"> · {route.durationHoursAb} t</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {turplan.weather.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Vær</p>
                <div className="flex gap-3 flex-wrap">
                  {turplan.weather.map((day) => (
                    <div key={day.day} className="text-center">
                      <p className="text-xs text-gray-500 capitalize">{day.day.slice(0, 3)}</p>
                      <p className="text-base leading-tight">{day.emoji}</p>
                      <p className="text-xs text-gray-600">{day.tempMin}°</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {turplan.packingList.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  📋 Pakkeliste
                </p>
                <ul className="space-y-0.5">
                  {turplan.packingList.map((item, i) => (
                    <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                      <span className="text-gray-300 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Map */}
      <main className="flex-1 relative">
        <MapPicker
          destination={destination}
          onSelect={setDestination}
          flyToRef={flyToRef}
          aiRoutes={turplan.routes}
        />
      </main>
    </div>
  );
}
