import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, PageHeading, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";

export function RegisterScreen({ onBack }: { onBack: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const showRegistrationNotice = () => {
    setError("");
    setNotice("");
    if (![firstName, lastName, email, phone, password].every((value) => value.trim())) {
      setError("Complétez les champs pour découvrir le parcours d’inscription.");
      return;
    }
    setNotice("L’inscription n’est pas encore activée. Aucune donnée n’a été enregistrée.");
  };

  return <View style={styles.container}>
    <Pressable onPress={onBack} accessibilityRole="button" style={styles.back}><Text style={styles.backText}>‹ Retour à la connexion</Text></Pressable>
    <PageHeading eyebrow="Nouveau compte" title="Créer un compte" subtitle="Quelques informations pour ouvrir votre espace de suivi." />
    <Card style={styles.card}>
      <TextField label="Prénom" value={firstName} onChangeText={setFirstName} placeholder="Jean" />
      <TextField label="Nom" value={lastName} onChangeText={setLastName} placeholder="Dupont" />
      <TextField label="Adresse e-mail" value={email} onChangeText={setEmail} placeholder="nom@exemple.fr" keyboardType="email-address" autoCapitalize="none" />
      <TextField label="Numéro de téléphone" value={phone} onChangeText={setPhone} placeholder="06 12 34 56 78" keyboardType="phone-pad" />
      <TextField label="Mot de passe" value={password} onChangeText={setPassword} placeholder="Choisissez un mot de passe" autoCapitalize="none" secureTextEntry />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {notice ? <Text accessibilityRole="status" style={styles.notice}>{notice}</Text> : null}
      <ActionButton label="Créer mon compte" tone="light" onPress={showRegistrationNotice} />
    </Card>
    <Text style={styles.disclaimer}>Parcours de démonstration uniquement. Aucun compte ni renseignement ne sera conservé.</Text>
  </View>;
}

const styles = StyleSheet.create({
  container: { width: "100%", maxWidth: 520, alignSelf: "center", paddingTop: 10, paddingBottom: 36 },
  back: { minHeight: 44, justifyContent: "center", marginBottom: 12 },
  backText: { color: p.forestLight, fontSize: 13, fontWeight: "700" },
  card: { gap: 16 },
  error: { color: p.red, fontSize: 13, lineHeight: 18 },
  notice: { color: p.forestLight, fontSize: 13, lineHeight: 18 },
  disclaimer: { color: p.muted, fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 16 },
});
