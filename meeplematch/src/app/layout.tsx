import type { Metadata } from "next";
import Script from "next/script";
import { Comic_Neue, Lilita_One } from "next/font/google";
import { PostHogProvider } from "./PostHogProvider";
import "./globals.css";

const comicNeue = Comic_Neue({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const lilitaOne = Lilita_One({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "MeepleMatch — Swipe to Discover Products You Love",
    template: "%s — MeepleMatch",
  },
  description:
    "Find your next favorite board game in 60 seconds. Swipe-based discovery with personalized recommendations.",
  metadataBase: new URL("https://meeplematch.netlify.app"),
  twitter: {
    card: "summary_large_image",
  },
  other: {
    "theme-color": "#FF6B35",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${comicNeue.variable} ${lilitaOne.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>

        {/* GA4 — only loads if env var is set */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}</Script>
          </>
        )}

        {/* AdSense — only loads if env var is set */}
        {process.env.NEXT_PUBLIC_ADSENSE_ID && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_ID}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
      </body>
    </html>
  );
}
