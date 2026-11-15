import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AllocationLine, Operation, Security } from "@/domain/models/operation";
import { ActionButton, Card, PageHeading, Pill, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";

const euro=(v:number)=>`${v.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})} €`;
export function ScenarioFormScreen({operation,date,total,lines,securities,annualReturnPct,error,loading,onDateChange,onTotalChange,onAnnualReturnChange,onLineChange,onAddLine,onRemoveLine,onCompare}:{operation:Operation;date:string;total:string;lines:AllocationLine[];securities:Security[];annualReturnPct:string;error:string;loading:boolean;onDateChange:(s:string)=>void;onTotalChange:(s:string)=>void;onAnnualReturnChange:(s:string)=>void;onLineChange:(id:string,field:"isin"|"amount"|"instrumentKind"|"name"|"annualReturnPct",value:string)=>void;onAddLine:()=>void;onRemoveLine:(id:string)=>void;onCompare:()=>void}){
 const kind=operation.kind==="dca"?"montant par échéance":"montant du versement";
 return <>
  <PageHeading eyebrow="Scénario alternatif" title="Et si j’avais choisi…" subtitle="Comparez votre opération réelle à une hypothèse différente, valorisée à la même date." />
  <Card style={styles.base}><Text style={styles.eyebrow}>OPÉRATION CONSERVÉE</Text><Text style={styles.title}>{operation.label} · {euro(operation.amount)}{operation.kind==="dca"?" / mois":""}</Text><Text style={styles.meta}>{formatDateLabel(operation.date)} · {operation.allocations.length} ligne(s)</Text></Card>
  <Card style={styles.card}><Text style={styles.title}>Hypothèse à tester</Text><TextField label="Date de comparaison ou projection" value={date} onChangeText={onDateChange} placeholder="JJ/MM/AAAA"/><TextField label={kind} value={total} onChangeText={onTotalChange} keyboardType="decimal-pad" suffix="€"/><TextField label="Taux annuel (hypothèse)" value={annualReturnPct} onChangeText={onAnnualReturnChange} keyboardType="decimal-pad" suffix="%" helper="Transmis au service pour une projection future."/>
   {lines.map((line,index)=><View key={line.id} style={styles.line}><View style={styles.lineHeader}><Text style={styles.lineTitle}>Support {index+1}</Text>{lines.length>1?<Pressable onPress={()=>onRemoveLine(line.id)}><Text style={styles.remove}>Retirer</Text></Pressable>:null}</View>
    <View style={styles.suggestions}><Pill label="UC · ISIN" active={line.instrumentKind==="uc"} onPress={()=>onLineChange(line.id,"instrumentKind","uc")}/><Pill label="Fonds euro" active={line.instrumentKind==="fonds-euro"} onPress={()=>onLineChange(line.id,"instrumentKind","fonds-euro")}/></View>
    {line.instrumentKind==="uc"?<><TextField label="ISIN" value={line.isin} onChangeText={(v)=>onLineChange(line.id,"isin",v.toUpperCase().replace(/\s/g,""))} placeholder="FR0010380675" autoCapitalize="characters"/>
    <View style={styles.suggestions}>{securities.map((s)=><Pressable key={s.isin} onPress={()=>onLineChange(line.id,"isin",s.isin)}><Text style={styles.suggestion}>{s.shortName}</Text></Pressable>)}</View></>:<><TextField label="Nom du fonds euro" value={line.name??""} onChangeText={(v)=>onLineChange(line.id,"name",v)} placeholder="Fonds euro contrat"/><TextField label="Rendement annuel (hypothèse)" value={String(line.annualReturnPct??"")} onChangeText={(v)=>onLineChange(line.id,"annualReturnPct",v)} keyboardType="decimal-pad" suffix="%"/></>}
    <TextField label="Montant affecté" value={String(line.amount||"")} onChangeText={(v)=>onLineChange(line.id,"amount",v)} keyboardType="decimal-pad" suffix="€"/>
   </View>)}
   <Pressable onPress={onAddLine}><Text style={styles.add}>＋ Ajouter une autre ligne</Text></Pressable>
  </Card>
  {error?<Text style={styles.error}>{error}</Text>:null}<ActionButton label="Comparer les deux scénarios →" onPress={onCompare} loading={loading}/>
 </>;
}
const styles=StyleSheet.create({base:{backgroundColor:p.softGreen,gap:7,marginBottom:12},eyebrow:{color:p.forestLight,fontSize:10,fontWeight:"800",letterSpacing:1},title:{color:p.ink,fontSize:14,fontWeight:"700"},meta:{color:p.muted,fontSize:12,lineHeight:17},card:{gap:14,marginBottom:12},line:{gap:11,borderTopWidth:1,borderColor:p.line,paddingTop:13},lineHeader:{flexDirection:"row",justifyContent:"space-between"},lineTitle:{color:p.ink,fontSize:13,fontWeight:"700"},remove:{color:p.red,fontSize:12},suggestions:{flexDirection:"row",flexWrap:"wrap",gap:8},suggestion:{color:p.forest,fontSize:11,fontWeight:"700",backgroundColor:p.softGreen,borderRadius:14,padding:8},add:{color:p.forest,fontSize:13,fontWeight:"700",padding:5},error:{color:p.red,padding:8}});
