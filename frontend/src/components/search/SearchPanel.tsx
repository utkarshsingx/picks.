"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sports } from "@/lib/api";

interface SearchPanelProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string;
}

export function SearchPanel({ open, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async () => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await sports.search(q);
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(doSearch, 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto mt-20 max-w-xl px-4">
        <div className="rounded-lg border border-border bg-card p-4 shadow-lg">
          <div className="flex gap-2">
            <Input
              placeholder="Search events, teams..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="flex-1"
            />
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {query.length >= 2
                  ? "No events found. Try another search."
                  : "Enter at least 2 characters to search."}
              </p>
            ) : (
              <div className="space-y-1">
                {results.map((r) => (
                  <Link
                    key={`${r.sport_key}-${r.id}`}
                    href={`/dashboard/sports/${r.sport_key}/${r.id}`}
                    onClick={onClose}
                    className="block rounded-md p-2 hover:bg-muted"
                  >
                    <p className="text-sm font-medium">
                      {r.home_team} vs {r.away_team}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.sport_key.replace(/_/g, " ")}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden
      />
    </div>
  );
}
