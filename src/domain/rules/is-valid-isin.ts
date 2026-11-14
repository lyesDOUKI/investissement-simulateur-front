export function isValidIsin(value: string): boolean {
  if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(value)) return false;

  const expanded = [...value]
    .map((character) =>
      /[A-Z]/.test(character)
        ? String(character.charCodeAt(0) - 55)
        : character,
    )
    .join("");
  let sum = 0;
  let double = false;

  for (let index = expanded.length - 1; index >= 0; index -= 1) {
    const digit = Number(expanded[index]) * (double ? 2 : 1);
    sum += digit > 9 ? digit - 9 : digit;
    double = !double;
  }

  return sum % 10 === 0;
}
