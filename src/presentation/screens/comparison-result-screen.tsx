import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { InvestmentComparison, Operation, ScenarioInput } from "@/domain/models/operation";
import { ActionButton, Card, PageHeading, SectionTitle } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";

const euro = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export function ComparisonResultScreen({ operation, scenario, result, onAdjust }: {
  operation: Operation;
  scenario: ScenarioInput;
  result: InvestmentComparison;
  onAdjust: () => void;
}) {
  const wide = useWindowDimensions().width >= 760;
  return <>
    <PageHeading eyebrow="Résultat de simulation" title="Comparer les deux scénarios" subtitle={"Même date cible pour A et B : " + formatDateLabel(result.original.valuationDate) + " · résultats retournés par le service."} />
    <View style={[styles.scenarios, wide && styles.scenariosWide]}>
      <ScenarioCard title="A · Plan de référence" details={operationDetails(operation)} valuation={result.original} />
      <ScenarioCard title="B · Plan alternatif" details={scenarioDetails(operation, scenario)} valuation={result.alternative} highlighted />
    </View>
    <SectionTitle title="Écart · B par rapport à A" />
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

function ScenarioCard({ title, details, valuation, highlighted = false }: {
  title: string;
  details: string[];
  valuation: InvestmentComparison["original"];
  highlighted?: boolean;
}) {
  return <Card style={[styles.scenario, highlighted && styles.scenarioHighlighted]}>
    <Text style={styles.scenarioTitle}>{title}</Text>
    {details.map((detail) => <Text key={detail} style={styles.meta}>{detail}</Text>)}
    <View style={styles.rule} />
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

function operationDetails(operation: Operation): string[] {
  const schedule = operation.kind === "dca"
    ? [
        "Mis en place le " + formatDateLabel(operation.date),
        operation.amount.toLocaleString("fr-FR") + " € / mois · prélèvement le " + operation.executionDay,
        "Délai : " + operation.delayBusinessDays + " jours ouvrés",
      ]
    : ["Versement exécuté le " + formatDateLabel(operation.date), operation.amount.toLocaleString("fr-FR") + " €"];
  if (operation.annualReturnPct !== undefined) schedule.push("Hypothèse annuelle : " + operation.annualReturnPct + " %");
  return schedule.concat(operation.allocations.map((line) => (line.name ?? line.isin) + " · " + euro(line.amount)));
}

function scenarioDetails(operation: Operation, scenario: ScenarioInput): string[] {
  const schedule = operation.kind === "dca"
    ? [
        "Mis en place le " + formatDateLabel(scenario.startDate),
        scenario.amount.toLocaleString("fr-FR") + " € / mois · prélèvement le " + scenario.executionDay,
        "Délai : " + scenario.delayBusinessDays + " jours ouvrés",
      ]
    : ["Versement B prévu le " + formatDateLabel(scenario.startDate), scenario.amount.toLocaleString("fr-FR") + " €"];
  if (scenario.annualReturnPct !== undefined) schedule.push("Hypothèse annuelle : " + scenario.annualReturnPct + " %");
  return schedule.concat(scenario.allocations.map((line) => (line.name ?? line.isin) + " · " + euro(line.amount)));
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
