import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Card,
  PageHeading,
  text,
} from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";

export function InvestScreen({
  onVersement,
  onDca,
}: {
  onVersement: () => void;
  onDca: () => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="À vous de choisir"
        title="Enregistrer"
        subtitle="Choisissez ce que vous voulez ajouter à votre journal. Vos allocations se définissent à l’étape suivante."
      />
      <Pressable onPress={onVersement}>
        <Card style={styles.choice}>
          <View style={[styles.icon, styles.iconDark]}>
            <Text style={styles.iconTextDark}>↑</Text>
          </View>
          <View style={styles.choiceMain}>
            <Text style={styles.choiceTitle}>Versement ponctuel</Text>
            <Text style={text.label}>
              Enregistrez un versement déjà réalisé, réparti entre un ou
              plusieurs supports.
            </Text>
            <Text style={styles.choiceMeta}>
              Libre · ISIN au choix · Montants personnalisés
            </Text>
          </View>
          <Text style={styles.arrow}>↗</Text>
        </Card>
      </Pressable>
      <Pressable onPress={onDca}>
        <Card style={styles.choice}>
          <View style={[styles.icon, styles.iconSoft]}>
            <Text style={styles.iconTextSoft}>↻</Text>
          </View>
          <View style={styles.choiceMain}>
            <Text style={styles.choiceTitle}>Plan d’investissement</Text>
            <Text style={text.label}>
              Enregistrez les paramètres du plan DCA que vous suivez chez votre
              courtier, puis rejouez ses échéances.
            </Text>
            <Text style={styles.choiceMeta}>
              Mensuel · date et délai ouvré configurables
            </Text>
          </View>
          <Text style={styles.arrow}>↗</Text>
        </Card>
      </Pressable>
      <View style={styles.info}>
        <Text style={styles.infoTitle}>Une allocation qui vous ressemble</Text>
        <Text style={styles.infoBody}>
          À l’étape suivante, répartissez le montant entre plusieurs supports
          avec leur ISIN ou un fonds euro.
        </Text>
      </View>
      <View style={styles.trust}>
        <Text style={styles.trustMark}>✓</Text>
        <Text style={styles.trustText}>
          Simulation sans ordre réel · aucune donnée financière envoyée
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  choice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 13,
    marginBottom: 11,
    padding: 17,
  },
  icon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDark: { backgroundColor: p.forest },
  iconSoft: { backgroundColor: p.softGreen },
  iconTextDark: { color: p.mint, fontSize: 22, fontWeight: "700" },
  iconTextSoft: { color: p.forest, fontSize: 21, fontWeight: "700" },
  choiceMain: { flex: 1, gap: 7 },
  choiceTitle: { color: p.ink, fontSize: 16, fontWeight: "700" },
  choiceMeta: {
    color: p.forestLight,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  arrow: { color: p.forest, fontSize: 18, fontWeight: "700", paddingTop: 3 },
  info: {
    borderRadius: 18,
    backgroundColor: p.forest,
    padding: 18,
    marginTop: 16,
    gap: 7,
  },
  infoTitle: { color: p.paper, fontSize: 15, fontWeight: "700" },
  infoBody: { color: "#D0DDD6", fontSize: 13, lineHeight: 19 },
  trust: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 17,
  },
  trustMark: { color: p.forestLight, fontWeight: "800" },
  trustText: { color: p.muted, fontSize: 11, flex: 1 },
});
