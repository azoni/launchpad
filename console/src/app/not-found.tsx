import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-grid">
      <div className="card-glow p-10 max-w-md">
        <p className="font-mono text-6xl text-neon/30 mb-4">404</p>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Page Not Found
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          This route doesn&apos;t exist in the build.
        </p>
        <Link href="/" className="btn-neon">
          <ArrowLeft className="w-4 h-4" />
          Back to Launchpad
        </Link>
      </div>
    </div>
  );
}
