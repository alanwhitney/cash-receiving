"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { createSession } from "@/app/actions/receive";
import { toast } from "@/components/ui/use-toast";

export function StartSessionClient({
  vendors,
}: {
  vendors: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleStart() {
    if (!vendorId) return;
    setLoading(true);
    const result = await createSession(vendorId) as { error?: string; data?: { id: string } };
    setLoading(false);
    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else if (result.data) {
      router.push(`/receive/${result.data.id}`);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Session
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Receiving Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Vendor</Label>
              {vendors.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No vendors yet. Add a vendor first.
                </p>
              ) : (
                <Select value={vendorId} onValueChange={setVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose vendor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStart}
              disabled={!vendorId || loading || vendors.length === 0}
            >
              {loading ? "Starting..." : "Start Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
