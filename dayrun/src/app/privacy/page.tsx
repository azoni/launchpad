import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { APP_NAME, APP_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: `Privacy — ${APP_NAME}`,
  description: `What ${APP_NAME} does with your data.`,
  alternates: { canonical: `${APP_URL}/privacy` },
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-12 space-y-6 prose-sm">
        <h1 className="font-heading text-5xl font-bold">Privacy</h1>

        <h2 className="font-heading text-2xl font-bold pt-2">What we store</h2>
        <p>
          When you sign in with Google we store your email, display name, and profile photo (from
          your Google account) in our Firestore database. We use these to render your dashboard and
          public profile.
        </p>
        <p>
          When you sync your calendar we store the events we read (title, time, location,
          description) so we can render them. Every event is <strong>private by default</strong>.
        </p>

        <h2 className="font-heading text-2xl font-bold pt-2">Google access</h2>
        <p>
          We request the <span className="font-mono">calendar.readonly</span> scope. This means we
          can only read your calendar — we can&apos;t add, edit, or delete events. The access token is
          used in-memory during a sync request and is not stored on our servers.
        </p>

        <h2 className="font-heading text-2xl font-bold pt-2">What is public</h2>
        <p>
          Your username, display name, profile photo, and any events you toggle public are visible
          to anyone with the URL to your profile page. Everything else stays private.
        </p>

        <h2 className="font-heading text-2xl font-bold pt-2">Deletion</h2>
        <p>
          To delete your account email{" "}
          <a href="mailto:charltonuw@gmail.com" className="underline">
            charltonuw@gmail.com
          </a>
          {" "}with the subject &ldquo;Delete my DayRun account.&rdquo; We&apos;ll purge your user document and
          all synced events.
        </p>
      </main>
      <Footer />
    </>
  );
}
