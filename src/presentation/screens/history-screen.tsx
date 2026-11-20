import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { Operation, Security } from "@/domain/models/operation";
import { ActionButton, Card, PageHeading, SectionTitle, text } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";
import { InstrumentIdentity } from "@/presentation/components/instrument-identity";

const euro = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export function HistoryScreen({ operations, securities, onValue, onCompare, compareEnabled, onVersement, onDca, onDcaDetails }: {
  operations: Operation[];
  securities: Security[];
  onValue: (operation: Operation) => void;
  onCompare: (operation: Operation) => void;
  compareEnabled: boolean;
  onVersement: () => void;
  onDca: () => void;
  onDcaDetails: (operation: Operation) => void;
}) {
  const viewportWidth = useWindowDimensions().width;
  const wide = Platform.OS !== "web" && viewportWidth >= 760;
  return <>
    <PageHeading eyebrow="Votre journal" title="Opérations suivies" subtitle="Retrouvez les versements saisis et vos plans à versements réguliers (DCA)." />
    <Card nativeID="alto-history-add-panel" style={styles.addCard}>
      <Text nativeID="alto-history-add-title" style={styles.addTitle}>Ajouter une opération</Text>
      <Text nativeID="alto-history-add-subtitle" style={styles.addSubtitle}>Jean saisit ses opérations ici. Aucun ordre n’est transmis.</Text>
      <View nativeID="alto-history-add-actions" style={[styles.addActions, wide && styles.addActionsWide]}>
        <ActionButton label="＋ Versement réalisé" tone="light" onPress={onVersement} />
        <ActionButton label="＋ Plan d’investissement" tone="light" onPress={onDca} />
      </View>
    </Card>
    <SectionTitle title="Votre historique" action={<Text style={styles.count}>{operations.length} opération{operations.length === 1 ? "" : "s"}</Text>} />
    {operations.length === 0
      ? <Card><Text style={text.label}>Votre historique apparaîtra après votre première saisie.</Text></Card>
      : <View nativeID="alto-history-list">{operations.map((operation) => <Card key={operation.id} nativeID={`alto-history-entry-${operation.id}`} style={styles.operation}>
        <View nativeID={`alto-history-summary-${operation.id}`} style={styles.summary}>
        <View style={styles.operationHeader}>
          <View style={[styles.icon, operation.kind === "dca" ? styles.iconDca : styles.iconVersement]}>
            <Text style={styles.iconText}>{operation.kind === "dca" ? "↻" : "↑"}</Text>
          </View>
          <View style={styles.operationTitle}>
            <Text style={styles.title}>{operation.label}</Text>
            <Text style={styles.meta}>{formatDateLabel(operation.date)} · {operation.kind === "dca" ? euro(operation.amount) + " / mois" : euro(operation.amount)}</Text>
          </View>
          <Text style={styles.kindTag}>{operation.kind === "dca" ? "PLAN" : "VERSEMENT"}</Text>
        </View>
        <Text style={styles.meta}>{operation.detail}</Text>
        </View>
        <View nativeID={`alto-history-allocations-${operation.id}`} style={styles.allocations}>
          {operation.allocations.map((line) => <View key={line.id} style={styles.allocation}>
            <Text style={styles.dot}>●</Text>
            <InstrumentIdentity name={securities.find((security) => security.isin === line.isin)?.shortName ?? line.name} symbol={line.symbol ?? securities.find((security) => security.isin === line.isin)?.symbol} isin={line.isin} fallback="Fonds euro" titleStyle={styles.allocationName} />
            <Text style={styles.allocationAmount}>{euro(line.amount)}</Text>
          </View>)}
        </View>
        <View nativeID={`alto-history-actions-${operation.id}`} style={styles.actionPanel}>
        {operation.kind === "dca" ? <Pressable onPress={() => onDcaDetails(operation)} accessibilityRole="button" style={styles.managePlan}>
          <Text style={styles.managePlanText}>Gérer le plan · voir les révisions</Text><Text style={styles.manageChevron}>›</Text>
        </Pressable> : null}
        <View nativeID={`alto-history-cta-row-${operation.id}`} style={styles.actions}>
          <Pressable onPress={() => onValue(operation)} accessibilityRole="button" accessibilityLabel={`Valoriser ${operation.label} à une autre date`} style={({ pressed }) => [styles.actionButton, styles.actionButtonPrimary, pressed && styles.actionPressed]}>
            <Text style={styles.actionTitlePrimary}>Valoriser</Text>
            <Text style={styles.actionHintPrimary}>Voir à une autre date</Text>
          </Pressable>
          {compareEnabled ? <Pressable onPress={() => onCompare(operation)} accessibilityRole="button" accessibilityLabel={`Comparer ${operation.label} avec une autre hypothèse`} style={({ pressed }) => [styles.actionButton, styles.actionButtonSecondary, pressed && styles.actionPressed]}>
            <Text style={styles.actionTitleSecondary}>Comparer</Text>
            <Text style={styles.actionHintSecondary}>Tester une hypothèse</Text>
          </Pressable> : null}
        </View>
        </View>
      </Card>)}</View>}
    <Text style={styles.disclaimer}>Les données de cet environnement de démonstration sont conservées en mémoire pendant la session.</Text>
  </>;
}

