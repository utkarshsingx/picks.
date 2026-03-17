import Link from "next/link";

export const metadata = {
  title: "Cancellation & Refund Policy | picks.",
  description:
    "Cancellation and refund policy for picks. - deposits, bets, withdrawals, and account closure.",
};

export default function CancellationPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">
        Cancellation & Refund Policy
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-IN")}
      </p>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-3 text-xl font-semibold">Refund Policy</h2>
          <p className="mb-2 text-muted-foreground">
            <strong className="text-foreground">General:</strong> Deposits and
            bets placed on our platform are generally non-refundable once
            confirmed. Winnings are paid out according to the rules of each game
            or event.
          </p>
          <p className="mb-2 text-muted-foreground">
            <strong className="text-foreground">Deposits:</strong> Unused
            deposit amounts may be withdrawn to your original payment method,
            subject to verification and our withdrawal policy. Processing times
            apply.
          </p>
          <p className="mb-2 text-muted-foreground">
            <strong className="text-foreground">Erroneous transactions:</strong>{" "}
            If we determine that a transaction was made in error (e.g. duplicate
            charge, technical malfunction), we will refund the amount to your
            account or original payment method.
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Disputes:</strong> If you believe
            you are entitled to a refund, contact us via{" "}
            <Link href="/support" className="text-primary hover:underline">
              our support page
            </Link>
            . We will review each case on its merits in accordance with
            applicable Indian laws.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Cancellation Policy</h2>
          <p className="mb-2 text-muted-foreground">
            <strong className="text-foreground">Account closure:</strong> You may
            close your account at any time by contacting support. Pending
            withdrawals will be processed according to our withdrawal policy. Any
            remaining balance will be returned to you.
          </p>
          <p className="mb-2 text-muted-foreground">
            <strong className="text-foreground">Bet cancellation:</strong> Once
            a bet is placed and confirmed, it cannot be cancelled. Bets are
            final except where an event is cancelled, voided, or otherwise
            invalidated per our game rules.
          </p>
          <p className="mb-2 text-muted-foreground">
            <strong className="text-foreground">Withdrawal cancellation:</strong>{" "}
            You may cancel a pending withdrawal before it is processed. Once
            processed, withdrawals cannot be reversed.
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Service suspension:</strong> We
            may suspend or terminate your account for breach of our terms,
            suspected fraud, or at our discretion to protect the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Contact</h2>
          <p className="text-muted-foreground">
            For questions about refunds or cancellations, visit our{" "}
            <Link href="/support" className="text-primary hover:underline">
              Contact Us
            </Link>{" "}
            page.
          </p>
        </section>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/support" className="text-sm text-primary hover:underline">
          Contact Us
        </Link>
        <Link
          href="/terms-of-service"
          className="text-sm text-primary hover:underline"
        >
          Terms of Service
        </Link>
        <Link
          href="/privacy-policy"
          className="text-sm text-primary hover:underline"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
