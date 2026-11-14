import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  ActionButton,
  Card,
  PageHeading,
  Pill,
  TextField,
} from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";

const euro = (amount: number) =>
  `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function SimulationScreen({
  onCreate,
}: {
  onCreate: (kind: "versement" | "dca") => void;
}) {
  const [kind, setKind] = useState<"versement" | "dca">("versement");
  const [amount, setAmount] = useState("500");
  const [years, setYears] = useState(5);
  const projection = useMemo(() => {
    const monthlyRate = 0.05 / 12;
    const months = years * 12;
    const monthly = Number(amount.replace(",", ".")) || 0;
    const invested = kind === "dca" ? monthly * months : monthly;
    const value =
      kind === "dca"
        ? monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate)
        : monthly * (1 + monthlyRate) ** months;
    return { invested, value, gain: value - invested };
  }, [amount, kind, years]);

  return (
    <>
      <PageHeading
        eyebrow="Se projeter"
        title="Simuler"
        subtitle="Comparez l’effet d’un versement ponctuel et d’un investissement régulier dans le temps."
      />
      <View style={styles.types}>
        <Pill
          label="Une fois"
          active={kind === "versement"}
          onPress={() => setKind("versement")}
        />
        <Pill
          label="Tous les mois"
          active={kind === "dca"}
          onPress={() => setKind("dca")}
        />
      </View>
      <Card style={styles.inputs}>
        <TextField
          label={kind === "dca" ? "Montant mensuel" : "Montant investi"}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          suffix={kind === "dca" ? "€ / mois" : "€"}
        />
        <View style={styles.durationHead}>
          <Text style={styles.durationLabel}>Durée de placement</Text>
          <Text style={styles.durationValue}>{years} ans</Text>
        </View>
        <View style={styles.durationControl}>
          <Pill label="−" onPress={() => setYears(Math.max(1, years - 1))} />
          <View style={styles.durationTrack}>
            <View
              style={[styles.durationFill, { width: `${(years / 20) * 100}%` }]}
            />
          </View>
          <Pill label="＋" onPress={() => setYears(Math.min(20, years + 1))} />
        </View>
        <View style={styles.durationScale}>
          <Text style={styles.scaleText}>1 an</Text>
          <Text style={styles.scaleText}>20 ans</Text>
        </View>
      </Card>
      <Card style={styles.result}>
        <Text style={styles.resultCaption}>
          Valeur estimée au bout de {years} ans
        </Text>
        <Text style={styles.resultValue}>{euro(projection.value)}</Text>
        <Text style={styles.resultGain}>
          +{euro(projection.gain)} de gain estimé
        </Text>
        <View style={styles.comparison}>
          <Metric label="Total investi" value={euro(projection.invested)} />
          <View style={styles.metricDivider} />
          <Metric label="Rendement simulé" value="5 % / an" />
        </View>
      </Card>
      <Text style={styles.note}>
        Hypothèse constante de 5 % par an, intérêts composés mensuellement.
        Cette projection illustrative ne prédit pas la performance réelle d’un
        placement.
      </Text>
      <ActionButton
        label={
          kind === "dca" ? "Créer ce plan DCA  →" : "Préparer ce versement  →"
        }
        tone="light"
        onPress={() => onCreate(kind)}
      />
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
  types: { flexDirection: "row", gap: 8, marginBottom: 13 },
  inputs: { gap: 20, marginBottom: 14 },
  durationHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  durationLabel: { color: p.ink, fontSize: 13, fontWeight: "600" },
  durationValue: { color: p.forest, fontSize: 16, fontWeight: "700" },
  durationControl: { flexDirection: "row", alignItems: "center", gap: 12 },
  durationTrack: {
    height: 6,
    backgroundColor: p.line,
    borderRadius: 5,
    flex: 1,
    overflow: "hidden",
  },
  durationFill: {
    height: "100%",
    backgroundColor: p.forestLight,
    borderRadius: 5,
  },
  durationScale: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -15,
  },
  scaleText: { color: p.muted, fontSize: 10 },
  result: { backgroundColor: p.forest, borderColor: p.forest, gap: 7 },
  resultCaption: { color: "#C8D7CF", fontSize: 12 },
  resultValue: {
    color: p.paper,
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.7,
    marginTop: 4,
  },
  resultGain: { color: p.mint, fontSize: 13, fontWeight: "700" },
  comparison: {
    borderTopWidth: 1,
    borderColor: "#3B5B4F",
    paddingTop: 16,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  metricLabel: { color: "#C8D7CF", fontSize: 11 },
  metricValue: { color: p.paper, fontSize: 14, fontWeight: "700" },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#3B5B4F",
    marginHorizontal: 14,
  },
  note: { color: p.muted, fontSize: 11, lineHeight: 17, marginVertical: 14 },
});
