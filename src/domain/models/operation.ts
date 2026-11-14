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
}

export interface HistoricalPrice {
  isin: string;
  date: string;
  price: number;
  currency: string;
}

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
  installmentCount: number;
  installments: InstallmentValuation[];
  allocations: ValuedAllocation[];
  hasMissingPrices: boolean;
}

export interface Portfolio {
  invested: number;
  value: number;
  gain: number;
  operations: Operation[];
  valuations: InvestmentValuation[];
}

export interface CreateOperationInput {
  kind: OperationKind;
  amount: number;
  date: string;
  allocations: AllocationLine[];
  executionDay?: number;
  delayBusinessDays?: number;
}

export interface ScenarioInput {
  amount: number;
  allocations: AllocationLine[];
  valuationDate: string;
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
