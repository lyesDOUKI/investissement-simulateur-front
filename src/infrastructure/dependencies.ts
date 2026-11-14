import { CompareInvestment } from "@/application/use-cases/compare-investment";
import { CreateOperation } from "@/application/use-cases/create-operation";
import { GetPortfolio } from "@/application/use-cases/get-portfolio";
import { GetSecurities } from "@/application/use-cases/get-securities";
import { ValueInvestment } from "@/application/use-cases/value-investment";
import { FakeHistoricalPriceRepository } from "./fake/fake-historical-price-repository";
import { demoSecurities, FakePortfolioRepository } from "./fake/fake-portfolio-repository";

const portfolioRepository = new FakePortfolioRepository();
const priceRepository = new FakeHistoricalPriceRepository();
const valueInvestment = new ValueInvestment(priceRepository, async () => demoSecurities);

export const dependencies = {
  getPortfolio: new GetPortfolio(portfolioRepository, valueInvestment),
  getSecurities: new GetSecurities(portfolioRepository),
  createOperation: new CreateOperation(portfolioRepository),
  valueInvestment,
  compareInvestment: new CompareInvestment(valueInvestment),
};
