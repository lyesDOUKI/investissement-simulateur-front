import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";

export class GetPortfolio {
  constructor(
    private readonly repository: PortfolioRepository,
  ) {}

  execute(date: string) {
    return this.repository.getPortfolio(date);
  }
}
