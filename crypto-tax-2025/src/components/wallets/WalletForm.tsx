import { useState } from "react";
import { Input, Select, Label } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { addWallet } from "../../data/wallets";
import { runPipeline } from "../../domain/pipeline";
import type { ChainId } from "../../types";

export function WalletForm() {
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState<ChainId>("ethereum");
  const [label, setLabel] = useState("");
  const [isOwned, setIsOwned] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "adding" | "pipeline" | "done">("idle");
  const [pipelineMsg, setPipelineMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!address.trim()) return;
        setBusy(true);
        setErr(null);
        setPipelineMsg(null);
        setStatus("adding");
        try {
          await addWallet({ address, chain, label, isOwned });
          setAddress("");
          setLabel("");
          setStatus("pipeline");
          const r = await runPipeline();
          setPipelineMsg(
            `${r.normalizedCount} normalized · ${r.taxableEvents} taxable · ${r.reviewItems} to review`
          );
          setStatus("done");
        } catch (e2) {
          setErr(e2 instanceof Error ? e2.message : String(e2));
          setStatus("idle");
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
      <div className="flex items-center gap-3">
        <Button disabled={busy} type="submit">
          {status === "adding" ? "Adding…" : status === "pipeline" ? "Running pipeline…" : "Add wallet"}
        </Button>
        {status === "pipeline" && <Badge tone="blue">Running pipeline…</Badge>}
        {status === "done" && <Badge tone="green">Done</Badge>}
      </div>
      {pipelineMsg && (
        <div className="text-xs text-[color:var(--color-mint)]">{pipelineMsg}</div>
      )}
    </form>
  );
}
