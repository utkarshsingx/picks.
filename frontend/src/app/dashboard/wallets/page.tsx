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
import { wallets } from "@/lib/api";

interface BalanceItem {
  currency: string;
  balance: string;
  balance_display: string;
  vault_balance?: string;
  vault_balance_display?: string;
}

export default function WalletsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
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
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">My Wallets</h1>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {balances.map((b) => (
              <Card key={b.currency}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{b.currency}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{b.balance_display}</p>
                  {b.vault_balance_display != null && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Vault: {b.vault_balance_display}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard/deposit">
              <Button>Deposit</Button>
            </Link>
            <Link href="/dashboard/withdraw">
              <Button variant="outline">Withdraw</Button>
            </Link>
            <Link href="/dashboard/vault">
              <Button variant="outline">Vault</Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
