import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AllocationLine, InvestmentComparison, InvestmentValuation, Operation, OperationKind, Portfolio, Security } from "@/domain/models/operation";
import { dependencies } from "@/infrastructure/dependencies";
import { DashboardScreen } from "@/presentation/screens/dashboard-screen";
import { HistoryScreen } from "@/presentation/screens/history-screen";
import { InvestmentFormScreen } from "@/presentation/screens/investment-form-screen";
import { ComparisonResultScreen } from "@/presentation/screens/comparison-result-screen";
import { SimulationScreen } from "@/presentation/screens/simulation-screen";
import { ValuationResultScreen } from "@/presentation/screens/valuation-screen";
import { ScenarioFormScreen } from "@/presentation/screens/scenario-screen";
import { palette as p } from "@/presentation/theme";

type MainPage="dashboard"|"history"|"simulation";
type Page=MainPage|"form"|"valuation-result"|"scenario-form"|"comparison-result";
const today=()=>new Date().toLocaleDateString("fr-FR");
const amountValue=(input:string)=>Number(input.replace(",", "."))||0;
let nextLineId=0;
const newLine=(isin="",amount=0):AllocationLine=>({id:"line-"+(++nextLineId),instrumentKind:"uc",isin,amount});

export default function HomeScreen(){
 const [page,setPage]=useState<Page>("dashboard");
 const [returnPage,setReturnPage]=useState<Page>("dashboard");
 const [portfolio,setPortfolio]=useState<Portfolio|null>(null);
 const [securities,setSecurities]=useState<Security[]>([]);
 const [formKind,setFormKind]=useState<OperationKind>("versement");
 const [total,setTotal]=useState("500");
 const [lines,setLines]=useState<AllocationLine[]>([]);
 const [date,setDate]=useState(today());
 const [executionDay,setExecutionDay]=useState("10");
 const [delay,setDelay]=useState("3");
 const [annualReturnPct,setAnnualReturnPct]=useState("5");
 const [selected,setSelected]=useState<Operation|null>(null);
 const [valuation,setValuation]=useState<InvestmentValuation|null>(null);
 const [comparison,setComparison]=useState<InvestmentComparison|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);

 const refresh=async()=>{const [nextPortfolio,nextSecurities]=await Promise.all([dependencies.getPortfolio.execute(today()),dependencies.getSecurities.execute()]);setPortfolio(nextPortfolio);setSecurities(nextSecurities);};
 useEffect(()=>{void Promise.all([dependencies.getPortfolio.execute(today()),dependencies.getSecurities.execute()]).then(([nextPortfolio,nextSecurities])=>{setPortfolio(nextPortfolio);setSecurities(nextSecurities);});},[]);
 const goTo=(destination:MainPage)=>{setPage(destination);setError("");};
 const goBack=()=>{setPage(page==="comparison-result"?"scenario-form":returnPage);setError("");};
 const startForm=(kind:OperationKind,from:MainPage)=>{setFormKind(kind);setReturnPage(from);setTotal(kind==="dca"?"100":"500");setLines([newLine("",kind==="dca"?100:500)]);setDate(today());setExecutionDay("10");setDelay("3");setAnnualReturnPct("5");setError("");setPage("form");};
 const startValue=(operation:Operation,from:MainPage)=>{setSelected(operation);setDate(today());setAnnualReturnPct(String(operation.annualReturnPct??5));setValuation(null);setReturnPage(from);setError("");setPage("valuation-result");setLoading(true);void dependencies.valueInvestment.execute(operation,{valuationDate:today(),annualReturnPct:operation.annualReturnPct??5}).then(setValuation).catch((caught)=>setError(caught instanceof Error?caught.message:"Valorisation impossible.")).finally(()=>setLoading(false));};
 const startScenario=(operation:Operation,from:Page)=>{setSelected(operation);setReturnPage(from);setDate(today());setTotal(String(operation.amount));setLines(operation.allocations.map((line)=>({...line,id:"line-"+(++nextLineId)})));setAnnualReturnPct(String(operation.annualReturnPct??5));setComparison(null);setError("");setPage("scenario-form");};
 const updateLine=(id:string,field:string,value:string)=>setLines((current)=>current.map((line)=>line.id!==id?line:field==="amount"?{...line,amount:amountValue(value)}:field==="instrumentKind"?{...line,instrumentKind:value as AllocationLine["instrumentKind"],isin:value==="uc"?"":line.isin}:field==="annualReturnPct"?{...line,annualReturnPct:amountValue(value)}:field==="name"?{...line,name:value,isin:"FONDS-EURO"}:{...line,isin:value}));

 const submitOperation=async()=>{setLoading(true);setError("");try{await dependencies.createOperation.execute({kind:formKind,amount:amountValue(total),date,allocations:lines,annualReturnPct:formKind==="versement"?amountValue(annualReturnPct):undefined,...(formKind==="dca"?{executionDay:amountValue(executionDay),delayBusinessDays:amountValue(delay)}:{})});await refresh();setPage("history");}catch(caught){setError(caught instanceof Error?caught.message:"La demande n’a pas abouti.");}finally{setLoading(false);}};
 const valueAtDate=async()=>{if(!selected)return;setLoading(true);setError("");setValuation(null);try{setValuation(await dependencies.valueInvestment.execute(selected,{valuationDate:date,annualReturnPct:amountValue(annualReturnPct)}));}catch(caught){setError(caught instanceof Error?caught.message:"La demande n’a pas abouti.");}finally{setLoading(false);}};
 const compare=async()=>{if(!selected)return;setLoading(true);setError("");setComparison(null);try{setComparison(await dependencies.compareInvestment.execute(selected,{amount:amountValue(total),allocations:lines,valuationDate:date,annualReturnPct:amountValue(annualReturnPct)}));setPage("comparison-result");}catch(caught){setError(caught instanceof Error?caught.message:"La demande n’a pas abouti.");}finally{setLoading(false);}};

 const main=page==="dashboard"||page==="simulation"||page==="history";
 const labels:Record<MainPage,string>={dashboard:"Aperçu",history:"Journal",simulation:"Simuler"};
 return <SafeAreaView style={styles.safe} edges={["top","bottom"]}><StatusBar barStyle="dark-content"/>
  {!main?<View style={styles.context}><Pressable onPress={goBack} style={styles.back}><Text style={styles.backText}>‹ Retour</Text></Pressable><Text style={styles.brand}>ALTO<Text style={{color:p.forestLight}}>.</Text></Text><View style={{width:60}}/></View>:null}
  <ScrollView style={styles.scroll} contentContainerStyle={[styles.content,(page==="form"||page==="valuation-result"||page==="scenario-form"||page==="simulation")&&styles.narrow]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
   {!portfolio?<View style={styles.initialLoading}><ActivityIndicator color={p.forest}/><Text style={styles.loadingText}>Chargement de votre espace…</Text></View>:<>
    {page==="dashboard"?<DashboardScreen portfolio={portfolio} securities={securities} onAddVersement={()=>startForm("versement","dashboard")} onAddDca={()=>startForm("dca","dashboard")} onHistory={()=>goTo("history")} onValue={(o)=>startValue(o,"dashboard")}/>:null}
    {page==="simulation"?<SimulationScreen operations={portfolio.operations} onValue={(o)=>startValue(o,"simulation")} onCompare={(o)=>startScenario(o,"simulation")}/>:null}
    {page==="history"?<HistoryScreen operations={portfolio.operations} securities={securities} onValue={(o)=>startValue(o,"history")} onCompare={(o)=>startScenario(o,"history")} onVersement={()=>startForm("versement","history")} onDca={()=>startForm("dca","history")}/>:null}
    {page==="form"?<InvestmentFormScreen kind={formKind} total={total} lines={lines} securities={securities} date={date} executionDay={executionDay} delayBusinessDays={delay} annualReturnPct={annualReturnPct} loading={loading} error={error}
      onTotalChange={setTotal} onLineChange={updateLine} onAddLine={()=>setLines((current)=>[...current,newLine()])} onRemoveLine={(id)=>setLines((current)=>current.filter((line)=>line.id!==id))} onDateChange={setDate} onExecutionDayChange={setExecutionDay} onDelayChange={setDelay} onAnnualReturnChange={setAnnualReturnPct} onSubmit={()=>void submitOperation()}/>:null}
    {page==="valuation-result"&&selected?<ValuationResultScreen operation={selected} date={date} annualReturnPct={annualReturnPct} result={valuation} error={error} loading={loading} onDateChange={(v)=>{setDate(v);setValuation(null);}} onAnnualReturnChange={(v)=>{setAnnualReturnPct(v);setValuation(null);}} onValue={()=>void valueAtDate()} onCompare={()=>startScenario(selected,"valuation-result")}/>:null}
    {page==="scenario-form"&&selected?<ScenarioFormScreen operation={selected} date={date} total={total} lines={lines} securities={securities} annualReturnPct={annualReturnPct} error={error} loading={loading}
      onDateChange={(v)=>{setDate(v);setComparison(null);}} onTotalChange={(v)=>{setTotal(v);setComparison(null);}} onAnnualReturnChange={(v)=>{setAnnualReturnPct(v);setComparison(null);}} onLineChange={(id,field,value)=>{setComparison(null);updateLine(id,field,value);}} onAddLine={()=>{setComparison(null);setLines((current)=>[...current,newLine()]);}} onRemoveLine={(id)=>{setComparison(null);setLines((current)=>current.filter((line)=>line.id!==id));}} onCompare={()=>void compare()}/>:null}
    {page==="comparison-result"&&comparison?<ComparisonResultScreen result={comparison} onAdjust={()=>setPage("scenario-form")}/>:null}
   </>}
  </ScrollView>
  {main?<View style={styles.tabs}>{(["dashboard","history","simulation"] as MainPage[]).map((key)=>{const selectedTab=page===key;const symbols:Record<MainPage,string>={dashboard:"⌂",history:"≡",simulation:"⌁"};return <Pressable key={key} onPress={()=>goTo(key)} style={styles.tab}><Text style={[styles.symbol,selectedTab&&styles.active]}>{symbols[key]}</Text><Text style={[styles.tabLabel,selectedTab&&styles.active]}>{labels[key]}</Text></Pressable>;})}</View>:null}
 </SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:p.canvas},scroll:{flex:1},content:{width:"100%",maxWidth:1180,alignSelf:"center",paddingHorizontal:20,paddingTop:16,paddingBottom:24},narrow:{maxWidth:700},context:{height:52,maxWidth:700,width:"100%",alignSelf:"center",paddingHorizontal:20,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderColor:p.line},back:{width:60},backText:{color:p.forest,fontSize:13,fontWeight:"700"},brand:{color:p.ink,fontSize:13,fontWeight:"800",letterSpacing:2},initialLoading:{minHeight:400,alignItems:"center",justifyContent:"center",gap:12},loadingText:{color:p.muted,fontSize:13},tabs:{minHeight:68,borderTopWidth:1,borderColor:p.line,backgroundColor:p.paper,flexDirection:"row",alignItems:"center",justifyContent:"space-around"},tab:{flex:1,alignItems:"center",justifyContent:"center",gap:3,minHeight:60},symbol:{color:p.muted,fontSize:19,fontWeight:"700"},tabLabel:{color:p.muted,fontSize:10,fontWeight:"600"},active:{color:p.forest,fontWeight:"800"}});
