import Link from "next/link";
import { SiteLogo } from "@/components/SiteLogo";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center bg-bg">
      <SiteLogo />
      <div className="font-display text-7xl tracking-widest3 text-white">404</div>
      <div className="text-[11px] tracking-widest2 text-fire uppercase">// CHANNEL OFFLINE</div>
      <p className="text-muted text-sm max-w-sm leading-relaxed">
        That page isn&apos;t on our panel. Head back to the home page and pick up from there.
      </p>
      <Link
        href="/"
        className="bg-fire hover:bg-fire3 text-white px-5 py-3 rounded text-[11px] tracking-widest2 uppercase"
      >
        ← Back to base
      </Link>
    </main>
  );
}
