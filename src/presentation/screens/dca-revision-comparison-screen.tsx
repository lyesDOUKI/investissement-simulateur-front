import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Operation, Security } from "@/domain/models/operation";
import { ActionButton, Card, PageHeading, TextField } from "@/presentation/components/investment-ui";
import { DateField } from "@/presentation/components/date-field";
import { InstrumentIdentity } from "@/presentation/components/instrument-identity";
import { formatDateLabel } from "@/presentation/utils/format-date";
import { palette as p } from "@/presentation/theme";

const euro = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export function DcaRevisionComparisonScreen({ operation, securities, revisionA, revisionB, date, assumptions, error, loading, onSelectA, onSelectB, onSwap, onDateChange, onAssumptionChange, onCompare }: {
  operation: Operation;
  securities: Security[];
  revisionA: number;
  revisionB: number;
  date: string;
  assumptions: Record<string, string>;
  error: string;
  loading: boolean;
  onSelectA: (revision: number) => void;
  onSelectB: (revision: number) => void;
  onSwap: () => void;
  onDateChange: (value: string) => void;
  onAssumptionChange: (isin: string, value: string) => void;
  onCompare: () => void;
}) {
  const revisions = [...(operation.configurationHistory ?? [])].sort((a, b) => a.revisionNumber - b.revisionNumber);
  const supports = (operation.configurationHistory ?? []).flatMap((revision) => revision.allocations)
    .filter((allocation, index, all) => allocation.instrumentKind === "uc" && allocation.isin && all.findIndex((line) => line.instrumentKind === "uc" && line.isin === allocation.isin) === index);

  return <>
    <PageHeading eyebrow="Simulation DCA" title="Comparer deux révisions" subtitle="Comparez deux répartitions de votre plan à la même date future. L’historique déjà enregistré reste commun aux deux scénarios." />

    <Card style={styles.explanation}>
      <Text style={styles.explanationTitle}>Ce que vous allez comparer</Text>
      <Text style={styles.body}>Le service de calcul conserve les échéances passées, puis applique chaque révision à partir de la prochaine échéance non exécutée. La simulation ne change pas votre plan.</Text>
    </Card>

    <Text style={styles.sectionTitle}>Choisissez les deux révisions</Text>
    <View nativeID="alto-revision-choices">{revisions.map((revision) => <Card key={revision.revisionNumber} style={styles.revisionCard}>
      <View style={styles.revisionHeader}><View style={styles.revisionIdentity}><Text style={styles.revisionTitle}>Révision {revision.revisionNumber}</Text><Text style={styles.meta}>Enregistrée le {formatDateLabel(revision.recordedAt)}</Text></View><Text style={styles.amount}>{euro(revision.monthlyAmount)} / mois</Text></View>
      <View style={styles.allocationList}>{revision.allocations.map((allocation) => {
        const security = securities.find((item) => item.isin === allocation.isin);
        return <View key={allocation.id} style={styles.allocation}><InstrumentIdentity name={security?.shortName ?? allocation.name} symbol={allocation.symbol ?? security?.symbol} isin={allocation.instrumentKind === "uc" ? allocation.isin : null} fallback="Fonds euro" titleStyle={styles.allocationTitle} /><Text style={styles.amount}>{euro(allocation.amount)}</Text></View>;
      })}</View>
      <View style={styles.chooseRow}>
        <SelectButton label="Scénario A" selected={revisionA === revision.revisionNumber} disabled={revisionB === revision.revisionNumber} onPress={() => onSelectA(revision.revisionNumber)} />
        <SelectButton label="Scénario B" selected={revisionB === revision.revisionNumber} disabled={revisionA === revision.revisionNumber} onPress={() => onSelectB(revision.revisionNumber)} />
      </View>
    </Card>)}</View>
    <Pressable onPress={onSwap} accessibilityRole="button" style={styles.swap}>
      <Text style={styles.swapText}>Inverser A et B</Text>
    </Pressable>

    <View nativeID="alto-revision-projection-settings">
    <Card style={styles.target}>
      <Text style={styles.sectionTitle}>Date de valorisation commune</Text>
      <Text style={styles.body}>Choisissez une seule date future pour les deux scénarios.</Text>
      <DateField label="Date cible" value={date} onChange={onDateChange} helper="Le service vérifiera qu’elle permet de projeter les échéances du plan." />
    </Card>

    {supports.length > 0 ? <Card style={styles.assumptions}>
      <Text style={styles.sectionTitle}>Hypothèses de rendement</Text>
      <Text style={styles.body}>Saisissez un taux annuel pour chaque UC enregistrée sur le plan, y compris celles issues des échéances passées. Un même ISIN utilise le même taux dans A et B. Le fonds euro suit le taux du service de calcul.</Text>
      <View nativeID="alto-revision-assumptions">
      {supports.map((support) => {
        const security = securities.find((item) => item.isin === support.isin);
        const title = support.symbol ?? security?.symbol ?? support.name ?? security?.shortName ?? support.isin;
        const name = support.name ?? security?.shortName;
        const label = `${title}${name && name !== title ? ` · ${name}` : ""} · ISIN ${support.isin}`;
        return <TextField key={support.isin} label={label} value={assumptions[support.isin] ?? ""} onChangeText={(value) => onAssumptionChange(support.isin, value)} keyboardType="decimal-pad" suffix="% / an" placeholder="Ex. 6" />;
      })}
      </View>
    </Card> : null}
    </View>

    <Card style={styles.note}><Text style={styles.noteTitle}>À garder en tête</Text><Text style={styles.body}>Une projection illustre une hypothèse, ce n’est pas une prévision. Les résultats sont fournis par le service de calcul et peuvent différer des données du courtier.</Text></Card>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <ActionButton label="Comparer à cette date →" onPress={onCompare} loading={loading} disabled={revisionA === revisionB || !revisionA || !revisionB} />
  </>;
}

