import { CompareInvestment } from "@/application/use-cases/compare-investment";
import { ConnectDemoSession } from "@/application/use-cases/connect-demo-session";
import { CreateOperation } from "@/application/use-cases/create-operation";
import { GetPortfolio } from "@/application/use-cases/get-portfolio";
import { GetSecurities } from "@/application/use-cases/get-securities";
import { ValueInvestment } from "@/application/use-cases/value-investment";
import { SignIn } from "@/application/use-cases/sign-in";
import { FakePortfolioRepository } from "./fake/fake-portfolio-repository";
import { FakeAuthenticationRepository } from "./fake/fake-authentication-repository";
import { HttpPortfolioRepository } from "./http/http-portfolio-repository";
import { HttpAuthenticationRepository } from "./http/http-authentication-repository";
import { DevTokenClient } from "./http/dev-token-client";

export const flags = {
  accountAuth: process.env.EXPO_PUBLIC_FEATURE_ACCOUNT_AUTH === "true",
  comparison: process.env.EXPO_PUBLIC_FEATURE_COMPARISON === "true",
  httpApi: process.env.EXPO_PUBLIC_USE_HTTP_API !== "false",
};
export const devTokenClient = new DevTokenClient();
const portfolioRepository = flags.httpApi ? new HttpPortfolioRepository(() => devTokenClient.token) : new FakePortfolioRepository();
const authenticationRepository = flags.httpApi ? new HttpAuthenticationRepository(devTokenClient) : new FakeAuthenticationRepository();
export const dependencies = {
  connectDemo: new ConnectDemoSession(authenticationRepository),
  signIn: new SignIn(authenticationRepository),
  getPortfolio: new GetPortfolio(portfolioRepository),
  getSecurities: new GetSecurities(portfolioRepository),
  createOperation: new CreateOperation(portfolioRepository),
  valueInvestment: new ValueInvestment(portfolioRepository),
  compareInvestment: new CompareInvestment(portfolioRepository),
};
