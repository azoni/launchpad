import type { AmazonProduct, CreatorsApiItem, RawMoney, RawPrice } from "./types";

/** Turn a dollar amount or a "$29.99" display string into integer cents. */
function toCents(money: RawMoney | undefined): number | null {
  if (!money) return null;
  if (typeof money.amount === "number") return Math.round(money.amount * 100);
  if (typeof money.displayAmount === "string") {
    const n = parseFloat(money.displayAmount.replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(n)) return Math.round(n * 100);
  }
  return null;
}

/**
 * Extract current price in cents from the (version-dependent) price object.
 * Probes flat (`price.amount`/`displayAmount`) and nested (`price.money.*`).
 */
function priceCents(price: RawPrice | undefined): number | null {
  if (!price) return null;
  return (
    toCents(price) ??
    toCents(price.money) ??
    (typeof price.value === "number" ? Math.round(price.value * 100) : null)
  );
}

function listPriceCents(price: RawPrice | undefined): number | null {
  if (!price) return null;
  return (
    toCents(price.listPrice) ??
    toCents(price.listPrice?.money) ??
    toCents(price.savingBasis) ??
    toCents(price.savingBasis?.money)
  );
}

/** Parse a Creators API item into a flat AmazonProduct. */
export function parseItem(item: CreatorsApiItem): AmazonProduct {
  const result: AmazonProduct = {
    asin: item.asin ?? "",
    title: item.itemInfo?.title?.displayValue ?? null,
    rating: null,
    reviewCount: null,
    featureBullets: item.itemInfo?.features?.displayValues
      ? [...item.itemInfo.features.displayValues]
      : [],
    images: [],
    priceCents: null,
    listPriceCents: null,
    savingsPercent: null,
    savingsCents: null,
    availability: null,
    inStock: true,
    detailPageUrl: item.detailPageURL ?? null,
  };

  // Images
  const primaryUrl = item.images?.primary?.large?.url;
  if (primaryUrl) result.images.push(primaryUrl);
  for (const variant of item.images?.variants ?? []) {
    if (variant.large?.url) result.images.push(variant.large.url);
  }

  // Pricing & availability
  const offers = item.offersV2 ?? item.offers;
  const listing = offers?.listings?.[0];
  if (listing) {
    const availType = listing.availability?.type ?? null;
    result.availability = availType;
    result.inStock = availType == null || /instock/i.test(availType);

    result.priceCents = priceCents(listing.price);
    result.listPriceCents = listPriceCents(listing.price);

    const savings = listing.price?.savings;
    if (savings) {
      if (typeof savings.percentage === "number") {
        result.savingsPercent = Math.round(savings.percentage);
      }
      result.savingsCents =
        (typeof savings.amount === "number"
          ? Math.round(savings.amount * 100)
          : null) ?? toCents(savings.money);
    }
    // Derive savings % from list vs current if not provided directly
    if (
      result.savingsPercent == null &&
      result.listPriceCents &&
      result.priceCents &&
      result.listPriceCents > result.priceCents
    ) {
      result.savingsPercent = Math.round(
        (1 - result.priceCents / result.listPriceCents) * 100,
      );
    }
  }

  // Ratings
  const starValue = item.customerReviews?.starRating?.value;
  if (starValue != null) result.rating = Number(starValue);
  const count = item.customerReviews?.count;
  if (count != null) result.reviewCount = Number(count);

  return result;
}
