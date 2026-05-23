import { google, type calendar_v3 } from "googleapis";

export type SimpleEvent = {
  googleEventId: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  description: string | null;
  /** Second-level domain of the most-represented external corporate attendee (e.g. "geico"), or null. */
  attendeeDomain: string | null;
};

const FREE_PROVIDERS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "live.com",
  "msn.com",
  "fastmail.com",
  "duck.com",
  "pm.me",
]);

function extractAttendeeDomain(
  attendees: calendar_v3.Schema$EventAttendee[] | undefined,
): string | null {
  if (!attendees?.length) return null;
  const counts = new Map<string, number>();
  for (const a of attendees) {
    if (!a.email || a.self) continue;
    const domain = a.email.split("@")[1]?.toLowerCase();
    if (!domain || FREE_PROVIDERS.has(domain)) continue;
    const parts = domain.split(".");
    if (parts.length < 2) continue;
    // Second-level domain — handles `mail.geico.com` → `geico`,
    // `careers.anthropic.com` → `anthropic`.
    const slug = parts[parts.length - 2];
    if (!slug || slug.length < 2) continue;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export async function fetchEvents(
  accessToken: string,
  rangeDays: { back: number; forward: number },
): Promise<SimpleEvent[]> {
  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  const now = Date.now();
  const timeMin = new Date(now - rangeDays.back * 86400_000).toISOString();
  const timeMax = new Date(now + rangeDays.forward * 86400_000).toISOString();

  const events: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined;

  do {
    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
      pageToken,
    });
    events.push(...(res.data.items ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return events
    .filter((e) => e.id && e.status !== "cancelled")
    .map((e) => {
      const allDay = !!e.start?.date && !e.start?.dateTime;
      return {
        googleEventId: e.id!,
        summary: e.summary ?? "(no title)",
        start: e.start?.dateTime ?? e.start?.date ?? "",
        end: e.end?.dateTime ?? e.end?.date ?? "",
        allDay,
        location: e.location ?? null,
        description: e.description ?? null,
        attendeeDomain: extractAttendeeDomain(e.attendees ?? undefined),
      } as SimpleEvent;
    });
}
