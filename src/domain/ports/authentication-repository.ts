import type { SignInCredentials, UserAccount } from "@/domain/models/user-account";

export interface AuthenticationRepository {
  signIn(credentials: SignInCredentials): Promise<UserAccount | null>;
  connectDemo(): Promise<UserAccount>;
  disconnect(): void;
}
