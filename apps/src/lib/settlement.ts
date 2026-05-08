export type Expense = {
  description: string;
  amount: number;
  paidBy: string;
};

export type Debt = {
  from: string;
  to: string;
  amount: number;
};

export function calculateSettlement(
  participants: string[],
  expenses: Expense[],
): Debt[] {
  if (participants.length === 0) return [];

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const share = total / participants.length;

  const balances = new Map<string, number>();
  for (const p of participants) balances.set(p, -share);
  for (const e of expenses) {
    const current = balances.get(e.paidBy);
    if (current === undefined) {
      throw new Error(`Betaler "${e.paidBy}" er ikke i deltakerlisten`);
    }
    balances.set(e.paidBy, current + e.amount);
  }

  const creditors = [...balances.entries()]
    .filter(([, b]) => b > 0.005)
    .sort((a, b) => b[1] - a[1]);
  const debtors = [...balances.entries()]
    .filter(([, b]) => b < -0.005)
    .sort((a, b) => a[1] - b[1]);

  const debts: Debt[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const [debtor, debtBalance] = debtors[i];
    const [creditor, creditBalance] = creditors[j];
    const amount = Math.min(-debtBalance, creditBalance);
    debts.push({ from: debtor, to: creditor, amount: round2(amount) });
    debtors[i] = [debtor, debtBalance + amount];
    creditors[j] = [creditor, creditBalance - amount];
    if (Math.abs(debtors[i][1]) < 0.005) i++;
    if (Math.abs(creditors[j][1]) < 0.005) j++;
  }

  return debts;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
