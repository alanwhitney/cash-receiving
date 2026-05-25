"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createVendor(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "Name is required" };

  const { error } = await supabase
    .from("vendors")
    .insert({ user_id: user.id, name: name.trim() });

  if (error) return { error: error.message };

  revalidatePath("/vendors");
  return { success: true };
}

export async function updateVendor(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  if (!name?.trim()) return { error: "Name is required" };

  const { error } = await supabase
    .from("vendors")
    .update({ name: name.trim() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
  return { success: true };
}

export async function deleteVendor(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("vendors")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/vendors");
  return { success: true };
}
