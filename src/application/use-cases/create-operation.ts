import type { CreateOperationInput } from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";

export class CreateOperation {
  constructor(private readonly repository: PortfolioRepository) {}
  execute(input: CreateOperationInput) {
    return this.repository.createOperation(input);
  }
}
