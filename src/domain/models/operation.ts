export type OperationKind = "versement" | "dca" | "valorisation";

export interface Operation {
  id: string;
  kind: OperationKind;
  label: string;
  amount: number;
  date: string;
  detail: string;
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
  detail: string;
}
