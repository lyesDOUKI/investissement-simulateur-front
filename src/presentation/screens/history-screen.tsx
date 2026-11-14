import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Operation, Security } from "@/domain/models/operation";
import {
  Card,
  Divider,
  PageHeading,
  text,
} from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";

const euro = (amount: number) =>
  `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function HistoryScreen({
  operations,
  securities,
  onValue,
}: {
  operations: Operation[];
  securities: Security[];
  onValue: (operation: Operation) => void;
}) {
  const total = operations.filter(
    (item) => item.kind !== "valorisation",
  ).length;
  return (
    <>
      <PageHeading
        eyebrow="Votre activité"
        title="Opérations"
        subtitle="Retrouvez vos versements, plans programmés et valorisations."
      />
      <View style={styles.summary}>
        <Metric label="Opérations" value={String(total)} />
        <View style={styles.summaryDivider} />
        <Metric
          label="À valoriser"
          value={String(
            operations.filter((item) => item.kind !== "valorisation").length,
          )}
        />
      </View>
      <Text style={styles.groupTitle}>RÉCENTES</Text>
      {operations.length === 0 ? (
        <Card>
          <Text style={text.label}>
            Votre historique apparaîtra après votre première opération.
          </Text>
        </Card>
      ) : (
        operations.map((operation, index) => (
          <Card key={operation.id} style={styles.item}>
            <View style={styles.itemHead}>
              <View
                style={[
                  styles.icon,
                  operation.kind === "dca"
                    ? styles.iconDca
                    : operation.kind === "valorisation"
                      ? styles.iconValue
                      : styles.iconBuy,
                ]}
              >
                <Text style={styles.iconText}>
                  {operation.kind === "dca"
                    ? "↻"
                    : operation.kind === "valorisation"
                      ? "◷"
                      : "↑"}
                </Text>
              </View>
              <View style={styles.itemTitle}>
                <Text style={styles.title}>{operation.label}</Text>
                <Text style={styles.date}>
                  {formatDateLabel(operation.date)}
                </Text>
              </View>
              <Text style={styles.amount}>
                {euro(operation.valueAtDate ?? operation.amount)}
              </Text>
            </View>
            <Text style={styles.detail}>{operation.detail}</Text>
            {operation.allocations.map((line) => {
              const security = securities.find(
                (item) => item.isin === line.isin,
              );
              return (
                <View key={line.id} style={styles.allocation}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: security?.color ?? p.muted },
                    ]}
                  />
                  <Text style={styles.allocationName}>
                    {security?.shortName ?? line.isin}
                  </Text>
                  <Text style={styles.allocationAmount}>
                    {euro(line.amount)}
                  </Text>
                </View>
              );
            })}
            {operation.kind !== "valorisation" ? (
              <Pressable
                onPress={() => onValue(operation)}
                style={styles.valueLink}
              >
                <Text style={styles.valueLinkText}>Valoriser à une date →</Text>
              </Pressable>
            ) : operation.valueAtDate ? (
              <Text style={styles.savedValue}>
                Valeur estimée · {euro(operation.valueAtDate)}
              </Text>
            ) : null}
            {index < operations.length - 1 ? <Divider /> : null}
          </Card>
        ))
      )}
      <Text style={styles.disclaimer}>
        Données de démonstration enregistrées en mémoire. Elles seront
        réinitialisées au prochain rechargement.
      </Text>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, gap: 5 }}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: p.softGreen,
    borderRadius: 18,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#CFDDCA",
    marginHorizontal: 18,
  },
  metricLabel: { color: p.muted, fontSize: 11 },
  metricValue: { color: p.forest, fontSize: 19, fontWeight: "700" },
  groupTitle: {
    color: p.muted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  item: { marginBottom: 10, gap: 13 },
  itemHead: { flexDirection: "row", alignItems: "center", gap: 11 },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDca: { backgroundColor: "#EDF1FB" },
  iconValue: { backgroundColor: "#F8EFE5" },
  iconBuy: { backgroundColor: p.softGreen },
  iconText: { color: p.forest, fontSize: 17, fontWeight: "700" },
  itemTitle: { flex: 1, gap: 4 },
  title: { color: p.ink, fontSize: 14, fontWeight: "700" },
  date: { color: p.muted, fontSize: 11 },
  amount: { color: p.ink, fontSize: 14, fontWeight: "700" },
  detail: { color: p.muted, fontSize: 12 },
  allocation: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  allocationName: { color: p.ink, fontSize: 12, flex: 1 },
  allocationAmount: { color: p.ink, fontSize: 12, fontWeight: "600" },
  valueLink: {
    borderTopWidth: 1,
    borderColor: p.line,
    paddingTop: 12,
    marginTop: 1,
  },
  valueLinkText: { color: p.forestLight, fontSize: 12, fontWeight: "700" },
  savedValue: { color: p.forestLight, fontSize: 12, fontWeight: "700" },
  disclaimer: { color: p.muted, fontSize: 11, lineHeight: 16, marginTop: 13 },
});
