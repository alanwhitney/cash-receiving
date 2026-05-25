"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { calcMargin } from "@/lib/margin";
import { formatCurrency } from "@/lib/utils";
import type { Item, ItemPriceHistory } from "@/types/database";

export function PriceHistoryDialog({
  item,
  open,
  onClose,
}: {
  item: Item;
  open: boolean;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<ItemPriceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase
      .from("item_price_history")
      .select("*")
      .eq("item_id", item.id)
      .order("recorded_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setHistory(data ?? []);
        setLoading(false);
      });
  }, [open, item.id]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Price History — {item.name}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Loading...
          </p>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No price changes recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Case Cost</th>
                  <th className="pb-2 pr-3">Pack</th>
                  <th className="pb-2 pr-3">Disc%</th>
                  <th className="pb-2 pr-3">Retail</th>
                  <th className="pb-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const margin = calcMargin({
                    caseCost: h.case_cost,
                    caseSize: h.case_size,
                    caseDiscount: h.case_discount,
                    unitRetail: h.unit_retail,
                  });
                  return (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {new Date(h.recorded_at).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-3">{formatCurrency(h.case_cost)}</td>
                      <td className="py-2 pr-3">{h.case_size}</td>
                      <td className="py-2 pr-3">{h.case_discount}%</td>
                      <td className="py-2 pr-3">{formatCurrency(h.unit_retail)}</td>
                      <td className="py-2">
                        <span
                          className={
                            margin >= 30
                              ? "text-green-600 font-medium"
                              : margin >= 20
                              ? "text-yellow-600 font-medium"
                              : "text-red-600 font-medium"
                          }
                        >
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
