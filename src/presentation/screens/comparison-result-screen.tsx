import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { ComparisonDataStatus, ComparisonInstallment, ComparisonParameters, ComparisonScenario, InvestmentComparison, Operation } from "@/domain/models/operation";
import { ActionButton, Card, PageHeading, SectionTitle } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";

const euro = (value: number | null) => value === null ? "Indisponible" : `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const units = (value: number | null) => value === null ? "—" : value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 6 });
const rate = (value: number) => `${(value * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} % / an`;

export function ComparisonResultScreen({ operation, result, onAdjust }: {
  operation: Operation;
  result: InvestmentComparison;
  onAdjust: () => void;
}) {
  const wide = useWindowDimensions().width >= 760;
  const isDca = operation.kind === "dca";
  return <>
    <PageHeading eyebrow="Résultat de simulation" title="Comparer les deux scénarios" subtitle={`Même date pour A et B : ${formatDateLabel(result.valuationDate)}. Voyez comment les paramètres modifient le résultat.`} />
    {result.valuationStatus === "partial" ? <Card style={styles.partial}><Text style={styles.partialTitle}>Comparaison partielle</Text><Text style={styles.meta}>Au moins un support n’a pas pu être valorisé complètement. Les valeurs et écarts indisponibles sont indiqués comme tels.</Text></Card> : null}
    <View style={[styles.scenarios, wide && styles.scenariosWide]}>
      <ScenarioCard title={`A · ${isDca ? "Plan de référence" : "Versement de référence"}`} scenario={result.original} isDca={isDca} />
      <ScenarioCard title={`B · ${isDca ? "Plan alternatif" : "Versement alternatif"}`} scenario={result.alternative} isDca={isDca} highlighted />
    </View>
    <SectionTitle title="Écart · B par rapport à A" />
    <Card style={styles.difference}>
      <DifferenceRow label="Capital investi" value={result.difference.invested} />
      <DifferenceRow label="Valeur à cette date" value={result.difference.value} />
      <DifferenceRow label="Écart de gain" value={result.difference.gain} />
      <DifferenceRow label="Écart de rendement" value={result.difference.gainRatePercentagePoints} suffix=" points" />
      <Text style={styles.hint}>Les écarts sont calculés par le service comme B moins A. Ils décrivent les hypothèses comparées et ne prédisent pas les performances futures.</Text>
    </Card>
    <Text style={styles.disclaimer}>Le scénario B n’est pas ajouté à votre journal. Aucun ordre n’est transmis au courtier.</Text>
    <View style={styles.footer}><ActionButton label="Modifier les hypothèses" tone="light" onPress={onAdjust} /></View>
  </>;
}

function ScenarioCard({ title, scenario, isDca, highlighted = false }: {
  title: string;
  scenario: ComparisonScenario;
  isDca: boolean;
  highlighted?: boolean;
}) {
  const valuation = scenario.valuation;
  const details = parameterDetails(scenario.parameters, isDca);
  return <Card style={[styles.scenario, highlighted && styles.scenarioHighlighted]}>
    <Text style={styles.scenarioTitle}>{title}</Text>
    {details.map((detail, index) => <Text key={`${detail}-${index}`} style={styles.meta}>{detail}</Text>)}
    <View style={styles.rule} />
    <Text style={styles.value}>{euro(valuation.value)}</Text>
    <Text style={styles.meta}>Valeur au {formatDateLabel(valuation.valuationDate)}</Text>
    <View style={styles.rule} />
    <DifferenceRow label="Capital investi" value={valuation.invested} />
    <DifferenceRow label="Gain / perte" value={valuation.gain} />
    <DifferenceRow label="Rendement" value={valuation.gainRatePct} suffix=" %" />
    {isDca ? <Text style={styles.meta}>{valuation.installments.length} échéances retournées par le service</Text> : null}
    {valuation.allocations.map((allocation, index) => <View key={`${allocation.instrumentKind}-${allocation.isin ?? allocation.name}-${index}`} style={styles.allocation}>
      <View style={styles.allocationHeader}><Text style={styles.allocationTitle}>{allocation.name ?? allocation.isin ?? "Fonds euro"}</Text><StatusBadge status={allocation.status} /></View>
      {allocation.isin ? <Text style={styles.meta}>{allocation.isin}</Text> : null}
      <View style={styles.allocationRows}>
        <Row label="Montant placé sur ce support" value={euro(allocation.invested)} />
        {allocation.instrumentKind === "uc" ? <Row label="Parts acquises au total" value={units(allocation.shares)} /> : null}
        {allocation.observedDate || allocation.observedPrice !== null ? <Row label={`Cours observé${allocation.observedDate ? " · " + formatDateLabel(allocation.observedDate) : ""}`} value={euro(allocation.observedPrice)} /> : null}
        {allocation.averagePurchasePrice !== null ? <Row label="Prix moyen d’achat" value={euro(allocation.averagePurchasePrice)} /> : null}
        <Row label="Origine du prix d’achat" value={statusLabel(allocation.purchaseStatus)} />
        <Row label={`Valeur au ${formatDateLabel(valuation.valuationDate)}`} value={euro(allocation.value)} />
        <Row label="Origine de la valorisation" value={statusLabel(allocation.status)} />
        <Row label="Gain / perte" value={euro(allocation.gain)} />
        {allocation.annualReturns.map((assumption, assumptionIndex) => <Text key={`return-${assumptionIndex}`} style={styles.meta}>Hypothèse de rendement : {rate(assumption)}</Text>)}
        {allocation.annualRates.map((assumption, assumptionIndex) => <Text key={`rate-${assumptionIndex}`} style={styles.meta}>Hypothèse fonds euro : {rate(assumption)}</Text>)}
      </View>
    </View>)}
    {isDca && valuation.installments.length > 0 ? <View style={styles.installments}>
      <Text style={styles.installmentHeading}>Détail des échéances</Text>
      {valuation.installments.map((installment, index) => <InstallmentCard key={`${installment.dueDate}-${installment.executionDate}-${index}`} installment={installment} valuationDate={valuation.valuationDate} />)}
    </View> : null}
  </Card>;
}

function InstallmentCard({ installment, valuationDate }: { installment: ComparisonInstallment; valuationDate: string }) {
  return <View style={styles.installment}>
    <View style={styles.allocationHeader}><Text style={styles.installmentDate}>Échéance du {formatDateLabel(installment.dueDate)}</Text><Text style={[styles.badge, installment.nature === "observed" ? styles.observedBadge : styles.projectedBadge]}>{installmentNatureLabel(installment.nature)}</Text></View>
    <Text style={styles.meta}>{installment.executionDate ? `Exécution : ${formatDateLabel(installment.executionDate)}` : "Date d’exécution non renseignée"} · {euro(installment.amount)} au total</Text>
    {installment.allocations.map((line, lineIndex) => <View key={`${line.instrumentKind}-${line.isin ?? line.name}-${lineIndex}`} style={styles.installmentSupport}>
      <View style={styles.allocationHeader}><Text style={styles.allocationTitle}>{line.isin ?? line.name ?? "Fonds euro"}</Text><StatusBadge status={line.status} /></View>
      <Row label={line.status === "not-executed" ? "Montant prévu" : "Montant placé"} value={euro(line.amount)} />
      {line.instrumentKind === "uc" ? <Row label="Parts acquises" value={units(line.shares)} /> : null}
      <Row label={`Prix à l’achat${line.purchasePriceDate ? ` · ${formatDateLabel(line.purchasePriceDate)}` : ""}`} value={line.status === "not-executed" ? "À déterminer à l’exécution" : euro(line.purchasePrice)} />
      {line.status !== "not-executed" ? <Row label="Origine du prix d’achat" value={statusLabel(line.purchaseStatus)} /> : null}
      <Row label={`Valeur au ${formatDateLabel(valuationDate)}`} value={euro(line.value)} />
      <Row label="Origine de la valorisation" value={statusLabel(line.status)} />
      <Row label="Gain / perte" value={euro(line.gain)} />
      {line.annualReturns.map((assumption, assumptionIndex) => <Text key={`return-${assumptionIndex}`} style={styles.meta}>Hypothèse de rendement : {rate(assumption)}</Text>)}
      {line.annualRates.map((assumption, assumptionIndex) => <Text key={`rate-${assumptionIndex}`} style={styles.meta}>Hypothèse fonds euro : {rate(assumption)}</Text>)}
    </View>)}
  </View>;
}

function parameterDetails(parameters: ComparisonParameters, isDca: boolean) {
  const details = [];
  const date = isDca ? parameters.configuredAt : parameters.date;
  const amount = isDca ? parameters.monthlyAmount : parameters.amount;
  if (date) details.push(`${isDca ? "Mis en place le" : "Exécuté le"} ${formatDateLabel(date)}`);
  if (amount !== undefined) details.push(`${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €${isDca ? " / mois" : ""}`);
  if (isDca && parameters.executionDay !== undefined) details.push(`Prélèvement le ${parameters.executionDay} · délai ${parameters.delayBusinessDays ?? 0} jours ouvrés`);
  for (const allocation of parameters.allocations) {
    details.push(`${allocation.name ?? allocation.isin ?? "Fonds euro"} · ${allocation.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €${isDca ? " / mois" : ""}`);
  }
  for (const assumption of parameters.projectionAssumptions) details.push(`${assumption.isin} · hypothèse ${rate(assumption.annualReturn)}`);
  for (const assumption of parameters.euroFundAssumptions) details.push(`${assumption.name} · taux hypothétique ${rate(assumption.annualRate)}`);
  return details;
}

function StatusBadge({ status }: { status: ComparisonDataStatus }) {
  const label = statusLabel(status);
  return <Text style={[styles.badge, status === "observed" ? styles.observedBadge : status === "projected" ? styles.projectedBadge : styles.missingBadge]}>{label}</Text>;
}

function statusLabel(status: ComparisonDataStatus) {
  return status === "observed" ? "Cours observé" : status === "projected" ? "Projeté" : status === "not-executed" ? "Non exécuté" : "Indisponible";
}

function installmentNatureLabel(nature: ComparisonInstallment["nature"]) {
  if (nature === "observed") return "Observée";
  if (nature === "projected") return "Projetée";
  if (nature === "mixed") return "Mixte";
  if (nature === "not-yet-executed") return "À venir";
  return "Partielle";
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.meta}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}

function DifferenceRow({ label, value, suffix = " €" }: { label: string; value: number | null; suffix?: string }) {
  return <View style={styles.row}><Text style={styles.meta}>{label}</Text><Text style={styles.rowValue}>{value === null ? "Indisponible" : `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`}</Text></View>;
}

const styles = StyleSheet.create({
  scenarios: { gap: 12 }, scenariosWide: { flexDirection: "row", alignItems: "stretch" }, scenario: { flex: 1, gap: 9 }, scenarioHighlighted: { borderColor: p.forestLight, borderWidth: 1.5 },
  scenarioTitle: { color: p.ink, fontSize: 15, fontWeight: "700" }, value: { color: p.forestLight, fontSize: 29, fontWeight: "700", letterSpacing: -0.5 }, meta: { color: p.muted, fontSize: 12, lineHeight: 17 }, rule: { height: 1, backgroundColor: p.line, marginVertical: 4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, rowValue: { color: p.ink, fontSize: 12, fontWeight: "700" }, allocation: { gap: 4, borderTopWidth: 1, borderColor: p.line, paddingTop: 8 }, allocationHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, allocationTitle: { color: p.ink, fontSize: 13, fontWeight: "700", flex: 1 }, allocationRows: { gap: 5, marginTop: 3 },
  installments: { gap: 8, borderTopWidth: 1, borderColor: p.line, paddingTop: 10 }, installmentHeading: { color: p.ink, fontSize: 12, fontWeight: "700" }, installment: { gap: 5, paddingLeft: 8, borderLeftWidth: 2, borderColor: p.forestLight }, installmentDate: { color: p.ink, fontSize: 12, fontWeight: "700", flex: 1 }, installmentSupport: { gap: 5, marginTop: 3, paddingTop: 7, borderTopWidth: 1, borderColor: p.line },
  badge: { overflow: "hidden", paddingVertical: 4, paddingHorizontal: 7, borderRadius: 12, color: p.ink, fontSize: 10, fontWeight: "700" }, observedBadge: { backgroundColor: p.softGreen }, projectedBadge: { backgroundColor: p.warning }, missingBadge: { backgroundColor: p.line }, difference: { backgroundColor: p.softGreen, gap: 13 }, hint: { color: p.forestLight, fontSize: 11, lineHeight: 16, marginTop: 2 }, disclaimer: { color: p.muted, fontSize: 11, lineHeight: 16, marginTop: 14 }, footer: { marginTop: 16 }, partial: { backgroundColor: p.warning, gap: 5, marginBottom: 12 }, partialTitle: { color: p.warningText, fontSize: 13, fontWeight: "700" },
});
