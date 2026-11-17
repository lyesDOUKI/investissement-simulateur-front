import type { ChangeDcaConfigurationInput } from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";

export class ChangeDcaConfiguration {
  constructor(private readonly repository: PortfolioRepository) {}

  execute(input: ChangeDcaConfigurationInput) {
    return this.repository.changeDcaConfiguration(input);
  }
}
