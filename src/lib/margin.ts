export interface MarginInputs {
  caseCost: number;
  caseSize: number;
  caseDiscount: number;
  unitRetail: number;
}

export function calcUnitCost(inputs: MarginInputs): number {
  const { caseCost, caseSize, caseDiscount } = inputs;
  if (caseSize <= 0) return 0;
  const netCaseCost = caseCost - caseDiscount;
  return netCaseCost / caseSize;
}

export function calcMargin(inputs: MarginInputs): number {
  const unitCost = calcUnitCost(inputs);
  const { unitRetail } = inputs;
  if (unitRetail <= 0) return 0;
  return ((unitRetail - unitCost) / unitRetail) * 100;
}

export function marginColor(margin: number, targetMargin: number): string {
  const diff = margin - targetMargin;
  if (diff >= 0) return "text-green-600";
  if (diff >= -5) return "text-yellow-600";
  return "text-red-600";
}

export function marginBadgeVariant(
  margin: number,
  targetMargin: number
): "default" | "secondary" | "destructive" {
  const diff = margin - targetMargin;
  if (diff >= 0) return "default";
  if (diff >= -5) return "secondary";
  return "destructive";
}
