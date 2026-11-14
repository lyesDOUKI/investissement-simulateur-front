import type { CreateOperationInput } from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";
import { validateInvestmentInput } from "@/domain/rules/validate-investment-input";

export class CreateOperation {
  constructor(private readonly repository: PortfolioRepository) {}
  execute(input: CreateOperationInput) {
    validateInvestmentInput(input);
    return this.repository.addOperation(input);
  }
}
