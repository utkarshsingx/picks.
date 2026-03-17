"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export default function Home() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="relative flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.15),transparent)]" />
      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        <h1 className="font-display max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Join the winner&apos;s club:{" "}
          <span className="text-primary">picks.</span> top betting picks!
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          The professional betting platform. Sign up, deposit, and start
          placing winning bets on sports and casino games.
        </p>
        <div className="flex gap-4">
          <Link href={isAuthenticated ? "/dashboard" : "/join"}>
            <Button size="lg" className="px-8">
              {isAuthenticated ? "Dashboard" : "Get Started"}
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link href="/sign-in">
              <Button variant="outline" size="lg" className="px-8">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
