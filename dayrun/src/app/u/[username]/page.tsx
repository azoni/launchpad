import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type EventDoc,
  type OpportunityDoc,
  type OpportunityStatus,
  type UserDoc,
} from "@/lib/firebase/collections";
import { PublicTimeline } from "@/components/PublicTimeline";
import { APP_NAME, APP_URL } from "@/lib/utils";

type PageProps = { params: Promise<{ username: string }> };

async function loadProfile(username: string) {
  const lookup = await adminDb
    .collection(COLLECTIONS.usernames)
    .doc(username)
    .get();
  if (!lookup.exists) return null;
  const uid = (lookup.data() as { uid?: string }).uid;
  if (!uid) return null;
  const userSnap = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
  if (!userSnap.exists) return null;
  const user = userSnap.data() as UserDoc;
  if (!user.publicProfile) return null;

  const now = Date.now();
  const horizonBack = new Date(now - 60 * 86400_000).toISOString();
  const eventsSnap = await adminDb
    .collection(COLLECTIONS.events(uid))
    .where("isPublic", "==", true)
    .where("start", ">=", horizonBack)
    .orderBy("start", "asc")
    .limit(300)
    .get();
  const events = eventsSnap.docs.map((d) => d.data() as EventDoc);

  const oppsSnap = await adminDb
    .collection(COLLECTIONS.opportunities(uid))
    .where("isPublic", "==", true)
    .limit(100)
    .get();
  const opportunities = oppsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as OpportunityDoc))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 50);

  return { user, events, opportunities };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await loadProfile(username);
  if (!data) {
    return { title: `@${username}`, robots: { index: false, follow: false } };
  }
  const title = `${data.user.displayName ?? `@${username}`} on ${APP_NAME}`;
  const activeCount = data.opportunities.filter((o) =>
    ["ongoing", "referral", "applied", "screen", "onsite", "offer"].includes(o.status),
  ).length;
  const description =
    activeCount > 0
      ? `${data.user.displayName ?? `@${username}`} is currently exploring ${activeCount} ${activeCount === 1 ? "opportunity" : "opportunities"}.`
      : `Public profile of ${data.user.displayName ?? `@${username}`} on ${APP_NAME}.`;
  const url = `${APP_URL}/u/${username}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: APP_NAME,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: url },
  };
}

const STATUS_ORDER: Record<OpportunityStatus, number> = {
  onsite: 0,
  offer: 1,
  screen: 2,
  applied: 3,
  ongoing: 4,
  referral: 5,
  accepted: 10,
  withdrew: 11,
  rejected: 12,
  ghosted: 13,
};
const NEGATIVE_CLOSED: OpportunityStatus[] = ["rejected", "withdrew", "ghosted"];

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const data = await loadProfile(username);
  if (!data) notFound();

  const { user, events, opportunities } = data;
  const oppsById = new Map(opportunities.map((o) => [o.id, o]));
  const sortedOpps = [...opportunities].sort((a, b) => {
    const ra = STATUS_ORDER[a.status] ?? 99;
    const rb = STATUS_ORDER[b.status] ?? 99;
    if (ra !== rb) return ra - rb;
    return b.updatedAt - a.updatedAt;
  });

  const activeOpps = sortedOpps.filter((o) => !NEGATIVE_CLOSED.includes(o.status) && o.status !== "accepted");
  const wonOpps = sortedOpps.filter((o) => o.status === "accepted");
  const closedNegOpps = sortedOpps.filter((o) => NEGATIVE_CLOSED.includes(o.status));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: user.displayName ?? `@${username}`,
    url: `${APP_URL}/u/${username}`,
    mainEntity: {
      "@type": "Person",
      name: user.displayName ?? username,
      image: user.photoURL ?? undefined,
      url: `${APP_URL}/u/${username}`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: APP_NAME, item: APP_URL },
        { "@type": "ListItem", position: 2, name: `@${username}`, item: `${APP_URL}/u/${username}` },
      ],
    },
    hasPart: events.slice(0, 12).map((ev) => ({
      "@type": "Event",
      name: ev.summary,
      startDate: ev.start,
      endDate: ev.end,
      location: ev.location ? { "@type": "Place", name: ev.location } : undefined,
    })),
  };

  const lastSyncedHuman = user.lastSyncedAt
    ? humanRelative(user.lastSyncedAt)
    : null;

  return (
    <div className="editorial min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Minimal masthead */}
      <header className="border-b border-[color:var(--ed-hairline)]">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-[14px] font-medium tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            DayRun
          </Link>
          <Link
            href="/explore"
            className="text-[13px] text-[color:var(--ed-muted)] hover:text-[color:var(--ed-ink)]"
          >
            Explore →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 sm:px-8 py-12 sm:py-16">
        {/* Identity */}
        <section className="flex items-start gap-5">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={`${user.displayName ?? username}`}
              width={56}
              height={56}
              className="rounded-full border border-[color:var(--ed-hairline-strong)]"
            />
          ) : (
            <div
              className="h-14 w-14 rounded-full grid place-items-center text-lg font-medium"
              style={{
                background: "var(--ed-accent-bg)",
                color: "var(--ed-accent)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {(user.displayName ?? username).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 pt-0.5">
            <h1 className="text-[28px] sm:text-[34px] font-medium leading-[1.05] tracking-tight">
              {user.displayName ?? `@${username}`}
            </h1>
            <p className="mt-1 text-[14px] text-[color:var(--ed-muted)]">
              <span className="ed-mono">@{username}</span>
              {activeOpps.length > 0 && (
                <>
                  <span className="ed-dot mx-2">·</span>
                  {activeOpps.length} open
                  {wonOpps.length > 0 ? ` · ${wonOpps.length} accepted` : ""}
                </>
              )}
              {lastSyncedHuman && (
                <>
                  <span className="ed-dot mx-2">·</span>
                  updated {lastSyncedHuman}
                </>
              )}
            </p>
          </div>
        </section>

        {/* Pipeline */}
        {sortedOpps.length > 0 && (
          <section className="mt-14 sm:mt-16">
            <SectionHeader eyebrow="01" title="Currently exploring" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {activeOpps.map((o) => (
                <OpportunityCard key={o.id} opp={o} />
              ))}
              {wonOpps.map((o) => (
                <OpportunityCard key={o.id} opp={o} />
              ))}
              {closedNegOpps.map((o) => (
                <OpportunityCard key={o.id} opp={o} muted />
              ))}
            </div>
          </section>
        )}

        {/* Calendar */}
        <section className="mt-14 sm:mt-16">
          <SectionHeader
            eyebrow={sortedOpps.length > 0 ? "02" : "01"}
            title="Calendar"
          />
          <div className="mt-6">
            <PublicTimeline
              events={events}
              opportunitiesById={oppsById}
              emptyState={
                <span>
                  {user.displayName ?? `@${username}`} hasn&apos;t shared any events publicly. Check
                  back later.
                </span>
              }
            />
          </div>
        </section>

        {/* Quiet footer CTA */}
        <footer className="mt-20 sm:mt-24 pt-8 border-t border-[color:var(--ed-hairline)]">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p
                className="text-[15px] leading-snug max-w-md text-[color:var(--ed-ink-soft)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                DayRun is a public, opt-in calendar for what you&apos;re working on.
              </p>
              <p className="mt-1 text-[13px] text-[color:var(--ed-muted)]">
                Built by{" "}
                <a href="https://azoni.ai" className="ed-link">
                  azoni.ai
                </a>
              </p>
            </div>
            <Link href="/app" className="ed-btn">
              Make your own
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="ed-eyebrow">{eyebrow}</span>
      <h2 className="text-[22px] sm:text-[24px] font-medium tracking-tight">{title}</h2>
      <span className="flex-1 h-px bg-[color:var(--ed-hairline)] translate-y-[-3px]" />
    </div>
  );
}

function statusPillClass(s: OpportunityStatus): string {
  if (s === "accepted" || s === "offer") return "ed-pill ed-pill-positive";
  if (s === "rejected") return "ed-pill ed-pill-negative";
  if (s === "withdrew" || s === "ghosted") return "ed-pill ed-pill-outline";
  return "ed-pill ed-pill-neutral";
}

function OpportunityCard({ opp, muted }: { opp: OpportunityDoc; muted?: boolean }) {
  return (
    <article
      className={`ed-card flex flex-col gap-2 ${muted ? "opacity-70" : ""}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[17px] font-medium leading-tight tracking-tight">
            {opp.company}
          </h3>
          <p className="text-[13.5px] text-[color:var(--ed-muted)] mt-0.5">
            {opp.role}
            {opp.locationType ? (
              <>
                <span className="ed-dot mx-1.5">·</span>
                {opp.locationType}
              </>
            ) : null}
          </p>
        </div>
        <span className={statusPillClass(opp.status)}>{opp.status}</span>
      </header>

      {opp.nextStep && (
        <p className="text-[14px] text-[color:var(--ed-ink-soft)]">
          <span className="text-[color:var(--ed-mutest)]">Next:</span> {opp.nextStep}
          {opp.nextStepBy && (
            <span className="text-[color:var(--ed-mutest)]"> · {opp.nextStepBy}</span>
          )}
        </p>
      )}

      {(opp.source || opp.link) && (
        <p className="text-[12.5px] text-[color:var(--ed-mutest)] mt-auto pt-1">
          {opp.source && <span>via {opp.source}</span>}
          {opp.source && opp.link && <span className="ed-dot mx-1.5">·</span>}
          {opp.link && (
            <a
              href={opp.link}
              target="_blank"
              rel="noopener noreferrer"
              className="ed-link"
            >
              posting
            </a>
          )}
        </p>
      )}
    </article>
  );
}

function humanRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}
