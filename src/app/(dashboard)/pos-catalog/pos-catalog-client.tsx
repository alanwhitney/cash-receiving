"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, Database, Trash2 } from "lucide-react";
import { importPosCatalog, clearPosCatalog } from "@/app/actions/pos-catalog";
import { toast } from "@/components/ui/use-toast";

export function PosCatalogClient({
  count,
  lastImportedAt,
}: {
  count: number;
  lastImportedAt: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      toast({ variant: "destructive", title: "Choose a CSV file first" });
      return;
    }
    setLoading(true);
    try {
      const result = await importPosCatalog(formData);
      if ("error" in result) {
        toast({ variant: "destructive", title: "Import failed", description: result.error });
      } else {
        toast({
          title: "Catalog imported",
          description: `${result.imported} rows imported, ${result.withUpc} matched to a UPC`,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Import failed",
        description: err instanceof Error ? err.message : "Unexpected error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (!confirm("Remove all imported POS catalog data?")) return;
    setClearing(true);
    try {
      const result = await clearPosCatalog();
      if (result?.error) {
        toast({ variant: "destructive", title: "Error", description: result.error });
      } else {
        toast({ title: "Catalog cleared" });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Unexpected error",
      });
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          POS Catalog
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Import a register PLU/sales export to pre-fill item name and retail
          price by UPC when adding new items.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current catalog</CardTitle>
          <CardDescription>
            {count} item{count === 1 ? "" : "s"} loaded
            {lastImportedAt &&
              ` · last import ${new Date(lastImportedAt).toLocaleString()}`}
          </CardDescription>
        </CardHeader>
        {count > 0 && (
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={handleClear}
              disabled={clearing}
            >
              <Trash2 className="h-4 w-4" />
              {clearing ? "Clearing..." : "Clear catalog"}
            </Button>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import CSV</CardTitle>
          <CardDescription>
            Columns expected: PLU No., Description, Dep, Price. Re-importing
            updates existing entries by PLU.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImport} className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              name="file"
              accept=".csv,text/csv"
              className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
              required
            />
            <Button type="submit" disabled={loading} className="self-start">
              <Upload className="h-4 w-4" />
              {loading ? "Importing..." : "Import"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
