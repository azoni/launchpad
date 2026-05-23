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
import { StatusPill } from "@/components/pipeline/StatusPill";
import { APP_NAME, APP_URL } from "@/lib/utils";

type PageProps = { params: Promise<{ username: string }> };

async function loadProfile(username: string) {
  const lookup = await adminDb.collection(COLLECTIONS.usernames).doc(username).get();
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
  if (!data) return { title: `@${username}`, robots: { index: false, follow: false } };
  const activeCount = data.opportunities.filter((o) =>
    ["ongoing", "referral", "applied", "screen", "onsite", "offer"].includes(o.status),
  ).length;
  const display = data.user.displayName ?? `@${username}`;
  const title = `${display} on ${APP_NAME}`;
  const description =
    activeCount > 0
      ? `${display} is currently exploring ${activeCount} ${activeCount === 1 ? "opportunity" : "opportunities"} on ${APP_NAME}.`
      : `Public profile of ${display} on ${APP_NAME}.`;
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
  onsite: 0, offer: 1, screen: 2, applied: 3, ongoing: 4, referral: 5,
  accepted: 10, withdrew: 11, rejected: 12, ghosted: 13,
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

  const nowOpps = sortedOpps.filter(
    (o) => !NEGATIVE_CLOSED.includes(o.status) && o.status !== "accepted",
  );
  const accepted = sortedOpps.filter((o) => o.status === "accepted");
  const closed = sortedOpps.filter((o) => NEGATIVE_CLOSED.includes(o.status));

  const lastSyncedHuman = user.lastSyncedAt ? humanRelative(user.lastSyncedAt) : null;
  const dateLine = todayLine();

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
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Slim header — same wordmark as the rest of the site */}
      <header className="border-b border-[color:var(--hairline)]">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="dy-wordmark">
            {APP_NAME.toLowerCase()}
          </Link>
          <Link
            href="/explore"
            className="dy-mono text-[color:var(--ink-soft)] hover:text-[color:var(--primary)]"
          >
            explore →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 sm:px-8 pt-12 sm:pt-16 pb-20">
        {/* Identity */}
        <section className="flex items-start gap-5">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={`${user.displayName ?? username}`}
              width={64}
              height={64}
              className="rounded-full border border-[color:var(--hairline-strong)]"
            />
          ) : (
            <div
              className="h-16 w-16 rounded-full grid place-items-center text-[20px] font-medium"
              style={{
                background: "var(--accent-soft)",
                color: "var(--primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              {(user.displayName ?? username).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 pt-1">
            <h1
              className="dy-display text-[32px] sm:text-[40px]"
            >
              {user.displayName ?? `@${username}`}
            </h1>
            <p className="mt-1.5 text-[14px] text-[color:var(--ink-soft)] flex items-center gap-2 flex-wrap">
              <span className="dy-mono text-[color:var(--faded)]">@{username}</span>
              <span className="text-[color:var(--faded)]">·</span>
              <span>{dateLine}</span>
              {lastSyncedHuman && (
                <>
                  <span className="text-[color:var(--faded)]">·</span>
                  <span className="text-[color:var(--faded)]">synced {lastSyncedHuman}</span>
                </>
              )}
            </p>
          </div>
        </section>

        {/* Pipeline */}
        {sortedOpps.length > 0 && (
          <section className="mt-14 sm:mt-16">
            <SectionHeader title="Currently exploring" count={sortedOpps.length} />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {nowOpps.map((o) => <OppCard key={o.id} opp={o} />)}
              {accepted.map((o) => <OppCard key={o.id} opp={o} tone="positive" />)}
              {closed.map((o) => <OppCard key={o.id} opp={o} muted />)}
            </div>
          </section>
        )}

        {/* Calendar */}
        <section className="mt-14 sm:mt-16">
          <SectionHeader title="The week" count={events.length} />
          <div className="mt-6">
            <PublicTimeline
              events={events}
              opportunitiesById={oppsById}
              emptyState={
                <span className="italic text-[color:var(--faded)]">
                  {user.displayName ?? `@${username}`} hasn&apos;t shared any events publicly yet.
                </span>
              }
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 sm:mt-24 pt-8 border-t border-[color:var(--hairline)]">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="dy-eyebrow">about</p>
              <p
                className="mt-2 text-[16px] leading-snug max-w-md text-[color:var(--ink-soft)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {APP_NAME} is an opt-in calendar — a quiet place to keep track of what
                you&apos;re working on, and what to share.
              </p>
              <p className="mt-2 dy-mono text-[color:var(--faded)]">
                built by{" "}
                <a
                  href="https://azoni.ai"
                  className="underline decoration-[color:var(--hairline-strong)] underline-offset-2 hover:decoration-[color:var(--primary)]"
                >
                  azoni.ai
                </a>
              </p>
            </div>
            <Link href="/app" className="btn-chunky">
              Make yours
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 pb-2 border-b border-[color:var(--hairline)]">
      <h2
        className="dy-display text-[20px] sm:text-[22px]"
        style={{ fontFamily: "var(--font-heading)", fontWeight: 500 }}
      >
        {title}
      </h2>
      {count !== undefined && (
        <span className="dy-mono text-[color:var(--faded)]">{count}</span>
      )}
    </div>
  );
}

function OppCard({
  opp,
  muted,
  tone,
}: {
  opp: OpportunityDoc;
  muted?: boolean;
  tone?: "positive" | "negative";
}) {
  const isStruck = NEGATIVE_CLOSED.includes(opp.status);
  const topBorderColor =
    tone === "positive"
      ? "var(--positive)"
      : opp.status === "rejected"
        ? "var(--negative)"
        : opp.status === "withdrew" || opp.status === "ghosted"
          ? "var(--hairline-strong)"
          : "var(--primary)";
  return (
    <article
      className={`chunky p-5 ${muted ? "opacity-70" : ""}`}
      style={{ boxShadow: `inset 0 2px 0 0 ${topBorderColor}` }}
    >
      <header className="flex items-start justify-between gap-2 flex-wrap mb-2">
        <div className="min-w-0">
          <h3
            className={`text-[18px] font-medium leading-tight tracking-tight ${
              isStruck ? "line-through text-[color:var(--faded)]" : ""
            }`}
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {opp.company}
          </h3>
          <p className="text-[13.5px] text-[color:var(--ink-soft)] mt-0.5">
            {opp.role}
            {opp.locationType && (
              <span className="text-[color:var(--faded)]"> · {opp.locationType}</span>
            )}
          </p>
        </div>
        <StatusPill status={opp.status} />
      </header>

      {opp.nextStep && (
        <p className="text-[14px] text-[color:var(--ink-soft)] mt-2">
          <span className="text-[color:var(--faded)]">next:</span> {opp.nextStep}
          {opp.nextStepBy && (
            <span className="text-[color:var(--faded)]"> · {opp.nextStepBy}</span>
          )}
        </p>
      )}

      {(opp.source || opp.link) && (
        <p className="dy-mono text-[color:var(--faded)] mt-3">
          {opp.source && <span>via {opp.source}</span>}
          {opp.source && opp.link && " · "}
          {opp.link && (
            <a
              href={opp.link}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[color:var(--hairline-strong)] underline-offset-2 hover:decoration-[color:var(--primary)]"
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

function todayLine(): string {
  return new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
