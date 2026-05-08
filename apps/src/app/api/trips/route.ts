import { insertTrip } from "@/lib/supabaseTrips";
import { createTrip, isActivityLevel, isDestination, isRecord } from "@/lib/trips";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!isRecord(body)) {
    return Response.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  if (!isDestination(body.destination)) {
    return Response.json(
      { error: "destination must include name, lat and lon" },
      { status: 400 },
    );
  }

  if (
    body.activityLevel !== undefined &&
    !isActivityLevel(body.activityLevel)
  ) {
    return Response.json(
      { error: "activityLevel must be low, medium or high" },
      { status: 400 },
    );
  }

  try {
    const trip = await insertTrip(
      createTrip({
        destination: body.destination,
        activityLevel: body.activityLevel,
      }),
    );

    return Response.json({ id: trip.id, trip }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function toErrorResponse(error: unknown) {
  const status =
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : 500;
  const message = error instanceof Error ? error.message : "Unknown server error";

  return Response.json({ error: message }, { status });
}
