"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";

type ActivityLevel = "low" | "medium" | "high";

interface TripContext {
  destination: { name: string; lat: number; lon: number };
  activityLevel: ActivityLevel;
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

interface ChatPanelProps {
  tripContext: TripContext;
  onRoutesUpdate: (routes: Route[]) => void;
  onWeatherUpdate: (days: WeatherDay[]) => void;
  onPackingUpdate: (items: string[]) => void;
}

const TOOL_LABELS: Record<string, string> = {
  hent_ruter: "Henter ruter fra UT.no…",
  hent_vaer: "Henter vær fra Yr…",
  oppdater_pakkeliste: "Oppdaterer pakkeliste…",
};

const GRADING_LABEL: Record<string, string> = {
  EASY: "Enkel",
  MODERATE: "Middels",
  TOUGH: "Krevende",
  VERY_TOUGH: "Ekstra krevende",
};

function formatMeta(route: Route): string {
  const parts: string[] = [];
  if (route.gradingAb) parts.push(GRADING_LABEL[route.gradingAb] ?? route.gradingAb);
  if (route.durationHoursAb) parts.push(`${route.durationHoursAb} t`);
  if (route.distance) parts.push(`${(route.distance / 1000).toFixed(1)} km`);
  return parts.join(" · ");
}

function welcomeMessage(destination: string): UIMessage {
  const text = `Hei! Jeg ser du planlegger tur til ${destination} 🥾\n\nJeg kan hjelpe deg med å:\n- Finne turforslag i nærheten fra UT.no\n- Sjekke værvarselet fra Yr\n- Lage en pakkeliste tilpasset forholdene\n\nHva vil du starte med?`;
  return {
    id: "welcome",
    role: "assistant",
    parts: [{ type: "text", text }],
  };
}

export default function ChatPanel({
  tripContext,
  onRoutesUpdate,
  onWeatherUpdate,
  onPackingUpdate,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    messages: [welcomeMessage(tripContext.destination.name)],
    transport: new DefaultChatTransport({
      api: "/api/agent",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { tripContext, messages },
      }),
    }),
  });

  const sending = status === "submitted" || status === "streaming";

  // Parse tool results and lift state to parent
  useEffect(() => {
    for (const msg of messages) {
      for (const part of msg.parts ?? []) {
        const p = part as { type: string; state?: string; output?: unknown };
        if (!p.type.startsWith("tool-") || p.state !== "result") continue;
        const toolName = p.type.slice("tool-".length);
        const output = p.output as Record<string, unknown>;
        if (toolName === "hent_ruter" && output?.routes) {
          onRoutesUpdate(output.routes as Route[]);
        }
        if (toolName === "hent_vaer" && output?.days) {
          onWeatherUpdate(output.days as WeatherDay[]);
        }
        if (toolName === "oppdater_pakkeliste" && output?.items) {
          onPackingUpdate(output.items as string[]);
        }
      }
    }
  }, [messages, onRoutesUpdate, onWeatherUpdate, onPackingUpdate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm " +
                  (isUser
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-gray-200 text-gray-800")
                }
              >
                {(msg.parts ?? []).map((part, i) => {
                  const p = part as { type: string; text?: string; state?: string };
                  if (p.type === "text" && p.text) {
                    return (
                      <p key={i} className="whitespace-pre-wrap leading-relaxed">
                        {p.text}
                      </p>
                    );
                  }
                  if (p.type.startsWith("tool-") && p.state === "call") {
                    const toolName = p.type.slice("tool-".length);
                    return (
                      <p key={i} className="text-xs text-gray-400 italic">
                        {TOOL_LABELS[toolName] ?? `↻ ${toolName}`}
                      </p>
                    );
                  }
                  if (p.type.startsWith("tool-") && p.state === "result") {
                    const toolName = p.type.slice("tool-".length);
                    if (toolName === "hent_ruter") {
                      const output = (p as { output?: { routes?: Route[] } }).output;
                      const routes = output?.routes ?? [];
                      if (!routes.length) return null;
                      return (
                        <div key={i} className="mt-1 space-y-1">
                          {routes.map((r) => (
                            <div key={r.id} className="text-xs bg-emerald-50 rounded px-2 py-1">
                              <span className="font-medium">{r.name}</span>
                              <span className="text-gray-500 ml-1">{formatMeta(r)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                  }
                  return null;
                })}
              </div>
            </div>
          );
        })}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl px-3 py-2">
              <span className="text-gray-400 text-sm">●●●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        className="border-t border-gray-200 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || sending) return;
          sendMessage({ text: input });
          setInput("");
        }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv en melding…"
            disabled={sending}
            className="flex-1 px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
