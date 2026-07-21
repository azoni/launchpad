/**
 * Weekly "protein deals" email digest.
 *
 * Builds a branded HTML email from the current best-value picks and live deals,
 * then either sends it via Resend (when RESEND_API_KEY is set) or stores it in
 * Firestore `digests` for manual send. Fully env-gated like every other feature.
 */
import { getAllItems, getDeals } from "@/lib/catalog";
import { formatPer10g, formatPrice } from "@/lib/format";
import { APP_NAME, APP_URL } from "@/lib/utils";

const C = {
  paper: "#faf7f1",
  ink: "#2c2418",
  muted: "#8b7b65",
  leaf: "#567b45",
  leafDeep: "#3f5f31",
  clay: "#c26a45",
  line: "#ebe4d7",
};

interface DigestRow {
  name: string;
  url: string;
  price: string;
  per10g: string;
  note: string;
}

function rowHtml(r: DigestRow): string {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${C.line};">
        <a href="${r.url}" style="color:${C.ink};font-weight:700;text-decoration:none;font-size:15px;">${r.name}</a>
        <div style="color:${C.muted};font-size:13px;margin-top:2px;">${r.note}</div>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid ${C.line};text-align:right;white-space:nowrap;">
        <div style="color:${C.ink};font-weight:700;">${r.price}</div>
        <div style="color:${C.leafDeep};font-size:13px;">${r.per10g}/10g</div>
      </td>
    </tr>`;
}

export interface Digest {
  subject: string;
  html: string;
  text: string;
  itemCount: number;
}

export async function buildWeeklyDigest(): Promise<Digest> {
  const [all, deals] = await Promise.all([getAllItems(), getDeals()]);

  // Best value in each category (deduped), capped for a scannable email.
  const bestValue = deals.bestValue.slice(0, 8).map<DigestRow>((i) => ({
    name: `${i.brand ? `${i.brand} ` : ""}${i.name}`,
    url: `${APP_URL}/food/${i.id}`,
    price: formatPrice(i.effectivePriceCents),
    per10g: formatPer10g(i.metrics.costPerGramProteinCents),
    note: `Best value in ${i.category.replace(/-/g, " ")}`,
  }));

  // Live sale items, if any (real discounts).
  const onSale = deals.onSale.slice(0, 6).map<DigestRow>((i) => ({
    name: `${i.brand ? `${i.brand} ` : ""}${i.name}`,
    url: `${APP_URL}/food/${i.id}`,
    price: formatPrice(i.effectivePriceCents),
    per10g: formatPer10g(i.metrics.costPerGramProteinCents),
    note: `${i.savingsPercent}% off right now`,
  }));

  const cheapestOverall = all[0];
  const subject = cheapestOverall
    ? `This week's cheapest protein: ${cheapestOverall.name} at ${formatPer10g(cheapestOverall.metrics.costPerGramProteinCents)}/10g`
    : "This week's best protein deals";

  const section = (title: string, rows: DigestRow[]) =>
    rows.length
      ? `<h2 style="font-size:16px;color:${C.ink};margin:24px 0 4px;">${title}</h2>
         <table width="100%" cellpadding="0" cellspacing="0">${rows.map(rowHtml).join("")}</table>`
      : "";

  const html = `<!doctype html><html><body style="margin:0;background:${C.paper};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:28px 20px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="display:inline-block;width:34px;height:34px;border-radius:9px;background:${C.leaf};color:#fff;text-align:center;line-height:34px;font-weight:800;">$</span>
        <span style="font-size:22px;font-weight:800;color:${C.ink};">${APP_NAME}</span>
      </div>
      <p style="color:${C.muted};font-size:14px;margin:16px 0 0;">The most protein for your money — here are this week's best values, ranked by cost per 10 g of protein.</p>
      ${section("🔥 On sale now", onSale)}
      ${section("💎 Best value in every aisle", bestValue)}
      <div style="margin:28px 0;text-align:center;">
        <a href="${APP_URL}" style="display:inline-block;background:${C.clay};color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px;">See the full ranking</a>
      </div>
      <p style="color:${C.muted};font-size:12px;line-height:1.5;border-top:1px solid ${C.line};padding-top:16px;">
        As an Amazon Associate we earn from qualifying purchases. Prices are estimates — confirm on Amazon before buying.
        You're getting this because you signed up at ${APP_URL}. <a href="${APP_URL}/unsubscribe" style="color:${C.muted};">Unsubscribe</a>.
      </p>
    </div>
  </body></html>`;

  const text =
    `${APP_NAME} — this week's best protein values\n\n` +
    [...onSale, ...bestValue]
      .map((r) => `• ${r.name} — ${r.price} (${r.per10g}/10g) — ${r.note}\n  ${r.url}`)
      .join("\n") +
    `\n\nFull ranking: ${APP_URL}`;

  return { subject, html, text, itemCount: onSale.length + bestValue.length };
}

/** Send via Resend if configured; returns how many were sent (0 = stored only). */
export async function sendDigest(
  recipients: string[],
  digest: Digest,
): Promise<{ sent: number; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DIGEST_FROM ?? "MacroMarket <deals@macromarket-app.netlify.app>";
  if (!apiKey) return { sent: 0, error: "RESEND_API_KEY not set" };
  if (recipients.length === 0) return { sent: 0 };

  let sent = 0;
  // Resend caps `to` at 50 per call; chunk and BCC-style fan out one at a time to
  // keep addresses private (small lists — fine to loop).
  for (const to of recipients) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          subject: digest.subject,
          html: digest.html,
          text: digest.text,
        }),
      });
      if (res.ok) sent++;
    } catch {
      /* skip one bad address, keep going */
    }
  }
  return { sent };
}
