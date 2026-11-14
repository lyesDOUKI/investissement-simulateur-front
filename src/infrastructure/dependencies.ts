import { CompareInvestment } from "@/application/use-cases/compare-investment";
import { CreateOperation } from "@/application/use-cases/create-operation";
import { GetPortfolio } from "@/application/use-cases/get-portfolio";
import { GetSecurities } from "@/application/use-cases/get-securities";
import { ValueInvestment } from "@/application/use-cases/value-investment";
import { FakePortfolioRepository } from "./fake/fake-portfolio-repository";

const portfolioRepository = new FakePortfolioRepository();
export const dependencies = {
  getPortfolio: new GetPortfolio(portfolioRepository),
  getSecurities: new GetSecurities(portfolioRepository),
  createOperation: new CreateOperation(portfolioRepository),
  valueInvestment: new ValueInvestment(portfolioRepository),
  compareInvestment: new CompareInvestment(portfolioRepository),
};
