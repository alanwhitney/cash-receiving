"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createDepartment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const targetMargin = parseFloat(formData.get("target_margin") as string);

  if (!name?.trim()) return { error: "Name is required" };
  if (isNaN(targetMargin) || targetMargin < 0 || targetMargin > 100)
    return { error: "Target margin must be between 0 and 100" };

  const { error } = await supabase
    .from("departments")
    .insert({ user_id: user.id, name: name.trim(), target_margin: targetMargin });

  if (error) return { error: error.message };

  revalidatePath("/departments");
  return { success: true };
}

export async function updateDepartment(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = formData.get("name") as string;
  const targetMargin = parseFloat(formData.get("target_margin") as string);

  if (!name?.trim()) return { error: "Name is required" };
  if (isNaN(targetMargin) || targetMargin < 0 || targetMargin > 100)
    return { error: "Target margin must be between 0 and 100" };

  const { error } = await supabase
    .from("departments")
    .update({ name: name.trim(), target_margin: targetMargin })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/departments");
  return { success: true };
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/departments");
  return { success: true };
}
