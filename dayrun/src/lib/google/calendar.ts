import { google, type calendar_v3 } from "googleapis";

export type SimpleEvent = {
  googleEventId: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  description: string | null;
};

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
      } as SimpleEvent;
    });
}
