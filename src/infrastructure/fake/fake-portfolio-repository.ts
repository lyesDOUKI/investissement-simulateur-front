import type {
  CreateOperationInput,
  Operation,
  Portfolio,
} from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";

export class FakePortfolioRepository implements PortfolioRepository {
  private operations: Operation[] = [
    {
      id: "1",
      kind: "dca",
      label: "DCA mensuel",
      amount: 300,
      date: "6 août 2026",
      detail: "MSCI World · Nasdaq-100",
    },
    {
      id: "2",
      kind: "valorisation",
      label: "Valorisation DCA",
      amount: 300,
      date: "6 juil. 2026",
      detail: "Valeur estimée : 2 349,14 €",
    },
    {
      id: "3",
      kind: "versement",
      label: "Versement unique",
      amount: 1_000,
      date: "10 juin 2026",
      detail: "MSCI World",
    },
  ];
  async getPortfolio(): Promise<Portfolio> {
    const invested =
      this.operations.reduce((total, item) => total + item.amount, 0) + 1_800;
    return {
      invested,
      value: invested * 1.0398,
      gain: invested * 0.0398,
      operations: [...this.operations],
    };
  }
  async addOperation(input: CreateOperationInput): Promise<Operation> {
    const item: Operation = {
      ...input,
      id: `${Date.now()}`,
      label:
        input.kind === "dca"
          ? "Plan DCA"
          : input.kind === "versement"
            ? "Versement unique"
            : "Valorisation",
    };
    this.operations = [item, ...this.operations];
    return item;
  }
}
