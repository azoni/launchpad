import { useRef, useState } from "react";
import { createDataSource, updateDataSource } from "../../data/dataSources";
import { uploadCsv } from "../../data/storageUploads";
import { bulkInsertRaw } from "../../data/rawTransactions";
import { parseHyperliquidCsv } from "../../domain/normalize/csvHyperliquid";
import { parseLighterCsv } from "../../domain/normalize/csvLighter";
import { parseCoinbaseCsv } from "../../domain/normalize/csvCoinbase";
import { parseGenericCsv } from "../../domain/normalize/csvGeneric";
import { runPipeline } from "../../domain/pipeline";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import type { SourceType } from "../../types";

const PARSERS: Record<SourceType, (text: string) => Array<Record<string, unknown>>> = {
  hyperliquid_csv: parseHyperliquidCsv,
  lighter_csv: parseLighterCsv,
  coinbase_csv: parseCoinbaseCsv,
  generic_csv: parseGenericCsv,
  evm_wallet: () => [],
  solana_wallet: () => [],
};

export function CsvUploader({
  type,
  title,
  description,
}: {
  type: SourceType;
  title: string;
  description: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "parsing" | "running_pipeline" | "done" | "error"
  >("idle");
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [pipelineMsg, setPipelineMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setPipelineMsg(null);
    setStatus("parsing");
    try {
      const source = await createDataSource({ type, name: file.name });

      // Parse the CSV first — this is the critical path. Storage backup
      // happens after, non-blocking, and failures don't stop the pipeline.
      const text = await file.text();
      const parser = PARSERS[type];
      const rows = parser(text);
      await bulkInsertRaw(source.id, rows);
      await updateDataSource(source.id, {
        uploadStatus: "parsed",
        rowCount: rows.length,
      });
      setRowCount(rows.length);

      // Auto-run pipeline after import
      setStatus("running_pipeline");
      const result = await runPipeline();
      setPipelineMsg(
        `${result.normalizedCount} normalized · ${result.pricesFilled} prices filled · ${result.taxableEvents} taxable · ${result.reviewItems} to review`
      );
      setStatus("done");

      // Fire-and-forget: try to back up original CSV to Firebase Storage.
      // This is non-critical — the raw rows are already in Firestore/localStorage.
      uploadCsv(source.id, file).then((path) => {
        if (path) updateDataSource(source.id, { storagePath: path });
      }).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[color:var(--color-ink)]">{title}</div>
          <div className="text-xs text-[color:var(--color-ink-faint)]">{description}</div>
        </div>
        {status === "done" && <Badge tone="green">Done</Badge>}
        {status === "error" && <Badge tone="red">Error</Badge>}
        {status === "uploading" && <Badge tone="amber">Uploading…</Badge>}
        {status === "parsing" && <Badge tone="amber">Parsing…</Badge>}
        {status === "running_pipeline" && <Badge tone="blue">Running pipeline…</Badge>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Button variant="secondary" onClick={() => fileRef.current?.click()}>
        Choose CSV file
      </Button>
      {rowCount !== null && (
        <div className="mt-2 text-xs text-[color:var(--color-ink-faint)]">{rowCount} rows imported</div>
      )}
      {pipelineMsg && (
        <div className="mt-1 text-xs text-[color:var(--color-mint)]">{pipelineMsg}</div>
      )}
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </Card>
  );
}
