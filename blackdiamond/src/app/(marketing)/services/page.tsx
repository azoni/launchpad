import type { Metadata } from "next";
import Link from "next/link";
import {
  SprayCan,
  Droplets,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Exterior Cleaning Services",
  description:
    "Driveway pressure washing, window soft washing, and roof cleaning in Whitefish, MT. Learn about our process, what's included, and how we protect your property.",
  openGraph: {
    title: "Exterior Cleaning Services — Black Diamond Alpine Wash",
    description:
      "Professional driveway pressure washing, window soft washing, and roof cleaning in the Flathead Valley.",
  },
  twitter: { card: "summary_large_image" },
  alternates: {
    canonical: "https://blackdiamond-alpine-wash.netlify.app/services",
  },
};

const services = [
  {
    id: "pressure-washing",
    title: "Driveway Pressure Washing",
    icon: SprayCan,
    tagline: "Bring your concrete back to life",
    description:
      "Over time, driveways collect oil stains, tire marks, mold, and mineral deposits that make your home look neglected. Our high-pressure washing system strips away years of buildup, restoring your driveway to its original condition.",
    includes: [
      "Pre-treatment of oil and grease stains",
      "Hot water pressure washing up to 4,000 PSI",
      "Surface cleaning for even, streak-free results",
      "Edge and joint detail cleaning",
      "Post-wash rinse of surrounding areas",
    ],
    surfaces: [
      "Concrete driveways and walkways",
      "Paver patios and pool decks",
      "Garage floors",
      "Sidewalks and curbs",
    ],
  },
  {
    id: "soft-washing",
    title: "Window Soft Washing",
    icon: Droplets,
    tagline: "Crystal-clear views, zero risk",
    description:
      "Traditional window cleaning can leave streaks and doesn't address the buildup on frames and sills. Our soft wash method uses low-pressure water with specialized cleaning solutions to dissolve dirt, pollen, hard water deposits, and cobwebs — leaving every pane spotless.",
    includes: [
      "Interior and exterior window cleaning",
      "Frame and sill detailing",
      "Screen cleaning and inspection",
      "Hard water stain removal",
      "Storm window and skylight cleaning",
    ],
    surfaces: [
      "Residential windows (all sizes)",
      "Commercial storefronts",
      "French doors and sliding glass",
      "Multi-story windows (up to 3 floors)",
    ],
  },
  {
    id: "roof-cleaning",
    title: "Roof Cleaning",
    icon: ShieldCheck,
    tagline: "Protect your biggest investment",
    description:
      "Black streaks on your roof aren't just ugly — they're caused by algae (Gloeocapsa magma) that actually feeds on your shingles. Our soft wash roof cleaning kills algae, moss, and lichen at the root while keeping your shingles intact. No pressure washing on roofs, ever.",
    includes: [
      "Full roof inspection before cleaning",
      "Low-pressure soft wash application",
      "Algae, moss, and lichen treatment",
      "Gutter rinse and debris removal",
      "90-day re-growth guarantee",
    ],
    surfaces: [
      "Asphalt shingles",
      "Metal roofing",
      "Cedar shake",
      "Tile and slate",
    ],
  },
];

const faqs = [
  {
    question:
      "How often should I have my home's exterior cleaned?",
    answer:
      "We recommend pressure washing driveways and walkways once a year, window cleaning twice a year (spring and fall), and roof cleaning every 2-3 years — or sooner if you notice dark streaks or moss growth.",
  },
  {
    question: "Will pressure washing damage my surfaces?",
    answer:
      "Not when done correctly. We adjust pressure levels for each surface type. Delicate surfaces like windows and roofs always get our low-pressure soft wash treatment. Concrete and pavers can handle higher pressure safely.",
  },
  {
    question: "Are your cleaning products safe for pets and plants?",
    answer:
      "Yes. We use biodegradable, eco-friendly cleaning solutions that are safe for pets, plants, and your family. We also pre-wet landscaping before and after treatment as an extra precaution.",
  },
  {
    question: "How long does a typical service take?",
    answer:
      "A standard driveway wash takes 1-2 hours. Whole-home window cleaning runs 2-4 hours depending on size. Roof treatments typically take 2-3 hours. We'll give you a time estimate with your quote.",
  },
  {
    question: "Do you offer package deals?",
    answer:
      "Absolutely. Most of our customers bundle services — for example, driveway + windows, or a full exterior package. Bundling saves you 10-15% compared to booking individually. Mention it when you request your quote.",
  },
];

export default function ServicesPage() {
  const jsonLd = [
    {
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
          name: "Services",
          item: "https://blackdiamond-alpine-wash.netlify.app/services",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

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
            Our Services
          </h1>
          <p className="mt-4 text-primary-foreground/60 max-w-xl mx-auto">
            Every surface cleaned with the right technique, the right pressure,
            and the right products. No shortcuts.
          </p>
        </div>
      </section>

      {/* Service Details */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 space-y-20">
          {services.map((service, idx) => (
            <div
              key={service.id}
              id={service.id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-start ${
                idx % 2 === 1 ? "lg:direction-rtl" : ""
              }`}
            >
              {/* Info */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center">
                    <service.icon className="w-5 h-5 text-teal" />
                  </div>
                  <h2 className="font-heading text-2xl uppercase tracking-wide">
                    {service.title}
                  </h2>
                </div>
                <p className="text-teal font-medium text-sm uppercase tracking-wider mb-4">
                  {service.tagline}
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {service.description}
                </p>
                <Link
                  href="/quote"
                  className="btn-primary text-xs py-2.5 px-5"
                >
                  Get a Quote
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Details */}
              <div className="space-y-6">
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="font-heading text-sm uppercase tracking-wider mb-4">
                    What&apos;s Included
                  </h3>
                  <ul className="space-y-2">
                    {service.includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-card rounded-lg border border-border p-6">
                  <h3 className="font-heading text-sm uppercase tracking-wider mb-4">
                    Surfaces We Clean
                  </h3>
                  <ul className="space-y-2">
                    {service.surfaces.map((surface) => (
                      <li
                        key={surface}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="w-1.5 h-1.5 bg-teal rotate-45 shrink-0 mt-1.5" />
                        <span>{surface}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-card">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-heading text-3xl uppercase tracking-wide text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="border-l-4 border-l-teal bg-background rounded-r-lg p-6"
              >
                <h3 className="font-heading text-base uppercase tracking-wide mb-2">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl uppercase tracking-wide">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Request a free quote and we&apos;ll get back to you within 24 hours.
          </p>
          <Link
            href="/quote"
            className="btn-primary mt-8"
          >
            Request Your Free Quote
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
