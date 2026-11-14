import type { CreateOperationInput, Operation, Security } from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";

export const demoSecurities: Security[] = [
  { isin: "FR0010380675", name: "Lyxor MSCI World", shortName: "MSCI World", color: "#7EB89A", instrumentKind: "uc" },
  { isin: "IE00B4L5Y983", name: "iShares Core MSCI World", shortName: "World Core", color: "#7FA9F8", instrumentKind: "uc" },
  { isin: "IE00B53SZB19", name: "iShares Nasdaq 100", shortName: "Nasdaq 100", color: "#D6AA6C", instrumentKind: "uc" },
];

const demoPlan: Operation = {
  id: "demo-dca", kind: "dca", label: "Plan mensuel", amount: 100,
  date: "14/08/2026", detail: "Prélèvement le 10 · report 3 jours ouvrés",
  executionDay: 10, delayBusinessDays: 3,
  allocations: [{ id: "demo-line", instrumentKind: "uc", isin: "FR0010380675", amount: 100 }],
};

export class FakePortfolioRepository implements PortfolioRepository {
  private operations: Operation[] = [demoPlan];
  async getOperations() { return [...this.operations]; }
  async getSecurities() { return [...demoSecurities]; }
  async addOperation(input: CreateOperationInput): Promise<Operation> {
    const item: Operation = {
      ...input,
      id: `session-${Date.now()}`,
      label: input.kind === "dca" ? "Plan DCA" : "Versement réalisé",
      detail: input.kind === "dca"
        ? `Mensuel · prélèvement le ${input.executionDay} · report ${input.delayBusinessDays} jours ouvrés`
        : `${input.allocations.length} support${input.allocations.length === 1 ? "" : "s"} enregistré${input.allocations.length === 1 ? "" : "s"}`,
    };
    this.operations = [item, ...this.operations];
    return item;
  }
}
