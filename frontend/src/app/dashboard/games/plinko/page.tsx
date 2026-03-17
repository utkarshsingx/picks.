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

interface BetResult {
  id: number;
  game_type: string;
  currency_code: string;
  amount: string;
  status: string;
  payout: string | null;
  outcome: { column?: number; multiplier?: number; risk?: string } | null;
  created_at: string;
}

export default function PlinkoPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT");
  const [risk, setRisk] = useState<"low" | "medium" | "high">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastBet, setLastBet] = useState<BetResult | null>(null);

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
  }, [isAuthenticated, router, lastBet]);

  async function handleBet(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await games.plinkoBet(parseFloat(amount), currency, risk);
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Bet failed");
        return;
      }
      setLastBet(data);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

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
        <h1 className="text-2xl font-bold">Plinko</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Place a bet</CardTitle>
          <CardDescription>
            Drop the ball. Risk level affects the payout table. Low: safer,
            medium: balanced, high: bigger multipliers.
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
                min="0.00000001"
                step="any"
                placeholder="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Risk level</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={risk}
                onChange={(e) => setRisk(e.target.value as "low" | "medium" | "high")}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <Button type="submit" disabled={loading || !amount} className="w-full">
              {loading ? "Dropping..." : "Drop Ball"}
            </Button>
          </CardContent>
        </form>
      </Card>

      {lastBet && (
        <Card>
          <CardHeader>
            <CardTitle>
              {lastBet.status === "WON" && parseFloat(lastBet.payout || "0") > 0
                ? "You won!"
                : "Result"}
            </CardTitle>
            <CardDescription>
              Multiplier: {lastBet.outcome?.multiplier ?? "—"}x | Risk:{" "}
              {lastBet.outcome?.risk ?? "—"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg">
              {parseFloat(lastBet.payout || "0") > 0
                ? `Payout: ${lastBet.payout} ${lastBet.currency_code}`
                : `Lost: ${lastBet.amount} ${lastBet.currency_code}`}
            </p>
          </CardContent>
        </Card>
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
