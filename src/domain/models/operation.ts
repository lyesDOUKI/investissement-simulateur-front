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
  status: "observed" | "projected" | "missing";
  annualReturns?: number[];
  annualRates?: number[];
}

export interface InstallmentValuation {
  dueDate: string;
  executionDate: string;
  nature?: "observed" | "projected" | "mixed" | "not-yet-executed";
  amount: number;
  allocations: {
    instrumentKind: InstrumentKind;
    isin: string;
    name: string;
    amount: number;
    shares: number;
    value?: number;
    gain?: number;
    purchasePrice?: number;
    purchasePriceDate?: string;
    status: ValuedAllocation["status"];
    annualReturn?: number;
    annualRate?: number;
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
  instrumentKind?: InstrumentKind;
  isin: string | null;
  name: string;
  invested?: number;
  shares?: number | null;
  value: number | null;
  sharePct: number | null;
  status?: "observed" | "projected" | "unavailable";
  observedDate?: string | null;
  color?: string;
}

export interface PortfolioRecentActivity {
  type: "ONE_TIME_PAYMENT" | "DCA_INSTALLMENT";
  operationId: string;
  date: string;
  amount: number;
  label: string;
  detail: string;
}

/** Complete portfolio response returned by the application backend. */
export interface Portfolio {
  asOfDate: string;
  invested: number;
  value: number | null;
  gain: number | null;
  gainRatePct: number | null;
  oneOffInvested: number;
  valuationStatus?: "complete" | "partial";
  recentActivity?: PortfolioRecentActivity | null;
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
  startDate: string;
  amount: number;
  allocations: AllocationLine[];
  valuationDate: string;
  executionDay?: number;
  delayBusinessDays?: number;
  annualReturnPct?: number;
}

export interface InvestmentComparison {
  original: InvestmentValuation;
  alternative: InvestmentValuation;
  /** Difference returned by the backend: scenario B relative to reference A. */
  difference: {
    invested: number;
    value: number;
    gain: number;
  };
}
