import { StyleSheet, Text, View } from "react-native";
import type { InvestmentValuation, Operation } from "@/domain/models/operation";
import { ActionButton, Card, Divider, PageHeading, SectionTitle, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";
import { DateField } from "@/presentation/components/date-field";

const euro = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const units = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 6 });

export function ValuationResultScreen({ operation, date, annualReturnPct, result, error, loading, compareEnabled, onDateChange, onAnnualReturnChange, onValue, onCompare }: {
  operation: Operation;
  date: string;
  annualReturnPct: string;
  result: InvestmentValuation | null;
  error: string;
  loading: boolean;
  compareEnabled: boolean;
  onDateChange: (value: string) => void;
  onAnnualReturnChange: (value: string) => void;
  onValue: () => void;
  onCompare: () => void;
}) {
  return <>
    <PageHeading eyebrow="Résultat de valorisation" title={operation.kind === "dca" ? "Valeur de votre plan" : "Valeur de votre versement"} subtitle="Retrouvez vos achats, puis leur valeur à la date choisie." />
    <Card style={styles.source}>
      <Text style={styles.sourceTitle}>{operation.label}</Text>
      <Text style={styles.meta}>{operation.kind === "dca" ? "Plan mis en place le " : "Versement réalisé le "}{formatDateLabel(operation.date)} · {operation.kind === "dca" ? euro(operation.amount) + " / mois" : euro(operation.amount)}</Text>
      <Text style={styles.meta}>{operation.detail}</Text>
    </Card>

    {result ? <>
      <Card style={styles.hero}>
        <Text style={styles.heroLabel}>Valeur de vos placements au {formatDateLabel(result.valuationDate)}</Text>
        <Text style={styles.heroValue}>{euro(result.value)}</Text>
        <Text style={styles.heroLabel}>Gain ou perte indicatif</Text>
        <Text style={styles.heroGain}>{result.gain >= 0 ? "+" : ""}{euro(result.gain)} · {result.gainRatePct.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</Text>
        <Divider />
        <Text style={styles.heroLabel}>Capital investi : {euro(result.invested)}</Text>
        {operation.kind === "dca" ? <Text style={styles.heroLabel}>{result.installmentCount} échéances retournées</Text> : null}
        {result.assumptionPct !== undefined ? <Text style={styles.heroLabel}>Hypothèse transmise : {result.assumptionPct} % / an</Text> : null}
      </Card>
      <Text style={styles.resultExplanation}>Les achats ci-dessous sont ceux enregistrés à leurs dates d’exécution. La valeur présentée correspond à la date que vous avez choisie.</Text>
      {result.hasMissingPrices ? <Card style={styles.warning}><Text style={styles.warningText}>Le service signale un ou plusieurs cours manquants. Consultez son résultat détaillé.</Text></Card> : null}

      <SectionTitle title={operation.kind === "dca" ? "Vos achats, support par support" : "Votre achat"} />
      {result.allocations.some((allocation) => allocation.instrumentKind === "uc") ? <Card style={styles.education}>
        <Text style={styles.educationTitle}>Comprendre les parts</Text>
        <Text style={styles.educationText}>Une part est une fraction de votre placement sur un support. Le nombre acheté à chaque date reste dans votre historique ; la valeur de ces parts évolue avec le cours. Avec un plan régulier, chaque échéance peut acheter un nombre différent de parts.</Text>
      </Card> : null}
      {result.allocations.map((allocation) => <Card key={allocation.instrumentKind + allocation.isin} style={styles.detailCard}>
        <View style={styles.row}><Text style={styles.detailTitle}>{allocation.name}</Text><Text style={styles.detailValue}>{euro(allocation.value)}</Text></View>
        <Text style={styles.meta}>{allocation.instrumentKind === "uc" ? allocation.isin : "Fonds euro"}</Text>
        <View style={styles.row}><Text style={styles.meta}>Montant placé</Text><Text style={styles.detailValue}>{euro(allocation.invested)}</Text></View>
        {allocation.instrumentKind === "uc" ? <View style={styles.row}><Text style={styles.meta}>{operation.kind === "dca" ? "Parts acquises au total" : "Parts acquises le " + formatDateLabel(operation.date)}</Text><Text style={styles.detailValue}>{units(allocation.shares)}</Text></View> : <Text style={styles.meta}>Valeur du fonds euro estimée par le service</Text>}
        {allocation.instrumentKind === "uc" && allocation.averagePurchasePrice !== undefined ? <View style={styles.row}><Text style={styles.meta}>{operation.kind === "dca" ? "Prix moyen des achats" : "Cours moyen à l’achat"}</Text><Text style={styles.detailValue}>{euro(allocation.averagePurchasePrice)}</Text></View> : null}
        {allocation.instrumentKind === "uc" && allocation.observedDate ? <View style={styles.row}><Text style={styles.meta}>Cours pris en compte · {formatDateLabel(allocation.observedDate)}</Text><Text style={styles.detailValue}>{allocation.observedPrice === undefined ? "Indisponible" : euro(allocation.observedPrice)}</Text></View> : null}
        <View style={styles.row}><Text style={styles.meta}>Valeur au {formatDateLabel(result.valuationDate)}</Text><Text style={styles.detailValue}>{euro(allocation.value)}</Text></View>
        <View style={styles.row}><Text style={styles.meta}>Évolution depuis vos achats</Text><Text style={allocation.gain >= 0 ? styles.positive : styles.negative}>{allocation.gain >= 0 ? "+" : ""}{euro(allocation.gain)}</Text></View>
      </Card>)}

      {result.installments.length > 0 ? <>
        <SectionTitle title="Détail des échéances" />
        {result.installments.map((installment, index) => <Card key={installment.executionDate + index} style={styles.installments}>
          <View style={styles.installmentHeader}>
            <Text style={styles.detailTitle}>Achat exécuté le {formatDateLabel(installment.executionDate)}</Text>
            <Text style={styles.meta}>Échéance prévue le {formatDateLabel(installment.dueDate)} · {euro(installment.amount)} au total</Text>
          </View>
          {installment.allocations.map((line, lineIndex) => <View key={line.isin + lineIndex} style={styles.installmentAllocation}>
            <Text style={styles.detailTitle}>{line.isin && line.isin !== "FONDS-EURO" ? line.isin : line.name}</Text>
            <Text style={styles.meta}>{line.isin}</Text>
            <View style={styles.row}><Text style={styles.meta}>Montant placé</Text><Text style={styles.detailValue}>{euro(line.amount)}</Text></View>
            <View style={styles.row}><Text style={styles.meta}>Parts acquises</Text><Text style={styles.detailValue}>{units(line.shares)}</Text></View>
            <View style={styles.row}><Text style={styles.meta}>Prix à l’achat{line.purchasePriceDate ? " · " + formatDateLabel(line.purchasePriceDate) : ""}</Text><Text style={styles.detailValue}>{line.purchasePrice === undefined ? "Indisponible" : euro(line.purchasePrice)}</Text></View>
          </View>)}
        </Card>)}
      </> : null}
    </> : null}

    <SectionTitle title={result ? "Autre date ou hypothèse" : "Paramètres de valorisation"} />
    <Card style={styles.parameters}>
      <DateField label="Date de valorisation ou projection" value={date} onChange={onDateChange} helper="Le service métier décide du traitement de cette date." />
      <TextField label="Taux annuel (hypothèse)" value={annualReturnPct} onChangeText={onAnnualReturnChange} keyboardType="decimal-pad" suffix="%" helper="Transmis au service pour une projection future." />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ActionButton label={result ? "Mettre à jour la valorisation" : "Demander la valorisation"} tone={result ? "quiet" : "dark"} onPress={onValue} loading={loading} />
      {result && compareEnabled ? <ActionButton label="Comparer avec une autre hypothèse" tone="light" onPress={onCompare} /> : null}
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
  education: { gap: 5, backgroundColor: p.softGreen, marginBottom: 9 },
  educationTitle: { color: p.forestLight, fontSize: 13, fontWeight: "700" },
  educationText: { color: p.ink, fontSize: 12, lineHeight: 18 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  detailTitle: { color: p.ink, fontSize: 14, fontWeight: "700", flex: 1 },
  detailValue: { color: p.ink, fontSize: 14, fontWeight: "700" },
  positive: { color: p.forestLight, fontSize: 12, fontWeight: "700" },
  negative: { color: p.red, fontSize: 12, fontWeight: "700" },
  installments: { gap: 10, marginBottom: 9 },
  installmentHeader: { gap: 4 },
  installmentAllocation: { gap: 7, borderTopWidth: 1, borderColor: p.line, paddingTop: 10 },
  parameters: { gap: 15 },
  error: { color: p.red, fontSize: 13, lineHeight: 18 },
  disclaimer: { color: p.muted, fontSize: 11, lineHeight: 16, marginTop: 13, marginBottom: 8 },
  resultExplanation: { color: p.muted, fontSize: 12, lineHeight: 18, marginTop: 8 },
});
