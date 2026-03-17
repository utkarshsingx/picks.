"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useAuthStore } from "@/store/auth-store";
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
import { api } from "@/lib/api";

export default function SecurityPage() {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "enable" | "verify" | "disable">("idle");
  const [provisioningUri, setProvisioningUri] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/sign-in");
  }, [isAuthenticated, router]);

  async function handleEnable() {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/2fa/enable/", { password });
      const data = await res.json();
      if (!res.ok) {
        setError(data.password?.[0] || data.detail || "Failed");
        return;
      }
      setProvisioningUri(data.provisioning_uri || null);
      setStep("verify");
      setSuccess("Scan the QR code in your authenticator app, then enter the code below.");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/2fa/verify/", { code });
      const data = await res.json();
      if (!res.ok) {
        setError(data.code?.[0] || data.detail || "Invalid code");
        return;
      }
      setUser({ ...user!, two_factor_enabled: true });
      setStep("idle");
      setSuccess("2FA enabled successfully.");
      setCode("");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setError("");
    if (!password || !code) {
      setError("Password and code are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/2fa/disable/", { password, code });
      const data = await res.json();
      if (!res.ok) {
        setError(data.password?.[0] || data.code?.[0] || data.detail || "Failed");
        return;
      }
      setUser({ ...user!, two_factor_enabled: false });
      setSuccess("2FA disabled successfully.");
      setPassword("");
      setCode("");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Security Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            {user?.two_factor_enabled
              ? "2FA is enabled. Enter your password and authenticator code to disable."
              : "Add an extra layer of security with an authenticator app."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success && (
            <p className="text-sm text-primary">{success}</p>
          )}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          {!user?.two_factor_enabled && step === "idle" && (
            <div className="space-y-2">
              <Label htmlFor="enable-password">Password</Label>
              <Input
                id="enable-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <Button onClick={handleEnable} disabled={loading}>
                Enable 2FA
              </Button>
            </div>
          )}
          {!user?.two_factor_enabled && step === "verify" && (
            <div className="space-y-4">
              {provisioningUri && (
                <div className="flex justify-center rounded-lg border border-border bg-white p-4">
                  <QRCodeSVG value={provisioningUri} size={200} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="verify-code">Authenticator Code</Label>
                <Input
                id="verify-code"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
              />
              <Button onClick={handleVerify} disabled={loading || code.length !== 6}>
                Verify & Enable
              </Button>
              </div>
            </div>
          )}
          {user?.two_factor_enabled && (
            <div className="space-y-2">
              <Label htmlFor="disable-password">Password</Label>
              <Input
                id="disable-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <Label htmlFor="disable-code">Authenticator Code</Label>
              <Input
                id="disable-code"
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
              />
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={loading || !password || code.length !== 6}
              >
                Disable 2FA
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
