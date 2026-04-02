import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MeepleMatch — Find Your Next Board Game in 60 Seconds",
  description:
    "Swipe through board games, discover your preferences, and get personalized recommendations. Powered by real data from BoardGameGeek and Amazon.",
  alternates: { canonical: "https://meeplematch.netlify.app" },
  openGraph: {
    title: "MeepleMatch — Find Your Next Board Game in 60 Seconds",
    description: "Swipe-based board game discovery with personalized recommendations.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-3xl mx-auto text-center px-4 pt-16 pb-20">
        <div className="inline-block bg-candy-yellow text-kraft-dark px-4 py-1 rounded-full font-bold text-sm mb-6 rotate-[-2deg] border-2 border-kraft-dark">
          Board games edition!
        </div>
        <h1 className="font-heading text-5xl sm:text-6xl tracking-tight text-foreground leading-[1.1]">
          Find your next
          <br />
          <span className="text-primary">favorite game</span>
          <br />
          in 60 seconds
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-lg mx-auto font-bold leading-relaxed">
          Answer 4 quick questions, swipe through curated picks, and get
          personalized recs based on your real taste.
        </p>
        <Link
          href="/swipe"
          className="btn-chunky bg-primary text-primary-foreground border-[#cc5529] px-10 py-4 text-xl mt-10 shadow-[4px_4px_0px_#cc5529] inline-flex"
        >
          Start Swiping!
        </Link>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="font-heading text-3xl text-center mb-10">
          How It Works
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              color: "bg-candy-pink",
              title: "Quick Vibes",
              desc: "Tell us your group size, session length, and what sounds fun. 4 taps, done.",
            },
            {
              step: "2",
              color: "bg-candy-blue",
              title: "Swipe It",
              desc: "Swipe through games like dating apps. Right = yes, left = nah. We learn your taste live.",
            },
            {
              step: "3",
              color: "bg-candy-yellow text-kraft-dark",
              title: "Get Matched",
              desc: "See your top picks with reasons why, prices, and links to grab them on Amazon.",
            },
          ].map((item) => (
            <div key={item.step} className="card-cardboard p-6 text-center">
              <div
                className={`w-14 h-14 rounded-full ${item.color} flex items-center justify-center text-2xl font-heading mx-auto border-3 border-current shadow-[3px_3px_0px_rgba(0,0,0,0.2)]`}
              >
                {item.step}
              </div>
              <h3 className="font-heading text-xl mt-4">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 font-bold">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="font-heading text-3xl text-center mb-6">
          Pick Your Vibe
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Strategy", href: "/board-games?theme=strategy", emoji: "♟️", color: "badge-strategy" },
            { label: "Party", href: "/board-games?theme=party", emoji: "🎈", color: "badge-party" },
            { label: "Co-op", href: "/board-games?theme=cooperative", emoji: "🤝", color: "badge-cooperative" },
            { label: "Family", href: "/board-games?theme=family", emoji: "👨‍👩‍👧‍👦", color: "badge-family" },
            { label: "2-Player", href: "/board-games?players=2", emoji: "👫", color: "badge-thematic" },
            { label: "Quick Games", href: "/board-games?time=short", emoji: "⚡", color: "badge-card-game" },
          ].map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="card-cardboard p-5 text-center hover:rotate-[-1deg] transition-transform"
            >
              <span className="text-3xl block mb-2">{cat.emoji}</span>
              <span className="font-heading text-lg">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-4">
        <div className="card-cardboard max-w-md mx-auto p-8">
          <h2 className="font-heading text-2xl">Ready to find your game?</h2>
          <p className="text-muted-foreground font-bold mt-2">
            No signup needed. Just vibes.
          </p>
          <Link
            href="/swipe"
            className="btn-chunky bg-primary text-primary-foreground border-[#cc5529] px-8 py-3 text-lg mt-6 shadow-[4px_4px_0px_#cc5529] inline-flex"
          >
            Let&apos;s Go!
          </Link>
        </div>
      </section>

      {/* JSON-LD: WebSite + Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MeepleMatch",
              url: "https://meeplematch.netlify.app",
              description: "Find your next board game in 60 seconds with swipe-based discovery.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://meeplematch.netlify.app/board-games?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MeepleMatch",
              url: "https://meeplematch.netlify.app",
            },
          ]),
        }}
      />
    </div>
  );
}
