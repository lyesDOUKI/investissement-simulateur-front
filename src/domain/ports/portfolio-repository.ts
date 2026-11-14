import type {
  CreateOperationInput,
  Operation,
  Portfolio,
  Security,
} from "../models/operation";

export interface PortfolioRepository {
  getPortfolio(): Promise<Portfolio>;
  getSecurities(): Promise<Security[]>;
  addOperation(input: CreateOperationInput): Promise<Operation>;
}
