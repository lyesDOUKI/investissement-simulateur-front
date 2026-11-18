import { Pressable, StyleSheet, Text, View } from "react-native";
import type { DcaConfigurationRevision, Operation, Security } from "@/domain/models/operation";
import { Card, PageHeading, SectionTitle } from "@/presentation/components/investment-ui";
import { InstrumentIdentity } from "@/presentation/components/instrument-identity";
import { formatDateLabel } from "@/presentation/utils/format-date";
import { palette as p } from "@/presentation/theme";

const euro = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export function DcaPlanDetailsScreen({ operation, securities, confirmation, comparisonEnabled, onEdit, onCompareRevisions }: {
  operation: Operation;
  securities: Security[];
  confirmation: DcaConfigurationRevision | null;
  comparisonEnabled: boolean;
  onEdit: () => void;
  onCompareRevisions: () => void;
}) {
  const revisions = [...(operation.configurationHistory ?? [])].sort((a, b) => b.revisionNumber - a.revisionNumber);
  return <>
    <PageHeading eyebrow="Plan à versements réguliers" title="Configuration du plan" subtitle="Consultez les paramètres actuels et les changements qui ont pris effet au fil des échéances." />
    {confirmation ? <Card style={styles.confirmation}>
      <Text style={styles.confirmationTitle}>Nouvelle configuration enregistrée</Text>
      <Text style={styles.confirmationText}>Révision {confirmation.revisionNumber} · applicable à partir de l’échéance n°{confirmation.effectiveFromInstallmentNumber} · enregistrée le {formatDateLabel(confirmation.recordedAt)}</Text>
    </Card> : null}
    <Card style={styles.currentCard}>
      <View style={styles.currentHeader}><View style={styles.currentText}><Text style={styles.eyebrow}>Configuration actuelle</Text><Text style={styles.amount}>{euro(operation.amount)}<Text style={styles.perMonth}> / mois</Text></Text></View>
        <Pressable onPress={onEdit} accessibilityRole="button" style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}><Text style={styles.editText}>Modifier</Text></Pressable>
      </View>
      <Text style={styles.meta}>{operation.detail}</Text>
      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>Répartition mensuelle</Text>
      <AllocationRows allocations={operation.allocations} securities={securities} />
    </Card>

    <SectionTitle title="Historique des révisions" action={<Text style={styles.count}>{revisions.length} version{revisions.length === 1 ? "" : "s"}</Text>} />
    {revisions.length === 0 ? <Card><Text style={styles.meta}>L’historique des versions n’est pas fourni pour ce plan.</Text></Card> : revisions.map((revision) => <Card key={revision.revisionNumber} style={styles.revisionCard}>
      <View style={styles.revisionHeader}><View style={styles.revisionIdentity}><Text style={styles.revisionTitle}>Révision {revision.revisionNumber}</Text><Text style={styles.meta}>Enregistrée le {formatDateLabel(revision.recordedAt)}</Text></View><Text style={styles.revisionAmount}>{euro(revision.monthlyAmount)} / mois</Text></View>
      <View style={styles.effective}><Text style={styles.effectiveLabel}>À partir de l’échéance</Text><Text style={styles.effectiveValue}>n° {revision.effectiveFromInstallmentNumber}</Text></View>
      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>Répartition de cette version</Text>
      <AllocationRows allocations={revision.allocations} securities={securities} />
    </Card>)}
    {comparisonEnabled && revisions.length > 1 ? <Pressable onPress={onCompareRevisions} accessibilityRole="button" style={({ pressed }) => [styles.compareButton, pressed && styles.pressed]}>
      <View style={styles.compareCopy}><Text style={styles.compareTitle}>Comparer deux révisions</Text><Text style={styles.meta}>Simuler deux configurations à une même date future</Text></View><Text style={styles.compareArrow}>›</Text>
    </Pressable> : null}
    <Card style={styles.note}><Text style={styles.noteTitle}>Comment lire cet historique</Text><Text style={styles.noteText}>Une révision ne modifie pas les échéances déjà enregistrées. Les échéances suivantes utilisent les paramètres valables à leur numéro d’échéance ; la valorisation applique ces versions côté service de calcul.</Text></Card>
  </>;
}

