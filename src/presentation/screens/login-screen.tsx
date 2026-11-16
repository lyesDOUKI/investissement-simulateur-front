import { StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, PageHeading } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";

export function LoginScreen({ error, loading, onSubmit }: {
  error: string;
  loading: boolean;
  onSubmit: () => void;
}) {
  return <View style={styles.container}>
    <View style={styles.brandMark}><Text style={styles.brandMarkText}>A</Text></View>
    <Text style={styles.brand}>ALTO<Text style={styles.brandDot}>.</Text></Text>
    <PageHeading eyebrow="Accès local" title="Connexion démo" subtitle="Récupérez un jeton de développement et ouvrez votre espace connecté au service local." />
    <Card style={styles.card}>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <ActionButton label="Récupérer un token et se connecter" onPress={onSubmit} loading={loading} />
    </Card>
    <Text style={styles.disclaimer}>Application de démonstration · accès Jean uniquement · aucune connexion à un courtier.</Text>
  </View>;
}

const styles = StyleSheet.create({
  container: { width: "100%", maxWidth: 460, alignSelf: "center", paddingTop: 38, paddingBottom: 36 },
  brandMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: p.forest, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  brandMarkText: { color: p.mint, fontSize: 22, fontWeight: "800" },
  brand: { color: p.ink, fontSize: 14, fontWeight: "800", letterSpacing: 2, marginBottom: 38 },
  brandDot: { color: p.forestLight },
  card: { gap: 18 },
  error: { color: p.red, fontSize: 13, lineHeight: 18 },
  disclaimer: { color: p.muted, fontSize: 11, lineHeight: 17, marginTop: 18, textAlign: "center" },
});
