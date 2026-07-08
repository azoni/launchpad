import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Per-technician and per-building plans for fire alarm inspection contractors.",
  alternates: { canonical: "https://pyroguard-demo.netlify.app/pricing" },
};

const tiers = [
  {
    name: "Solo",
    price: "$49",
    unit: "per tech / mo",
    description: "For independent inspectors who run their own book.",
    features: [
      "1 technician",
      "Unlimited buildings & devices",
      "NFPA 72, 25, 10 workflows",
      "PDF reports to customers & AHJ",
      "Offline sync",
    ],
    cta: { label: "Start free trial", href: "/app" },
    variant: "outline" as const,
  },
  {
    name: "Shop",
    price: "$39",
    unit: "per tech / mo",
    description: "For regional contractors with a dispatcher and 3–25 techs.",
    features: [
      "Unlimited technicians",
      "Route optimization (Mapbox)",
      "Customer portal & e-sign",
      "Scheduled AHJ reminders",
      "AI assistant (unlimited drafts)",
      "API access",
    ],
    cta: { label: "Start 30-day trial", href: "/app" },
    variant: "accent" as const,
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Talk to us",
    unit: "—",
    description: "For AAA Fire Protection, Guardian, Johnson Controls, Cintas-scale operators.",
    features: [
      "SSO + audit logs",
      "Dedicated environment & BAA",
      "Custom NFPA workflow packs",
      "Onboarding + data migration",
      "SLAs & 24/7 support",
    ],
    cta: { label: "Contact sales", href: "mailto:hello@pyroguard.app" },
    variant: "outline" as const,
  },
];

export default function PricingPage() {
  return (
    <section className="container py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
        <Badge variant="muted">Pricing</Badge>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">Priced like good software.</h1>
        <p className="text-muted-foreground text-lg">
          Simple per-technician pricing. Every plan includes the full NFPA 72 / 25 / 10 workflow set.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {tiers.map((t) => (
          <Card
            key={t.name}
            className={t.featured ? "border-accent ring-2 ring-accent/20 shadow-md" : ""}
          >
            <CardHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{t.name}</CardTitle>
                {t.featured && <Badge variant="default">Most popular</Badge>}
              </div>
              <div>
                <span className="text-3xl font-bold">{t.price}</span>{" "}
                <span className="text-sm text-muted-foreground">{t.unit}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="h-4 w-4 text-pass shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild variant={t.variant} size="lg" className="w-full">
                <Link href={t.cta.href}>{t.cta.label}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
