import type {
  CreateOperationInput,
  Operation,
  Portfolio,
} from "../models/operation";

export interface PortfolioRepository {
  getPortfolio(): Promise<Portfolio>;
  addOperation(input: CreateOperationInput): Promise<Operation>;
}
