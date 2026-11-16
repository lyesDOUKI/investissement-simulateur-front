import type { AllocationLine } from "@/domain/models/operation";

/** Keeps decimal separators and trailing decimals intact while a user edits a line. */
export type AllocationDraft = Omit<AllocationLine, "amount"> & { amount: string };
export type AllocationDraftField = "isin" | "name" | "instrumentKind" | "amount";

export function toAllocationLine(draft: AllocationDraft): AllocationLine {
  const normalizedAmount = draft.amount.trim().replace(",", ".");
  const amount = Number(normalizedAmount);
  return { ...draft, amount: Number.isFinite(amount) ? amount : 0 };
}
