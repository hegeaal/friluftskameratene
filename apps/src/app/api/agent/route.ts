import { anthropic } from "@ai-sdk/anthropic";
import { streamText, convertToModelMessages, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/agent/system-prompt";

export const maxDuration = 30;

type ActivityLevel = "low" | "medium" | "high";

interface TripContext {
  destination: { name: string; lat: number; lon: number };
  activityLevel: ActivityLevel;
}

interface RouteResult {
  id: string;
  name: string;
  distance: number | null;
  durationHoursAb: number | null;
  gradingAb: string | null;
  geojson: { type: string; coordinates: number[][] } | null;
}

const SYMBOL_TO_EMOJI: Record<string, string> = {
  clearsky: "☀️",
  fair: "🌤️",
  partlycloudy: "⛅",
  cloudy: "☁️",
  lightrain: "🌧️",
  rain: "🌧️",
  heavyrain: "⛈️",
  lightsnow: "❄️",
  snow: "❄️",
  heavysnow: "❄️",
  sleet: "🌨️",
  fog: "🌫️",
};

function symbolToEmoji(code: string | undefined): string {
  if (!code) return "🌤️";
  const base = code.replace(/_day$|_night$|_polartwilight$/, "");
  return SYMBOL_TO_EMOJI[base] ?? "🌤️";
}

async function fetchUtnoRoutes(lat: number, lon: number, maxDistance: number): Promise<RouteResult[]> {
  const res = await fetch(
    "https://ut-backend-api-2-41145913385.europe-north1.run.app/internal/graphql",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://ut.no" },
      body: JSON.stringify({
        query: `{
          routesNear(input: { coordinates: [${lon}, ${lat}], maxDistance: ${maxDistance} }) {
            route { id name distance durationHoursAb gradingAb geojson }
          }
        }`,
      }),
    }
  );
  const data = await res.json();
  return (data.data?.routesNear ?? [])
    .map((item: { route: RouteResult }) => item.route)
    .filter((r: RouteResult) => r.geojson?.coordinates?.length)
    .slice(0, 6);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { tripContext, messages }: { tripContext: TripContext; messages: UIMessage[] } = body;
  const { destination, activityLevel } = tripContext;
  const { lat, lon } = destination;

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: buildSystemPrompt(destination, activityLevel),
    messages: modelMessages,
    stopWhen: stepCountIs(5),
    tools: {
      hent_ruter: tool({
        description:
          "Hent turforslag fra UT.no nær destinasjonen. Bruk når brukeren vil ha turanbefalinger.",
        inputSchema: z.object({
          maxDistance: z
            .number()
            .default(50000)
            .describe("Søkeradius i meter fra destinasjonen (standard 50 km)"),
        }),
        execute: async ({ maxDistance }) => {
          const routes = await fetchUtnoRoutes(lat, lon, maxDistance);
          return { routes };
        },
      }),

      hent_vaer: tool({
        description:
          "Hent 5-dagers værvarslet fra Yr for destinasjonen. Bruk alltid dette FØR du lager pakkeliste.",
        inputSchema: z.object({}),
        execute: async () => {
          const res = await fetch(
            `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`,
            { headers: { "User-Agent": process.env.MET_USER_AGENT ?? "friluftskameratene/1.0" } }
          );
          const data = await res.json();
          const timeseries: Array<{
            time: string;
            data: {
              instant: { details: { air_temperature: number; wind_speed: number } };
              next_6_hours?: { summary?: { symbol_code?: string }; details?: { precipitation_amount?: number } };
            };
          }> = data.properties?.timeseries ?? [];

          const daily: Array<{ day: string; emoji: string; tempMin: number; tempMax: number; nedbor: number }> = [];
          const seen = new Set<string>();

          for (const entry of timeseries) {
            const date = new Date(entry.time);
            const dateKey = date.toISOString().slice(0, 10);
            if (seen.has(dateKey)) continue;
            seen.add(dateKey);
            if (daily.length >= 5) break;

            const hour = date.getUTCHours();
            if (hour !== 0 && daily.length === 0 && hour > 6) {
              // accept first available slot even if not midnight
            } else if (hour !== 0 && daily.length > 0) {
              continue;
            }

            daily.push({
              day: date.toLocaleDateString("nb-NO", { weekday: "long", timeZone: "Europe/Oslo" }),
              emoji: symbolToEmoji(entry.data.next_6_hours?.summary?.symbol_code),
              tempMin: Math.round(entry.data.instant.details.air_temperature),
              tempMax: Math.round(entry.data.instant.details.air_temperature),
              nedbor: entry.data.next_6_hours?.details?.precipitation_amount ?? 0,
            });
          }

          return { days: daily };
        },
      }),

      oppdater_pakkeliste: tool({
        description:
          "Sett pakkelisten for turen. Kall hent_vaer først og bruk værdataene til å tilpasse listen.",
        inputSchema: z.object({
          items: z.array(z.string()).describe("Pakkeliste-elementer tilpasset vær og aktivitetsnivå"),
        }),
        execute: async ({ items }) => ({ items }),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
