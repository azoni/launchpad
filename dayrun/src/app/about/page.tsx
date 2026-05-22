import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { APP_NAME, APP_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: `About ${APP_NAME}`,
  description: `${APP_NAME} is a public, toggleable calendar profile. Read why we built it.`,
  alternates: { canonical: `${APP_URL}/about` },
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-12 space-y-6">
        <h1 className="font-heading text-5xl font-bold">About {APP_NAME}</h1>
        <p className="text-lg text-muted-foreground">
          We built {APP_NAME} because the maker was running 4+ interviews a day, three side
          projects, and a social life that needed a shared brain. There&apos;s no good way to say
          &ldquo;here&apos;s where I&apos;ll be&rdquo; without copy-pasting a calendar dump into Slack.
        </p>
        <p>
          The shape is simple: sign in with Google, sync your calendar, and decide event-by-event
          what to share. Your public profile lives at <span className="font-mono">/u/your-name</span>
          {" "}— a real URL you can drop in a bio.
        </p>
        <p>
          Read-only Google Calendar access. Nothing is public unless you flip the toggle. Built as
          part of the <Link className="underline" href="https://azoni.ai">azoni.ai launchpad</Link>{" "}
          portfolio.
        </p>
        <Link href="/" className="btn-chunky">
          ← Back home
        </Link>
      </main>
      <Footer />
    </>
  );
}
