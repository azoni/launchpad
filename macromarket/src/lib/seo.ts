import { APP_DESCRIPTION, APP_NAME, APP_URL } from "@/lib/utils";
import type { CatalogItem } from "@/lib/catalog/types";

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    url: APP_URL,
    description: APP_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${APP_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    url: APP_URL,
    logo: `${APP_URL}/icon.svg`,
  };
}

export function breadcrumbJsonLd(
  trail: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${APP_URL}${t.path}`,
    })),
  };
}

export function itemListJsonLd(
  items: CatalogItem[],
  name: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 30).map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: `${APP_URL}/food/${it.id}`,
    })),
  };
}

export function productJsonLd(item: CatalogItem): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    description: item.editorialBlurb,
    category: item.category,
    url: `${APP_URL}/food/${item.id}`,
  };
  if (item.brand) data.brand = { "@type": "Brand", name: item.brand };
  if (item.effectivePriceCents != null) {
    data.offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (item.effectivePriceCents / 100).toFixed(2),
      availability: item.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: item.buyUrl,
    };
  }
  if (item.rating != null && item.reviewCount) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: item.rating,
      reviewCount: item.reviewCount,
    };
  }
  return data;
}

export function faqJsonLd(
  qas: { q: string; a: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qas.map((qa) => ({
      "@type": "Question",
      name: qa.q,
      acceptedAnswer: { "@type": "Answer", text: qa.a },
    })),
  };
}
