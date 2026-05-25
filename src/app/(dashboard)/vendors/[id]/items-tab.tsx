"use client";

import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Package, Pencil, Trash2, History } from "lucide-react";
import { createItem, updateItem, deleteItem } from "@/app/actions/items";
import { toast } from "@/components/ui/use-toast";
import { calcMargin, calcUnitCost } from "@/lib/margin";
import { formatCurrency } from "@/lib/utils";
import type { Department, Item } from "@/types/database";
import { PriceHistoryDialog } from "./price-history-dialog";

type ItemWithDept = Item & { departments: Department | null };

function calcUnitCostLib(item: Item) {
  return calcUnitCost({
    caseCost: item.case_cost,
    caseSize: item.case_size,
    caseDiscount: item.case_discount,
    unitRetail: item.unit_retail,
  });
}

function calcMarginLib(item: Item) {
  return calcMargin({
    caseCost: item.case_cost,
    caseSize: item.case_size,
    caseDiscount: item.case_discount,
    unitRetail: item.unit_retail,
  });
}

export function ItemsTab({
  vendorId,
  items,
  departments,
}: {
  vendorId: string;
  items: ItemWithDept[];
  departments: Department[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<ItemWithDept | null>(null);
  const [deleteItem_, setDeleteItem] = useState<ItemWithDept | null>(null);
  const [historyItem, setHistoryItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.upc.includes(search)
  );

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await createItem(vendorId, new FormData(e.currentTarget)) as { error?: string };
    setLoading(false);
    if (result?.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      setAddOpen(false);
      toast({ title: "Item added" });
    }
  }

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editItem) return;
    setLoading(true);
    const result = await updateItem(
      editItem.id,
      vendorId,
      new FormData(e.currentTarget)
    ) as { error?: string };
    setLoading(false);
    if (result?.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      setEditItem(null);
      toast({ title: "Item updated" });
    }
  }

  async function handleDelete() {
    if (!deleteItem_) return;
    setLoading(true);
    const result = await deleteItem(deleteItem_.id, vendorId) as { error?: string };
    setLoading(false);
    if (result?.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else {
      setDeleteItem(null);
      toast({ title: "Item deleted" });
    }
  }

  return (
    <div className="mt-4">
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Search by name or UPC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Item</span>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Package className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="font-medium">
              {search ? "No items match your search" : "No items yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const margin = calcMarginLib(item);
            const unitCost = calcUnitCostLib(item);
            const targetMargin = item.departments?.target_margin ?? 0;
            const diff = margin - targetMargin;
            const badgeVariant =
              diff >= 0 ? "success" : diff >= -5 ? "warning" : "destructive";

            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{item.name}</p>
                        <Badge variant={badgeVariant as "success" | "warning" | "destructive"}>
                          {formatPercent(margin)}
                        </Badge>
                        {item.departments && (
                          <Badge variant="outline" className="text-xs">
                            {item.departments.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        UPC: {item.upc}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-sm text-muted-foreground">
                        <span>Case cost: {formatCurrency(item.case_cost)}</span>
                        <span>Pack: {item.case_size}</span>
                        {item.case_discount > 0 && (
                          <span>Disc: {item.case_discount}%</span>
                        )}
                        <span>Unit cost: {formatCurrency(unitCost)}</span>
                        <span>Retail: {formatCurrency(item.unit_retail)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setHistoryItem(item)}
                        title="Price history"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditItem(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeleteItem(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <ItemFormFields departments={departments} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editItem && (
            <form onSubmit={handleEdit} className="space-y-4">
              <ItemFormFields departments={departments} defaults={editItem} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditItem(null)}>
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

      {/* Delete dialog */}
      <Dialog open={!!deleteItem_} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete item?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Remove <strong>{deleteItem_?.name}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price history */}
      {historyItem && (
        <PriceHistoryDialog
          item={historyItem}
          open={!!historyItem}
          onClose={() => setHistoryItem(null)}
        />
      )}
    </div>
  );
}

function ItemFormFields({
  departments,
  defaults,
}: {
  departments: Department[];
  defaults?: Item;
}) {
  const [previewMargin, setPreviewMargin] = useState(() =>
    defaults
      ? calcMargin({
          caseCost: defaults.case_cost,
          caseSize: defaults.case_size,
          caseDiscount: defaults.case_discount,
          unitRetail: defaults.unit_retail,
        })
      : 0
  );

  function recalc(form: HTMLFormElement) {
    const caseCost = parseFloat(
      (form.querySelector('[name="case_cost"]') as HTMLInputElement)?.value
    );
    const caseSize = parseInt(
      (form.querySelector('[name="case_size"]') as HTMLInputElement)?.value
    );
    const caseDiscount = parseFloat(
      (form.querySelector('[name="case_discount"]') as HTMLInputElement)?.value
    ) || 0;
    const unitRetail = parseFloat(
      (form.querySelector('[name="unit_retail"]') as HTMLInputElement)?.value
    );
    if (!isNaN(caseCost) && !isNaN(caseSize) && !isNaN(unitRetail)) {
      setPreviewMargin(calcMargin({ caseCost, caseSize, caseDiscount, unitRetail }));
    }
  }

  return (
    <div
      onChange={(e) => recalc((e.currentTarget as HTMLElement).closest("form")!)}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaults?.name}
            required
            placeholder="Product name"
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="upc">UPC *</Label>
          <Input
            id="upc"
            name="upc"
            defaultValue={defaults?.upc}
            required
            placeholder="012345678901"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="case_cost">Case Cost *</Label>
          <Input
            id="case_cost"
            name="case_cost"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.case_cost ?? ""}
            required
            placeholder="0.00"
            inputMode="decimal"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="case_size">Case Size *</Label>
          <Input
            id="case_size"
            name="case_size"
            type="number"
            min="1"
            step="1"
            defaultValue={defaults?.case_size ?? ""}
            required
            placeholder="12"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="case_discount">Discount %</Label>
          <Input
            id="case_discount"
            name="case_discount"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={defaults?.case_discount ?? "0"}
            placeholder="0"
            inputMode="decimal"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit_retail">Unit Retail *</Label>
          <Input
            id="unit_retail"
            name="unit_retail"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaults?.unit_retail ?? ""}
            required
            placeholder="0.00"
            inputMode="decimal"
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label htmlFor="department_id">Department</Label>
          <Select
            name="department_id"
            defaultValue={defaults?.department_id ?? ""}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No department</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name} (target: {d.target_margin}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="mt-3 p-3 rounded-md bg-muted text-sm">
        <span className="text-muted-foreground">Margin preview: </span>
        <span
          className={
            previewMargin >= 30
              ? "font-semibold text-green-600"
              : previewMargin >= 20
              ? "font-semibold text-yellow-600"
              : "font-semibold text-red-600"
          }
        >
          {formatPercent(previewMargin)}
        </span>
      </div>
    </div>
  );
}

function formatPercent(v: number) {
  return `${v.toFixed(1)}%`;
}
