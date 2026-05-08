"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface Trip {
  id: string;
  destination: { name: string; lat: number; lon: number };
  activityLevel: "low" | "medium" | "high";
  createdAt: string;
}

const ACTIVITY_LABELS: Record<string, string> = {
  low: "Lav",
  medium: "Medium",
  high: "Høy",
};

export default function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const data = localStorage.getItem(`trip_${id}`);
    if (data) setTrip(JSON.parse(data));
  }, [id]);

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Finner ikke turen.</p>
          <Link href="/tur/ny" className="text-emerald-600 text-sm underline mt-2 inline-block">
            Planlegg ny tur
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <div className="mb-6">
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Tur opprettet</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{trip.destination.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {trip.destination.lat}, {trip.destination.lon}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-emerald-50 rounded-xl px-4 py-3 mb-6">
          <span className="text-sm text-gray-600">Aktivitetsnivå:</span>
          <span className="font-semibold text-emerald-800">
            {ACTIVITY_LABELS[trip.activityLevel] ?? trip.activityLevel}
          </span>
        </div>

        <p className="text-sm text-gray-400 text-center">
          Invitasjoner og turdetaljer kommer snart (issue #3).
        </p>

        <Link
          href="/tur/ny"
          className="mt-6 block text-center text-sm text-emerald-600 hover:underline"
        >
          ← Planlegg en ny tur
        </Link>
      </div>
    </div>
  );
}
