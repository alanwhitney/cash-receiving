import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, PackagePlus } from "lucide-react";
import { StartSessionClient } from "./start-session-client";
import type { ReceiveSession } from "@/types/database";

type SessionWithVendor = ReceiveSession & { vendors: { name: string } };

export default async function ReceivePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: vendors }, { data: sessions }] = await Promise.all([
    supabase
      .from("vendors")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("receive_sessions")
      .select("*, vendors(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20) as unknown as Promise<{ data: SessionWithVendor[] | null }>,
  ]);

  const openSessions = sessions?.filter((s) => s.status === "open") ?? [];
  const recentCompleted =
    sessions?.filter((s) => s.status === "completed").slice(0, 5) ?? [];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Receive</h1>
        <StartSessionClient vendors={vendors ?? []} />
      </div>

      {openSessions.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Open Sessions
          </h2>
          <div className="space-y-2">
            {openSessions.map((session) => (
              <Link key={session.id} href={`/receive/${session.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer active:scale-[0.99]">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">
                        {(session.vendors as unknown as { name: string })?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Started{" "}
                        {new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="warning">Open</Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentCompleted.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Recent
          </h2>
          <div className="space-y-2">
            {recentCompleted.map((session) => (
              <Link key={session.id} href={`/receive/${session.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer opacity-70">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">
                        {(session.vendors as unknown as { name: string })?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.completed_at
                          ? new Date(session.completed_at).toLocaleDateString()
                          : new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Done</Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {openSessions.length === 0 && recentCompleted.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PackagePlus className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-lg font-medium mb-1">No receiving sessions</p>
            <p className="text-sm text-muted-foreground mb-4">
              Start a session to receive items from a vendor
            </p>
            <StartSessionClient vendors={vendors ?? []} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
