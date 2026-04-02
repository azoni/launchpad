/** Parsed product data from the Amazon Creators API. */
export interface AmazonProduct {
  asin: string;
  title: string | null;
  rating: number | null;
  reviewCount: number | null;
  featureBullets: string[];
  images: string[];
  savingsPercent: number | null;
  savingsDisplay: string | null;
  availability: string | null;
  detailPageUrl: string | null;
}

/** Raw item shape returned by the Creators API (partial — only fields we read). */
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
      availability?: { type?: string };
      price?: { savings?: { percentage?: number } };
    }>;
  };
  offers?: {
    listings?: Array<{
      availability?: { type?: string };
      price?: { savings?: { percentage?: number } };
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
