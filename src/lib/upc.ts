/**
 * Appends the UPC-A check digit to an 11-digit string.
 * A complete UPC-A (12 digits) or EAN-13 (13 digits) is returned unchanged.
 * Any other length or non-numeric input is returned unchanged.
 */
export function completeUpc(digits: string): string {
  const trimmed = digits.trim();
  if (!/^\d+$/.test(trimmed)) return trimmed;
  if (trimmed.length !== 11) return trimmed;

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += parseInt(trimmed[i]) * (i % 2 === 0 ? 3 : 1);
  }
  return trimmed + ((10 - (sum % 10)) % 10).toString();
}
