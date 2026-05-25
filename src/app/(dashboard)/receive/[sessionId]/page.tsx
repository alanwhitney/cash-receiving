import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ReceiveSessionClient } from "./receive-session-client";

export default async function ReceiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: session } = await supabase
    .from("receive_sessions")
    .select("*, vendors(name)")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) notFound();

  const { data: lines } = await supabase
    .from("receive_lines")
    .select(`
      *,
      items(*, departments(*))
    `)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  return (
    <ReceiveSessionClient
      session={session as typeof session & { vendors: { name: string } }}
      initialLines={lines ?? []}
    />
  );
}
