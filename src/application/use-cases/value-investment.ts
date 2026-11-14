import type { Operation, ValueOperationInput } from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";

export class ValueInvestment {
  constructor(
    private readonly repository: PortfolioRepository,
  ) {}

  execute(operation: Operation, input: ValueOperationInput) {
    return this.repository.valueOperation(operation.id, input);
  }
}
