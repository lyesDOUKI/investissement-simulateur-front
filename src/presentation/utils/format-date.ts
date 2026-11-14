export function formatDateLabel(value: string): string {
  const dayFirst = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const yearFirst = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const parts = dayFirst
    ? [Number(dayFirst[1]), Number(dayFirst[2]), Number(dayFirst[3])]
    : yearFirst
      ? [Number(yearFirst[3]), Number(yearFirst[2]), Number(yearFirst[1])]
      : null;
  if (!parts) return value;
  const date = new Date(parts[2], parts[1] - 1, parts[0]);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
