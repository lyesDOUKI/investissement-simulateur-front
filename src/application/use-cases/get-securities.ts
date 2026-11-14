import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";

export class GetSecurities {
  constructor(private readonly repository: PortfolioRepository) {}
  execute() {
    return this.repository.getSecurities();
  }
}
