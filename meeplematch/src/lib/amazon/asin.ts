const ASIN_REGEX = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/;

/** Extract an ASIN from an Amazon product URL. Returns null if not found. */
export function extractAsin(url: string): string | null {
  const match = ASIN_REGEX.exec(url);
  return match ? match[1] : null;
}

/** Build an affiliate URL for a given ASIN. */
export function affiliateUrl(asin: string, partnerTag?: string): string {
  const tag = partnerTag ?? process.env.AMAZON_PARTNER_TAG ?? "oldwaystoda00-20";
  return `https://www.amazon.com/dp/${asin}?tag=${tag}`;
}
