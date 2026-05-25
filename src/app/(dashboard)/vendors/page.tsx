import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Store, ChevronRight, Plus } from "lucide-react";
import { AddVendorDialog } from "./add-vendor-dialog";
import type { Vendor } from "@/types/database";

type VendorWithCounts = Vendor & {
  items: [{ count: number }] | null;
  contacts: [{ count: number }] | null;
};

export default async function VendorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: vendors } = await supabase
    .from("vendors")
    .select("*, items(count), contacts(count)")
    .eq("user_id", user.id)
    .order("name") as unknown as { data: VendorWithCounts[] | null };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <AddVendorDialog>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </AddVendorDialog>
      </div>

      {vendors && vendors.length > 0 ? (
        <div className="space-y-2">
          {vendors.map((vendor) => {
            const itemCount = vendor.items?.[0]?.count ?? 0;
            const contactCount = vendor.contacts?.[0]?.count ?? 0;
            return (
              <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer active:scale-[0.99]">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {itemCount} {itemCount === 1 ? "item" : "items"} · {contactCount} {contactCount === 1 ? "contact" : "contacts"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Store className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-lg font-medium mb-1">No vendors yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first vendor to get started
            </p>
            <AddVendorDialog>
              <Button>
                <Plus className="h-4 w-4" />
                Add Vendor
              </Button>
            </AddVendorDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
