"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createSession(vendorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("receive_sessions")
    .insert({ user_id: user.id, vendor_id: vendorId })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/receive");
  return { data };
}

export async function addReceiveLine(
  sessionId: string,
  itemId: string,
  casesReceived: number,
  caseCostOverride: number | null,
  caseDiscountOverride: number | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: session } = await supabase
    .from("receive_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) return { error: "Session not found" };
  if (session.status === "completed") return { error: "Session is already completed" };

  const { data: existingLine } = await supabase
    .from("receive_lines")
    .select("id, cases_received")
    .eq("session_id", sessionId)
    .eq("item_id", itemId)
    .single();

  if (existingLine) {
    const { error } = await supabase
      .from("receive_lines")
      .update({
        cases_received: existingLine.cases_received + casesReceived,
        case_cost_override: caseCostOverride,
        case_discount_override: caseDiscountOverride,
      })
      .eq("id", existingLine.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("receive_lines").insert({
      session_id: sessionId,
      item_id: itemId,
      cases_received: casesReceived,
      case_cost_override: caseCostOverride,
      case_discount_override: caseDiscountOverride,
    });

    if (error) return { error: error.message };
  }

  revalidatePath(`/receive/${sessionId}`);
  return { success: true };
}

export async function updateReceiveLine(
  lineId: string,
  sessionId: string,
  casesReceived: number,
  caseCostOverride: number | null,
  caseDiscountOverride: number | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("receive_lines")
    .update({
      cases_received: casesReceived,
      case_cost_override: caseCostOverride,
      case_discount_override: caseDiscountOverride,
    })
    .eq("id", lineId);

  if (error) return { error: error.message };

  revalidatePath(`/receive/${sessionId}`);
  return { success: true };
}

export async function removeReceiveLine(lineId: string, sessionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("receive_lines")
    .delete()
    .eq("id", lineId);

  if (error) return { error: error.message };

  revalidatePath(`/receive/${sessionId}`);
  return { success: true };
}

export async function completeSession(sessionId: string, applyPriceChanges: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (applyPriceChanges) {
    const { data: lines } = await supabase
      .from("receive_lines")
      .select("item_id, case_cost_override, case_discount_override")
      .eq("session_id", sessionId)
      .not("case_cost_override", "is", null);

    if (lines) {
      for (const line of lines) {
        const updates: Record<string, number> = {};
        if (line.case_cost_override !== null) updates.case_cost = line.case_cost_override;
        if (line.case_discount_override !== null) updates.case_discount = line.case_discount_override;
        if (Object.keys(updates).length > 0) {
          await supabase.from("items").update(updates).eq("id", line.item_id);
        }
      }
    }
  }

  const { error } = await supabase
    .from("receive_sessions")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/receive");
  revalidatePath(`/receive/${sessionId}`);
  return { success: true };
}
