import type { SwipeAction, ClickSurface } from "../types";

export type AnalyticsEvent =
  | {
      event: "swipe_action";
      properties: {
        session_id: string;
        product_asin: string;
        action: SwipeAction;
        duration_ms: number;
        card_position: number;
      };
    }
  | {
      event: "results_viewed";
      properties: {
        session_id: string;
        product_count: number;
      };
    }
  | {
      event: "affiliate_click";
      properties: {
        product_asin: string;
        source: ClickSurface;
      };
    }
  | {
      event: "bundle_created";
      properties: {
        bundle_id: string;
        product_count: number;
      };
    }
  | {
      event: "bundle_shared";
      properties: {
        bundle_id: string;
        product_count: number;
      };
    }
  | {
      event: "onboarding_completed";
      properties: {
        session_id: string;
      };
    };
