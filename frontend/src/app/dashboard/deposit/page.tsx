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
import { StripePaymentForm } from "@/components/StripePaymentForm";

export default function DepositPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [mode, setMode] = useState<"crypto" | "fiat" | null>(null);
  const [currency, setCurrency] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  if (!isAuthenticated) {
    router.replace("/sign-in");
    return null;
  }

  async function handleCryptoDeposit() {
    setError("");
    setLoading(true);
    try {
      const res = await wallets.depositCrypto(currency, parseFloat(amount));
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to create deposit");
        return;
      }
      if (data.payment_url) {
        setPaymentUrl(data.payment_url);
        window.open(data.payment_url, "_blank");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleFiatDeposit() {
    setError("");
    setLoading(true);
    try {
      const res = await wallets.depositFiat(parseFloat(amount));
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to create deposit");
        return;
      }
      if (data.client_secret) {
        setClientSecret(data.client_secret);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (mode === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">Deposit</h1>
        <Card>
          <CardHeader>
            <CardTitle>Choose deposit method</CardTitle>
            <CardDescription>
              Select crypto or fiat to add funds to your wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button onClick={() => setMode("crypto")} className="flex-1">
              Crypto (BTC, ETH, USDT)
            </Button>
            <Button onClick={() => setMode("fiat")} variant="outline" className="flex-1">
              Fiat (USD)
            </Button>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard">
              <Button variant="ghost">Back</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (paymentUrl) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Payment opened</CardTitle>
            <CardDescription>
              Complete your payment in the new tab. Your balance will update once
              the payment is confirmed.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => window.open(paymentUrl!, "_blank")}>
              Open payment page
            </Button>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (clientSecret) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">Complete payment</h1>
        <StripePaymentForm
          clientSecret={clientSecret}
          amount={parseFloat(amount)}
          onSuccess={() => router.push("/dashboard")}
          onCancel={() => setClientSecret(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">
        Deposit {mode === "crypto" ? "Crypto" : "Fiat"}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Enter amount</CardTitle>
          <CardDescription>
            {mode === "crypto"
              ? "Amount in USD. You will pay in the selected cryptocurrency."
              : "Amount in USD to deposit."}
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "crypto") handleCryptoDeposit();
            else handleFiatDeposit();
          }}
        >
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {mode === "crypto" && (
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
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button type="submit" disabled={loading || !amount}>
              {loading ? "Processing..." : "Continue"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setMode(null);
                setAmount("");
                setError("");
              }}
            >
              Back
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

