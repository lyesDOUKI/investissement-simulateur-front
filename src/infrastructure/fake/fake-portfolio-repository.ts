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
    gain: -10.04, status: "observed",
  }],
  installments: [
    { dueDate: "10/09/2026", executionDate: "15/09/2026", amount: 100, allocations: [{ instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World", amount: 100, shares: 0.031680, purchasePrice: 3156.53, purchasePriceDate: "15/09/2026", status: "observed" }] },
    { dueDate: "10/10/2026", executionDate: "14/10/2026", amount: 100, allocations: [{ instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World", amount: 100, shares: 0.031594, purchasePrice: 3165.08, purchasePriceDate: "14/10/2026", status: "observed" }] },
    { dueDate: "10/11/2026", executionDate: "13/11/2026", amount: 100, allocations: [{ instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World", amount: 100, shares: 0.033309, purchasePrice: 3002.18, purchasePriceDate: "13/11/2026", status: "observed" }] },
  ],
};

const genericValuation: InvestmentValuation = {
  operationId: "", valuationDate: "", invested: 500, value: 512.4, gain: 12.4,
  gainRatePct: 2.48, installmentCount: 1, hasMissingPrices: false,
  allocations: [{ instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World", invested: 500, shares: 0.1665, averagePurchasePrice: 3003, observedPrice: 3074.77, observedDate: "14/11/2026", value: 512.4, gain: 12.4, status: "observed" }],
  installments: [{ dueDate: "10/11/2026", executionDate: "13/11/2026", amount: 500, allocations: [{ instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World", amount: 500, shares: 0.1665, purchasePrice: 3003, purchasePriceDate: "13/11/2026", status: "observed" }] }],
};

const genericOneOffValuation: InvestmentValuation = {
  ...genericValuation,
  installmentCount: 0,
  installments: [],
};

const demoPortfolio: Portfolio = {
  asOfDate: "14/11/2026", invested: 300, value: 289.96, gain: -10.04,
  gainRatePct: -3.35, oneOffInvested: 0,
  valuationStatus: "complete",
  recentActivity: { type: "DCA_INSTALLMENT", operationId: demoPlan.id, date: "13/11/2026", amount: 100, label: "Échéance DCA exécutée", detail: "1 support acheté" },
  operations: [demoPlan], valuations: [consoleLogResponse],
  holdings: [{ instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World", invested: 300, shares: 0.096583, value: 289.96, sharePct: 100, status: "observed", observedDate: "13/11/2026", color: "#7EB89A" }],
};

const demoAlternative: InvestmentValuation = {
  ...genericValuation,
  operationId: "demo-dca:alternative",
  valuationDate: "14/11/2026",
  invested: 400,
  value: 426.8,
  gain: 26.8,
  gainRatePct: 6.7,
  installmentCount: 4,
  installments: [
    { dueDate: "10/08/2026", executionDate: "13/08/2026", amount: 100, allocations: [{ instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World", amount: 100, shares: 0.0331, purchasePrice: 3021.15, purchasePriceDate: "13/08/2026", status: "observed" }] },
    { dueDate: "10/09/2026", executionDate: "15/09/2026", amount: 100, allocations: [{ instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World", amount: 100, shares: 0.03168, purchasePrice: 3156.53, purchasePriceDate: "15/09/2026", status: "observed" }] },
    { dueDate: "10/10/2026", executionDate: "14/10/2026", amount: 100, allocations: [{ instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World", amount: 100, shares: 0.031594, purchasePrice: 3165.08, purchasePriceDate: "14/10/2026", status: "observed" }] },
    { dueDate: "10/11/2026", executionDate: "13/11/2026", amount: 100, allocations: [{ instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World", amount: 100, shares: 0.033309, purchasePrice: 3002.18, purchasePriceDate: "13/11/2026", status: "observed" }] },
  ],
  allocations: [{
    instrumentKind: "uc", isin: "FR0010380675", name: "MSCI World",
    invested: 400, shares: 0.1387, averagePurchasePrice: 2883.92,
    observedPrice: 3074.77, observedDate: "14/11/2026", value: 426.8,
    gain: 26.8, status: "observed",
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
    gain: 26.8, status: "observed",
  }],
};

const genericOneOffAlternative: InvestmentValuation = {
  ...genericAlternative,
  installmentCount: 0,
  installments: [],
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
      label: input.kind === "dca" ? "Plan d’investissement enregistré" : "Versement enregistré",
      detail: input.kind === "dca"
        ? "Paramètres de plan enregistrés · résultat fourni par l’adaptateur de démonstration"
        : "Versement saisi dans le journal · aucun ordre transmis",
    };
    this.operations = [operation, ...this.operations];
    return operation;
  }

  async valueOperation(operationId: string, input: ValueOperationInput): Promise<InvestmentValuation> {
    await waitForDemoResponse();
    const operation = this.operations.find((item) => item.id === operationId);
    const fixture = operationId === demoPlan.id
      ? consoleLogResponse
      : operation?.kind === "versement" ? genericOneOffValuation : genericValuation;
    return { ...fixture, operationId, valuationDate: input.valuationDate, assumptionPct: input.annualReturnPct };
  }

  async compareOperation(operationId: string, input: ScenarioInput): Promise<InvestmentComparison> {
    await waitForDemoResponse();
    const operation = this.operations.find((item) => item.id === operationId);
    const original = operationId === demoPlan.id
      ? consoleLogResponse
      : operation?.kind === "versement" ? genericOneOffValuation : genericValuation;
    const alternative = operationId === demoPlan.id
      ? demoAlternative
      : operation?.kind === "versement" ? genericOneOffAlternative : genericAlternative;
    const fallbackOperation = operation ?? demoPlan;
    return {
      valuationDate: input.valuationDate,
      valuationStatus: "complete",
      original: fakeComparisonScenario(fallbackOperation, original, fallbackOperation.allocations, fallbackOperation.date, fallbackOperation.amount, fallbackOperation.executionDay, fallbackOperation.delayBusinessDays),
      alternative: fakeComparisonScenario(fallbackOperation, { ...alternative, valuationDate: input.valuationDate, assumptionPct: input.annualReturnPct }, input.allocations, input.startDate, input.amount, input.executionDay, input.delayBusinessDays, input.annualReturnPct, null),
      difference: operationId === demoPlan.id
        ? { invested: 100, value: 136.84, gain: 36.84, gainRatePercentagePoints: 10.05 }
        : { invested: -100, value: -85.6, gain: 14.4, gainRatePercentagePoints: 4.22 },
    };
  }
}

function fakeComparisonScenario(operation: Operation, valuation: InvestmentValuation, allocations: Operation["allocations"], startDate: string, amount: number, executionDay?: number, delayBusinessDays?: number, annualReturnPct = 5, operationId: string | null = operation.id) {
  return {
    operationId,
    parameters: {
      date: operation.kind === "versement" ? startDate : undefined,
      configuredAt: operation.kind === "dca" ? startDate : undefined,
      amount: operation.kind === "versement" ? amount : undefined,
      monthlyAmount: operation.kind === "dca" ? amount : undefined,
      executionDay,
      delayBusinessDays,
      allocations: allocations.map((line) => ({ instrumentKind: line.instrumentKind, isin: line.instrumentKind === "uc" ? line.isin : null, name: line.name ?? null, amount: line.amount })),
      projectionAssumptions: allocations.filter((line) => line.instrumentKind === "uc").map((line) => ({ isin: line.isin, annualReturn: annualReturnPct / 100 })),
      euroFundAssumptions: allocations.filter((line) => line.instrumentKind === "fonds-euro").map((line) => ({ name: line.name ?? "Fonds euro", annualRate: (line.annualReturnPct ?? 0) / 100 })),
    },
    valuation: {
      valuationDate: valuation.valuationDate,
      invested: valuation.invested,
      value: valuation.value,
      gain: valuation.gain,
      gainRatePct: valuation.gainRatePct,
      allocations: valuation.allocations.map((allocation) => ({
        instrumentKind: allocation.instrumentKind,
        isin: allocation.instrumentKind === "uc" ? allocation.isin : null,
        name: allocation.name,
        invested: allocation.invested,
        shares: allocation.shares,
        averagePurchasePrice: allocation.averagePurchasePrice ?? null,
        observedPrice: allocation.observedPrice ?? null,
        observedDate: allocation.observedDate ?? null,
        value: allocation.value,
        gain: allocation.gain,
        status: allocation.status === "observed" ? "observed" as const : allocation.status === "projected" ? "projected" as const : "missing" as const,
        purchaseStatus: allocation.status === "observed" ? "observed" as const : allocation.status === "projected" ? "projected" as const : "missing" as const,
        annualReturns: [],
        annualRates: [],
      })),
      installments: valuation.installments.map((installment) => ({
        dueDate: installment.dueDate,
        executionDate: installment.executionDate,
        nature: "observed" as const,
        amount: installment.amount,
        allocations: installment.allocations.map((line) => ({
          instrumentKind: line.instrumentKind,
          isin: line.instrumentKind === "uc" ? line.isin : null,
          name: line.name,
          amount: line.amount,
          shares: line.shares,
          purchasePrice: line.purchasePrice ?? null,
          purchasePriceDate: line.purchasePriceDate ?? null,
          observedPrice: null,
          observedDate: null,
          value: line.value ?? null,
          gain: line.gain ?? null,
          status: line.status === "observed" ? "observed" as const : line.status === "projected" ? "projected" as const : "missing" as const,
          purchaseStatus: line.status === "observed" ? "observed" as const : line.status === "projected" ? "projected" as const : "missing" as const,
          annualReturns: [],
          annualRates: [],
        })),
      })),
    },
  };
}
