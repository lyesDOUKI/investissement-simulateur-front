import type { CreateOperationInput } from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";

export class CreateOperation {
  constructor(private readonly repository: PortfolioRepository) {}
  execute(input: CreateOperationInput) {
    if (!Number.isFinite(input.amount) || input.amount <= 0)
      throw new Error("Saisissez un montant supérieur à 0 €.");
    if (!input.date.trim())
      throw new Error("Choisissez une date pour continuer.");
    return this.repository.addOperation(input);
  }
}
