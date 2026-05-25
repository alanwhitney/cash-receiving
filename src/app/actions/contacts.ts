"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createContact(vendorId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  if (!name?.trim()) return { error: "Name is required" };

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("id", vendorId)
    .eq("user_id", user.id)
    .single();

  if (!vendor) return { error: "Vendor not found" };

  const { error } = await supabase.from("contacts").insert({
    vendor_id: vendorId,
    name: name.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/vendors/${vendorId}`);
  return { success: true };
}

export async function updateContact(
  id: string,
  vendorId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  if (!name?.trim()) return { error: "Name is required" };

  const { error } = await supabase
    .from("contacts")
    .update({
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/vendors/${vendorId}`);
  return { success: true };
}

export async function deleteContact(id: string, vendorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("contacts").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath(`/vendors/${vendorId}`);
  return { success: true };
}
