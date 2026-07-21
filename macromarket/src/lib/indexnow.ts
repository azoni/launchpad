/**
 * IndexNow — instantly tell Bing, DuckDuckGo, Yandex (and, increasingly, Google's
 * ecosystem) that a URL changed so it gets recrawled in minutes instead of days.
 *
 * The key is published at /<INDEXNOW_KEY>.txt (in public/) which proves we own the
 * host. Fire-and-forget: submission never blocks or fails the caller.
 */
import { APP_URL } from "@/lib/utils";

export const INDEXNOW_KEY = "a7f3c9e14b8d42f6a0e5c7b91d6f8203";

/** Submit up to 10,000 URLs (absolute or site-relative) to IndexNow. */
export async function submitToIndexNow(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  let host: string;
  try {
    host = new URL(APP_URL).host;
  } catch {
    return;
  }
  const urlList = urls
    .map((u) => (u.startsWith("http") ? u : `${APP_URL}${u}`))
    .slice(0, 10_000);

  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${APP_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
  } catch {
    /* never let SEO pinging affect the request */
  }
}
