import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  CLOSED_STATUSES,
  isActive,
  normalizeOpportunityStatus,
  type ChecklistItem,
  type Compensation,
  type EventDoc,
  type OpportunityDoc,
  type UserDoc,
} from "@/lib/firebase/collections";
import { PublicTimeline } from "@/components/PublicTimeline";
import { ProfileBoard } from "@/components/profile/ProfileBoard";
import type { PublicOpportunity } from "@/components/profile/PublicOppCard";
import { APP_NAME, APP_URL } from "@/lib/utils";
import {
  enhanceOpportunityWithEvents,
  getNextRoundAt,
  parsePipelineDate,
  todayStartMs,
} from "@/lib/pipeline";
import { formatCalendarDayDate, todayInTimeZone } from "@/lib/calendar-time";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = { params: Promise<{ username: string }> };

function opportunityFromDoc(id: string, data: Record<string, unknown>): OpportunityDoc {
  return {
    id,
    ...(data as Omit<OpportunityDoc, "id">),
    status: normalizeOpportunityStatus(data.status),
  };
}

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
  const opportunities = (
    await Promise.all(
      oppsSnap.docs.map(async (d): Promise<PublicOpportunity> => {
        const opp = opportunityFromDoc(d.id, d.data());
        const privateSnap = await adminDb
          .collection(COLLECTIONS.opportunityPrivate(uid, opp.id))
          .doc("data")
          .get();
        const privateData = privateSnap.exists ? privateSnap.data() : null;
        const compensation = (privateData?.compensation ?? null) as Compensation | null;
        const checklist = ((privateData?.checklist ?? []) as ChecklistItem[]).filter(
          (item) => item && item.done !== true,
        );
        return {
          ...opp,
          hasOpenActionItems: opp.hasOpenActionItems === true || checklist.length > 0,
          publicCompensation: compensation,
        };
      }),
    )
  )
    .map((opp) => enhanceOpportunityWithEvents(opp, events))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 50);

  return { user, events, opportunities };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await loadProfile(username);
  if (!data) return { title: `@${username}`, robots: { index: false, follow: false } };
  const activeCount = data.opportunities.filter((o) => isActive(o.status)).length;
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

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const data = await loadProfile(username);
  if (!data) notFound();

  const { user, events, opportunities } = data;
  const oppsById = new Map(opportunities.map((o) => [o.id, o]));

  // Global stat ribbon (unfiltered) — open + closed.
  const activeCount = opportunities.filter((o) => isActive(o.status)).length;
  const closedCount = opportunities.filter((o) =>
    CLOSED_STATUSES.includes(normalizeOpportunityStatus(o.status)),
  ).length;
  const interviewingCount = opportunities.filter((o) => {
    if (!isActive(o.status)) return false;
    const next = parsePipelineDate(getNextRoundAt(o));
    return next !== null && next >= todayStartMs();
  }).length;
  const totalCount = activeCount + closedCount;

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

      <Navbar />
      <main className="mx-auto max-w-5xl px-4 sm:px-8 pt-6 sm:pt-12 pb-20">
        {/* Identity */}
        <section className="chunky p-4 md:p-5">
          <div className="flex items-start gap-3 sm:gap-5">
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
              <h1 className="dy-display text-[28px] sm:text-[38px] leading-none">
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
          </div>
          <div className="dy-rule mt-4" />
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 sm:divide-x divide-[color:var(--hairline)]">
            <StatCell label="total" value={totalCount} />
            <StatCell label="active" value={activeCount} />
            <StatCell label="interviewing" value={interviewingCount} />
            <StatCell label="closed" value={closedCount} />
          </div>
        </section>

        {/* Upcoming + filters + pipeline (client island) */}
        <ProfileBoard opportunities={opportunities} />

        {/* Calendar */}
        <details className="mt-8 chunky p-4 md:p-5">
          <summary className="cursor-pointer list-none">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="dy-eyebrow">calendar</p>
                <h2 className="font-heading text-xl font-bold mt-1">Shared calendar</h2>
              </div>
              <span className="dy-mono">{events.length} events</span>
            </div>
          </summary>
          <div className="mt-5">
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
        </details>

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

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="py-2 sm:py-0 sm:px-4 sm:first:pl-0">
      <p className="font-heading text-2xl font-bold leading-none">{value}</p>
      <p className="dy-eyebrow mt-1">{label}</p>
    </div>
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
  return formatCalendarDayDate(todayInTimeZone(), {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
