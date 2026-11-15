import { CompareInvestment } from "@/application/use-cases/compare-investment";
import { CreateOperation } from "@/application/use-cases/create-operation";
import { GetPortfolio } from "@/application/use-cases/get-portfolio";
import { GetSecurities } from "@/application/use-cases/get-securities";
import { ValueInvestment } from "@/application/use-cases/value-investment";
import { SignIn } from "@/application/use-cases/sign-in";
import { FakePortfolioRepository } from "./fake/fake-portfolio-repository";
import { FakeAuthenticationRepository } from "./fake/fake-authentication-repository";

const portfolioRepository = new FakePortfolioRepository();
const authenticationRepository = new FakeAuthenticationRepository();
export const dependencies = {
  signIn: new SignIn(authenticationRepository),
  getPortfolio: new GetPortfolio(portfolioRepository),
  getSecurities: new GetSecurities(portfolioRepository),
  createOperation: new CreateOperation(portfolioRepository),
  valueInvestment: new ValueInvestment(portfolioRepository),
  compareInvestment: new CompareInvestment(portfolioRepository),
};
