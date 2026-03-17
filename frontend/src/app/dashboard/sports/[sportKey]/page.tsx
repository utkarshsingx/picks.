"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sports } from "@/lib/api";

interface Event {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
}

export default function SportsEventsPage() {
  const router = useRouter();
  const params = useParams();
  const sportKey = params.sportKey as string;
  const { isAuthenticated } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withOdds, setWithOdds] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    if (!sportKey) return;
    setLoading(true);
    sports.getEvents(sportKey, withOdds).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to load events");
        setEvents([]);
      } else {
        setEvents(data.events || []);
      }
      setLoading(false);
    });
  }, [isAuthenticated, router, sportKey, withOdds]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isLive = (commenceTime: string) =>
    new Date(commenceTime) < new Date();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard/sports">
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {sportKey?.replace(/_/g, " ").toUpperCase()} Events
        </h1>
      </div>
      <div className="mb-4">
        <Button
          variant={withOdds ? "default" : "outline"}
          size="sm"
          onClick={() => setWithOdds(!withOdds)}
        >
          {withOdds ? "With odds (uses API credits)" : "Load odds"}
        </Button>
      </div>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No events</CardTitle>
            <CardDescription>
              No upcoming or live events for this sport.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {event.away_team} @ {event.home_team}
                  {isLive(event.commence_time) && (
                    <span className="rounded bg-destructive/20 px-2 py-0.5 text-xs text-destructive">
                      Live
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {new Date(event.commence_time).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  {withOdds && event.bookmakers?.[0]?.markets?.[0] && (
                    <div className="flex gap-4 text-sm">
                      {event.bookmakers[0].markets[0].outcomes.map((o) => (
                        <span key={o.name}>
                          {o.name}
                          {o.point != null ? ` (${o.point})` : ""}: {o.price}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Link href={`/dashboard/sports/${sportKey}/${event.id}`}>
                  <Button size="sm">Bet</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