const styles = StyleSheet.create({
  addCard: { gap: 8, backgroundColor: p.forest, borderColor: p.forest, marginBottom: 20 },
  addTitle: { color: p.onForest, fontSize: 17, fontWeight: "700" },
  addSubtitle: { color: p.onForest, fontSize: 12, lineHeight: 17 },
  addActions: { gap: 9, marginTop: 7 },
  addActionsWide: { flexDirection: "row" },
  count: { color: p.muted, fontSize: 12 },
  operation: { gap: 13, marginBottom: 11 },
  summary: { gap: 13 },
  actionPanel: { gap: 13 },
  operationHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  operationTitle: { flex: 1, gap: 4 },
  icon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  iconDca: { backgroundColor: p.surfaceBlue },
  iconVersement: { backgroundColor: p.softGreen },
  iconText: { color: p.forestLight, fontSize: 18, fontWeight: "700" },
  title: { color: p.ink, fontSize: 14, fontWeight: "700" },
  meta: { color: p.muted, fontSize: 12, lineHeight: 17 },
  kindTag: { color: p.forestLight, fontSize: 9, fontWeight: "800", letterSpacing: 0.6 },
  allocations: { gap: 8 },
  allocation: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { color: p.forestLight, fontSize: 8 },
  allocationName: { flex: 1, color: p.ink, fontSize: 12 },
  allocationAmount: { color: p.ink, fontSize: 12, fontWeight: "600" },
  managePlan: { minHeight: 46, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: p.surfaceSubtle, borderRadius: 12 },
  managePlanText: { color: p.forestLight, fontSize: 12, fontWeight: "700" },
  manageChevron: { color: p.forestLight, fontSize: 22 },
  actions: { flexDirection: "row", gap: 9, borderTopWidth: 1, borderColor: p.line, paddingTop: 12 },
  actionButton: { flex: 1, minWidth: 0, minHeight: 64, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 6, paddingVertical: 9, gap: 3 },
  actionButtonPrimary: { backgroundColor: p.forest },
  actionButtonSecondary: { backgroundColor: p.surfaceSubtle, borderWidth: 1, borderColor: p.line },
  actionTitlePrimary: { color: p.onForest, fontSize: 13, fontWeight: "700" },
  actionTitleSecondary: { color: p.forestLight, fontSize: 13, fontWeight: "700" },
  actionHintPrimary: { color: p.onForest, opacity: 0.82, fontSize: 10, textAlign: "center" },
  actionHintSecondary: { color: p.muted, fontSize: 10, textAlign: "center" },
  actionPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disclaimer: { color: p.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },
});
