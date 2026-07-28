import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PosCatalogClient } from "./pos-catalog-client";

export default async function PosCatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase
    .from("pos_catalog")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: latest } = await supabase
    .from("pos_catalog")
    .select("imported_at")
    .eq("user_id", user.id)
    .order("imported_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <PosCatalogClient
        count={count ?? 0}
        lastImportedAt={latest?.imported_at ?? null}
      />
    </div>
  );
}
