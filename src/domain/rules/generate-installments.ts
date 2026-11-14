import type { Operation } from "@/domain/models/operation";
import { addBusinessDays, dateToIso, isoToLocalDate, parseDate } from "./dates";

export interface GeneratedInstallment {
  dueDate: string;
  executionDate: string;
}

export function generateInstallments(
  operation: Operation,
  valuationDate: string,
): GeneratedInstallment[] {
  const target = parseDate(valuationDate) ?? isoToLocalDate(valuationDate);
  const configured = parseDate(operation.date);
  if (!target || !configured || configured > target) return [];

  if (operation.kind === "versement") {
    return [{ dueDate: dateToIso(configured), executionDate: dateToIso(configured) }];
  }

  const dayOfMonth = operation.executionDay ?? 5;
  const delay = operation.delayBusinessDays ?? 0;
  let year = configured.getUTCFullYear();
  let month = configured.getUTCMonth();
  let due = new Date(Date.UTC(year, month, dayOfMonth));
  if (due < configured) {
    due = new Date(Date.UTC(year, month + 1, dayOfMonth));
  }

  const installments: GeneratedInstallment[] = [];
  while (due <= target) {
    const execution = addBusinessDays(due, delay);
    if (execution <= target) {
      installments.push({
        dueDate: dateToIso(due),
        executionDate: dateToIso(execution),
      });
    }
    month += 1;
    if (month > 11) {
      year += 1;
      month = 0;
    }
    due = new Date(Date.UTC(year, month, dayOfMonth));
  }
  return installments;
}
