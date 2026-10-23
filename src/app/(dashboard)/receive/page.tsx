import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StartSessionClient } from "./start-session-client";
import type { ReceiveSession } from "@/types/database";

type SessionWithVendor = ReceiveSession & { vendors: { name: string } };

const PAGE_SIZE = 20;

export default async function ReceivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const page = Math.max(1, Math.floor(Number((await searchParams).page)) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const [{ data: vendors }, { data: openData }, { data: completedData, count }] = await Promise.all([
    supabase
      .from("vendors")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("receive_sessions")
      .select("*, vendors(name)")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false }) as unknown as Promise<{ data: SessionWithVendor[] | null }>,
    supabase
      .from("receive_sessions")
      .select("*, vendors(name)", { count: "exact" })
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1) as unknown as Promise<{
      data: SessionWithVendor[] | null;
      count: number | null;
    }>,
  ]);

  const openSessions = openData ?? [];
  const completedSessions = completedData ?? [];
  const totalCompleted = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCompleted / PAGE_SIZE));

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

      {totalCompleted > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Completed
            <span className="ml-2 font-normal normal-case">({totalCompleted})</span>
          </h2>
          <div className="space-y-2">
            {completedSessions.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">
                No sessions on this page.{" "}
                <Link href="/receive" className="underline">Back to newest</Link>
              </p>
            )}
            {completedSessions.map((session) => (
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
          {totalPages > 1 && (
            <nav className="flex items-center justify-between mt-4" aria-label="Completed sessions pages">
              {page > 1 ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={page === 2 ? "/receive" : `/receive?page=${page - 1}`}>
                    <ChevronLeft /> Newer
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft /> Newer
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/receive?page=${page + 1}`}>
                    Older <ChevronRight />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Older <ChevronRight />
                </Button>
              )}
            </nav>
          )}
        </section>
      )}

      {openSessions.length === 0 && totalCompleted === 0 && (
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
