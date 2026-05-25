"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  PackageCheck,
  Store,
  LayoutGrid,
  PackagePlus,
  LogOut,
} from "lucide-react";
import { signOut } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/receive", label: "Receive", icon: PackagePlus },
  { href: "/vendors", label: "Vendors", icon: Store },
  { href: "/departments", label: "Departments", icon: LayoutGrid },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r bg-card min-h-screen sticky top-0">
        <div className="flex items-center gap-2 px-4 h-16 border-b">
          <PackageCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">Cash Receiving</span>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-2 border-t">
          <form action={signOut}>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background flex">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium transition-colors",
              pathname.startsWith(href)
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-6 w-6" />
            {label}
          </Link>
        ))}
        <form action={signOut} className="flex-1 flex">
          <button className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-medium text-muted-foreground">
            <LogOut className="h-6 w-6" />
            Sign out
          </button>
        </form>
      </nav>
    </>
  );
}
