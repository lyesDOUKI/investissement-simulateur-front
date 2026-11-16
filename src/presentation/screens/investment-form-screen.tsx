import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Security } from "@/domain/models/operation";
import type { AllocationDraft, AllocationDraftField } from "@/presentation/models/allocation-draft";
import { ActionButton, Card, PageHeading, Pill, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { DateField } from "@/presentation/components/date-field";

type ChangeField = AllocationDraftField;

export function InvestmentFormScreen(props: {
  kind: "versement" | "dca"; total: string; lines: AllocationDraft[]; securities: Security[];
  date: string; executionDay: string; delayBusinessDays: string; error: string;
  loading: boolean;
  onTotalChange: (value: string) => void; onLineChange: (id: string, field: ChangeField, value: string) => void;
  onAddLine: () => void; onRemoveLine: (id: string) => void; onDateChange: (value: string) => void;
  onExecutionDayChange: (value: string) => void; onDelayChange: (value: string) => void; onSubmit: () => void;
}) {
  const { kind, total, lines, securities, date, executionDay, delayBusinessDays, error } = props;
  const d = (line: AllocationDraft) => (field: ChangeField, value: string) => props.onLineChange(line.id, field, value);
  return <>
    <PageHeading eyebrow={kind === "dca" ? "Versements réguliers · DCA" : "Historique réel"}
      title={kind === "dca" ? "Enregistrer un plan d’investissement" : "Enregistrer un versement"}
      subtitle={kind === "dca" ? "DCA désigne des versements réguliers sur des supports choisis. Saisissez les paramètres du plan ; le service métier renverra ses échéances et leur valorisation." : "Ajoutez une trace d’un versement déjà effectué chez votre courtier."} />
    <Card style={styles.card}>
      <TextField label={kind === "dca" ? "Montant à chaque échéance" : "Montant versé"} value={total}
        onChangeText={props.onTotalChange} placeholder="0" keyboardType="decimal-pad" suffix="€" />
      <DateField label={kind === "dca" ? "Date de démarrage du plan" : "Date réelle du versement"} value={date}
        onChange={props.onDateChange} helper="Sélectionnez la date dans le calendrier." />
      {kind === "dca" ? <>
        <TextField label="Jour de l’échéance chaque mois" value={executionDay} onChangeText={props.onExecutionDayChange} keyboardType="number-pad" helper="Jour du mois qui sert de base au calcul des échéances." />
        <TextField label="Délai avant exécution (jours ouvrés)" value={delayBusinessDays} onChangeText={props.onDelayChange} keyboardType="number-pad" helper="Le service détermine la date d’exécution à partir de l’échéance et de ce délai." />
      </> : null}
    </Card>
    <View style={styles.heading}><View style={{ flex: 1 }}><Text style={styles.title}>Allocation par support</Text>
      <Text style={styles.helper}>Montant affecté à chaque ISIN ou fonds euro.</Text></View><Text style={styles.badge}>{lines.length} ligne{lines.length===1?"":"s"}</Text></View>
    {lines.map((line, index) => <Card key={line.id} style={styles.card}>
      <View style={styles.lineHead}><Text style={styles.title}>Ligne {index + 1}</Text>
        {lines.length > 1 ? <Pressable onPress={() => props.onRemoveLine(line.id)}><Text style={styles.remove}>Retirer</Text></Pressable> : null}</View>
      <View style={styles.pills}><Pill label="UC · ISIN" active={line.instrumentKind === "uc"} onPress={() => d(line)("instrumentKind", "uc")} />
        <Pill label="Fonds euro" active={line.instrumentKind === "fonds-euro"} onPress={() => d(line)("instrumentKind", "fonds-euro")} /></View>
      {line.instrumentKind === "uc" ? <Text style={styles.helper}>UC signifie « unité de compte ». Le code ISIN identifie chaque support de cette catégorie.</Text> : null}
      {line.instrumentKind === "uc" ? <>
        <TextField label="Code ISIN" value={line.isin} onChangeText={(v) => d(line)("isin", v.toUpperCase().replace(/\s/g, ""))}
          placeholder="Rechercher par nom ou ISIN" autoCapitalize="characters" helper="Choisissez un support déjà saisi ou entrez son ISIN." />
        {line.isin.length > 0 ? <View style={styles.suggestions}>
          {securities.filter((s) => s.isin.toLowerCase().includes(line.isin.toLowerCase()) || s.name.toLowerCase().includes(line.isin.toLowerCase()) || s.shortName.toLowerCase().includes(line.isin.toLowerCase())).slice(0, 5).map((security) => <Pressable key={security.isin} accessibilityRole="button" accessibilityLabel={`Choisir ${security.name}, ISIN ${security.isin}`} onPress={() => d(line)("isin", security.isin)} style={styles.suggestion}>
            <View style={styles.suggestionDot} /><View style={styles.suggestionText}><Text style={styles.suggestionName}>{security.name}</Text><Text style={styles.helper}>{security.symbol ? `${security.symbol} · ` : ""}ISIN {security.isin}</Text></View><Text style={styles.suggestionArrow}>＋</Text>
          </Pressable>)}
          {securities.every((s) => !s.isin.toLowerCase().includes(line.isin.toLowerCase()) && !s.name.toLowerCase().includes(line.isin.toLowerCase()) && !s.shortName.toLowerCase().includes(line.isin.toLowerCase())) ? <Text style={styles.helper}>Aucun support connu ne correspond. Vous pouvez saisir l’ISIN complet manuellement.</Text> : null}
        </View> : securities.length > 0 ? <View style={styles.suggestions}><Text style={styles.helper}>Supports déjà utilisés</Text>{securities.slice(0, 5).map((security) => <Pressable key={security.isin} accessibilityRole="button" onPress={() => d(line)("isin", security.isin)} style={styles.suggestion}><View style={styles.suggestionDot} /><View style={styles.suggestionText}><Text style={styles.suggestionName}>{security.name}</Text><Text style={styles.helper}>{security.symbol ? `${security.symbol} · ` : ""}ISIN {security.isin}</Text></View><Text style={styles.suggestionArrow}>＋</Text></Pressable>)}</View> : null}
      </> : <>
        <TextField label="Nom du fonds euro" value={line.name ?? ""} onChangeText={(v) => d(line)("name", v)} placeholder="Ex. Fonds euro contrat" />
      </>}
      <TextField label="Montant sur ce support" value={String(line.amount || "")} onChangeText={(v) => d(line)("amount", v)} placeholder="0" keyboardType="decimal-pad" suffix="€" />
    </Card>)}
    <Pressable onPress={props.onAddLine} style={styles.add}><Text style={styles.addText}>＋ Ajouter un support</Text></Pressable>
    <Card style={styles.summary}><Text style={styles.title}>Répartition envoyée avec la demande</Text>
      <Text style={styles.helper}>Le service métier vérifiera la cohérence entre le montant et les lignes de supports.</Text></Card>
    <Card style={styles.notice}><Text style={styles.noticeText}>{kind === "dca" ? "Cette fiche décrit votre plan. À la valorisation, le service détaille les achats par échéance. Aucun ordre n’est envoyé au courtier." : "Cette saisie conserve la trace d’un versement déjà réalisé. Aucun ordre n’est envoyé au courtier."}</Text></Card>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <ActionButton label={kind === "dca" ? "Enregistrer le plan →" : "Enregistrer ce versement →"} onPress={props.onSubmit} loading={props.loading} />
  </>;
}

const styles = StyleSheet.create({ card:{gap:16,marginBottom:11}, helper:{color:p.muted,fontSize:12,lineHeight:17}, heading:{flexDirection:"row",alignItems:"center",gap:10,marginTop:18,marginBottom:12}, title:{color:p.ink,fontSize:15,fontWeight:"700"}, badge:{color:p.forestLight,backgroundColor:p.softGreen,overflow:"hidden",padding:8,borderRadius:18}, lineHead:{flexDirection:"row",justifyContent:"space-between"}, remove:{color:p.red,fontSize:12,fontWeight:"600"}, pills:{flexDirection:"row",flexWrap:"wrap",gap:7}, suggestions:{gap:2,borderWidth:1,borderColor:p.line,borderRadius:14,overflow:"hidden",padding:9,backgroundColor:p.surfaceSubtle},suggestion:{minHeight:52,flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:7,borderBottomWidth:1,borderColor:p.line},suggestionDot:{width:9,height:9,borderRadius:5,backgroundColor:p.forestLight},suggestionText:{flex:1,gap:1},suggestionName:{color:p.ink,fontSize:13,fontWeight:"600"},suggestionArrow:{color:p.forestLight,fontSize:18,fontWeight:"700"}, add:{paddingVertical:17},addText:{color:p.forestLight,fontSize:14,fontWeight:"700"},summary:{gap:6,backgroundColor:p.surfaceSubtle,marginBottom:12},notice:{backgroundColor:p.softGreen,marginBottom:12},noticeText:{color:p.ink,fontSize:12,lineHeight:18},error:{color:p.red,fontSize:13,padding:8}});
