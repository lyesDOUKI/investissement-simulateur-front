import type { Operation } from "@/domain/models/operation";

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  )
    return null;
  return parsed;
}

export function estimateOperationValueAtDate(
  operation: Operation,
  targetDate: string,
  annualRate = 0.05,
): number {
  const target = parseLocalDate(targetDate);
  const start = parseLocalDate(operation.date);
  if (!target || !start || target < start) return 0;

  const elapsedDays = Math.floor(
    (target.getTime() - start.getTime()) / 86_400_000,
  );
  const annualGrowth = 1 + annualRate;

  if (operation.kind !== "dca") {
    return operation.amount * annualGrowth ** (elapsedDays / 365.25);
  }

  const stepDays =
    operation.frequency === "Hebdomadaire"
      ? 7
      : operation.frequency === "Trimestriel"
        ? 365.25 / 4
        : 365.25 / 12;
  const periodCount = Math.floor(elapsedDays / stepDays) + 1;
  const ratePerPeriod = annualGrowth ** (stepDays / 365.25) - 1;
  const regularValue =
    ratePerPeriod === 0
      ? operation.amount * periodCount
      : operation.amount *
        ((annualGrowth ** ((stepDays * periodCount) / 365.25) - 1) /
          ratePerPeriod);
  const monthsAfterLastPayment = elapsedDays % stepDays;
  return regularValue * annualGrowth ** (monthsAfterLastPayment / 365.25);
}
