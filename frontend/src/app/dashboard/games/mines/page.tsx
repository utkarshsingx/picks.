"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { wallets, games } from "@/lib/api";

interface BalanceItem {
  currency: string;
  balance: string;
  balance_display: string;
}

interface Bet {
  id: number;
  status: string;
  amount: string;
  currency_code: string;
  payout: string | null;
  outcome: { revealed?: number[]; hit_mine?: number; multiplier?: number } | null;
  metadata: { mine_positions?: number[]; mine_count?: number; revealed?: number[] } | null;
}

type TileState = "hidden" | "gem" | "mine";

export default function MinesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT");
  const [mineCount, setMineCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bet, setBet] = useState<Bet | null>(null);
  const [tiles, setTiles] = useState<TileState[]>(Array(25).fill("hidden"));

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    wallets.getBalances().then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setBalances(data.balances || []);
      }
    });
  }, [isAuthenticated, router, bet?.status]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await games.minesStart(parseFloat(amount), currency, mineCount);
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to start");
        return;
      }
      setBet(data);
      setTiles(Array(25).fill("hidden"));
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleReveal(tileIndex: number) {
    if (!bet || bet.status !== "PENDING") return;
    setError("");
    setLoading(true);
    try {
      const res = await games.minesReveal(bet.id, tileIndex);
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to reveal");
        return;
      }
      setBet(data.bet);
      const newTiles = [...tiles];
      newTiles[tileIndex] = data.is_mine ? "mine" : "gem";
      setTiles(newTiles);
      if (data.is_mine) {
        setLoading(false);
        return;
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCashout() {
    if (!bet || bet.status !== "PENDING") return;
    setError("");
    setLoading(true);
    try {
      const res = await games.minesCashout(bet.id);
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to cash out");
        return;
      }
      setBet(data);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleNewGame() {
    setBet(null);
    setTiles(Array(25).fill("hidden"));
    setError("");
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const revealedCount = bet?.metadata?.revealed?.length ?? 0;
  const canCashout = bet?.status === "PENDING" && revealedCount > 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/games">
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Mines</h1>
      </div>

      {!bet ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Start a game</CardTitle>
            <CardDescription>
              5x5 grid with hidden mines. Reveal gems, avoid mines. Cash out
              anytime for a multiplier based on tiles revealed.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleStart}>
            <CardContent className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="space-y-2">
                <Label>Currency</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="USDT">USDT</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.00000001"
                  step="any"
                  placeholder="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mines">Number of mines (1-24)</Label>
                <Input
                  id="mines"
                  type="number"
                  min="1"
                  max="24"
                  value={mineCount}
                  onChange={(e) => setMineCount(parseInt(e.target.value, 10))}
                />
              </div>
              <Button type="submit" disabled={loading || !amount} className="w-full">
                {loading ? "Starting..." : "Start Game"}
              </Button>
            </CardContent>
          </form>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {bet.status === "PENDING"
                  ? `Revealed: ${revealedCount} | Bet: ${bet.amount} ${bet.currency_code}`
                  : bet.status === "CASHED_OUT"
                    ? `Cashed out! Payout: ${bet.payout} ${bet.currency_code}`
                    : `Hit a mine! Lost ${bet.amount} ${bet.currency_code}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 25 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={
                      loading ||
                      bet.status !== "PENDING" ||
                      tiles[i] !== "hidden"
                    }
                    onClick={() => handleReveal(i)}
                    className={`flex h-12 w-full items-center justify-center rounded-md border text-lg transition-colors ${
                      tiles[i] === "hidden"
                        ? "border-input bg-muted hover:bg-muted/80"
                        : tiles[i] === "gem"
                          ? "border-green-500/50 bg-green-500/20 text-green-600"
                          : "border-red-500/50 bg-red-500/20 text-red-600"
                    }`}
                  >
                    {tiles[i] === "hidden" ? "?" : tiles[i] === "gem" ? "💎" : "💣"}
                  </button>
                ))}
              </div>
              {bet.status === "PENDING" && (
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={handleCashout}
                    disabled={!canCashout || loading}
                    className="flex-1"
                  >
                    Cash Out
                  </Button>
                </div>
              )}
              {(bet.status === "CASHED_OUT" || bet.status === "LOST") && (
                <Button onClick={handleNewGame} className="mt-4 w-full">
                  New Game
                </Button>
              )}
            </CardContent>
          </Card>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
        </>
      )}

      <div className="mt-6">
        <p className="text-sm text-muted-foreground">Balances</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {balances.map((b) => (
            <span key={b.currency} className="text-sm">
              {b.currency}: {b.balance_display}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
