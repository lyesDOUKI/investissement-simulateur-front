import type { SignInCredentials, UserAccount } from "@/domain/models/user-account";
import type { AuthenticationRepository } from "@/domain/ports/authentication-repository";

export class SignIn {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(credentials: SignInCredentials): Promise<UserAccount | null> {
    return this.authentication.signIn(credentials);
  }
}
