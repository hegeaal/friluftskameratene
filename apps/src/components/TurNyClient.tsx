"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import MapPicker from "./MapPicker";
import PlaceSearch from "./PlaceSearch";
import ActivitySelector from "./ActivitySelector";
import TripRecommendations from "./TripRecommendations";

// Fix Leaflet default icon in Next.js/Webpack
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});

type ActivityLevel = "low" | "medium" | "high";

interface Destination {
  name: string;
  lat: number;
  lon: number;
}

export default function TurNyClient() {
  const router = useRouter();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("medium");
  const flyToRef = useRef<((lat: number, lon: number) => void) | null>(null);

  function handlePlaceSelect(place: Destination) {
    setDestination(place);
    flyToRef.current?.(place.lat, place.lon);
  }

  function handleFindTrips() {
    if (!destination) return;
    const id = crypto.randomUUID();
    const trip = { id, destination, activityLevel, createdAt: new Date().toISOString() };
    localStorage.setItem(`trip_${id}`, JSON.stringify(trip));
    router.push(`/tur/${id}`);
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col p-6 gap-6 overflow-y-auto">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Planlegg ny tur</h1>
          <p className="text-sm text-gray-500 mt-1">
            Søk etter sted eller klikk på kartet for å velge destinasjon.
          </p>
        </div>

        <PlaceSearch onSelect={handlePlaceSelect} />

        {destination && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Valgt destinasjon</p>
            <p className="text-sm text-emerald-900 font-semibold mt-0.5">{destination.name}</p>
            <p className="text-xs text-emerald-700">
              {destination.lat}, {destination.lon}
            </p>
          </div>
        )}

        <ActivitySelector value={activityLevel} onChange={setActivityLevel} />

        <div className="mt-auto">
          <button
            onClick={handleFindTrips}
            disabled={!destination}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 text-white hover:bg-emerald-700 disabled:hover:bg-emerald-600"
          >
            Finn turer →
          </button>
          {!destination && (
            <p className="text-xs text-gray-400 text-center mt-2">Velg destinasjon for å fortsette</p>
          )}
        </div>
      </aside>

      {/* Map */}
      <main className="flex-1 relative">
        <MapPicker
          destination={destination}
          onSelect={setDestination}
          flyToRef={flyToRef}
        />
      </main>
    </div>
  );
}
