import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsTab } from "./contacts-tab";
import { ItemsTab } from "./items-tab";
import { VendorHeader } from "./vendor-header";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (!vendor) notFound();

  const [{ data: contacts }, { data: items }, { data: departments }] =
    await Promise.all([
      supabase
        .from("contacts")
        .select("*")
        .eq("vendor_id", id)
        .order("name"),
      supabase
        .from("items")
        .select("*, departments(*)")
        .eq("vendor_id", id)
        .order("name"),
      supabase
        .from("departments")
        .select("*")
        .eq("user_id", user!.id)
        .order("name"),
    ]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <VendorHeader vendor={vendor} />

      <Tabs defaultValue="items" className="mt-6">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="items" className="flex-1 md:flex-none">
            Items ({items?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex-1 md:flex-none">
            Contacts ({contacts?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <ItemsTab
            vendorId={id}
            items={items ?? []}
            departments={departments ?? []}
          />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactsTab vendorId={id} contacts={contacts ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
