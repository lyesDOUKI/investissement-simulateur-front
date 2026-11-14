export type OperationKind = "versement" | "dca";
export type InstrumentKind = "uc" | "fonds-euro";

export interface AllocationLine {
  id: string;
  instrumentKind: InstrumentKind;
  isin: string;
  name?: string;
  amount: number;
  annualReturnPct?: number;
}

export interface Security {
  isin: string;
  name: string;
  shortName: string;
  color: string;
  instrumentKind: InstrumentKind;
}

/** User-entered facts and plan parameters. This is never an order. */
export interface Operation {
  id: string;
  kind: OperationKind;
  label: string;
  amount: number;
  date: string;
  detail: string;
  allocations: AllocationLine[];
  executionDay?: number;
  delayBusinessDays?: number;
  annualReturnPct?: number;
}

/** Backend response DTO for a valuation; the front only renders these fields. */
export interface ValuedAllocation {
  instrumentKind: InstrumentKind;
  isin: string;
  name: string;
  invested: number;
  shares: number;
  averagePurchasePrice?: number;
  observedPrice?: number;
  observedDate?: string;
  value: number;
  gain: number;
  status: "cours-demo" | "rendement-estime" | "cours-indisponible";
}

export interface InstallmentValuation {
  dueDate: string;
  executionDate: string;
  amount: number;
  allocations: {
    isin: string;
    name: string;
    amount: number;
    shares: number;
    purchasePrice?: number;
    purchasePriceDate?: string;
    status: ValuedAllocation["status"];
  }[];
}

export interface InvestmentValuation {
  operationId: string;
  valuationDate: string;
  invested: number;
  value: number;
  gain: number;
  gainRatePct: number;
  installmentCount: number;
  installments: InstallmentValuation[];
  allocations: ValuedAllocation[];
  hasMissingPrices: boolean;
  assumptionPct?: number;
}

export interface PortfolioHolding {
  isin: string;
  name: string;
  value: number;
  sharePct: number;
  color: string;
}

/** Complete portfolio response returned by the application backend. */
export interface Portfolio {
  asOfDate: string;
  invested: number;
  value: number;
  gain: number;
  gainRatePct: number;
  oneOffInvested: number;
  operations: Operation[];
  valuations: InvestmentValuation[];
  holdings: PortfolioHolding[];
}

export interface CreateOperationInput {
  kind: OperationKind;
  amount: number;
  date: string;
  allocations: AllocationLine[];
  executionDay?: number;
  delayBusinessDays?: number;
  annualReturnPct?: number;
}

export interface ValueOperationInput {
  valuationDate: string;
  annualReturnPct?: number;
}

export interface ScenarioInput {
  amount: number;
  allocations: AllocationLine[];
  valuationDate: string;
  annualReturnPct?: number;
}

export interface InvestmentComparison {
  original: InvestmentValuation;
  alternative: InvestmentValuation;
  difference: {
    invested: number;
    value: number;
    gain: number;
  };
}
