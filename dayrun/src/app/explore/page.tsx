import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { adminDb } from "@/lib/firebase/admin";
import {
  ACTIVE_STATUSES,
  COLLECTIONS,
  type EventDoc,
  type OpportunityDoc,
  type OpportunityStatus,
  type UserDoc,
} from "@/lib/firebase/collections";
import { StatusPill } from "@/components/pipeline/StatusPill";
import { APP_NAME, APP_URL } from "@/lib/utils";
import {
  compareOpportunitiesByNext,
  formatPipelineDate,
  getNextRoundAt,
  nextStepLabel,
} from "@/lib/pipeline";

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

type EventPreview = {
  id: string;
  summary: string;
  start: string;
  allDay: boolean;
  location: string | null;
  opportunityCompany: string | null;
  opportunityStatus: OpportunityStatus | null;
};

type ProfileSummary = {
  username: string;
  displayName: string | null;
  photoURL: string | null;
  lastSyncedAt: number | null;
  activePipeline: number;
  publicPipeline: OpportunityDoc[];
  publicPipelineCount: number;
  publicEvents: number;
  upcomingEvents: EventPreview[];
};

async function loadPublicProfiles(): Promise<ProfileSummary[]> {
  const usersSnap = await adminDb
    .collection(COLLECTIONS.users)
    .where("publicProfile", "==", true)
    .limit(100)
    .get();

  const summaries: ProfileSummary[] = [];
  const eventFloor = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  for (const userDoc of usersSnap.docs) {
    const u = userDoc.data() as UserDoc;
    if (!u.username) continue;

    const oppsSnap = await adminDb
      .collection(COLLECTIONS.opportunities(userDoc.id))
      .where("isPublic", "==", true)
      .get();
    const opps = oppsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as OpportunityDoc))
      .sort(compareOpportunitiesByNext);
    const oppsById = new Map(opps.map((o) => [o.id, o]));

    const eventsSnap = await adminDb
      .collection(COLLECTIONS.events(userDoc.id))
      .where("isPublic", "==", true)
      .count()
      .get();

    const upcomingSnap = await adminDb
      .collection(COLLECTIONS.events(userDoc.id))
      .where("isPublic", "==", true)
      .where("start", ">=", eventFloor)
      .orderBy("start", "asc")
      .limit(4)
      .get();
    const upcomingEvents = upcomingSnap.docs.map((d) => {
      const event = d.data() as EventDoc;
      const opp = event.opportunityId ? oppsById.get(event.opportunityId) : null;
      return {
        id: event.googleEventId,
        summary: event.summary,
        start: event.start,
        allDay: event.allDay,
        location: event.location,
        opportunityCompany: opp?.company ?? null,
        opportunityStatus: opp?.status ?? null,
      };
    });

    summaries.push({
      username: u.username,
      displayName: u.displayName,
      photoURL: u.photoURL,
      lastSyncedAt: u.lastSyncedAt,
      activePipeline: opps.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
      publicPipeline: opps.slice(0, 5),
      publicPipelineCount: opps.length,
      publicEvents: eventsSnap.data().count,
      upcomingEvents,
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
  const withActivity = profiles.filter((p) => p.publicEvents > 0 || p.publicPipeline.length > 0);
  const empty = profiles.filter((p) => p.publicEvents === 0 && p.publicPipeline.length === 0);
  const upcoming = profiles
    .flatMap((p) =>
      p.upcomingEvents.map((event) => ({
        ...event,
        username: p.username,
        displayName: p.displayName,
      })),
    )
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 10);

  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-10 space-y-8">
        <header className="space-y-3">
          <span className="sticker">explore</span>
          <h1 className="font-heading text-5xl md:text-6xl font-bold">Public profiles</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            What everyone&apos;s up to. Real interviews, real schedules, real-time. Click in to see
            anyone&apos;s week, their pipeline, and what&apos;s next.
          </p>
        </header>

        {upcoming.length > 0 && (
          <section className="chunky p-4 md:p-5 space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="dy-eyebrow">what&apos;s next</p>
                <h2 className="font-heading text-2xl font-bold mt-1">Upcoming public events</h2>
              </div>
              <span className="dy-mono">{upcoming.length} shown</span>
            </div>
            <ol className="divide-y divide-hairline">
              {upcoming.map((event) => (
                <li key={`${event.username}_${event.id}`}>
                  <Link
                    href={`/u/${event.username}`}
                    className="grid sm:grid-cols-[96px_minmax(0,1fr)_180px] gap-3 py-3 hover:no-underline group"
                  >
                    <div>
                      <p className="font-semibold text-ink">{formatEventDay(event.start)}</p>
                      <p className="text-xs text-muted-foreground">{formatEventTime(event)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink leading-snug group-hover:text-primary">
                        {event.summary}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {event.location ?? "No location shared"}
                      </p>
                    </div>
                    <div className="flex sm:justify-end items-start gap-2 min-w-0">
                      <span
                        className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: statusAccent(event.opportunityStatus) }}
                      />
                      <div className="min-w-0 sm:text-right">
                        <p className="text-sm font-semibold truncate">
                          {event.displayName ?? `@${event.username}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {event.opportunityCompany ?? `/u/${event.username}`}
                        </p>
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
            {withActivity.map((p) => (
              <ProfileCard key={p.username} p={p} />
            ))}
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
      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)_minmax(0,1fr)] gap-4">
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
              <span className="dy-pill dy-pill-ink">{p.activePipeline} active</span>
              <span className="dy-pill dy-pill-neutral">
                {p.publicEvents} {p.publicEvents === 1 ? "event" : "events"}
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

        <section className="space-y-2">
          <p className="dy-eyebrow">events</p>
          {p.upcomingEvents.length > 0 ? (
            <div className="space-y-2">
              {p.upcomingEvents.slice(0, 3).map((event) => (
                <EventPreviewRow key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {p.publicEvents > 0 ? "No upcoming public events." : "No public events yet."}
            </p>
          )}
        </section>
      </div>
    </Link>
  );
}

function OpportunityPreview({ opp }: { opp: OpportunityDoc }) {
  const next = getNextRoundAt(opp);
  const nextLabel = nextStepLabel(opp);
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
      {(next || nextLabel) && (
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {nextLabel ?? "Next round"} - {formatPipelineDate(next, "date TBD")}
        </p>
      )}
    </div>
  );
}

function EventPreviewRow({ event }: { event: EventPreview }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2">
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 h-2 w-2 rounded-full shrink-0"
          style={{ background: statusAccent(event.opportunityStatus) }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug truncate">{event.summary}</p>
          <p className="text-xs text-muted-foreground">
            {formatEventDay(event.start)} - {formatEventTime(event)}
          </p>
        </div>
      </div>
    </div>
  );
}

function statusAccent(status: OpportunityStatus | null | undefined): string {
  switch (status) {
    case "offer":
    case "accepted":
      return "var(--positive)";
    case "rejected":
      return "var(--negative)";
    case "onsite":
      return "var(--ink)";
    case "screen":
      return "var(--primary)";
    case "applied":
      return "var(--faded)";
    case "referral":
      return "var(--positive)";
    case "withdrew":
    case "ghosted":
      return "var(--hairline-strong)";
    default:
      return "var(--muted-foreground)";
  }
}

function formatEventDay(value: string) {
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatEventTime(event: Pick<EventPreview, "start" | "allDay">) {
  if (event.allDay) return "all day";
  return new Date(event.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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
