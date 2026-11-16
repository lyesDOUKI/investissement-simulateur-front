import type { CreateOperationInput, InvestmentComparison, InvestmentValuation, Operation, Portfolio, ScenarioInput, Security, ValueOperationInput } from "@/domain/models/operation";
import type { PortfolioRepository } from "@/domain/ports/portfolio-repository";
import { Platform } from "react-native";

type AnyObject = Record<string, any>;
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === "android" ? "http://10.0.2.2:8080/api" : "http://localhost:8080/api");
const dateIso = (s: string) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s); return m ? `${m[3]}-${m[2]}-${m[1]}` : s; };
const dateLocal = (s?: string) => s ? `${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}` : "";

export class HttpPortfolioRepository implements PortfolioRepository {
  private operations = new Map<string, Operation>();
  constructor(private readonly token: () => string | null) {}
  private async request(path: string, init: RequestInit = {}): Promise<AnyObject> {
    const token = this.token(); if (!token) throw new Error("Session expirée. Récupérez un nouveau token.");
    const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail ?? body.title ?? `Erreur API (${response.status})${body.code ? ` · ${body.code}` : ""}`);
    return body;
  }
  async getPortfolio(asOfDate: string): Promise<Portfolio> {
    const [p, d] = await Promise.all([this.request("/one-time-payments?page=0&size=100&sort=executionDate,desc"), this.request("/dca-investments?page=0&size=100&sort=configuredAt,desc")]);
    const operations: Operation[] = [
      ...(p.items ?? []).map((x: AnyObject) => this.payment(x)),
      ...(d.items ?? []).map((x: AnyObject) => this.plan(x)),
    ].sort((a, b) => dateIso(b.date).localeCompare(dateIso(a.date)));
    operations.forEach((op) => this.operations.set(op.id, op));
    return { asOfDate, invested: 0, value: 0, gain: 0, gainRatePct: 0, oneOffInvested: 0, operations, valuations: [], holdings: [] };
  }
  async getSecurities(): Promise<Security[]> { return []; }
  async createOperation(input: CreateOperationInput): Promise<Operation> {
    const allocations = input.allocations.map((a) => a.instrumentKind === "uc" ? { instrumentKind: "UNIT_LINKED", isin: a.isin, amount: a.amount } : { instrumentKind: "EURO_FUND", name: a.name, amount: a.amount });
    const path = input.kind === "dca" ? "/dca-investments" : "/one-time-payments";
    const body = { amount: input.amount, date: dateIso(input.date), allocations, ...(input.kind === "dca" ? { executionDay: input.executionDay, delayBusinessDays: input.delayBusinessDays } : {}) };
    const created = await this.request(path, { method: "POST", body: JSON.stringify(body) });
    const details = await this.request(`${path}/${created.id}`);
    const operation = input.kind === "dca" ? this.plan(details) : this.payment(details);
    operation.annualReturnPct = input.annualReturnPct; this.operations.set(operation.id, operation); return operation;
  }
  async valueOperation(id: string, input: ValueOperationInput): Promise<InvestmentValuation> {
    const op = this.operations.get(id) ?? await this.getById(id);
    const projectionAssumptions = op.allocations.filter((a) => a.instrumentKind === "uc").map((a) => ({ isin: a.isin, annualReturn: (input.annualReturnPct ?? 5) / 100 }));
    const path = op.kind === "dca" ? "dca-investments" : "one-time-payments";
    const x = await this.request(`/${path}/${id}/simulations`, { method: "POST", body: JSON.stringify({ valuationDate: dateIso(input.valuationDate), projectionAssumptions }) });
    return this.valuation(x, op.kind);
  }
  private async getById(id: string): Promise<Operation> {
    const payments = await this.request("/one-time-payments?page=0&size=100"); const p = (payments.items ?? []).find((x: AnyObject) => x.id === id); if (p) return this.payment(p);
    const plans = await this.request("/dca-investments?page=0&size=100"); const d = (plans.items ?? []).find((x: AnyObject) => x.id === id); if (d) return this.plan(d);
    throw new Error("Cette opération n’apparaît plus dans votre journal.");
  }
  private allocation(a: AnyObject, i: number) { return { id: `line-${i}`, instrumentKind: a.instrumentKind === "EURO_FUND" ? "fonds-euro" as const : "uc" as const, isin: a.isin ?? "FONDS-EURO", name: a.euroFundName, amount: a.amount ?? 0 }; }
  private payment(x: AnyObject): Operation { return { id: x.id, kind: "versement", label: "Versement réalisé", amount: x.amount, date: dateLocal(x.executionDate), detail: "Versement enregistré", allocations: (x.allocations ?? []).map((a: AnyObject, i: number) => this.allocation(a, i)) }; }
  private plan(x: AnyObject): Operation { return { id: x.id, kind: "dca", label: "Plan mensuel", amount: x.monthlyAmount, date: dateLocal(x.configuredAt), detail: `Échéance le ${x.paymentDay ?? 1} · délai ${x.businessDayDelay ?? 0} jours ouvrés`, executionDay: x.paymentDay, delayBusinessDays: x.businessDayDelay, allocations: (x.allocations ?? []).map((a: AnyObject, i: number) => this.allocation(a, i)) }; }
  private valuation(x: AnyObject, kind: Operation["kind"]): InvestmentValuation {
    const allocation = (a: AnyObject) => ({ instrumentKind: a.instrumentKind === "EURO_FUND" ? "fonds-euro" as const : "uc" as const, isin: a.isin ?? "FONDS-EURO", name: a.name ?? a.euroFundName ?? a.isin ?? "Fonds euro", invested: a.invested ?? a.amount ?? 0, shares: a.shares ?? 0, averagePurchasePrice: a.averagePurchasePrice, observedPrice: a.observedPrice, observedDate: dateLocal(a.observedDate), value: a.value ?? 0, gain: a.gain ?? 0, status: valuationStatus(a.status), annualReturns: a.annualReturns ?? [], annualRates: a.annualRates ?? [] });
    const installments = (x.installments ?? []).map((i: AnyObject) => ({
      dueDate: dateLocal(i.dueDate), executionDate: dateLocal(i.executionDate), nature: installmentNature(i.nature), amount: i.amount,
      allocations: (i.allocations ?? []).map((a: AnyObject) => ({ instrumentKind: a.instrumentKind === "EURO_FUND" ? "fonds-euro" as const : "uc" as const, isin: a.isin ?? "FONDS-EURO", name: a.name ?? a.euroFundName ?? "Fonds euro", amount: a.amount ?? 0, shares: a.shares ?? 0, value: a.value, gain: a.gain, purchasePrice: a.purchasePrice, purchasePriceDate: dateLocal(a.purchasePriceDate), status: valuationStatus(a.status), annualReturn: a.annualReturn, annualRate: a.annualRate })),
    }));
    const allocations: InvestmentValuation["allocations"] = (x.allocations ?? []).map(allocation);
    return { operationId: x.operationId, valuationDate: dateLocal(x.valuationDate), invested: x.invested, value: x.value, gain: x.gain, gainRatePct: x.gainRatePct, installmentCount: installments.length, installments: kind === "dca" ? installments : [], allocations, hasMissingPrices: allocations.some((a) => a.status === "missing") || installments.some((i: InvestmentValuation["installments"][number]) => i.allocations.some((a) => a.status === "missing")) };
  }
  async compareOperation(_id: string, _input: ScenarioInput): Promise<InvestmentComparison> { throw new Error("Comparaison désactivée : elle n’est pas encore disponible dans l’API."); }
}

function valuationStatus(status?: string): "observed" | "projected" | "missing" {
  if (status === "COURS") return "observed";
  if (status === "PROJETEE" || status === "PROJECTED") return "projected";
  return "missing";
}

function installmentNature(nature?: string): "observed" | "projected" | "mixed" | "not-yet-executed" | undefined {
  if (nature === "OBSERVED") return "observed";
  if (nature === "PROJECTED") return "projected";
  if (nature === "MIXED") return "mixed";
  if (nature === "NOT_YET_EXECUTED") return "not-yet-executed";
  return undefined;
}
