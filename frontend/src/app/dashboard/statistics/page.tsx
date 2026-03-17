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
import { games, sports } from "@/lib/api";

export default function StatisticsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<{
    totalBets: number;
    wonBets: number;
    lostBets: number;
    totalStaked: number;
    totalPayout: number;
    profit: number;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    async function load() {
      const [gamesRes, sportsRes] = await Promise.all([
        games.getBets({ page_size: 1000 }),
        sports.getBets({ page_size: 1000 }),
      ]);
      const gamesData = await gamesRes.json();
      const sportsData = await sportsRes.json();
      const gameBets = gamesData.results || [];
      const sportBets = sportsData.results || [];
      const allBets = [...gameBets, ...sportBets];

      let totalStaked = 0;
      let totalPayout = 0;
      let won = 0;
      let lost = 0;
      for (const b of allBets) {
        const amt = parseFloat(b.amount || 0);
        totalStaked += amt;
        const payout = parseFloat(b.payout || 0);
        totalPayout += payout;
        if (b.status === "WON" || b.status === "CASHED_OUT") won++;
        else if (b.status === "LOST") lost++;
      }
      setStats({
        totalBets: allBets.length,
        wonBets: won,
        lostBets: lost,
        totalStaked,
        totalPayout,
        profit: totalPayout - totalStaked,
      });
    }
    load();
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Statistics</h1>
      </div>
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Total Bets</CardTitle>
              <CardDescription>All bets placed</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalBets}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Won / Lost</CardTitle>
              <CardDescription>Winning vs losing bets</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.wonBets} / {stats.lostBets}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Staked</CardTitle>
              <CardDescription>Amount wagered</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalStaked.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Payout</CardTitle>
              <CardDescription>Winnings received</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalPayout.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle>Profit / Loss</CardTitle>
              <CardDescription>Net result</CardDescription>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  stats.profit >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {stats.profit >= 0 ? "+" : ""}
                {stats.profit.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
