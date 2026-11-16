import { Pressable, StyleSheet, Text, View } from "react-native";
import type { InvestmentValuation, Operation } from "@/domain/models/operation";
import { ActionButton, Card, Divider, PageHeading, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";
import { DateField } from "@/presentation/components/date-field";

const euro = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export function ValuationResultScreen({ operation, date, annualReturnPct, result, error, loading, compareEnabled, onDateChange, onAnnualReturnChange, onValue, onCompare, onDetails }: {
  operation: Operation; date: string; annualReturnPct: string; result: InvestmentValuation | null; error: string; loading: boolean; compareEnabled: boolean;
  onDateChange: (value: string) => void; onAnnualReturnChange: (value: string) => void; onValue: () => void; onCompare: () => void; onDetails: () => void;
}) {
  const hasProjection = result?.allocations.some((allocation) => allocation.status === "projected")
    || result?.installments.some((installment) => installment.nature === "projected" || installment.nature === "mixed" || installment.allocations.some((allocation) => allocation.status === "projected"));

  return <>
    <PageHeading eyebrow="Résultat de valorisation" title={operation.kind === "dca" ? "Valeur de votre plan" : "Valeur de votre versement"} subtitle="Choisissez une date, puis consultez la valeur estimée de vos achats." />
    <Card style={styles.source}>
      <Text style={styles.sourceTitle}>{operation.label}</Text>
      <Text style={styles.meta}>{operation.kind === "dca" ? "Plan mis en place le " : "Versement réalisé le "}{formatDateLabel(operation.date)} · {operation.kind === "dca" ? euro(operation.amount) + " / mois" : euro(operation.amount)}</Text>
      <Text style={styles.meta}>{operation.detail}</Text>
    </Card>

    <Card style={styles.parameters}>
      <Text style={styles.parametersTitle}>{result ? "Changer la date de valorisation" : "Choisir une date de valorisation"}</Text>
      <DateField label="Date cible" value={date} onChange={onDateChange} helper="La valeur sera demandée au service pour cette date." />
      <TextField label="Taux annuel (hypothèse)" value={annualReturnPct} onChangeText={onAnnualReturnChange} keyboardType="decimal-pad" suffix="%" helper="Transmis au service pour les projections futures." />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ActionButton label={result ? "Actualiser la valorisation" : "Valoriser à cette date"} tone="dark" onPress={onValue} loading={loading} />
      {result && compareEnabled ? <ActionButton label="Comparer avec une autre hypothèse" tone="light" onPress={onCompare} /> : null}
    </Card>

    {result ? <>
      <Card style={styles.hero}>
        <Text style={styles.heroLabel}>Valeur de vos placements au {formatDateLabel(result.valuationDate)}</Text>
        <Text style={styles.heroValue}>{euro(result.value)}</Text>
        <Text style={styles.heroLabel}>Gain ou perte indicatif</Text>
        <Text style={styles.heroGain}>{result.gain >= 0 ? "+" : ""}{euro(result.gain)} · {result.gainRatePct.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</Text>
        <Divider />
        <Text style={styles.heroLabel}>Capital investi : {euro(result.invested)}</Text>
        {operation.kind === "dca" ? <Text style={styles.heroLabel}>{result.installmentCount} échéances valorisées</Text> : null}
        {result.assumptionPct !== undefined ? <Text style={styles.heroLabel}>Hypothèse transmise : {result.assumptionPct} % / an</Text> : null}
      </Card>
      <Text style={styles.resultExplanation}>Les achats sont ceux enregistrés à leurs dates d’exécution. La valeur affichée correspond à la date choisie.</Text>
      {hasProjection ? <Card style={styles.projectionNote}><Text style={styles.projectionTitle}>Cette valorisation inclut des projections</Text><Text style={styles.warningText}>Quand aucun cours observé n’est disponible à la date demandée, le service utilise une hypothèse annuelle. Le détail par support indique les cours observés et les hypothèses appliquées.</Text></Card> : null}
      <Pressable onPress={onDetails} accessibilityRole="button" accessibilityLabel="Ouvrir le détail des achats et des échéances" style={styles.detailsLink}>
        <View style={styles.detailsText}><Text style={styles.detailsTitle}>{operation.kind === "dca" ? "Voir le détail des échéances" : "Voir le détail du versement"}</Text><Text style={styles.meta}>{result.allocations.length} support{result.allocations.length === 1 ? "" : "s"}{operation.kind === "dca" ? ` · ${result.installmentCount} échéances` : " · parts et cours d’achat"}</Text></View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      {result.hasMissingPrices ? <Card style={styles.warning}><Text style={styles.warningText}>Le service signale un ou plusieurs cours manquants. Certaines valeurs peuvent être indisponibles.</Text></Card> : null}
      <Text style={styles.disclaimer}>Aucun ordre n’est transmis au courtier. Les montants sont fournis par le service et peuvent différer de ceux du courtier.</Text>
    </> : null}
  </>;
}

const styles = StyleSheet.create({
  source: { gap: 6, marginBottom: 12 }, sourceTitle: { color: p.ink, fontSize: 15, fontWeight: "700" }, meta: { color: p.muted, fontSize: 12, lineHeight: 17 },
  parameters: { gap: 14, marginBottom: 14, backgroundColor: p.surfaceSubtle }, parametersTitle: { color: p.ink, fontSize: 14, fontWeight: "700" },
  hero: { backgroundColor: p.forest, borderColor: p.forest, gap: 10, marginBottom: 8 }, heroLabel: { color: p.onForest, fontSize: 12 }, heroValue: { color: p.onForest, fontSize: 38, fontWeight: "700", letterSpacing: -0.8 }, heroGain: { color: p.mint, fontSize: 14, fontWeight: "700" },
  resultExplanation: { color: p.muted, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 10 },
  detailsLink: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 68, padding: 15, backgroundColor: p.paper, borderColor: p.line, borderWidth: 1, borderRadius: 18, marginBottom: 10 }, detailsText: { flex: 1, gap: 4 }, detailsTitle: { color: p.forestLight, fontSize: 14, fontWeight: "700" }, chevron: { color: p.forestLight, fontSize: 26, fontWeight: "500" },
  warning: { backgroundColor: p.warning, marginTop: 6 }, warningText: { color: p.warningText, fontSize: 12, lineHeight: 18},
  projectionNote: { backgroundColor: p.warning, marginTop: 6, marginBottom: 16 }, projectionTitle: { color: p.warningText, fontSize: 13, fontWeight: "700" },
  error: { color: p.red, fontSize: 13, lineHeight: 18 }, disclaimer: { color: p.muted, fontSize: 11, lineHeight: 16, marginTop: 4, marginBottom: 8 },
});
