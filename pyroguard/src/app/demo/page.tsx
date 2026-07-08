import type { Metadata } from "next";
import { DemoGame } from "@/components/demo/DemoGame";

export const metadata: Metadata = {
  title: "A Day in the Field — playable demo",
  description:
    "Play one real NFPA 25 inspection as the inspector — riser to invoice. Offline photo capture in a dead zone, severity classification, AHJ filing, same-day invoice. ~4 minutes, built for your phone.",
  alternates: { canonical: "https://pyroguard-demo.netlify.app/demo" },
  openGraph: {
    type: "website",
    siteName: "PyroGuard",
    title: "A Day in the Field — playable PyroGuard demo",
    description: "Play one real NFPA 25 inspection, riser to invoice. Watch four systems become one.",
    url: "https://pyroguard-demo.netlify.app/demo",
    // page-level openGraph REPLACES the layout's — images must be explicit (see fab-stats OG gotcha)
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "PyroGuard — A Day in the Field" }],
  },
};

export default function DemoPage() {
  return <DemoGame />;
}
