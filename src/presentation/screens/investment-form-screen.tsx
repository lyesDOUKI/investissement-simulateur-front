import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Security } from "@/domain/models/operation";
import type { AllocationDraft, AllocationDraftField } from "@/presentation/models/allocation-draft";
import { ActionButton, Card, PageHeading, Pill, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { DateField } from "@/presentation/components/date-field";

type ChangeField = AllocationDraftField;

export function InvestmentFormScreen(props: {
  kind: "versement" | "dca"; total: string; lines: AllocationDraft[]; securities: Security[];
  editingExistingPlan?: boolean;
  date: string; executionDay: string; delayBusinessDays: string; error: string;
  loading: boolean; autoSyncSingleSupport: boolean;
  onTotalChange: (value: string) => void; onLineChange: (id: string, field: ChangeField, value: string) => void;
  onAddLine: () => void; onRemoveLine: (id: string) => void; onDateChange: (value: string) => void;
  onExecutionDayChange: (value: string) => void; onDelayChange: (value: string) => void; onSubmit: () => void;
}) {
  const { kind, total, lines, securities, date, executionDay, delayBusinessDays, error, editingExistingPlan = false } = props;
  const editingDca = kind === "dca" && editingExistingPlan;
  const d = (line: AllocationDraft) => (field: ChangeField, value: string) => props.onLineChange(line.id, field, value);
  return <>
    <PageHeading eyebrow={kind === "dca" ? "Versements réguliers · DCA" : "Historique réel"}
      title={editingDca ? "Modifier le plan DCA" : kind === "dca" ? "Enregistrer un plan d’investissement" : "Enregistrer un versement"}
      subtitle={editingDca ? "Ajustez la mensualité et les supports. Les échéances déjà passées conserveront leur historique." : kind === "dca" ? "Un plan DCA investit régulièrement sur les supports choisis. Saisissez son montant, son calendrier et sa répartition ; chaque échéance sera détaillée ensuite." : "Ajoutez une trace d’un versement déjà effectué chez votre courtier."} />
    <Card nativeID="alto-operation-parameters" style={styles.card}>
      <TextField label={kind === "dca" ? "Montant à chaque échéance" : "Montant versé"} value={total}
        onChangeText={props.onTotalChange} placeholder="Ex. 500,00" keyboardType="decimal-pad" suffix="€" helper={kind === "dca" ? "Montant total investi chaque mois, réparti entre les supports ci-dessous." : "Montant total de ce versement déjà réalisé."} />
      {!editingDca ? <DateField label={kind === "dca" ? "Date de démarrage du plan" : "Date réelle du versement"} value={date}
        onChange={props.onDateChange} helper={kind === "dca" ? "Date de mise en place du plan." : "Date à laquelle le versement a été exécuté chez votre courtier."} />
      : null}
      {kind === "dca" && !editingDca ? <>
        <TextField label="Jour de l’échéance chaque mois" value={executionDay} onChangeText={props.onExecutionDayChange} keyboardType="number-pad" helper="Jour du mois qui sert de base au calcul des échéances." />
        <TextField label="Délai avant exécution (jours ouvrés)" value={delayBusinessDays} onChangeText={props.onDelayChange} keyboardType="number-pad" helper="Le service détermine la date d’exécution à partir de l’échéance et de ce délai." />
      </> : null}
    </Card>
    <View style={styles.heading}><View style={{ flex: 1 }}><Text style={styles.title}>Répartition entre les supports</Text>
      <Text style={styles.helper}>{props.autoSyncSingleSupport ? "Avec un seul support, son montant suit automatiquement le total. Ajoutez un support pour définir une répartition manuelle." : "Répartissez le montant total entre les supports. La somme des lignes doit correspondre au montant saisi."}</Text></View><Text style={styles.badge}>{lines.length} ligne{lines.length===1?"":"s"}</Text></View>
    <View nativeID="alto-investment-supports">{lines.map((line, index) => <Card key={line.id} style={styles.card}>
      <View style={styles.lineHead}><Text style={styles.title}>Ligne {index + 1}</Text>
        {lines.length > 1 ? <Pressable onPress={() => props.onRemoveLine(line.id)}><Text style={styles.remove}>Retirer</Text></Pressable> : null}</View>
      <View style={styles.pills}><Pill label="UC · ISIN" active={line.instrumentKind === "uc"} onPress={() => d(line)("instrumentKind", "uc")} />
        <Pill label="Fonds euro" active={line.instrumentKind === "fonds-euro"} onPress={() => d(line)("instrumentKind", "fonds-euro")} /></View>
      {line.instrumentKind === "uc" ? <>
        <Text style={styles.helper}>Commencez par le symbole, le nom ou l’ISIN. Le symbole est affiché en premier pour reconnaître rapidement le support ; l’ISIN reste l’identifiant transmis au service.</Text>
        <TextField label="Rechercher un support" value={line.isin} onChangeText={(v) => d(line)("isin", v.toUpperCase().replace(/\s/g, ""))}
          placeholder="Ex. AF.PA, MSCI World ou FR…" autoCapitalize="characters" helper="Sélectionnez une suggestion pour renseigner automatiquement l’ISIN complet." />
        {line.isin.length > 0 ? <View style={styles.suggestions}>
          {securities.filter((s) => s.isin.toLowerCase().includes(line.isin.toLowerCase()) || s.name.toLowerCase().includes(line.isin.toLowerCase()) || s.shortName.toLowerCase().includes(line.isin.toLowerCase()) || s.symbol?.toLowerCase().includes(line.isin.toLowerCase())).slice(0, 5).map((security) => <Pressable key={security.isin} accessibilityRole="button" accessibilityLabel={`Choisir ${security.name}, ${security.symbol ? `symbole ${security.symbol}, ` : ""}ISIN ${security.isin}`} onPress={() => d(line)("isin", security.isin)} style={styles.suggestion}>
            <View style={styles.suggestionDot} /><View style={styles.suggestionText}><Text style={styles.suggestionName}>{security.symbol ?? security.shortName}</Text><Text style={styles.suggestionMeta}>{security.name !== (security.symbol ?? security.shortName) ? security.name + " · " : ""}ISIN {security.isin}</Text></View><Text style={styles.suggestionArrow}>＋</Text>
          </Pressable>)}
          {securities.every((s) => !s.isin.toLowerCase().includes(line.isin.toLowerCase()) && !s.name.toLowerCase().includes(line.isin.toLowerCase()) && !s.shortName.toLowerCase().includes(line.isin.toLowerCase()) && !s.symbol?.toLowerCase().includes(line.isin.toLowerCase())) ? <Text style={styles.helper}>Aucun support connu ne correspond. Vous pouvez saisir l’ISIN complet manuellement.</Text> : null}
        </View> : securities.length > 0 ? <View style={styles.suggestions}><Text style={styles.helper}>Supports déjà suivis</Text>{securities.slice(0, 5).map((security) => <Pressable key={security.isin} accessibilityRole="button" accessibilityLabel={`Sélectionner ${security.symbol ?? security.shortName}, ISIN ${security.isin}`} onPress={() => d(line)("isin", security.isin)} style={styles.suggestion}><View style={styles.suggestionDot} /><View style={styles.suggestionText}><Text style={styles.suggestionName}>{security.symbol ?? security.shortName}</Text><Text style={styles.suggestionMeta}>{security.name !== (security.symbol ?? security.shortName) ? security.name + " · " : ""}ISIN {security.isin}</Text></View><Text style={styles.suggestionArrow}>＋</Text></Pressable>)}</View> : null}
      </> : <>
        <TextField label="Nom du fonds euro" value={line.name ?? ""} onChangeText={(v) => d(line)("name", v)} placeholder="Ex. Fonds euro contrat" />
      </>}
      <TextField label="Montant sur ce support" value={String(line.amount || "")} onChangeText={(v) => d(line)("amount", v)} placeholder="0" keyboardType="decimal-pad" suffix="€" editable={!props.autoSyncSingleSupport} helper={props.autoSyncSingleSupport ? "100 % du montant total ; mis à jour automatiquement." : undefined} />
    </Card>)}</View>
    <Pressable onPress={props.onAddLine} style={styles.add}><Text style={styles.addText}>＋ Ajouter un support</Text></Pressable>
    <Card style={styles.summary}><Text style={styles.title}>{editingDca ? "Vérifiez la nouvelle configuration" : "À vérifier avant l’enregistrement"}</Text>
      <Text style={styles.helper}>{editingDca ? "Le montant mensuel doit correspondre au total réparti entre les supports." : "Chaque ligne correspond au montant affecté à un support. Vérifiez que leur somme correspond au montant du versement ou de chaque échéance."}</Text></Card>
    <Card style={styles.notice}><Text style={styles.noticeText}>{editingDca ? "Cette modification crée une nouvelle révision à partir de la prochaine échéance concernée. Les échéances passées restent inchangées." : kind === "dca" ? "Cette fiche décrit votre plan. À la valorisation, le service de calcul détaille les parts et les cours par échéance. Aucun ordre n’est envoyé au courtier." : "Cette saisie conserve la trace d’un versement déjà réalisé. Aucun ordre n’est envoyé au courtier."}</Text></Card>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <ActionButton label={editingDca ? "Enregistrer cette révision →" : kind === "dca" ? "Enregistrer le plan →" : "Enregistrer ce versement →"} onPress={props.onSubmit} loading={props.loading} />
  </>;
}

const styles = StyleSheet.create({ card:{gap:16,marginBottom:11}, helper:{color:p.muted,fontSize:12,lineHeight:17}, heading:{flexDirection:"row",alignItems:"center",gap:10,marginTop:18,marginBottom:12}, title:{color:p.ink,fontSize:15,fontWeight:"700"}, badge:{color:p.forestLight,backgroundColor:p.softGreen,overflow:"hidden",padding:8,borderRadius:18}, lineHead:{flexDirection:"row",justifyContent:"space-between"}, remove:{color:p.red,fontSize:12,fontWeight:"600"}, pills:{flexDirection:"row",flexWrap:"wrap",gap:7}, suggestions:{gap:2,borderWidth:1,borderColor:p.line,borderRadius:14,overflow:"hidden",padding:9,backgroundColor:p.surfaceSubtle},suggestion:{minHeight:52,flexDirection:"row",alignItems:"center",gap:10,paddingHorizontal:7,borderBottomWidth:1,borderColor:p.line},suggestionDot:{width:9,height:9,borderRadius:5,backgroundColor:p.forestLight},suggestionText:{flex:1,gap:1},suggestionName:{color:p.forestLight,fontSize:13,fontWeight:"800",letterSpacing:.2},suggestionMeta:{color:p.muted,fontSize:11,lineHeight:16},suggestionArrow:{color:p.forestLight,fontSize:18,fontWeight:"700"}, add:{paddingVertical:17},addText:{color:p.forestLight,fontSize:14,fontWeight:"700"},summary:{gap:6,backgroundColor:p.surfaceSubtle,marginBottom:12},notice:{backgroundColor:p.softGreen,marginBottom:12},noticeText:{color:p.ink,fontSize:12,lineHeight:18},error:{color:p.red,fontSize:13,padding:8}});
