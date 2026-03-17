"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";

export function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1 text-xl font-bold">
          picks<span className="text-primary">.</span>
        </Link>
        <nav className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/games"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Games
              </Link>
              <Link
                href="/dashboard/sports"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Sports
              </Link>
              <Link
                href="/settings/kyc"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Verification
              </Link>
              <Link
                href="/settings/security"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Security
              </Link>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/join">
                <Button size="sm">Join</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
