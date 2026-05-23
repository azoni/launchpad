import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import {
  COLLECTIONS,
  type EventDoc,
  type OpportunityDoc,
  type UserDoc,
} from "@/lib/firebase/collections";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TimelineView } from "@/components/TimelineView";
import { StatusPill } from "@/components/pipeline/StatusPill";
import { ExternalLink } from "lucide-react";
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
  const horizonBack = new Date(now - 30 * 86400_000).toISOString();
  const eventsSnap = await adminDb
    .collection(COLLECTIONS.events(uid))
    .where("isPublic", "==", true)
    .where("start", ">=", horizonBack)
    .orderBy("start", "asc")
    .limit(200)
    .get();
  const events = eventsSnap.docs.map((d) => d.data() as EventDoc);

  // Single-where query — no composite index required. Sort client-side.
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
  const description = `Public schedule for ${data.user.displayName ?? `@${username}`}. ${data.events.length} upcoming public event${data.events.length === 1 ? "" : "s"}.`;
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
  const oppsById = new Map(
    opportunities.map((o) => [o.id, { id: o.id, company: o.company, role: o.role }]),
  );
  const activeOpps = opportunities.filter((o) =>
    ["referral", "applied", "screen", "onsite", "offer"].includes(o.status),
  );
  const closedOpps = opportunities.filter((o) =>
    ["accepted", "rejected", "withdrew", "ghosted"].includes(o.status),
  );

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

  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-8 space-y-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <section className="flex items-center gap-4 flex-wrap">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={`${user.displayName ?? username} avatar`}
              width={84}
              height={84}
              className="rounded-2xl border-2 border-ink shadow-[4px_4px_0_var(--color-ink)] bg-card"
            />
          ) : (
            <div className="h-[84px] w-[84px] rounded-2xl border-2 border-ink bg-sun grid place-items-center text-3xl font-bold">
              {(user.displayName ?? username).slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold">
              {user.displayName ?? `@${username}`}
            </h1>
            <p className="text-muted-foreground font-mono">@{username}</p>
          </div>
        </section>

        {opportunities.length > 0 && (
          <section>
            <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
              What I&apos;m working on
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {activeOpps.length} active · {closedOpps.length} closed
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {activeOpps.map((o) => (
                <PublicOpportunityCard key={o.id} opp={o} />
              ))}
            </div>
            {closedOpps.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-muted-foreground hover:text-ink">
                  Show {closedOpps.length} closed
                </summary>
                <div className="grid sm:grid-cols-2 gap-3 mt-3 opacity-80">
                  {closedOpps.map((o) => (
                    <PublicOpportunityCard key={o.id} opp={o} />
                  ))}
                </div>
              </details>
            )}
          </section>
        )}

        <section>
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            Calendar
          </h2>
          <TimelineView
            events={events}
            opportunitiesById={oppsById}
            emptyState={
              <div>
                <p className="font-heading text-xl">Nothing public right now.</p>
                <p className="text-muted-foreground">
                  {user.displayName ?? `@${username}`} hasn&apos;t shared any events publicly yet. Check back later.
                </p>
              </div>
            }
          />
        </section>

        <section className="chunky chunky-grape p-5">
          <p className="font-heading text-xl mb-1">Like this?</p>
          <p className="text-sm text-muted-foreground mb-3">
            Make your own public week in 30 seconds.
          </p>
          <Link href="/" className="btn-chunky btn-sun">
            Try {APP_NAME} →
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

function PublicOpportunityCard({ opp }: { opp: OpportunityDoc }) {
  return (
    <div className="chunky p-4">
      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
        <div className="min-w-0">
          <p className="font-heading text-lg font-bold">{opp.company}</p>
          <p className="text-sm text-muted-foreground">{opp.role}</p>
        </div>
        <StatusPill status={opp.status} />
      </div>
      {opp.nextStep && (
        <p className="text-sm mt-1">
          <span className="text-muted-foreground">Next:</span>{" "}
          <span className="font-semibold">{opp.nextStep}</span>
          {opp.nextStepBy && <span className="text-muted-foreground"> · {opp.nextStepBy}</span>}
        </p>
      )}
      {opp.source && (
        <p className="text-xs text-muted-foreground mt-1.5">via {opp.source}</p>
      )}
      {opp.link && (
        <p className="text-xs mt-1">
          <a
            href={opp.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-ink"
          >
            <ExternalLink size={11} /> posting
          </a>
        </p>
      )}
    </div>
  );
}