function AllocationRows({ allocations, securities }: { allocations: Operation["allocations"]; securities: Security[] }) {
  return <View style={styles.allocations}>{allocations.map((line) => <View key={line.id} style={styles.allocationRow}>
    <View style={styles.allocationIdentity}><InstrumentIdentity name={securities.find((security) => security.isin === line.isin)?.shortName ?? line.name} symbol={line.symbol ?? securities.find((security) => security.isin === line.isin)?.symbol} isin={line.instrumentKind === "uc" ? line.isin : null} fallback="Fonds euro" titleStyle={styles.allocationTitle} /></View>
    <Text style={styles.allocationAmount}>{euro(line.amount)}</Text>
  </View>)}</View>;
}

const styles = StyleSheet.create({
  confirmation: { backgroundColor: p.softGreen, borderColor: p.forest, gap: 6, marginBottom: 12 },
  confirmationTitle: { color: p.forestLight, fontSize: 14, fontWeight: "700" },
  confirmationText: { color: p.ink, fontSize: 12, lineHeight: 18 },
  currentCard: { gap: 13, marginBottom: 10 },
  currentHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  currentText: { gap: 5 },
  eyebrow: { color: p.forestLight, fontSize: 10, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  amount: { color: p.ink, fontSize: 25, fontWeight: "800" },
  perMonth: { color: p.muted, fontSize: 13, fontWeight: "600" },
  editButton: { minHeight: 42, paddingHorizontal: 15, borderRadius: 13, backgroundColor: p.softGreen, alignItems: "center", justifyContent: "center" },
  editText: { color: p.forestLight, fontSize: 12, fontWeight: "700" },
  pressed: { opacity: 0.75 },
  meta: { color: p.muted, fontSize: 12, lineHeight: 17 },
  divider: { height: 1, backgroundColor: p.line },
  sectionLabel: { color: p.ink, fontSize: 12, fontWeight: "700" },
  allocations: { gap: 11 },
  allocationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  allocationIdentity: { flex: 1 },
  allocationTitle: { color: p.ink, fontSize: 12, fontWeight: "600" },
  allocationAmount: { color: p.ink, fontSize: 13, fontWeight: "700" },
  count: { color: p.muted, fontSize: 12 },
  revisionCard: { gap: 12, marginBottom: 10 },
  revisionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  revisionIdentity: { flex: 1, gap: 4 },
  revisionTitle: { color: p.ink, fontSize: 15, fontWeight: "700" },
  revisionAmount: { color: p.ink, fontSize: 12, fontWeight: "700", textAlign: "right" },
  effective: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 11, backgroundColor: p.surfaceSubtle, paddingVertical: 10, paddingHorizontal: 12 },
  effectiveLabel: { color: p.muted, fontSize: 12 },
  effectiveValue: { color: p.forestLight, fontSize: 13, fontWeight: "800" },
  note: { gap: 6, backgroundColor: p.surfaceSubtle, marginTop: 6 },
  compareButton: { minHeight: 68, paddingHorizontal: 16, paddingVertical: 12, marginTop: 8, marginBottom: 12, borderRadius: 16, backgroundColor: p.forest, flexDirection: "row", alignItems: "center", gap: 12 },
  compareCopy: { flex: 1, gap: 4 },
  compareTitle: { color: p.onForest, fontSize: 14, fontWeight: "700" },
  compareArrow: { color: p.mint, fontSize: 25, fontWeight: "600" },
  noteTitle: { color: p.ink, fontSize: 13, fontWeight: "700" },
  noteText: { color: p.muted, fontSize: 12, lineHeight: 18 },
});
