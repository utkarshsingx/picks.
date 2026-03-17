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

interface Transaction {
  id: number;
  currency: string;
  type: string;
  amount: string;
  balance_after: string | null;
  status: string;
  reference_id: string | null;
  created_at: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [prevPage, setPrevPage] = useState<string | null>(null);
  const [filter, setFilter] = useState({ type: "", currency: "" });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    loadTransactions();
  }, [isAuthenticated, router, filter.type, filter.currency]);

  async function loadTransactions(pageUrl?: string | null) {
    setLoading(true);
    let res;
    if (pageUrl) {
      res = await wallets.getTransactions(pageUrl);
    } else {
      const params: Record<string, string> = {
        ...(filter.type && { type: filter.type }),
        ...(filter.currency && { currency: filter.currency }),
      };
      res = await wallets.getTransactions(params);
    }
    const data = await res.json();
    setTransactions(data.results || []);
    setNextPage(data.next || null);
    setPrevPage(data.previous || null);
    setLoading(false);
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Transaction History</h1>
      <Card>
        <CardHeader>
          <CardTitle>Your transactions</CardTitle>
          <CardDescription>
            Deposit, withdrawal, and bet history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filter.type}
              onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="">All types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
              <option value="BET">Bet</option>
              <option value="WIN">Win</option>
            </select>
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filter.currency}
              onChange={(e) =>
                setFilter((f) => ({ ...f, currency: e.target.value }))
              }
            >
              <option value="">All currencies</option>
              <option value="USD">USD</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No transactions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left">Date</th>
                    <th className="pb-2 text-left">Type</th>
                    <th className="pb-2 text-left">Currency</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b">
                      <td className="py-2">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                      <td>{tx.type}</td>
                      <td>{tx.currency}</td>
                      <td className="text-right">
                        {parseFloat(tx.amount) >= 0 ? "+" : ""}
                        {tx.amount}
                      </td>
                      <td>{tx.status}</td>
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
              disabled={!prevPage}
              onClick={() => prevPage && loadTransactions(prevPage)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!nextPage}
              onClick={() => nextPage && loadTransactions(nextPage)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="mt-4">
        <Link href="/dashboard">
          <Button variant="ghost">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
