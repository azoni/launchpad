import { NextResponse } from "next/server";

// Reads demo-feedback submissions from Netlify Forms server-side. The token never
// reaches the browser — the /admin page only ever sees the mapped submission data.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RawSubmission = {
  id: string;
  created_at: string;
  data?: Record<string, string>;
};

export async function GET() {
  const token = process.env.NF_ADMIN_TOKEN;
  const formId = process.env.NF_FORM_ID;
  if (!token || !formId) {
    return NextResponse.json(
      { ok: false, error: "Feedback source not configured (NF_ADMIN_TOKEN / NF_FORM_ID).", submissions: [] },
      { status: 200 }
    );
  }
  try {
    const res = await fetch(`https://api.netlify.com/api/v1/forms/${formId}/submissions?per_page=100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Netlify API returned ${res.status}`, submissions: [] },
        { status: 200 }
      );
    }
    const raw = (await res.json()) as RawSubmission[];
    const submissions = (Array.isArray(raw) ? raw : []).map((s) => ({
      id: s.id,
      created_at: s.created_at,
      realism: s.data?.realism ?? "",
      wrong: s.data?.wrong ?? "",
      using_today: s.data?.using_today ?? "",
      blocker: s.data?.blocker ?? "",
      name: s.data?.name ?? "",
      cert: s.data?.cert ?? "",
      from: s.data?.from ?? "",
      run: s.data?.run ?? "",
    }));
    return NextResponse.json({ ok: true, submissions });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to reach Netlify.", submissions: [] }, { status: 200 });
  }
}
