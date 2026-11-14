import type {
  CreateOperationInput,
  Operation,
  Security,
} from "../models/operation";

export interface PortfolioRepository {
  getOperations(): Promise<Operation[]>;
  getSecurities(): Promise<Security[]>;
  addOperation(input: CreateOperationInput): Promise<Operation>;
}
