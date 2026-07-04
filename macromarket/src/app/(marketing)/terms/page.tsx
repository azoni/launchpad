import type { Metadata } from "next";
import { APP_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for MacroMarket.",
  alternates: { canonical: `${APP_URL}/terms` },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        Terms of use
      </h1>
      <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
        <p>
          MacroMarket is provided for general informational purposes only. The
          rankings, prices, nutrition figures, and AI coach responses are offered
          &ldquo;as is&rdquo; without warranty of any kind.
        </p>
        <p>
          <strong className="text-ink">Not medical advice.</strong> Nothing on
          MacroMarket is medical, nutritional, or dietary advice. Consult a
          qualified professional before making significant changes to your diet,
          especially if you have a health condition.
        </p>
        <p>
          <strong className="text-ink">Prices and availability.</strong> Prices are
          curated estimates and change frequently. The price and availability you
          see on Amazon at the time of purchase govern. We are not responsible for
          pricing errors or third-party product claims.
        </p>
        <p>
          By using MacroMarket you agree to these terms. We may update them from
          time to time.
        </p>
      </div>
    </div>
  );
}
