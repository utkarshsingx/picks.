"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { games } from "@/lib/api";

interface Bet {
  id: number;
  game_type: string;
  currency_code: string;
  amount: string;
  status: string;
  payout: string | null;
  outcome: Record<string, unknown> | null;
  created_at: string;
}

export default function BetHistoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [filter, setFilter] = useState({ game_type: "" });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    loadBets();
  }, [isAuthenticated, router, filter.game_type]);

  async function loadBets(pageUrl?: string | null) {
    setLoading(true);
    let res;
    if (pageUrl) {
      res = await games.getBets(pageUrl);
    } else {
      const params: Record<string, string> = {
        ...(filter.game_type && { game_type: filter.game_type }),
      };
      res = await games.getBets(params);
    }
    const data = await res.json();
    setBets(data.results || []);
    setNextPage(data.next || null);
    setPrevPage(data.previous || null);
    setLoading(false);
  }

  if (!isAuthenticated) {
    return null;
  }

  const hasNext = !!nextPage;
  const hasPrev = !!prevPage;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/games">
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Bet History</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your bets</CardTitle>
          <CardDescription>
            History of all game bets across Dice, Mines, Plinko, and Crash.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filter.game_type}
              onChange={(e) =>
                setFilter((f) => ({ ...f, game_type: e.target.value }))
              }
            >
              <option value="">All games</option>
              <option value="DICE">Dice</option>
              <option value="MINES">Mines</option>
              <option value="PLINKO">Plinko</option>
              <option value="CRASH">Crash</option>
              <option value="SPORTS">Sports</option>
            </select>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : bets.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No bets yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left">Date</th>
                    <th className="pb-2 text-left">Game</th>
                    <th className="pb-2 text-left">Amount</th>
                    <th className="pb-2 text-left">Status</th>
                    <th className="pb-2 text-right">Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {bets.map((bet) => (
                    <tr key={bet.id} className="border-b">
                      <td className="py-2">
                        {new Date(bet.created_at).toLocaleString()}
                      </td>
                      <td>{bet.game_type}</td>
                      <td>
                        {bet.amount} {bet.currency_code}
                      </td>
                      <td>{bet.status}</td>
                      <td className="text-right">
                        {bet.payout
                          ? `+${bet.payout} ${bet.currency_code}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrev}
              onClick={() => hasPrev && loadBets(prevPage)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => hasNext && loadBets(nextPage)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Link href="/dashboard/transactions">
          <Button variant="outline">View Wallet Transactions</Button>
        </Link>
      </div>
    </div>
  );
}
