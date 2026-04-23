import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REGULATIONS, DISCLAIMER } from "@/lib/regulations";

export const metadata: Metadata = {
  title: "NFPA coverage",
  description: "NFPA 72, 25, 10, 17/17A, 96, 101 inspection workflows covered by PyroGuard.",
  alternates: { canonical: "https://pyroguard-demo.netlify.app/standards" },
};

export default function StandardsPage() {
  return (
    <section className="container py-16 max-w-4xl">
      <div className="space-y-4 mb-10">
        <Badge variant="muted">Standards</Badge>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">NFPA coverage</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          PyroGuard ships guided workflows and inspection frequencies for the standards below. Section
          citations are included only when verified against the current edition — otherwise the app
          defers to the inspector&apos;s judgment and reference copy.
        </p>
      </div>

      <Card className="bg-warn/5 border-warn/30 mb-8">
        <CardContent className="pt-6">
          <p className="text-sm leading-relaxed">
            <strong className="text-warn">Disclaimer.</strong> {DISCLAIMER}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {Object.entries(groupBy(REGULATIONS, (r) => r.standard)).map(([std, items]) => (
          <Card key={std}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span>{std}</span>
                <Badge variant="outline">{items.length} checks</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((r) => (
                <div key={r.system + r.frequency} className="flex flex-wrap items-baseline gap-3 text-sm py-2 border-b last:border-0">
                  <div className="font-medium flex-1">{r.system}</div>
                  <Badge variant="muted">{r.frequency}</Badge>
                  {r.section ? (
                    <code className="text-xs text-muted-foreground font-mono">§{r.section}</code>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">citation deferred</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function groupBy<T, K extends string>(arr: T[], key: (t: T) => K): Record<K, T[]> {
  return arr.reduce(
    (acc, item) => {
      const k = key(item);
      (acc[k] ??= []).push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}
