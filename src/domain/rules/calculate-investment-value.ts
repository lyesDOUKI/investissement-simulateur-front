import type {
  HistoricalPrice,
  InstallmentValuation,
  InvestmentValuation,
  Operation,
  Security,
  ValuedAllocation,
} from "@/domain/models/operation";
import { dateToIso, isoToLocalDate, parseDate } from "./dates";
import { generateInstallments } from "./generate-installments";

export type PriceLookup = ReadonlyMap<string, HistoricalPrice>;

const key = (isin: string, date: string) => `${isin}@${date}`;

export function priceLookupKey(isin: string, date: string) {
  return key(isin, date);
}

function dayDifference(from: string, to: string): number {
  const start = isoToLocalDate(from);
  const end = isoToLocalDate(to);
  if (!start || !end) return 0;
  return Math.max(0, (end.getTime() - start.getTime()) / 86_400_000);
}

export function calculateInvestmentValue(
  operation: Operation,
  valuationDateInput: string,
  securities: readonly Security[],
  prices: PriceLookup,
): InvestmentValuation {
  const valuationDate = parseDate(valuationDateInput)
    ? dateToIso(parseDate(valuationDateInput)!)
    : valuationDateInput;
  const installments = generateInstallments(operation, valuationDate);
  const lineTotals = new Map<string, {
    instrumentKind: ValuedAllocation["instrumentKind"];
    isin: string;
    name: string;
    invested: number;
    shares: number;
    value: number;
    averageNumerator: number;
    observedPrice?: number;
    observedDate?: string;
    missingPrice: boolean;
  }>();
  const installmentResults: InstallmentValuation[] = [];
  let invested = 0;
  let missingPrices = false;

  for (const installment of installments) {
    let installmentAmount = 0;
    const valuedLines: InstallmentValuation["allocations"] = [];
    for (const line of operation.allocations) {
      const amount = line.amount;
      installmentAmount += amount;
      invested += amount;
      const security = securities.find(
        (item) => item.isin === line.isin && item.instrumentKind === line.instrumentKind,
      );
      const name = line.name ?? security?.shortName ?? line.isin;
      const positionKey = line.instrumentKind === "uc"
        ? `${line.instrumentKind}:${line.isin}`
        : `${line.instrumentKind}:${line.name?.trim().toLowerCase() ?? line.isin}`;
      const displayIsin = line.instrumentKind === "uc" ? line.isin : (line.name?.trim() ?? "Fonds euro");
      const position = lineTotals.get(positionKey) ?? {
        instrumentKind: line.instrumentKind,
        isin: displayIsin,
        name,
        invested: 0,
        shares: 0,
        value: 0,
        averageNumerator: 0,
        missingPrice: false,
      };
      position.invested += amount;

      if (line.instrumentKind === "fonds-euro") {
        const annualRate = Math.max(0, line.annualReturnPct ?? 0) / 100;
        const years = dayDifference(installment.executionDate, valuationDate) / 365.25;
        const value = amount * (1 + annualRate) ** years;
        position.value += value;
        position.shares += amount;
        valuedLines.push({
          isin: line.isin,
          name,
          amount,
          shares: amount,
          status: "rendement-estime",
        });
      } else {
        const purchase = prices.get(key(line.isin, installment.executionDate));
        if (!purchase || purchase.price <= 0) {
          position.missingPrice = true;
          missingPrices = true;
          valuedLines.push({ isin: line.isin, name, amount, shares: 0, status: "cours-indisponible" });
        } else {
          const shares = amount / purchase.price;
          position.shares += shares;
          position.averageNumerator += amount;
          valuedLines.push({
            isin: line.isin,
            name,
            amount,
            shares,
            purchasePrice: purchase.price,
            purchasePriceDate: purchase.date,
            status: "cours-demo",
          });
        }
      }
      lineTotals.set(positionKey, position);
    }
    installmentResults.push({
      dueDate: installment.dueDate,
      executionDate: installment.executionDate,
      amount: installmentAmount,
      allocations: valuedLines,
    });
  }

  for (const position of lineTotals.values()) {
    if (position.instrumentKind !== "uc" || position.shares === 0) continue;
    const quote = prices.get(key(position.isin, valuationDate));
    if (!quote || quote.price <= 0) {
      position.missingPrice = true;
      missingPrices = true;
      continue;
    }
    position.observedPrice = quote.price;
    position.observedDate = quote.date;
    position.value = position.shares * quote.price;
  }

  const allocations: ValuedAllocation[] = [...lineTotals.values()].map((item) => ({
    instrumentKind: item.instrumentKind,
    isin: item.isin,
    name: item.name,
    invested: item.invested,
    shares: item.shares,
    averagePurchasePrice:
      item.instrumentKind === "uc" && item.shares > 0
        ? item.averageNumerator / item.shares
        : undefined,
    observedPrice: item.observedPrice,
    observedDate: item.observedDate,
    value: item.value,
    gain: item.value - item.invested,
    status: item.missingPrice
      ? "cours-indisponible"
      : item.instrumentKind === "uc"
        ? "cours-demo"
        : "rendement-estime",
  }));
  const value = allocations.reduce((total, item) => total + item.value, 0);

  return {
    operationId: operation.id,
    valuationDate,
    invested,
    value,
    gain: value - invested,
    installmentCount: installments.length,
    installments: installmentResults,
    allocations,
    hasMissingPrices: missingPrices,
  };
}
