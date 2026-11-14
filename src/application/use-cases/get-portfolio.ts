import type { Portfolio } from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";
import { ValueInvestment } from "./value-investment";

export class GetPortfolio {
  constructor(
    private readonly repository: PortfolioRepository,
    private readonly valueInvestment: ValueInvestment,
  ) {}

  async execute(date: string): Promise<Portfolio> {
    const operations = await this.repository.getOperations();
    const valuations = await Promise.all(
      operations.map((item) => this.valueInvestment.execute(item, date)),
    );
    const invested = valuations.reduce((sum, item) => sum + item.invested, 0);
    const value = valuations.reduce((sum, item) => sum + item.value, 0);
    return { invested, value, gain: value - invested, operations, valuations };
  }
}
