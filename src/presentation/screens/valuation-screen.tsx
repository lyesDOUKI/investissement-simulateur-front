import { StyleSheet, Text, View } from "react-native";
import type { InvestmentValuation, Operation } from "@/domain/models/operation";
import { ActionButton, Card, Divider, PageHeading, TextField } from "@/presentation/components/investment-ui";
import { palette as p } from "@/presentation/theme";
import { formatDateLabel } from "@/presentation/utils/format-date";

const euro=(v:number)=>`${v.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})} €`;
const fixed=(v:number,n=6)=>v.toLocaleString("fr-FR",{minimumFractionDigits:n,maximumFractionDigits:n});
export function ValuationScreen({operation,date,annualReturnPct,result,error,loading,onDateChange,onAnnualReturnChange,onValue,onCompare}:{operation:Operation;date:string;annualReturnPct:string;result:InvestmentValuation|null;error:string;loading:boolean;onDateChange:(s:string)=>void;onAnnualReturnChange:(s:string)=>void;onValue:()=>void;onCompare:()=>void}) {
 return <>
  <PageHeading eyebrow="Suivi · valorisation" title="Valeur à une autre date" subtitle="Rejouez les achats historiques de cette opération à la date choisie." />
  <Card style={styles.card}><Text style={styles.title}>{operation.label}</Text><Text style={styles.meta}>{formatDateLabel(operation.date)} · {operation.kind==="dca"?`DCA mensuel, ${operation.amount} € / échéance`:`Versement de ${euro(operation.amount)}`}</Text>
    <TextField label="Date de valorisation ou projection" value={date} onChangeText={onDateChange} placeholder="JJ/MM/AAAA" helper="Le service métier décide des données disponibles et du traitement de cette date." />
    <TextField label="Taux annuel (hypothèse)" value={annualReturnPct} onChangeText={onAnnualReturnChange} keyboardType="decimal-pad" suffix="%" helper="Transmis avec la demande lorsqu’une projection future est souhaitée." />
  </Card>
  <ActionButton label="Demander la valorisation →" tone="light" onPress={onValue} loading={loading}/>
  {result ? <>
    <Card style={styles.hero}><Text style={styles.heroLabel}>Réponse du service · {formatDateLabel(result.valuationDate)}</Text><Text style={styles.heroValue}>{euro(result.value)}</Text><Text style={styles.gain}>{result.gain>=0?"+":""}{euro(result.gain)} · {result.gainRatePct.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})} %</Text><Divider/><Text style={styles.heroLabel}>Capital investi : {euro(result.invested)}{operation.kind==="dca"?` · ${result.installmentCount} échéances exécutées`:""}</Text>{result.assumptionPct!==undefined?<Text style={styles.heroLabel}>Hypothèse transmise : {result.assumptionPct} % / an</Text>:null}</Card>
    {result.hasMissingPrices?<Card style={styles.warning}><Text style={styles.warningText}>Cours manquant pour au moins un support. La valeur affichée est partielle ; aucune performance n’est inventée.</Text></Card>:null}
    <Text style={styles.section}>DÉTAIL PAR SUPPORT</Text>
    {result.allocations.map((a)=> <Card key={`${a.instrumentKind}-${a.isin}`} style={styles.card}><View style={styles.row}><Text style={styles.title}>{a.name}</Text><Text style={styles.value}>{euro(a.value)}</Text></View><Text style={styles.meta}>{a.instrumentKind==="uc"?a.isin:"Fonds euro · rendement estimé"}</Text><Text style={styles.meta}>Investi {euro(a.invested)} · {a.instrumentKind==="uc"?`${fixed(a.shares)} parts`:"valorisation capitalisée"}</Text><Text style={styles.meta}>{a.instrumentKind==="uc"?`Cours ${a.observedPrice?euro(a.observedPrice):"indisponible"} au ${a.observedDate?formatDateLabel(a.observedDate):"—"}`:`Hypothèse annuelle ${a.status==="rendement-estime"?"· estimation":""}`}</Text><Text style={a.gain>=0?styles.gain:styles.loss}>{a.gain>=0?"+":""}{euro(a.gain)}</Text></Card>)}
    {result.installments.length?<><Text style={styles.section}>ÉCHÉANCES RECONSTITUÉES</Text><Card style={styles.card}>{result.installments.map((i,index)=><View key={`${i.executionDate}-${index}`} style={styles.installment}><Text style={styles.title}>Échéance {formatDateLabel(i.dueDate)}</Text><Text style={styles.meta}>Exécutée le {formatDateLabel(i.executionDate)} · {euro(i.amount)}</Text>{i.allocations.map((a,j)=><Text key={j} style={styles.meta}>{a.isin} · {a.purchasePrice?`${fixed(a.shares)} parts à ${euro(a.purchasePrice)} (${formatDateLabel(a.purchasePriceDate??i.executionDate)})`:a.status==="cours-indisponible"?"cours indisponible":"rendement estimé"}</Text>)}{index<result.installments.length-1?<Divider/>:null}</View>)}</Card></>:null}
    <ActionButton label="Comparer avec d’autres paramètres →" tone="light" onPress={onCompare}/>
    <Text style={styles.disclaimer}>Réponse de démonstration préfabriquée. En production, ces données viendront du service métier. Aucun ordre n’est transmis au courtier.</Text>
  </>:null}
  {error?<Text style={styles.error}>{error}</Text>:null}
 </>;
}
const styles=StyleSheet.create({card:{gap:9,marginBottom:10},title:{color:p.ink,fontSize:14,fontWeight:"700"},meta:{color:p.muted,fontSize:12,lineHeight:17},value:{color:p.ink,fontWeight:"700"},row:{flexDirection:"row",justifyContent:"space-between",gap:8},hero:{backgroundColor:p.forest,borderColor:p.forest,gap:9,marginBottom:14},heroLabel:{color:"#C8D7CF",fontSize:12},heroValue:{color:p.paper,fontSize:34,fontWeight:"700"},gain:{color:p.mint,fontSize:13,fontWeight:"700"},loss:{color:p.red,fontSize:12,fontWeight:"700"},section:{color:p.muted,fontSize:10,fontWeight:"800",letterSpacing:1.2,marginTop:16,marginBottom:9},warning:{backgroundColor:"#FFF5E6",marginBottom:13},warningText:{color:"#8A5B16",fontSize:12,lineHeight:18},installment:{gap:7,paddingVertical:8},disclaimer:{color:p.muted,fontSize:11,lineHeight:17,marginTop:14},error:{color:p.red,padding:8}});
