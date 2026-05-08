import { describe, expect, it } from "vitest";
import { createTrip } from "./trip";

describe("createTrip", () => {
  it("creates a trip with creator as first participant and empty collections", () => {
    const trip = createTrip({
      id: "trip-1",
      destination: "Besseggen",
      date: "2026-07-15",
      createdBy: "Ola",
    });

    expect(trip).toEqual({
      id: "trip-1",
      destination: "Besseggen",
      date: "2026-07-15",
      createdBy: "Ola",
      participants: [{ name: "Ola" }],
      expenses: [],
      packingList: [],
    });
  });
});
