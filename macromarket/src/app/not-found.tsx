import Link from "next/link";
import { SiteLogo } from "@/components/SiteLogo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-paper px-4 py-4">
        <div className="mx-auto max-w-6xl">
          <SiteLogo />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <div className="price-tag-card max-w-md p-10">
          <div className="font-heading text-6xl font-extrabold text-primary">
            404
          </div>
          <p className="mt-3 font-semibold text-ink">
            That page is off the shelf.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            The food or page you&apos;re looking for isn&apos;t here — but the
            leaderboard is.
          </p>
          <Link
            href="/"
            className="btn-tag mt-6 inline-flex bg-primary px-5 py-2.5 text-primary-foreground"
          >
            Back to the rankings
          </Link>
        </div>
      </main>
    </div>
  );
}
