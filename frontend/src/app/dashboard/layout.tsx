"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dices, Trophy } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCasino =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/games");
  const isSports = pathname.startsWith("/dashboard/sports");

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="w-48 shrink-0 border-r border-border bg-card">
        <nav className="flex flex-col gap-1 p-4">
          <Link
            href="/dashboard/games"
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              isCasino
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Dices className="h-4 w-4" />
            Casino
          </Link>
          <Link
            href="/dashboard/sports"
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              isSports
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Trophy className="h-4 w-4" />
            Sports
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
