import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto max-w-2xl w-full px-4 py-16 text-center space-y-6">
        <div className="text-7xl">📅</div>
        <h1 className="font-heading text-5xl font-bold">No such day.</h1>
        <p className="text-muted-foreground text-lg">
          That URL didn&apos;t map to a profile or a page. The profile owner may have toggled their
          public profile off — or the URL has a typo.
        </p>
        <Link href="/" className="btn-chunky">
          Take me home →
        </Link>
      </main>
      <Footer />
    </>
  );
}
