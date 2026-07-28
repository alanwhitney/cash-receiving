"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { parseCsvLine } from "@/lib/csv";
import { upcFromPlu } from "@/lib/upc";

const BATCH_SIZE = 500;

export async function importPosCatalog(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "No file provided" };

  const text = await file.text();
  const lines = text.split(/\r?\n/);

  type Row = {
    user_id: string;
    plu: string;
    upc: string | null;
    description: string;
    price: number | null;
  };
  const rows: Row[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    const plu = (fields[0] ?? "").trim();
    const description = (fields[1] ?? "").trim();
    const priceRaw = (fields[3] ?? "").trim();

    if (!/^\d+$/.test(plu) || !description) continue;

    const price = parseFloat(priceRaw.replace(/,/g, ""));

    rows.push({
      user_id: user.id,
      plu,
      upc: upcFromPlu(plu),
      description,
      price: isNaN(price) ? null : price,
    });
  }

  if (rows.length === 0) return { error: "No valid rows found in file" };

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("pos_catalog")
      .upsert(batch, { onConflict: "user_id,plu" });
    if (error) return { error: error.message };
  }

  revalidatePath("/pos-catalog");
  const withUpc = rows.filter((r) => r.upc).length;
  return { success: true, imported: rows.length, withUpc };
}

export async function lookupPosCatalogByUpc(upc: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("pos_catalog")
    .select("description, price")
    .eq("user_id", user.id)
    .eq("upc", upc)
    .maybeSingle();

  return data;
}

export async function clearPosCatalog() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("pos_catalog")
    .delete()
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/pos-catalog");
  return { success: true };
}
