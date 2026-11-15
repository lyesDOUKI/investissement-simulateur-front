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
    <PageHeading eyebrow="Résultat de simulation" title="Comparer les deux scénarios" subtitle={"Même date pour A et B : " + formatDateLabel(result.original.valuationDate) + ". Voyez comment la date de départ, le montant et les supports changent le résultat."} />
    <View style={[styles.scenarios, wide && styles.scenariosWide]}>
      <ScenarioCard title="A · Plan de référence" details={operationDetails(operation)} valuation={result.original} isDca={operation.kind === "dca"} />
      <ScenarioCard title="B · Plan alternatif" details={scenarioDetails(operation, scenario)} valuation={result.alternative} isDca={operation.kind === "dca"} highlighted />
    </View>
    <SectionTitle title="Écart · B par rapport à A" />
    <Card style={styles.difference}>
      <DifferenceRow label="Capital investi" value={result.difference.invested} />
      <DifferenceRow label="Valeur à cette date" value={result.difference.value} />
      <DifferenceRow label="Écart de gain" value={result.difference.gain} />
      <Text style={styles.hint}>L’écart montre ce qui change entre les deux choix à la même date. Il ne prédit pas les performances futures.</Text>
    </Card>
    <Text style={styles.disclaimer}>Réponse fixe de l’adaptateur de démonstration en V0. Le scénario n’a pas été ajouté à votre historique et aucun ordre n’est transmis.</Text>
    <View style={styles.footer}>
      <ActionButton label="Modifier les hypothèses" tone="light" onPress={onAdjust} />
    </View>
  </>;
}

function ScenarioCard({ title, details, valuation, isDca, highlighted = false }: {
  title: string;
  details: string[];
  valuation: InvestmentComparison["original"];
  isDca: boolean;
  highlighted?: boolean;
}) {
  return <Card style={[styles.scenario, highlighted && styles.scenarioHighlighted]}>
    <Text style={styles.scenarioTitle}>{title}</Text>
    {details.map((detail) => <Text key={detail} style={styles.meta}>{detail}</Text>)}
    <View style={styles.rule} />
    <Text style={styles.value}>{euro(valuation.value)}</Text>
    <Text style={styles.meta}>Valeur au {formatDateLabel(valuation.valuationDate)}</Text>
    <View style={styles.rule} />
    <DifferenceRow label="Capital investi" value={valuation.invested} />
    <DifferenceRow label="Gain / perte" value={valuation.gain} />
    {valuation.assumptionPct !== undefined ? <DifferenceRow label="Hypothèse annuelle" suffix=" %" value={valuation.assumptionPct} /> : null}
    {isDca ? <Text style={styles.meta}>{valuation.installmentCount} échéance{valuation.installmentCount === 1 ? "" : "s"} reçue{valuation.installmentCount === 1 ? "" : "s"}</Text> : null}
    {valuation.allocations.map((allocation) => <View key={allocation.isin} style={styles.allocation}>
      <View style={styles.allocationDetails}>
        <Text style={styles.meta}>{allocation.name}</Text>
        {allocation.instrumentKind === "uc" ? <Text style={styles.meta}>{allocation.shares.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 6 })} parts acquises · cours {allocation.observedPrice === undefined ? "indisponible" : euro(allocation.observedPrice) + (allocation.observedDate ? " au " + formatDateLabel(allocation.observedDate) : "")}</Text> : <Text style={styles.meta}>Fonds euro · valeur estimée</Text>}
      </View>
      <View style={styles.allocationValue}>
        <Text style={styles.allocationAmount}>{euro(allocation.value)}</Text>
        <Text style={styles.meta}>à cette date</Text>
      </View>
    </View>)}
    {isDca && valuation.installments.length > 0 ? <View style={styles.installments}>
      <Text style={styles.installmentHeading}>Parts acquises à chaque échéance</Text>
      {valuation.installments.map((installment, index) => <View key={installment.executionDate + index} style={styles.installment}>
        <Text style={styles.meta}>Échéance du {formatDateLabel(installment.dueDate)} · achat le {formatDateLabel(installment.executionDate)} · {euro(installment.amount)}</Text>
        {installment.allocations.map((line, lineIndex) => <Text key={line.isin + lineIndex} style={styles.meta}>
          {line.name} : {line.purchasePrice === undefined ? line.status : line.shares.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 6 }) + " parts achetées à " + euro(line.purchasePrice) + (line.purchasePriceDate ? " le " + formatDateLabel(line.purchasePriceDate) : "")}
        </Text>)}
      </View>)}
    </View> : null}
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
  value: { color: p.forestLight, fontSize: 29, fontWeight: "700", letterSpacing: -0.5 },
  meta: { color: p.muted, fontSize: 12, lineHeight: 17 },
  rule: { height: 1, backgroundColor: p.line, marginVertical: 4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  rowValue: { color: p.ink, fontSize: 13, fontWeight: "700" },
  allocation: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, borderTopWidth: 1, borderColor: p.line, paddingTop: 8 },
  allocationDetails: { flex: 1, gap: 2 },
  allocationValue: { alignItems: "flex-end", gap: 2 },
  allocationAmount: { color: p.ink, fontSize: 12, fontWeight: "700" },
  installments: { gap: 8, borderTopWidth: 1, borderColor: p.line, paddingTop: 10 },
  installmentHeading: { color: p.ink, fontSize: 12, fontWeight: "700" },
  installment: { gap: 3, paddingLeft: 8, borderLeftWidth: 2, borderColor: p.forestLight },
  difference: { backgroundColor: p.softGreen, gap: 13 },
  hint: { color: p.forestLight, fontSize: 11, lineHeight: 16, marginTop: 2 },
  disclaimer: { color: p.muted, fontSize: 11, lineHeight: 16, marginTop: 14 },
  footer: { marginTop: 16 },
});
