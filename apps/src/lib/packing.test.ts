import { describe, expect, it } from "vitest";
import { applyWeatherTriggers } from "./packing";

describe("applyWeatherTriggers", () => {
  it("adds regntøy with reason when forecast has precipitation", () => {
    const result = applyWeatherTriggers(
      [{ name: "Sovepose" }],
      [
        { date: "2026-05-10", precipitationMm: 0 },
        { date: "2026-05-11", precipitationMm: 4.2 },
      ],
    );

    expect(result).toContainEqual({
      name: "Regntøy",
      reason: "Regn spådd 2026-05-11",
    });
  });

  it("leaves base list unchanged when forecast is dry", () => {
    const base = [{ name: "Sovepose" }, { name: "Termos" }];
    const result = applyWeatherTriggers(base, [
      { date: "2026-05-10", precipitationMm: 0 },
    ]);

    expect(result).toEqual(base);
  });

  it("does not duplicate regntøy if already present", () => {
    const result = applyWeatherTriggers(
      [{ name: "Regntøy", reason: "Lagt til manuelt" }],
      [{ date: "2026-05-10", precipitationMm: 5 }],
    );

    expect(result.filter((i) => i.name.toLowerCase().includes("regntøy"))).toHaveLength(1);
  });

  it("triggers regntøy at exactly the 0.5mm threshold", () => {
    const result = applyWeatherTriggers(
      [],
      [{ date: "2026-05-10", precipitationMm: 0.5 }],
    );

    expect(result.some((i) => i.name === "Regntøy")).toBe(true);
  });

  it("does not trigger regntøy just below the threshold", () => {
    const result = applyWeatherTriggers(
      [],
      [{ date: "2026-05-10", precipitationMm: 0.49 }],
    );

    expect(result).toEqual([]);
  });

  it("returns a new array reference even when nothing changes", () => {
    const base = [{ name: "Sovepose" }];
    const result = applyWeatherTriggers(base, [
      { date: "2026-05-10", precipitationMm: 0 },
    ]);

    expect(result).toEqual(base);
    expect(result).not.toBe(base);
  });
});
