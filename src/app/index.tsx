import { useEffect, useState } from "react";
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AllocationLine, InvestmentComparison, InvestmentValuation, Operation, OperationKind, Portfolio, Security } from "@/domain/models/operation";
import { dependencies } from "@/infrastructure/dependencies";
import { DashboardScreen } from "@/presentation/screens/dashboard-screen";
import { HistoryScreen } from "@/presentation/screens/history-screen";
import { InvestScreen } from "@/presentation/screens/invest-screen";
import { InvestmentFormScreen } from "@/presentation/screens/investment-form-screen";
import { SimulationScreen } from "@/presentation/screens/simulation-screen";
import { ValuationScreen } from "@/presentation/screens/valuation-screen";
import { ScenarioScreen } from "@/presentation/screens/scenario-screen";
import { palette as p } from "@/presentation/theme";

type MainPage="dashboard"|"invest"|"simulation"|"history";
type Page=MainPage|"form"|"valuation"|"scenario";
type FormKind=OperationKind;
const today=()=>new Date().toLocaleDateString("fr-FR");
const parseAmount=(s:string)=>Number(s.replace(",", "."))||0;
const newLine=(isin="FR0010380675",amount=0):AllocationLine=>({id:"line-"+Math.random().toString(36).slice(2),instrumentKind:"uc",isin,amount});

