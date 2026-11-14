export type OperationKind = "versement" | "dca" | "valorisation";
export type DcaFrequency = "Hebdomadaire" | "Mensuel" | "Trimestriel";

export interface AllocationLine {
  id: string;
  isin: string;
  amount: number;
}

export interface Security {
  isin: string;
  name: string;
  shortName: string;
  color: string;
}

export interface Operation {
  id: string;
  kind: OperationKind;
  label: string;
  amount: number;
  date: string;
  detail: string;
  allocations: AllocationLine[];
  frequency?: DcaFrequency;
  executionDay?: number;
  sourceOperationId?: string;
  valueAtDate?: number;
}

export interface Portfolio {
  invested: number;
  value: number;
  gain: number;
  operations: Operation[];
}

export interface CreateOperationInput {
  kind: OperationKind;
  amount: number;
  date: string;
  allocations: AllocationLine[];
  frequency?: DcaFrequency;
  executionDay?: number;
  sourceOperationId?: string;
  valueAtDate?: number;
}
