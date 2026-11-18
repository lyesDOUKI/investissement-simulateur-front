import { Pressable, StyleSheet, Text, View } from "react-native";
import type { InvestmentValuation, Operation } from "@/domain/models/operation";
import { ActionButton, Card, Divider, PageHeading, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";
import { DateField } from "@/presentation/components/date-field";

const euro = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export function ValuationResultScreen({ operation, date, assumptions, result, error, loading, compareEnabled, onDateChange, onAssumptionChange, onValue, onCompare, onDetails }: {
  operation: Operation; date: string; assumptions: Record<string, string>; result: InvestmentValuation | null; error: string; loading: boolean; compareEnabled: boolean;
  onDateChange: (value: string) => void; onAssumptionChange: (isin: string, value: string) => void; onValue: () => void; onCompare: () => void; onDetails: () => void;
}) {
  const isFutureDate = (value: string) => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return false;
    const target = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return target > now;
  };
  const future = isFutureDate(date);
  const configuredAllocations = [...operation.allocations, ...(operation.configurationHistory ?? []).flatMap((revision) => revision.allocations)];
  const supports = configuredAllocations.filter((allocation, index, all) => allocation.instrumentKind === "uc" && allocation.isin && all.findIndex((item) => item.instrumentKind === "uc" && item.isin === allocation.isin) === index);
  const hasProjection = result?.allocations.some((allocation) => allocation.status === "projected")
    || result?.installments.some((installment) => installment.nature === "projected" || installment.nature === "mixed" || installment.allocations.some((allocation) => allocation.status === "projected"));

  return <>
    <PageHeading eyebrow="Résultat de valorisation" title={operation.kind === "dca" ? "Valeur de votre plan" : "Valeur de votre versement"} subtitle="Choisissez une date, puis consultez la valeur estimée de vos versements." />
    <Card style={styles.source}>
      <Text style={styles.sourceTitle}>{operation.label}</Text>
      <Text style={styles.meta}>{operation.kind === "dca" ? "Plan mis en place le " : "Versement réalisé le "}{formatDateLabel(operation.date)} · {operation.kind === "dca" ? euro(operation.amount) + " / mois" : euro(operation.amount)}</Text>
      <Text style={styles.meta}>{operation.detail}</Text>
    </Card>

    <Card style={styles.parameters}>
      <Text style={styles.parametersTitle}>{result ? "Changer la date de valorisation" : "Choisir une date de valorisation"}</Text>
      <DateField label="Date cible" value={date} onChange={onDateChange} helper="Choisissez la date à laquelle consulter la valeur estimée de vos placements." />
      {future && supports.length > 0 ? <View style={styles.assumptions}>
        <Text style={styles.parametersTitle}>Hypothèses de rendement</Text>
        <Text style={styles.meta}>Pour une date future, indiquez le rendement annuel envisagé pour chaque UC. Cette hypothèse sert uniquement aux projections du service ; elle ne prédit pas la performance réelle.</Text>
        {supports.map((support) => {
          const title = support.symbol ?? support.name ?? support.isin;
          const label = [title, support.name && support.name !== title ? support.name : null, `ISIN ${support.isin}`].filter(Boolean).join(" · ");
          return <TextField key={support.isin} label={label} value={assumptions[support.isin] ?? "5"} onChangeText={(value) => onAssumptionChange(support.isin, value)} keyboardType="decimal-pad" suffix="% / an" />;
        })}
      </View> : null}
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
      <Text style={styles.resultExplanation}>{operation.kind === "dca" ? "Chaque échéance est valorisée avec la configuration qui lui était applicable. Les échéances passées restent inchangées ; le service de calcul rassemble leur valeur à la date choisie." : "Les parts enregistrées à la date d’exécution sont valorisées à la date choisie par le service de calcul."}</Text>
      {hasProjection ? <Card style={styles.projectionNote}><Text style={styles.projectionTitle}>Cette valorisation inclut des projections</Text><Text style={styles.warningText}>Selon le support, la valeur repose sur un cours de marché disponible ou sur une projection. Le détail indique la date du dernier cours utilisé et les hypothèses appliquées.</Text></Card> : null}
      <Pressable onPress={onDetails} accessibilityRole="button" accessibilityLabel="Ouvrir le détail des versements et des échéances" style={styles.detailsLink}>
        <View style={styles.detailsText}><Text style={styles.detailsTitle}>{operation.kind === "dca" ? "Voir le détail des échéances" : "Voir le détail du versement"}</Text><Text style={styles.meta}>{result.allocations.length} support{result.allocations.length === 1 ? "" : "s"}{operation.kind === "dca" ? ` · ${result.installmentCount} échéances` : " · parts et cours de référence"}</Text></View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      {result.hasMissingPrices ? <Card style={styles.warning}><Text style={styles.warningText}>Le service signale un ou plusieurs cours manquants. Certaines valeurs peuvent être indisponibles.</Text></Card> : null}
      <Text style={styles.disclaimer}>Aucun ordre n’est transmis au courtier. Les montants sont fournis par le service et peuvent différer de ceux du courtier.</Text>
    </> : null}
  </>;
}

const styles = StyleSheet.create({
  source: { gap: 6, marginBottom: 12 }, sourceTitle: { color: p.ink, fontSize: 15, fontWeight: "700" }, meta: { color: p.muted, fontSize: 12, lineHeight: 17 },
  parameters: { gap: 14, marginBottom: 14, backgroundColor: p.surfaceSubtle }, parametersTitle: { color: p.ink, fontSize: 14, fontWeight: "700" }, assumptions: { gap: 10, paddingTop: 3 },
  hero: { backgroundColor: p.forest, borderColor: p.forest, gap: 10, marginBottom: 8 }, heroLabel: { color: p.onForest, fontSize: 12 }, heroValue: { color: p.onForest, fontSize: 38, fontWeight: "700", letterSpacing: -0.8 }, heroGain: { color: p.mint, fontSize: 14, fontWeight: "700" },
  resultExplanation: { color: p.muted, fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 10 },
  detailsLink: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 68, padding: 15, backgroundColor: p.paper, borderColor: p.line, borderWidth: 1, borderRadius: 18, marginBottom: 10 }, detailsText: { flex: 1, gap: 4 }, detailsTitle: { color: p.forestLight, fontSize: 14, fontWeight: "700" }, chevron: { color: p.forestLight, fontSize: 26, fontWeight: "500" },
  warning: { backgroundColor: p.warning, marginTop: 6 }, warningText: { color: p.warningText, fontSize: 12, lineHeight: 18},
  projectionNote: { backgroundColor: p.warning, marginTop: 6, marginBottom: 16 }, projectionTitle: { color: p.warningText, fontSize: 13, fontWeight: "700" },
  error: { color: p.red, fontSize: 13, lineHeight: 18 }, disclaimer: { color: p.muted, fontSize: 11, lineHeight: 16, marginTop: 4, marginBottom: 8 },
});
