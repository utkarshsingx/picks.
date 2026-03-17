"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useCrashSocket } from "@/hooks/useCrashSocket";

interface BalanceItem {
  currency: string;
  balance: string;
  balance_display: string;
}

interface CrashRound {
  round_id: string;
  server_seed_hash: string;
  status: string;
  crash_point: string | null;
  started_at: string | null;
  crashed_at: string | null;
  created_at: string;
}

export default function CrashPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [rounds, setRounds] = useState<CrashRound[]>([]);
  const [currentRoundId, setCurrentRoundId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeBet, setActiveBet] = useState<{ id: number; amount: string; currency_code: string } | null>(null);
  const [lastResult, setLastResult] = useState<{ status: string; payout: string | null; amount: string } | null>(null);

  const { multiplier, status, crashPoint, connected } = useCrashSocket(currentRoundId);

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
  }, [isAuthenticated, router]);

  const refetchRounds = useCallback(() => {
    games.getCrashRounds(10).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setRounds(data);
        const betting = data.find((r: CrashRound) => r.status === "BETTING");
        if (betting) {
          setCurrentRoundId(betting.round_id);
        }
      }
    });
  }, []);

  useEffect(() => {
    refetchRounds();
  }, [lastResult, status, refetchRounds]);

  // When round crashes, refetch after a short delay to pick up the new round
  useEffect(() => {
    if (status === "crashed") {
      const t = setTimeout(refetchRounds, 400);
      return () => clearTimeout(t);
    }
  }, [status, refetchRounds]);

  async function handleBet(e: React.FormEvent) {
    e.preventDefault();
    if (!currentRoundId) {
      setError("No round available for betting");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await games.crashBet(parseFloat(amount), currency, currentRoundId);
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Bet failed");
        return;
      }
      setActiveBet({ id: data.id, amount: data.amount, currency_code: data.currency_code });
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCashout() {
    if (!activeBet) return;
    setError("");
    setLoading(true);
    try {
      const res = await games.crashCashout(activeBet.id, multiplier);
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Cashout failed");
        return;
      }
      setLastResult({
        status: data.status,
        payout: data.payout,
        amount: data.amount,
      });
      setActiveBet(null);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "crashed" && activeBet) {
      setLastResult({
        status: "LOST",
        payout: null,
        amount: activeBet.amount,
      });
      setActiveBet(null);
    }
  }, [status, activeBet]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/games">
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Crash</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Live multiplier</CardTitle>
          <CardDescription>
            {connected ? "Connected" : "Connecting..."} | Round:{" "}
            {currentRoundId ? currentRoundId.slice(0, 8) + "..." : "—"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div
              className={`text-4xl font-bold ${
                status === "crashed" ? "text-destructive" : status === "running" ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {status === "crashed" && crashPoint ? `${crashPoint.toFixed(2)}x` : `${multiplier.toFixed(2)}x`}
            </div>
            <p className="text-sm text-muted-foreground">
              {status === "betting" && "Place your bet"}
              {status === "running" && "Multiplier growing..."}
              {status === "crashed" && "Crashed!"}
            </p>
          </div>
        </CardContent>
      </Card>

      {!activeBet ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Place bet</CardTitle>
            <CardDescription>
              Bet before the round starts. Cash out before it crashes.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleBet}>
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
                  min="0"
                  step="0.00000001"
                  placeholder="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !amount || status !== "betting" || !currentRoundId}
                className="w-full"
              >
                {loading ? "Placing..." : "Place Bet"}
              </Button>
            </CardContent>
          </form>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Active bet</CardTitle>
            <CardDescription>
              {activeBet.amount} {activeBet.currency_code} | Cash out at current
              multiplier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCashout}
              disabled={loading || status !== "running"}
              className="w-full"
            >
              Cashout at {multiplier.toFixed(2)}x
            </Button>
          </CardContent>
        </Card>
      )}

      {lastResult && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {lastResult.status === "CASHED_OUT" ? "Cashed out!" : "Lost"}
            </CardTitle>
            <CardDescription>
              {lastResult.status === "CASHED_OUT"
                ? `Payout: ${lastResult.payout}`
                : `Lost: ${lastResult.amount}`}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="mt-6">
        <p className="text-sm text-muted-foreground">Recent rounds</p>
        <div className="mt-2 space-y-1">
          {rounds.slice(0, 5).map((r) => (
            <div key={r.round_id} className="flex justify-between text-sm">
              <span>{r.round_id.slice(0, 8)}...</span>
              <span>{r.status}</span>
              <span>{r.crash_point ? `${r.crash_point}x` : "—"}</span>
            </div>
          ))}
        </div>
      </div>

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
