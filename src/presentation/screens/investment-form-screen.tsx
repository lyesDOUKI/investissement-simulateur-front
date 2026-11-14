import { Pressable, StyleSheet, Text, View } from "react-native";
import type {
  AllocationLine,
  DcaFrequency,
  Security,
} from "@/domain/models/operation";
import { isValidIsin } from "@/domain/rules/is-valid-isin";
import {
  ActionButton,
  Card,
  Divider,
  PageHeading,
  Pill,
  TextField,
} from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";

const euro = (amount: number) =>
  `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const frequencies: DcaFrequency[] = ["Hebdomadaire", "Mensuel", "Trimestriel"];
const weekdays = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export function InvestmentFormScreen({
  kind,
  total,
  lines,
  securities,
  date,
  frequency,
  executionDay,
  error,
  onTotalChange,
  onLineChange,
  onLineAmountChange,
  onAddLine,
  onRemoveLine,
  onDateChange,
  onFrequencyChange,
  onExecutionDayChange,
  onSubmit,
}: {
  kind: "versement" | "dca";
  total: string;
  lines: AllocationLine[];
  securities: Security[];
  date: string;
  frequency: DcaFrequency;
  executionDay: number;
  error: string;
  onTotalChange: (value: string) => void;
  onLineChange: (id: string, isin: string) => void;
  onLineAmountChange: (id: string, value: string) => void;
  onAddLine: () => void;
  onRemoveLine: (id: string) => void;
  onDateChange: (value: string) => void;
  onFrequencyChange: (value: DcaFrequency) => void;
  onExecutionDayChange: (value: number) => void;
  onSubmit: () => void;
}) {
  const amount = Number(total.replace(",", ".")) || 0;
  const allocationTotal = lines.reduce(
    (sum, line) => sum + (Number(line.amount) || 0),
    0,
  );
  const difference = amount - allocationTotal;
  const isWeekly = frequency === "Hebdomadaire";
  const dayMaximum = isWeekly ? 7 : 28;

  return (
    <>
      <PageHeading
        eyebrow={
          kind === "dca"
            ? "Investissement programmé"
            : "Investissement ponctuel"
        }
        title={kind === "dca" ? "Créer un plan DCA" : "Nouveau versement"}
        subtitle={
          kind === "dca"
            ? "Définissez un rythme, puis répartissez chaque échéance entre vos supports."
            : "Choisissez le montant à investir et répartissez-le entre vos supports."
        }
      />

      <Card style={styles.amountCard}>
        <TextField
          label={
            kind === "dca"
              ? "Montant investi à chaque échéance"
              : "Montant du versement"
          }
          value={total}
          onChangeText={onTotalChange}
          placeholder="0"
          keyboardType="decimal-pad"
          suffix="€"
          helper="Montant total, frais éventuels exclus."
        />
      </Card>

      {kind === "dca" ? (
        <Card style={styles.schedule}>
          <Text style={styles.blockTitle}>Rythme du plan</Text>
          <Text style={styles.blockHint}>
            À quelle fréquence souhaitez-vous investir ?
          </Text>
          <View style={styles.pills}>
            {frequencies.map((item) => (
              <Pill
                key={item}
                label={item}
                active={item === frequency}
                onPress={() => onFrequencyChange(item)}
              />
            ))}
          </View>
          <Divider />
          <Text style={styles.fieldLabel}>Jour de prélèvement</Text>
          <View style={styles.dayPicker}>
            <Pressable
              onPress={() =>
                onExecutionDayChange(Math.max(1, executionDay - 1))
              }
              style={styles.stepper}
            >
              <Text style={styles.stepperText}>−</Text>
            </Pressable>
            <View style={styles.dayValue}>
              <Text style={styles.dayNumber}>
                {isWeekly ? weekdays[executionDay - 1] : executionDay}
              </Text>
              <Text style={styles.daySuffix}>
                {isWeekly ? "chaque semaine" : "de chaque mois"}
              </Text>
            </View>
            <Pressable
              onPress={() =>
                onExecutionDayChange(Math.min(dayMaximum, executionDay + 1))
              }
              style={styles.stepper}
            >
              <Text style={styles.stepperText}>＋</Text>
            </Pressable>
          </View>
          <Text style={styles.blockHint}>
            Le prélèvement peut apparaître sur votre compte quelques jours après
            cette date.
          </Text>
        </Card>
      ) : (
        <Card style={styles.schedule}>
          <TextField
            label="Date du versement"
            value={date}
            onChangeText={onDateChange}
            placeholder="JJ/MM/AAAA"
            helper="Format : JJ/MM/AAAA"
          />
        </Card>
      )}

      <View style={styles.allocationHeading}>
        <View style={{ flex: 1 }}>
          <Text style={styles.blockTitle}>Répartition de l’investissement</Text>
          <Text style={styles.blockHint}>
            Un support par ligne, identifié par son code ISIN.
          </Text>
        </View>
        <View style={styles.lineCount}>
          <Text style={styles.lineCountText}>{lines.length} / 8</Text>
        </View>
      </View>

      <View style={styles.lines}>
        {lines.map((line, index) => {
          const security = securities.find(
            (item) => item.isin === line.isin.toUpperCase(),
          );
          const lineAmount = Number(line.amount) || 0;
          const percentage = amount > 0 ? (lineAmount / amount) * 100 : 0;
          return (
            <Card key={line.id} style={styles.lineCard}>
              <View style={styles.lineTop}>
                <View style={styles.lineNumber}>
                  <Text style={styles.lineNumberText}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                </View>
                <Text style={styles.lineHeading}>Support d’investissement</Text>
                {lines.length > 1 ? (
                  <Pressable onPress={() => onRemoveLine(line.id)} hitSlop={10}>
                    <Text style={styles.remove}>Retirer</Text>
                  </Pressable>
                ) : null}
              </View>
              <TextField
                label="Code ISIN"
                value={line.isin}
                onChangeText={(value) =>
                  onLineChange(line.id, value.toUpperCase().replace(/\s/g, ""))
                }
                placeholder="Ex. IE00B4L5Y983"
                autoCapitalize="characters"
                helper={
                  security
                    ? security.name
                    : isValidIsin(line.isin)
                      ? "ISIN valide · référence inconnue dans la démo"
                      : line.isin.length >= 12
                        ? "Vérifiez la clé de contrôle de cet ISIN."
                        : "12 caractères, lettres et chiffres"
                }
              />
              <View style={styles.suggestions}>
                <Text style={styles.suggestionLabel}>Catalogue démo</Text>
                {securities.slice(0, 2).map((item) => (
                  <Pressable
                    key={item.isin}
                    onPress={() => onLineChange(line.id, item.isin)}
                    style={styles.suggestion}
                  >
                    <View
                      style={[
                        styles.suggestionDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <Text style={styles.suggestionText}>{item.shortName}</Text>
                  </Pressable>
                ))}
              </View>
              <TextField
                label="Montant affecté"
                value={String(line.amount || "")}
                onChangeText={(value) => onLineAmountChange(line.id, value)}
                placeholder="0"
                keyboardType="decimal-pad"
                suffix="€"
                helper={
                  amount > 0 && lineAmount > 0
                    ? `${percentage.toFixed(1).replace(".", ",")} % du montant total`
                    : undefined
                }
              />
            </Card>
          );
        })}
      </View>

      <Pressable
        onPress={onAddLine}
        disabled={lines.length >= 8}
        style={[styles.addLine, lines.length >= 8 && { opacity: 0.4 }]}
      >
        <Text style={styles.addIcon}>＋</Text>
        <Text style={styles.addText}>Ajouter un support</Text>
        <Text style={styles.addHint}>ISIN + montant</Text>
      </Pressable>

      <Card style={styles.summary}>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryLabel}>Montant à investir</Text>
          <Text style={styles.summaryValue}>{euro(amount)}</Text>
        </View>
        <View style={styles.summaryLine}>
          <Text style={styles.summaryLabel}>Total des lignes</Text>
          <Text style={styles.summaryValue}>{euro(allocationTotal)}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${amount > 0 ? Math.min(100, (allocationTotal / amount) * 100) : 0}%`,
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.balanceMessage,
            Math.abs(difference) < 0.01 ? styles.balanced : styles.unbalanced,
          ]}
        >
          {Math.abs(difference) < 0.01
            ? "✓  Votre allocation est équilibrée"
            : difference > 0
              ? `Reste à répartir : ${euro(difference)}`
              : `Dépassement : ${euro(Math.abs(difference))}`}
        </Text>
      </Card>

      {kind === "dca" ? (
        <TextField
          label="Première échéance"
          value={date}
          onChangeText={onDateChange}
          placeholder="JJ/MM/AAAA"
          helper="La première date à laquelle votre plan démarre."
        />
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ActionButton
        label={
          kind === "dca" ? "Créer mon plan DCA  →" : "Confirmer le versement  →"
        }
        onPress={onSubmit}
      />
      <Text style={styles.legal}>
        Vous pourrez modifier ou arrêter un plan DCA à tout moment. Cette
        simulation n’exécute aucun ordre réel.
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  amountCard: { marginBottom: 12 },
  schedule: { gap: 15, marginBottom: 26 },
  blockTitle: { color: p.ink, fontSize: 16, fontWeight: "700" },
  blockHint: { color: p.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  fieldLabel: { color: p.ink, fontSize: 13, fontWeight: "600" },
  dayPicker: {
    minHeight: 57,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 6,
    borderRadius: 15,
    backgroundColor: p.canvas,
  },
  stepper: {
    width: 40,
    height: 40,
    backgroundColor: p.paper,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperText: { color: p.forest, fontSize: 18, fontWeight: "700" },
  dayValue: { alignItems: "center", flexDirection: "row", gap: 8 },
  dayNumber: { color: p.ink, fontSize: 20, fontWeight: "700" },
  daySuffix: { color: p.muted, fontSize: 12 },
  allocationHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  lineCount: {
    borderRadius: 20,
    backgroundColor: p.softGreen,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  lineCountText: { color: p.forest, fontSize: 11, fontWeight: "700" },
  lines: { gap: 11 },
  lineCard: { gap: 16 },
  lineTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  lineNumber: {
    height: 26,
    width: 26,
    borderRadius: 9,
    backgroundColor: p.softGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  lineNumberText: { color: p.forest, fontSize: 10, fontWeight: "800" },
  lineHeading: { color: p.ink, fontSize: 14, fontWeight: "700", flex: 1 },
  remove: { color: p.red, fontSize: 12, fontWeight: "600" },
  suggestions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
    marginTop: -8,
  },
  suggestionLabel: { color: p.muted, fontSize: 10, marginRight: 2 },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: p.canvas,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  suggestionDot: { height: 6, width: 6, borderRadius: 3 },
  suggestionText: { color: p.ink, fontSize: 10, fontWeight: "600" },
  addLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 17,
  },
  addIcon: { color: p.forest, fontSize: 20, fontWeight: "500" },
  addText: { color: p.forest, fontSize: 14, fontWeight: "700" },
  addHint: { color: p.muted, fontSize: 11, marginLeft: "auto" },
  summary: { backgroundColor: "#F7F9F5", gap: 12, marginBottom: 6 },
  summaryLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: { color: p.muted, fontSize: 13 },
  summaryValue: { color: p.ink, fontSize: 14, fontWeight: "700" },
  progressTrack: {
    height: 6,
    borderRadius: 5,
    backgroundColor: "#E3E9E3",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: p.forestLight,
    borderRadius: 5,
  },
  balanceMessage: { fontSize: 12, fontWeight: "600" },
  balanced: { color: p.forestLight },
  unbalanced: { color: p.amber },
  error: { color: p.red, fontSize: 13, lineHeight: 18, paddingVertical: 6 },
  legal: {
    color: p.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 8,
  },
});
