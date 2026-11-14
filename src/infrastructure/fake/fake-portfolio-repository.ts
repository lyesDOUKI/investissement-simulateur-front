import type {
  CreateOperationInput,
  InvestmentComparison,
  InvestmentValuation,
  Operation,
  Portfolio,
  ScenarioInput,
  Security,
  ValueOperationInput,
} from "@/domain/models/operation";
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

/** A response fixture copied from the supplied Java console log. */
const consoleLogResponse: InvestmentValuation = {
  operationId: demoPlan.id, valuationDate: "14/11/2026", invested: 300,
  value: 289.96, gain: -10.04, gainRatePct: -3.35, installmentCount: 3, hasMissingPrices: false,
  allocations: [{
    instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World",
    invested: 300, shares: 0.096583, averagePurchasePrice: 3106.16,
    observedPrice: 3002.18, observedDate: "13/11/2026", value: 289.96,
    gain: -10.04, status: "cours-demo",
  }],
  installments: [
    { dueDate: "10/09/2026", executionDate: "15/09/2026", amount: 100, allocations: [{ isin: "FR0010380675", name: "MSCI World", amount: 100, shares: 0.031680, purchasePrice: 3156.53, purchasePriceDate: "15/09/2026", status: "cours-demo" }] },
    { dueDate: "10/10/2026", executionDate: "14/10/2026", amount: 100, allocations: [{ isin: "FR0010380675", name: "MSCI World", amount: 100, shares: 0.031594, purchasePrice: 3165.08, purchasePriceDate: "14/10/2026", status: "cours-demo" }] },
    { dueDate: "10/11/2026", executionDate: "13/11/2026", amount: 100, allocations: [{ isin: "FR0010380675", name: "MSCI World", amount: 100, shares: 0.033309, purchasePrice: 3002.18, purchasePriceDate: "13/11/2026", status: "cours-demo" }] },
  ],
};

const genericValuation: InvestmentValuation = {
  operationId: "", valuationDate: "", invested: 500, value: 512.4, gain: 12.4,
  gainRatePct: 2.48, installmentCount: 1, hasMissingPrices: false,
  allocations: [{ instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World", invested: 500, shares: 0.1665, averagePurchasePrice: 3003, observedPrice: 3074.77, observedDate: "14/11/2026", value: 512.4, gain: 12.4, status: "cours-demo" }],
  installments: [{ dueDate: "10/11/2026", executionDate: "13/11/2026", amount: 500, allocations: [{ isin: "FR0010380675", name: "MSCI World", amount: 500, shares: 0.1665, purchasePrice: 3003, purchasePriceDate: "13/11/2026", status: "cours-demo" }] }],
};

const demoPortfolio: Portfolio = {
  asOfDate: "14/11/2026", invested: 300, value: 289.96, gain: -10.04,
  gainRatePct: -3.35, oneOffInvested: 0,
  operations: [demoPlan], valuations: [consoleLogResponse],
  holdings: [{ isin: "FR0010380675", name: "MSCI World", value: 289.96, sharePct: 100, color: "#7EB89A" }],
};

const demoAlternative: InvestmentValuation = {
  ...genericValuation,
  operationId: "demo-dca:alternative",
  valuationDate: "14/11/2026",
  invested: 400,
  value: 426.8,
  gain: 26.8,
  gainRatePct: 6.7,
  allocations: [{
    instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World",
    invested: 400, shares: 0.1387, averagePurchasePrice: 2883.92,
    observedPrice: 3074.77, observedDate: "14/11/2026", value: 426.8,
    gain: 26.8, status: "cours-demo",
  }],
};

const genericAlternative: InvestmentValuation = {
  ...genericValuation,
  operationId: "demo:alternative",
  valuationDate: "14/11/2026",
  invested: 400,
  value: 426.8,
  gain: 26.8,
  gainRatePct: 6.7,
  allocations: [{
    instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World",
    invested: 400, shares: 0.1387, averagePurchasePrice: 2883.92,
    observedPrice: 3074.77, observedDate: "14/11/2026", value: 426.8,
    gain: 26.8, status: "cours-demo",
  }],
};

const waitForDemoResponse = () => new Promise<void>((resolve) => setTimeout(resolve, 650));

export class FakePortfolioRepository implements PortfolioRepository {
  private operations: Operation[] = [demoPlan];
  private nextId = 1;

  async getPortfolio(asOfDate: string): Promise<Portfolio> {
    await waitForDemoResponse();
    return { ...demoPortfolio, asOfDate, operations: [...this.operations] };
  }

  async getSecurities(): Promise<Security[]> {
    await waitForDemoResponse();
    return [...demoSecurities];
  }

  async createOperation(input: CreateOperationInput): Promise<Operation> {
    await waitForDemoResponse();
    const operation: Operation = {
      ...input,
      id: "session-" + this.nextId++,
      label: input.kind === "dca" ? "Plan DCA enregistré" : "Versement enregistré",
      detail: input.kind === "dca"
        ? "Paramètres de plan enregistrés · résultat fourni par l’adaptateur de démonstration"
        : "Versement saisi dans le journal · aucun ordre transmis",
    };
    this.operations = [operation, ...this.operations];
    return operation;
  }

  async valueOperation(operationId: string, input: ValueOperationInput): Promise<InvestmentValuation> {
    await waitForDemoResponse();
    const fixture = operationId === demoPlan.id ? consoleLogResponse : genericValuation;
    return { ...fixture, operationId, valuationDate: input.valuationDate, assumptionPct: input.annualReturnPct };
  }

  async compareOperation(operationId: string, input: ScenarioInput): Promise<InvestmentComparison> {
    await waitForDemoResponse();
    const original = operationId === demoPlan.id ? consoleLogResponse : genericValuation;
    const alternative = operationId === demoPlan.id ? demoAlternative : genericAlternative;
    return {
      original: { ...original, valuationDate: input.valuationDate },
      alternative: { ...alternative, valuationDate: input.valuationDate, assumptionPct: input.annualReturnPct },
      difference: operationId === demoPlan.id
        ? { invested: 100, value: 136.84, gain: 36.84 }
        : { invested: -100, value: -85.6, gain: 14.4 },
    };
  }
}
