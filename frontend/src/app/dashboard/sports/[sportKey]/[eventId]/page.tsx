"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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
import { sports } from "@/lib/api";
import { useBetSlipStore } from "@/store/bet-slip-store";

interface Outcome {
  name: string;
  price: number;
  point?: number;
}

interface Market {
  key: string;
  outcomes: Outcome[];
}

interface Bookmaker {
  key: string;
  title: string;
  markets: Market[];
}

interface EventWithOdds {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Bookmaker[];
}

const MARKET_LABELS: Record<string, string> = {
  h2h: "Moneyline",
  spreads: "Spread",
  totals: "Over/Under",
};

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sportKey = params.sportKey as string;
  const eventId = params.eventId as string;
  const { isAuthenticated } = useAuthStore();
  const [event, setEvent] = useState<EventWithOdds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USDT");
  const [selected, setSelected] = useState<{
    market_key: string;
    outcome_name: string;
    odds: number;
    point?: number;
  } | null>(null);
  const [betting, setBetting] = useState(false);
  const [lastBet, setLastBet] = useState<unknown>(null);
  const addPick = useBetSlipStore((s) => s.addPick);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    if (!sportKey || !eventId) return;
    setLoading(true);
    sports.getEventOdds(sportKey, eventId).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to load event");
        setEvent(null);
      } else {
        setEvent(data.event || null);
      }
      setLoading(false);
    });
  }, [isAuthenticated, router, sportKey, eventId]);

  async function handleBet(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !event) return;
    setBetting(true);
    setError("");
    try {
      const res = await sports.placeBet({
        amount: parseFloat(amount),
        currency,
        event_id: eventId,
        sport_key: sportKey,
        market_key: selected.market_key,
        outcome_name: selected.outcome_name,
        odds: selected.odds,
        home_team: event.home_team,
        away_team: event.away_team,
        outcome_point: selected.point,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Bet failed");
        return;
      }
      setLastBet(data);
      setSelected(null);
      setAmount("");
    } catch {
      setError("Something went wrong");
    } finally {
      setBetting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const markets = event?.bookmakers?.[0]?.markets || [];
  const potentialPayout = selected && amount
    ? (parseFloat(amount) * selected.odds * 0.95).toFixed(2)
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href={`/dashboard/sports/${sportKey}`}>
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Place Bet</h1>
      </div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !event ? (
        <Card>
          <CardHeader>
            <CardTitle>Event not found</CardTitle>
            <CardDescription>
              The event may have ended or odds are no longer available.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {event.away_team} @ {event.home_team}
              </CardTitle>
              <CardDescription>
                {new Date(event.commence_time).toLocaleString()}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Markets</CardTitle>
              <CardDescription>
                Select an outcome to add to your bet slip
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {markets.map((market) => (
                <div key={market.key}>
                  <p className="mb-2 text-sm font-medium">
                    {MARKET_LABELS[market.key] || market.key}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {market.outcomes.map((outcome) => (
                      <Button
                        key={`${outcome.name}-${outcome.point ?? ""}`}
                        variant={
                          selected?.outcome_name === outcome.name &&
                          selected?.point === outcome.point
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setSelected({
                            market_key: market.key,
                            outcome_name: outcome.name,
                            odds: outcome.price,
                            point: outcome.point,
                          })
                        }
                      >
                        {outcome.name}
                        {outcome.point != null ? ` (${outcome.point})` : ""}{" "}
                        @ {outcome.price}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {selected && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Bet slip</CardTitle>
                <CardDescription>
                  {selected.outcome_name}
                  {selected.point != null ? ` (${selected.point})` : ""} @{" "}
                  {selected.odds}
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleBet}>
                <CardContent className="space-y-4">
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
                  {potentialPayout && (
                    <p className="text-sm text-muted-foreground">
                      Potential payout: ~{potentialPayout} {currency} (5% house
                      edge applied)
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={!amount || parseFloat(amount) <= 0}
                      onClick={() => {
                        if (!selected || !event) return;
                        const amt = parseFloat(amount);
                        if (amt <= 0) return;
                        addPick({
                          event_id: eventId,
                          sport_key: sportKey,
                          market_key: selected.market_key,
                          outcome_name: selected.outcome_name,
                          odds: selected.odds,
                          point: selected.point,
                          home_team: event.home_team,
                          away_team: event.away_team,
                          amount: amt,
                          currency,
                        });
                        setSelected(null);
                        setAmount("");
                      }}
                    >
                      Add to bet slip
                    </Button>
                    <Button
                      type="submit"
                      disabled={betting || !amount || parseFloat(amount) <= 0}
                      className="flex-1"
                    >
                      {betting ? "Placing..." : "Place Bet"}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          )}

          {lastBet && (
            <Card>
              <CardHeader>
                <CardTitle>Bet placed</CardTitle>
                <CardDescription>
                  Your bet has been placed. It will be settled when the event
                  completes.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
