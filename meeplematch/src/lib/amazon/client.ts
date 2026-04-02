/**
 * Amazon Creators API client for MeepleMatch.
 *
 * TypeScript port of oldways-app/backend/app/amazon_api.py.
 * Uses OAuth2 client credentials (v3.1 LWA) for authentication.
 * Server-side only — never import this in client components.
 */

import { parseItem } from "./parser";
import { affiliateUrl } from "./asin";
import type {
  AmazonProduct,
  GetItemsResponse,
  SearchItemsResponse,
} from "./types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const API_HOST = "https://creatorsapi.amazon";
const ENDPOINT_GET_ITEMS = "/catalog/v1/getItems";
const ENDPOINT_SEARCH_ITEMS = "/catalog/v1/searchItems";
const TOKEN_URL = "https://api.amazon.com/auth/o2/token";
const OAUTH_SCOPE = "creatorsapi::default";
const MARKETPLACE = "www.amazon.com";

const RESOURCES = [
  "customerReviews.starRating",
  "images.primary.large",
  "images.variants.large",
  "itemInfo.features",
  "itemInfo.title",
  "offersV2.listings.price",
];

// ---------------------------------------------------------------------------
// Token cache (module-level singletons, reused across warm invocations)
// ---------------------------------------------------------------------------
let accessToken: string | null = null;
let tokenExpiresAt = 0;
let tokenPromise: Promise<string | null> | null = null;

// Rate limiting
let lastCallTime = 0;
let rateLimitPromise: Promise<void> | null = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isConfigured(): boolean {
  return !!(
    process.env.AMAZON_CLIENT_ID && process.env.AMAZON_CLIENT_SECRET
  );
}

function getPartnerTag(): string {
  return process.env.AMAZON_PARTNER_TAG ?? "oldwaystoda00-20";
}

async function getAccessToken(): Promise<string | null> {
  // Return cached token if still valid (60s buffer)
  if (accessToken && Date.now() < tokenExpiresAt - 60_000) {
    return accessToken;
  }

  // Prevent concurrent token requests
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
        console.error(
          `OAuth2 token request failed (${res.status}): ${await res.text()}`
        );
        return null;
      }

      const data = await res.json();
      accessToken = data.access_token as string;
      const expiresIn = (data.expires_in as number) ?? 3600;
      tokenExpiresAt = Date.now() + expiresIn * 1000;
      return accessToken;
    } catch (e) {
      console.error("OAuth2 token exchange failed:", e);
      return null;
    } finally {
      tokenPromise = null;
    }
  })();

  return tokenPromise;
}

async function rateLimit(): Promise<void> {
  if (rateLimitPromise) await rateLimitPromise;

  rateLimitPromise = (async () => {
    const now = performance.now();
    const elapsed = now - lastCallTime;
    if (elapsed < 1500) {
      await new Promise((r) => setTimeout(r, 1500 - elapsed));
    }
    lastCallTime = performance.now();
  })();

  await rateLimitPromise;
  rateLimitPromise = null;
}

async function apiRequest<T>(
  endpoint: string,
  payload: Record<string, unknown>
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

    // 401 → clear token, retry once
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

    if (res.status === 429) {
      console.warn("Creators API rate limit hit (429)");
      return null;
    }

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `Creators API ${endpoint} failed (${res.status}): ${body.slice(0, 500)}`
      );
      return null;
    }

    return (await res.json()) as T;
  } catch (e) {
    console.error(`Creators API ${endpoint} request error:`, e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch product data for up to 10 ASINs.
 * Returns a Map keyed by ASIN with parsed product data.
 */
export async function getItems(
  asins: string[]
): Promise<Map<string, AmazonProduct>> {
  const results = new Map<string, AmazonProduct>();
  if (!isConfigured() || asins.length === 0) return results;

  const batch = asins.slice(0, 10);

  const response = await apiRequest<GetItemsResponse>(ENDPOINT_GET_ITEMS, {
    itemIds: batch,
    resources: RESOURCES,
    partnerTag: getPartnerTag(),
    marketplace: MARKETPLACE,
  });

  if (!response) return results;

  const items = response.itemsResult?.items ?? [];
  for (const item of items) {
    const parsed = parseItem(item);
    if (parsed.asin) {
      results.set(parsed.asin, parsed);
    }
  }

  const errors = response.itemsResult?.errors ?? [];
  for (const error of errors) {
    console.warn(
      `Creators API GetItems error: ${error.code} - ${error.message}`
    );
  }

  return results;
}

/**
 * Search Amazon for products matching a query.
 * Returns up to 5 parsed product results with affiliate URLs.
 */
export async function searchItems(
  query: string,
  searchIndex = "All"
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
    }
  );

  if (!response) return [];

  const items = response.searchResult?.items ?? [];
  return items.map((item) => {
    const parsed = parseItem(item);
    if (parsed.asin) {
      parsed.detailPageUrl = affiliateUrl(parsed.asin);
    }
    return parsed;
  });
}

export { isConfigured };
