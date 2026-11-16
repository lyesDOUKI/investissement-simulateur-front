import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Operation } from "@/domain/models/operation";
import { ActionButton, Card, PageHeading, text } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";

export function SimulationScreen({ operations, onValue, onCompare, compareEnabled, onJournal }: {
  operations: Operation[]; onValue: (operation: Operation) => void; onCompare: (operation: Operation) => void; compareEnabled: boolean; onJournal: () => void;
}) {
  return <>
    <PageHeading eyebrow="Et si ?" title="Simuler un autre choix" subtitle="Partez d’un versement ou d’un plan à versements réguliers, puis changez la date, le montant ou l’allocation." />
    <Card style={styles.intro}><Text style={styles.introTitle}>Une simulation ancrée dans votre historique</Text><Text style={text.label}>Comparez un versement ou un plan à versements réguliers (DCA) à une autre hypothèse. Les réponses sont fournies par le service, et le scénario reste temporaire.</Text></Card>
    <Text style={styles.label}>CHOISIR UNE OPÉRATION DE DÉPART</Text>
    {operations.length === 0 ? <Card style={styles.empty}><Text style={styles.title}>Commencez par une opération de référence</Text><Text style={text.label}>Saisissez un versement ou un plan à versements réguliers dans le Journal, puis revenez ici pour créer une comparaison.</Text><ActionButton label="Ouvrir le journal →" tone="light" onPress={onJournal}/></Card> : operations.map((operation) => <Card key={operation.id} style={styles.item}>
      <View style={styles.row}><View style={styles.icon}><Text style={styles.iconText}>{operation.kind === "dca" ? "↻" : "↑"}</Text></View><View style={{flex:1,gap:4}}><Text style={styles.title}>{operation.label}</Text><Text style={styles.meta}>{formatDateLabel(operation.date)} · {operation.allocations.length} support{operation.allocations.length===1?"":"s"}</Text></View><Text style={styles.amount}>{operation.amount.toLocaleString("fr-FR")} €</Text></View>
      <View style={styles.actions}><Pressable onPress={() => onValue(operation)}><Text style={styles.action}>Voir sa valeur à une date →</Text></Pressable>{compareEnabled?<Pressable onPress={() => onCompare(operation)}><Text style={styles.action}>Comparer un scénario →</Text></Pressable>:null}</View>
    </Card>)}
  </>;
}
const styles=StyleSheet.create({intro:{backgroundColor:p.softGreen,gap:8,marginBottom:22},introTitle:{color:p.forestLight,fontSize:15,fontWeight:"700"},label:{color:p.muted,fontSize:10,fontWeight:"800",letterSpacing:1.2,marginBottom:10},empty:{gap:12},item:{gap:14,marginBottom:10},row:{flexDirection:"row",alignItems:"center",gap:11},icon:{width:38,height:38,borderRadius:14,backgroundColor:p.softGreen,alignItems:"center",justifyContent:"center"},iconText:{color:p.forestLight,fontSize:18,fontWeight:"700"},title:{color:p.ink,fontSize:14,fontWeight:"700"},meta:{color:p.muted,fontSize:12},amount:{color:p.ink,fontSize:13,fontWeight:"700"},actions:{borderTopWidth:1,borderColor:p.line,paddingTop:12,flexDirection:"row",justifyContent:"space-between",gap:10},action:{color:p.forestLight,fontSize:12,fontWeight:"700"}});
