import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export const metadata = {
  title: "Contact Us | picks.",
  description: "Customer support and contact information for picks.",
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Contact Us</h1>
      <p className="mb-8 text-muted-foreground">
        Need help? Reach out to our customer support team.
      </p>

      <div className="space-y-8">
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <MapPin className="h-5 w-5 text-primary" />
            Registered Company Address
          </h2>
          <address className="not-italic text-muted-foreground">
            <strong className="text-foreground">picks.</strong>
            <br />
            [Your Registered Company Name]
            <br />
            [Street Address, Building/Suite]
            <br />
            [City], [State] [Postal Code]
            <br />
            India
          </address>
          <p className="mt-2 text-sm text-muted-foreground">
            Replace the placeholders above with your actual registered company
            address in India.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Phone className="h-5 w-5 text-primary" />
            Domestic Telephone (India)
          </h2>
          <p className="text-muted-foreground">
            <a
              href="tel:+91XXXXXXXXXX"
              className="text-primary hover:underline"
            >
              +91 XXXXXXXXXX
            </a>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Replace with your actual domestic telephone number in India (e.g.{" "}
            <code>+91 9876543210</code>).
          </p>
        </section>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Mail className="h-5 w-5 text-primary" />
            Email Support
          </h2>
          <p className="text-muted-foreground">
            <a
              href="mailto:support@example.com"
              className="text-primary hover:underline"
            >
              support@example.com
            </a>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            We typically respond within 24–48 hours.
          </p>
        </section>
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/privacy-policy"
          className="text-sm text-primary hover:underline"
        >
          Privacy Policy
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
