"use client";

import { useState, useEffect, useRef } from "react";

interface Place {
  name: string;
  lat: number;
  lon: number;
}

interface GeonorgeResult {
  stedsnavn: { skrivemåte: string }[];
  representasjonspunkt: { nord: number; øst: number };
}

interface PlaceSearchProps {
  onSelect: (place: Place) => void;
}

export default function PlaceSearch({ onSelect }: PlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://ws.geonorge.no/stedsnavn/v1/sted?sok=${encodeURIComponent(query)}&treffPerSide=5`
        );
        const data = await res.json();
        const places: Place[] = (data.navn ?? []).map((item: GeonorgeResult) => ({
          name: item.stedsnavn[0]?.skrivemåte ?? "",
          lat: parseFloat(item.representasjonspunkt.nord.toFixed(4)),
          lon: parseFloat(item.representasjonspunkt.øst.toFixed(4)),
        }));
        setResults(places);
        setIsOpen(places.length > 0);
      } catch {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(place: Place) {
    setQuery(place.name);
    setIsOpen(false);
    onSelect(place);
  }

  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 mb-1 block">Søk etter sted</label>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder="F.eks. Rondane, Galdhøpiggen..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      {isOpen && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((place, i) => (
            <li
              key={i}
              onMouseDown={() => handleSelect(place)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-emerald-50 hover:text-emerald-800"
            >
              {place.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
