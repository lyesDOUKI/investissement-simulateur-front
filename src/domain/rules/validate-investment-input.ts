import type { CreateOperationInput } from "@/domain/models/operation";
import { isValidIsin } from "./is-valid-isin";
import { parseDate } from "./dates";

export function validateInvestmentInput(input: CreateOperationInput): void {
  if (!Number.isFinite(input.amount) || input.amount <= 0)
    throw new Error("Saisissez un montant supérieur à 0 €.");
  if (!parseDate(input.date))
    throw new Error("Saisissez une date valide au format JJ/MM/AAAA.");
  if (input.kind === "dca") {
    if (
      !Number.isInteger(input.executionDay) ||
      !input.executionDay ||
      input.executionDay < 1 ||
      input.executionDay > 28
    )
      throw new Error("Choisissez un jour de prélèvement entre 1 et 28.");
    if (
      !Number.isInteger(input.delayBusinessDays) ||
      input.delayBusinessDays === undefined ||
      input.delayBusinessDays < 0 ||
      input.delayBusinessDays > 20
    )
      throw new Error("Le délai de report doit être compris entre 0 et 20 jours ouvrés.");
  }
  if (input.allocations.length === 0)
    throw new Error("Ajoutez au moins une ligne d’investissement.");
  if (input.allocations.length > 8)
    throw new Error("Un investissement peut contenir jusqu’à 8 lignes.");
  const allocationTotal = input.allocations.reduce(
    (total, line) => total + line.amount,
    0,
  );
  if (Math.abs(allocationTotal - input.amount) > 0.01)
    throw new Error("Le total des lignes doit correspondre au montant.");
  for (const line of input.allocations) {
    if (!Number.isFinite(line.amount) || line.amount <= 0)
      throw new Error("Chaque ligne doit avoir un montant supérieur à 0 €.");
    if (line.instrumentKind === "uc" && !isValidIsin(line.isin))
      throw new Error(`L’ISIN ${line.isin || "de la ligne"} est invalide.`);
    if (line.instrumentKind === "fonds-euro") {
      if (!line.name?.trim())
        throw new Error("Donnez un nom au fonds euro de cette ligne.");
      if (
        !Number.isFinite(line.annualReturnPct) ||
        line.annualReturnPct === undefined ||
        line.annualReturnPct < 0 ||
        line.annualReturnPct > 20
      )
        throw new Error("Le rendement annuel estimé doit être compris entre 0 et 20 %.");
    }
  }
  const identifiers = input.allocations.map((line) =>
    line.instrumentKind === "uc" ? `${line.instrumentKind}:${line.isin}` : `${line.instrumentKind}:${line.name?.trim().toLowerCase()}`,
  );
  if (new Set(identifiers).size !== identifiers.length)
    throw new Error("Un même support ne peut apparaître qu’une fois. Modifiez le montant sur sa ligne.");
}
