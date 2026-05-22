import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS, type EventDoc, type UserDoc } from "@/lib/firebase/collections";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TimelineView } from "@/components/TimelineView";
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

  return { user, events };
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

  const { user, events } = data;

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

        <section>
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4">
            What&apos;s public this week
          </h2>
          <TimelineView
            events={events}
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
