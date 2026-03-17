"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { games, sports } from "@/lib/api";

interface Bet {
  id: number;
  game_type?: string;
  currency_code: string;
  amount: string;
  status: string;
  payout: string | null;
  outcome: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export default function MyBetsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    async function load() {
      setLoading(true);
      const [gamesRes, sportsRes] = await Promise.all([
        games.getBets({ page_size: 100 }),
        sports.getBets({ page_size: 100 }),
      ]);
      const gamesData = await gamesRes.json();
      const sportsData = await sportsRes.json();
      const gameBets = (gamesData.results || []).map((b: Bet) => ({
        ...b,
        game_type: b.game_type || "CASINO",
      }));
      const sportBets = (sportsData.results || []).map((b: Bet) => ({
        ...b,
        game_type: "SPORTS",
      }));
      const combined = [...gameBets, ...sportBets].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setBets(combined);
      setLoading(false);
    }
    load();
  }, [isAuthenticated, router]);

  const filtered =
    filter === "all"
      ? bets
      : filter === "sports"
        ? bets.filter((b) => b.game_type === "SPORTS")
        : bets.filter((b) => b.game_type !== "SPORTS");

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">My Bets</h1>
      </div>
      <div className="mb-4 flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "sports" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("sports")}
        >
          Sports
        </Button>
        <Button
          variant={filter === "casino" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("casino")}
        >
          Casino
        </Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No bets yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 50).map((bet) => (
            <Card key={bet.id}>
              <CardHeader className="py-3">
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <span>
                    {bet.game_type} • {bet.amount} {bet.currency_code}
                  </span>
                  <span
                    className={
                      bet.status === "WON" || bet.status === "CASHED_OUT"
                        ? "text-primary"
                        : bet.status === "LOST"
                          ? "text-destructive"
                          : ""
                    }
                  >
                    {bet.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                {bet.payout != null && (
                  <p className="text-sm text-muted-foreground">
                    Payout: {bet.payout}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(bet.created_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
