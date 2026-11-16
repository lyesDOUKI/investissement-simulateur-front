import type { UserAccount } from "@/domain/models/user-account";
import { Platform } from "react-native";

const tokenUrl = process.env.EXPO_PUBLIC_OIDC_TOKEN_URL ?? `${Platform.OS === "android" ? "http://10.0.2.2:8091" : "http://localhost:8091"}/realms/investissement-simulateur/token`;
const clientId = process.env.EXPO_PUBLIC_OIDC_CLIENT_ID ?? "investissement-simulateur-api";

export class DevTokenClient {
  token: string | null = null;
  async connect(): Promise<UserAccount> {
    const clientSecret = process.env.EXPO_PUBLIC_OIDC_CLIENT_SECRET;
    if (!clientSecret) throw new Error("Configurez EXPO_PUBLIC_OIDC_CLIENT_SECRET dans .env.local.");
    const body = new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret, scope: "openid", role: "USER" });
    const response = await fetch(tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", ...(Platform.OS === "web" ? {} : { Host: "oidc-mock:8091" }) }, body: body.toString() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) throw new Error(data.error_description ?? `Échec du mock OIDC (${response.status}).`);
    const token: string = data.access_token;
    this.token = token;
    const claims = JSON.parse(decodePayload(token));
    return { id: claims.sub ?? "local-user", firstName: claims.given_name ?? "Jean", lastName: claims.family_name ?? "Dupont", email: claims.email ?? "", phone: "Non fourni par le token", createdAt: "Non fournie par le token" };
  }
  clear() { this.token = null; }
}

function decodePayload(token: string): string {
  const part = token.split(".")[1];
  if (!part) throw new Error("Le mock OIDC a retourné un JWT invalide.");
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(Array.from(atob(base64), (c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
}
