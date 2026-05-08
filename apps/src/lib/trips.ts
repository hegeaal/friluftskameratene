export type ActivityLevel = "low" | "medium" | "high";
export type Rsvp = "yes" | "no" | "maybe";

export type Destination = {
  name: string;
  lat: number;
  lon: number;
};

export type DateRange = {
  from: string;
  to: string;
};

export type SuggestedDate = DateRange & {
  reason?: string;
  weatherSummary?: string;
};

export type Participant = {
  name: string;
  rsvp: Rsvp;
};

export type PackingItem = {
  id?: string;
  item?: string;
  name?: string;
  reason?: string;
  assignedTo?: string | null;
  checked?: boolean;
};

export type Expense = {
  id?: string;
  description: string;
  amount: number;
  paidBy: string;
};

export type Trip = {
  id: string;
  destination: Destination;
  activityLevel: ActivityLevel;
  suggestedDates: SuggestedDate[];
  chosenDate: DateRange | null;
  participants: Participant[];
  packingList: PackingItem[];
  expenses: Expense[];
  createdAt: string;
  updatedAt: string;
};

export type CreateTripInput = {
  destination: Destination;
  activityLevel?: ActivityLevel;
};

export type TripPatch = Partial<
  Pick<
    Trip,
    | "destination"
    | "activityLevel"
    | "suggestedDates"
    | "chosenDate"
    | "participants"
    | "packingList"
    | "expenses"
  >
> & {
  participant?: Participant;
  packingItem?: PackingItem;
  expense?: Expense;
};

export function createTrip(input: CreateTripInput): Trip {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    destination: input.destination,
    activityLevel: input.activityLevel ?? "medium",
    suggestedDates: [],
    chosenDate: null,
    participants: [],
    packingList: [],
    expenses: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function applyTripPatch(trip: Trip, patch: TripPatch): Trip {
  const next: Trip = {
    ...trip,
    destination: patch.destination ?? trip.destination,
    activityLevel: patch.activityLevel ?? trip.activityLevel,
    suggestedDates: patch.suggestedDates ?? trip.suggestedDates,
    chosenDate: patch.chosenDate === undefined ? trip.chosenDate : patch.chosenDate,
    participants: patch.participants ?? trip.participants,
    packingList: patch.packingList ?? trip.packingList,
    expenses: patch.expenses ?? trip.expenses,
    updatedAt: new Date().toISOString(),
  };

  if (patch.participant) {
    next.participants = upsertParticipant(next.participants, patch.participant);
  }

  if (patch.packingItem) {
    next.packingList = [...next.packingList, patch.packingItem];
  }

  if (patch.expense) {
    next.expenses = [...next.expenses, patch.expense];
  }

  return next;
}

export function isDestination(value: unknown): value is Destination {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    typeof value.lat === "number" &&
    Number.isFinite(value.lat) &&
    typeof value.lon === "number" &&
    Number.isFinite(value.lon)
  );
}

export function isActivityLevel(value: unknown): value is ActivityLevel {
  return value === "low" || value === "medium" || value === "high";
}

export function isParticipant(value: unknown): value is Participant {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    value.name.trim().length > 0 &&
    (value.rsvp === "yes" || value.rsvp === "no" || value.rsvp === "maybe")
  );
}

export function isPackingItem(value: unknown): value is PackingItem {
  if (!isRecord(value)) return false;
  return (
    (typeof value.item === "string" && value.item.trim().length > 0) ||
    (typeof value.name === "string" && value.name.trim().length > 0)
  );
}

export function isExpense(value: unknown): value is Expense {
  if (!isRecord(value)) return false;
  return (
    typeof value.description === "string" &&
    value.description.trim().length > 0 &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    typeof value.paidBy === "string" &&
    value.paidBy.trim().length > 0
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function upsertParticipant(
  participants: Participant[],
  participant: Participant,
): Participant[] {
  const existing = participants.findIndex(
    (p) => p.name.toLowerCase() === participant.name.toLowerCase(),
  );

  if (existing === -1) return [...participants, participant];

  return participants.map((p, index) => (index === existing ? participant : p));
}
