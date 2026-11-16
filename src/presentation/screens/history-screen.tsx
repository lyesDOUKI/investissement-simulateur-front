import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Operation, Security } from "@/domain/models/operation";
import { ActionButton, Card, PageHeading, SectionTitle, text } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";
import { InstrumentIdentity } from "@/presentation/components/instrument-identity";

const euro = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export function HistoryScreen({ operations, securities, onValue, onCompare, compareEnabled, onVersement, onDca }: {
  operations: Operation[];
  securities: Security[];
  onValue: (operation: Operation) => void;
  onCompare: (operation: Operation) => void;
  compareEnabled: boolean;
  onVersement: () => void;
  onDca: () => void;
}) {
  return <>
    <PageHeading eyebrow="Votre journal" title="Opérations suivies" subtitle="Retrouvez les versements saisis et vos plans à versements réguliers (DCA)." />
    <Card style={styles.addCard}>
      <Text style={styles.addTitle}>Ajouter une opération</Text>
      <Text style={styles.addSubtitle}>Jean saisit ses opérations ici. Aucun ordre n’est transmis.</Text>
      <View style={styles.addActions}>
        <ActionButton label="＋ Versement réalisé" tone="light" onPress={onVersement} />
        <ActionButton label="＋ Plan d’investissement" tone="light" onPress={onDca} />
      </View>
    </Card>
    <SectionTitle title="Votre historique" action={<Text style={styles.count}>{operations.length} opération{operations.length === 1 ? "" : "s"}</Text>} />
    {operations.length === 0
      ? <Card><Text style={text.label}>Votre historique apparaîtra après votre première saisie.</Text></Card>
      : operations.map((operation) => <Card key={operation.id} style={styles.operation}>
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
        <View style={styles.allocations}>
          {operation.allocations.map((line) => <View key={line.id} style={styles.allocation}>
            <Text style={styles.dot}>●</Text>
            <InstrumentIdentity name={securities.find((security) => security.isin === line.isin)?.shortName ?? line.name} symbol={line.symbol ?? securities.find((security) => security.isin === line.isin)?.symbol} isin={line.isin} fallback="Fonds euro" titleStyle={styles.allocationName} />
            <Text style={styles.allocationAmount}>{euro(line.amount)}</Text>
          </View>)}
        </View>
        <View style={styles.actions}>
          <Pressable onPress={() => onValue(operation)} style={styles.actionButton}>
            <Text style={styles.actionText}>Voir la valeur à une date →</Text>
          </Pressable>
          {compareEnabled ? <Pressable onPress={() => onCompare(operation)} style={[styles.actionButton, styles.actionButtonSecondary]}>
            <Text style={styles.actionText}>Comparer un scénario</Text>
          </Pressable> : null}
        </View>
      </Card>)}
    <Text style={styles.disclaimer}>Les données de cet environnement de démonstration sont conservées en mémoire pendant la session.</Text>
  </>;
}

const styles = StyleSheet.create({
  addCard: { gap: 8, backgroundColor: p.forest, borderColor: p.forest, marginBottom: 20 },
  addTitle: { color: p.onForest, fontSize: 17, fontWeight: "700" },
  addSubtitle: { color: p.onForest, fontSize: 12, lineHeight: 17 },
  addActions: { gap: 9, marginTop: 7 },
  count: { color: p.muted, fontSize: 12 },
  operation: { gap: 13, marginBottom: 11 },
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
  actions: { flexDirection: "row", gap: 8, borderTopWidth: 1, borderColor: p.line, paddingTop: 12 },
  actionButton: { flex: 1, backgroundColor: p.softGreen, borderRadius: 14, minHeight: 43, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  actionButtonSecondary: { flex: 0, minWidth: 95, backgroundColor: p.canvas },
  actionText: { color: p.forestLight, fontSize: 12, fontWeight: "700" },
  disclaimer: { color: p.muted, fontSize: 11, lineHeight: 16, marginTop: 8 },
});
