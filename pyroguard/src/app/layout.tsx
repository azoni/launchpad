import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pyroguard-demo.netlify.app"),
  title: {
    default: "PyroGuard — Fire/Life-Safety Inspection, Done Right",
    template: "%s — PyroGuard",
  },
  description:
    "Mobile-first fire alarm and life-safety inspection platform for commercial contractors. Device-level inventory, NFPA-ready PDF reports, AI assistant, route optimization.",
  keywords: [
    "fire alarm inspection software",
    "NFPA 72 inspection",
    "fire protection software",
    "life-safety inspection app",
    "field service fire protection",
  ],
  authors: [{ name: "PyroGuard" }],
  openGraph: {
    type: "website",
    url: "https://pyroguard-demo.netlify.app",
    title: "PyroGuard — Fire/Life-Safety Inspection, Done Right",
    description:
      "Device-level fire alarm inspection. Swipe Pass/Fail. AI-drafted deficiencies. AHJ-ready PDFs.",
    siteName: "PyroGuard",
  },
  twitter: {
    card: "summary_large_image",
    title: "PyroGuard — Fire/Life-Safety Inspection, Done Right",
    description:
      "Device-level fire alarm inspection. Swipe Pass/Fail. AI-drafted deficiencies. AHJ-ready PDFs.",
  },
  alternates: { canonical: "https://pyroguard-demo.netlify.app/" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF9" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${mono.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        <Providers>{children}</Providers>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
