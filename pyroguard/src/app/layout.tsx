import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/Providers";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

// Proportional face for long reading prose — mono stays for the tactical chrome.
const sans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pyroguard-demo.netlify.app"),
  title: {
    default: "PyroGuard — The Fire/Life-Safety Operations Platform",
    template: "%s — PyroGuard",
  },
  description:
    "All-in-one operations platform for fire & life-safety inspection contractors — scheduling, field inspections, AHJ filing, deficiency quoting, and invoicing in one system.",
  keywords: [
    "fire inspection software",
    "NFPA 25 inspection software",
    "NFPA 72 inspection",
    "fire protection contractor software",
    "SedonaOffice alternative",
    "ITM software",
  ],
  authors: [{ name: "PyroGuard" }],
  openGraph: {
    type: "website",
    url: "https://pyroguard-demo.netlify.app",
    title: "PyroGuard — The Fire/Life-Safety Operations Platform",
    description:
      "Schedule, inspect, file, quote, and invoice — one platform for fire/life-safety inspection contractors.",
    siteName: "PyroGuard",
  },
  twitter: {
    card: "summary_large_image",
    title: "PyroGuard — The Fire/Life-Safety Operations Platform",
    description:
      "Schedule, inspect, file, quote, and invoice — one platform for fire/life-safety inspection contractors.",
  },
  alternates: { canonical: "https://pyroguard-demo.netlify.app/" },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#080c10",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${mono.variable} ${sans.variable}`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        {/* Portfolio traffic beacon — one visit/session to the shared leaderboard sink */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(!sessionStorage.getItem('_av_lb')){sessionStorage.setItem('_av_lb','1');fetch('https://azoni.ai/.netlify/functions/log-visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'pyroguard'})}).catch(function(){})}}catch(e){}` }} />
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
