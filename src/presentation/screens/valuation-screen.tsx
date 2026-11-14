import { StyleSheet, Text, View } from "react-native";
import type { Operation, Security } from "@/domain/models/operation";
import { estimateOperationValueAtDate } from "@/domain/rules/estimate-operation-value";
import {
  ActionButton,
  Card,
  PageHeading,
  TextField,
} from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";

const euro = (amount: number) =>
  `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function ValuationScreen({
  operation,
  securities,
  date,
  error,
  onDateChange,
  onSave,
}: {
  operation: Operation;
  securities: Security[];
  date: string;
  error: string;
  onDateChange: (value: string) => void;
  onSave: () => void;
}) {
  const estimated = estimateOperationValueAtDate(operation, date);
  return (
    <>
      <PageHeading
        eyebrow="Valeur indicative"
        title="Valoriser une opération"
        subtitle="Choisissez une date et estimez la valeur de votre versement ou de votre plan à cette échéance."
      />
      <Card style={styles.source}>
        <View style={styles.sourceHeader}>
          <View style={styles.sourceIcon}>
            <Text style={styles.sourceIconText}>
              {operation.kind === "dca" ? "↻" : "↑"}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.sourceTitle}>{operation.label}</Text>
            <Text style={styles.sourceMeta}>
              {formatDateLabel(operation.date)}
            </Text>
          </View>
        </View>
        <View style={styles.sourceAmountRow}>
          <Text style={styles.sourceMeta}>Montant de référence</Text>
          <Text style={styles.sourceAmount}>{euro(operation.amount)}</Text>
        </View>
        <View style={styles.allocations}>
          {operation.allocations.map((line) => {
            const security = securities.find((item) => item.isin === line.isin);
            return (
              <View key={line.id} style={styles.allocationRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: security?.color ?? p.muted },
                  ]}
                />
                <Text style={styles.allocationName}>
                  {security?.shortName ?? line.isin}
                </Text>
                <Text style={styles.allocationValue}>{euro(line.amount)}</Text>
              </View>
            );
          })}
        </View>
      </Card>
      <View style={styles.form}>
        <TextField
          label="Date de valorisation"
          value={date}
          onChangeText={onDateChange}
          placeholder="JJ/MM/AAAA"
          helper="Saisissez une date au format JJ/MM/AAAA."
        />
      </View>
      <Card style={styles.estimate}>
        <Text style={styles.estimateLabel}>Valeur estimée à cette date</Text>
        <Text style={styles.estimateValue}>{euro(estimated)}</Text>
        <View style={styles.gainPill}>
          <Text style={styles.gainText}>
            {estimated >= operation.amount ? "+" : "−"}
            {euro(Math.abs(estimated - operation.amount))} · estimation
          </Text>
        </View>
        <Text style={styles.disclaimer}>
          Projection fictive calculée pour cette démonstration. La valeur réelle
          peut varier et ne peut pas être déduite de cette estimation.
        </Text>
      </Card>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ActionButton
        label="Enregistrer cette valorisation  →"
        onPress={onSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  source: { gap: 17, marginBottom: 18 },
  sourceHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  sourceIcon: {
    height: 38,
    width: 38,
    borderRadius: 14,
    backgroundColor: p.softGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceIconText: { color: p.forest, fontSize: 18, fontWeight: "700" },
  sourceTitle: { color: p.ink, fontSize: 14, fontWeight: "700" },
  sourceMeta: { color: p.muted, fontSize: 12 },
  sourceAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sourceAmount: { color: p.ink, fontSize: 16, fontWeight: "700" },
  allocations: {
    gap: 9,
    borderTopWidth: 1,
    borderColor: p.line,
    paddingTop: 14,
  },
  allocationRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  allocationName: { color: p.muted, fontSize: 12, flex: 1 },
  allocationValue: { color: p.ink, fontSize: 12, fontWeight: "600" },
  form: { marginBottom: 15 },
  estimate: {
    backgroundColor: p.forest,
    borderColor: p.forest,
    gap: 9,
    marginBottom: 12,
  },
  estimateLabel: { color: "#C8D7CF", fontSize: 12 },
  estimateValue: {
    color: p.paper,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  gainPill: {
    alignSelf: "flex-start",
    backgroundColor: "#2C5848",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  gainText: { color: "#DDF2C2", fontSize: 12, fontWeight: "700" },
  disclaimer: { color: "#C8D7CF", fontSize: 11, lineHeight: 16, marginTop: 5 },
  error: { color: p.red, fontSize: 13, paddingVertical: 7 },
});
