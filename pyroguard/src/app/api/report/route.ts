import { NextResponse } from "next/server";

// Generates the AHJ deficiency cover letter from the run's structured findings, via Claude.
// The API key stays server-side. If the key is missing or the call fails, we return a
// scripted-but-real fallback letter so the demo NEVER breaks — the client can't tell the
// difference, and `source` tells us which fired.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Finding = {
  deviceId: string;
  label: string;
  location: string;
  severity: string;
  standard: string;
  note: string;
};
type Body = {
  site?: string;
  address?: string;
  inspector?: string;
  license?: string;
  ahj?: string;
  portal?: string;
  customer?: string;
  findings?: Finding[];
};

const MODEL = process.env.REPORT_MODEL || "claude-haiku-4-5-20251001";

function fallbackLetter(b: Body): string {
  const f = b.findings ?? [];
  const lines = f.map(
    (x, i) =>
      `${i + 1}. ${x.deviceId} — ${x.label} (${x.location}). Classification: ${x.severity.toUpperCase()}, per ${x.standard}. ${x.note}`
  );
  return `Cascade Fire Protection Co. — Seattle, WA

TO: ${b.ahj || "Seattle Fire Department — Fire Prevention Division"}
VIA: ${b.portal || "The Compliance Engine (Brycer)"}
RE: Deficiency notice — ${b.site || "Meridian Exchange Building"}, ${b.address || "1201 Western Ave, Seattle, WA 98101"}

This annual inspection and test identified ${f.length} deficienc${f.length === 1 ? "y" : "ies"} requiring correction:

${lines.join("\n\n")}

Each finding's classification is stated above; where a device is classified critical, it remains in service but its performance is impaired. Corrective action is required within 30 days of this notice; a deficiency-repair report will be re-filed on completion at no additional AHJ fee. The system was placed on test with the central station for the duration of testing and restored off test on completion.

Inspected and certified by:
${b.inspector || "Marcus Webb"}, NICET Level II — Inspection & Testing of Water-Based Systems
${b.license || "WA Cert. of Competency No. C-6120"}`;
}

function logCost(usage: { input_tokens?: number; output_tokens?: number } | undefined, input: string) {
  const key = process.env.MCP_ADMIN_KEY;
  if (!key || !usage) return;
  const inTok = usage.input_tokens || 0;
  const outTok = usage.output_tokens || 0;
  // Per-1M rates keyed off the model so an override doesn't silently mis-price.
  const RATES: Record<string, [number, number]> = {
    "claude-haiku-4-5": [1.0, 5.0],
    "claude-haiku": [0.8, 4.0],
    "claude-sonnet": [3.0, 15.0],
    "claude-opus": [15.0, 75.0],
  };
  const [ri, ro] = RATES[Object.keys(RATES).find((k) => MODEL.includes(k)) || "claude-haiku-4-5"];
  const cost = (inTok / 1e6) * ri + (outTok / 1e6) * ro;
  fetch("https://azoni-mcp.onrender.com/activity/log", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      type: "llm_call",
      title: "PyroGuard demo — AHJ deficiency letter",
      source: "launchpad:pyroguard",
      description: input.slice(0, 200),
      model: MODEL,
      tokens: { input: inTok, output: outTok, total: inTok + outTok },
      cost,
    }),
  }).catch(() => {});
}

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* use defaults */
  }
  // Bound the input so a public endpoint can't be used to burn tokens: cap count + field lengths.
  const clip = (s: unknown, n: number) => (typeof s === "string" ? s.slice(0, n) : "");
  const findings = (Array.isArray(body.findings) ? body.findings : []).slice(0, 4).map((f) => ({
    deviceId: clip(f?.deviceId, 40),
    label: clip(f?.label, 80),
    location: clip(f?.location, 120),
    severity: clip(f?.severity, 20),
    standard: clip(f?.standard, 20),
    note: clip(f?.note, 300),
  }));
  const cb: Body = {
    site: clip(body.site, 80),
    address: clip(body.address, 120),
    inspector: clip(body.inspector, 60),
    license: clip(body.license, 60),
    ahj: clip(body.ahj, 100),
    portal: clip(body.portal, 80),
    customer: clip(body.customer, 80),
    findings,
  };
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || findings.length === 0) {
    return NextResponse.json({ text: fallbackLetter(cb), source: "fallback", model: MODEL });
  }

  const system =
    "You are a NICET-certified fire inspector's assistant. Draft the AHJ deficiency cover letter that accompanies an NFPA inspection report. Write a real, concise, professional business letter in PLAIN TEXT (no markdown, no asterisks). Cite the exact NFPA standard (with section number) for each finding, state the classification, give a correction window of 'within 30 days of this notice', and close with the inspector's name, NICET level, and license. Do not invent findings beyond those given. Keep it 170-240 words. CRITICAL FORMATTING: do NOT output any bracketed placeholders such as [Date], [Name], or [Signature], and do NOT include a dateline — fill in every detail from the data provided and refer to timing only as 'this inspection' and 'within 30 days of this notice.' This is the actual document the Authority Having Jurisdiction receives.";
  const userPrompt = [
    `Company: Cascade Fire Protection Co., Seattle, WA`,
    `Site: ${cb.site || "Meridian Exchange Building"}, ${cb.address || "1201 Western Ave, Seattle, WA 98101"}`,
    `AHJ: ${cb.ahj || "Seattle Fire Department — Fire Prevention Division"}, filed via ${cb.portal || "The Compliance Engine (Brycer)"}`,
    `Customer: ${cb.customer || "Dana Whitfield, Facility Manager"}`,
    `Inspector: ${cb.inspector || "Marcus Webb"}, NICET Level II, ${cb.license || "WA Cert. of Competency No. C-6120"}`,
    ``,
    `Findings (${findings.length}):`,
    ...findings.map(
      (f, i) => `${i + 1}. ${f.deviceId} — ${f.label}, ${f.location}. Severity: ${f.severity}. Standard: ${f.standard}. Detail: ${f.note}`
    ),
    ``,
    `Write the AHJ deficiency cover letter now.`,
  ].join("\n");

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000); // stay under Netlify's sync-function limit; Haiku is fast
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        temperature: 0.4,
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      return NextResponse.json({ text: fallbackLetter(cb), source: "fallback", model: MODEL, note: `api ${res.status}` });
    }
    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    if (!text) {
      return NextResponse.json({ text: fallbackLetter(cb), source: "fallback", model: MODEL });
    }
    logCost(data.usage, userPrompt);
    return NextResponse.json({ text, source: "live", model: MODEL });
  } catch {
    return NextResponse.json({ text: fallbackLetter(cb), source: "fallback", model: MODEL });
  } finally {
    clearTimeout(t);
  }
}
