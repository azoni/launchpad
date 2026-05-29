import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { APP_NAME, APP_TAGLINE, APP_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_TAGLINE,
  openGraph: {
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_TAGLINE,
    url: APP_URL,
    siteName: APP_NAME,
    images: [
      { url: "/opengraph-image", width: 1200, height: 630, alt: `${APP_NAME} — public calendar profiles` },
    ],
  },
  alternates: { canonical: APP_URL },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      url: APP_URL,
      name: APP_NAME,
      description: APP_TAGLINE,
    },
    {
      "@type": "Organization",
      url: APP_URL,
      name: APP_NAME,
      logo: `${APP_URL}/icon.svg`,
    },
  ],
};

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-20 md:pb-24">
          <div className="grid min-w-0 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="min-w-0 space-y-5 md:space-y-6">
              <span className="dy-eyebrow pop-in">an opt-in calendar</span>
              <h1
                className="dy-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
                style={{ fontWeight: 500 }}
              >
                Show people what you&apos;re actually working on.
              </h1>
              <p className="text-base sm:text-lg max-w-xl text-[color:var(--ink-soft)]">
                Sign in with Google, sync your calendar, and decide event-by-event what to share.
                Friends, recruiters, your group chat — anyone with the link sees what you&apos;ve
                made public.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/app" className="btn-chunky text-base sm:text-lg">
                  Sign in with Google →
                </Link>
                <Link href="/explore" className="btn-chunky btn-ghost text-sm sm:text-base">
                  Explore profiles
                </Link>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Read-only access to your Google Calendar. Nothing public unless you toggle it.
              </p>
            </div>

            <div className="relative min-w-0">
              <div className="chunky chunky-coral mx-auto w-full max-w-[22rem] min-w-0 p-4 sm:max-w-md sm:p-5 md:max-w-none md:p-6 tilt-hover bg-card">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <p className="font-heading text-xl">This week</p>
                  <span className="sticker shrink-0 bg-grape text-white">live demo</span>
                </div>
                <div className="space-y-3">
                  <DemoEvent time="Mon · 10:00" title="GEICO Staff Engineer — round 2" color="primary" pub />
                  <DemoEvent time="Mon · 14:30" title="Founder coffee ☕" color="sun" />
                  <DemoEvent time="Tue · 09:00" title="Anthropic — system design" color="grape" pub />
                  <DemoEvent time="Wed · 18:00" title="Climbing @ Vital" color="primary" pub />
                  <DemoEvent time="Thu · 11:00" title="Therapy" color="sun" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-8">How it works</h2>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            <Card emoji="🔑" title="Sign in">
              One tap with your Google account. We ask for read-only Calendar access. That&apos;s it.
            </Card>
            <Card emoji="🔄" title="Sync">
              We pull your upcoming events into your private dashboard. Everything starts hidden.
            </Card>
            <Card emoji="👁️" title="Toggle public">
              Flip individual events into the public view. Your profile lives at{" "}
              <span className="font-mono">/u/your-name</span>.
            </Card>
          </div>
        </section>

        {/* For whom */}
        <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="chunky chunky-grape p-6 md:p-10">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Made for chaotic weeks.
            </h2>
            <p className="text-lg max-w-3xl text-muted-foreground">
              Built when our maker was running 4+ interviews a day, three side projects, and a
              social life that needed a shared brain. A nicer way to say <em>here&apos;s where I&apos;ll be</em>{" "}
              than copy-pasting into Slack.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app" className="btn-chunky">
                Sign in with Google
              </Link>
              <Link href="/u/charltonuw" className="btn-chunky btn-sun">
                See an example
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function DemoEvent({
  time,
  title,
  color,
  pub,
}: {
  time: string;
  title: string;
  color: "primary" | "sun" | "grape";
  pub?: boolean;
}) {
  const bg =
    color === "primary"
      ? "bg-primary text-white"
      : color === "sun"
        ? "bg-sun text-ink"
        : "bg-grape text-white";
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-2 border-2 border-ink rounded-xl p-2.5 bg-card sm:flex sm:items-start sm:gap-3 sm:p-3">
      <span
        className={`shrink-0 px-1.5 py-1 text-[0.68rem] rounded-md font-bold border-2 border-ink sm:px-2 sm:text-xs ${bg}`}
      >
        {time}
      </span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold sm:text-base">{title}</p>
      </div>
      {pub ? (
        <span className="sticker col-start-2 w-fit bg-sun sm:col-start-auto sm:shrink-0" aria-label="public">
          public
        </span>
      ) : (
        <span className="col-start-2 w-fit text-xs text-muted-foreground border-2 border-dashed border-muted-foreground rounded-full px-2 py-0.5 sm:col-start-auto sm:shrink-0">
          private
        </span>
      )}
    </div>
  );
}

function Card({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="chunky p-5 md:p-6 tilt-hover">
      <div className="text-3xl mb-2" aria-hidden>
        {emoji}
      </div>
      <h3 className="font-heading text-xl md:text-2xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}
