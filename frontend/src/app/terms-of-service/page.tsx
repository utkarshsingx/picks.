import Link from "next/link";

export const metadata = {
  title: "Terms of Service | picks.",
  description: "Terms of service, refund policy, and cancellation policy for picks.",
};

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Terms of Service</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-IN")}
      </p>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-3 text-xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-muted-foreground">
            By accessing or using picks. (&quot;picks&quot;, &quot;we&quot;,
            &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these
            Terms of Service. If you do not agree, do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">2. Eligibility</h2>
          <p className="text-muted-foreground">
            You must be at least 18 years of age (or the legal age in your
            jurisdiction) to use our services. You must be legally permitted to
            participate in betting in your country of residence. We reserve the
            right to verify your identity and eligibility.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">3. Account Terms</h2>
          <p className="text-muted-foreground">
            You are responsible for maintaining the confidentiality of your
            account credentials. You must provide accurate information and
            promptly update any changes. One account per person; multiple
            accounts are prohibited and may result in suspension.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">4. Use of Services</h2>
          <p className="text-muted-foreground">
            You agree to use our platform lawfully and in accordance with these
            terms. Prohibited conduct includes fraud, collusion, money
            laundering, use of bots or automated tools, and any activity that
            undermines the integrity of our services.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">5. Refund Policy</h2>
          <p className="mb-2 text-muted-foreground">
            <strong className="text-foreground">General:</strong> Deposits and
            bets placed on our platform are generally non-refundable once
            confirmed. Winnings are paid out according to the rules of each game
            or event.
          </p>
          <p className="mb-2 text-muted-foreground">
            <strong className="text-foreground">Deposits:</strong> Unused deposit
            amounts may be withdrawn to your original payment method, subject to
            verification and our withdrawal policy. Processing times apply.
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
            . We will review each case on its merits.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">6. Cancellation Policy</h2>
          <p className="mb-2 text-muted-foreground">
            <strong className="text-foreground">Account closure:</strong> You may
            close your account at any time by contacting support. Pending
            withdrawals will be processed according to our withdrawal policy.
            Any remaining balance will be returned to you.
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
            may suspend or terminate your account for breach of these terms,
            suspected fraud, or at our discretion to protect the platform.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">7. Limitation of Liability</h2>
          <p className="text-muted-foreground">
            To the maximum extent permitted by law, we are not liable for any
            indirect, incidental, special, or consequential damages arising from
            your use of our services. Our total liability is limited to the
            amount you have paid to us in the twelve months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">8. Changes</h2>
          <p className="text-muted-foreground">
            We may update these terms from time to time. Material changes will
            be communicated via email or a notice on the platform. Continued use
            after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">9. Contact</h2>
          <p className="text-muted-foreground">
            For questions about these terms, visit our{" "}
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
          href="/privacy-policy"
          className="text-sm text-primary hover:underline"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