export default function HomeScreen(){
 const [page,setPage]=useState<Page>("dashboard");
 const [returnPage,setReturnPage]=useState<MainPage>("invest");
 const [portfolio,setPortfolio]=useState<Portfolio|null>(null);
 const [securities,setSecurities]=useState<Security[]>([]);
 const [formKind,setFormKind]=useState<FormKind>("versement");
 const [total,setTotal]=useState("500");
 const [lines,setLines]=useState<AllocationLine[]>([]);
 const [date,setDate]=useState(today());
 const [executionDay,setExecutionDay]=useState(10);
 const [delay,setDelay]=useState(3);
 const [selected,setSelected]=useState<Operation|null>(null);
 const [valuation,setValuation]=useState<InvestmentValuation|null>(null);
 const [comparison,setComparison]=useState<InvestmentComparison|null>(null);
 const [error,setError]=useState("");
 const refresh=async()=>{const [pData,sData]=await Promise.all([dependencies.getPortfolio.execute(today()),dependencies.getSecurities.execute()]);setPortfolio(pData);setSecurities(sData);};
 useEffect(()=>{void Promise.all([dependencies.getPortfolio.execute(today()),dependencies.getSecurities.execute()]).then(([pData,sData])=>{setPortfolio(pData);setSecurities(sData);});},[]);
 const goTo=(destination:MainPage)=>{setPage(destination);setError("");};
 const startForm=(kind:FormKind,from:MainPage)=>{setFormKind(kind);setReturnPage(from);const amount=kind==="dca"?100:500;setTotal(String(amount));setLines([newLine("",amount)]);setDate(today());setExecutionDay(10);setDelay(3);setError("");setPage("form");};
 const startValue=(operation:Operation,from:MainPage)=>{setSelected(operation);setDate(today());setValuation(null);setReturnPage(from);setError("");setPage("valuation");void dependencies.valueInvestment.execute(operation,today()).then(setValuation).catch((e)=>setError(e instanceof Error?e.message:"Valorisation impossible."));};
 const startScenario=(operation:Operation,from:MainPage)=>{setSelected(operation);setReturnPage(from);setDate(today());setTotal(String(operation.amount));setLines(operation.allocations.map((line)=>({...line,id:newLine().id})));setComparison(null);setError("");setPage("scenario");};
 const setTotalWithAllocation=(value:string)=>{setTotal(value);const amount=parseAmount(value);setLines((current)=>{if(!current.length)return current;const rest=current.slice(0,-1).reduce((sum,line)=>sum+line.amount,0);const next=[...current];next[next.length-1]={...next[next.length-1],amount:Math.max(0,Math.round((amount-rest)*100)/100)};return next;});};
 const updateLine=(id:string,field:string,value:string)=>{const next=lines.map((line)=>line.id!==id?line:field==="amount"?{...line,amount:parseAmount(value)}:field==="instrumentKind"?{...line,instrumentKind:value as AllocationLine["instrumentKind"],isin:value==="uc"?"":line.isin}:field==="annualReturnPct"?{...line,annualReturnPct:parseAmount(value)}:field==="name"?{...line,name:value,isin:"FONDS-EURO"}:{...line,isin:value});setLines(next);if(field==="amount")setTotal(String(Math.round(next.reduce((s,x)=>s+x.amount,0)*100)/100));};
 const submitOperation=async()=>{try{await dependencies.createOperation.execute({kind:formKind,amount:parseAmount(total),date,allocations:lines, ...(formKind==="dca"?{executionDay,delayBusinessDays:delay}:{})});await refresh();setPage(returnPage);setError("");}catch(e){setError(e instanceof Error?e.message:"Vérifiez les données saisies.");}};
 const valueAtDate=async()=>{if(!selected)return;setError("");setValuation(null);try{setValuation(await dependencies.valueInvestment.execute(selected,date));}catch(e){setError(e instanceof Error?e.message:"Valorisation impossible.");}};
 const compare=async()=>{if(!selected)return;setError("");try{setComparison(await dependencies.compareInvestment.execute(selected,{amount:parseAmount(total),allocations:lines,valuationDate:date}));}catch(e){setComparison(null);setError(e instanceof Error?e.message:"Comparaison impossible.");}};
 const main=page==="dashboard"||page==="invest"||page==="simulation"||page==="history";
 const labels:Record<MainPage,string>={dashboard:"Aperçu",invest:"Journal",simulation:"Simuler",history:"Activité"};
 return <SafeAreaView style={styles.safe} edges={["top","bottom"]}><StatusBar barStyle="dark-content"/>
  {!main?<View style={styles.context}><Pressable onPress={()=>setPage(returnPage)} style={styles.back}><Text style={styles.backText}>‹ Retour</Text></Pressable><Text style={styles.brand}>ALTO<Text style={{color:p.forestLight}}>.</Text></Text><View style={{width:60}}/></View>:null}
  <ScrollView style={styles.scroll} contentContainerStyle={[styles.content,(page==="form"||page==="valuation"||page==="scenario"||page==="simulation")&&styles.narrow]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
   {!portfolio?<Text style={styles.loading}>Chargement…</Text>:<>
    {page==="dashboard"?<DashboardScreen portfolio={portfolio} securities={securities} onInvest={()=>goTo("invest")} onHistory={()=>goTo("history")} onValue={(o)=>startValue(o,"dashboard")}/>:null}
    {page==="invest"?<InvestScreen onVersement={()=>startForm("versement","invest")} onDca={()=>startForm("dca","invest")}/>:null}
    {page==="simulation"?<SimulationScreen operations={portfolio.operations} onValue={(o)=>startValue(o,"simulation")} onCompare={(o)=>startScenario(o,"simulation")}/>:null}
    {page==="history"?<HistoryScreen operations={portfolio.operations} securities={securities} onValue={(o)=>startValue(o,"history")} onCompare={(o)=>startScenario(o,"history")}/>:null}
    {page==="form"?<InvestmentFormScreen kind={formKind} total={total} lines={lines} securities={securities} date={date} executionDay={executionDay} delayBusinessDays={delay} error={error}
      onTotalChange={setTotalWithAllocation} onLineChange={updateLine} onAddLine={()=>setLines((v)=>v.length<8?[...v,newLine("",0)]:v)} onRemoveLine={(id)=>{const next=lines.filter(x=>x.id!==id);setLines(next);setTotal(String(next.reduce((s,x)=>s+x.amount,0)));}} onDateChange={setDate} onExecutionDayChange={setExecutionDay} onDelayChange={setDelay} onSubmit={()=>void submitOperation()}/>:null}
    {page==="valuation"&&selected?<ValuationScreen operation={selected} date={date} result={valuation} error={error} onDateChange={(v)=>{setDate(v);setValuation(null);}} onValue={()=>void valueAtDate()} onCompare={()=>startScenario(selected,returnPage)}/>:null}
    {page==="scenario"&&selected?<ScenarioScreen operation={selected} date={date} total={total} lines={lines} securities={securities} result={comparison} error={error}
      onDateChange={(v)=>{setDate(v);setComparison(null);}} onTotalChange={(v)=>{setComparison(null);setTotalWithAllocation(v);}} onLineChange={(id,field,value)=>{setComparison(null);updateLine(id,field,value);}} onAddLine={()=>{setComparison(null);setLines((v)=>v.length<8?[...v,newLine("",0)]:v);}} onRemoveLine={(id)=>{setComparison(null);const next=lines.filter(x=>x.id!==id);setLines(next);setTotal(String(next.reduce((s,x)=>s+x.amount,0)));}} onCompare={()=>void compare()}/>:null}
   </>}
  </ScrollView>
  {main?<View style={styles.tabs}>{(["dashboard","invest","simulation","history"] as MainPage[]).map((key)=>{const selectedTab=page===key;const symbols:Record<MainPage,string>={dashboard:"◫",invest:"＋",simulation:"⌁",history:"≡"};return <Pressable key={key} onPress={()=>goTo(key)} style={styles.tab}><Text style={[styles.symbol,selectedTab&&styles.active]}>{symbols[key]}</Text><Text style={[styles.tabLabel,selectedTab&&styles.active]}>{labels[key]}</Text></Pressable>;})}</View>:null}
 </SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:p.canvas},scroll:{flex:1},content:{width:"100%",maxWidth:1180,alignSelf:"center",paddingHorizontal:20,paddingTop:16,paddingBottom:24},narrow:{maxWidth:700},context:{height:52,maxWidth:700,width:"100%",alignSelf:"center",paddingHorizontal:20,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderColor:p.line},back:{width:60},backText:{color:p.forest,fontSize:13,fontWeight:"700"},brand:{color:p.ink,fontSize:13,fontWeight:"800",letterSpacing:2},loading:{textAlign:"center",padding:80,color:p.muted},tabs:{minHeight:68,borderTopWidth:1,borderColor:p.line,backgroundColor:p.paper,flexDirection:"row",alignItems:"center",justifyContent:"space-around"},tab:{flex:1,alignItems:"center",justifyContent:"center",gap:3,minHeight:60},symbol:{color:p.muted,fontSize:19,fontWeight:"700"},tabLabel:{color:p.muted,fontSize:10,fontWeight:"600"},active:{color:p.forest,fontWeight:"800"}});
