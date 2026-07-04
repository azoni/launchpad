import type { Metadata } from "next";
import { APP_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "MacroMarket participates in the Amazon Associates program and may earn commissions from qualifying purchases made through our links.",
  alternates: { canonical: `${APP_URL}/disclosure` },
};

export default function DisclosurePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        Affiliate disclosure
      </h1>
      <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
        <p>
          MacroMarket is a participant in the Amazon Services LLC Associates
          Program, an affiliate advertising program designed to provide a means
          for sites to earn advertising fees by advertising and linking to
          Amazon.com. As an Amazon Associate we earn from qualifying purchases.
        </p>
        <p>
          When you click a &ldquo;Buy on Amazon&rdquo; link and make a purchase,
          we may receive a small commission at no additional cost to you. This
          helps keep MacroMarket free.
        </p>
        <p>
          Affiliate relationships never influence our rankings. Every food is
          ranked purely by its cost per gram of protein — the math doesn&apos;t
          know or care whether a product earns us a commission. Prices shown are
          curated estimates and may be out of date; the price you pay is always
          the current price shown on Amazon at checkout.
        </p>
      </div>
    </div>
  );
}
