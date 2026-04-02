import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-background">
      <div className="card-cardboard p-10 max-w-md">
        <div className="text-6xl mb-4">🃏</div>
        <h1 className="font-heading text-3xl text-primary">
          Page Not Found
        </h1>
        <p className="text-muted-foreground font-bold mt-3">
          Looks like this card isn&apos;t in the deck.
        </p>
        <Link
          href="/"
          className="btn-chunky bg-primary text-primary-foreground border-[#cc5529] px-6 py-3 text-base mt-6 shadow-[3px_3px_0px_#cc5529] inline-flex"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
