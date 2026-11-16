import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { InvestmentComparison, InvestmentValuation, Operation, OperationKind, Portfolio, ScenarioInput, Security } from "@/domain/models/operation";
import type { AllocationDraft, AllocationDraftField } from "@/presentation/models/allocation-draft";
import { toAllocationLine } from "@/presentation/models/allocation-draft";
import type { UserAccount } from "@/domain/models/user-account";
import { dependencies, flags } from "@/infrastructure/dependencies";
import { DashboardScreen } from "@/presentation/screens/dashboard-screen";
import { HistoryScreen } from "@/presentation/screens/history-screen";
import { InvestmentFormScreen } from "@/presentation/screens/investment-form-screen";
import { ComparisonResultScreen } from "@/presentation/screens/comparison-result-screen";
import { SimulationScreen } from "@/presentation/screens/simulation-screen";
import { ValuationResultScreen } from "@/presentation/screens/valuation-screen";
import { ValuationDetailsScreen } from "@/presentation/screens/valuation-details-screen";
import { ScenarioFormScreen } from "@/presentation/screens/scenario-screen";
import { LoginScreen } from "@/presentation/screens/login-screen";
import { AccountScreen } from "@/presentation/screens/account-screen";
import { palette as p } from "@/presentation/theme";

type MainPage="dashboard"|"history"|"simulation";
type Page=MainPage|"form"|"valuation-result"|"valuation-details"|"scenario-form"|"comparison-result"|"account"|"login"|"register";
const today=()=>new Date().toLocaleDateString("fr-FR");
const amountValue=(input:string)=>Number(input.replace(",", "."))||0;
let nextLineId=0;
const newLine=(isin="",amount=0):AllocationDraft=>({id:"line-"+(++nextLineId),instrumentKind:"uc",isin,amount:String(amount)});

