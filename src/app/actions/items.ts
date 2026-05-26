"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ParsedItem = {
  name: string;
  upc: string;
  case_cost: number;
  case_size: number;
  case_discount: number;
  unit_retail: number;
  bottle_deposit: number;
  department_id: string | null;
};

function parseItemFormData(formData: FormData): { error: string } | ParsedItem {
  const name = formData.get("name") as string;
  const upc = formData.get("upc") as string;
  const caseCost = parseFloat(formData.get("case_cost") as string);
  const caseSize = parseInt(formData.get("case_size") as string);
  const caseDiscount = parseFloat(formData.get("case_discount") as string) || 0;
  const unitRetail = parseFloat(formData.get("unit_retail") as string);
  const bottleDeposit = parseFloat(formData.get("bottle_deposit") as string) || 0;
  const departmentId = formData.get("department_id") as string;

  if (!name?.trim()) return { error: "Name is required" };
  if (!upc?.trim()) return { error: "UPC is required" };
  if (isNaN(caseCost) || caseCost < 0) return { error: "Invalid case cost" };
  if (isNaN(caseSize) || caseSize < 1) return { error: "Case size must be at least 1" };
  if (isNaN(unitRetail) || unitRetail < 0) return { error: "Invalid unit retail" };

  return {
    name: name.trim(),
    upc: upc.trim(),
    case_cost: caseCost,
    case_size: caseSize,
    case_discount: caseDiscount,
    unit_retail: unitRetail,
    bottle_deposit: bottleDeposit,
    department_id: departmentId || null,
  };
}

export async function createItem(vendorId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = parseItemFormData(formData);
  if ("error" in parsed) return parsed;

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("id", vendorId)
    .eq("user_id", user.id)
    .single();

  if (!vendor) return { error: "Vendor not found" };

  const { error } = await supabase.from("items").insert({
    vendor_id: vendorId,
    ...parsed,
  });

  if (error) {
    if (error.code === "23505") return { error: "A item with this UPC already exists" };
    return { error: error.message };
  }

  revalidatePath(`/vendors/${vendorId}`);
  return { success: true };
}

export async function updateItem(
  id: string,
  vendorId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const parsed = parseItemFormData(formData);
  if ("error" in parsed) return parsed;

  const { error } = await supabase
    .from("items")
    .update(parsed)
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { error: "A item with this UPC already exists" };
    return { error: error.message };
  }

  revalidatePath(`/vendors/${vendorId}`);
  return { success: true };
}

export async function deleteItem(id: string, vendorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("items").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/vendors/${vendorId}`);
  return { success: true };
}

export async function lookupItemByUpc(upc: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("items")
    .select(`
      *,
      departments(*),
      vendors!inner(user_id)
    `)
    .eq("upc", upc)
    .eq("vendors.user_id", user.id)
    .single();

  return data;
}
