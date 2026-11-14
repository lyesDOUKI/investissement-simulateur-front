import type { CreateOperationInput } from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";
import { isValidIsin } from "@/domain/rules/is-valid-isin";

function isValidDate(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export class CreateOperation {
  constructor(private readonly repository: PortfolioRepository) {}
  execute(input: CreateOperationInput) {
    if (!Number.isFinite(input.amount) || input.amount <= 0)
      throw new Error("Saisissez un montant supérieur à 0 €.");
    if (!isValidDate(input.date))
      throw new Error("Saisissez une date valide au format JJ/MM/AAAA.");
    if (input.kind === "dca") {
      if (!input.frequency)
        throw new Error("Choisissez la fréquence de votre plan.");
      const maxDay = input.frequency === "Hebdomadaire" ? 7 : 28;
      if (
        !Number.isInteger(input.executionDay) ||
        !input.executionDay ||
        input.executionDay < 1 ||
        input.executionDay > maxDay
      )
        throw new Error("Choisissez un jour d’exécution valide.");
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
      if (!isValidIsin(line.isin))
        throw new Error(`L’ISIN ${line.isin || "de la ligne"} est invalide.`);
      if (!Number.isFinite(line.amount) || line.amount <= 0)
        throw new Error("Chaque ligne doit avoir un montant supérieur à 0 €.");
    }
    if (
      new Set(input.allocations.map((line) => line.isin)).size !==
      input.allocations.length
    )
      throw new Error(
        "Un support ne peut apparaître qu’une fois. Modifiez son montant sur la ligne existante.",
      );
    return this.repository.addOperation(input);
  }
}
