import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  isActive,
  normalizeOpportunityStatus,
  type Compensation,
  type EventDoc,
  type OpportunityDoc,
  type OpportunityStatus,
  type UserDoc,
} from "@/lib/firebase/collections";
import { PublicTimeline } from "@/components/PublicTimeline";
import { StatusPill } from "@/components/pipeline/StatusPill";
import { RoundProgressDots } from "@/components/pipeline/RoundProgressDots";
import { APP_NAME, APP_URL } from "@/lib/utils";
import {
  compareOpportunitiesByNext,
  compactRoundNumberLabel,
  formatPipelineDate,
  formatPipelineDateLong,
  getCurrentRound,
  getFirstRoundAt,
  getLastRoundAt,
  getNextRoundAt,
  getPlannedRoundCount,
  isClosedOpportunity,
  nextStepLabel,
  visibleRounds,
} from "@/lib/pipeline";
import { formatCalendarDayDate, todayInTimeZone } from "@/lib/calendar-time";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = { params: Promise<{ username: string }> };
type PublicOpportunity = OpportunityDoc & {
  publicCompensation?: Compensation | null;
};

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
        const compensation = privateSnap.exists
          ? ((privateSnap.data()?.compensation ?? null) as Compensation | null)
          : null;
        return { ...opp, publicCompensation: compensation };
      }),
    )
  )
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

const NEGATIVE_CLOSED: OpportunityStatus[] = ["rejected", "withdrew", "ghosted"];

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const data = await loadProfile(username);
  if (!data) notFound();

  const { user, events, opportunities } = data;
  const oppsById = new Map(opportunities.map((o) => [o.id, o]));
  const sortedOpps = [...opportunities].sort(compareOpportunitiesByNext);

  const nowOpps = sortedOpps.filter((o) => isActive(o.status));
  const accepted = sortedOpps.filter((o) => o.status === "accepted");
  const closed = sortedOpps.filter((o) => NEGATIVE_CLOSED.includes(o.status));
  const nextDated = nowOpps.filter((o) => !!getNextRoundAt(o)).length;

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
          <div className="grid grid-cols-3 gap-2 mt-4 sm:mt-5">
            <ProfileStat label="open" value={nowOpps.length} />
            <ProfileStat label="scheduled" value={nextDated} />
            <ProfileStat label="closed" value={accepted.length + closed.length} />
          </div>
        </section>

        {/* Pipeline */}
        {sortedOpps.length > 0 && (
          <section className="mt-8">
            <SectionHeader title="Open pipeline" count={nowOpps.length} />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {nowOpps.map((o) => <OppCard key={o.id} opp={o} />)}
            </div>
          </section>
        )}

        {(accepted.length > 0 || closed.length > 0) && (
          <section className="mt-8">
            <SectionHeader title="Closed outcomes" count={accepted.length + closed.length} />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {accepted.map((o) => <OppCard key={o.id} opp={o} tone="positive" />)}
              {closed.map((o) => <OppCard key={o.id} opp={o} tone="negative" muted />)}
            </div>
          </section>
        )}

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

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--surface)] px-3 py-2">
      <p className="font-heading text-xl font-bold leading-none">{value}</p>
      <p className="dy-eyebrow mt-1">{label}</p>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface)] px-2.5 py-1 text-[12px] text-[color:var(--ink-soft)]">
      <span className="dy-eyebrow mr-1">{label}</span>
      <span className="font-medium text-[color:var(--ink)]">{value}</span>
    </span>
  );
}

