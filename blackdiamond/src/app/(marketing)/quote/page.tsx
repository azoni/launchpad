import type { Metadata } from "next";
import { QuoteForm } from "@/components/QuoteForm";
import { Phone, Mail, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Get a Free Quote",
  description:
    "Request a free, no-obligation quote for driveway pressure washing, window soft washing, or roof cleaning in Whitefish, MT. We respond within 24 hours.",
  openGraph: {
    title: "Get a Free Quote — Black Diamond Alpine Wash",
    description:
      "Free estimates for exterior cleaning in Whitefish and the Flathead Valley.",
  },
  twitter: { card: "summary_large_image" },
  alternates: {
    canonical: "https://blackdiamond-alpine-wash.netlify.app/quote",
  },
};

export default function QuotePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://blackdiamond-alpine-wash.netlify.app",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Get a Quote",
        item: "https://blackdiamond-alpine-wash.netlify.app/quote",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl sm:text-5xl uppercase tracking-wide">
            Get a Free Quote
          </h1>
          <p className="mt-4 text-primary-foreground/60 max-w-xl mx-auto">
            Tell us about your property and we&apos;ll send you a detailed
            estimate — usually within 24 hours.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border border-border p-6 sm:p-8">
                <QuoteForm />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-heading text-sm uppercase tracking-wider mb-4">
                  Prefer to Call?
                </h3>
                <a
                  href="tel:+14065551234"
                  className="flex items-center gap-3 text-lg font-semibold text-teal hover:underline"
                >
                  <Phone className="w-5 h-5" />
                  (406) 555-1234
                </a>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-heading text-sm uppercase tracking-wider mb-4">
                  Email Us
                </h3>
                <a
                  href="mailto:info@blackdiamondalpinewash.com"
                  className="flex items-center gap-3 text-sm text-teal hover:underline"
                >
                  <Mail className="w-5 h-5" />
                  info@blackdiamondalpinewash.com
                </a>
              </div>

              <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-heading text-sm uppercase tracking-wider mb-4">
                  Response Time
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="w-5 h-5 text-teal" />
                  <span>We typically respond within 24 hours</span>
                </div>
              </div>

              <div className="bg-teal/5 rounded-lg border border-teal/20 p-6">
                <h3 className="font-heading text-sm uppercase tracking-wider mb-2">
                  Bundle & Save
                </h3>
                <p className="text-sm text-muted-foreground">
                  Book multiple services together and save 10-15%. Select all
                  the services you need in the form and we&apos;ll include the
                  bundle discount in your quote.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
