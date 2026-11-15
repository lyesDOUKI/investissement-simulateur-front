export interface UserAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}
