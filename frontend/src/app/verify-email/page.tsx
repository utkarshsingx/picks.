"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }
    api.post(`/auth/verify-email/${token}/`, {}).then(async (res) => {
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(data.detail || "Email verified successfully.");
      } else {
        setStatus("error");
        setMessage(data.detail || "Verification failed. The link may have expired.");
      }
    }).catch(() => {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    });
  }, [token]);

  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === "loading" && "Verifying your email..."}
            {status === "success" && "Your email has been verified."}
            {status === "error" && "Verification failed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex justify-center py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          {status !== "loading" && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </CardContent>
        <CardFooter>
          <Link href="/sign-in" className="w-full">
            <Button className="w-full">Sign In</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
