import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { InvestmentComparison } from "@/domain/models/operation";
import { ActionButton, Card, PageHeading, SectionTitle } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";

const euro = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export function ComparisonResultScreen({ result, onAdjust }: {
  result: InvestmentComparison;
  onAdjust: () => void;
}) {
  const wide = useWindowDimensions().width >= 760;
  return <>
    <PageHeading eyebrow="Résultat de simulation" title="Comparer les deux scénarios" subtitle={"Valorisation au " + formatDateLabel(result.original.valuationDate) + " · résultats retournés par le service."} />
    <View style={[styles.scenarios, wide && styles.scenariosWide]}>
      <ScenarioCard title="Votre opération" valuation={result.original} />
      <ScenarioCard title="Autre hypothèse" valuation={result.alternative} highlighted />
    </View>
    <SectionTitle title="Écart entre les scénarios" />
    <Card style={styles.difference}>
      <DifferenceRow label="Capital investi" value={result.difference.invested} />
      <DifferenceRow label="Valeur à cette date" value={result.difference.value} />
      <DifferenceRow label="Écart de gain" value={result.difference.gain} />
      <Text style={styles.hint}>Ces écarts proviennent de la réponse du service métier.</Text>
    </Card>
    <Text style={styles.disclaimer}>Réponse fixe de l’adaptateur de démonstration en V0. Le scénario n’a pas été ajouté à votre historique et aucun ordre n’est transmis.</Text>
    <View style={styles.footer}>
      <ActionButton label="Modifier les hypothèses" tone="light" onPress={onAdjust} />
    </View>
  </>;
}

function ScenarioCard({ title, valuation, highlighted = false }: {
  title: string;
  valuation: InvestmentComparison["original"];
  highlighted?: boolean;
}) {
  return <Card style={[styles.scenario, highlighted && styles.scenarioHighlighted]}>
    <Text style={styles.scenarioTitle}>{title}</Text>
    <Text style={styles.value}>{euro(valuation.value)}</Text>
    <Text style={styles.meta}>Valeur retournée</Text>
    <View style={styles.rule} />
    <DifferenceRow label="Capital investi" value={valuation.invested} />
    <DifferenceRow label="Gain / perte" value={valuation.gain} />
    {valuation.assumptionPct !== undefined ? <DifferenceRow label="Hypothèse annuelle" suffix=" %" value={valuation.assumptionPct} /> : null}
    <Text style={styles.meta}>{valuation.installmentCount} échéances reçues</Text>
    {valuation.allocations.map((allocation) => <View key={allocation.isin} style={styles.allocation}>
      <Text style={styles.meta}>{allocation.name}</Text>
      <Text style={styles.meta}>{euro(allocation.value)}</Text>
    </View>)}
  </Card>;
}

function DifferenceRow({ label, value, suffix = " €" }: { label: string; value: number; suffix?: string }) {
  return <View style={styles.row}>
    <Text style={styles.meta}>{label}</Text>
    <Text style={styles.rowValue}>{value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + suffix}</Text>
  </View>;
}

const styles = StyleSheet.create({
  scenarios: { gap: 12 },
  scenariosWide: { flexDirection: "row", alignItems: "stretch" },
  scenario: { flex: 1, gap: 9 },
  scenarioHighlighted: { borderColor: p.forestLight, borderWidth: 1.5 },
  scenarioTitle: { color: p.ink, fontSize: 15, fontWeight: "700" },
  value: { color: p.forest, fontSize: 29, fontWeight: "700", letterSpacing: -0.5 },
  meta: { color: p.muted, fontSize: 12, lineHeight: 17 },
  rule: { height: 1, backgroundColor: p.line, marginVertical: 4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  rowValue: { color: p.ink, fontSize: 13, fontWeight: "700" },
  allocation: { flexDirection: "row", justifyContent: "space-between", gap: 8, borderTopWidth: 1, borderColor: p.line, paddingTop: 8 },
  difference: { backgroundColor: p.softGreen, gap: 13 },
  hint: { color: p.forest, fontSize: 11, lineHeight: 16, marginTop: 2 },
  disclaimer: { color: p.muted, fontSize: 11, lineHeight: 16, marginTop: 14 },
  footer: { marginTop: 16 },
});
