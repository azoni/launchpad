import type { Metadata } from "next";
import { UnsubscribeForm } from "./UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-heading text-2xl font-bold text-ink">
        Unsubscribe from the deals digest
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email and we&apos;ll stop sending the weekly protein deals
        email. No hard feelings.
      </p>
      <div className="mt-5">
        <UnsubscribeForm />
      </div>
    </div>
  );
}
