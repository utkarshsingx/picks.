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
import { wallets } from "@/lib/api";

interface BalanceItem {
  currency: string;
  balance: string;
  balance_display: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    });
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Welcome, {user?.username || user?.email}</CardTitle>
          <CardDescription>
            Your account overview and wallet balances.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Email: {user?.email}
          </p>
          <p className="text-sm text-muted-foreground">
            Verified: {user?.is_verified ? "Yes" : "No"}
          </p>
          <p className="text-sm text-muted-foreground">
            2FA: {user?.two_factor_enabled ? "Enabled" : "Disabled"}
          </p>
        </CardContent>
      </Card>

      <div className="mb-6 flex gap-4">
        <Link href="/dashboard/deposit">
          <Button>Deposit</Button>
        </Link>
        <Link href="/dashboard/withdraw">
          <Button variant="outline">Withdraw</Button>
        </Link>
        <Link href="/dashboard/transactions">
          <Button variant="outline">Transaction History</Button>
        </Link>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Wallet Balances</h2>
      {loading ? (
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {balances.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No wallets yet. Create one by making a deposit.
            </p>
          ) : (
            balances.map((b) => (
              <Card key={b.currency}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{b.currency}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{b.balance_display}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
