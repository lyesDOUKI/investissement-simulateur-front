import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AllocationLine, Security } from "@/domain/models/operation";
import { ActionButton, Card, PageHeading, Pill, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";

type ChangeField = "isin" | "name" | "amount" | "instrumentKind" | "annualReturnPct";

export function InvestmentFormScreen(props: {
  kind: "versement" | "dca"; total: string; lines: AllocationLine[]; securities: Security[];
  date: string; executionDay: string; delayBusinessDays: string; error: string;
  annualReturnPct: string; loading: boolean;
  onTotalChange: (value: string) => void; onLineChange: (id: string, field: ChangeField, value: string) => void;
  onAddLine: () => void; onRemoveLine: (id: string) => void; onDateChange: (value: string) => void;
  onExecutionDayChange: (value: string) => void; onDelayChange: (value: string) => void; onSubmit: () => void;
  onAnnualReturnChange: (value: string) => void;
}) {
  const { kind, total, lines, securities, date, executionDay, delayBusinessDays, error } = props;
  const d = (line: AllocationLine) => (field: ChangeField, value: string) => props.onLineChange(line.id, field, value);
  return <>
    <PageHeading eyebrow={kind === "dca" ? "Plan d’investissement" : "Historique réel"}
      title={kind === "dca" ? "Enregistrer un plan DCA" : "Enregistrer un versement"}
      subtitle={kind === "dca" ? "Saisissez les paramètres de votre plan. Le service métier renverra les échéances et leur valorisation." : "Ajoutez une trace d’un versement déjà effectué chez votre courtier."} />
    <Card style={styles.card}>
      <TextField label={kind === "dca" ? "Montant à chaque échéance" : "Montant versé"} value={total}
        onChangeText={props.onTotalChange} placeholder="0" keyboardType="decimal-pad" suffix="€" />
      <TextField label={kind === "dca" ? "Date de démarrage du plan" : "Date réelle du versement"} value={date}
        onChangeText={props.onDateChange} placeholder="JJ/MM/AAAA" helper="Format : JJ/MM/AAAA" />
      {kind === "dca" ? <>
        <TextField label="Jour de prélèvement mensuel" value={executionDay} onChangeText={props.onExecutionDayChange} keyboardType="number-pad" helper="Paramètre transmis au service métier." />
        <TextField label="Décalage avant exécution (jours ouvrés)" value={delayBusinessDays} onChangeText={props.onDelayChange} keyboardType="number-pad" helper="Le calendrier et les règles d’exécution sont déterminés par le service métier." />
      </> : null}
      {kind === "versement" ? <TextField label="Taux de rendement annuel (hypothèse)" value={props.annualReturnPct}
        onChangeText={props.onAnnualReturnChange} placeholder="Ex. 5" keyboardType="decimal-pad" suffix="%"
        helper="Hypothèse transmise au service de simulation. Elle ne prédit pas un rendement réel." /> : null}
    </Card>
    <View style={styles.heading}><View style={{ flex: 1 }}><Text style={styles.title}>Allocation par support</Text>
      <Text style={styles.helper}>Montant affecté à chaque ISIN ou fonds euro.</Text></View><Text style={styles.badge}>{lines.length} ligne{lines.length===1?"":"s"}</Text></View>
    {lines.map((line, index) => <Card key={line.id} style={styles.card}>
      <View style={styles.lineHead}><Text style={styles.title}>Ligne {index + 1}</Text>
        {lines.length > 1 ? <Pressable onPress={() => props.onRemoveLine(line.id)}><Text style={styles.remove}>Retirer</Text></Pressable> : null}</View>
      <View style={styles.pills}><Pill label="UC · ISIN" active={line.instrumentKind === "uc"} onPress={() => d(line)("instrumentKind", "uc")} />
        <Pill label="Fonds euro" active={line.instrumentKind === "fonds-euro"} onPress={() => d(line)("instrumentKind", "fonds-euro")} /></View>
      {line.instrumentKind === "uc" ? <>
        <TextField label="Code ISIN" value={line.isin} onChangeText={(v) => d(line)("isin", v.toUpperCase().replace(/\s/g, ""))}
          placeholder="Ex. FR0010380675" autoCapitalize="characters" helper={securities.find((s) => s.isin === line.isin)?.name ?? "Choisissez ou saisissez le code du support."} />
        <View style={styles.pills}>{securities.slice(0, 3).map((s) => <Pill key={s.isin} label={s.shortName} onPress={() => d(line)("isin", s.isin)} />)}</View>
      </> : <>
        <TextField label="Nom du fonds euro" value={line.name ?? ""} onChangeText={(v) => d(line)("name", v)} placeholder="Ex. Fonds euro contrat" />
        <TextField label="Rendement annuel utilisé pour la simulation" value={String(line.annualReturnPct ?? "0")}
          onChangeText={(v) => d(line)("annualReturnPct", v)} keyboardType="decimal-pad" suffix="%" helper="Hypothèse modifiable, distincte d’un cours de marché." />
      </>}
      <TextField label="Montant sur ce support" value={String(line.amount || "")} onChangeText={(v) => d(line)("amount", v)} placeholder="0" keyboardType="decimal-pad" suffix="€" />
    </Card>)}
    <Pressable onPress={props.onAddLine} style={styles.add}><Text style={styles.addText}>＋ Ajouter un support</Text></Pressable>
    <Card style={styles.summary}><Text style={styles.title}>Répartition envoyée avec la demande</Text>
      <Text style={styles.helper}>Le service métier vérifiera la cohérence entre le montant et les lignes de supports.</Text></Card>
    <Card style={styles.notice}><Text style={styles.noticeText}>{kind === "dca" ? "Cette fiche décrit votre plan. Les échéances historiques sont calculées à la valorisation." : "Cette saisie conserve une trace dans l’application. Aucun ordre n’est envoyé à votre courtier."}</Text></Card>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <ActionButton label={kind === "dca" ? "Enregistrer le plan →" : "Enregistrer ce versement →"} onPress={props.onSubmit} loading={props.loading} />
  </>;
}

const styles = StyleSheet.create({ card:{gap:16,marginBottom:11}, helper:{color:p.muted,fontSize:12,lineHeight:17}, heading:{flexDirection:"row",alignItems:"center",gap:10,marginTop:18,marginBottom:12}, title:{color:p.ink,fontSize:15,fontWeight:"700"}, badge:{color:p.forest,backgroundColor:p.softGreen,overflow:"hidden",padding:8,borderRadius:18}, lineHead:{flexDirection:"row",justifyContent:"space-between"}, remove:{color:p.red,fontSize:12,fontWeight:"600"}, pills:{flexDirection:"row",flexWrap:"wrap",gap:7}, add:{paddingVertical:17},addText:{color:p.forest,fontSize:14,fontWeight:"700"},summary:{gap:6,backgroundColor:"#F7F9F5",marginBottom:12},notice:{backgroundColor:p.softGreen,marginBottom:12},noticeText:{color:p.forest,fontSize:12,lineHeight:18},error:{color:p.red,fontSize:13,padding:8}});
