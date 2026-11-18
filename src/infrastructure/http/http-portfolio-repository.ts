import type { ChangeDcaConfigurationInput, CompareDcaRevisionsInput, CreateOperationInput, DcaConfigurationRevision, DcaRevisionComparison, InvestmentComparison, InvestmentValuation, Operation, Portfolio, ScenarioInput, Security, ValueOperationInput } from "@/domain/models/operation";
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
    const [summary, payments, plans] = await Promise.all([
      this.request(`/portfolio/summary?valuationDate=${encodeURIComponent(dateIso(asOfDate))}`),
      this.request("/one-time-payments?page=0&size=100&sort=executionDate,desc"),
      this.request("/dca-investments?page=0&size=100&sort=configuredAt,desc"),
    ]);
    const dcaById = new Map<string, Operation>((plans.items ?? []).map((item: AnyObject) => {
      const operation = this.plan(item);
      return [operation.id, operation];
    }));
    for (const item of summary.dcaPlans ?? []) {
      const operation = this.summaryPlan(item);
      if (!dcaById.has(operation.id)) dcaById.set(operation.id, operation);
    }
    const operations: Operation[] = [
      ...(payments.items ?? []).map((x: AnyObject) => this.payment(x)),
      ...dcaById.values(),
    ].sort((a, b) => dateIso(b.date).localeCompare(dateIso(a.date)));
    operations.forEach((op) => this.operations.set(op.id, op));
    const totals = summary.totals ?? {};
    return {
      asOfDate: dateLocal(summary.valuationDate) || asOfDate,
      invested: totals.invested ?? 0,
      value: totals.value ?? null,
      gain: totals.gain ?? null,
      gainRatePct: totals.gainRatePct ?? null,
      oneOffInvested: totals.oneTimeInvested ?? 0,
      valuationStatus: summary.valuationStatus === "PARTIAL" ? "partial" : "complete",
      recentActivity: summary.recentActivity ? {
        type: summary.recentActivity.type,
        operationId: summary.recentActivity.operationId,
        date: dateLocal(summary.recentActivity.date),
        amount: summary.recentActivity.amount,
        label: summary.recentActivity.label,
        detail: summary.recentActivity.detail,
      } : null,
      operations,
      valuations: [],
      holdings: (summary.holdings ?? []).map((holding: AnyObject) => ({
        instrumentKind: holding.instrumentKind === "EURO_FUND" ? "fonds-euro" as const : "uc" as const,
        isin: holding.isin ?? null,
        symbol: holding.symbol ?? null,
        name: holding.name ?? holding.isin ?? "Support",
        invested: holding.invested ?? 0,
        shares: holding.shares ?? null,
        value: holding.value ?? null,
        sharePct: holding.sharePct ?? null,
        status: holding.status === "COURS" ? "observed" as const : holding.status === "PROJETEE" ? "projected" as const : "unavailable" as const,
        observedDate: holding.observedDate ? dateLocal(holding.observedDate) : null,
      })),
    };
  }
  async getSecurities(): Promise<Security[]> { return []; }
  async createOperation(input: CreateOperationInput): Promise<Operation> {
    const allocations = input.allocations.map((a) => a.instrumentKind === "uc" ? { instrumentKind: "UNIT_LINKED", isin: a.isin, amount: a.amount } : { instrumentKind: "EURO_FUND", name: a.name, amount: a.amount });
    const path = input.kind === "dca" ? "/dca-investments" : "/one-time-payments";
    const body = { amount: input.amount, date: dateIso(input.date), allocations, ...(input.kind === "dca" ? { executionDay: input.executionDay, delayBusinessDays: input.delayBusinessDays } : {}) };
    const created = await this.request(path, { method: "POST", body: JSON.stringify(body) });
    const details = await this.request(`${path}/${created.id}`);
    const operation = input.kind === "dca" ? this.plan(details) : this.payment(details);
    this.operations.set(operation.id, operation); return operation;
  }
  async changeDcaConfiguration(input: ChangeDcaConfigurationInput): Promise<DcaConfigurationRevision> {
    const allocations = input.allocations.map((allocation) => allocation.instrumentKind === "uc"
      ? { instrumentKind: "UNIT_LINKED", isin: allocation.isin, amount: allocation.amount }
      : { instrumentKind: "EURO_FUND", name: allocation.name ?? "Fonds euro", amount: allocation.amount });
    const response = await this.request(`/dca-investments/${input.operationId}/configuration`, {
      method: "PUT",
      body: JSON.stringify({ amount: input.amount, allocations }),
    });
    const revision = this.configurationRevision(response);
    const previous = this.operations.get(input.operationId);
    if (previous) this.operations.set(input.operationId, {
      ...previous,
      amount: revision.monthlyAmount,
      allocations: revision.allocations,
      configurationHistory: [...(previous.configurationHistory ?? []), revision],
    });
    return revision;
  }
  async valueOperation(id: string, input: ValueOperationInput): Promise<InvestmentValuation> {
    const op = this.operations.get(id) ?? await this.getById(id);
    const availableIsins = new Set([...op.allocations, ...(op.configurationHistory ?? []).flatMap((revision) => revision.allocations)].filter((allocation) => allocation.instrumentKind === "uc").map((allocation) => allocation.isin));
    const projectionAssumptions = normalizeProjectionAssumptions(input.projectionAssumptions.filter((assumption) => availableIsins.has(assumption.isin)));
    const path = op.kind === "dca" ? "dca-investments" : "one-time-payments";
    const x = await this.request(`/${path}/${id}/simulations`, { method: "POST", body: JSON.stringify({ valuationDate: dateIso(input.valuationDate), projectionAssumptions }) });
    return this.valuation(x, op.kind);
  }
  private async getById(id: string): Promise<Operation> {
    const payments = await this.request("/one-time-payments?page=0&size=100"); const p = (payments.items ?? []).find((x: AnyObject) => x.id === id); if (p) return this.payment(p);
    const plans = await this.request("/dca-investments?page=0&size=100"); const d = (plans.items ?? []).find((x: AnyObject) => x.id === id); if (d) return this.plan(d);
    throw new Error("Cette opération n’apparaît plus dans votre journal.");
  }
  private allocation(a: AnyObject, i: number) { return { id: `line-${i}`, instrumentKind: a.instrumentKind === "EURO_FUND" ? "fonds-euro" as const : "uc" as const, isin: a.isin ?? "FONDS-EURO", symbol: a.symbol ?? null, name: a.euroFundName, amount: a.amount ?? 0 }; }
  private payment(x: AnyObject): Operation { return { id: x.id, kind: "versement", label: "Versement réalisé", amount: x.amount, date: dateLocal(x.executionDate), detail: "Versement enregistré", allocations: (x.allocations ?? []).map((a: AnyObject, i: number) => this.allocation(a, i)) }; }
  private plan(x: AnyObject): Operation { return { id: x.id, kind: "dca", label: "Plan mensuel", amount: x.monthlyAmount, date: dateLocal(x.configuredAt), detail: `Échéance le ${x.paymentDay ?? 1} · délai ${x.businessDayDelay ?? 0} jours ouvrés`, executionDay: x.paymentDay, delayBusinessDays: x.businessDayDelay, allocations: (x.allocations ?? []).map((a: AnyObject, i: number) => this.allocation(a, i)), configurationHistory: (x.configurationHistory ?? []).map((revision: AnyObject) => this.configurationRevision(revision)) }; }
  private configurationRevision(x: AnyObject): DcaConfigurationRevision { return { revisionNumber: x.revisionNumber ?? 0, effectiveFromInstallmentNumber: x.effectiveFromInstallmentNumber ?? 0, recordedAt: dateLocal(x.recordedAt), monthlyAmount: x.monthlyAmount ?? 0, allocations: (x.allocations ?? []).map((a: AnyObject, i: number) => this.allocation(a, i)) }; }
  private summaryPlan(x: AnyObject): Operation { return { id: x.id, kind: "dca", label: "Plan mensuel", amount: x.monthlyAmount ?? 0, date: dateLocal(x.configuredAt), detail: `Échéance le ${x.paymentDay ?? 1} · délai ${x.businessDayDelay ?? 0} jours ouvrés`, executionDay: x.paymentDay, delayBusinessDays: x.businessDayDelay, allocations: (x.allocations ?? []).map((a: AnyObject, i: number) => ({ id: `line-${i}`, instrumentKind: a.instrumentKind === "EURO_FUND" ? "fonds-euro" as const : "uc" as const, isin: a.isin ?? "FONDS-EURO", symbol: a.symbol ?? null, name: a.name, amount: a.monthlyAmount ?? 0 })) }; }
  private valuation(x: AnyObject, kind: Operation["kind"]): InvestmentValuation {
    const allocation = (a: AnyObject) => ({ instrumentKind: a.instrumentKind === "EURO_FUND" ? "fonds-euro" as const : "uc" as const, isin: a.isin ?? "FONDS-EURO", symbol: a.symbol ?? null, name: a.name ?? a.euroFundName ?? a.isin ?? "Fonds euro", invested: a.invested ?? a.amount ?? 0, shares: a.shares ?? 0, averagePurchasePrice: a.averagePurchasePrice, observedPrice: a.observedPrice, observedDate: dateLocal(a.observedDate), value: a.value ?? 0, gain: a.gain ?? 0, status: valuationStatus(a.status), annualReturns: a.annualReturns ?? [], annualRates: a.annualRates ?? [] });
    const installments = (x.installments ?? []).map((i: AnyObject) => ({
      dueDate: dateLocal(i.dueDate), executionDate: dateLocal(i.executionDate), nature: installmentNature(i.nature), amount: i.amount,
      allocations: (i.allocations ?? []).map((a: AnyObject) => ({ instrumentKind: a.instrumentKind === "EURO_FUND" ? "fonds-euro" as const : "uc" as const, isin: a.isin ?? "FONDS-EURO", symbol: a.symbol ?? null, name: a.name ?? a.euroFundName ?? (a.instrumentKind === "EURO_FUND" ? "Fonds euro" : a.symbol ?? a.isin ?? "Support"), amount: a.amount ?? 0, shares: a.shares ?? null, value: a.value, gain: a.gain, purchasePrice: a.purchasePrice, purchasePriceDate: dateLocal(a.purchasePriceDate), status: valuationStatus(a.status), annualReturn: a.annualReturn, annualRate: a.annualRate })),
    }));
    const allocations: InvestmentValuation["allocations"] = (x.allocations ?? []).map(allocation);
    return { operationId: x.operationId, valuationDate: dateLocal(x.valuationDate), invested: x.invested, value: x.value, gain: x.gain, gainRatePct: x.gainRatePct, installmentCount: installments.length, installments: kind === "dca" ? installments : [], allocations, hasMissingPrices: allocations.some((a) => a.status === "missing") || installments.some((i: InvestmentValuation["installments"][number]) => i.allocations.some((a) => a.status === "missing")) };
  }
  async compareOperation(id: string, input: ScenarioInput): Promise<InvestmentComparison> {
    const operation = this.operations.get(id) ?? await this.getById(id);
    const allocations = input.allocations.map((allocation) => allocation.instrumentKind === "uc"
      ? { instrumentKind: "UNIT_LINKED", isin: allocation.isin, amount: allocation.amount }
      : { instrumentKind: "EURO_FUND", name: allocation.name ?? "Fonds euro", amount: allocation.amount });
    const allowedIsins = new Set([
      ...operation.allocations.filter((allocation) => allocation.instrumentKind === "uc").map((allocation) => allocation.isin),
      ...(operation.configurationHistory ?? []).flatMap((revision) => revision.allocations.filter((allocation) => allocation.instrumentKind === "uc").map((allocation) => allocation.isin)),
      ...input.allocations.filter((allocation) => allocation.instrumentKind === "uc").map((allocation) => allocation.isin),
    ]);
    const projectionAssumptions = normalizeProjectionAssumptions(input.projectionAssumptions.filter((assumption) => allowedIsins.has(assumption.isin)));
    const alternative = operation.kind === "dca"
      ? { date: dateIso(input.startDate), amount: input.amount, executionDay: input.executionDay, delayBusinessDays: input.delayBusinessDays, allocations }
      : { date: dateIso(input.startDate), amount: input.amount, allocations };
    const request = {
      valuationDate: dateIso(input.valuationDate),
      alternative,
      projectionAssumptions,
    };
    const path = operation.kind === "dca" ? `/dca-investments/${id}/comparisons` : `/one-time-payments/${id}/comparisons`;
    const response = await this.request(path, { method: "POST", body: JSON.stringify(request) });
    return this.comparison(response);
  }

  async compareDcaRevisions(input: CompareDcaRevisionsInput): Promise<DcaRevisionComparison> {
    const response = await this.request(`/dca-investments/${input.operationId}/revision-comparisons`, {
      method: "POST",
      body: JSON.stringify({
        revisionA: input.revisionA,
        revisionB: input.revisionB,
        valuationDate: dateIso(input.valuationDate),
        projectionAssumptions: normalizeProjectionAssumptions(input.projectionAssumptions),
      }),
    });
    const mapped = this.comparison({
      valuationDate: response.valuationDate,
      valuationStatus: response.valuationStatus,
      original: { ...response.original, operationId: input.operationId },
      alternative: { ...response.alternative, operationId: input.operationId },
      difference: response.difference,
    });
    return {
      ...mapped,
      projectionStartInstallmentNumber: response.projectionStartInstallmentNumber,
      originalRevisionNumber: response.original?.revisionNumber ?? input.revisionA,
      alternativeRevisionNumber: response.alternative?.revisionNumber ?? input.revisionB,
    };
  }

  private comparison(x: AnyObject): InvestmentComparison {
    return {
      valuationDate: dateLocal(x.valuationDate),
      valuationStatus: x.valuationStatus === "COMPLETE" ? "complete" : "partial",
      original: this.comparisonScenario(x.original),
      alternative: this.comparisonScenario(x.alternative),
      difference: {
        invested: x.difference?.invested ?? 0,
        value: x.difference?.value ?? null,
        gain: x.difference?.gain ?? null,
        gainRatePercentagePoints: x.difference?.gainRatePercentagePoints ?? null,
      },
    };
  }

  private comparisonScenario(x: AnyObject) {
    const parameters = x.parameters ?? {};
    return {
      operationId: x.operationId ?? null,
      parameters: {
        date: parameters.date ? dateLocal(parameters.date) : undefined,
        configuredAt: parameters.configuredAt ? dateLocal(parameters.configuredAt) : undefined,
        amount: parameters.amount,
        monthlyAmount: parameters.monthlyAmount,
        executionDay: parameters.executionDay,
        delayBusinessDays: parameters.delayBusinessDays,
        allocations: (parameters.allocations ?? []).map((allocation: AnyObject) => ({
          instrumentKind: allocation.instrumentKind === "EURO_FUND" ? "fonds-euro" as const : "uc" as const,
          isin: allocation.isin ?? null,
          symbol: allocation.symbol ?? null,
          name: allocation.name ?? null,
          amount: allocation.amount ?? 0,
        })),
        projectionAssumptions: (parameters.projectionAssumptions ?? []).map((assumption: AnyObject) => ({ isin: assumption.isin, symbol: assumption.symbol ?? null, annualReturn: assumption.annualReturn })),
      },
      valuation: {
        valuationDate: dateLocal(x.valuation?.valuationDate),
        invested: x.valuation?.invested ?? 0,
        value: x.valuation?.value ?? null,
        gain: x.valuation?.gain ?? null,
        gainRatePct: x.valuation?.gainRatePct ?? null,
        allocations: (x.valuation?.allocations ?? []).map((allocation: AnyObject) => ({
          instrumentKind: allocation.instrumentKind === "EURO_FUND" ? "fonds-euro" as const : "uc" as const,
          isin: allocation.isin ?? null,
          symbol: allocation.symbol ?? null,
          name: allocation.name ?? null,
          invested: allocation.invested ?? 0,
          shares: allocation.shares ?? null,
          averagePurchasePrice: allocation.averagePurchasePrice ?? null,
          observedPrice: allocation.observedPrice ?? null,
          observedDate: allocation.observedDate ? dateLocal(allocation.observedDate) : null,
          value: allocation.value ?? null,
          gain: allocation.gain ?? null,
          status: comparisonDataStatus(allocation.status),
          purchaseStatus: comparisonDataStatus(allocation.purchaseStatus),
          annualReturns: allocation.annualReturns ?? [],
          annualRates: allocation.annualRates ?? [],
        })),
        installments: (x.valuation?.installments ?? []).map((installment: AnyObject) => ({
          dueDate: dateLocal(installment.dueDate),
          executionDate: dateLocal(installment.executionDate),
          nature: comparisonInstallmentNature(installment.nature),
          amount: installment.amount ?? 0,
          allocations: (installment.allocations ?? []).map((allocation: AnyObject) => ({
            instrumentKind: allocation.instrumentKind === "EURO_FUND" ? "fonds-euro" as const : "uc" as const,
            isin: allocation.isin ?? null,
            symbol: allocation.symbol ?? null,
            name: allocation.name ?? null,
            amount: allocation.amount ?? 0,
            shares: allocation.shares ?? null,
            purchasePrice: allocation.purchasePrice ?? null,
            purchasePriceDate: allocation.purchasePriceDate ? dateLocal(allocation.purchasePriceDate) : null,
            observedPrice: allocation.observedPrice ?? null,
            observedDate: allocation.observedDate ? dateLocal(allocation.observedDate) : null,
            value: allocation.value ?? null,
            gain: allocation.gain ?? null,
            status: comparisonDataStatus(allocation.status),
            purchaseStatus: comparisonDataStatus(allocation.purchaseStatus),
            annualReturns: allocation.annualReturns ?? [],
            annualRates: allocation.annualRates ?? [],
          })),
        })),
      },
    };
  }
}

function normalizeProjectionAssumptions<T extends { annualReturn: number }>(assumptions: T[]): T[] {
  return assumptions.map((assumption) => {
    if (!Number.isFinite(assumption.annualReturn)) throw new Error("Chaque hypothèse de rendement doit être un nombre valide.");
    // JavaScript floats can stringify with extra digits (for example 0.17329999999999998).
    // The API accepts at most eight fractional digits for annualReturn.
    return { ...assumption, annualReturn: Number(assumption.annualReturn.toFixed(8)) };
  });
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

function comparisonDataStatus(status?: string): "observed" | "projected" | "missing" | "not-executed" {
  if (status === "COURS") return "observed";
  if (status === "PROJETEE") return "projected";
  if (status === "NON_EXECUTEE") return "not-executed";
  return "missing";
}

function comparisonInstallmentNature(nature?: string): "observed" | "projected" | "mixed" | "partial" | "not-yet-executed" {
  if (nature === "OBSERVED") return "observed";
  if (nature === "PROJECTED") return "projected";
  if (nature === "MIXED") return "mixed";
  if (nature === "NOT_YET_EXECUTED") return "not-yet-executed";
  return "partial";
}
