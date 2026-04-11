import { useEffect, useState } from "react";
import { subscribeReviewItems } from "../data/reviewItems";
import type { ReviewItem } from "../types";

export function useReviewQueue() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeReviewItems((i) => {
      setItems(i);
      setLoading(false);
    });
    return unsub;
  }, []);

  const open = items.filter((i) => i.status === "open");
  const resolved = items.filter((i) => i.status !== "open");
  const total = items.length;
  const progress = total === 0 ? 0 : (resolved.length / total) * 100;

  return { items, open, resolved, total, progress, loading };
}
