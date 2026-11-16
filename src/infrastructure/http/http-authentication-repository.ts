import type { SignInCredentials, UserAccount } from "@/domain/models/user-account";
import type { AuthenticationRepository } from "@/domain/ports/authentication-repository";
import { DevTokenClient } from "./dev-token-client";

export class HttpAuthenticationRepository implements AuthenticationRepository {
  constructor(private readonly client: DevTokenClient) {}
  disconnect(): void { this.client.clear(); }
  async connectDemo(): Promise<UserAccount> { return this.client.connect(); }
  async signIn(_credentials: SignInCredentials): Promise<UserAccount | null> { throw new Error("Connexion par mot de passe désactivée pour cette version locale."); }
}
