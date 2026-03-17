"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function PaymentForm({
  amount,
  onSuccess,
  onCancel,
}: {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError("");
    setLoading(true);
    try {
      const { error: err } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard`,
        },
      });
      if (err) {
        setError(err.message || "Payment failed");
      } else {
        onSuccess();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle>Pay ${amount.toFixed(2)}</CardTitle>
        <CardDescription>
          Enter your card details. Your balance will update after payment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <PaymentElement />
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={loading || !stripe}>
          {loading ? "Processing..." : "Pay"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </CardFooter>
    </form>
  );
}

export function StripePaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const options = {
    clientSecret,
    appearance: { theme: "night" as const },
  };

  return (
    <Card>
      <Elements stripe={stripePromise} options={options}>
        <PaymentForm amount={amount} onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>
    </Card>
  );
}
