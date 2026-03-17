import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | picks.",
  description: "Privacy policy for picks. - information we collect, how we use it, and how we protect it.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleDateString("en-IN")}
      </p>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2 className="mb-3 text-xl font-semibold">1. Introduction</h2>
          <p className="text-muted-foreground">
            picks. (&quot;picks&quot;, &quot;we&quot;, &quot;us&quot;, or
            &quot;our&quot;) is committed to protecting your privacy. This
            Privacy Policy describes the information we collect, how we use it,
            the parties to whom we disclose it, the method of disclosure, and
            the security practices we employ to safeguard your information.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">
            2. Information We Collect
          </h2>
          <p className="mb-2 text-muted-foreground">
            We collect the following categories of information:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>
              <strong className="text-foreground">Account information:</strong>{" "}
              Email address, username, password (hashed), and profile details
              you provide when registering.
            </li>
            <li>
              <strong className="text-foreground">Identity verification:</strong>{" "}
              Documents and information submitted for KYC (Know Your Customer)
              verification, such as government-issued ID, proof of address, and
              selfie verification.
            </li>
            <li>
              <strong className="text-foreground">Financial information:</strong>{" "}
              Payment method details (processed securely by Stripe), transaction
              history, deposit and withdrawal records.
            </li>
            <li>
              <strong className="text-foreground">Usage data:</strong> IP
              address, device type, browser, pages visited, and activity logs.
            </li>
            <li>
              <strong className="text-foreground">Communications:</strong>{" "}
              Support tickets, emails, and chat messages you send to us.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">
            3. How We Use Your Information
          </h2>
          <p className="mb-2 text-muted-foreground">
            We use the information we collect to:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>Provide, operate, and maintain our betting platform</li>
            <li>Process deposits, withdrawals, and bets</li>
            <li>Verify your identity and comply with legal obligations</li>
            <li>Prevent fraud, abuse, and illegal activity</li>
            <li>Send transactional emails (e.g. confirmations, security alerts)</li>
            <li>Respond to support requests</li>
            <li>Improve our services and user experience</li>
            <li>Comply with applicable laws and regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">
            4. Parties to Whom We Disclose Information
          </h2>
          <p className="mb-2 text-muted-foreground">
            We may disclose your information to the following parties:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>
              <strong className="text-foreground">Payment processors:</strong>{" "}
              Stripe and other payment providers to process transactions.
            </li>
            <li>
              <strong className="text-foreground">KYC/AML providers:</strong>{" "}
              Third-party identity verification services for compliance.
            </li>
            <li>
              <strong className="text-foreground">Cloud and infrastructure:</strong>{" "}
              Hosting and service providers that store or process data on our
              behalf.
            </li>
            <li>
              <strong className="text-foreground">Legal and regulatory:</strong>{" "}
              Law enforcement, courts, or regulators when required by law.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">
            5. Method of Disclosure
          </h2>
          <p className="text-muted-foreground">
            We disclose information through secure, encrypted channels. Data is
            shared with third parties only under contractual agreements that
            require them to protect your information and use it solely for the
            purposes we specify. We do not sell your personal information.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">
            6. Security Practices
          </h2>
          <p className="mb-2 text-muted-foreground">
            We implement industry-standard security measures to safeguard your
            information:
          </p>
          <ul className="list-disc space-y-1 pl-6 text-muted-foreground">
            <li>
              <strong className="text-foreground">Encryption:</strong> Data in
              transit (TLS/SSL) and at rest (AES encryption where applicable).
            </li>
            <li>
              <strong className="text-foreground">Access controls:</strong>{" "}
              Role-based access, strong authentication (including 2FA), and
              principle of least privilege.
            </li>
            <li>
              <strong className="text-foreground">Secure storage:</strong>{" "}
              Passwords are hashed; payment data is handled by PCI-compliant
              processors.
            </li>
            <li>
              <strong className="text-foreground">Monitoring:</strong> Logging,
              intrusion detection, and regular security reviews.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">7. Contact Us</h2>
          <p className="text-muted-foreground">
            For privacy-related questions or to exercise your rights, contact us
            at{" "}
            <Link href="/support" className="text-primary hover:underline">
              our support page
            </Link>
            .
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
      </div>
    </div>
  );
}
