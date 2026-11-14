import type {
  CreateOperationInput,
  Operation,
  Portfolio,
  Security,
} from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";

function dateTimestamp(value: string): number {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return 0;
  const [, day, month, year] = match.map(Number);
  return Date.UTC(year, month - 1, day);
}

function scheduleLabel(input: CreateOperationInput): string {
  if (input.kind !== "dca") return "";
  if (input.frequency === "Hebdomadaire") {
    const day = [
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
      "dimanche",
    ][(input.executionDay ?? 1) - 1];
    return ` · chaque ${day}`;
  }
  return ` · ${input.frequency ?? "Mensuel"} · le ${input.executionDay ?? 6} du mois`;
}

export class FakePortfolioRepository implements PortfolioRepository {
  private securities: Security[] = [
    {
      isin: "IE00B4L5Y983",
      name: "iShares Core MSCI World UCITS ETF",
      shortName: "MSCI World",
      color: "#7EB89A",
    },
    {
      isin: "IE00B53SZB19",
      name: "iShares Nasdaq 100 UCITS ETF",
      shortName: "Nasdaq 100",
      color: "#7FA9F8",
    },
    {
      isin: "FR0010315770",
      name: "Amundi MSCI World UCITS ETF",
      shortName: "Amundi World",
      color: "#D6AA6C",
    },
    {
      isin: "LU1681043599",
      name: "Amundi PEA S&P 500 UCITS ETF",
      shortName: "S&P 500",
      color: "#B89AE4",
    },
  ];
  private operations: Operation[] = [
    {
      id: "seed-1",
      kind: "versement",
      label: "Versement ponctuel",
      amount: 1_000,
      date: "12/11/2026",
      detail: "2 lignes investies",
      allocations: [
        { id: "seed-1a", isin: "IE00B4L5Y983", amount: 700 },
        { id: "seed-1b", isin: "IE00B53SZB19", amount: 300 },
      ],
    },
    {
      id: "seed-2",
      kind: "dca",
      label: "Plan mensuel",
      amount: 300,
      date: "06/02/2026",
      detail: "Mensuel · prélèvement le 6",
      frequency: "Mensuel",
      executionDay: 6,
      allocations: [
        { id: "seed-2a", isin: "IE00B4L5Y983", amount: 200 },
        { id: "seed-2b", isin: "IE00B53SZB19", amount: 100 },
      ],
    },
    {
      id: "seed-3",
      kind: "versement",
      label: "Versement ponctuel",
      amount: 2_000,
      date: "02/11/2026",
      detail: "1 ligne investie",
      allocations: [{ id: "seed-3a", isin: "FR0010315770", amount: 2_000 }],
    },
  ];
  async getPortfolio(): Promise<Portfolio> {
    const addedCapital = this.operations
      .filter(
        (item) => item.id.startsWith("session-") && item.kind === "versement",
      )
      .reduce((total, item) => total + item.amount, 0);
    const invested = 3_000 + addedCapital;
    return {
      invested,
      value: invested * 1.0398,
      gain: invested * 0.0398,
      operations: [...this.operations].sort(
        (left, right) => dateTimestamp(right.date) - dateTimestamp(left.date),
      ),
    };
  }
  async getSecurities(): Promise<Security[]> {
    return [...this.securities];
  }
  async addOperation(input: CreateOperationInput): Promise<Operation> {
    const item: Operation = {
      ...input,
      id: `session-${Date.now()}`,
      label:
        input.kind === "dca"
          ? "Plan DCA"
          : input.kind === "versement"
            ? "Versement ponctuel"
            : "Valorisation",
      detail: `${input.allocations.length} ligne${input.allocations.length === 1 ? "" : "s"} · ${input.allocations.map((line) => this.securities.find((security) => security.isin === line.isin)?.shortName ?? line.isin).join(" · ")}${input.kind === "dca" ? scheduleLabel(input) : input.kind === "valorisation" && input.valueAtDate ? ` · estimé à ${input.valueAtDate.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : ""}`,
    };
    this.operations = [item, ...this.operations];
    return item;
  }
}
