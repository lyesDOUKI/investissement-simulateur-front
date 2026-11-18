import type { CompareDcaRevisionsInput } from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";

export class CompareDcaRevisions {
  constructor(private readonly repository: PortfolioRepository) {}

  execute(input: CompareDcaRevisionsInput) {
    return this.repository.compareDcaRevisions(input);
  }
}
