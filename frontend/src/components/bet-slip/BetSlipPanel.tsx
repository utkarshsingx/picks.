"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBetSlipStore } from "@/store/bet-slip-store";

interface BetSlipPanelProps {
  open: boolean;
  onClose: () => void;
}

function useBetSlipTotals() {
  const picks = useBetSlipStore((s) => s.picks);
  const totalStake = picks.reduce((sum, p) => sum + p.amount, 0);
  const combinedOdds = picks.length === 0 ? 1 : picks.reduce((acc, p) => acc * p.odds, 1);
  const estimatedPayout = totalStake * combinedOdds * 0.95;
  return { totalStake, combinedOdds, estimatedPayout };
}

export function BetSlipPanel({ open, onClose }: BetSlipPanelProps) {
  const { picks, removePick, clear, placeAll } = useBetSlipStore();
  const { totalStake, combinedOdds, estimatedPayout } = useBetSlipTotals();

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-border bg-card shadow-xl">
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <h2 className="font-semibold">Bet Slip</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        {picks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No picks yet. Add sports bets from event pages.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {picks.map((pick, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between rounded-lg border border-border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {pick.home_team} vs {pick.away_team}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pick.outcome_name}
                      {pick.point != null ? ` (${pick.point})` : ""} @ {pick.odds}x
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pick.amount} {pick.currency}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePick(i)}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total stake</span>
                <span>{totalStake.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Combined odds</span>
                <span>{combinedOdds.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Est. payout</span>
                <span>{estimatedPayout.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={clear}>
                Clear bet
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  placeAll();
                  onClose();
                }}
              >
                Place bet
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
