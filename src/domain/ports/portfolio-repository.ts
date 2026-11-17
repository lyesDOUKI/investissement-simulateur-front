import type {
  CreateOperationInput,
  ChangeDcaConfigurationInput,
  DcaConfigurationRevision,
  InvestmentComparison,
  InvestmentValuation,
  Operation,
  Portfolio,
  ScenarioInput,
  Security,
  ValueOperationInput,
} from "../models/operation";

/** Port for the future backend API. All investment calculations live behind it. */
export interface PortfolioRepository {
  getPortfolio(asOfDate: string): Promise<Portfolio>;
  getSecurities(): Promise<Security[]>;
  createOperation(input: CreateOperationInput): Promise<Operation>;
  changeDcaConfiguration(input: ChangeDcaConfigurationInput): Promise<DcaConfigurationRevision>;
  valueOperation(operationId: string, input: ValueOperationInput): Promise<InvestmentValuation>;
  compareOperation(operationId: string, input: ScenarioInput): Promise<InvestmentComparison>;
}
