import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Operation, Security } from "@/domain/models/operation";
import type { AllocationDraft, AllocationDraftField } from "@/presentation/models/allocation-draft";
import { ActionButton, Card, PageHeading, Pill, SectionTitle, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";
import { DateField } from "@/presentation/components/date-field";
import { InstrumentIdentity } from "@/presentation/components/instrument-identity";

type AllocationField = AllocationDraftField;

export function ScenarioFormScreen(props: {
  operation: Operation;
  operations: Operation[];
  startDate: string;
  date: string;
  total: string;
  executionDay: string;
  delayBusinessDays: string;
  lines: AllocationDraft[];
  securities: Security[];
  assumptions: Record<string, string>;
  error: string;
  loading: boolean;
  onStartDateChange: (value: string) => void;
  onUseSavedPlan: (operation: Operation) => void;
  onDateChange: (value: string) => void;
  onTotalChange: (value: string) => void;
  onExecutionDayChange: (value: string) => void;
  onDelayChange: (value: string) => void;
  onAssumptionChange: (isin: string, value: string) => void;
  onLineChange: (id: string, field: AllocationField, value: string) => void;
  onAddLine: () => void;
  onRemoveLine: (id: string) => void;
  onCompare: () => void;
}) {
  const { operation, operations, startDate, date, total, executionDay, delayBusinessDays, lines, securities } = props;
  const savedPlans = operations.filter((item) => item.kind === "dca" && item.id !== operation.id);
  const update = (line: AllocationDraft, field: AllocationField, value: string) => props.onLineChange(line.id, field, value);
  const targetMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  const targetDate = targetMatch ? new Date(Number(targetMatch[3]), Number(targetMatch[2]) - 1, Number(targetMatch[1])) : null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const needsProjection = targetDate !== null && targetDate > today;
  const originalAllocations = [...operation.allocations, ...(operation.configurationHistory ?? []).flatMap((revision) => revision.allocations)];
  const scenarioIsins = [...originalAllocations, ...lines]
    .filter((line) => line.instrumentKind === "uc" && line.isin.trim())
    .reduce<string[]>((unique, line) => unique.includes(line.isin) ? unique : [...unique, line.isin], []);
  const supportName = (isin: string) => securities.find((security) => security.isin === isin)?.shortName
    ?? [...originalAllocations, ...lines].find((line) => line.isin === isin)?.name ?? isin;
  const supportSymbol = (isin: string) => [...originalAllocations, ...lines].find((line) => line.isin === isin)?.symbol
    ?? securities.find((security) => security.isin === isin)?.symbol ?? null;

  return <>
    <PageHeading eyebrow="Comparaison · paramètres" title="Construire l’autre scénario" subtitle="Choisissez une date cible commune, puis modifiez les paramètres du scénario B. Votre opération reste le scénario A de référence." />

    <Card style={styles.targetDate}>
      <Text style={styles.referenceEyebrow}>1 · DATE COMMUNE DE VALORISATION</Text>
      <Text style={styles.helper}>A et B seront valorisés à cette même date pour rendre leurs résultats comparables.</Text>
      <DateField label="Date cible commune" value={date} onChange={props.onDateChange} helper="A et B seront comparés à cette date. Pour une date future, une hypothèse de rendement sera demandée pour chaque support UC." />
    </Card>

    <Card style={styles.reference}>
      <Text style={styles.referenceEyebrow}>VOTRE OPÉRATION DE RÉFÉRENCE</Text>
      <Text style={styles.referenceTitle}>{operation.label}</Text>
      <Text style={styles.referenceMeta}>{operation.kind === "dca" ? "Versements réguliers · " + totalLabel(operation.amount) + " / mois" : "Versement · " + totalLabel(operation.amount)}</Text>
      <Text style={styles.referenceMeta}>Début : {formatDateLabel(operation.date)}</Text>
      {operation.kind === "dca" ? <Text style={styles.referenceMeta}>Prélèvement le {operation.executionDay} · délai {operation.delayBusinessDays} jours ouvrés</Text> : null}
      {operation.kind === "dca" && operation.configurationHistory?.length ? <Text style={styles.referenceMeta}>Le scénario A conserve la répartition valable pour chaque échéance passée.</Text> : null}
      <View style={styles.referenceLines}>{operation.allocations.map((line) => <View key={line.id} style={styles.referenceLine}>
        <InstrumentIdentity name={line.name ?? securities.find((security) => security.isin === line.isin)?.shortName} symbol={line.symbol ?? securities.find((security) => security.isin === line.isin)?.symbol} isin={line.instrumentKind === "uc" ? line.isin : null} fallback="Fonds euro" titleStyle={styles.referenceMeta} />
        <Text style={styles.referenceMeta}>{totalLabel(line.amount)}{operation.kind === "dca" ? " / mois" : ""}</Text>
      </View>)}</View>
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

      <DateField label={operation.kind === "dca" ? "Date de mise en place du plan B" : "Date d’exécution du versement B"} value={startDate} onChange={props.onStartDateChange} helper={operation.kind === "dca" ? "Première date de référence du plan alternatif." : "Date à laquelle le versement alternatif aurait été réalisé."} />
      <TextField label={operation.kind === "dca" ? "Montant mensuel" : "Montant du versement"} value={total} onChangeText={props.onTotalChange} keyboardType="decimal-pad" suffix={operation.kind === "dca" ? "€ / mois" : "€"} placeholder={operation.kind === "dca" ? "Ex. 200,00" : "Ex. 1 000,00"} />
      {operation.kind === "dca" ? <>
        <TextField label="Jour de prélèvement" value={executionDay} onChangeText={props.onExecutionDayChange} keyboardType="number-pad" />
        <TextField label="Délai avant exécution (jours ouvrés)" value={delayBusinessDays} onChangeText={props.onDelayChange} keyboardType="number-pad" />
      </> : null}
    </Card>

    <SectionTitle title="3 · Répartition du scénario B" action={<Text style={styles.lineCount}>{lines.length} ligne{lines.length === 1 ? "" : "s"}</Text>} />
    {lines.map((line, index) => <Card key={line.id} style={styles.card}>
      <View style={styles.lineHeader}>
        <Text style={styles.lineTitle}>Support {index + 1}</Text>
        {lines.length > 1 ? <Pressable onPress={() => props.onRemoveLine(line.id)} hitSlop={8}><Text style={styles.remove}>Retirer</Text></Pressable> : null}
      </View>
      <View style={styles.pills}>
        <Pill label="UC · ISIN" active={line.instrumentKind === "uc"} onPress={() => update(line, "instrumentKind", "uc")} />
        <Pill label="Fonds euro" active={line.instrumentKind === "fonds-euro"} onPress={() => update(line, "instrumentKind", "fonds-euro")} />
      </View>
      {line.instrumentKind === "uc" ? <>
        <Text style={styles.helper}>Le symbole est le code court du support ; l’ISIN est son identifiant complet.</Text>
        <TextField label="Code ISIN" value={line.isin} onChangeText={(value) => update(line, "isin", value.toUpperCase().replace(/\s/g, ""))} placeholder="Ex. FR0010380675" autoCapitalize="characters" helper="Saisissez un ISIN ou choisissez un support déjà suivi ci-dessous." />
        {securities.length > 0 ? <View style={styles.securitySuggestions}>
          <Text style={styles.helper}>Supports déjà suivis</Text>
          {securities.map((security) => <Pressable key={security.isin} accessibilityRole="button" accessibilityLabel={`Choisir ${security.name}, ${security.symbol ? `symbole ${security.symbol}, ` : ""}ISIN ${security.isin}`} onPress={() => update(line, "isin", security.isin)} style={styles.securitySuggestion}>
            <InstrumentIdentity name={security.shortName ?? security.name} symbol={security.symbol} isin={security.isin} />
            <Text style={styles.suggestionAction}>Choisir</Text>
          </Pressable>)}
        </View> : null}
      </> : <>
        <TextField label="Nom du fonds euro" value={line.name ?? ""} onChangeText={(value) => update(line, "name", value)} placeholder="Fonds euro du contrat" />
      </>}
      <TextField label="Montant affecté" value={String(line.amount || "")} onChangeText={(value) => update(line, "amount", value)} keyboardType="decimal-pad" suffix="€" placeholder="Ex. 100,00" />
    </Card>)}
    <Pressable onPress={props.onAddLine} style={styles.addLine}><Text style={styles.addText}>＋ Ajouter un support au scénario B</Text></Pressable>
    {needsProjection && scenarioIsins.length > 0 ? <Card style={styles.projectionCard}>
      <Text style={styles.sectionTitle}>4 · Hypothèses de rendement à la date cible</Text>
      <Text style={styles.helper}>Indiquez le rendement annuel envisagé jusqu’à la date cible. Un ISIN commun à A et B utilise le même taux dans les deux scénarios.</Text>
      {scenarioIsins.map((isin) => {
        const inA = originalAllocations.some((allocation) => allocation.instrumentKind === "uc" && allocation.isin === isin);
        const inB = lines.some((allocation) => allocation.instrumentKind === "uc" && allocation.isin === isin);
        const scenarios = inA && inB ? "A et B" : inA ? "A" : "B";
        const symbol = supportSymbol(isin);
        const support = supportName(isin);
        const label = `${support}${symbol && symbol !== support ? ` · ${symbol}` : ""} · ISIN ${isin} · Scénario ${scenarios}`;
        return <TextField key={isin} label={label} value={props.assumptions[isin] ?? ""}
          onChangeText={(value) => props.onAssumptionChange(isin, value)} keyboardType="decimal-pad" suffix="% / an" placeholder="Ex. 6" />;
      })}
      <Text style={styles.helper}>Le fonds euro conserve le taux de l’adapter ; aucune hypothèse n’est à saisir pour lui.</Text>
    </Card> : null}
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
  referenceLines: { borderTopWidth: 1, borderColor: p.line, paddingTop: 7, marginTop: 4, gap: 8 }, referenceLine: { flexDirection: "row", alignItems: "center", gap: 10 },
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
  securitySuggestions: { gap: 3, borderWidth: 1, borderColor: p.line, borderRadius: 14, overflow: "hidden", padding: 9, backgroundColor: p.surfaceSubtle },
  securitySuggestion: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 7, borderBottomWidth: 1, borderColor: p.line },
  suggestionAction: { color: p.forestLight, fontSize: 11, fontWeight: "700" },
  addLine: { paddingVertical: 16 },
  addText: { color: p.forestLight, fontSize: 13, fontWeight: "700" },
  note: { backgroundColor: p.surfaceSubtle, gap: 5, marginTop: 5, marginBottom: 12 },
  projectionCard: { gap: 12, marginTop: 8, marginBottom: 12, backgroundColor: p.softGreen },
  noteTitle: { color: p.ink, fontSize: 13, fontWeight: "700" },
  error: { color: p.red, fontSize: 13, paddingVertical: 8 },
});