function OppCard({
  opp,
  muted,
  tone,
}: {
  opp: PublicOpportunity;
  muted?: boolean;
  tone?: "positive" | "negative";
}) {
  const isStruck = NEGATIVE_CLOSED.includes(opp.status);
  const isClosed = isClosedOpportunity(opp);
  const firstRoundAt = getFirstRoundAt(opp);
  const nextRoundAt = getNextRoundAt(opp);
  const lastRoundAt = getLastRoundAt(opp);
  const currentRound = getCurrentRound(opp);
  const nextLabel = nextStepLabel(opp);
  const focusDate = isClosed ? lastRoundAt : nextRoundAt;
  const waiting = !isClosed && !nextRoundAt;
  const displayStatus = waiting ? "awaiting" : opp.status;
  const plannedRoundCount = getPlannedRoundCount(opp);
  const rounds = visibleRounds(opp, 5);
  const comp = opp.publicCompensation;
  const hasComp = !!(comp?.base || comp?.equity || comp?.other);
  const topBorderColor =
    tone === "positive" || opp.status === "accepted"
      ? "var(--positive)"
      : tone === "negative" || opp.status === "rejected"
        ? "var(--negative)"
        : opp.status === "withdrew" || opp.status === "ghosted"
          ? "var(--hairline-strong)"
          : "var(--positive)";
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
          <StatusPill status={displayStatus} />
      </header>

      <div className="mb-3 flex items-center gap-2 text-[12px] text-[color:var(--faded)]">
        <RoundProgressDots opp={opp} />
        <span>{plannedRoundCount} round process</span>
      </div>

      {hasComp && (
        <div className="mb-3 flex flex-wrap gap-2">
          {comp?.base && <InfoChip label="base" value={comp.base} />}
          {comp?.equity && <InfoChip label="equity" value={comp.equity} />}
          {comp?.other && <InfoChip label="other" value={comp.other} />}
        </div>
      )}

      {(firstRoundAt || nextRoundAt || nextLabel || rounds.length > 0) && (
        <div className="mt-4 space-y-2">
          <div
            className="rounded-md border border-[color:var(--hairline)] bg-[color:var(--surface)] px-3 py-2"
            style={{ boxShadow: isClosed ? undefined : "inset 2px 0 0 0 var(--primary)" }}
          >
            <p className="dy-eyebrow">{isClosed ? "closed with" : waiting ? "waiting" : "focus next"}</p>
            <p className="text-[13px] font-medium text-[color:var(--ink)] mt-1">
              {nextLabel ?? (isClosed ? "Process closed" : "Waiting on response")}
            </p>
            <p className="text-[12px] text-[color:var(--faded)] mt-0.5">
              {formatPipelineDateLong(focusDate, isClosed ? "no final date" : "no date")}
              {!isClosed && currentRound?.outcome ? ` - ${currentRound.outcome}` : ""}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md border border-[color:var(--hairline)] bg-[color:var(--surface)] px-3 py-2">
              <p className="dy-eyebrow">first</p>
              <p className="text-[13px] text-[color:var(--ink)] mt-1">
                {formatPipelineDate(firstRoundAt, "not set")}
              </p>
            </div>
            <div className="rounded-md border border-[color:var(--hairline)] bg-[color:var(--surface)] px-3 py-2">
              <p className="dy-eyebrow">{isClosed ? "last" : "rounds"}</p>
              <p className="text-[13px] text-[color:var(--ink)] mt-1">
                {isClosed ? formatPipelineDate(lastRoundAt, "not set") : rounds.length}
              </p>
            </div>
          </div>
        </div>
      )}

      {rounds.length > 0 && (
        <ol className="mt-4 space-y-2">
          {rounds.map((round, index) => (
            <li key={round.id} className="flex items-start gap-2 text-[13px]">
              <span
                className="mt-[7px] h-1.5 w-1.5 rounded-full shrink-0"
                style={{
                  background:
                    round.outcome === "passed"
                      ? "var(--positive)"
                      : round.outcome === "did-not-pass" || round.outcome === "cancelled"
                        ? "var(--faded)"
                        : "var(--primary)",
                }}
              />
              <div className="min-w-0">
                <p className="text-[color:var(--ink)] leading-snug">
                  <span className="text-[color:var(--faded)]">
                    {compactRoundNumberLabel(round, index + 1)} -{" "}
                    {formatPipelineDate(round.scheduledAt, "TBD")}
                  </span>{" "}
                  {round.title}
                  <span className="text-[color:var(--faded)]"> · {round.outcome}</span>
                </p>
                {round.publicNote && (
                  <p className="text-[color:var(--ink-soft)] leading-snug mt-0.5">
                    {round.publicNote}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
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
  return formatCalendarDayDate(todayInTimeZone(), {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
