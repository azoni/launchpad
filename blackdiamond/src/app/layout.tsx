import type { Metadata } from "next";
import Script from "next/script";
import { Oswald, Source_Sans_3 } from "next/font/google";
import { PostHogProvider } from "./PostHogProvider";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

const oswald = Oswald({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default:
      "Black Diamond Alpine Wash — Exterior Cleaning in Whitefish, MT",
    template: "%s — Black Diamond Alpine Wash",
  },
  description:
    "Professional pressure washing, window soft washing, and roof cleaning in Whitefish, Montana. Serving the Flathead Valley with eco-friendly exterior cleaning services.",
  metadataBase: new URL("https://blackdiamond-alpine-wash.netlify.app"),
  twitter: {
    card: "summary_large_image",
  },
  other: {
    "theme-color": "#1B1B1B",
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
      className={`${sourceSans.variable} ${oswald.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>

        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}</Script>
          </>
        )}

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
