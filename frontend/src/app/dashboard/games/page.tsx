"use client";

import { useEffect } from "react";
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

const GAMES = [
  {
    slug: "dice",
    name: "Dice",
    description: "Roll over or under a target. Instant resolution.",
  },
  {
    slug: "mines",
    name: "Mines",
    description: "Reveal tiles, avoid mines. Cash out anytime.",
  },
  {
    slug: "plinko",
    name: "Plinko",
    description: "Drop the ball. Risk level affects payout.",
  },
  {
    slug: "crash",
    name: "Crash",
    description: "Multiplier grows. Cash out before it crashes.",
  },
];

export default function GamesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
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
      <h1 className="mb-8 text-2xl font-bold">Casino Games</h1>
      <div className="mb-6">
        <Link href="/dashboard/games/bets">
          <Button variant="outline">Bet History</Button>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {GAMES.map((game) => (
          <Card key={game.slug}>
            <CardHeader>
              <CardTitle>{game.name}</CardTitle>
              <CardDescription>{game.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/games/${game.slug}`}>
                <Button>Play {game.name}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
