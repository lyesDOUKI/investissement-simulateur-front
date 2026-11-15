import { Pressable, StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, PageHeading, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";

export function LoginScreen({ email, password, error, loading, onEmailChange, onPasswordChange, onSubmit, onRegister }: {
  email: string;
  password: string;
  error: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onRegister: () => void;
}) {
  return <View style={styles.container}>
    <View style={styles.brandMark}><Text style={styles.brandMarkText}>A</Text></View>
    <Text style={styles.brand}>ALTO<Text style={styles.brandDot}>.</Text></Text>
    <PageHeading eyebrow="Votre espace personnel" title="Connexion" subtitle="Retrouvez votre journal d’investissement et vos simulations." />
    <Card style={styles.card}>
      <TextField label="Adresse e-mail" value={email} onChangeText={onEmailChange} placeholder="nom@exemple.fr" keyboardType="email-address" autoCapitalize="none" />
      <TextField label="Mot de passe" value={password} onChangeText={onPasswordChange} placeholder="Votre mot de passe" autoCapitalize="none" secureTextEntry />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <ActionButton label="Se connecter" onPress={onSubmit} loading={loading} />
      <View style={styles.registerPrompt}>
        <Text style={styles.meta}>Pas encore de compte ?</Text>
        <Pressable onPress={onRegister} accessibilityRole="button"><Text style={styles.link}>Créer un compte</Text></Pressable>
      </View>
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
  registerPrompt: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5, flexWrap: "wrap" },
  meta: { color: p.muted, fontSize: 13 },
  link: { color: p.forestLight, fontSize: 13, fontWeight: "700" },
  error: { color: p.red, fontSize: 13, lineHeight: 18 },
  disclaimer: { color: p.muted, fontSize: 11, lineHeight: 17, marginTop: 18, textAlign: "center" },
});
