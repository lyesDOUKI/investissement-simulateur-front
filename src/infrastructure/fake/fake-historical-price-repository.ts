import type { HistoricalPrice } from "@/domain/models/operation";
import type { HistoricalPriceRepository } from "@/domain/ports/historical-price-repository";

const prices: HistoricalPrice[] = [
  { isin: "FR0010380675", date: "2026-09-15", price: 3156.53, currency: "EUR" },
  { isin: "FR0010380675", date: "2026-10-14", price: 3165.08, currency: "EUR" },
  { isin: "FR0010380675", date: "2026-11-13", price: 3002.18, currency: "EUR" },
  { isin: "IE00B4L5Y983", date: "2026-11-13", price: 113.42, currency: "EUR" },
  { isin: "IE00B53SZB19", date: "2026-11-13", price: 502.18, currency: "EUR" },
];

export class FakeHistoricalPriceRepository implements HistoricalPriceRepository {
  async getPriceOnOrBefore(isin: string, date: string) {
    return prices.filter((item) => item.isin === isin && item.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
  }
}
