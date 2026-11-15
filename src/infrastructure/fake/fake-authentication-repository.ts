import type { SignInCredentials, UserAccount } from "@/domain/models/user-account";
import type { AuthenticationRepository } from "@/domain/ports/authentication-repository";

export const demoAccount: UserAccount = {
  id: "demo-jean",
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean.dupont@alto-demo.fr",
  phone: "+33 6 12 34 56 78",
  createdAt: "15/08/2026",
};

const demoPassword = "JeanAlto2026!";
const waitForDemoResponse = () => new Promise<void>((resolve) => setTimeout(resolve, 650));

export class FakeAuthenticationRepository implements AuthenticationRepository {
  async signIn(credentials: SignInCredentials): Promise<UserAccount | null> {
    await waitForDemoResponse();
    const email = credentials.email.trim().toLocaleLowerCase("fr-FR");
    return email === demoAccount.email && credentials.password === demoPassword
      ? { ...demoAccount }
      : null;
  }
}
