export function parseDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return date;
}

export function dateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isoToLocalDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return dateToIso(date) === value ? date : null;
}

export function formatIsoDate(value: string): string {
  const date = isoToLocalDate(value);
  return date
    ? `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`
    : value;
}

export function addBusinessDays(date: Date, businessDays: number): Date {
  const result = new Date(date);
  if (businessDays === 0) {
    while (result.getUTCDay() === 0 || result.getUTCDay() === 6) {
      result.setUTCDate(result.getUTCDate() + 1);
    }
    return result;
  }
  let remaining = businessDays;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (result.getUTCDay() !== 0 && result.getUTCDay() !== 6) remaining -= 1;
  }
  return result;
}
