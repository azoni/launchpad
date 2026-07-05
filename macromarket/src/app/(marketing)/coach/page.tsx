import type { Metadata } from "next";
import { CoachChat } from "@/components/CoachChat";
import { APP_URL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AI Protein Coach",
  description:
    "Chat with the MacroMarket protein coach — get the cheapest foods to hit your protein goal, grounded in real cost-per-gram data.",
  alternates: { canonical: `${APP_URL}/coach` },
};

export default function CoachPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink">
        AI protein coach
      </h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">
        Ask for the best protein for any situation — snacks for backpacking,
        office-friendly bites with no fridge, post-workout recovery, budget
        bulking, road-trip fuel — and get real product picks with prices and buy
        links, ranked by value.
      </p>
      <div className="mt-6">
        <CoachChat />
      </div>
    </div>
  );
}
