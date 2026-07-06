/**
 * Amazon Creators API client (server-side only — never import in a client component).
 *
 * OAuth2 client-credentials (LWA v3.1), token-cached, rate-limited to 1 call / 1.5s,
 * getItems batches up to 10 ASINs. Ported from meeplematch / oldways-app; the parser
 * is extended to read the dollar price. Degrades gracefully to null on any failure —
 * including the 403 `AssociateNotEligible` returned until the associate account is
 * eligible — so the app always renders (baseline prices are used instead).
 */

import { parseItem } from "./parser";
import type {
  AmazonProduct,
  GetItemsResponse,
  SearchItemsResponse,
} from "./types";

const API_HOST = "https://creatorsapi.amazon";
const ENDPOINT_GET_ITEMS = "/catalog/v1/getItems";
const ENDPOINT_SEARCH_ITEMS = "/catalog/v1/searchItems";
const TOKEN_URL = "https://api.amazon.com/auth/o2/token";
const OAUTH_SCOPE = "creatorsapi::default";
const MARKETPLACE = "www.amazon.com";

// Only these resource strings are accepted by the API (verified against the enum).
const RESOURCES = [
  "customerReviews.starRating",
  "images.primary.large",
  "images.variants.large",
  "itemInfo.features",
  "itemInfo.title",
  "offersV2.listings.price",
];

let accessToken: string | null = null;
let tokenExpiresAt = 0;
let tokenPromise: Promise<string | null> | null = null;
let lastCallTime = 0;

function isConfigured(): boolean {
  return !!(process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET);
}

function getPartnerTag(): string {
  return "macromarket-20";
}

async function getAccessToken(): Promise<string | null> {
  if (accessToken && Date.now() < tokenExpiresAt - 60_000) return accessToken;
  if (tokenPromise) return tokenPromise;

  tokenPromise = (async () => {
    if (!isConfigured()) return null;
    try {
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: process.env.AMAZON_CLIENT_ID,
          client_secret: process.env.AMAZON_CLIENT_SECRET,
          scope: OAUTH_SCOPE,
        }),
      });
      if (!res.ok) {
        console.error(`Amazon OAuth token failed (${res.status})`);
        return null;
      }
      const data = await res.json();
      accessToken = data.access_token as string;
      tokenExpiresAt = Date.now() + ((data.expires_in as number) ?? 3600) * 1000;
      return accessToken;
    } catch (e) {
      console.error("Amazon OAuth exchange failed:", e);
      return null;
    } finally {
      tokenPromise = null;
    }
  })();

  return tokenPromise;
}

async function rateLimit(): Promise<void> {
  const elapsed = performance.now() - lastCallTime;
  if (elapsed < 1500) await new Promise((r) => setTimeout(r, 1500 - elapsed));
  lastCallTime = performance.now();
}

async function apiRequest<T>(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<T | null> {
  let token = await getAccessToken();
  if (!token) return null;
  await rateLimit();

  const url = `${API_HOST}${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
    "x-marketplace": MARKETPLACE,
  };

  try {
    let res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      accessToken = null;
      token = await getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });
      }
    }

    if (!res.ok) {
      // 403 AssociateNotEligible / 429 rate-limit / etc. — degrade to null.
      if (res.status !== 429) {
        console.warn(
          `Amazon Creators API ${endpoint} ${res.status} — using baseline prices`,
        );
      }
      return null;
    }

    return (await res.json()) as T;
  } catch (e) {
    console.error(`Amazon Creators API ${endpoint} error:`, e);
    return null;
  }
}

/** Fetch product data for up to 10 ASINs. Returns a Map keyed by ASIN. */
export async function getItems(
  asins: string[],
): Promise<Map<string, AmazonProduct>> {
  const results = new Map<string, AmazonProduct>();
  if (!isConfigured() || asins.length === 0) return results;

  const response = await apiRequest<GetItemsResponse>(ENDPOINT_GET_ITEMS, {
    itemIds: asins.slice(0, 10),
    resources: RESOURCES,
    partnerTag: getPartnerTag(),
    marketplace: MARKETPLACE,
  });
  if (!response) return results;

  for (const item of response.itemsResult?.items ?? []) {
    const parsed = parseItem(item);
    if (parsed.asin) results.set(parsed.asin, parsed);
  }
  return results;
}

/** Fetch product data for any number of ASINs (batches of 10, rate-limited). */
export async function getItemsBatched(
  asins: string[],
): Promise<Map<string, AmazonProduct>> {
  const all = new Map<string, AmazonProduct>();
  for (let i = 0; i < asins.length; i += 10) {
    const batch = await getItems(asins.slice(i, i + 10));
    batch.forEach((v, k) => all.set(k, v));
  }
  return all;
}

/** Search Amazon for products matching a query. */
export async function searchItems(
  query: string,
  searchIndex = "All",
): Promise<AmazonProduct[]> {
  if (!isConfigured() || !query) return [];
  const response = await apiRequest<SearchItemsResponse>(
    ENDPOINT_SEARCH_ITEMS,
    {
      keywords: query,
      searchIndex,
      itemCount: 5,
      resources: RESOURCES,
      partnerTag: getPartnerTag(),
      marketplace: MARKETPLACE,
    },
  );
  if (!response) return [];
  return (response.searchResult?.items ?? []).map(parseItem);
}

export { isConfigured };
