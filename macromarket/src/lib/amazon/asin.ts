const ASIN_REGEX = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/;

/** Extract an ASIN from an Amazon product URL. Returns null if not found. */
export function extractAsin(url: string): string | null {
  const match = ASIN_REGEX.exec(url);
  return match ? match[1] : null;
}

function tag(partnerTag?: string): string {
  return partnerTag ?? process.env.AMAZON_PARTNER_TAG ?? "oldwaystoda00-20";
}

/** Affiliate product URL for a known ASIN. */
export function affiliateUrl(asin: string, partnerTag?: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${tag(partnerTag)}`;
}

/** Affiliate search URL — used for whole foods with no fixed ASIN. */
export function affiliateSearchUrl(query: string, partnerTag?: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${tag(
    partnerTag,
  )}`;
}
