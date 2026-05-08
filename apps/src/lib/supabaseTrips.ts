import type { Trip } from "./trips";

type SupabaseTripRow = {
  id: string;
  data: Trip;
};

const SELECT_TRIP_FIELDS = "id,data";

export async function insertTrip(trip: Trip): Promise<Trip> {
  const rows = await supabaseRequest<SupabaseTripRow[]>("/rest/v1/trips", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: trip.id,
      data: trip,
    }),
  });

  const row = rows[0];
  if (!row) throw new SupabaseTripError("Supabase returned no trip after insert", 502);
  return row.data;
}

export async function findTrip(id: string): Promise<Trip | null> {
  const rows = await supabaseRequest<SupabaseTripRow[]>(
    `/rest/v1/trips?id=eq.${encodeURIComponent(id)}&select=${SELECT_TRIP_FIELDS}`,
    {
      method: "GET",
    },
  );

  return rows[0]?.data ?? null;
}

export async function updateTrip(trip: Trip): Promise<Trip> {
  const rows = await supabaseRequest<SupabaseTripRow[]>(
    `/rest/v1/trips?id=eq.${encodeURIComponent(trip.id)}&select=${SELECT_TRIP_FIELDS}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        data: trip,
      }),
    },
  );

  const row = rows[0];
  if (!row) throw new SupabaseTripError("Trip was not found during update", 404);
  return row.data;
}

export class SupabaseTripError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SupabaseTripError";
    this.status = status;
  }
}

async function supabaseRequest<T>(path: string, init: RequestInit): Promise<T> {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message =
      getSupabaseErrorMessage(payload) ??
      `Supabase request failed with status ${response.status}`;
    throw new SupabaseTripError(message, response.status);
  }

  return payload as T;
}

function getSupabaseConfig(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new SupabaseTripError("Supabase environment variables are missing", 500);
  }

  return { url, key };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getSupabaseErrorMessage(payload: unknown): string | null {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  return null;
}
