import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import type { Operation, Portfolio, Security } from "@/domain/models/operation";
import {
  ActionButton,
  Card,
  Divider,
  PageHeading,
  SectionTitle,
  text,
} from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";

const euro = (amount: number) =>
  `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function DashboardScreen({
  portfolio,
  securities,
  onInvest,
  onHistory,
  onValue,
}: {
  portfolio: Portfolio;
  securities: Security[];
  onInvest: () => void;
  onHistory: () => void;
  onValue: (operation: Operation) => void;
}) {
  const isWide = useWindowDimensions().width >= 960;
  const gainRate =
    portfolio.invested > 0 ? (portfolio.gain / portfolio.invested) * 100 : 0;
  const contributed = portfolio.valuations.reduce(
    (sum, valuation) => sum + (portfolio.operations.find((item) => item.id === valuation.operationId)?.kind === "versement" ? valuation.invested : 0),
    0,
  );
  const allocations = new Map<string, number>();
  portfolio.valuations.forEach((valuation) => valuation.allocations.forEach((line) =>
    allocations.set(line.isin, (allocations.get(line.isin) ?? 0) + line.value)));
  const holdings = [...allocations.entries()].sort((a, b) => b[1] - a[1]);
  const plans = portfolio.operations.filter((item) => item.kind === "dca");
  const latestActivity = portfolio.operations[0];
  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const cycleLabel = (plan: Operation) =>
    `Chaque mois · prélèvement le ${plan.executionDay ?? 1} · décalage ${plan.delayBusinessDays ?? 0} jours ouvrés`;

  return (
    <>
      <View style={styles.brandbar}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>A</Text>
        </View>
        <Text style={styles.brand}>
          ALTO<Text style={styles.brandDot}>.</Text>
        </Text>
        <View style={styles.brandRight}>
          <Text style={styles.marketStatus}>● Simulation</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
        </View>
      </View>

      <PageHeading
        eyebrow={todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}
        title="Votre patrimoine"
        subtitle="Une vue claire de vos investissements, au même endroit."
      />

      <View style={[styles.dashboardGrid, isWide && styles.dashboardGridWide]}>
        <View style={styles.primaryColumn}>
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>Valeur du portefeuille</Text>
              <Text style={styles.period}>À date⌄</Text>
            </View>
            <Text style={styles.heroValue}>{euro(portfolio.value)}</Text>
            <View style={styles.heroGainRow}>
              <Text style={styles.heroGain}>
                ↗ {euro(portfolio.gain)} (
                {gainRate.toFixed(2).replace(".", ",")} %)
              </Text>
              <Text style={styles.heroFootnote}>depuis le début</Text>
            </View>
            <Text style={styles.heroFootnote}>Valorisation indicative au {todayLabel}</Text>
            <View style={styles.heroDivider} />
            <View style={styles.metrics}>
              <Metric label="Capital versé" value={euro(portfolio.invested)} />
              <View style={styles.metricDivider} />
              <Metric label="Versements ponctuels" value={euro(contributed)} />
            </View>
          </View>

          <View style={styles.actions}>
            <ActionButton
              label="＋  Nouvel investissement"
              onPress={onInvest}
            />
            <Pressable style={styles.historyButton} onPress={onHistory}>
              <Text style={styles.historyButtonText}>Activité ↗</Text>
            </Pressable>
          </View>

          <SectionTitle
            title="Répartition"
            action={<Text style={styles.sectionHint}>Par support</Text>}
          />
          <Card>
            {holdings.length === 0 ? (
              <Text style={text.label}>
                Vos allocations apparaîtront ici après votre premier versement.
              </Text>
            ) : (
              holdings.map(([isin, amount], index) => {
                const security = securities.find((item) => item.isin === isin);
                const percentage = portfolio.value
                  ? amount / portfolio.value
                  : 0;
                return (
                  <View
                    key={isin}
                    style={index > 0 ? styles.holdingSpaced : undefined}
                  >
                    {index > 0 ? <Divider /> : null}
                    <View style={styles.holdingRow}>
                      <View
                        style={[
                          styles.holdingDot,
                          { backgroundColor: security?.color ?? p.muted },
                        ]}
                      />
                      <View style={styles.holdingTitle}>
                        <Text style={styles.holdingName}>
                          {security?.shortName ?? isin}
                        </Text>
                        <Text style={styles.holdingIsin}>{isin}</Text>
                      </View>
                      <View style={styles.holdingValue}>
                        <Text style={styles.holdingAmount}>{euro(amount)}</Text>
                        <Text style={styles.holdingPercent}>
                          {(percentage * 100).toFixed(1).replace(".", ",")} %
                        </Text>
                      </View>
                    </View>
                    <View style={styles.track}>
                      <View
                        style={[
                          styles.trackFill,
                          {
                            width: `${Math.max(percentage * 100, 3)}%`,
                            backgroundColor: security?.color ?? p.forestLight,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </Card>
        </View>
        <View
          style={[styles.secondaryColumn, isWide && styles.secondaryColumnWide]}
        >
          <SectionTitle
            title="Plans suivis"
            action={
              <Text style={styles.sectionHint}>
                {plans.length} plan{plans.length > 1 ? "s" : ""}
              </Text>
            }
          />
          {plans.length ? (
            plans.map((plan) => (
              <Card key={plan.id} style={styles.planCard}>
                <View style={styles.planIcon}>
                  <Text style={styles.planIconText}>↻</Text>
                </View>
                <View style={styles.planMain}>
                  <View style={styles.planHeading}>
                    <Text style={styles.planTitle}>
                      Plan mensuel
                    </Text>
                    <Text style={styles.planActive}>SUIVI</Text>
                  </View>
                  <Text style={styles.planAmount}>
                    {euro(plan.amount)}{" "}
                    <Text style={styles.planUnit}>
                      /{" "}
                      mois
                    </Text>
                  </Text>
                  <Text style={styles.planMeta}>
                    {cycleLabel(plan)} · démarré le {formatDateLabel(plan.date)}
                  </Text>
                  <Text style={styles.planMeta}>
                    {plan.allocations.length} supports répartis
                  </Text>
                </View>
              </Card>
            ))
          ) : (
            <Card>
              <Text style={text.label}>
                Aucun plan DCA enregistré pour le moment.
              </Text>
              <Pressable onPress={onInvest}>
                <Text style={styles.link}>Enregistrer mon premier plan →</Text>
              </Pressable>
            </Card>
          )}

          <SectionTitle
            title="Dernière activité"
            action={
              <Pressable onPress={onHistory}>
                <Text style={styles.link}>Tout voir →</Text>
              </Pressable>
            }
          />
          {latestActivity ? (
            <Pressable
              onPress={() =>
                onValue(latestActivity)
              }
            >
              <Card style={styles.activityCard}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityIconText}>
                    {latestActivity.kind === "dca" ? "↻" : "↑"}
                  </Text>
                </View>
                <View style={styles.activityMain}>
                  <Text style={styles.activityTitle}>
                    {latestActivity.label}
                  </Text>
                  <Text style={styles.planMeta}>{latestActivity.detail}</Text>
                  <Text style={styles.planMeta}>
                    {formatDateLabel(latestActivity.date)}
                  </Text>
                </View>
                <Text style={styles.activityAmount}>
                  {euro(latestActivity.amount)}
                </Text>
              </Card>
            </Pressable>
          ) : null}
          <Text style={styles.disclaimer}>
            Valeurs et cours historiques de démonstration. Cette application
            suit et simule vos opérations sans transmettre d’ordre au courtier.
          </Text>
        </View>
      </View>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandbar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
    gap: 9,
  },
  dashboardGrid: { gap: 4 },
  dashboardGridWide: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 22,
  },
  primaryColumn: { flex: 1, minWidth: 0 },
  secondaryColumn: { flex: 1, minWidth: 0 },
  secondaryColumnWide: { flex: 0.78, maxWidth: 400, paddingTop: 4 },
  brandMark: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: p.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: { color: p.mint, fontSize: 17, fontWeight: "800" },
  brand: { color: p.ink, fontSize: 15, letterSpacing: 2, fontWeight: "800" },
  brandDot: { color: p.forestLight },
  brandRight: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  marketStatus: { color: p.forestLight, fontSize: 11, fontWeight: "600" },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: p.softGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: p.forest, fontSize: 11, fontWeight: "700" },
  hero: {
    backgroundColor: p.forest,
    borderRadius: 26,
    padding: 22,
    overflow: "hidden",
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroLabel: { color: "#B6C9BF", fontSize: 11, fontWeight: "600" },
  period: {
    color: p.paper,
    borderColor: "#46695C",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 11,
    fontSize: 11,
  },
  heroValue: {
    color: p.paper,
    fontSize: 38,
    fontWeight: "700",
    letterSpacing: -1.1,
    marginTop: 15,
  },
  heroGainRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 6,
  },
  heroGain: { color: p.mint, fontSize: 13, fontWeight: "700" },
  heroFootnote: { color: "#B6C9BF", fontSize: 12 },
  chart: {
    height: 106,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    position: "relative",
  },
  chartNote: {
    position: "absolute",
    top: -17,
    left: 0,
    color: "#B6C9BF",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  chartGrid: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "48%",
    borderTopWidth: 1,
    borderColor: "#3C5D51",
  },
  chartBar: {
    flex: 1,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: p.mintDark,
    minHeight: 12,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  heroDivider: { height: 1, backgroundColor: "#3C5D51", marginVertical: 18 },
  metrics: { flexDirection: "row", alignItems: "center" },
  metric: { flex: 1, gap: 6 },
  metricLabel: { color: "#B6C9BF", fontSize: 11 },
  metricValue: { color: p.paper, fontSize: 15, fontWeight: "700" },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#3C5D51",
    marginHorizontal: 16,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 14 },
  historyButton: {
    minHeight: 51,
    borderRadius: 30,
    paddingHorizontal: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: p.softGreen,
  },
  historyButtonText: { color: p.forest, fontSize: 13, fontWeight: "700" },
  sectionHint: { color: p.muted, fontSize: 12 },
  holdingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 13,
  },
  holdingSpaced: { marginTop: 2 },
  holdingDot: { width: 9, height: 9, borderRadius: 5 },
  holdingTitle: { flex: 1, gap: 3 },
  holdingName: { color: p.ink, fontSize: 14, fontWeight: "700" },
  holdingIsin: { color: p.muted, fontSize: 11 },
  holdingValue: { alignItems: "flex-end", gap: 3 },
  holdingAmount: { color: p.ink, fontSize: 14, fontWeight: "700" },
  holdingPercent: { color: p.muted, fontSize: 11 },
  track: {
    height: 4,
    borderRadius: 4,
    backgroundColor: p.canvas,
    overflow: "hidden",
    marginBottom: 13,
    marginLeft: 20,
  },
  trackFill: { height: "100%", borderRadius: 4 },
  planCard: { flexDirection: "row", gap: 14 },
  planIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: p.softGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  planIconText: { color: p.forest, fontSize: 20, fontWeight: "600" },
  planMain: { flex: 1, gap: 7 },
  planHeading: { flexDirection: "row", alignItems: "center", gap: 9 },
  planTitle: { color: p.ink, fontSize: 14, fontWeight: "700" },
  planActive: {
    color: p.forestLight,
    backgroundColor: p.softGreen,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 9,
  },
  planAmount: { color: p.ink, fontSize: 23, fontWeight: "700" },
  planUnit: { color: p.muted, fontSize: 13, fontWeight: "400" },
  planMeta: { color: p.muted, fontSize: 12, lineHeight: 17 },
  link: { color: p.forestLight, fontSize: 12, fontWeight: "700" },
  activityCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: p.softGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  activityIconText: { color: p.forest, fontSize: 17, fontWeight: "700" },
  activityMain: { flex: 1, gap: 3 },
  activityTitle: { color: p.ink, fontSize: 13, fontWeight: "700" },
  activityAmount: { color: p.ink, fontSize: 14, fontWeight: "700" },
  disclaimer: {
    color: p.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 18,
    marginBottom: 6,
  },
});
