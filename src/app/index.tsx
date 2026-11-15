import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AllocationLine, InvestmentComparison, InvestmentValuation, Operation, OperationKind, Portfolio, ScenarioInput, Security } from "@/domain/models/operation";
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
 const [backStack,setBackStack]=useState<Page[]>([]);
 const [portfolio,setPortfolio]=useState<Portfolio|null>(null);
 const [securities,setSecurities]=useState<Security[]>([]);
 const [formKind,setFormKind]=useState<OperationKind>("versement");
 const [total,setTotal]=useState("500");
 const [lines,setLines]=useState<AllocationLine[]>([]);
 const [date,setDate]=useState(today());
 const [scenarioStartDate,setScenarioStartDate]=useState(today());
 const [executionDay,setExecutionDay]=useState("10");
 const [delay,setDelay]=useState("3");
 const [annualReturnPct,setAnnualReturnPct]=useState("5");
 const [selected,setSelected]=useState<Operation|null>(null);
 const [valuation,setValuation]=useState<InvestmentValuation|null>(null);
 const [comparison,setComparison]=useState<InvestmentComparison|null>(null);
 const [scenarioRequest,setScenarioRequest]=useState<ScenarioInput|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const requestSequence=useRef(0);

 const refresh=async()=>{const [nextPortfolio,nextSecurities]=await Promise.all([dependencies.getPortfolio.execute(today()),dependencies.getSecurities.execute()]);setPortfolio(nextPortfolio);setSecurities(nextSecurities);};
 useEffect(()=>{void Promise.all([dependencies.getPortfolio.execute(today()),dependencies.getSecurities.execute()]).then(([nextPortfolio,nextSecurities])=>{setPortfolio(nextPortfolio);setSecurities(nextSecurities);});},[]);
 const navigate=(destination:Page)=>{setBackStack((current)=>[...current,page]);setPage(destination);};
 const goTo=(destination:MainPage)=>{requestSequence.current+=1;setLoading(false);setBackStack([]);setPage(destination);setError("");};
 const goBack=()=>{requestSequence.current+=1;setLoading(false);const previous=backStack[backStack.length-1]??"history";setBackStack((current)=>current.slice(0,-1));setPage(previous);setError("");};
 const startForm=(kind:OperationKind)=>{setFormKind(kind);setTotal(kind==="dca"?"100":"500");setLines([newLine("",kind==="dca"?100:500)]);setDate(today());setExecutionDay("10");setDelay("3");setAnnualReturnPct("5");setError("");navigate("form");};
 const startValue=(operation:Operation)=>{const requestId=++requestSequence.current;setSelected(operation);setDate(today());setAnnualReturnPct(String(operation.annualReturnPct??5));setValuation(null);setError("");navigate("valuation-result");setLoading(true);void dependencies.valueInvestment.execute(operation,{valuationDate:today(),annualReturnPct:operation.annualReturnPct??5}).then((result)=>{if(requestSequence.current===requestId)setValuation(result);}).catch((caught)=>{if(requestSequence.current===requestId)setError(caught instanceof Error?caught.message:"Valorisation impossible.");}).finally(()=>{if(requestSequence.current===requestId)setLoading(false);});};
 const startScenario=(operation:Operation)=>{requestSequence.current+=1;setLoading(false);setSelected(operation);setDate(page==="valuation-result"?date:today());setScenarioStartDate(operation.date);setTotal(String(operation.amount));setExecutionDay(String(operation.executionDay??10));setDelay(String(operation.delayBusinessDays??3));setLines(operation.allocations.map((line)=>({...line,id:"line-"+(++nextLineId)})));setAnnualReturnPct(String(operation.annualReturnPct??5));setComparison(null);setScenarioRequest(null);setError("");navigate("scenario-form");};
 const useSavedPlan=(operation:Operation)=>{setScenarioStartDate(operation.date);setTotal(String(operation.amount));setExecutionDay(String(operation.executionDay??10));setDelay(String(operation.delayBusinessDays??3));setLines(operation.allocations.map((line)=>({...line,id:"line-"+(++nextLineId)})));setAnnualReturnPct(String(operation.annualReturnPct??5));setComparison(null);setScenarioRequest(null);setError("");};
 const updateLine=(id:string,field:string,value:string)=>setLines((current)=>current.map((line)=>line.id!==id?line:field==="amount"?{...line,amount:amountValue(value)}:field==="instrumentKind"?{...line,instrumentKind:value as AllocationLine["instrumentKind"],isin:value==="uc"?"":line.isin}:field==="annualReturnPct"?{...line,annualReturnPct:amountValue(value)}:field==="name"?{...line,name:value,isin:"FONDS-EURO"}:{...line,isin:value}));

 const submitOperation=async()=>{setLoading(true);setError("");try{await dependencies.createOperation.execute({kind:formKind,amount:amountValue(total),date,allocations:lines,annualReturnPct:formKind==="versement"?amountValue(annualReturnPct):undefined,...(formKind==="dca"?{executionDay:amountValue(executionDay),delayBusinessDays:amountValue(delay)}:{})});await refresh();setBackStack([]);setPage("history");}catch(caught){setError(caught instanceof Error?caught.message:"La demande n’a pas abouti.");}finally{setLoading(false);}};
 const valueAtDate=async()=>{if(!selected)return;const requestId=++requestSequence.current;setLoading(true);setError("");setValuation(null);try{const result=await dependencies.valueInvestment.execute(selected,{valuationDate:date,annualReturnPct:amountValue(annualReturnPct)});if(requestSequence.current===requestId)setValuation(result);}catch(caught){if(requestSequence.current===requestId)setError(caught instanceof Error?caught.message:"La demande n’a pas abouti.");}finally{if(requestSequence.current===requestId)setLoading(false);}};
 const compare=async()=>{if(!selected)return;const requestId=++requestSequence.current;const request:ScenarioInput={startDate:scenarioStartDate,amount:amountValue(total),allocations:lines,valuationDate:date,annualReturnPct:amountValue(annualReturnPct),...(selected.kind==="dca"?{executionDay:amountValue(executionDay),delayBusinessDays:amountValue(delay)}:{})};setLoading(true);setError("");setComparison(null);setScenarioRequest(request);try{const result=await dependencies.compareInvestment.execute(selected,request);if(requestSequence.current===requestId){setComparison(result);navigate("comparison-result");}}catch(caught){if(requestSequence.current===requestId)setError(caught instanceof Error?caught.message:"La demande n’a pas abouti.");}finally{if(requestSequence.current===requestId)setLoading(false);}};

 const main=page==="dashboard"||page==="simulation"||page==="history";
 const labels:Record<MainPage,string>={dashboard:"Aperçu",history:"Journal",simulation:"Simuler"};
 return <SafeAreaView style={styles.safe} edges={["top","bottom"]}><StatusBar barStyle="dark-content"/>
  {!main?<View style={styles.context}><Pressable onPress={goBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Revenir à l’écran précédent" style={styles.back}><Text style={styles.backText}>‹ Retour</Text></Pressable><Text style={styles.brand}>ALTO<Text style={{color:p.forestLight}}>.</Text></Text><View style={{width:80}}/></View>:null}
  <ScrollView style={styles.scroll} contentContainerStyle={[styles.content,(page==="form"||page==="valuation-result"||page==="scenario-form"||page==="simulation")&&styles.narrow]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
   {!portfolio?<View style={styles.initialLoading}><ActivityIndicator color={p.forest}/><Text style={styles.loadingText}>Chargement de votre espace…</Text></View>:<>
    {page==="dashboard"?<DashboardScreen portfolio={portfolio} securities={securities} onAddVersement={()=>startForm("versement")} onAddDca={()=>startForm("dca")} onHistory={()=>goTo("history")} onValue={startValue}/>:null}
    {page==="simulation"?<SimulationScreen operations={portfolio.operations} onValue={startValue} onCompare={startScenario} onJournal={()=>goTo("history")}/>:null}
    {page==="history"?<HistoryScreen operations={portfolio.operations} securities={securities} onValue={startValue} onCompare={startScenario} onVersement={()=>startForm("versement")} onDca={()=>startForm("dca")}/>:null}
    {page==="form"?<InvestmentFormScreen kind={formKind} total={total} lines={lines} securities={securities} date={date} executionDay={executionDay} delayBusinessDays={delay} annualReturnPct={annualReturnPct} loading={loading} error={error}
      onTotalChange={setTotal} onLineChange={updateLine} onAddLine={()=>setLines((current)=>[...current,newLine()])} onRemoveLine={(id)=>setLines((current)=>current.filter((line)=>line.id!==id))} onDateChange={setDate} onExecutionDayChange={setExecutionDay} onDelayChange={setDelay} onAnnualReturnChange={setAnnualReturnPct} onSubmit={()=>void submitOperation()}/>:null}
    {page==="valuation-result"&&selected?<ValuationResultScreen operation={selected} date={date} annualReturnPct={annualReturnPct} result={valuation} error={error} loading={loading} onDateChange={(v)=>{setDate(v);setValuation(null);}} onAnnualReturnChange={(v)=>{setAnnualReturnPct(v);setValuation(null);}} onValue={()=>void valueAtDate()} onCompare={()=>startScenario(selected)}/>:null}
    {page==="scenario-form"&&selected?<ScenarioFormScreen operation={selected} operations={portfolio.operations} startDate={scenarioStartDate} date={date} total={total} executionDay={executionDay} delayBusinessDays={delay} lines={lines} securities={securities} annualReturnPct={annualReturnPct} error={error} loading={loading}
      onStartDateChange={(v)=>{setScenarioStartDate(v);setComparison(null);setScenarioRequest(null);}} onUseSavedPlan={useSavedPlan} onDateChange={(v)=>{setDate(v);setComparison(null);setScenarioRequest(null);}} onExecutionDayChange={(v)=>{setExecutionDay(v);setComparison(null);setScenarioRequest(null);}} onDelayChange={(v)=>{setDelay(v);setComparison(null);setScenarioRequest(null);}} onTotalChange={(v)=>{setTotal(v);setComparison(null);setScenarioRequest(null);}} onAnnualReturnChange={(v)=>{setAnnualReturnPct(v);setComparison(null);setScenarioRequest(null);}} onLineChange={(id,field,value)=>{setComparison(null);setScenarioRequest(null);updateLine(id,field,value);}} onAddLine={()=>{setComparison(null);setScenarioRequest(null);setLines((current)=>[...current,newLine()]);}} onRemoveLine={(id)=>{setComparison(null);setScenarioRequest(null);setLines((current)=>current.filter((line)=>line.id!==id));}} onCompare={()=>void compare()}/>:null}
    {page==="comparison-result"&&comparison&&selected&&scenarioRequest?<ComparisonResultScreen operation={selected} scenario={scenarioRequest} result={comparison} onAdjust={goBack}/>:null}
   </>}
  </ScrollView>
  {main?<View style={styles.tabs}>{(["dashboard","history","simulation"] as MainPage[]).map((key)=>{const selectedTab=page===key;const symbols:Record<MainPage,string>={dashboard:"⌂",history:"≡",simulation:"⌁"};return <Pressable key={key} onPress={()=>goTo(key)} style={styles.tab}><Text style={[styles.symbol,selectedTab&&styles.active]}>{symbols[key]}</Text><Text style={[styles.tabLabel,selectedTab&&styles.active]}>{labels[key]}</Text></Pressable>;})}</View>:null}
 </SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:p.canvas},scroll:{flex:1},content:{width:"100%",maxWidth:1180,alignSelf:"center",paddingHorizontal:20,paddingTop:16,paddingBottom:24},narrow:{maxWidth:700},context:{height:56,maxWidth:700,width:"100%",alignSelf:"center",paddingHorizontal:20,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderColor:p.line},back:{minWidth:88,minHeight:44,justifyContent:"center",paddingRight:8},backText:{color:p.forest,fontSize:14,fontWeight:"700"},brand:{color:p.ink,fontSize:13,fontWeight:"800",letterSpacing:2},initialLoading:{minHeight:400,alignItems:"center",justifyContent:"center",gap:12},loadingText:{color:p.muted,fontSize:13},tabs:{minHeight:68,borderTopWidth:1,borderColor:p.line,backgroundColor:p.paper,flexDirection:"row",alignItems:"center",justifyContent:"space-around"},tab:{flex:1,alignItems:"center",justifyContent:"center",gap:3,minHeight:60},symbol:{color:p.muted,fontSize:19,fontWeight:"700"},tabLabel:{color:p.muted,fontSize:10,fontWeight:"600"},active:{color:p.forest,fontWeight:"800"}});
