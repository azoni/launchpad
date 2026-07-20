import type { Metadata } from "next";
import { TechArchitecture } from "@/components/tech/TechArchitecture";

export const metadata: Metadata = {
  title: "Architecture",
  description: "How PyroGuard is built — the offline-first field app, the zero-loss sync engine, the relational core, the AI layer, and the integrations.",
  robots: { index: false, follow: false },
};

export default function TechPage() {
  return <TechArchitecture />;
}
