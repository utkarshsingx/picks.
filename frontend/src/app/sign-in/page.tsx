"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";
import { api } from "@/lib/api";

export default function SignInPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (needs2FA) {
        const res = await api.post("/auth/2fa/verify-login/", {
          email,
          password,
          code,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.code?.[0] || data.detail || "Invalid code");
          return;
        }
        setAuth(data.user, data.access, data.refresh);
        router.push("/dashboard");
      } else {
        const res = await api.post("/auth/login/", { email, password });
        const data = await res.json();
        if (!res.ok) {
          if (data.requires_2fa) {
            setNeeds2FA(true);
            setError("");
          } else {
            setError(
              data.detail ||
                data.email?.[0] ||
                data.password?.[0] ||
                "Login failed"
            );
          }
          return;
        }
        setAuth(data.user, data.access, data.refresh);
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            {needs2FA
              ? "Enter the 6-digit code from your authenticator app."
              : "Enter your email and password to access your account."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!needs2FA && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            {needs2FA && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code">2FA Code</Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setNeeds2FA(false);
                    setCode("");
                  }}
                >
                  Back to password
                </Button>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : needs2FA ? "Verify" : "Sign In"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/join" className="text-primary hover:underline">
                Join
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
