import type { Metadata } from "next";
import Link from "next/link";
import { Mountain, Droplets, Heart, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Black Diamond Alpine Wash is a locally owned exterior cleaning company in Whitefish, Montana. Learn about our story, values, and commitment to the Flathead Valley community.",
  openGraph: {
    title: "About Us — Black Diamond Alpine Wash",
    description:
      "Locally owned exterior cleaning in Whitefish, MT. Our story and values.",
  },
  twitter: { card: "summary_large_image" },
  alternates: {
    canonical: "https://blackdiamond-alpine-wash.netlify.app/about",
  },
};

export default function AboutPage() {
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
        name: "About",
        item: "https://blackdiamond-alpine-wash.netlify.app/about",
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
            About Black Diamond
          </h1>
          <p className="mt-4 text-primary-foreground/60 max-w-xl mx-auto">
            Rooted in the mountains. Committed to clean.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-heading text-2xl uppercase tracking-wide mb-6">
            Our Story
          </h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Black Diamond Alpine Wash was born from a simple idea: the homes
              and businesses of Whitefish deserve exterior cleaning that&apos;s
              as reliable as the mountains we live under.
            </p>
            <p>
              Montana weather doesn&apos;t go easy on properties. Between harsh
              winters, spring pollen, summer dust, and fall debris, exterior
              surfaces take a beating year-round. We started this company
              because we saw too many homeowners settling for subpar cleaning
              — or worse, trying to pressure wash their own roofs and causing
              damage.
            </p>
            <p>
              We bring professional-grade equipment, eco-friendly products, and
              a genuine care for each property we touch. Every job gets the same
              attention to detail, whether it&apos;s a single driveway or a
              full commercial building.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-heading text-2xl uppercase tracking-wide text-center mb-12">
            What We Stand For
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
                <Mountain className="w-7 h-7 text-teal" />
              </div>
              <h3 className="font-heading text-lg uppercase tracking-wide mb-2">
                Alpine Quality
              </h3>
              <p className="text-muted-foreground text-sm">
                Named after the toughest run on the mountain, we hold ourselves
                to the highest standard on every job. No corners cut, no detail
                missed.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
                <Droplets className="w-7 h-7 text-teal" />
              </div>
              <h3 className="font-heading text-lg uppercase tracking-wide mb-2">
                Eco-Conscious
              </h3>
              <p className="text-muted-foreground text-sm">
                We live here too. All our cleaning solutions are biodegradable
                and safe for Flathead Lake, our rivers, and your garden. Clean
                properties, clean conscience.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-teal" />
              </div>
              <h3 className="font-heading text-lg uppercase tracking-wide mb-2">
                Community First
              </h3>
              <p className="text-muted-foreground text-sm">
                We&apos;re not a franchise — we&apos;re your neighbors. We
                sponsor local youth sports, support Whitefish businesses, and
                give back to the valley that gives us so much.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Area Detail */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-heading text-2xl uppercase tracking-wide mb-6">
            Where We Work
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Our home base is Whitefish, Montana, but we serve the entire
            Flathead Valley and surrounding areas. If you&apos;re within about
            30 miles of Whitefish, we can likely get to you.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Our regular service areas include <strong>Whitefish</strong>,{" "}
            <strong>Kalispell</strong>, <strong>Columbia Falls</strong>,{" "}
            <strong>Bigfork</strong>, <strong>Lakeside</strong>, and
            communities throughout the <strong>Flathead Valley</strong>. Not
            sure if we cover your area?{" "}
            <Link href="/quote" className="text-teal underline">
              Just ask
            </Link>{" "}
            — we&apos;re happy to check.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl uppercase tracking-wide">
            Let&apos;s Talk About Your Property
          </h2>
          <p className="mt-4 text-primary-foreground/60">
            No pressure, no obligation — just a free quote and honest advice.
          </p>
          <Link
            href="/quote"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-teal text-white font-heading text-sm uppercase tracking-wider px-8 py-4 mt-8 transition-all duration-200 hover:bg-teal/90"
          >
            Get Your Free Quote
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
