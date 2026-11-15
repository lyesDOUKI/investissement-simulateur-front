import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AllocationLine, Operation, Security } from "@/domain/models/operation";
import { ActionButton, Card, PageHeading, Pill, SectionTitle, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";
import { DateField } from "@/presentation/components/date-field";

type AllocationField = "isin" | "amount" | "instrumentKind" | "name" | "annualReturnPct";

export function ScenarioFormScreen(props: {
  operation: Operation;
  operations: Operation[];
  startDate: string;
  date: string;
  total: string;
  executionDay: string;
  delayBusinessDays: string;
  lines: AllocationLine[];
  securities: Security[];
  annualReturnPct: string;
  error: string;
  loading: boolean;
  onStartDateChange: (value: string) => void;
  onUseSavedPlan: (operation: Operation) => void;
  onDateChange: (value: string) => void;
  onTotalChange: (value: string) => void;
  onExecutionDayChange: (value: string) => void;
  onDelayChange: (value: string) => void;
  onAnnualReturnChange: (value: string) => void;
  onLineChange: (id: string, field: AllocationField, value: string) => void;
  onAddLine: () => void;
  onRemoveLine: (id: string) => void;
  onCompare: () => void;
}) {
  const { operation, operations, startDate, date, total, executionDay, delayBusinessDays, lines, securities } = props;
  const savedPlans = operations.filter((item) => item.kind === "dca" && item.id !== operation.id);
  const update = (line: AllocationLine, field: AllocationField, value: string) => props.onLineChange(line.id, field, value);

  return <>
    <PageHeading eyebrow="Comparaison · paramètres" title="Construire l’autre scénario" subtitle="Choisissez une date cible commune, puis modifiez les paramètres du scénario B. Votre opération reste le scénario A de référence." />

    <Card style={styles.targetDate}>
      <Text style={styles.referenceEyebrow}>1 · DATE COMMUNE DE VALORISATION</Text>
      <Text style={styles.helper}>A et B seront valorisés à cette même date pour rendre leurs résultats comparables.</Text>
      <DateField label="Date cible" value={date} onChange={props.onDateChange} />
    </Card>

    <Card style={styles.reference}>
      <Text style={styles.referenceEyebrow}>VOTRE OPÉRATION DE RÉFÉRENCE</Text>
      <Text style={styles.referenceTitle}>{operation.label}</Text>
      <Text style={styles.referenceMeta}>{operation.kind === "dca" ? "Versements réguliers · " + totalLabel(operation.amount) + " / mois" : "Versement · " + totalLabel(operation.amount)}</Text>
      <Text style={styles.referenceMeta}>Début : {formatDateLabel(operation.date)}</Text>
      {operation.kind === "dca" ? <Text style={styles.referenceMeta}>Prélèvement le {operation.executionDay} · délai {operation.delayBusinessDays} jours ouvrés</Text> : null}
      <View style={styles.referenceLines}>{operation.allocations.map((line) => <Text key={line.id} style={styles.referenceMeta}>• {line.name ?? line.isin} · {totalLabel(line.amount)}</Text>)}</View>
    </Card>

    <Card style={styles.card}>
      <View style={styles.alternativeHeading}>
        <View style={styles.step}><Text style={styles.stepText}>B</Text></View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.sectionTitle}>2 · Scénario alternatif</Text>
          <Text style={styles.helper}>Cette hypothèse ne sera pas ajoutée au journal.</Text>
        </View>
      </View>

      {operation.kind === "dca" && savedPlans.length > 0 ? <View style={styles.savedPlans}>
        <Text style={styles.helper}>Reprendre les paramètres d’un autre plan enregistré</Text>
        <View style={styles.pills}>{savedPlans.map((plan) => <Pill key={plan.id} label={formatDateLabel(plan.date) + " · " + plan.amount.toLocaleString("fr-FR") + " € / mois"} onPress={() => props.onUseSavedPlan(plan)} />)}</View>
      </View> : null}

      <DateField label={operation.kind === "dca" ? "Date de mise en place du plan B" : "Date d’exécution du versement B"} value={startDate} onChange={props.onStartDateChange} />
      <TextField label={operation.kind === "dca" ? "Montant mensuel" : "Montant du versement"} value={total} onChangeText={props.onTotalChange} keyboardType="decimal-pad" suffix={operation.kind === "dca" ? "€ / mois" : "€"} />
      {operation.kind === "dca" ? <>
        <TextField label="Jour de prélèvement" value={executionDay} onChangeText={props.onExecutionDayChange} keyboardType="number-pad" />
        <TextField label="Délai avant exécution (jours ouvrés)" value={delayBusinessDays} onChangeText={props.onDelayChange} keyboardType="number-pad" />
      </> : null}
      <TextField label="Taux annuel (hypothèse)" value={props.annualReturnPct} onChangeText={props.onAnnualReturnChange} keyboardType="decimal-pad" suffix="%" helper="Transmis au service pour une projection future." />
    </Card>

    <SectionTitle title="3 · Allocation du scénario B" action={<Text style={styles.lineCount}>{lines.length} ligne{lines.length === 1 ? "" : "s"}</Text>} />
    {lines.map((line, index) => <Card key={line.id} style={styles.card}>
      <View style={styles.lineHeader}>
        <Text style={styles.lineTitle}>Support {index + 1}</Text>
        {lines.length > 1 ? <Pressable onPress={() => props.onRemoveLine(line.id)} hitSlop={8}><Text style={styles.remove}>Retirer</Text></Pressable> : null}
      </View>
      <View style={styles.pills}>
        <Pill label="UC · ISIN" active={line.instrumentKind === "uc"} onPress={() => update(line, "instrumentKind", "uc")} />
        <Pill label="Fonds euro" active={line.instrumentKind === "fonds-euro"} onPress={() => update(line, "instrumentKind", "fonds-euro")} />
      </View>
      {line.instrumentKind === "uc" ? <Text style={styles.helper}>UC signifie « unité de compte ». Le code ISIN identifie chaque support de cette catégorie.</Text> : null}
      {line.instrumentKind === "uc" ? <>
        <TextField label="Code ISIN" value={line.isin} onChangeText={(value) => update(line, "isin", value.toUpperCase().replace(/\s/g, ""))} placeholder="Ex. FR0010380675" autoCapitalize="characters" helper="L’ISIN identifie le support choisi." />
        <View style={styles.pills}>{securities.map((security) => <Pill key={security.isin} label={security.shortName} onPress={() => update(line, "isin", security.isin)} />)}</View>
      </> : <>
        <TextField label="Nom du fonds euro" value={line.name ?? ""} onChangeText={(value) => update(line, "name", value)} placeholder="Fonds euro du contrat" />
        <TextField label="Rendement annuel (hypothèse)" value={String(line.annualReturnPct ?? "")} onChangeText={(value) => update(line, "annualReturnPct", value)} keyboardType="decimal-pad" suffix="%" />
      </>}
      <TextField label="Montant affecté" value={String(line.amount || "")} onChangeText={(value) => update(line, "amount", value)} keyboardType="decimal-pad" suffix="€" />
    </Card>)}
    <Pressable onPress={props.onAddLine} style={styles.addLine}><Text style={styles.addText}>＋ Ajouter un support au scénario B</Text></Pressable>
    <Card style={styles.note}><Text style={styles.noteTitle}>Une comparaison utile</Text><Text style={styles.helper}>Le résultat présente côte à côte l’effort investi, les valeurs retournées et les écarts. Il ne désigne pas un plan « meilleur » sans tenir compte de vos critères.</Text></Card>
    {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
    <ActionButton label="Comparer A et B →" onPress={props.onCompare} loading={props.loading} />
  </>;
}

const totalLabel = (value: number) => value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const styles = StyleSheet.create({
  targetDate: { backgroundColor: p.softGreen, gap: 10, marginBottom: 14 },
  reference: { backgroundColor: p.surfaceSubtle, gap: 6, marginBottom: 14 },
  referenceEyebrow: { color: p.forestLight, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  referenceTitle: { color: p.ink, fontSize: 15, fontWeight: "700" },
  referenceMeta: { color: p.muted, fontSize: 12, lineHeight: 17 },
  referenceLines: { borderTopWidth: 1, borderColor: p.line, paddingTop: 7, marginTop: 4, gap: 3 },
  card: { gap: 15, marginBottom: 10 },
  alternativeHeading: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 },
  savedPlans: { gap: 8, borderTopWidth: 1, borderColor: p.line, paddingTop: 12 },
  step: { width: 29, height: 29, borderRadius: 10, backgroundColor: p.softGreen, alignItems: "center", justifyContent: "center" },
  stepText: { color: p.forestLight, fontSize: 12, fontWeight: "800" },
  sectionTitle: { color: p.ink, fontSize: 15, fontWeight: "700" },
  helper: { color: p.muted, fontSize: 12, lineHeight: 17 },
  lineCount: { color: p.forestLight, fontSize: 11, fontWeight: "700" },
  lineHeader: { flexDirection: "row", justifyContent: "space-between" },
  lineTitle: { color: p.ink, fontSize: 14, fontWeight: "700" },
  remove: { color: p.red, fontSize: 12, fontWeight: "600" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  addLine: { paddingVertical: 16 },
  addText: { color: p.forestLight, fontSize: 13, fontWeight: "700" },
  note: { backgroundColor: p.surfaceSubtle, gap: 5, marginTop: 5, marginBottom: 12 },
  noteTitle: { color: p.ink, fontSize: 13, fontWeight: "700" },
  error: { color: p.red, fontSize: 13, paddingVertical: 8 },
});
