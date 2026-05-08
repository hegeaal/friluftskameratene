"use client";

type ActivityLevel = "low" | "medium" | "high";

const OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "low", label: "Lav" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "Høy" },
];

interface ActivitySelectorProps {
  value: ActivityLevel;
  onChange: (level: ActivityLevel) => void;
}

export default function ActivitySelector({ value, onChange }: ActivitySelectorProps) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Aktivitetsnivå</p>
      <div className="flex gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
              value === option.value
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-700 border-gray-300 hover:border-emerald-400"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
