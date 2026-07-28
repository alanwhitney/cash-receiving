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

/**
 * Reconstructs a full UPC-A from a POS PLU number that has had its leading
 * zero and check digit stripped. A 10-digit PLU is missing the leading system
 * digit (0) and the check digit; an 11-digit PLU already has a non-zero
 * system digit and is only missing the check digit. Anything else (produce
 * PLUs, department codes, etc.) isn't a derivable UPC and returns null.
 */
export function upcFromPlu(plu: string): string | null {
  const trimmed = plu.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  if (trimmed.length === 10) return completeUpc("0" + trimmed);
  if (trimmed.length === 11) return completeUpc(trimmed);
  return null;
}
