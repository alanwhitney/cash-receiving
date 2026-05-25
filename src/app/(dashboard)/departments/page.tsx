import { createClient } from "@/lib/supabase/server";
import { DepartmentsClient } from "./departments-client";

export default async function DepartmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .eq("user_id", user!.id)
    .order("name");

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <DepartmentsClient departments={departments ?? []} />
    </div>
  );
}
