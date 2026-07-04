/** Parsed product data from the Amazon Creators API. */
export interface AmazonProduct {
  asin: string;
  title: string | null;
  rating: number | null;
  reviewCount: number | null;
  featureBullets: string[];
  images: string[];
  /** current price in US cents (null if unavailable) */
  priceCents: number | null;
  /** strike-through / was price in cents */
  listPriceCents: number | null;
  savingsPercent: number | null;
  savingsCents: number | null;
  availability: string | null;
  inStock: boolean;
  detailPageUrl: string | null;
}

/** A money value — the Creators API has used both flat and `money`-nested shapes. */
export interface RawMoney {
  amount?: number;
  displayAmount?: string;
  currency?: string;
}

/** Loose price shape; probed defensively because the exact nesting is version-dependent. */
export interface RawPrice extends RawMoney {
  value?: number;
  money?: RawMoney;
  listPrice?: RawMoney & { money?: RawMoney };
  savingBasis?: RawMoney & { money?: RawMoney };
  savings?: {
    amount?: number;
    percentage?: number;
    money?: RawMoney;
  };
}

export interface CreatorsApiItem {
  asin?: string;
  itemInfo?: {
    title?: { displayValue?: string };
    features?: { displayValues?: string[] };
  };
  images?: {
    primary?: { large?: { url?: string } };
    variants?: Array<{ large?: { url?: string } }>;
  };
  offersV2?: {
    listings?: Array<{
      availability?: { type?: string; message?: string };
      price?: RawPrice;
      isPrimeEligible?: boolean;
    }>;
  };
  offers?: {
    listings?: Array<{
      availability?: { type?: string; message?: string };
      price?: RawPrice;
    }>;
  };
  customerReviews?: {
    starRating?: { value?: number };
    count?: number;
  };
  detailPageURL?: string;
}

export interface GetItemsResponse {
  itemsResult?: {
    items?: CreatorsApiItem[];
    errors?: Array<{ code?: string; message?: string }>;
  };
}

export interface SearchItemsResponse {
  searchResult?: {
    items?: CreatorsApiItem[];
  };
}
