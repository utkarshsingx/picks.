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
import { sports } from "@/lib/api";

interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export default function SportsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [sportsList, setSportsList] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }
    sports.getSports().then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Failed to load sports");
        setSportsList([]);
      } else {
        setSportsList(Array.isArray(data) ? data : []);
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

  const mainSports = sportsList.filter(
    (s) => s.active && !s.has_outrights && !s.key.includes("_winner") && !s.key.includes("super_bowl")
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Live Sports</h1>
      {error && (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      )}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : mainSports.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No sports available</CardTitle>
            <CardDescription>
              Configure ODDS_API_KEY in backend .env to load sports. Get a free
              key at the-odds-api.com
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mainSports.map((sport) => (
            <Card key={sport.key}>
              <CardHeader>
                <CardTitle>{sport.title}</CardTitle>
                <CardDescription>{sport.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/dashboard/sports/${sport.key}`}>
                  <Button variant="outline" className="w-full">
                    View events
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
