import type { Metadata } from "next";
import Link from "next/link";
import { ServiceCard } from "@/components/ServiceCard";
import {
  Droplets,
  SprayCan,
  ShieldCheck,
  Leaf,
  MapPin,
  Star,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title:
    "Black Diamond Alpine Wash — Pressure Washing & Exterior Cleaning in Whitefish, MT",
  description:
    "Professional driveway pressure washing, window soft washing, and roof cleaning in Whitefish, Montana. Eco-friendly, locally owned. Get a free quote today.",
  openGraph: {
    title: "Black Diamond Alpine Wash — Exterior Cleaning in Whitefish, MT",
    description:
      "Professional pressure washing, window soft washing, and roof cleaning serving the Flathead Valley.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Black Diamond Alpine Wash — Professional Exterior Cleaning",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  alternates: {
    canonical: "https://blackdiamond-alpine-wash.netlify.app",
  },
};

const services = [
  {
    title: "Driveway Pressure Washing",
    description:
      "Remove years of grime, oil stains, and weather buildup from concrete, pavers, and asphalt. Your driveway will look brand new.",
    icon: SprayCan,
  },
  {
    title: "Window Soft Washing",
    description:
      "Crystal-clear windows without the risk of damage. Our low-pressure soft wash technique safely removes dirt, pollen, and hard water spots.",
    icon: Droplets,
  },
  {
    title: "Roof Cleaning",
    description:
      "Extend your roof's life by removing moss, algae, and dark streaks. Gentle cleaning that protects your shingles while restoring curb appeal.",
    icon: ShieldCheck,
  },
];

const trustPoints = [
  {
    icon: ShieldCheck,
    title: "Licensed & Insured",
    description: "Fully licensed and insured for your peace of mind",
  },
  {
    icon: Leaf,
    title: "Eco-Friendly",
    description: "Biodegradable cleaning solutions safe for your property",
  },
  {
    icon: MapPin,
    title: "Locally Owned",
    description: "Proud to serve Whitefish and the Flathead Valley",
  },
  {
    icon: Star,
    title: "Satisfaction Guaranteed",
    description: "Not happy? We'll come back and make it right",
  },
];

const serviceAreas = [
  "Whitefish",
  "Kalispell",
  "Columbia Falls",
  "Bigfork",
  "Lakeside",
  "Flathead Valley",
];

export default function HomePage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Black Diamond Alpine Wash",
      url: "https://blackdiamond-alpine-wash.netlify.app",
      description:
        "Professional exterior cleaning services in Whitefish, Montana.",
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Black Diamond Alpine Wash",
      description:
        "Professional driveway pressure washing, window soft washing, and roof cleaning in Whitefish, Montana.",
      url: "https://blackdiamond-alpine-wash.netlify.app",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Whitefish",
        addressRegion: "MT",
        addressCountry: "US",
      },
      telephone: "+14065551234",
      email: "info@blackdiamondalpinewash.com",
      areaServed: serviceAreas.map((area) => ({
        "@type": "City",
        name: `${area}, Montana`,
      })),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Exterior Cleaning Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Driveway Pressure Washing",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Window Soft Washing",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Roof Cleaning",
            },
          },
        ],
      },
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="hero-gradient text-white py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div
            className="w-10 h-10 bg-teal rotate-45 rounded-sm mx-auto mb-8"
            aria-hidden="true"
          />
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl uppercase tracking-wide leading-tight">
            Exterior Cleaning
            <br />
            <span className="text-teal">Done Right</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto">
            Professional pressure washing, window soft washing, and roof
            cleaning for homes and businesses in Whitefish, Montana and the
            Flathead Valley.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quote"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-teal text-white font-heading text-sm uppercase tracking-wider px-8 py-4 transition-all duration-200 hover:bg-teal/90"
            >
              Get a Free Quote
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center gap-2 rounded-md border-2 border-white/30 text-white font-heading text-sm uppercase tracking-wider px-8 py-4 transition-all duration-200 hover:bg-white/10"
            >
              Our Services
            </Link>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl uppercase tracking-wide">
              Our Services
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              From driveways to rooftops, we bring the sparkle back to every
              surface of your property.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.title}
                title={service.title}
                description={service.description}
                icon={service.icon}
                href="/services"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl uppercase tracking-wide">
              Why Choose Black Diamond
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {trustPoints.map((point) => (
              <div key={point.title} className="trust-badge">
                <point.icon className="w-8 h-8 text-teal mb-3" />
                <h3 className="font-heading text-sm uppercase tracking-wide mb-1">
                  {point.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl uppercase tracking-wide mb-4">
            Serving the Flathead Valley
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Based in Whitefish, we proudly serve communities across
            northwestern Montana.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {serviceAreas.map((area) => (
              <span
                key={area}
                className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium"
              >
                <MapPin className="w-3 h-3 inline mr-1 text-teal" />
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl uppercase tracking-wide">
            Ready for a Cleaner Property?
          </h2>
          <p className="mt-4 text-primary-foreground/60 max-w-lg mx-auto">
            Get a free, no-obligation quote for your home or business. We
            respond within 24 hours.
          </p>
          <Link
            href="/quote"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-teal text-white font-heading text-sm uppercase tracking-wider px-8 py-4 mt-8 transition-all duration-200 hover:bg-teal/90"
          >
            Request Your Free Quote
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
