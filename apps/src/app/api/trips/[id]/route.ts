import { findTrip, updateTrip } from "@/lib/supabaseTrips";
import {
  applyTripPatch,
  isActivityLevel,
  isDestination,
  isExpense,
  isPackingItem,
  isParticipant,
  isRecord,
} from "@/lib/trips";
import type { TripPatch } from "@/lib/trips";

type TripRouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: TripRouteContext) {
  const { id } = await context.params;

  try {
    const trip = await findTrip(id);
    if (!trip) return Response.json({ error: "Trip not found" }, { status: 404 });

    return Response.json({ trip });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: TripRouteContext) {
  const { id } = await context.params;
  const body = await readJson(request);

  if (!isRecord(body)) {
    return Response.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  const validationError = validatePatch(body);
  if (validationError) {
    return Response.json({ error: validationError }, { status: 400 });
  }

  try {
    const trip = await findTrip(id);
    if (!trip) return Response.json({ error: "Trip not found" }, { status: 404 });

    const updatedTrip = await updateTrip(applyTripPatch(trip, body as TripPatch));
    return Response.json({ trip: updatedTrip });
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

function validatePatch(body: Record<string, unknown>): string | null {
  if (body.destination !== undefined && !isDestination(body.destination)) {
    return "destination must include name, lat and lon";
  }

  if (
    body.activityLevel !== undefined &&
    !isActivityLevel(body.activityLevel)
  ) {
    return "activityLevel must be low, medium or high";
  }

  for (const field of ["suggestedDates", "participants", "packingList", "expenses"]) {
    if (body[field] !== undefined && !Array.isArray(body[field])) {
      return `${field} must be an array`;
    }
  }

  if (
    body.chosenDate !== undefined &&
    body.chosenDate !== null &&
    !isRecord(body.chosenDate)
  ) {
    return "chosenDate must be an object or null";
  }

  if (body.participant !== undefined && !isParticipant(body.participant)) {
    return "participant must include name and rsvp";
  }

  if (body.packingItem !== undefined && !isPackingItem(body.packingItem)) {
    return "packingItem must include item or name";
  }

  if (body.expense !== undefined && !isExpense(body.expense)) {
    return "expense must include description, positive amount and paidBy";
  }

  return null;
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
