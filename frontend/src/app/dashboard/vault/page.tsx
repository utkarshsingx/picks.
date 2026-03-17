"use client";

import { useEffect, useState } from "react";
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
import { wallets } from "@/lib/api";

interface BalanceItem {
  currency: string;
  balance: string;
  balance_display: string;
  vault_balance: string;
  vault_balance_display: string;
}

export default function VaultPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [currency, setCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"to_vault" | "from_vault">("to_vault");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refetch = () => {
    wallets.getBalances().then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setBalances(data.balances || []);
      }
    });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    refetch();
  }, [isAuthenticated, router]);

  async function handleMove(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await wallets.vaultMove(currency, parseFloat(amount), direction);
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed");
        return;
      }
      setAmount("");
      refetch();
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
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Vault</h1>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Savings</CardTitle>
          <CardDescription>
            Move funds to your vault to keep them separate from your main balance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {balances.map((b) => (
              <div key={b.currency} className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {b.currency} - Wallet
                </p>
                <p className="text-xl font-bold">{b.balance_display}</p>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {b.currency} - Vault
                </p>
                <p className="text-xl font-bold">{b.vault_balance_display}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Move funds</CardTitle>
          <CardDescription>
            Transfer between your wallet and vault.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleMove}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label>Direction</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={direction}
                onChange={(e) =>
                  setDirection(e.target.value as "to_vault" | "from_vault")
                }
              >
                <option value="to_vault">Wallet → Vault</option>
                <option value="from_vault">Vault → Wallet</option>
              </select>
            </div>
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
                step="any"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading || !amount} className="w-full">
              {loading ? "Moving..." : "Move"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
