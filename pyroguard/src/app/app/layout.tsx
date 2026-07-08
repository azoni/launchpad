import { DemoGate } from "@/components/DemoGate";
import { Shell } from "@/components/Shell";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoGate>
      <Shell>{children}</Shell>
    </DemoGate>
  );
}
