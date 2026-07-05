import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Courier_Prime, Fraunces, Inter } from "next/font/google";
import { PostHogProvider } from "./PostHogProvider";
import "./globals.css";
import { APP_NAME, APP_TAGLINE, APP_URL } from "@/lib/utils";

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const courierPrime = Courier_Prime({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  metadataBase: new URL(APP_URL),
  applicationName: APP_NAME,
  openGraph: {
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_TAGLINE,
    url: APP_URL,
    siteName: APP_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_TAGLINE,
  },
  alternates: { canonical: APP_URL },
};

export const viewport: Viewport = {
  themeColor: "#1A2E2E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${courierPrime.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Portfolio traffic beacon — one visit/session to the shared leaderboard sink */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(!sessionStorage.getItem('_av_lb')){sessionStorage.setItem('_av_lb','1');fetch('https://azoni.ai/.netlify/functions/log-visit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({source:'dayrun'})}).catch(function(){})}}catch(e){}` }} />
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
