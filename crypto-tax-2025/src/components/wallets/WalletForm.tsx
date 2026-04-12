import { useState } from "react";
import { Input, Select, Label } from "../ui/Input";
import { Button } from "../ui/Button";
import { addWallet } from "../../data/wallets";
import { runPipeline } from "../../domain/pipeline";
import type { ChainId } from "../../types";

export function WalletForm() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState<ChainId>("ethereum");
  const [label, setLabel] = useState("");
  const [isOwned, setIsOwned] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!address.trim()) return;
        setBusy(true);
        setErr(null);
        try {
          await addWallet({ address, chain, label, isOwned });
          setAddress("");
          setLabel("");
          // Re-run pipeline — new wallet affects transfer matching
          runPipeline().catch(() => {});
        } catch (e2) {
          setErr(e2 instanceof Error ? e2.message : String(e2));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <Label htmlFor="address">Wallet address</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x… or Solana address"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="chain">Chain</Label>
          <Select id="chain" value={chain} onChange={(e) => setChain(e.target.value as ChainId)}>
            <option value="ethereum">Ethereum (MetaMask)</option>
            <option value="abstract">Abstract</option>
            <option value="solana">Solana (Phantom)</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Main MetaMask"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[color:var(--color-ink-soft)]">
        <input
          type="checkbox"
          checked={isOwned}
          onChange={(e) => setIsOwned(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        This is my wallet (used for transfer matching)
      </label>
      {err && <div className="text-xs text-red-600">{err}</div>}
      <Button disabled={busy} type="submit">
        {busy ? "Adding…" : "Add wallet"}
      </Button>
    </form>
  );
}
