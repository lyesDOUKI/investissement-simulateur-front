import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  AllocationLine,
  CreateOperationInput,
  DcaFrequency,
  Operation,
  OperationKind,
  Portfolio,
  Security,
} from "@/domain/models/operation";
import { estimateOperationValueAtDate } from "@/domain/rules/estimate-operation-value";
import { dependencies } from "@/infrastructure/dependencies";
import { DashboardScreen } from "@/presentation/screens/dashboard-screen";
import { HistoryScreen } from "@/presentation/screens/history-screen";
import { InvestScreen } from "@/presentation/screens/invest-screen";
import { InvestmentFormScreen } from "@/presentation/screens/investment-form-screen";
import { SimulationScreen } from "@/presentation/screens/simulation-screen";
import { ValuationScreen } from "@/presentation/screens/valuation-screen";
import { palette as p } from "@/presentation/theme";

type MainPage = "dashboard" | "invest" | "simulation" | "history";
type Page = MainPage | "form" | "valuation";
type FormKind = "versement" | "dca";
const today = () => new Date().toLocaleDateString("fr-FR");
const parseAmount = (value: string) => Number(value.replace(",", ".")) || 0;

export default function HomeScreen() {
  const [page, setPage] = useState<Page>("dashboard");
  const [returnPage, setReturnPage] = useState<MainPage>("invest");
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [securities, setSecurities] = useState<Security[]>([]);
  const [formKind, setFormKind] = useState<FormKind>("versement");
  const [total, setTotal] = useState("500");
  const [lines, setLines] = useState<AllocationLine[]>([]);
  const [date, setDate] = useState(today());
  const [frequency, setFrequency] = useState<DcaFrequency>("Mensuel");
  const [executionDay, setExecutionDay] = useState(6);
  const [selectedOperation, setSelectedOperation] = useState<Operation | null>(
    null,
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    const [nextPortfolio, nextSecurities] = await Promise.all([
      dependencies.getPortfolio.execute(),
      dependencies.getSecurities.execute(),
    ]);
    setPortfolio(nextPortfolio);
    setSecurities(nextSecurities);
  };

  useEffect(() => {
    Promise.all([
      dependencies.getPortfolio.execute(),
      dependencies.getSecurities.execute(),
    ]).then(([nextPortfolio, nextSecurities]) => {
      setPortfolio(nextPortfolio);
      setSecurities(nextSecurities);
    });
  }, []);

  const startForm = (kind: FormKind, from: MainPage) => {
    setFormKind(kind);
    setReturnPage(from);
    setTotal(kind === "dca" ? "300" : "500");
    setLines([
      {
        id: `line-${Date.now()}`,
        isin: "IE00B4L5Y983",
        amount: kind === "dca" ? 300 : 500,
      },
    ]);
    setDate(today());
    setFrequency("Mensuel");
    setExecutionDay(6);
    setError("");
    setNotice("");
    setPage("form");
  };

  const startValuation = (operation: Operation, from: MainPage) => {
    setSelectedOperation(operation);
    setReturnPage(from);
    setDate(today());
    setError("");
    setPage("valuation");
  };

  const changeTotal = (value: string) => {
    setTotal(value);
    const nextTotal = parseAmount(value);
    setLines((current) => {
      if (!current.length) return current;
      const assigned = current
        .slice(0, -1)
        .reduce((sum, line) => sum + line.amount, 0);
      const next = [...current];
      next[next.length - 1] = {
        ...next[next.length - 1],
        amount: Math.max(0, Math.round((nextTotal - assigned) * 100) / 100),
      };
      return next;
    });
  };

  const changeLineAmount = (id: string, value: string) => {
    const amount = parseAmount(value);
    const next = lines.map((line) =>
      line.id === id ? { ...line, amount } : line,
    );
    setLines(next);
    setTotal(
      String(
        Math.round(next.reduce((sum, line) => sum + line.amount, 0) * 100) /
          100,
      ),
    );
  };

  const submitOperation = async (kind: OperationKind) => {
    const amount =
      kind === "valorisation"
        ? (selectedOperation?.amount ?? 0)
        : parseAmount(total);
    const input: CreateOperationInput =
      kind === "valorisation"
        ? {
            kind,
            amount,
            date,
            allocations: selectedOperation?.allocations ?? [],
            sourceOperationId: selectedOperation?.id,
            valueAtDate: selectedOperation
              ? estimateOperationValueAtDate(selectedOperation, date)
              : amount,
          }
        : {
            kind,
            amount,
            date,
            allocations: lines,
            ...(kind === "dca" ? { frequency, executionDay } : {}),
          };
    try {
      const created = await dependencies.createOperation.execute(input);
      await refresh();
      setNotice(
        kind === "valorisation"
          ? `Valorisation enregistrée · ${created.date}`
          : kind === "dca"
            ? "Votre plan DCA est prêt."
            : "Votre versement est enregistré.",
      );
      setPage("dashboard");
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Vérifiez les informations saisies.",
      );
    }
  };

  const goTo = (destination: MainPage) => {
    setPage(destination);
    setNotice("");
  };

  const canShowTabs = page !== "form" && page !== "valuation";
  const pageLabel: Record<MainPage, string> = {
    dashboard: "Aperçu",
    invest: "Investir",
    simulation: "Simuler",
    history: "Activité",
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" />
      {page !== "dashboard" &&
      page !== "invest" &&
      page !== "simulation" &&
      page !== "history" ? (
        <View style={styles.contextBar}>
          <Pressable
            onPress={() => setPage(returnPage)}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>‹</Text>
            <Text style={styles.backLabel}>Retour</Text>
          </Pressable>
          <Text style={styles.contextBrand}>
            ALTO<Text style={{ color: p.forestLight }}>.</Text>
          </Text>
          <View style={{ width: 64 }} />
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          ["form", "valuation", "invest", "simulation"].includes(page) &&
            styles.contentNarrow,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {portfolio ? (
          <>
            {page === "dashboard" ? (
              <DashboardScreen
                portfolio={portfolio}
                securities={securities}
                onInvest={() => goTo("invest")}
                onHistory={() => goTo("history")}
                onValue={(operation) => startValuation(operation, "dashboard")}
              />
            ) : null}
            {page === "invest" ? (
              <InvestScreen
                onVersement={() => startForm("versement", "invest")}
                onDca={() => startForm("dca", "invest")}
              />
            ) : null}
            {page === "simulation" ? (
              <SimulationScreen
                onCreate={(kind) => startForm(kind, "simulation")}
              />
            ) : null}
            {page === "history" ? (
              <HistoryScreen
                operations={portfolio.operations}
                securities={securities}
                onValue={(operation) => startValuation(operation, "history")}
              />
            ) : null}
            {page === "form" ? (
              <InvestmentFormScreen
                kind={formKind}
                total={total}
                lines={lines}
                securities={securities}
                date={date}
                frequency={frequency}
                executionDay={executionDay}
                error={error}
                onTotalChange={changeTotal}
                onLineChange={(id, isin) =>
                  setLines((current) =>
                    current.map((line) =>
                      line.id === id ? { ...line, isin } : line,
                    ),
                  )
                }
                onLineAmountChange={changeLineAmount}
                onAddLine={() =>
                  setLines((current) =>
                    current.length < 8
                      ? [
                          ...current,
                          { id: `line-${Date.now()}`, isin: "", amount: 0 },
                        ]
                      : current,
                  )
                }
                onRemoveLine={(id) => {
                  const next = lines.filter((line) => line.id !== id);
                  setLines(next);
                  setTotal(
                    String(next.reduce((sum, line) => sum + line.amount, 0)),
                  );
                }}
                onDateChange={setDate}
                onFrequencyChange={(value) => {
                  setFrequency(value);
                  setExecutionDay(value === "Hebdomadaire" ? 1 : 6);
                }}
                onExecutionDayChange={setExecutionDay}
                onSubmit={() => void submitOperation(formKind)}
              />
            ) : null}
            {page === "valuation" && selectedOperation ? (
              <ValuationScreen
                operation={selectedOperation}
                securities={securities}
                date={date}
                error={error}
                onDateChange={setDate}
                onSave={() => void submitOperation("valorisation")}
              />
            ) : null}
            {page === "dashboard" && notice ? (
              <View style={styles.notice}>
                <Text style={styles.noticeMark}>✓</Text>
                <Text style={styles.noticeText}>{notice}</Text>
                <Pressable onPress={() => setNotice("")}>
                  <Text style={styles.noticeClose}>×</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.loading}>
            <Text style={styles.contextBrand}>
              ALTO<Text style={{ color: p.forestLight }}>.</Text>
            </Text>
            <Text style={styles.loadingText}>
              Préparation de votre portefeuille…
            </Text>
          </View>
        )}
      </ScrollView>

      {canShowTabs ? (
        <View style={styles.tabBar}>
          {(["dashboard", "invest", "simulation", "history"] as MainPage[]).map(
            (destination) => {
              const selected = page === destination;
              const icon: Record<MainPage, string> = {
                dashboard: "◫",
                invest: "+",
                simulation: "⌁",
                history: "≡",
              };
              return (
                <Pressable
                  key={destination}
                  onPress={() => goTo(destination)}
                  style={styles.tab}
                >
                  <View
                    style={[
                      styles.tabIconWrap,
                      selected && styles.tabIconSelected,
                    ]}
                  >
                    <Text
                      style={[styles.tabIcon, selected && styles.tabIconActive]}
                    >
                      {icon[destination]}
                    </Text>
                  </View>
                  <Text
                    style={[styles.tabLabel, selected && styles.tabLabelActive]}
                  >
                    {pageLabel[destination]}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: p.canvas },
  scroll: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  contentNarrow: { maxWidth: 700 },
  contextBar: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    height: 52,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: p.line,
  },
  backButton: {
    minWidth: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  backIcon: { color: p.forest, fontSize: 29, lineHeight: 31 },
  backLabel: { color: p.forest, fontSize: 12, fontWeight: "700" },
  contextBrand: {
    color: p.ink,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
  },
  loading: {
    flex: 1,
    minHeight: 400,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: p.muted, fontSize: 13 },
  notice: {
    marginTop: 16,
    padding: 13,
    borderRadius: 14,
    backgroundColor: p.softGreen,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noticeMark: { color: p.forest, fontWeight: "800" },
  noticeText: { color: p.forest, fontSize: 12, fontWeight: "600", flex: 1 },
  noticeClose: { color: p.forest, fontSize: 18, paddingHorizontal: 4 },
  tabBar: {
    minHeight: 68,
    borderTopWidth: 1,
    borderTopColor: p.line,
    backgroundColor: p.paper,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minHeight: 60,
  },
  tabIconWrap: {
    width: 40,
    height: 29,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconSelected: { backgroundColor: p.softGreen },
  tabIcon: { color: p.muted, fontSize: 19, fontWeight: "700" },
  tabIconActive: { color: p.forest },
  tabLabel: { color: p.muted, fontSize: 10, fontWeight: "600" },
  tabLabelActive: { color: p.forest, fontWeight: "800" },
});