function SelectButton({ label, selected, disabled, onPress }: { label: string; selected: boolean; disabled: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={[styles.selectButton, selected && styles.selectSelected, disabled && styles.selectDisabled]}><Text style={[styles.selectText, selected && styles.selectTextSelected]}>{selected ? `✓ ${label}` : label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  explanation: { gap: 6, backgroundColor: p.softGreen, marginBottom: 18 },
  explanationTitle: { color: p.forestLight, fontSize: 14, fontWeight: "700" },
  body: { color: p.muted, fontSize: 12, lineHeight: 18 },
  sectionTitle: { color: p.ink, fontSize: 14, fontWeight: "700", marginBottom: 18 },
  revisionCard: { gap: 12, marginBottom: 10 },
  revisionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  revisionIdentity: { flex: 1, gap: 3 },
  revisionTitle: { color: p.ink, fontSize: 14, fontWeight: "700" },
  meta: { color: p.muted, fontSize: 11, lineHeight: 16 },
  amount: { color: p.ink, fontSize: 12, fontWeight: "700" },
  allocationList: { gap: 9, borderTopWidth: 1, borderColor: p.line, paddingTop: 11 },
  allocation: { flexDirection: "row", alignItems: "center", gap: 10 },
  allocationTitle: { color: p.ink, fontSize: 12 },
  chooseRow: { flexDirection: "row", gap: 9 },
  swap: { alignSelf: "flex-end", paddingVertical: 8, paddingHorizontal: 5 },
  swapText: { color: p.forestLight, fontSize: 12, fontWeight: "700" },
  selectButton: { flex: 1, minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: p.line, backgroundColor: p.surfaceSubtle, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  selectSelected: { borderColor: p.forestLight, backgroundColor: p.softGreen },
  selectDisabled: { opacity: 0.4 },
  selectText: { color: p.muted, fontSize: 12, fontWeight: "700" },
  selectTextSelected: { color: p.forestLight },
  target: { gap: 12, marginTop: 10, marginBottom: 12 },
  assumptions: { gap: 12, marginBottom: 12 },
  note: { gap: 6, backgroundColor: p.surfaceSubtle, marginBottom: 12 },
  noteTitle: { color: p.ink, fontSize: 13, fontWeight: "700" },
  error: { color: p.red, fontSize: 13, lineHeight: 18, marginVertical: 8 },
});
