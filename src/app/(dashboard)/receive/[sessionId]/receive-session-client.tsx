"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  Scan,
  Package,
  Trash2,
  Pencil,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import {
  addReceiveLine,
  updateReceiveLine,
  removeReceiveLine,
  completeSession,
  deleteSession,
} from "@/app/actions/receive";
import { lookupItemByUpc } from "@/app/actions/items";
import { toast } from "@/components/ui/use-toast";
import { calcMargin, calcUnitCost } from "@/lib/margin";
import { formatCurrency } from "@/lib/utils";
import { completeUpc } from "@/lib/upc";
import { UpcBarcode } from "@/components/ui/upc-barcode";
import type { ReceiveSession, ReceiveLine, Item, Department } from "@/types/database";

type ItemWithDept = Item & { departments: Department | null };
type LineWithItem = ReceiveLine & { items: ItemWithDept };

interface Props {
  session: ReceiveSession & { vendors: { name: string } };
  initialLines: LineWithItem[];
}

export function ReceiveSessionClient({ session, initialLines }: Props) {
  const router = useRouter();
  const scanInputRef = useRef<HTMLInputElement>(null);
  const scanBufferRef = useRef<string>("");
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [lines, setLines] = useState<LineWithItem[]>(initialLines);
  const [scanValue, setScanValue] = useState("");
  const [foundItem, setFoundItem] = useState<ItemWithDept | null>(null);
  const [notFoundUpc, setNotFoundUpc] = useState<string | null>(null);
  const [addLineOpen, setAddLineOpen] = useState(false);
  const [editLine, setEditLine] = useState<LineWithItem | null>(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [applyPrices, setApplyPrices] = useState(true);
  const [loading, setLoading] = useState(false);

  const isCompleted = session.status === "completed";

  // Re-focus scan input after dialogs close on tablet
  useEffect(() => {
    if (!addLineOpen && !editLine && !completeOpen && !isCompleted) {
      setTimeout(() => scanInputRef.current?.focus(), 100);
    }
  }, [addLineOpen, editLine, completeOpen, isCompleted]);

  // BT scanner detection: fast keystrokes (< 50ms apart) + Enter = scanner
  const handleScanKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isCompleted) return;

      if (e.key === "Enter") {
        e.preventDefault();
        const upc = scanBufferRef.current.trim();
        scanBufferRef.current = "";
        setScanValue("");
        if (upc.length >= 6) {
          processUpc(upc);
        }
        return;
      }

      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      scanBufferRef.current += e.key.length === 1 ? e.key : "";

      scanTimerRef.current = setTimeout(() => {
        // If user typed manually (slow), just let the input show it
        scanBufferRef.current = scanInputRef.current?.value ?? "";
      }, 80);
    },
    [isCompleted] // eslint-disable-line react-hooks/exhaustive-deps
  );

  async function processUpc(upc: string) {
    const item = await lookupItemByUpc(completeUpc(upc));
    if (item) {
      setFoundItem(item as unknown as ItemWithDept);
      setAddLineOpen(true);
    } else {
      setNotFoundUpc(upc);
    }
  }

  async function handleManualSearch() {
    const upc = scanValue.trim();
    if (!upc) return;
    setScanValue("");
    await processUpc(upc);
  }

  async function handleAddLine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!foundItem) return;
    const fd = new FormData(e.currentTarget);
    const cases = parseInt(fd.get("cases_received") as string) || 1;
    const costOverride = fd.get("case_cost_override") as string;
    const discountOverride = fd.get("case_discount_override") as string;
    const costVal = costOverride ? parseFloat(costOverride) : null;
    const discVal = discountOverride ? parseFloat(discountOverride) : null;

    setLoading(true);
    const result = await addReceiveLine(
      session.id,
      foundItem.id,
      cases,
      costVal,
      discVal
    );
    setLoading(false);

    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      setAddLineOpen(false);
      setFoundItem(null);
      // Optimistic: refresh lines from server
      toast({ title: `Added ${cases} case${cases > 1 ? "s" : ""} of ${foundItem.name}` });
      router.refresh();
    }
  }

  async function handleEditLine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editLine) return;
    const fd = new FormData(e.currentTarget);
    const cases = parseInt(fd.get("cases_received") as string) || 1;
    const costOverride = fd.get("case_cost_override") as string;
    const discountOverride = fd.get("case_discount_override") as string;
    const costVal = costOverride ? parseFloat(costOverride) : null;
    const discVal = discountOverride ? parseFloat(discountOverride) : null;

    setLoading(true);
    const result = await updateReceiveLine(
      editLine.id,
      session.id,
      cases,
      costVal,
      discVal
    );
    setLoading(false);

    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      setEditLine(null);
      toast({ title: "Line updated" });
      router.refresh();
    }
  }

  async function handleRemoveLine(line: LineWithItem) {
    setLoading(true);
    const result = await removeReceiveLine(line.id, session.id);
    setLoading(false);
    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      toast({ title: "Line removed" });
      router.refresh();
    }
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteSession(session.id);
    setLoading(false);
    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      router.push("/receive");
    }
  }

  async function handleComplete() {
    setLoading(true);
    const result = await completeSession(session.id, applyPrices);
    setLoading(false);
    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      setCompleteOpen(false);
      toast({ title: "Session completed" });
      router.refresh();
    }
  }

  // Use server-provided lines after refresh, not local state
  useEffect(() => {
    setLines(initialLines);
  }, [initialLines]);

  const linesWithCostChange = lines.filter(
    (l) => l.case_cost_override !== null
  );

  const sessionTotal = lines.reduce((sum, line) => {
    const item = line.items;
    const grossCost = line.case_cost_override ?? item.case_cost;
    const discount = line.case_discount_override ?? item.case_discount;
    const depositPerCase = item.case_size * (item.bottle_deposit ?? 0);
    const netCaseCost = grossCost - discount + depositPerCase;
    return sum + line.cases_received * netCaseCost;
  }, 0);

  const totalCases = lines.reduce((sum, l) => sum + l.cases_received, 0);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link href="/receive">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold leading-tight">
            {session.vendors.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date(session.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={isCompleted ? "secondary" : "warning"}>
          {isCompleted ? "Completed" : "Open"}
        </Badge>
        {!isCompleted && (
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
            title="Delete session"
          >
            <XCircle className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Scan area */}
      {!isCompleted && (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={scanInputRef}
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                  onKeyDown={handleScanKeyDown}
                  placeholder="Scan UPC or type to search..."
                  className="pl-10 text-base h-12"
                  inputMode="numeric"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <Button
                size="lg"
                onClick={handleManualSearch}
                disabled={!scanValue.trim()}
              >
                Find
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Scan with bluetooth scanner or type UPC and press Enter / Find
            </p>
          </CardContent>
        </Card>
      )}

      {/* Not found notice */}
      {notFoundUpc && (
        <Card className="mb-4 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="font-medium text-yellow-900">
                UPC not found: {notFoundUpc}
              </p>
              <p className="text-sm text-yellow-700">
                Add this item to a vendor first, then scan again.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNotFoundUpc(null)}
              className="text-yellow-700"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lines */}
      <div className="space-y-2 mb-4">
        {lines.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-10 text-center">
              <Package className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="font-medium">No items received yet</p>
              {!isCompleted && (
                <p className="text-sm text-muted-foreground">
                  Scan a UPC to get started
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          lines.map((line) => {
            const item = line.items;
            const effectiveCost =
              line.case_cost_override ?? item.case_cost;
            const effectiveDiscount =
              line.case_discount_override ?? item.case_discount;
            const unitCost = calcUnitCost({
              caseCost: effectiveCost,
              caseSize: item.case_size,
              caseDiscount: effectiveDiscount,
              unitRetail: item.unit_retail,
            });
            const margin = calcMargin({
              caseCost: effectiveCost,
              caseSize: item.case_size,
              caseDiscount: effectiveDiscount,
              unitRetail: item.unit_retail,
            });
            const targetMargin = item.departments?.target_margin ?? 0;
            const diff = margin - targetMargin;
            const badgeVariant =
              diff >= 0 ? "success" : diff >= -5 ? "warning" : "destructive";
            const deposit = item.bottle_deposit ?? 0;
            const netCaseCost = effectiveCost - effectiveDiscount + item.case_size * deposit;
            const lineTotal = line.cases_received * netCaseCost;
            const costChanged = line.case_cost_override !== null;

            return (
              <Card
                key={line.id}
                className={costChanged ? "border-blue-200" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{item.name}</span>
                        <Badge variant={badgeVariant as "success" | "warning" | "destructive"}>
                          {margin.toFixed(1)}%
                        </Badge>
                        {costChanged && (
                          <Badge variant="outline" className="text-blue-600 border-blue-300">
                            Cost updated
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-muted-foreground">
                        <span>Cost: {formatCurrency(effectiveCost)}</span>
                        {effectiveDiscount > 0 && (
                          <span>Disc: {formatCurrency(effectiveDiscount)}</span>
                        )}
                        {deposit > 0 && (
                          <span>Dep: {formatCurrency(item.case_size * deposit)}/case</span>
                        )}
                        <span>Unit: {formatCurrency(unitCost)}</span>
                        <span>Retail: {formatCurrency(item.unit_retail)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm font-medium">
                        <span>{line.cases_received} case{line.cases_received !== 1 ? "s" : ""} × {formatCurrency(netCaseCost)} = {formatCurrency(lineTotal)}</span>
                      </div>
                      <div className="mt-2">
                        <UpcBarcode upc={item.upc} />
                      </div>
                    </div>
                    {!isCompleted && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditLine(line)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleRemoveLine(line)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Session total */}
      {lines.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {lines.length} item{lines.length !== 1 ? "s" : ""} · {totalCases} case{totalCases !== 1 ? "s" : ""}
            </span>
            <span className="text-lg font-semibold">
              Total: {formatCurrency(sessionTotal)}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Complete button */}
      {!isCompleted && lines.length > 0 && (
        <Button
          className="w-full"
          size="lg"
          onClick={() => setCompleteOpen(true)}
        >
          <CheckCircle className="h-5 w-5" />
          Complete Session
        </Button>
      )}

      {/* Add line dialog (after scan) */}
      <Dialog
        open={addLineOpen}
        onOpenChange={(o) => {
          if (!o) {
            setAddLineOpen(false);
            setFoundItem(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Receive</DialogTitle>
          </DialogHeader>
          {foundItem && (
            <form onSubmit={handleAddLine} className="space-y-4">
              <div className="rounded-md bg-muted p-3 space-y-1">
                <p className="font-medium">{foundItem.name}</p>
                <p className="text-sm text-muted-foreground">
                  UPC: {foundItem.upc}
                </p>
                <p className="text-sm text-muted-foreground">
                  Current cost: {formatCurrency(foundItem.case_cost)} / case ·
                  Retail: {formatCurrency(foundItem.unit_retail)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cases_received">Cases Received *</Label>
                <Input
                  id="cases_received"
                  name="cases_received"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                  autoFocus
                  inputMode="numeric"
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="case_cost_override">
                  Case Cost Override{" "}
                  <span className="text-muted-foreground font-normal">
                    (leave blank to keep {formatCurrency(foundItem.case_cost)})
                  </span>
                </Label>
                <Input
                  id="case_cost_override"
                  name="case_cost_override"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={foundItem.case_cost.toString()}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="case_discount_override">
                  Discount $ Override{" "}
                  <span className="text-muted-foreground font-normal">
                    (leave blank to keep {formatCurrency(foundItem.case_discount)})
                  </span>
                </Label>
                <Input
                  id="case_discount_override"
                  name="case_discount_override"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={foundItem.case_discount.toString()}
                  inputMode="decimal"
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAddLineOpen(false);
                    setFoundItem(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit line dialog */}
      <Dialog open={!!editLine} onOpenChange={(o) => !o && setEditLine(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Line</DialogTitle>
          </DialogHeader>
          {editLine && (
            <form onSubmit={handleEditLine} className="space-y-4">
              <p className="font-medium">{editLine.items.name}</p>
              <div className="space-y-2">
                <Label htmlFor="edit_cases">Cases Received</Label>
                <Input
                  id="edit_cases"
                  name="cases_received"
                  type="number"
                  min="1"
                  defaultValue={editLine.cases_received}
                  required
                  autoFocus
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_cost">Case Cost Override</Label>
                <Input
                  id="edit_cost"
                  name="case_cost_override"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editLine.case_cost_override ?? ""}
                  placeholder={editLine.items.case_cost.toString()}
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_discount">Discount $ Override</Label>
                <Input
                  id="edit_discount"
                  name="case_discount_override"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={editLine.case_discount_override ?? ""}
                  placeholder={editLine.items.case_discount.toString()}
                  inputMode="decimal"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditLine(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete session dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete session?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this receiving session and all{" "}
            {lines.length > 0 && <strong>{lines.length} scanned line{lines.length !== 1 ? "s" : ""}. </strong>}
            No item costs will be changed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete session dialog */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Session?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {lines.length} item{lines.length !== 1 ? "s" : ""} received from{" "}
              {session.vendors.name}.
            </p>
            {linesWithCostChange.length > 0 && (
              <div className="rounded-md border p-3 space-y-2">
                <p className="text-sm font-medium">
                  {linesWithCostChange.length} item{linesWithCostChange.length !== 1 ? "s have" : " has"} cost
                  overrides
                </p>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyPrices}
                    onChange={(e) => setApplyPrices(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Apply cost changes to item records
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={loading}>
              {loading ? "Completing..." : "Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
