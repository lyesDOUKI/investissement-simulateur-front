import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";

export class GetPortfolio {
  constructor(private readonly repository: PortfolioRepository) {}
  execute() {
    return this.repository.getPortfolio();
  }
}
