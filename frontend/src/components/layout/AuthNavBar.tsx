"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  User,
  Bell,
  MessageCircle,
  ShoppingCart,
  Wallet,
  Shield,
  Trophy,
  BarChart3,
  Receipt,
  ListOrdered,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { wallets } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BetSlipPanel } from "@/components/bet-slip/BetSlipPanel";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { SearchPanel } from "@/components/search/SearchPanel";

interface BalanceItem {
  currency: string;
  balance: string;
  balance_display: string;
}

export function AuthNavBar() {
  const { user, logout } = useAuthStore();
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [accountOpen, setAccountOpen] = useState(false);
  const [betSlipOpen, setBetSlipOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    wallets.getBalances().then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setBalances(data.balances || []);
      }
    });
  }, []);

  const primaryBalance = balances.find((b) => b.currency === "USDT") || balances[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-display flex items-center gap-1 text-xl font-bold"
        >
          picks<span className="text-primary">.</span>
        </Link>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">
            {primaryBalance
              ? `${primaryBalance.currency}: ${primaryBalance.balance_display}`
              : "—"}
          </span>
        </div>

        <nav className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAccountOpen(!accountOpen)}
              aria-label="Account"
            >
              <User className="h-4 w-4" />
            </Button>
            {accountOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAccountOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-border bg-card py-1 shadow-lg">
                  <Link
                    href="/dashboard/wallets"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setAccountOpen(false)}
                  >
                    <Wallet className="h-4 w-4" />
                    My Wallets
                  </Link>
                  <Link
                    href="/dashboard/vault"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setAccountOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    Vault
                  </Link>
                  <Link
                    href="/dashboard/vip"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setAccountOpen(false)}
                  >
                    <Trophy className="h-4 w-4" />
                    VIP Status
                  </Link>
                  <Link
                    href="/dashboard/statistics"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setAccountOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Statistics
                  </Link>
                  <Link
                    href="/dashboard/transactions"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setAccountOpen(false)}
                  >
                    <Receipt className="h-4 w-4" />
                    Transactions
                  </Link>
                  <Link
                    href="/dashboard/bets"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setAccountOpen(false)}
                  >
                    <ListOrdered className="h-4 w-4" />
                    My Bets
                  </Link>
                  <Link
                    href="/settings/security"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setAccountOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={() => {
                      setAccountOpen(false);
                      logout();
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>

          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              0
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setChatOpen(true)}
            aria-label="Chat"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setBetSlipOpen(true)}
            aria-label="Bet slip"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </nav>
      </div>

      <div className="relative">
        <BetSlipPanel open={betSlipOpen} onClose={() => setBetSlipOpen(false)} />
        <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
        <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </header>
  );
}
