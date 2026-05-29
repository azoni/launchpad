import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  isActive,
  normalizeOpportunityStatus,
  type OpportunityDoc,
  type OpportunityStatus,
  type UserDoc,
} from "@/lib/firebase/collections";
import { StatusPill } from "@/components/pipeline/StatusPill";
import { RoundProgressDots } from "@/components/pipeline/RoundProgressDots";
import { APP_NAME, APP_URL } from "@/lib/utils";
import {
  compareOpportunitiesByNext,
  formatPipelineDate,
  getCurrentRound,
  getFirstRoundAt,
  getLastRoundAt,
  getNextRoundAt,
  isClosedOpportunity,
  nextStepLabel,
  roundTitleWithNumber,
  visibleRounds,
} from "@/lib/pipeline";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Explore - public profiles",
  description: "Browse public DayRun profiles. See what people are working on.",
  alternates: { canonical: `${APP_URL}/explore` },
  openGraph: {
    title: "Explore DayRun profiles",
    description: "Browse public profiles. See what people are working on.",
    url: `${APP_URL}/explore`,
    siteName: APP_NAME,
  },
};

type PipelinePreview = OpportunityDoc & {
  username: string;
  displayName: string | null;
  photoURL: string | null;
};

type ProfileSummary = {
  username: string;
  displayName: string | null;
  photoURL: string | null;
  lastSyncedAt: number | null;
  activePipeline: number;
  closedPipeline: number;
  publicPipeline: OpportunityDoc[];
  publicPipelineCount: number;
};

function opportunityFromDoc(id: string, data: Record<string, unknown>): OpportunityDoc {
  return {
    id,
    ...(data as Omit<OpportunityDoc, "id">),
    status: normalizeOpportunityStatus(data.status),
  };
}

async function loadPublicProfiles(): Promise<ProfileSummary[]> {
  const usersSnap = await adminDb
    .collection(COLLECTIONS.users)
    .where("publicProfile", "==", true)
    .limit(100)
    .get();

  const summaries: ProfileSummary[] = [];

  for (const userDoc of usersSnap.docs) {
    const u = userDoc.data() as UserDoc;
    if (!u.username) continue;

    const oppsSnap = await adminDb
      .collection(COLLECTIONS.opportunities(userDoc.id))
      .where("isPublic", "==", true)
      .get();
    const opps = oppsSnap.docs
      .map((d) => opportunityFromDoc(d.id, d.data()))
      .sort(compareOpportunitiesByNext);
    summaries.push({
      username: u.username,
      displayName: u.displayName,
      photoURL: u.photoURL,
      lastSyncedAt: u.lastSyncedAt,
      activePipeline: opps.filter((o) => isActive(o.status)).length,
      closedPipeline: opps.filter((o) => isClosedOpportunity(o)).length,
      publicPipeline: opps.slice(0, 6),
      publicPipelineCount: opps.length,
    });
  }

  summaries.sort((a, b) => {
    const ax = (a.lastSyncedAt ?? 0) + a.activePipeline * 86400_000;
    const bx = (b.lastSyncedAt ?? 0) + b.activePipeline * 86400_000;
    return bx - ax;
  });
  return summaries;
}

