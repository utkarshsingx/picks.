import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sports } from "@/lib/api";

export interface BetSlipPick {
  event_id: string;
  sport_key: string;
  market_key: string;
  outcome_name: string;
  odds: number;
  point?: number;
  home_team: string;
  away_team: string;
  amount: number;
  currency: string;
}

interface BetSlipState {
  picks: BetSlipPick[];
  addPick: (pick: BetSlipPick) => void;
  removePick: (index: number) => void;
  clear: () => void;
  placeAll: () => Promise<void>;
}

export const useBetSlipStore = create<BetSlipState>()(
  persist(
    (set, get) => ({
      picks: [],
      addPick: (pick) =>
        set((s) => ({ picks: [...s.picks, pick] })),
      removePick: (index) =>
        set((s) => ({ picks: s.picks.filter((_, i) => i !== index) })),
      clear: () => set({ picks: [] }),
      placeAll: async () => {
        const { picks, clear } = get();
        for (const pick of picks) {
          await sports.placeBet({
            amount: pick.amount,
            currency: pick.currency,
            event_id: pick.event_id,
            sport_key: pick.sport_key,
            market_key: pick.market_key,
            outcome_name: pick.outcome_name,
            odds: pick.odds,
            home_team: pick.home_team,
            away_team: pick.away_team,
            outcome_point: pick.point,
          });
        }
        clear();
      },
    }),
    {
      name: "picks-bet-slip",
      partialize: (s) => ({ picks: s.picks }),
    }
  )
);
