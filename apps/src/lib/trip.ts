import type { Expense } from "./settlement";
import type { PackingItem } from "./packing";

export type Participant = {
  name: string;
};

export type Trip = {
  id: string;
  destination: string;
  date: string;
  createdBy: string;
  participants: Participant[];
  expenses: Expense[];
  packingList: PackingItem[];
};

export type CreateTripInput = {
  id: string;
  destination: string;
  date: string;
  createdBy: string;
};

export function createTrip(input: CreateTripInput): Trip {
  return {
    id: input.id,
    destination: input.destination,
    date: input.date,
    createdBy: input.createdBy,
    participants: [{ name: input.createdBy }],
    expenses: [],
    packingList: [],
  };
}
