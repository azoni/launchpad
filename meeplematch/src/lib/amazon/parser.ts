import type { AmazonProduct, CreatorsApiItem } from "./types";

/** Parse a Creators API item response into a flat AmazonProduct. */
export function parseItem(item: CreatorsApiItem): AmazonProduct {
  const result: AmazonProduct = {
    asin: item.asin ?? "",
    title: null,
    rating: null,
    reviewCount: null,
    featureBullets: [],
    images: [],
    savingsPercent: null,
    savingsDisplay: null,
    availability: null,
    detailPageUrl: null,
  };

  // Title
  result.title = item.itemInfo?.title?.displayValue ?? null;

  // Feature bullets
  const bullets = item.itemInfo?.features?.displayValues;
  if (bullets) {
    result.featureBullets = [...bullets];
  }

  // Images
  const primaryUrl = item.images?.primary?.large?.url;
  if (primaryUrl) {
    result.images.push(primaryUrl);
  }
  for (const variant of item.images?.variants ?? []) {
    const url = variant.large?.url;
    if (url) {
      result.images.push(url);
    }
  }

  // Offers / pricing (only savings, not dollar amounts)
  const offers = item.offersV2 ?? item.offers;
  const listings = offers?.listings ?? [];
  if (listings.length > 0) {
    const listing = listings[0];
    result.availability = listing.availability?.type ?? null;

    const pct = listing.price?.savings?.percentage;
    if (pct != null) {
      result.savingsPercent = Math.round(pct);
      result.savingsDisplay = `${Math.round(pct)}% off`;
    }
  }

  // Customer ratings
  const starValue = item.customerReviews?.starRating?.value;
  if (starValue != null) {
    result.rating = Number(starValue);
  }
  const count = item.customerReviews?.count;
  if (count != null) {
    result.reviewCount = Number(count);
  }

  // Detail page URL
  result.detailPageUrl = item.detailPageURL ?? null;

  return result;
}
