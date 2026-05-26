"use client";

import Barcode from "react-barcode";
import type React from "react";

type BarcodeFormat = NonNullable<React.ComponentProps<typeof Barcode>["format"]>;

function formatForBarcode(upc: string): { value: string; format: BarcodeFormat } {
  const digits = upc.replace(/\D/g, "");
  if (digits.length === 12) return { value: digits, format: "UPC" };
  if (digits.length === 13) return { value: digits, format: "EAN13" };
  if (digits.length === 8) return { value: digits, format: "EAN8" };
  return { value: upc, format: "CODE128" };
}

export function UpcBarcode({ upc }: { upc: string }) {
  const { value, format } = formatForBarcode(upc);
  return (
    <Barcode
      value={value}
      format={format}
      width={1.4}
      height={40}
      fontSize={10}
      margin={0}
      displayValue={false}
    />
  );
}
