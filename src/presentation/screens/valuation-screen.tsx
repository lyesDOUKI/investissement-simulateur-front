import { StyleSheet, Text, View } from "react-native";
import type { InvestmentValuation, Operation } from "@/domain/models/operation";
import { ActionButton, Card, Divider, PageHeading, SectionTitle, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";

const euro = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const units = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 6, maximumFractionDigits: 6 });

export function ValuationResultScreen({ operation, date, annualReturnPct, result, error, loading, onDateChange, onAnnualReturnChange, onValue, onCompare }: {
  operation: Operation;
  date: string;
  annualReturnPct: string;
  result: InvestmentValuation | null;
  error: string;
  loading: boolean;
  onDateChange: (value: string) => void;
  onAnnualReturnChange: (value: string) => void;
  onValue: () => void;
  onCompare: () => void;
}) {
  return <>
    <PageHeading eyebrow="Résultat de valorisation" title="Valeur à une autre date" subtitle="La réponse du service métier pour votre opération." />
    <Card style={styles.source}>
      <Text style={styles.sourceTitle}>{operation.label}</Text>
      <Text style={styles.meta}>{formatDateLabel(operation.date)} · {operation.kind === "dca" ? euro(operation.amount) + " / mois" : euro(operation.amount)}</Text>
      <Text style={styles.meta}>{operation.detail}</Text>
    </Card>

    {result ? <>
      <Card style={styles.hero}>
        <Text style={styles.heroLabel}>Valeur retournée au {formatDateLabel(result.valuationDate)}</Text>
        <Text style={styles.heroValue}>{euro(result.value)}</Text>
        <Text style={styles.heroGain}>{result.gain >= 0 ? "+" : ""}{euro(result.gain)} · {result.gainRatePct.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</Text>
        <Divider />
        <Text style={styles.heroLabel}>Capital investi : {euro(result.invested)}</Text>
        {operation.kind === "dca" ? <Text style={styles.heroLabel}>{result.installmentCount} échéances retournées</Text> : null}
        {result.assumptionPct !== undefined ? <Text style={styles.heroLabel}>Hypothèse transmise : {result.assumptionPct} % / an</Text> : null}
      </Card>
      {result.hasMissingPrices ? <Card style={styles.warning}><Text style={styles.warningText}>Le service signale un ou plusieurs cours manquants. Consultez son résultat détaillé.</Text></Card> : null}

      <SectionTitle title="Détail par support" />
      {result.allocations.map((allocation) => <Card key={allocation.instrumentKind + allocation.isin} style={styles.detailCard}>
        <View style={styles.row}><Text style={styles.detailTitle}>{allocation.name}</Text><Text style={styles.detailValue}>{euro(allocation.value)}</Text></View>
        <Text style={styles.meta}>{allocation.instrumentKind === "uc" ? allocation.isin : "Fonds euro"}</Text>
        <Text style={styles.meta}>Investi {euro(allocation.invested)} · {allocation.instrumentKind === "uc" ? units(allocation.shares) + " parts" : "rendement estimé"}</Text>
        {allocation.instrumentKind === "uc" && allocation.observedDate ? <Text style={styles.meta}>Cours {allocation.observedPrice === undefined ? "indisponible" : euro(allocation.observedPrice)} · {formatDateLabel(allocation.observedDate)}</Text> : null}
        <Text style={allocation.gain >= 0 ? styles.positive : styles.negative}>{allocation.gain >= 0 ? "+" : ""}{euro(allocation.gain)}</Text>
      </Card>)}

      {result.installments.length > 0 ? <>
        <SectionTitle title="Échéances" />
        <Card style={styles.installments}>
          {result.installments.map((installment, index) => <View key={installment.executionDate + index} style={styles.installment}>
            <View style={styles.row}><Text style={styles.detailTitle}>{formatDateLabel(installment.dueDate)}</Text><Text style={styles.detailValue}>{euro(installment.amount)}</Text></View>
            <Text style={styles.meta}>Exécutée le {formatDateLabel(installment.executionDate)}</Text>
            {installment.allocations.map((line, lineIndex) => <Text key={line.isin + lineIndex} style={styles.meta}>{line.isin} · {line.purchasePrice === undefined ? line.status : units(line.shares) + " parts à " + euro(line.purchasePrice)}</Text>)}
            {index < result.installments.length - 1 ? <Divider /> : null}
          </View>)}
        </Card>
      </> : null}
    </> : null}

    <SectionTitle title={result ? "Autre date ou hypothèse" : "Paramètres de valorisation"} />
    <Card style={styles.parameters}>
      <TextField label="Date de valorisation ou projection" value={date} onChangeText={onDateChange} placeholder="JJ/MM/AAAA" helper="Le service métier décide du traitement de cette date." />
      <TextField label="Taux annuel (hypothèse)" value={annualReturnPct} onChangeText={onAnnualReturnChange} keyboardType="decimal-pad" suffix="%" helper="Transmis au service pour une projection future." />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ActionButton label={result ? "Mettre à jour la valorisation" : "Demander la valorisation"} tone={result ? "quiet" : "dark"} onPress={onValue} loading={loading} />
      {result ? <ActionButton label="Comparer avec une autre hypothèse →" tone="light" onPress={onCompare} /> : null}
    </Card>
    <Text style={styles.disclaimer}>Réponse fixe de l’adaptateur de démonstration en V0. Aucun ordre n’est transmis au courtier.</Text>
  </>;
}

const styles = StyleSheet.create({
  source: { gap: 6, marginBottom: 12 },
  sourceTitle: { color: p.ink, fontSize: 15, fontWeight: "700" },
  meta: { color: p.muted, fontSize: 12, lineHeight: 17 },
  hero: { backgroundColor: p.forest, borderColor: p.forest, gap: 10, marginBottom: 8 },
  heroLabel: { color: p.onForest, fontSize: 12 },
  heroValue: { color: p.onForest, fontSize: 38, fontWeight: "700", letterSpacing: -0.8 },
  heroGain: { color: p.mint, fontSize: 14, fontWeight: "700" },
  warning: { backgroundColor: p.warning, marginTop: 10 },
  warningText: { color: p.warningText, fontSize: 12, lineHeight: 18 },
  detailCard: { gap: 7, marginBottom: 9 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  detailTitle: { color: p.ink, fontSize: 14, fontWeight: "700", flex: 1 },
  detailValue: { color: p.ink, fontSize: 14, fontWeight: "700" },
  positive: { color: p.forestLight, fontSize: 12, fontWeight: "700" },
  negative: { color: p.red, fontSize: 12, fontWeight: "700" },
  installments: { gap: 12 },
  installment: { gap: 7, paddingVertical: 5 },
  parameters: { gap: 15 },
  error: { color: p.red, fontSize: 13, lineHeight: 18 },
  disclaimer: { color: p.muted, fontSize: 11, lineHeight: 16, marginTop: 13, marginBottom: 8 },
});
