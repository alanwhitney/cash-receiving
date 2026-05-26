/**
 * Appends the GS1 check digit to an 11-digit (UPC-A) or 12-digit (EAN-13) string.
 * Returns the input unchanged for any other length or non-numeric input.
 */
export function completeUpc(digits: string): string {
  const trimmed = digits.trim();
  if (!/^\d+$/.test(trimmed)) return trimmed;
  const n = trimmed.length;
  if (n !== 11 && n !== 12) return trimmed;

  const [oddMult, evenMult] = n === 11 ? [3, 1] : [1, 3];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += parseInt(trimmed[i]) * (i % 2 === 0 ? oddMult : evenMult);
  }
  return trimmed + ((10 - (sum % 10)) % 10).toString();
}
