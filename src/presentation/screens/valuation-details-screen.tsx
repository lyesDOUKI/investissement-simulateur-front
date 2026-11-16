import { StyleSheet, Text, View } from "react-native";
import type { InstallmentValuation, ValuedAllocation, InvestmentValuation, Operation } from "@/domain/models/operation";
import { Card, PageHeading, SectionTitle, Divider } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";

const euro = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const units = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 6 });
const rate = (value: number) => `${(value * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} % / an`;

export function ValuationDetailsScreen({ operation, result }: { operation: Operation; result: InvestmentValuation }) {
  const hasProjection = result.allocations.some((allocation) => allocation.status === "projected")
    || result.installments.some((installment) => installment.nature === "projected" || installment.nature === "mixed" || installment.allocations.some((allocation) => allocation.status === "projected"));

  return <>
    <PageHeading eyebrow="Détail de valorisation" title={operation.kind === "dca" ? "Détail par échéance" : "Détail par support"} subtitle={`Résultats fournis à la date cible du ${formatDateLabel(result.valuationDate)}.`} />
    {result.allocations.some((allocation) => allocation.instrumentKind === "uc") ? <Card style={styles.courseNote}><Text style={styles.educationTitle}>À propos des cours affichés</Text><Text style={styles.educationText}>Le cours du marché est le dernier relevé disponible à la date indiquée. Il peut être antérieur à la date de valorisation choisie.</Text></Card> : null}
    {hasProjection ? <Card style={styles.projectionNote}><Text style={styles.projectionNoteTitle}>Une partie de cette valeur est projetée</Text><Text style={styles.meta}>Les supports et échéances concernés sont indiqués ci-dessous avec l’hypothèse annuelle transmise au service.</Text></Card> : null}
    {result.hasMissingPrices ? <Card style={styles.warning}><Text style={styles.warningText}>Le service signale un ou plusieurs cours manquants. Certaines valeurs peuvent être indisponibles.</Text></Card> : null}
    {result.allocations.some((a) => a.instrumentKind === "uc") ? <Card style={styles.education}>
      <Text style={styles.educationTitle}>Comprendre les parts</Text>
      <Text style={styles.educationText}>Une part est une fraction de votre placement sur un support. Le nombre acheté à chaque date reste dans votre historique ; sa valeur évolue avec le cours.</Text>
    </Card> : null}

    <SectionTitle title={operation.kind === "dca" ? "Synthèse par support" : "Détail du versement"} />
    {result.allocations.map((allocation) => <Card key={allocation.instrumentKind + allocation.isin} style={styles.card}>
      <View style={styles.row}><Text style={styles.title}>{allocation.name}</Text><Text style={styles.value}>{euro(allocation.value)}</Text></View>
      <View style={styles.badgeRow}><Text style={styles.meta}>{allocation.instrumentKind === "uc" ? allocation.isin : "Fonds euro"}</Text><StatusBadge status={allocation.status} /></View>
      <Row label="Montant placé" value={euro(allocation.invested)} />
      {allocation.instrumentKind === "uc" ? <Row label={operation.kind === "dca" ? "Parts acquises au total" : "Parts acquises le " + formatDateLabel(operation.date)} value={units(allocation.shares)} /> : <Text style={styles.meta}>Valeur du fonds euro estimée par le service</Text>}
      {allocation.instrumentKind === "uc" && allocation.averagePurchasePrice !== undefined ? <Row label="Prix moyen d’achat" value={euro(allocation.averagePurchasePrice)} /> : null}
      {allocation.status === "observed" && allocation.observedDate ? <Row label={`Dernier cours disponible · ${formatDateLabel(allocation.observedDate)}`} value={allocation.observedPrice === undefined ? "Indisponible" : euro(allocation.observedPrice)} /> : null}
      {allocation.status === "projected" ? <ProjectionAssumptions allocation={allocation} /> : null}
      <Row label={`Valeur à la date cible · ${formatDateLabel(result.valuationDate)}`} value={euro(allocation.value)} />
      <View style={styles.row}><Text style={styles.meta}>Gain / perte depuis les achats</Text><Text style={allocation.gain >= 0 ? styles.positive : styles.negative}>{allocation.gain >= 0 ? "+" : ""}{euro(allocation.gain)}</Text></View>
    </Card>)}

    {result.installments.length > 0 ? <>
      <SectionTitle title="Détail des échéances" />
      {result.installments.map((installment, index) => <Card key={`${installment.dueDate}-${installment.executionDate}-${index}`} style={styles.card}>
        <View style={styles.installmentHeader}>
          <View style={styles.badgeRow}><Text style={styles.title}>Échéance du {formatDateLabel(installment.dueDate)}</Text><InstallmentBadge nature={installment.nature} /></View>
          <Text style={styles.meta}>{executionLabel(installment)} · {euro(installment.amount)} au total</Text>
        </View>
        {installment.allocations.map((line, lineIndex) => <View key={`${line.instrumentKind}-${line.isin}-${lineIndex}`} style={styles.installmentAllocation}>
          <View style={styles.badgeRow}><Text style={styles.title}>{line.instrumentKind === "uc" ? line.isin : line.name}</Text><StatusBadge status={line.status} /></View>
          {line.instrumentKind === "fonds-euro" ? <Text style={styles.meta}>Fonds euro</Text> : null}
          <Row label={installment.nature === "not-yet-executed" ? "Montant prévu" : "Montant placé"} value={euro(line.amount)} />
          {line.instrumentKind === "uc" ? <Row label={installment.nature === "not-yet-executed" ? "Parts prévues" : "Parts acquises"} value={line.shares === null ? installment.nature === "not-yet-executed" ? "À déterminer à l’exécution" : "Indisponible" : units(line.shares)} /> : null}
          {line.instrumentKind === "uc" ? <Row label={`Prix à l’achat${line.purchasePriceDate ? " · " + formatDateLabel(line.purchasePriceDate) : ""}`} value={line.purchasePrice === undefined ? installment.nature === "not-yet-executed" ? "À déterminer à l’exécution" : "Indisponible" : euro(line.purchasePrice)} /> : null}
          {line.value !== undefined ? <Row label={`Valeur à la date cible · ${formatDateLabel(result.valuationDate)}`} value={euro(line.value)} /> : null}
          {line.gain !== undefined ? <Row label="Gain / perte sur cette échéance" value={`${line.gain >= 0 ? "+" : ""}${euro(line.gain)}`} valueStyle={line.gain >= 0 ? styles.positive : styles.negative} /> : null}
          {line.status === "projected" ? <InstallmentAssumptions line={line} /> : null}
        </View>)}
        {index < result.installments.length - 1 ? <Divider /> : null}
      </Card>)}
    </> : null}
  </>;
}

