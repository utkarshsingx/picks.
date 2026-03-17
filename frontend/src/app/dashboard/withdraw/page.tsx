"use client";

import { useState } from "react";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { wallets } from "@/lib/api";

export default function WithdrawPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    router.replace("/sign-in");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await wallets.withdraw(
        currency,
        parseFloat(amount),
        currency !== "USD" ? destinationAddress : undefined
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Withdrawal failed");
        return;
      }
      setSuccess(
        data.status === "PENDING"
          ? "Withdrawal submitted for approval. You will be notified when it is processed."
          : "Withdrawal completed."
      );
      setAmount("");
      setDestinationAddress("");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isCrypto = ["BTC", "ETH", "USDT"].includes(currency);

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Withdraw</h1>
      <Card>
        <CardHeader>
          <CardTitle>Request withdrawal</CardTitle>
          <CardDescription>
            Withdraw funds from your wallet. Large amounts may require manual
            approval.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-primary">{success}</p>}
            <div className="space-y-2">
              <Label>Currency</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.00000001"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            {isCrypto && (
              <div className="space-y-2">
                <Label htmlFor="address">Destination address</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Wallet address"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  required={isCrypto}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button type="submit" disabled={loading || !amount}>
              {loading ? "Processing..." : "Withdraw"}
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost">Back</Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
