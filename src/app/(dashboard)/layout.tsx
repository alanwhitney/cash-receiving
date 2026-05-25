import { AppNav } from "@/components/nav/app-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AppNav />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
