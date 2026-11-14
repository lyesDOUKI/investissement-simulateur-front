import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Operation, Security } from "@/domain/models/operation";
import { Card, PageHeading, text } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";
const euro=(v:number)=>v.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
export function HistoryScreen({operations,securities,onValue,onCompare}:{operations:Operation[];securities:Security[];onValue:(o:Operation)=>void;onCompare:(o:Operation)=>void}){
 return <><PageHeading eyebrow="Journal personnel" title="Mon suivi" subtitle="Vos versements réalisés et les paramètres des plans DCA que vous suivez chez votre courtier."/>
  <View style={styles.summary}><Text style={styles.summaryNumber}>{operations.length}</Text><Text style={styles.summaryText}>enregistrement{operations.length===1?"":"s"} dans votre session de démonstration</Text></View>
  {operations.length===0?<Card><Text style={text.label}>Votre historique apparaîtra après votre première saisie.</Text></Card>:operations.map((o)=><Card key={o.id} style={styles.card}>
    <View style={styles.row}><View style={styles.icon}><Text style={styles.iconText}>{o.kind==="dca"?"↻":"↑"}</Text></View><View style={{flex:1,gap:3}}><Text style={styles.title}>{o.label}</Text><Text style={styles.meta}>{formatDateLabel(o.date)} · {o.kind==="dca"?euro(o.amount)+" / échéance":euro(o.amount)}</Text></View><Text style={styles.amount}>{o.kind==="dca"?"DCA":"Versement"}</Text></View>
    <Text style={styles.meta}>{o.detail}</Text>
    {o.allocations.map((line)=><View key={line.id} style={styles.allocation}><Text style={styles.dot}>●</Text><Text style={styles.allocName}>{securities.find(s=>s.isin===line.isin)?.shortName??line.name??line.isin}</Text><Text style={styles.allocAmount}>{euro(line.amount)}</Text></View>)}
    <View style={styles.actions}><Pressable onPress={()=>onValue(o)}><Text style={styles.action}>Valoriser à une date →</Text></Pressable><Pressable onPress={()=>onCompare(o)}><Text style={styles.action}>Et si ? →</Text></Pressable></View>
  </Card>)}
  <Text style={styles.disclaimer}>Les opérations et valorisations sont des données de démonstration conservées en mémoire pendant cette session.</Text>
 </>;
}
const styles=StyleSheet.create({summary:{flexDirection:"row",alignItems:"center",gap:10,backgroundColor:p.softGreen,borderRadius:18,padding:16,marginBottom:18},summaryNumber:{fontSize:24,color:p.forest,fontWeight:"700"},summaryText:{color:p.forest,fontSize:12},card:{gap:12,marginBottom:10},row:{flexDirection:"row",alignItems:"center",gap:10},icon:{width:38,height:38,borderRadius:14,backgroundColor:p.softGreen,alignItems:"center",justifyContent:"center"},iconText:{color:p.forest,fontSize:18,fontWeight:"700"},title:{color:p.ink,fontSize:14,fontWeight:"700"},meta:{color:p.muted,fontSize:12,lineHeight:17},amount:{color:p.forest,fontSize:11,fontWeight:"700"},allocation:{flexDirection:"row",alignItems:"center",gap:8},dot:{color:p.forestLight,fontSize:8},allocName:{flex:1,color:p.ink,fontSize:12},allocAmount:{color:p.ink,fontSize:12,fontWeight:"600"},actions:{borderTopWidth:1,borderColor:p.line,paddingTop:12,flexDirection:"row",justifyContent:"space-between"},action:{color:p.forest,fontSize:12,fontWeight:"700"},disclaimer:{color:p.muted,fontSize:11,lineHeight:16,marginTop:8}});
