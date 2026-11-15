import { StyleSheet, Text, View } from "react-native";
import type { UserAccount } from "@/domain/models/user-account";
import { ActionButton, Card, PageHeading, SectionTitle } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";

export function AccountScreen({ account, onSignOut }: { account: UserAccount; onSignOut: () => void }) {
  const initials = `${account.firstName.charAt(0)}${account.lastName.charAt(0)}`.toUpperCase();
  return <>
    <PageHeading eyebrow="Espace personnel" title="Mon compte" subtitle="Consultez les informations associées à votre espace." />
    <Card style={styles.identity}>
      <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
      <View style={styles.identityText}>
        <Text style={styles.name}>{account.firstName} {account.lastName}</Text>
        <Text style={styles.email}>{account.email}</Text>
      </View>
      <Text style={styles.badge}>DÉMO</Text>
    </Card>

    <SectionTitle title="Informations personnelles" />
    <Card style={styles.details}>
      <InfoRow label="Prénom" value={account.firstName} />
      <InfoRow label="Nom" value={account.lastName} />
    </Card>

    <SectionTitle title="Coordonnées" />
    <Card style={styles.details}>
      <InfoRow label="Adresse e-mail" value={account.email} />
      <InfoRow label="Téléphone" value={account.phone} />
    </Card>

    <SectionTitle title="Compte" />
    <Card style={styles.details}>
      <InfoRow label="Créé le" value={account.createdAt} />
      <InfoRow label="Statut" value="Compte de démonstration" />
    </Card>
    <Text style={styles.disclaimer}>Ces informations sont fictives et servent à présenter le parcours de compte.</Text>
    <View style={styles.signOut}><ActionButton label="Se déconnecter" tone="quiet" onPress={onSignOut} /></View>
  </>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text selectable style={styles.value}>{value}</Text>
  </View>;
}

const styles = StyleSheet.create({
  identity: { flexDirection: "row", alignItems: "center", gap: 13 },
  avatar: { width: 48, height: 48, borderRadius: 18, backgroundColor: p.softGreen, alignItems: "center", justifyContent: "center" },
  initials: { color: p.forestLight, fontSize: 15, fontWeight: "800" },
  identityText: { flex: 1, gap: 4 },
  name: { color: p.ink, fontSize: 16, fontWeight: "700" },
  email: { color: p.muted, fontSize: 12 },
  badge: { color: p.forestLight, fontSize: 9, fontWeight: "800", letterSpacing: 0.8, backgroundColor: p.softGreen, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 10 },
  details: { paddingVertical: 5 },
  row: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, borderBottomWidth: 1, borderColor: p.line },
  label: { color: p.muted, fontSize: 13 },
  value: { flexShrink: 1, color: p.ink, fontSize: 13, fontWeight: "600", textAlign: "right" },
  disclaimer: { color: p.muted, fontSize: 11, lineHeight: 17, marginTop: 16 },
  signOut: { marginTop: 18 },
});
