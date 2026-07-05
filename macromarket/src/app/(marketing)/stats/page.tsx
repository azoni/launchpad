import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  DollarSign,
  MessageCircle,
  MousePointerClick,
} from "lucide-react";
import { getAllItems } from "@/lib/catalog";
import type { CatalogItem } from "@/lib/catalog/types";
import { formatPer10g, formatPrice } from "@/lib/format";
import { getStats } from "@/lib/stats/read";

/** Catalog items worth a human look: rejected live price, no price, or an outlier value. */
async function getFlagged(): Promise<{ item: CatalogItem; reasons: string[] }[]> {
  try {
    const items = await getAllItems();
    return items
      .map((item) => {
        const cpg = item.metrics.costPerGramProteinCents;
        const reasons: string[] = [];
        if (item.priceSuspect) reasons.push("live price rejected (pack mismatch)");
        if (cpg == null) reasons.push("no price");
        else if (cpg > 30) reasons.push("very high cost per protein");
        return { item, reasons };
      })
      .filter((x) => x.reasons.length > 0)
      .slice(0, 100);
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Usage & Activity",
  description:
    "Live MacroMarket activity — AI protein-coach usage, token cost, and affiliate link clicks.",
  robots: { index: false, follow: false },
  alternates: { canonical: undefined },
};

function usd(n: number): string {
  if (n === 0) return "$0";
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}
function num(n: number): string {
  return n.toLocaleString("en-US");
}
function ago(iso: string | null): string {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="price-tag-card p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="tabular mt-1.5 text-2xl font-bold leading-none text-ink">
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export default async function StatsPage() {
  const s = await getStats();
  const { chats, affiliate } = s;
  const flagged = await getFlagged();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="inline-flex items-center gap-2 rounded-full border border-line bg-secondary px-3 py-1 text-xs font-bold text-[color:var(--color-leaf-deep)]">
        <Activity className="size-3.5" /> Live activity
      </div>
      <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-ink">
        Usage &amp; activity
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        AI protein-coach usage, token cost, and affiliate clicks. Public dashboard —
        raw JSON at{" "}
        <Link href="/api/stats" className="font-semibold text-primary">
          /api/stats
        </Link>
        .
      </p>

      {!s.configured && (
        <p className="mt-6 rounded-lg border border-dashed border-line bg-white p-6 text-sm text-muted-foreground">
          Activity storage isn&apos;t configured in this environment yet
          (no Firebase credentials), so there&apos;s nothing to show. Once deployed with
          Firebase set, coach chats and affiliate clicks appear here.
        </p>
      )}

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          icon={<MessageCircle className="size-3.5" />}
          label="AI chats"
          value={num(chats.totalCalls)}
          sub={`${num(chats.last7d.calls)} in last 7d`}
        />
        <Stat
          icon={<Activity className="size-3.5" />}
          label="Tokens"
          value={num(chats.totalTokens)}
          sub={`${num(chats.inputTokens)} in / ${num(chats.outputTokens)} out`}
        />
        <Stat
          icon={<DollarSign className="size-3.5" />}
          label="AI cost"
          value={usd(chats.totalCostUSD)}
          sub={`${usd(chats.last7d.costUSD)} in last 7d`}
        />
        <Stat
          icon={<MousePointerClick className="size-3.5" />}
          label="Affiliate clicks"
          value={num(affiliate.totalClicks)}
          sub={`${num(affiliate.last7d)} in last 7d`}
        />
      </div>

      {/* Data quality — items flagged for review */}
      <section className="mt-8">
        <h2 className="mb-1 flex items-center gap-2 font-heading text-xl font-bold text-ink">
          <AlertTriangle className="size-5 text-[color:var(--color-clay)]" />
          Flagged for review
          <span className="tabular rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-[color:var(--color-leaf-deep)]">
            {flagged.length}
          </span>
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Items whose live price was rejected as a likely pack-size mismatch, that
          have no price, or whose cost per protein is an outlier — worth a manual
          check of the catalog serving/pack data.
        </p>
        {flagged.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted-foreground">
            Nothing flagged — prices and value metrics look sane.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="border-b border-line text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Item</th>
                  <th className="px-4 py-2.5 text-right font-semibold">/10g</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Price</th>
                  <th className="px-4 py-2.5 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {flagged.map(({ item, reasons }) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/food/${item.id}`}
                        className="font-semibold text-ink hover:text-primary"
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className="tabular px-4 py-2.5 text-right">
                      {formatPer10g(item.metrics.costPerGramProteinCents)}
                    </td>
                    <td className="tabular px-4 py-2.5 text-right">
                      {formatPrice(item.effectivePriceCents)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {reasons.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Usage by model */}
      {chats.byModel.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-heading text-xl font-bold text-ink">Usage by model</h2>
          <div className="overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-[28rem] text-sm">
              <thead className="border-b border-line text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Model</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Calls</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Tokens</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {chats.byModel.map((m) => (
                  <tr key={m.model}>
                    <td className="px-4 py-2.5 font-semibold text-ink">{m.model}</td>
                    <td className="tabular px-4 py-2.5 text-right">{num(m.calls)}</td>
                    <td className="tabular px-4 py-2.5 text-right">{num(m.tokens)}</td>
                    <td className="tabular px-4 py-2.5 text-right">{usd(m.costUSD)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Recent chats */}
        <section>
          <h2 className="mb-3 font-heading text-xl font-bold text-ink">Recent coach chats</h2>
          {chats.recent.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted-foreground">
              No chats logged yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {chats.recent.map((c, i) => (
                <li key={i} className="price-tag-card p-3">
                  <p className="line-clamp-2 text-sm text-ink">{c.prompt || "—"}</p>
                  <div className="tabular mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{ago(c.ts)}</span>
                    <span>{num(c.tokens)} tok</span>
                    <span>{usd(c.costUSD)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Affiliate clicks */}
        <section>
          <h2 className="mb-3 font-heading text-xl font-bold text-ink">Top clicked products</h2>
          {affiliate.byProduct.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line p-6 text-sm text-muted-foreground">
              No affiliate clicks logged yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {affiliate.byProduct.map((p) => (
                <li
                  key={p.slug}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2"
                >
                  <Link
                    href={`/food/${p.slug}`}
                    className="truncate text-sm font-semibold text-ink hover:text-primary"
                  >
                    {p.slug}
                  </Link>
                  <span className="tabular shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-[color:var(--color-leaf-deep)]">
                    {num(p.clicks)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Updates live on each load. Prompts are truncated to 300 characters; no
        personal data is stored.
      </p>
    </div>
  );
}
