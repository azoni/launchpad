import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { adminDb } from "@/lib/firebase/admin";
import {
  ACTIVE_STATUSES,
  COLLECTIONS,
  type OpportunityDoc,
  type UserDoc,
} from "@/lib/firebase/collections";
import { StatusPill } from "@/components/pipeline/StatusPill";
import { APP_NAME, APP_URL } from "@/lib/utils";
import { compareOpportunitiesByNext } from "@/lib/pipeline";

export const metadata: Metadata = {
  title: "Explore — public profiles",
  description: "Browse public DayRun profiles. See what people are working on.",
  alternates: { canonical: `${APP_URL}/explore` },
  openGraph: {
    title: "Explore DayRun profiles",
    description: "Browse public profiles. See what people are working on.",
    url: `${APP_URL}/explore`,
    siteName: APP_NAME,
  },
};

type ProfileSummary = {
  username: string;
  displayName: string | null;
  photoURL: string | null;
  lastSyncedAt: number | null;
  activePipeline: number;
  publicPipeline: OpportunityDoc[];
  publicEvents: number;
};

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
      .map((d) => ({ id: d.id, ...d.data() } as OpportunityDoc))
      .sort(compareOpportunitiesByNext);

    // Public event count — single-where, no composite index.
    const eventsSnap = await adminDb
      .collection(COLLECTIONS.events(userDoc.id))
      .where("isPublic", "==", true)
      .count()
      .get();

    summaries.push({
      username: u.username,
      displayName: u.displayName,
      photoURL: u.photoURL,
      lastSyncedAt: u.lastSyncedAt,
      activePipeline: opps.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
      publicPipeline: opps.slice(0, 4),
      publicEvents: eventsSnap.data().count,
    });
  }

  // Sort: profiles with most recent sync first, then by total public activity.
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

  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-10 space-y-8">
        <header className="space-y-2">
          <span className="sticker">🌍 explore</span>
          <h1 className="font-heading text-5xl md:text-6xl font-bold">Public profiles</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            What everyone&apos;s up to. Real interviews, real schedules, real-time. Click in to see
            anyone&apos;s week, their pipeline, and what&apos;s next.
          </p>
        </header>

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
          <section className="grid sm:grid-cols-2 gap-4">
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
      className="block chunky p-5 hover:no-underline tilt-hover"
    >
      <header className="flex items-start gap-3 mb-3">
        {p.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.photoURL}
            alt=""
            width={48}
            height={48}
            className="rounded-xl border-2 border-ink shadow-[3px_3px_0_var(--color-ink)] bg-card"
          />
        ) : (
          <div className="h-12 w-12 rounded-xl border-2 border-ink bg-sun grid place-items-center text-xl font-bold">
            {(p.displayName ?? p.username).slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-heading text-xl font-bold leading-tight">
            {p.displayName ?? `@${p.username}`}
          </p>
          <p className="text-xs font-mono text-muted-foreground">/u/{p.username}</p>
        </div>
      </header>

      <p className="text-sm text-muted-foreground mb-3">
        {p.activePipeline > 0 && `${p.activePipeline} active`}
        {p.activePipeline > 0 && p.publicEvents > 0 && " · "}
        {p.publicEvents > 0 && `${p.publicEvents} public ${p.publicEvents === 1 ? "event" : "events"}`}
        {!p.activePipeline && !p.publicEvents && "—"}
      </p>

      {p.publicPipeline.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {p.publicPipeline.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 text-[0.7rem] font-bold px-2 py-0.5 rounded-full border-2 border-ink bg-card"
            >
              {o.company}
              <StatusPill status={o.status} size="sm" />
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
