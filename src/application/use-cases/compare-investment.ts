import type {
  InvestmentComparison,
  Operation,
  ScenarioInput,
} from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";

export class CompareInvestment {
  constructor(private readonly repository: PortfolioRepository) {}

  async execute(
    original: Operation,
    scenario: ScenarioInput,
  ): Promise<InvestmentComparison> {
    return this.repository.compareOperation(original.id, scenario);
  }
}
