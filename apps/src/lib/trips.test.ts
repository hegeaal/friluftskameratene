import { describe, expect, it } from "vitest";
import {
  applyTripPatch,
  createTrip,
  isDestination,
  isExpense,
  isPackingItem,
  isParticipant,
} from "./trips";

describe("createTrip", () => {
  it("creates the JSONB trip shape used by the API routes", () => {
    const trip = createTrip({
      destination: { name: "Rondane", lat: 62, lon: 9.8 },
      activityLevel: "medium",
    });

    expect(trip.id).toEqual(expect.any(String));
    expect(trip.destination).toEqual({ name: "Rondane", lat: 62, lon: 9.8 });
    expect(trip.activityLevel).toBe("medium");
    expect(trip.suggestedDates).toEqual([]);
    expect(trip.chosenDate).toBeNull();
    expect(trip.participants).toEqual([]);
    expect(trip.packingList).toEqual([]);
    expect(trip.expenses).toEqual([]);
  });
});

describe("applyTripPatch", () => {
  it("upserts participants by name", () => {
    const trip = createTrip({
      destination: { name: "Rondane", lat: 62, lon: 9.8 },
    });

    const withMaybe = applyTripPatch(trip, {
      participant: { name: "Ola", rsvp: "maybe" },
    });
    const withYes = applyTripPatch(withMaybe, {
      participant: { name: "ola", rsvp: "yes" },
    });

    expect(withYes.participants).toEqual([{ name: "ola", rsvp: "yes" }]);
  });

  it("appends packing items and expenses", () => {
    const trip = createTrip({
      destination: { name: "Rondane", lat: 62, lon: 9.8 },
    });

    const updated = applyTripPatch(trip, {
      packingItem: { item: "Regntøy", reason: "Regn spådd lørdag" },
      expense: { description: "Bensin", amount: 450, paidBy: "Kari" },
    });

    expect(updated.packingList).toEqual([
      { item: "Regntøy", reason: "Regn spådd lørdag" },
    ]);
    expect(updated.expenses).toEqual([
      { description: "Bensin", amount: 450, paidBy: "Kari" },
    ]);
  });
});

describe("isDestination", () => {
  it("requires name, lat and lon", () => {
    expect(isDestination({ name: "Rondane", lat: 62, lon: 9.8 })).toBe(true);
    expect(isDestination({ name: "Rondane", lat: "62", lon: 9.8 })).toBe(false);
    expect(isDestination({ lat: 62, lon: 9.8 })).toBe(false);
  });
});

describe("patch validators", () => {
  it("validates participant, packing item and expense payloads", () => {
    expect(isParticipant({ name: "Ola", rsvp: "maybe" })).toBe(true);
    expect(isParticipant({ name: "Ola", rsvp: "later" })).toBe(false);

    expect(isPackingItem({ item: "Regntøy" })).toBe(true);
    expect(isPackingItem({ reason: "Regn" })).toBe(false);

    expect(isExpense({ description: "Bensin", amount: 450, paidBy: "Kari" })).toBe(true);
    expect(isExpense({ description: "Bensin", amount: 0, paidBy: "Kari" })).toBe(false);
  });
});