export default async function ExplorePage() {
  const profiles = await loadPublicProfiles();
  const withActivity = profiles.filter((p) => p.publicPipeline.length > 0);
  const empty = profiles.filter((p) => p.publicPipeline.length === 0);
  const upcoming: PipelinePreview[] = profiles
    .flatMap((p) =>
      p.publicPipeline.map((opp) => ({
        ...opp,
        username: p.username,
        displayName: p.displayName,
        photoURL: p.photoURL,
      })),
    )
    .filter((opp) => {
      const next = getNextRoundAt(opp);
      return next ? Date.parse(next) >= new Date().setHours(0, 0, 0, 0) : false;
    })
    .sort(compareOpportunitiesByNext)
    .slice(0, 8);
  const totalActive = profiles.reduce((sum, p) => sum + p.activePipeline, 0);
  const totalClosed = profiles.reduce((sum, p) => sum + p.closedPipeline, 0);
  const totalPipeline = profiles.reduce((sum, p) => sum + p.publicPipelineCount, 0);

  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-6 md:py-10 space-y-6 md:space-y-8">
        <header className="chunky p-4 md:p-6">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-5 items-end">
            <div className="space-y-2 md:space-y-3">
              <span className="sticker">explore</span>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold">Interview pipelines</h1>
              <p className="text-muted-foreground text-sm md:text-lg max-w-2xl">
                Browse public interview pipelines, upcoming rounds, and recently closed processes.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="profiles" value={withActivity.length} />
              <Stat label="open" value={totalActive} />
              <Stat label="closed" value={totalClosed} />
            </div>
          </div>
          <p className="mt-4 text-xs font-mono text-muted-foreground">
            {totalPipeline} public pipeline items shown from live profile data.
          </p>
        </header>

        {upcoming.length > 0 && (
          <section className="chunky p-4 md:p-5 space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="dy-eyebrow">what&apos;s next</p>
                <h2 className="font-heading text-2xl font-bold mt-1">Upcoming pipeline rounds</h2>
              </div>
              <span className="dy-mono">{upcoming.length} shown</span>
            </div>
            <ol className="divide-y divide-hairline">
              {upcoming.map((opp) => (
                <li key={`${opp.username}_${opp.id}`}>
                  <Link
                    href={`/u/${opp.username}`}
                    className="grid md:grid-cols-[120px_minmax(0,1fr)_190px] gap-3 py-3 hover:no-underline group"
                  >
                    <div>
                      <p className="font-semibold text-ink">{formatPipelineDate(getNextRoundAt(opp))}</p>
                      <p className="text-xs text-muted-foreground">{roundTitleWithNumber(getCurrentRound(opp)) ?? "Next round"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink leading-snug group-hover:text-primary">
                        {opp.company}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {opp.role}{opp.locationType ? ` - ${opp.locationType}` : ""}
                      </p>
                    </div>
                    <div className="flex sm:justify-end items-start gap-2 min-w-0">
                      <span
                        className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: statusAccent(opp.status) }}
                      />
                      <div className="min-w-0 sm:text-right">
                        <p className="text-sm font-semibold truncate">
                          {opp.displayName ?? `@${opp.username}`}
                        </p>
                        <div className="mt-1 flex sm:justify-end">
                          <RoundProgressDots opp={opp} compact />
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}

        {withActivity.length === 0 ? (
          <div className="chunky p-8 text-center space-y-2">
            <p className="font-heading text-2xl">No public profiles with activity yet.</p>
            <p className="text-muted-foreground">
              Be the first.{" "}
              <Link href="/app" className="underline font-semibold">
                Sign in
              </Link>{" "}
              and toggle a pipeline item public.
            </p>
          </div>
        ) : (
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="dy-eyebrow">people</p>
                <h2 className="font-heading text-2xl font-bold mt-1">Active public profiles</h2>
              </div>
              <span className="dy-mono">{withActivity.length} profiles</span>
            </div>
            <div className="grid lg:grid-cols-2 gap-3">
              {withActivity.map((p) => (
                <ProfileCard key={p.username} p={p} />
              ))}
            </div>
          </section>
        )}

        {empty.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer font-semibold text-muted-foreground">
              {empty.length} {empty.length === 1 ? "profile" : "profiles"} with no public activity yet
            </summary>
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {empty.map((p) => (
                <Link
                  key={p.username}
                  href={`/u/${p.username}`}
                  className="block chunky p-3 hover:no-underline opacity-70"
                >
                  <p className="font-heading font-bold">
                    {p.displayName ?? `@${p.username}`}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">
                    /u/{p.username}
                  </p>
                </Link>
              ))}
            </div>
          </details>
        )}
      </main>
      <Footer />
    </>
  );
}

function ProfileCard({ p }: { p: ProfileSummary }) {
  return (
    <Link
      href={`/u/${p.username}`}
      className="block chunky p-4 md:p-5 hover:no-underline tilt-hover"
    >
      <div className="space-y-4">
        <header className="flex items-start gap-3">
          {p.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.photoURL}
              alt=""
              width={52}
              height={52}
              className="rounded-xl border border-hairline-strong bg-card"
            />
          ) : (
            <div className="h-[52px] w-[52px] rounded-xl border border-hairline-strong bg-positive-soft grid place-items-center text-xl font-bold">
              {(p.displayName ?? p.username).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-heading text-xl font-bold leading-tight">
              {p.displayName ?? `@${p.username}`}
            </p>
            <p className="text-xs font-mono text-muted-foreground">/u/{p.username}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="dy-pill dy-pill-ink">
                {p.activePipeline} open
              </span>
              <span className="dy-pill dy-pill-outline">
                {p.publicPipelineCount} public pipeline
              </span>
              <span className="dy-pill dy-pill-negative">
                {p.closedPipeline} closed
              </span>
              {p.lastSyncedAt && (
                <span className="dy-pill dy-pill-outline">
                  synced {humanRelative(p.lastSyncedAt)}
                </span>
              )}
            </div>
          </div>
        </header>

        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="dy-eyebrow">pipeline</p>
            {p.publicPipelineCount > p.publicPipeline.length && (
              <span className="text-xs text-muted-foreground">
                +{p.publicPipelineCount - p.publicPipeline.length} more
              </span>
            )}
          </div>
          {p.publicPipeline.length > 0 ? (
            <div className="space-y-2">
              {p.publicPipeline.map((o) => (
                <OpportunityPreview key={o.id} opp={o} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No public pipeline items.</p>
          )}
        </section>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface px-3 py-3">
      <p className="font-heading text-2xl font-bold leading-none">{value}</p>
      <p className="dy-eyebrow mt-2">{label}</p>
    </div>
  );
}

function OpportunityPreview({ opp }: { opp: OpportunityDoc }) {
  const next = getNextRoundAt(opp);
  const first = getFirstRoundAt(opp);
  const last = getLastRoundAt(opp);
  const currentRound = getCurrentRound(opp);
  const nextLabel = roundTitleWithNumber(currentRound) ?? nextStepLabel(opp);
  const closed = isClosedOpportunity(opp);
  const rounds = visibleRounds(opp);
  return (
    <div
      className="rounded-lg border border-hairline bg-surface px-3 py-2 border-l-[4px]"
      style={{ borderLeftColor: statusAccent(opp.status) }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-snug truncate">{opp.company}</p>
          <p className="text-xs text-muted-foreground truncate">{opp.role}</p>
        </div>
        <StatusPill status={opp.status} size="sm" />
      </div>
      <div className="mt-2">
        <RoundProgressDots opp={opp} compact />
      </div>
      {(next || nextLabel) && (
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {closed ? "Closed" : nextLabel ?? "Waiting on response"} -{" "}
          {formatPipelineDate(closed ? last : next, closed ? "final date TBD" : "date TBD")}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground mt-1 truncate">
        {rounds.length} rounds · first {formatPipelineDate(first, "not set")}
        {opp.locationType ? ` · ${opp.locationType}` : ""}
      </p>
    </div>
  );
}

function statusAccent(status: OpportunityStatus | null | undefined): string {
  if (!status) return "var(--muted-foreground)";
  switch (normalizeOpportunityStatus(status)) {
    case "offer":
    case "accepted":
    case "awaiting":
    case "onsite":
    case "screen":
    case "applied":
    case "referral":
    case "ongoing":
      return "var(--positive)";
    case "rejected":
      return "var(--negative)";
    case "withdrew":
    case "ghosted":
      return "var(--hairline-strong)";
    default:
      return "var(--muted-foreground)";
  }
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
