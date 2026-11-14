import { CreateOperation } from "@/application/use-cases/create-operation";
import { GetPortfolio } from "@/application/use-cases/get-portfolio";
import { FakePortfolioRepository } from "./fake/fake-portfolio-repository";

const portfolioRepository = new FakePortfolioRepository();
export const dependencies = {
  getPortfolio: new GetPortfolio(portfolioRepository),
  createOperation: new CreateOperation(portfolioRepository),
};
