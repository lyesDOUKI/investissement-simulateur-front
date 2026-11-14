import { CreateOperation } from "@/application/use-cases/create-operation";
import { GetPortfolio } from "@/application/use-cases/get-portfolio";
import { GetSecurities } from "@/application/use-cases/get-securities";
import { FakePortfolioRepository } from "./fake/fake-portfolio-repository";

const portfolioRepository = new FakePortfolioRepository();
export const dependencies = {
  getPortfolio: new GetPortfolio(portfolioRepository),
  getSecurities: new GetSecurities(portfolioRepository),
  createOperation: new CreateOperation(portfolioRepository),
};
