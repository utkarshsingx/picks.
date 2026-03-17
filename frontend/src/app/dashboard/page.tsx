"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/sign-in");
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
      <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.username || user?.email}</CardTitle>
          <CardDescription>
            Your account overview. Wallets and betting features coming in Phase 2.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Email: {user?.email}
          </p>
          <p className="text-sm text-muted-foreground">
            Verified: {user?.is_verified ? "Yes" : "No"}
          </p>
          <p className="text-sm text-muted-foreground">
            2FA: {user?.two_factor_enabled ? "Enabled" : "Disabled"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
