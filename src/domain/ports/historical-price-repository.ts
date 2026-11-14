import type { HistoricalPrice } from "@/domain/models/operation";

export interface HistoricalPriceRepository {
  getPriceOnOrBefore(isin: string, date: string): Promise<HistoricalPrice | null>;
}
