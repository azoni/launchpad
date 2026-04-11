import { useEffect, useState } from "react";
import { subscribeWallets } from "../data/wallets";
import type { Wallet } from "../types";

export function useWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeWallets((w) => {
      setWallets(w);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { wallets, loading };
}
