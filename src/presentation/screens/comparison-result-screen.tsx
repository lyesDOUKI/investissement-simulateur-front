import { useState } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { ComparisonDataStatus, ComparisonInstallment, ComparisonParameters, ComparisonScenario, InvestmentComparison, Operation } from "@/domain/models/operation";
import { ActionButton, Card, PageHeading, SectionTitle } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";
import { InstrumentIdentity } from "@/presentation/components/instrument-identity";

const euro = (value: number | null) => value === null ? "Indisponible" : `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const signedEuro = (value: number | null) => value === null ? "Indisponible" : `${value > 0 ? "+" : ""}${euro(value)}`;
const units = (value: number | null) => value === null ? "—" : value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 6 });
const rate = (value: number) => `${(value * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} % / an`;

export function ComparisonResultScreen({ operation, result, onAdjust, scenarioTitles, projectionStartInstallmentNumber, isRevisionComparison = false }: {
  operation: Operation;
  result: InvestmentComparison;
  onAdjust: () => void;
  scenarioTitles?: { original: string; alternative: string };
  projectionStartInstallmentNumber?: number;
  isRevisionComparison?: boolean;
}) {
  const wide = useWindowDimensions().width >= 760;
  const isDca = operation.kind === "dca";
  return <>
    <PageHeading eyebrow="Résultat de simulation" title={scenarioTitles ? "Comparer deux révisions" : "Comparer les deux scénarios"} subtitle="Les deux scénarios sont valorisés à la même date. Commencez par l’écart, puis ouvrez les détails pour comprendre ce qui le compose." />

    <Card style={styles.resultCard}>
      <Text style={styles.resultEyebrow}>ÉCART · B − A</Text>
      <Text style={styles.resultLabel}>Différence de valeur au {formatDateLabel(result.valuationDate)}</Text>
      <Text style={styles.resultValue}>{signedEuro(result.difference.value)}</Text>
      {result.valuationStatus === "partial" ? <Text style={styles.partialNote}>Comparaison partielle : certaines données de valorisation manquent. Les écarts indisponibles restent indiqués comme tels.</Text> : null}
      <View style={styles.metrics}>
        <DifferenceMetric label="Capital investi" value={result.difference.invested} />
        <View style={styles.metricDivider} />
        <DifferenceMetric label="Écart de gain" value={result.difference.gain} />
        <View style={styles.metricDivider} />
        <DifferenceMetric label="Écart de rendement" value={result.difference.gainRatePercentagePoints} suffix=" pts" />
      </View>
    </Card>
    {projectionStartInstallmentNumber !== undefined ? <Text style={styles.projectionStart}>Les deux révisions sont appliquées à partir de l’échéance n°{projectionStartInstallmentNumber}.</Text> : null}
    <View style={styles.topAction}><ActionButton label="Modifier les hypothèses" tone="light" onPress={onAdjust} /></View>

    <SectionTitle title="Les deux scénarios" action={<Text style={styles.commonDate}>Même date · {formatDateLabel(result.valuationDate)}</Text>} />
    <View style={[styles.scenarios, wide && styles.scenariosWide]}>
      <ScenarioCard title={scenarioTitles?.original ?? `A · ${isDca ? "Plan de référence" : "Versement de référence"}`} scenario={result.original} isDca={isDca} tag={isRevisionComparison ? "RÉVISION" : "ENREGISTRÉ"} />
      <ScenarioCard title={scenarioTitles?.alternative ?? `B · ${isDca ? "Plan alternatif" : "Versement alternatif"}`} scenario={result.alternative} isDca={isDca} highlighted tag={isRevisionComparison ? "RÉVISION" : "HYPOTHÈSE"} />
    </View>

    <Text style={styles.disclaimer}>{isRevisionComparison ? "Cette simulation ne modifie pas le plan et ne transmet aucun ordre au courtier." : "Le scénario B reste une hypothèse : il n’est pas ajouté à votre journal et aucun ordre n’est transmis au courtier."}</Text>
  </>;
}

function ScenarioCard({ title, scenario, isDca, highlighted = false, tag }: {
  title: string;
  scenario: ComparisonScenario;
  isDca: boolean;
  highlighted?: boolean;
  tag: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const valuation = scenario.valuation;
  const parameters = scenario.parameters;
  return <Card style={[styles.scenario, highlighted && styles.scenarioHighlighted]}>
    <View style={styles.scenarioHeader}><Text style={styles.scenarioTitle}>{title}</Text><Text style={[styles.scenarioTag, highlighted && styles.alternativeTag]}>{tag}</Text></View>
    <Text style={styles.scenarioValue}>{euro(valuation.value)}</Text>
    <Text style={styles.meta}>Valeur à la date cible · {formatDateLabel(valuation.valuationDate)}</Text>
    <Text style={styles.scenarioSetup}>{scenarioSetup(parameters, isDca)}</Text>
    <View style={styles.summaryRows}>
      <CompactMetric label="Capital investi" value={euro(valuation.invested)} />
      <CompactMetric label="Gain / perte" value={euro(valuation.gain)} />
    </View>
    <Pressable onPress={() => setExpanded((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded }} style={styles.disclosure}>
      <Text style={styles.disclosureText}>{expanded ? "Masquer les détails" : "Voir les paramètres et supports"}</Text>
      <Text style={styles.disclosureIcon}>{expanded ? "−" : "+"}</Text>
    </Pressable>
    {expanded ? <ScenarioDetails scenario={scenario} isDca={isDca} /> : null}
  </Card>;
}

function ScenarioDetails({ scenario, isDca }: { scenario: ComparisonScenario; isDca: boolean }) {
  const valuation = scenario.valuation;
  const parameters = scenario.parameters;
  return <View style={styles.details}>
    <View style={styles.detailSection}>
      <Text style={styles.detailHeading}>Paramètres utilisés</Text>
      {parameterDetails(parameters, isDca).map((detail, index) => <Text key={`${detail.text}-${index}`} style={[styles.meta, detail.kind === "assumption" && styles.assumptionLine]}>{detail.text}</Text>)}
      <SummaryMetric label="Gain / perte (%)" value={valuation.gainRatePct === null ? "Indisponible" : `${valuation.gainRatePct.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`} />
    </View>

    {valuation.allocations.length > 0 ? <View style={styles.detailSection}>
      <Text style={styles.detailHeading}>Résultat par support</Text>
      {valuation.allocations.map((allocation, index) => <View key={`${allocation.instrumentKind}-${allocation.isin ?? allocation.name}-${index}`} style={styles.allocation}>
        <View style={styles.allocationHeader}><InstrumentIdentity name={allocation.name} symbol={allocation.symbol} isin={allocation.isin} fallback="Fonds euro" titleStyle={styles.allocationTitle} metaStyle={styles.meta} /><StatusBadge status={allocation.status} /></View>
        <SummaryMetric label="Montant placé" value={euro(allocation.invested)} />
        {allocation.instrumentKind === "uc" ? <SummaryMetric label="Parts acquises" value={units(allocation.shares)} /> : null}
        {allocation.observedDate || allocation.observedPrice !== null ? <SummaryMetric label={`Dernier cours disponible${allocation.observedDate ? ` · ${formatDateLabel(allocation.observedDate)}` : ""}`} value={euro(allocation.observedPrice)} /> : null}
        {allocation.averagePurchasePrice !== null ? <SummaryMetric label="Cours moyen de référence" value={euro(allocation.averagePurchasePrice)} /> : null}
        <SummaryMetric label="Cours de référence obtenu avec" value={statusLabel(allocation.purchaseStatus)} />
        <SummaryMetric label={`Valeur à la date cible · ${formatDateLabel(valuation.valuationDate)}`} value={euro(allocation.value)} />
        <SummaryMetric label="Valeur calculée à partir de" value={statusLabel(allocation.status)} />
        <SummaryMetric label="Gain / perte" value={euro(allocation.gain)} />
        {allocation.annualReturns.map((assumption, assumptionIndex) => <Text key={`return-${assumptionIndex}`} style={styles.assumption}>Rendement retenu : {rate(assumption)}</Text>)}
        {allocation.annualRates.map((assumption, assumptionIndex) => <Text key={`rate-${assumptionIndex}`} style={styles.assumption}>Taux fonds euro retenu : {rate(assumption)}</Text>)}
      </View>)}
    </View> : null}

    {isDca && valuation.installments.length > 0 ? <InstallmentsDisclosure installments={valuation.installments} valuationDate={valuation.valuationDate} /> : null}
  </View>;
}

function InstallmentsDisclosure({ installments, valuationDate }: { installments: ComparisonScenario["valuation"]["installments"]; valuationDate: string }) {
  const [expanded, setExpanded] = useState(false);
  return <View style={styles.detailSection}>
    <Pressable onPress={() => setExpanded((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded }} style={styles.installmentsToggle}>
      <View style={styles.installmentToggleText}>
        <Text style={styles.detailHeading}>Échéances DCA</Text>
        <Text style={styles.meta}>{installments.length} échéance{installments.length === 1 ? "" : "s"} détaillée{installments.length === 1 ? "" : "s"}</Text>
      </View>
      <Text style={styles.disclosureText}>{expanded ? "Masquer" : "Afficher"}</Text>
    </Pressable>
    {expanded ? installments.map((installment, index) => <InstallmentCard key={`${installment.dueDate}-${installment.executionDate}-${index}`} installment={installment} valuationDate={valuationDate} />) : null}
  </View>;
}

function InstallmentCard({ installment, valuationDate }: { installment: ComparisonInstallment; valuationDate: string }) {
  return <View style={styles.installment}>
    <View style={styles.allocationHeader}><Text style={styles.installmentDate}>Échéance du {formatDateLabel(installment.dueDate)}</Text><Text style={[styles.badge, installment.nature === "observed" ? styles.observedBadge : styles.projectedBadge]}>{installmentNatureLabel(installment.nature)}</Text></View>
    <Text style={styles.meta}>{installment.executionDate ? `Exécution : ${formatDateLabel(installment.executionDate)}` : "Date d’exécution non renseignée"} · {euro(installment.amount)} au total</Text>
    {installment.allocations.map((line, lineIndex) => <View key={`${line.instrumentKind}-${line.isin ?? line.name}-${lineIndex}`} style={styles.installmentSupport}>
      <View style={styles.allocationHeader}><InstrumentIdentity name={line.name} symbol={line.symbol} isin={line.isin} fallback="Fonds euro" titleStyle={styles.allocationTitle} metaStyle={styles.meta} /><StatusBadge status={line.status} /></View>
      <SummaryMetric label={line.status === "not-executed" ? "Montant prévu" : "Montant placé"} value={euro(line.amount)} />
      {line.instrumentKind === "uc" ? <SummaryMetric label="Parts acquises" value={units(line.shares)} /> : null}
      <SummaryMetric label={`Cours lors de l’exécution${line.purchasePriceDate ? ` · ${formatDateLabel(line.purchasePriceDate)}` : ""}`} value={line.status === "not-executed" ? "À déterminer à l’exécution" : euro(line.purchasePrice)} />
      {line.status !== "not-executed" ? <SummaryMetric label="Cours de référence obtenu avec" value={statusLabel(line.purchaseStatus)} /> : null}
      <SummaryMetric label={`Valeur à la date cible · ${formatDateLabel(valuationDate)}`} value={euro(line.value)} />
      <SummaryMetric label="Valeur calculée à partir de" value={statusLabel(line.status)} />
      <SummaryMetric label="Gain / perte" value={euro(line.gain)} />
      {line.annualReturns.map((assumption, assumptionIndex) => <Text key={`return-${assumptionIndex}`} style={styles.assumption}>Rendement retenu : {rate(assumption)}</Text>)}
      {line.annualRates.map((assumption, assumptionIndex) => <Text key={`rate-${assumptionIndex}`} style={styles.assumption}>Taux fonds euro retenu : {rate(assumption)}</Text>)}
    </View>)}
  </View>;
}

function scenarioSetup(parameters: ComparisonParameters, isDca: boolean) {
  const date = isDca ? parameters.configuredAt : parameters.date;
  const amount = isDca ? parameters.monthlyAmount : parameters.amount;
  const amountLabel = amount === undefined ? "Montant non précisé" : `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €${isDca ? " / mois" : ""}`;
  if (!date) return amountLabel;
  return `${isDca ? "Mis en place" : "Exécuté"} le ${formatDateLabel(date)} · ${amountLabel}`;
}

function parameterDetails(parameters: ComparisonParameters, isDca: boolean) {
  const details: { text: string; kind: "schedule" | "allocation" | "assumption" }[] = [];
  if (isDca && parameters.executionDay !== undefined) details.push({ text: `Prélèvement le ${parameters.executionDay} · délai ${parameters.delayBusinessDays ?? 0} jours ouvrés`, kind: "schedule" });
  for (const allocation of parameters.allocations) {
    const amount = `${allocation.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €${isDca ? " / mois" : ""}`;
    const annualAssumption = allocation.instrumentKind === "uc"
      ? parameters.projectionAssumptions.find((item) => item.isin === allocation.isin)?.annualReturn
      : undefined;
    details.push({ text: `${allocation.symbol ? `${allocation.symbol} · ` : ""}${allocation.name ?? allocation.isin ?? "Fonds euro"} · Montant ${amount}`, kind: "allocation" });
    if (annualAssumption !== undefined) details.push({ text: `↳ Hypothèse de rendement · ${rate(annualAssumption)}`, kind: "assumption" });
  }
  return details;
}

function DifferenceMetric({ label, value, suffix = " €" }: { label: string; value: number | null; suffix?: string }) {
  return <View style={styles.differenceMetric}><Text style={styles.differenceMetricLabel}>{label}</Text><Text style={styles.differenceMetricValue}>{value === null ? "—" : `${value > 0 ? "+" : ""}${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`}</Text></View>;
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryMetric}><Text style={styles.meta}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return <View style={styles.compactMetric}><Text style={styles.compactLabel}>{label}</Text><Text style={styles.compactValue}>{value}</Text></View>;
}

function StatusBadge({ status }: { status: ComparisonDataStatus }) {
  const label = statusLabel(status);
  return <Text style={[styles.badge, status === "observed" ? styles.observedBadge : status === "projected" ? styles.projectedBadge : styles.missingBadge]}>{label}</Text>;
}

function statusLabel(status: ComparisonDataStatus) {
  return status === "observed" ? "Cours du marché" : status === "projected" ? "Projection" : status === "not-executed" ? "Pas encore exécuté" : "Indisponible";
}

function installmentNatureLabel(nature: ComparisonInstallment["nature"]) {
  if (nature === "observed") return "Exécutée";
  if (nature === "projected") return "Échéance projetée";
  if (nature === "mixed") return "Partiellement projetée";
  if (nature === "not-yet-executed") return "À venir";
  return "Partielle";
}

const styles = StyleSheet.create({
  resultCard: { gap: 9, backgroundColor: p.forest, borderColor: p.forest, marginBottom: 5 },
  resultEyebrow: { color: p.mint, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  resultLabel: { color: p.onForest, fontSize: 13, fontWeight: "600" },
  resultValue: { color: p.onForest, fontSize: 34, fontWeight: "800", letterSpacing: -0.7, marginTop: 1 },
  partialNote: { color: p.warningText, fontSize: 11, lineHeight: 16 },
  metrics: { flexDirection: "row", alignItems: "stretch", marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderColor: "#46695C" },
  differenceMetric: { flex: 1, gap: 4, paddingHorizontal: 8 }, differenceMetricLabel: { color: "#B6C9BF", fontSize: 10, lineHeight: 14 }, differenceMetricValue: { color: p.onForest, fontSize: 12, fontWeight: "700" }, metricDivider: { width: 1, backgroundColor: "#46695C" },
  commonDate: { color: p.forestLight, fontSize: 11, fontWeight: "600" }, projectionStart: { color: p.muted, fontSize: 12, lineHeight: 17, marginTop: 3 }, scenarios: { gap: 10 }, scenariosWide: { flexDirection: "row", alignItems: "flex-start" },
  scenario: { flex: 1, gap: 7 }, scenarioHighlighted: { borderColor: p.forestLight, borderWidth: 1.5 }, scenarioHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, scenarioTitle: { color: p.ink, fontSize: 14, fontWeight: "700", flex: 1 }, scenarioTag: { color: p.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }, alternativeTag: { color: p.forestLight }, scenarioValue: { color: p.ink, fontSize: 25, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 }, scenarioSetup: { color: p.muted, fontSize: 11, lineHeight: 16 },
  summaryRows: { flexDirection: "row", gap: 8, marginTop: 2 }, summaryMetric: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, summaryValue: { color: p.ink, fontSize: 11, fontWeight: "700", textAlign: "right" }, compactMetric: { flex: 1, gap: 3, padding: 8, borderRadius: 10, backgroundColor: p.surfaceSubtle }, compactLabel: { color: p.muted, fontSize: 10 }, compactValue: { color: p.ink, fontSize: 12, fontWeight: "700" },
  disclosure: { minHeight: 42, marginTop: 3, paddingTop: 8, borderTopWidth: 1, borderColor: p.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, disclosureText: { color: p.forestLight, fontSize: 12, fontWeight: "700" }, disclosureIcon: { color: p.forestLight, fontSize: 20, fontWeight: "500" },
  details: { gap: 14, paddingTop: 5 }, detailSection: { gap: 7, borderTopWidth: 1, borderColor: p.line, paddingTop: 10 }, detailHeading: { color: p.ink, fontSize: 12, fontWeight: "700" }, allocation: { gap: 6, paddingTop: 9, borderTopWidth: 1, borderColor: p.line }, allocationHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, allocationTitle: { color: p.ink, fontSize: 12, fontWeight: "700", flex: 1 }, meta: { color: p.muted, fontSize: 11, lineHeight: 16 }, assumption: { color: p.muted, fontSize: 11, lineHeight: 16 }, assumptionLine: { marginLeft: 12, color: p.forestLight },
  installmentsToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, installmentToggleText: { gap: 2 }, installment: { gap: 6, padding: 10, borderRadius: 12, backgroundColor: p.surfaceSubtle, marginTop: 4 }, installmentDate: { color: p.ink, fontSize: 12, fontWeight: "700", flex: 1 }, installmentSupport: { gap: 6, paddingTop: 8, borderTopWidth: 1, borderColor: p.line },
  badge: { overflow: "hidden", paddingVertical: 4, paddingHorizontal: 7, borderRadius: 12, color: p.ink, fontSize: 9, fontWeight: "700" }, observedBadge: { backgroundColor: p.softGreen }, projectedBadge: { backgroundColor: p.warning }, missingBadge: { backgroundColor: p.line },
  topAction: { marginTop: 9 }, disclaimer: { color: p.muted, fontSize: 11, lineHeight: 16, marginTop: 15 },
});
