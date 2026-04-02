import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-background">
      <div className="bg-card rounded-lg shadow-lg p-10 max-w-md border-l-4 border-l-teal">
        <div
          className="w-10 h-10 bg-teal rotate-45 rounded-sm mx-auto mb-6"
          aria-hidden="true"
        />
        <h1 className="font-heading text-3xl text-foreground uppercase tracking-wide">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mt-3">
          Looks like this page has been washed away.
        </p>
        <Link href="/" className="btn-primary mt-6">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
