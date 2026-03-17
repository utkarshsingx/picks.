import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} picks. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/support"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Support
            </Link>
            <Link
              href="/privacy-policy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms of Service
            </Link>
            <Link
              href="/cancellation"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancellation & Refund
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