export default function HomeScreen(){
 const [page,setPage]=useState<Page>("login");
 const [backStack,setBackStack]=useState<Page[]>([]);
 const [account,setAccount]=useState<UserAccount|null>(null);
 const [authError,setAuthError]=useState("");
 const [authLoading,setAuthLoading]=useState(false);
 const [portfolio,setPortfolio]=useState<Portfolio|null>(null);
 const [securities,setSecurities]=useState<Security[]>([]);
 const [formKind,setFormKind]=useState<OperationKind>("versement");
 const [total,setTotal]=useState("500");
 const [lines,setLines]=useState<AllocationDraft[]>([]);
 const [date,setDate]=useState(today());
 const [scenarioStartDate,setScenarioStartDate]=useState(today());
 const [executionDay,setExecutionDay]=useState("10");
 const [delay,setDelay]=useState("3");
 const [comparisonAssumptions,setComparisonAssumptions]=useState<Record<string,string>>({});
 const [valuationAssumptions,setValuationAssumptions]=useState<Record<string,string>>({});
 const [selected,setSelected]=useState<Operation|null>(null);
 const [valuation,setValuation]=useState<InvestmentValuation|null>(null);
 const [comparison,setComparison]=useState<InvestmentComparison|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const requestSequence=useRef(0);
 const scrollRef=useRef<ScrollViewInstance|null>(null);

 const refresh=async()=>{const [nextPortfolio,catalog]=await Promise.all([dependencies.getPortfolio.execute(today()),dependencies.getSecurities.execute()]);const known=new Map(catalog.map((s)=>[s.isin,s]));for(const op of nextPortfolio.operations)for(const line of op.allocations)if(line.instrumentKind==="uc"&&line.isin)known.set(line.isin,{isin:line.isin,name:line.name??line.isin,shortName:line.name??line.isin,color:"#7EB89A",instrumentKind:"uc"});setPortfolio(nextPortfolio);setSecurities([...known.values()]);};
 const navigate=(destination:Page)=>{setBackStack((current)=>[...current,page]);setPage(destination);};
 const goTo=(destination:MainPage)=>{requestSequence.current+=1;setLoading(false);setBackStack([]);setPage(destination);setError("");};
 const goBack=useCallback(()=>{requestSequence.current+=1;setLoading(false);const previous=backStack[backStack.length-1]??(account?"dashboard":"login");setBackStack((current)=>current.slice(0,-1));setPage(previous);setError("");},[backStack,account]);
 useEffect(()=>{if(page==="login"||page==="dashboard"||page==="history"||page==="simulation")return;const subscription=BackHandler.addEventListener("hardwareBackPress",()=>{goBack();return true;});return ()=>subscription.remove();},[page,goBack]);
 useEffect(()=>{if(page==="comparison-result")scrollRef.current?.scrollTo({x:0,y:0,animated:true});},[page]);
 const signIn=async()=>{setAuthLoading(true);setAuthError("");try{const signedIn=await dependencies.connectDemo.execute();await refresh();setAccount(signedIn);setBackStack([]);setPage("dashboard");}catch(e){dependencies.connectDemo.disconnect();setPortfolio(null);setAuthError(e instanceof Error?e.message:"Connexion impossible. Vérifiez le mock OIDC.");}finally{setAuthLoading(false);}};
 const signOut=()=>{requestSequence.current+=1;dependencies.connectDemo.disconnect();setAccount(null);setPortfolio(null);setPage("login");setBackStack([]);setAuthError("");setError("");};
 const startForm=(kind:OperationKind)=>{setFormKind(kind);setTotal(kind==="dca"?"100":"500");setLines([newLine("",kind==="dca"?100:500)]);setDate(today());setExecutionDay("10");setDelay("3");setError("");navigate("form");};
 const startValue=(operation:Operation)=>{const requestId=++requestSequence.current;const initial=Object.fromEntries(operation.allocations.filter((line)=>line.instrumentKind==="uc"&&line.isin).map((line)=>[line.isin,"5"]));setSelected(operation);setDate(today());setValuationAssumptions(initial);setValuation(null);setError("");navigate("valuation-result");setLoading(true);void dependencies.valueInvestment.execute(operation,{valuationDate:today(),projectionAssumptions:[]}).then((result)=>{if(requestSequence.current===requestId)setValuation(result);}).catch((caught)=>{if(requestSequence.current===requestId)setError(caught instanceof Error?caught.message:"Valorisation impossible.");}).finally(()=>{if(requestSequence.current===requestId)setLoading(false);});};
 const startScenario=(operation:Operation)=>{requestSequence.current+=1;setLoading(false);setSelected(operation);setDate(page==="valuation-result"?date:today());setScenarioStartDate(operation.date);setTotal(String(operation.amount));setExecutionDay(String(operation.executionDay??10));setDelay(String(operation.delayBusinessDays??3));setLines(operation.allocations.map((line)=>({...line,id:"line-"+(++nextLineId),amount:String(line.amount)})));setComparisonAssumptions({});setComparison(null);setError("");navigate("scenario-form");};
 const useSavedPlan=(operation:Operation)=>{setScenarioStartDate(operation.date);setTotal(String(operation.amount));setExecutionDay(String(operation.executionDay??10));setDelay(String(operation.delayBusinessDays??3));setLines(operation.allocations.map((line)=>({...line,id:"line-"+(++nextLineId),amount:String(line.amount)})));setComparisonAssumptions({});setComparison(null);setError("");};
 const updateLine=(id:string,field:AllocationDraftField,value:string)=>setLines((current)=>current.map((line)=>line.id!==id?line:field==="amount"?{...line,amount:value}:field==="instrumentKind"?{...line,instrumentKind:value as AllocationDraft["instrumentKind"],isin:value==="uc"?"":line.isin}:field==="name"?{...line,name:value,isin:"FONDS-EURO"}:{...line,isin:value}));

 const submitOperation=async()=>{setLoading(true);setError("");try{await dependencies.createOperation.execute({kind:formKind,amount:amountValue(total),date,allocations:lines.map(toAllocationLine),...(formKind==="dca"?{executionDay:amountValue(executionDay),delayBusinessDays:amountValue(delay)}:{})});await refresh();setBackStack([]);setPage("history");}catch(caught){setError(caught instanceof Error?caught.message:"La demande n’a pas abouti.");}finally{setLoading(false);}};
 const valueAtDate=async()=>{if(!selected)return;const requestId=++requestSequence.current;const projectionAssumptions=[...new Set(selected.allocations.filter((line)=>line.instrumentKind==="uc"&&line.isin).map((line)=>line.isin))].map((isin)=>({isin,annualReturn:amountValue(valuationAssumptions[isin]??"5")/100}));setLoading(true);setError("");setValuation(null);try{const result=await dependencies.valueInvestment.execute(selected,{valuationDate:date,projectionAssumptions});if(requestSequence.current===requestId)setValuation(result);}catch(caught){if(requestSequence.current===requestId)setError(caught instanceof Error?caught.message:"La demande n’a pas abouti.");}finally{if(requestSequence.current===requestId)setLoading(false);}};
 const compare=async()=>{if(!selected)return;const dateParts=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);const targetDate=dateParts?new Date(Number(dateParts[3]),Number(dateParts[2])-1,Number(dateParts[1])):null;const currentDate=new Date();currentDate.setHours(0,0,0,0);const needsProjection=targetDate!==null&&targetDate>currentDate;const isins=[...new Set([...selected.allocations,...lines].filter((line)=>line.instrumentKind==="uc"&&line.isin.trim()).map((line)=>line.isin))];if(needsProjection){const missing=isins.filter((isin)=>{const value=comparisonAssumptions[isin]?.trim().replace(",",".");return !value||!Number.isFinite(Number(value))||Number(value)<-100;});if(missing.length){setError(`Renseignez une hypothèse valide (au moins −100 %) pour chaque support UC : ${missing.join(", ")}.`);return;}}const requestId=++requestSequence.current;const request:ScenarioInput={startDate:scenarioStartDate,amount:amountValue(total),allocations:lines.map(toAllocationLine),valuationDate:date,projectionAssumptions:needsProjection?isins.map((isin)=>({isin,annualReturn:amountValue(comparisonAssumptions[isin])/100})):[],...(selected.kind==="dca"?{executionDay:amountValue(executionDay),delayBusinessDays:amountValue(delay)}:{})};setLoading(true);setError("");setComparison(null);try{const result=await dependencies.compareInvestment.execute(selected,request);if(requestSequence.current===requestId){setComparison(result);navigate("comparison-result");}}catch(caught){if(requestSequence.current===requestId)setError(caught instanceof Error?caught.message:"La demande n’a pas abouti.");}finally{if(requestSequence.current===requestId)setLoading(false);}};

 const main=page==="dashboard"||page==="simulation"||page==="history";
 const activeMain:MainPage=main?page:backStack.slice().reverse().find((item):item is MainPage=>item==="dashboard"||item==="history"||item==="simulation")??"dashboard";
 const labels:Record<MainPage,string>={dashboard:"Accueil",history:"Journal",simulation:"Simuler"};
 return <SafeAreaView style={styles.safe} edges={["top","bottom"]}><StatusBar barStyle="light-content"/>
  {account&&!main&&page!=="register"?<View style={styles.context}><Pressable onPress={goBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Revenir à l’écran précédent" style={styles.back}><Text style={styles.backText}>‹ Retour</Text></Pressable><Text style={styles.brand}>ALTO<Text style={{color:p.forestLight}}>.</Text></Text><View style={{width:80}}/></View>:null}
  <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={[styles.content,(page==="form"||page==="valuation-result"||page==="valuation-details"||page==="scenario-form"||page==="simulation"||page==="account")&&styles.narrow,(page==="login"||page==="register")&&styles.authContent]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
   {!account ? <LoginScreen error={authError} loading={authLoading} onSubmit={()=>void signIn()}/> : !portfolio?<View style={styles.initialLoading}><ActivityIndicator color={p.forestLight}/><Text style={styles.loadingText}>Chargement de votre espace…</Text></View>:<>
    {page==="dashboard"?<DashboardScreen portfolio={portfolio} securities={securities} account={account} onAccount={()=>navigate("account")} onAddVersement={()=>startForm("versement")} onAddDca={()=>startForm("dca")} onHistory={()=>goTo("history")} onValue={startValue}/>:null}
    {page==="simulation"?<SimulationScreen operations={portfolio.operations} onValue={startValue} onCompare={startScenario} compareEnabled={flags.comparison} onJournal={()=>goTo("history")}/>:null}
    {page==="history"?<HistoryScreen operations={portfolio.operations} securities={securities} onValue={startValue} onCompare={startScenario} compareEnabled={flags.comparison} onVersement={()=>startForm("versement")} onDca={()=>startForm("dca")}/>:null}
    {page==="form"?<InvestmentFormScreen kind={formKind} total={total} lines={lines} securities={securities} date={date} executionDay={executionDay} delayBusinessDays={delay} loading={loading} error={error}
      onTotalChange={setTotal} onLineChange={updateLine} onAddLine={()=>setLines((current)=>[...current,newLine()])} onRemoveLine={(id)=>setLines((current)=>current.filter((line)=>line.id!==id))} onDateChange={setDate} onExecutionDayChange={setExecutionDay} onDelayChange={setDelay} onSubmit={()=>void submitOperation()}/>:null}
    {page==="valuation-result"&&selected?<ValuationResultScreen operation={selected} date={date} assumptions={valuationAssumptions} result={valuation} error={error} loading={loading} compareEnabled={flags.comparison} onDateChange={(v)=>{setDate(v);setValuation(null);}} onAssumptionChange={(isin,value)=>{setValuationAssumptions((current)=>({...current,[isin]:value}));setValuation(null);}} onValue={()=>void valueAtDate()} onCompare={()=>startScenario(selected)} onDetails={()=>navigate("valuation-details")}/>:null}
    {page==="valuation-details"&&selected&&valuation?<ValuationDetailsScreen operation={selected} result={valuation}/>:null}
    {page==="scenario-form"&&selected?<ScenarioFormScreen operation={selected} operations={portfolio.operations} startDate={scenarioStartDate} date={date} total={total} executionDay={executionDay} delayBusinessDays={delay} lines={lines} securities={securities} assumptions={comparisonAssumptions} error={error} loading={loading}
      onStartDateChange={(v)=>{setScenarioStartDate(v);setComparison(null);}} onUseSavedPlan={useSavedPlan} onDateChange={(v)=>{setDate(v);setComparison(null);}} onExecutionDayChange={(v)=>{setExecutionDay(v);setComparison(null);}} onDelayChange={(v)=>{setDelay(v);setComparison(null);}} onTotalChange={(v)=>{setTotal(v);setComparison(null);}} onAssumptionChange={(isin,value)=>{setComparisonAssumptions((current)=>({...current,[isin]:value}));setComparison(null);setError("");}} onLineChange={(id,field,value)=>{setComparison(null);updateLine(id,field,value);}} onAddLine={()=>{setComparison(null);setLines((current)=>[...current,newLine()]);}} onRemoveLine={(id)=>{setComparison(null);setLines((current)=>current.filter((line)=>line.id!==id));}} onCompare={()=>void compare()}/>:null}
    {page==="comparison-result"&&comparison&&selected?<ComparisonResultScreen operation={selected} result={comparison} onAdjust={goBack}/>:null}
    {page==="account"?<AccountScreen account={account} onSignOut={signOut}/>:null}
   </>}
  </ScrollView>
  {account?<View style={styles.tabs} accessibilityRole="tablist">{(["dashboard","history","simulation"] as MainPage[]).map((key)=>{const selectedTab=activeMain===key;const symbols:Record<MainPage,string>={dashboard:"⌂",history:"≡",simulation:"⌁"};return <Pressable key={key} onPress={()=>goTo(key)} accessibilityRole="tab" accessibilityState={{selected:selectedTab}} style={[styles.tab,selectedTab&&styles.activeTab]}><Text style={[styles.symbol,selectedTab&&styles.active]}>{symbols[key]}</Text><Text style={[styles.tabLabel,selectedTab&&styles.active]}>{labels[key]}</Text></Pressable>;})}</View>:null}
 </SafeAreaView>;
}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:p.canvas},scroll:{flex:1},content:{width:"100%",maxWidth:1180,alignSelf:"center",paddingHorizontal:20,paddingTop:16,paddingBottom:24},narrow:{maxWidth:700},authContent:{maxWidth:580,flexGrow:1,justifyContent:"center"},context:{height:56,maxWidth:700,width:"100%",alignSelf:"center",paddingHorizontal:20,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderColor:p.line},back:{minWidth:88,minHeight:44,justifyContent:"center",paddingRight:8},backText:{color:p.forestLight,fontSize:14,fontWeight:"700"},brand:{color:p.ink,fontSize:13,fontWeight:"800",letterSpacing:2},initialLoading:{minHeight:400,alignItems:"center",justifyContent:"center",gap:12},loadingText:{color:p.muted,fontSize:13},tabs:{minHeight:70,borderTopWidth:1,borderColor:p.line,backgroundColor:p.paper,flexDirection:"row",alignItems:"center",justifyContent:"space-around",paddingHorizontal:10},tab:{flex:1,alignItems:"center",justifyContent:"center",gap:3,minHeight:54,marginHorizontal:4,borderRadius:16},symbol:{color:p.muted,fontSize:19,fontWeight:"700"},tabLabel:{color:p.muted,fontSize:11,fontWeight:"600"},active:{color:p.forestLight,fontWeight:"800"},activeTab:{backgroundColor:p.softGreen}});