function executionLabel(installment: InstallmentValuation) {
  if (installment.nature === "not-yet-executed") return "Pas encore exécutée";
  if (!installment.executionDate) return "Date d’exécution non renseignée";
  return `Exécutée le ${formatDateLabel(installment.executionDate)}`;
}

function StatusBadge({ status }: { status: ValuedAllocation["status"] }) {
  const label = status === "observed" ? "Cours du marché" : status === "projected" ? "Projection" : "Cours indisponible";
  return <View style={[styles.badge, status === "projected" ? styles.projectedBadge : status === "missing" ? styles.missingBadge : styles.observedBadge]}><Text style={styles.badgeText}>{label}</Text></View>;
}

function InstallmentBadge({ nature }: { nature: InstallmentValuation["nature"] }) {
  const label = nature === "observed" ? "Exécutée" : nature === "projected" ? "Échéance projetée" : nature === "mixed" ? "Partiellement projetée" : nature === "not-yet-executed" ? "À venir" : "Partielle";
  const projected = nature === "projected" || nature === "mixed" || nature === "not-yet-executed";
  return <View style={[styles.badge, projected ? styles.projectedBadge : styles.observedBadge]}><Text style={styles.badgeText}>{label}</Text></View>;
}

function ProjectionAssumptions({ allocation }: { allocation: ValuedAllocation }) {
  const assumptions = [
    ...(allocation.annualReturns ?? []).map((value) => `Rendement annuel : ${rate(value)}`),
    ...(allocation.annualRates ?? []).map((value) => `Taux annuel : ${rate(value)}`),
  ];
  return <View style={styles.assumptions}><Text style={styles.assumptionTitle}>Hypothèses utilisées par le service</Text>{assumptions.length ? assumptions.map((label, index) => <Text key={`${label}-${index}`} style={styles.meta}>{label}</Text>) : <Text style={styles.meta}>Hypothèse annuelle non précisée dans la réponse.</Text>}</View>;
}

function InstallmentAssumptions({ line }: { line: InstallmentValuation["allocations"][number] }) {
  const assumptions = [line.annualReturn !== undefined ? `Rendement annuel : ${rate(line.annualReturn)}` : null, line.annualRate !== undefined ? `Taux annuel : ${rate(line.annualRate)}` : null].filter((value): value is string => value !== null);
  return <View style={styles.assumptions}><Text style={styles.assumptionTitle}>Hypothèse utilisée</Text>{assumptions.length ? assumptions.map((label) => <Text key={label} style={styles.meta}>{label}</Text>) : <Text style={styles.meta}>Hypothèse annuelle non précisée dans la réponse.</Text>}</View>;
}

function Row({ label, value, valueStyle }: { label: string; value: string; valueStyle?: object }) {
  return <View style={styles.row}><Text style={styles.meta}>{label}</Text><Text style={[styles.value, valueStyle]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  card: { gap: 8, marginBottom: 10 }, title: { color: p.ink, fontSize: 14, fontWeight: "700", flex: 1 }, value: { color: p.ink, fontSize: 13, fontWeight: "700" }, meta: { color: p.muted, fontSize: 12, lineHeight: 17 }, row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  education: { gap: 5, backgroundColor: p.softGreen, marginBottom: 9 }, courseNote: { gap: 5, backgroundColor: p.surfaceSubtle, marginBottom: 9 }, educationTitle: { color: p.forestLight, fontSize: 13, fontWeight: "700" }, educationText: { color: p.ink, fontSize: 12, lineHeight: 18 },
  installmentHeader: { gap: 4 }, installmentAllocation: { gap: 7, borderTopWidth: 1, borderColor: p.line, paddingTop: 10 },
  positive: { color: p.forestLight, fontSize: 12, fontWeight: "700" }, negative: { color: p.red, fontSize: 12, fontWeight: "700" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }, badgeText: { color: p.ink, fontSize: 10, fontWeight: "700" }, observedBadge: { backgroundColor: p.softGreen }, projectedBadge: { backgroundColor: p.warning }, missingBadge: { backgroundColor: p.line },
  assumptions: { gap: 3, padding: 9, borderRadius: 10, backgroundColor: p.surfaceSubtle }, assumptionTitle: { color: p.ink, fontSize: 11, fontWeight: "700" },
  projectionNote: { gap: 5, backgroundColor: p.warning, marginBottom: 10 }, projectionNoteTitle: { color: p.warningText, fontSize: 13, fontWeight: "700" },
  warning: { backgroundColor: p.warning, marginBottom: 10 }, warningText: { color: p.warningText, fontSize: 12, lineHeight: 18 },
});
