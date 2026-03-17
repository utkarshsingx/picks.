"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { kyc } from "@/lib/api";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/api\/?$/, "");

const DOCUMENT_TYPES = [
  { value: "ID_FRONT", label: "ID Front" },
  { value: "ID_BACK", label: "ID Back" },
  { value: "PROOF_OF_ADDRESS", label: "Proof of Address" },
] as const;

type KycDocument = {
  id: number;
  document_type: string;
  file: string;
  status: string;
  rejection_reason?: string;
  uploaded_at: string;
  reviewed_at?: string | null;
};

export default function KycPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [kycStatus, setKycStatus] = useState<string>(user?.kyc_status ?? "PENDING");
  const [documentType, setDocumentType] = useState<string>("ID_FRONT");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/sign-in");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchData() {
      setLoadingDocs(true);
      try {
        const [docsRes, statusRes] = await Promise.all([
          kyc.getDocuments(),
          kyc.getStatus(),
        ]);
        if (docsRes.ok) {
          const data = await docsRes.json();
          setDocuments(data);
        }
        if (statusRes.ok) {
          const data = await statusRes.json();
          setKycStatus(data.kyc_status ?? user?.kyc_status ?? "PENDING");
        }
      } catch {
        setError("Failed to load KYC data.");
      } finally {
        setLoadingDocs(false);
      }
    }
    fetchData();
  }, [isAuthenticated, user?.kyc_status]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!file) {
      setError("Please select a file.");
      return;
    }
    setLoading(true);
    try {
      const res = await kyc.uploadDocument(file, documentType);
      const data = await res.json();
      if (!res.ok) {
        setError(data.file?.[0] || data.document_type?.[0] || data.detail || "Upload failed");
        return;
      }
      setDocuments((prev) => [data, ...prev]);
      setSuccess("Document uploaded successfully. Our team will review it shortly.");
      setFile(null);
    } catch {
      setError("Something went wrong. Please try again.");
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
      <h1 className="mb-8 text-2xl font-bold">KYC Verification</h1>

      {loadingDocs ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Verification Status</CardTitle>
              <CardDescription>
                {kycStatus === "APPROVED" && "Your identity has been verified. You can withdraw larger amounts."}
                {kycStatus === "PENDING" && "Upload your documents below. Our team will review them within 1-2 business days."}
                {kycStatus === "REJECTED" && "Your verification was rejected. Please upload new documents or contact support."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">
                Status:{" "}
                <span
                  className={
                    kycStatus === "APPROVED"
                      ? "text-green-600"
                      : kycStatus === "REJECTED"
                        ? "text-destructive"
                        : "text-muted-foreground"
                  }
                >
                  {kycStatus === "APPROVED"
                    ? "Approved"
                    : kycStatus === "REJECTED"
                      ? "Rejected"
                      : "Pending"}
                </span>
              </p>
            </CardContent>
          </Card>

          {(kycStatus === "PENDING" || kycStatus === "REJECTED") && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <CardDescription>
                  Upload a clear photo or PDF of your ID (front and back) and proof of address. Max 5MB per file. Accepted: JPEG, PNG, GIF, WebP, PDF.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleUpload}>
                <CardContent className="space-y-4">
                  {success && (
                    <p className="text-sm text-primary">{success}</p>
                  )}
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="document-type">Document Type</Label>
                    <select
                      id="document-type"
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {DOCUMENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <Button type="submit" disabled={loading || !file}>
                    {loading ? "Uploading..." : "Upload"}
                  </Button>
                </CardContent>
              </form>
            </Card>
          )}

          {documents.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>Documents you have submitted for verification.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                    >
                      <div>
                        <span className="font-medium">
                          {DOCUMENT_TYPES.find((t) => t.value === doc.document_type)?.label ?? doc.document_type}
                        </span>
                        <span className="ml-2 text-muted-foreground">
                          ({doc.status})
                        </span>
                      </div>
                      <a
                        href={doc.file.startsWith("http") ? doc.file : `${API_BASE}${doc.file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="mt-6">
        <Button variant="ghost" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
