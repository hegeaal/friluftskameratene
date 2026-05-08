import { describe, expect, it } from "vitest";
import { calculateSettlement } from "./settlement";

describe("calculateSettlement", () => {
  it("balances when one person paid for everyone", () => {
    const debts = calculateSettlement(
      ["Ola", "Kari", "Per"],
      [{ description: "Mat", amount: 300, paidBy: "Ola" }],
    );

    expect(debts).toHaveLength(2);
    expect(debts).toContainEqual({ from: "Kari", to: "Ola", amount: 100 });
    expect(debts).toContainEqual({ from: "Per", to: "Ola", amount: 100 });
  });

  it("nets out when expenses are balanced", () => {
    const debts = calculateSettlement(
      ["Ola", "Kari"],
      [
        { description: "Mat", amount: 200, paidBy: "Ola" },
        { description: "Drivstoff", amount: 200, paidBy: "Kari" },
      ],
    );

    expect(debts).toEqual([]);
  });

  it("returns empty list when there are no participants", () => {
    expect(calculateSettlement([], [])).toEqual([]);
  });

  it("throws when paidBy is not in the participants list", () => {
    expect(() =>
      calculateSettlement(
        ["Ola"],
        [{ description: "Mat", amount: 100, paidBy: "Ukjent" }],
      ),
    ).toThrow(/Ukjent/);
  });

  it("returns no debts for a single participant who paid for themselves", () => {
    expect(
      calculateSettlement(
        ["Ola"],
        [{ description: "Mat", amount: 100, paidBy: "Ola" }],
      ),
    ).toEqual([]);
  });

  it("handles non-integer split with reasonable precision", () => {
    const debts = calculateSettlement(
      ["Ola", "Kari", "Per"],
      [{ description: "Mat", amount: 100, paidBy: "Ola" }],
    );

    const total = debts.reduce((s, d) => s + d.amount, 0);
    expect(total).toBeCloseTo(66.67, 1);
    expect(debts.every((d) => d.to === "Ola")).toBe(true);
  });
});
