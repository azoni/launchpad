import type { Metadata } from "next";
import { APP_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How MacroMarket handles data and analytics.",
  alternates: { canonical: `${APP_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        Privacy policy
      </h1>
      <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
        <p>
          MacroMarket does not require an account and does not collect personal
          information. We do not sell your data.
        </p>
        <p>
          <strong className="text-ink">Analytics.</strong> We use privacy-friendly
          analytics to understand aggregate, anonymous usage (which pages are
          viewed, which links are clicked). This helps us improve the rankings and
          the site.
        </p>
        <p>
          <strong className="text-ink">Affiliate links.</strong> When you click a
          link to Amazon, Amazon may set cookies to attribute a purchase to us.
          See Amazon&apos;s own privacy notice for details on how they use that
          data.
        </p>
        <p>
          <strong className="text-ink">The AI coach.</strong> Messages you send to
          the AI coach are processed by a third-party language model provider to
          generate a reply and are not tied to your identity. Don&apos;t send
          sensitive personal or medical information.
        </p>
      </div>
    </div>
  );
}
