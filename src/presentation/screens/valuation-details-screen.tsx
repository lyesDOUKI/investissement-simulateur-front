import { StyleSheet, Text, View } from "react-native";
import type { InvestmentValuation, Operation } from "@/domain/models/operation";
import { Card, PageHeading, SectionTitle, Divider } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";

const euro = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const units = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 6 });

export function ValuationDetailsScreen({ operation, result }: { operation: Operation; result: InvestmentValuation }) {
  return <>
    <PageHeading eyebrow="Détail de vos achats" title={operation.kind === "dca" ? "Vos échéances" : "Votre versement, support par support"} subtitle={`Achats enregistrés et valorisés au ${formatDateLabel(result.valuationDate)}.`} />
    {result.hasMissingPrices ? <Card style={styles.warning}><Text style={styles.warningText}>Le service signale un ou plusieurs cours manquants. Certaines valeurs peuvent être indisponibles.</Text></Card> : null}
    {result.allocations.some((a) => a.instrumentKind === "uc") ? <Card style={styles.education}>
      <Text style={styles.educationTitle}>Comprendre les parts</Text>
      <Text style={styles.educationText}>Une part est une fraction de votre placement sur un support. Le nombre acheté à chaque date reste dans votre historique ; sa valeur évolue avec le cours.</Text>
    </Card> : null}
    <SectionTitle title={operation.kind === "dca" ? "Synthèse par support" : "Détail du versement"} />
    {result.allocations.map((allocation) => <Card key={allocation.instrumentKind + allocation.isin} style={styles.card}>
      <View style={styles.row}><Text style={styles.title}>{allocation.name}</Text><Text style={styles.value}>{euro(allocation.value)}</Text></View>
      <Text style={styles.meta}>{allocation.instrumentKind === "uc" ? allocation.isin : "Fonds euro"}</Text>
      <Row label="Montant placé" value={euro(allocation.invested)} />
      {allocation.instrumentKind === "uc" ? <Row label={operation.kind === "dca" ? "Parts acquises au total" : "Parts acquises le " + formatDateLabel(operation.date)} value={units(allocation.shares)} /> : <Text style={styles.meta}>Valeur du fonds euro estimée par le service</Text>}
      {allocation.instrumentKind === "uc" && allocation.averagePurchasePrice !== undefined ? <Row label={operation.kind === "dca" ? "Prix moyen des achats" : "Cours moyen à l’achat"} value={euro(allocation.averagePurchasePrice)} /> : null}
      {allocation.instrumentKind === "uc" && allocation.observedDate ? <Row label={`Cours pris en compte · ${formatDateLabel(allocation.observedDate)}`} value={allocation.observedPrice === undefined ? "Indisponible" : euro(allocation.observedPrice)} /> : null}
      <Row label={`Valeur au ${formatDateLabel(result.valuationDate)}`} value={euro(allocation.value)} />
      <View style={styles.row}><Text style={styles.meta}>Évolution depuis vos achats</Text><Text style={allocation.gain >= 0 ? styles.positive : styles.negative}>{allocation.gain >= 0 ? "+" : ""}{euro(allocation.gain)}</Text></View>
    </Card>)}
    {result.installments.length > 0 ? <>
      <SectionTitle title="Détail des échéances" />
      {result.installments.map((installment, index) => <Card key={installment.executionDate + index} style={styles.card}>
        <View style={styles.installmentHeader}>
          <Text style={styles.title}>Achat exécuté le {formatDateLabel(installment.executionDate)}</Text>
          <Text style={styles.meta}>Échéance prévue le {formatDateLabel(installment.dueDate)} · {euro(installment.amount)} au total</Text>
        </View>
        {installment.allocations.map((line, lineIndex) => <View key={line.isin + lineIndex} style={styles.installmentAllocation}>
          <Text style={styles.title}>{line.isin && line.isin !== "FONDS-EURO" ? line.isin : line.name}</Text>
          <Text style={styles.meta}>{line.isin}</Text>
          <Row label="Montant placé" value={euro(line.amount)} />
          <Row label="Parts acquises" value={units(line.shares)} />
          <Row label={`Prix à l’achat${line.purchasePriceDate ? " · " + formatDateLabel(line.purchasePriceDate) : ""}`} value={line.purchasePrice === undefined ? "Indisponible" : euro(line.purchasePrice)} />
        </View>)}
        {index < result.installments.length - 1 ? <Divider /> : null}
      </Card>)}
    </> : null}
  </>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.meta}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  card: { gap: 8, marginBottom: 10 }, title: { color: p.ink, fontSize: 14, fontWeight: "700", flex: 1 }, value: { color: p.ink, fontSize: 13, fontWeight: "700" }, meta: { color: p.muted, fontSize: 12, lineHeight: 17 }, row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  education: { gap: 5, backgroundColor: p.softGreen, marginBottom: 9 }, educationTitle: { color: p.forestLight, fontSize: 13, fontWeight: "700" }, educationText: { color: p.ink, fontSize: 12, lineHeight: 18 },
  installmentHeader: { gap: 4 }, installmentAllocation: { gap: 7, borderTopWidth: 1, borderColor: p.line, paddingTop: 10 },
  positive: { color: p.forestLight, fontSize: 12, fontWeight: "700" }, negative: { color: p.red, fontSize: 12, fontWeight: "700" },
  warning: { backgroundColor: p.warning, marginBottom: 10 }, warningText: { color: p.warningText, fontSize: 12, lineHeight: 18 },
});
