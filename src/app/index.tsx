import { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type {
  CreateOperationInput,
  OperationKind,
  Portfolio,
} from "@/domain/models/operation";
import { dependencies } from "@/infrastructure/dependencies";

type Tab = "Accueil" | "Simuler" | "Profil";
type Page = "tab" | "form" | "history" | "result";
const C = {
  bg: "#0B0E12",
  card: "#141922",
  line: "#252E3B",
  text: "#F4F6FA",
  muted: "#8D98A8",
  lime: "#B5F263",
  green: "#A5E74E",
  blue: "#5E8BF7",
  coral: "#FF8B80",
};
const euro = (n: number) =>
  `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export default function HomeScreen() {
  const [tab, setTab] = useState<Tab>("Accueil");
  const [page, setPage] = useState<Page>("tab");
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [flow, setFlow] = useState<OperationKind>("versement");
  const [amount, setAmount] = useState("500");
  const [date, setDate] = useState("14/11/2026");
  const [day, setDay] = useState("6");
  const [error, setError] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [selectedOperation, setSelectedOperation] = useState("DCA mensuel");
  const [frequency, setFrequency] = useState("Mensuel");

  const refresh = async () =>
    setPortfolio(await dependencies.getPortfolio.execute());
  useEffect(() => {
    dependencies.getPortfolio.execute().then(setPortfolio);
  }, []);
  const invested = portfolio?.invested ?? 3_000;
  const currentValue = portfolio?.value ?? 3_119.4;
  const operations = portfolio?.operations ?? [];

  const startFlow = (kind: OperationKind) => {
    setFlow(kind);
    setPage("form");
    setError("");
    setAmount(kind === "dca" ? "300" : "500");
  };
  const simulate = (target: string, kind: OperationKind) => {
    setSelectedOperation(target);
    setFlow(kind);
    setPage("result");
  };
  const save = async () => {
    try {
      const input: CreateOperationInput = {
        kind: flow,
        amount: Number(amount.replace(",", ".")),
        date,
        detail:
          flow === "dca"
            ? `MSCI World · Nasdaq-100 · ${frequency}`
            : flow === "valorisation"
              ? `Valorisé : ${selectedOperation}`
              : "MSCI World",
      };
      const result = await dependencies.createOperation.execute(input);
      setLastSaved(`${result.label} enregistré dans cette session`);
      setPage("tab");
      setTab("Profil");
      setError("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    }
  };
  const heading =
    page === "form"
      ? flow === "dca"
        ? "Nouveau DCA"
        : flow === "versement"
          ? "Nouveau versement"
          : "Valoriser une opération"
      : page === "history"
        ? "Opérations de la session"
        : page === "result"
          ? "Simulation"
          : "";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      {page !== "tab" && (
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => setPage("tab")} style={s.back}>
            <Text style={s.backText}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{heading}</Text>
            {page === "result" && (
              <Text style={s.sub}>{selectedOperation} · au 14 nov. 2026</Text>
            )}
          </View>
        </View>
      )}
      <ScrollView
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {page === "tab" && tab === "Accueil" && (
          <>
            <View style={s.greeting}>
              <View>
                <Text style={s.muted}>Bonjour</Text>
                <Text style={s.name}>Jean</Text>
              </View>
              <View style={s.avatar}>
                <Text style={s.avatarText}>J</Text>
              </View>
            </View>
            <Text style={s.muted}>Total versé</Text>
            <Text style={s.balance}>{euro(invested)}</Text>
            <View style={s.pill}>
              <Text style={s.pillText}>
                10 échéances depuis le 5 févr. 2026
              </Text>
            </View>
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Mes DCA</Text>
              <TouchableOpacity
                style={s.outlineButton}
                onPress={() => startFlow("dca")}
              >
                <Text style={s.buttonText}>＋ Nouveau</Text>
              </TouchableOpacity>
            </View>
            <View style={s.card}>
              <View style={s.row}>
                <Text style={s.cardTitle}>DCA mensuel</Text>
                <Text style={s.active}>● Actif</Text>
              </View>
              <Text style={s.amountBig}>
                300 € <Text style={s.muted}>par mois</Text>
              </Text>
              <Text style={s.muted}>
                Le {day} du mois · exécution à +3 jours ouvrés
              </Text>
              <View style={s.allocation}>
                <View
                  style={[s.segment, { flex: 1, backgroundColor: C.lime }]}
                />
                <View
                  style={[s.segment, { flex: 1, backgroundColor: C.blue }]}
                />
              </View>
              <View style={s.row}>
                <Text style={s.body}>● MSCI World</Text>
                <Text style={s.body}>150 € · 50 %</Text>
              </View>
              <View style={s.row}>
                <Text style={s.body}>● Nasdaq-100</Text>
                <Text style={s.body}>150 € · 50 %</Text>
              </View>
              <View style={s.divider} />
              <View style={s.row}>
                <Text style={s.muted}>Prochaine échéance</Text>
                <Text style={s.muted}>Exécution estimée</Text>
              </View>
              <View style={s.row}>
                <Text style={s.bodyStrong}>6 déc. 2026</Text>
                <Text style={s.bodyStrong}>9 déc. 2026</Text>
              </View>
              <Button
                label="Simuler ce DCA  →"
                onPress={() => simulate("DCA mensuel", "dca")}
              />
            </View>
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Actions rapides</Text>
            </View>
            <View style={s.grid}>
              <Quick
                label="＋  Versement unique"
                onPress={() => startFlow("versement")}
              />
              <Quick
                label="◷  Valoriser"
                onPress={() => startFlow("valorisation")}
              />
            </View>
            <TouchableOpacity
              onPress={() => setPage("history")}
              style={s.historyLink}
            >
              <Text style={s.limeText}>
                Voir les opérations de la session →
              </Text>
            </TouchableOpacity>
          </>
        )}
        {page === "tab" && tab === "Simuler" && (
          <>
            <Text style={s.title}>Simuler</Text>
            <Text style={s.muted}>Choisissez une opération à projeter</Text>
            <View style={s.card}>
              <Text style={s.cardTitle}>Votre portefeuille</Text>
              <Text style={s.balance}>{euro(currentValue)}</Text>
              <Text style={s.gain}>
                +{euro(currentValue - invested)} · +3,98 %
              </Text>
              <View style={s.chart}>
                <View style={s.chartLine} />
                <Text style={s.chartHint}>
                  févr.　 mars　 avr.　 mai　 juin　 juil.　 août
                </Text>
              </View>
            </View>
            <Text style={s.sectionTitle}>Nouvelle simulation</Text>
            <Quick
              label="Versement unique"
              onPress={() => simulate("Versement unique", "versement")}
            />
            <Quick
              label="Plan DCA mensuel"
              onPress={() => simulate("Plan DCA mensuel", "dca")}
            />
            <Text style={s.sectionTitle}>Valoriser à une date</Text>
            {operations.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={s.rowCard}
                onPress={() => {
                  setSelectedOperation(o.label);
                  startFlow("valorisation");
                }}
              >
                <View>
                  <Text style={s.cardTitle}>{o.label}</Text>
                  <Text style={s.muted}>
                    {o.date} · {euro(o.amount)}
                  </Text>
                </View>
                <Text style={s.limeText}>Valoriser ›</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
        {page === "tab" && tab === "Profil" && (
          <>
            <Text style={s.title}>Profil</Text>
            <View style={s.profile}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>J</Text>
              </View>
              <View>
                <Text style={s.cardTitle}>Jean Dupont</Text>
                <Text style={s.muted}>Compte de démonstration</Text>
              </View>
            </View>
            <View style={s.card}>
              <Text style={s.muted}>Valeur du portefeuille</Text>
              <Text style={s.amountBig}>{euro(currentValue)}</Text>
              <View style={s.divider} />
              <Text style={s.rowText}>
                Versements cumulés{" "}
                <Text style={s.bodyStrong}>{euro(invested)}</Text>
              </Text>
              <Text style={s.rowText}>
                Gain estimé{" "}
                <Text style={s.gain}>+{euro(currentValue - invested)}</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={s.rowCard}
              onPress={() => setPage("history")}
            >
              <View>
                <Text style={s.cardTitle}>Opérations de la session</Text>
                <Text style={s.muted}>
                  {operations.length} opérations enregistrées
                </Text>
              </View>
              <Text style={s.limeText}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.rowCard}
              onPress={() => startFlow("versement")}
            >
              <Text style={s.cardTitle}>＋ Nouveau versement</Text>
              <Text style={s.limeText}>›</Text>
            </TouchableOpacity>
            {lastSaved ? <Text style={s.success}>✓ {lastSaved}</Text> : null}
          </>
        )}
        {page === "form" && (
          <>
            <Text style={s.fieldLabel}>
              {flow === "dca" ? "Montant mensuel" : "Montant du versement"}
            </Text>
            <Field
              value={amount}
              onChangeText={setAmount}
              suffix="€"
              large
              keyboardType="decimal-pad"
            />
            {flow === "dca" ? (
              <>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Mise en place</Text>
                    <Field value={date} onChangeText={setDate} suffix="▦" />
                  </View>
                  <View style={{ width: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Jour de versement</Text>
                    <Field
                      value={day}
                      onChangeText={setDay}
                      prefix="Le"
                      suffix="du mois"
                    />
                  </View>
                </View>
                <Text style={s.fieldLabel}>Fréquence</Text>
                <View style={s.chips}>
                  {["Mensuel", "Hebdomadaire", "Trimestriel"].map((x) => (
                    <Chip
                      key={x}
                      label={x}
                      selected={frequency === x}
                      onPress={() => setFrequency(x)}
                    />
                  ))}
                </View>
                <Text style={s.fieldLabel}>Répartition</Text>
                <View style={s.rowCard}>
                  <Text style={s.body}>🟢 MSCI World</Text>
                  <Text style={s.bodyStrong}>50 %</Text>
                </View>
                <View style={s.rowCard}>
                  <Text style={s.body}>🔵 Nasdaq-100</Text>
                  <Text style={s.bodyStrong}>50 %</Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setError(
                      "La répartition 50 / 50 est utilisée pour cette démo.",
                    )
                  }
                >
                  <Text style={s.limeText}>＋ Ajouter une ligne</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.fieldLabel}>
                  {flow === "valorisation"
                    ? "Date de valorisation"
                    : "Date du versement"}
                </Text>
                <Field value={date} onChangeText={setDate} suffix="▦" />
                {flow === "valorisation" && (
                  <>
                    <Text style={s.fieldLabel}>Opération à valoriser</Text>
                    {operations.map((o) => (
                      <TouchableOpacity
                        key={o.id}
                        style={[
                          s.rowCard,
                          selectedOperation === o.label && s.selected,
                        ]}
                        onPress={() => setSelectedOperation(o.label)}
                      >
                        <Text style={s.body}>
                          {o.label} · {euro(o.amount)}
                        </Text>
                        <Text style={s.limeText}>
                          {selectedOperation === o.label ? "✓" : "○"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
                {flow === "versement" && (
                  <>
                    <Text style={s.fieldLabel}>Support d’investissement</Text>
                    <View style={s.chips}>
                      <Chip label="MSCI World" selected onPress={() => {}} />
                      <Chip
                        label="Nasdaq-100"
                        selected={false}
                        onPress={() => {}}
                      />
                    </View>
                  </>
                )}
              </>
            )}
            {error ? <Text style={s.error}>{error}</Text> : null}
            {flow === "dca" && (
              <View style={s.note}>
                <Text style={s.muted}>Première échéance · 6 déc. 2026</Text>
                <Text style={s.muted}>Exécutée le · 9 déc. 2026</Text>
                <Text style={s.noteSmall}>
                  Vos opérations seront conservées pendant cette session.
                </Text>
              </View>
            )}
            <Button
              label={
                flow === "dca"
                  ? "Enregistrer le DCA"
                  : flow === "versement"
                    ? "Enregistrer le versement"
                    : "Calculer la valorisation"
              }
              onPress={() => void save()}
            />
          </>
        )}
        {page === "history" && (
          <>
            <Text style={s.sub}>
              Les opérations ajoutées ici sont fictives et restent disponibles
              pendant la session.
            </Text>
            <View style={s.stats}>
              <Stat label="Versé" value={euro(invested)} />
              <Stat label="Investi" value={euro(invested)} />
              <Stat label="En attente" value="0,00 €" />
            </View>
            <Text style={s.sectionTitle}>{operations.length} opérations</Text>
            {operations.map((o, i) => (
              <View key={o.id} style={s.operation}>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>{o.label}</Text>
                    <Text style={s.muted}>{o.date}</Text>
                  </View>
                  <Text style={s.amount}>{euro(o.amount)}</Text>
                </View>
                <Text style={s.operationDetail}>{o.detail}</Text>
                {o.kind !== "valorisation" && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedOperation(o.label);
                      setAmount(String(o.amount));
                      setDate("14/11/2026");
                      setFlow("valorisation");
                      setPage("form");
                    }}
                  >
                    <Text style={s.limeText}>Valoriser à une date →</Text>
                  </TouchableOpacity>
                )}
                {i < operations.length - 1 && <View style={s.divider} />}
              </View>
            ))}
          </>
        )}
        {page === "result" && (
          <>
            <Text style={s.muted}>Valeur estimée au 14 novembre 2026</Text>
            <Text style={s.balance}>
              {euro(Number(amount.replace(",", ".")) * 1.11)}
            </Text>
            <Text style={s.gain}>
              +{euro(Number(amount.replace(",", ".")) * 0.11)} · +11,00 %
            </Text>
            <View style={s.card}>
              <Text style={s.cardTitle}>Évolution estimée</Text>
              <View style={s.chart}>
                <View style={s.chartLine} />
                <Text style={s.chartHint}>
                  févr.　 mars　 avr.　 mai　 juin　 juil.　 août
                </Text>
              </View>
            </View>
            <Text style={s.sectionTitle}>Paramètres de la simulation</Text>
            <View style={s.card}>
              <Text style={s.rowText}>
                Opération <Text style={s.bodyStrong}>{selectedOperation}</Text>
              </Text>
              <Text style={s.rowText}>
                Montant{" "}
                <Text style={s.bodyStrong}>
                  {euro(Number(amount.replace(",", ".")))}
                </Text>
              </Text>
              <Text style={s.rowText}>
                Date de valeur <Text style={s.bodyStrong}>{date}</Text>
              </Text>
              <Text style={s.rowText}>
                Rendement simulé <Text style={s.gain}>+11,00 %</Text>
              </Text>
            </View>
            <Text style={s.noteSmall}>
              Estimation basée sur un rendement fictif. Les performances passées
              ne préjugent pas des performances futures.
            </Text>
            <Button
              label="Enregistrer cette opération"
              onPress={() => void save()}
            />
          </>
        )}
      </ScrollView>
      {page === "tab" && (
        <View style={s.bottom}>
          {(["Accueil", "Simuler", "Profil"] as Tab[]).map((t, i) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={s.tab}>
              <Text style={[s.tabIcon, tab === t && s.limeText]}>
                {["⌂", "⌁", "♙"][i]}
              </Text>
              <Text style={[s.tabLabel, tab === t && s.limeText]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.primary}>
      <Text style={s.primaryText}>{label}</Text>
    </TouchableOpacity>
  );
}
function Quick({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.quick}>
      <Text style={s.body}>{label}</Text>
      <Text style={s.limeText}>›</Text>
    </TouchableOpacity>
  );
}
function Field({
  value,
  onChangeText,
  suffix,
  prefix,
  large,
  keyboardType,
}: {
  value: string;
  onChangeText: (v: string) => void;
  suffix?: string;
  prefix?: string;
  large?: boolean;
  keyboardType?: "decimal-pad" | "default";
}) {
  return (
    <View style={[s.field, large && s.fieldLarge]}>
      {prefix ? <Text style={s.muted}>{prefix} </Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? "default"}
        placeholderTextColor={C.muted}
        style={[s.input, large && s.inputLarge]}
      />
      {suffix ? <Text style={s.muted}>{suffix}</Text> : null}
    </View>
  );
}
function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.chip, selected && s.selected]}
    >
      <Text style={[s.chipText, selected && s.limeText]}>{label}</Text>
    </TouchableOpacity>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.muted}>{label}</Text>
      <Text style={s.bodyStrong}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
    maxWidth: 520,
    width: "100%",
    alignSelf: "center",
    gap: 12,
  },
  greeting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  name: { color: C.text, fontSize: 22, fontWeight: "700" },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 24,
    backgroundColor: C.card,
    borderColor: C.line,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: C.text, fontWeight: "600", fontSize: 16 },
  muted: { color: C.muted, fontSize: 13 },
  balance: {
    color: C.text,
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: -1,
    marginTop: 2,
  },
  pill: {
    backgroundColor: C.card,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  pillText: { color: "#C0C7D2", fontSize: 12 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 0,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 4,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  buttonText: { color: C.text, fontSize: 14 },
  card: {
    backgroundColor: C.card,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 23,
    padding: 20,
    gap: 8,
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardTitle: { color: C.text, fontSize: 15, fontWeight: "600" },
  active: {
    color: C.lime,
    backgroundColor: "#26321D",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 12,
  },
  amountBig: { color: C.text, fontSize: 30, fontWeight: "600", marginTop: 8 },
  mutedInline: { color: C.muted, fontSize: 14 },
  body: { color: "#D9DEE7", fontSize: 14 },
  bodyStrong: { color: C.text, fontSize: 15, fontWeight: "600" },
  allocation: { flexDirection: "row", gap: 4, marginTop: 10, marginBottom: 3 },
  segment: { height: 10, borderRadius: 8 },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 8 },
  primary: {
    backgroundColor: C.lime,
    borderRadius: 17,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  primaryText: { color: "#11150C", fontWeight: "700", fontSize: 16 },
  gain: { color: C.lime, fontSize: 14, fontWeight: "600" },
  limeText: { color: C.lime, fontSize: 14, fontWeight: "600" },
  grid: { flexDirection: "row", gap: 10 },
  quick: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 16,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  historyLink: { paddingVertical: 14, alignItems: "center" },
  bottom: {
    height: 72,
    borderTopWidth: 1,
    borderColor: C.line,
    backgroundColor: C.bg,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 5,
  },
  tab: { alignItems: "center", justifyContent: "center", gap: 3, width: "33%" },
  tabIcon: { color: C.muted, fontSize: 24, height: 27 },
  tabLabel: { color: C.muted, fontSize: 12 },
  topbar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
    borderBottomWidth: 0,
  },
  back: { width: 28 },
  backText: { fontSize: 34, color: C.text, lineHeight: 38 },
  title: { fontSize: 22, color: C.text, fontWeight: "700" },
  sub: { fontSize: 13, color: C.muted, marginTop: 2 },
  fieldLabel: { color: C.muted, fontSize: 13, marginTop: 12, marginBottom: 6 },
  field: {
    minHeight: 54,
    backgroundColor: C.card,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  fieldLarge: { borderColor: C.lime },
  input: {
    color: C.text,
    fontSize: 16,
    flex: 1,
    paddingVertical: 10,
    outlineStyle: "none" as never,
  },
  inputLarge: { fontSize: 21, fontWeight: "600" },
  chips: { flexDirection: "row", gap: 8, marginVertical: 5 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
  },
  selected: { borderColor: C.lime, backgroundColor: "#20291B" },
  chipText: { color: "#C7CED8", fontSize: 13 },
  rowCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    padding: 15,
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  note: {
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    backgroundColor: C.card,
    gap: 10,
    marginTop: 12,
  },
  noteSmall: { color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 5 },
  error: { color: C.coral, fontSize: 13, marginVertical: 8 },
  success: { color: C.lime, marginVertical: 10 },
  chart: {
    height: 160,
    backgroundColor: "#111720",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.line,
    marginTop: 14,
    justifyContent: "flex-end",
    padding: 16,
  },
  chartLine: {
    height: 80,
    borderBottomWidth: 2,
    borderColor: C.lime,
    borderRadius: 80,
    transform: [{ skewY: "-10deg" }],
    backgroundColor: "#263222",
  },
  chartHint: { color: C.muted, fontSize: 10, marginTop: 12 },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    marginTop: 12,
  },
  rowText: {
    color: C.muted,
    fontSize: 14,
    paddingVertical: 8,
    flexDirection: "row",
  },
  stats: {
    backgroundColor: C.card,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    borderRightWidth: 1,
    borderColor: C.line,
  },
  operation: {
    backgroundColor: C.card,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 15,
    marginTop: 8,
    gap: 8,
  },
  amount: { color: C.text, fontSize: 16, fontWeight: "600" },
  operationDetail: { color: C.muted, fontSize: 12 },
});
