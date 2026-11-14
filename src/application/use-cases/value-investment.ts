import type {
  InvestmentValuation,
  Operation,
  Security,
} from "@/domain/models/operation";
import type { HistoricalPriceRepository } from "@/domain/ports/historical-price-repository";
import { calculateInvestmentValue, priceLookupKey } from "@/domain/rules/calculate-investment-value";
import { generateInstallments } from "@/domain/rules/generate-installments";
import { dateToIso, parseDate } from "@/domain/rules/dates";

export class ValueInvestment {
  constructor(
    private readonly prices: HistoricalPriceRepository,
    private readonly securities: () => Promise<Security[]>,
  ) {}

  async execute(operation: Operation, valuationDate: string): Promise<InvestmentValuation> {
    const parsedDate = parseDate(valuationDate);
    if (!parsedDate) throw new Error("Saisissez une date valide au format JJ/MM/AAAA.");
    const normalizedDate = dateToIso(parsedDate);
    const today = new Date();
    const todayIso = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
    if (normalizedDate > todayIso) throw new Error("Choisissez une date passée ou aujourd’hui pour une valorisation historique.");
    const installments = generateInstallments(operation, normalizedDate);
    const requested = new Set<string>();
    for (const installment of installments) {
      for (const line of operation.allocations) {
        if (line.instrumentKind === "uc") {
          requested.add(priceLookupKey(line.isin, installment.executionDate));
        }
      }
    }
    for (const line of operation.allocations) {
      if (line.instrumentKind === "uc") {
        requested.add(priceLookupKey(line.isin, normalizedDate));
      }
    }

    const quotes = await Promise.all(
      [...requested].map(async (requestedKey) => {
        const separator = requestedKey.lastIndexOf("@");
        const isin = requestedKey.slice(0, separator);
        const date = requestedKey.slice(separator + 1);
        const quote = await this.prices.getPriceOnOrBefore(isin, date);
        return [requestedKey, quote] as const;
      }),
    );
    const priceMap = new Map(quotes.filter((entry) => entry[1] !== null)) as Map<
      string,
      NonNullable<(typeof quotes)[number][1]>
    >;
    return calculateInvestmentValue(
      operation,
      valuationDate,
      await this.securities(),
      priceMap,
    );
  }
}
