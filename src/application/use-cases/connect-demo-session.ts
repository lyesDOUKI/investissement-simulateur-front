import type { UserAccount } from "@/domain/models/user-account";
import type { AuthenticationRepository } from "@/domain/ports/authentication-repository";

export class ConnectDemoSession {
  constructor(private readonly authentication: AuthenticationRepository) {}
  execute(): Promise<UserAccount> { return this.authentication.connectDemo(); }
  disconnect(): void { this.authentication.disconnect(); }
}
