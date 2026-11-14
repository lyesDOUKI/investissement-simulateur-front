import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AllocationLine, Security } from "@/domain/models/operation";
import { isValidIsin } from "@/domain/rules/is-valid-isin";
import { ActionButton, Card, PageHeading, Pill, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";

const euro = (v: number) => `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
type ChangeField = "isin" | "name" | "amount" | "instrumentKind" | "annualReturnPct";

export function InvestmentFormScreen(props: {
  kind: "versement" | "dca"; total: string; lines: AllocationLine[]; securities: Security[];
  date: string; executionDay: number; delayBusinessDays: number; error: string;
  onTotalChange: (value: string) => void; onLineChange: (id: string, field: ChangeField, value: string) => void;
  onAddLine: () => void; onRemoveLine: (id: string) => void; onDateChange: (value: string) => void;
  onExecutionDayChange: (value: number) => void; onDelayChange: (value: number) => void; onSubmit: () => void;
}) {
  const { kind, total, lines, securities, date, executionDay, delayBusinessDays, error } = props;
  const totalValue = Number(total.replace(",", ".")) || 0;
  const lineTotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const d = (line: AllocationLine) => (field: ChangeField, value: string) => props.onLineChange(line.id, field, value);
  return <>
    <PageHeading eyebrow={kind === "dca" ? "Plan d’investissement" : "Historique réel"}
      title={kind === "dca" ? "Enregistrer un plan DCA" : "Enregistrer un versement"}
      subtitle={kind === "dca" ? "Reconstituez les échéances de votre courtier pour suivre le plan et tester d’autres hypothèses." : "Ajoutez une trace d’un versement déjà effectué chez votre courtier."} />
    <Card style={styles.card}>
      <TextField label={kind === "dca" ? "Montant à chaque échéance" : "Montant versé"} value={total}
        onChangeText={props.onTotalChange} placeholder="0" keyboardType="decimal-pad" suffix="€" />
      <TextField label={kind === "dca" ? "Date de démarrage du plan" : "Date réelle du versement"} value={date}
        onChangeText={props.onDateChange} placeholder="JJ/MM/AAAA" helper="Format : JJ/MM/AAAA" />
      {kind === "dca" ? <>
        <View style={styles.schedule}><Text style={styles.label}>Jour de prélèvement mensuel</Text>
          <View style={styles.stepper}><Pill label="−" onPress={() => props.onExecutionDayChange(Math.max(1, executionDay - 1))} />
            <Text style={styles.day}>{executionDay} du mois</Text>
            <Pill label="＋" onPress={() => props.onExecutionDayChange(Math.min(28, executionDay + 1))} /></View>
        </View>
        <View style={styles.schedule}><Text style={styles.label}>Décalage avant exécution</Text>
          <View style={styles.stepper}><Pill label="−" onPress={() => props.onDelayChange(Math.max(0, delayBusinessDays - 1))} />
            <Text style={styles.day}>{delayBusinessDays} jours ouvrés</Text>
            <Pill label="＋" onPress={() => props.onDelayChange(Math.min(20, delayBusinessDays + 1))} /></View>
          <Text style={styles.helper}>Les week-ends sont ignorés. Les jours fériés ne sont pas modélisés dans cette démo.</Text>
        </View>
      </> : null}
    </Card>
    <View style={styles.heading}><View style={{ flex: 1 }}><Text style={styles.title}>Allocation par support</Text>
      <Text style={styles.helper}>Montant affecté à chaque ISIN ou fonds euro.</Text></View><Text style={styles.badge}>{lines.length}/8</Text></View>
    {lines.map((line, index) => <Card key={line.id} style={styles.card}>
      <View style={styles.lineHead}><Text style={styles.title}>Ligne {index + 1}</Text>
        {lines.length > 1 ? <Pressable onPress={() => props.onRemoveLine(line.id)}><Text style={styles.remove}>Retirer</Text></Pressable> : null}</View>
      <View style={styles.pills}><Pill label="UC · ISIN" active={line.instrumentKind === "uc"} onPress={() => d(line)("instrumentKind", "uc")} />
        <Pill label="Fonds euro" active={line.instrumentKind === "fonds-euro"} onPress={() => d(line)("instrumentKind", "fonds-euro")} /></View>
      {line.instrumentKind === "uc" ? <>
        <TextField label="Code ISIN" value={line.isin} onChangeText={(v) => d(line)("isin", v.toUpperCase().replace(/\s/g, ""))}
          placeholder="Ex. FR0010380675" autoCapitalize="characters" helper={securities.find((s) => s.isin === line.isin)?.name ?? (line.isin && isValidIsin(line.isin) ? "ISIN valide · cours démo selon disponibilité" : "12 caractères, lettres et chiffres")} />
        <View style={styles.pills}>{securities.slice(0, 3).map((s) => <Pill key={s.isin} label={s.shortName} onPress={() => d(line)("isin", s.isin)} />)}</View>
      </> : <>
        <TextField label="Nom du fonds euro" value={line.name ?? ""} onChangeText={(v) => d(line)("name", v)} placeholder="Ex. Fonds euro contrat" />
        <TextField label="Rendement annuel utilisé pour la simulation" value={String(line.annualReturnPct ?? "0")}
          onChangeText={(v) => d(line)("annualReturnPct", v)} keyboardType="decimal-pad" suffix="%" helper="Hypothèse modifiable, distincte d’un cours de marché." />
      </>}
      <TextField label="Montant sur ce support" value={String(line.amount || "")} onChangeText={(v) => d(line)("amount", v)} placeholder="0" keyboardType="decimal-pad" suffix="€" />
    </Card>)}
    <Pressable onPress={props.onAddLine} disabled={lines.length >= 8} style={styles.add}><Text style={styles.addText}>＋ Ajouter un support</Text></Pressable>
    <Card style={styles.summary}><Text style={styles.title}>Total alloué : {euro(lineTotal)} / {euro(totalValue)}</Text>
      <Text style={styles.helper}>{Math.abs(lineTotal-totalValue) < .01 ? "Allocation équilibrée" : `Écart à répartir : ${euro(totalValue-lineTotal)}`}</Text></Card>
    <Card style={styles.notice}><Text style={styles.noticeText}>{kind === "dca" ? "Cette fiche décrit votre plan. Les échéances historiques sont calculées à la valorisation." : "Cette saisie conserve une trace dans l’application. Aucun ordre n’est envoyé à votre courtier."}</Text></Card>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <ActionButton label={kind === "dca" ? "Enregistrer le plan →" : "Enregistrer ce versement →"} onPress={props.onSubmit} />
  </>;
}

const styles = StyleSheet.create({ card:{gap:16,marginBottom:11}, schedule:{gap:8}, label:{color:p.ink,fontSize:13,fontWeight:"600"}, stepper:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:p.canvas,borderRadius:15,padding:6}, day:{color:p.ink,fontSize:16,fontWeight:"700"}, helper:{color:p.muted,fontSize:12,lineHeight:17}, heading:{flexDirection:"row",alignItems:"center",gap:10,marginTop:18,marginBottom:12}, title:{color:p.ink,fontSize:15,fontWeight:"700"}, badge:{color:p.forest,backgroundColor:p.softGreen,overflow:"hidden",padding:8,borderRadius:18}, lineHead:{flexDirection:"row",justifyContent:"space-between"}, remove:{color:p.red,fontSize:12,fontWeight:"600"}, pills:{flexDirection:"row",flexWrap:"wrap",gap:7}, add:{paddingVertical:17},addText:{color:p.forest,fontSize:14,fontWeight:"700"},summary:{gap:6,backgroundColor:"#F7F9F5",marginBottom:12},notice:{backgroundColor:p.softGreen,marginBottom:12},noticeText:{color:p.forest,fontSize:12,lineHeight:18},error:{color:p.red,fontSize:13,padding:8}});
