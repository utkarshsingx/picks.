"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { AuthNavBar } from "./AuthNavBar";

function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-display flex items-center gap-1 text-xl font-bold"
        >
          picks<span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-4 font-semibold">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm" className="font-semibold">
              Sign In
            </Button>
          </Link>
          <Link href="/join">
            <Button size="sm" className="font-semibold">
              Join
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Header() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <AuthNavBar />;
  }
  return <PublicHeader />;
}
