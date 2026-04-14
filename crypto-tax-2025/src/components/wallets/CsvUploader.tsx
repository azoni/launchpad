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
import { PipelineProgress, type PipelineStage } from "./PipelineProgress";
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
  const [status, setStatus] = useState<PipelineStage>("idle");
  const [detail, setDetail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setDetail(null);

    setStatus("parsing");
    setDetail(`Parsing ${file.name}…`);
    try {
      const text = await file.text();
      const parser = PARSERS[type];
      const rows = parser(text);
      setDetail(`Parsed ${rows.length} rows from ${file.name}`);

      setStatus("saving");
      setDetail(`Saving ${rows.length} raw rows…`);
      const source = await createDataSource({ type, name: file.name });
      await bulkInsertRaw(source.id, rows);
      await updateDataSource(source.id, {
        uploadStatus: "parsed",
        rowCount: rows.length,
      });
      setDetail(`${rows.length} rows saved. Starting pipeline…`);

      setStatus("running_pipeline");
      setDetail("Normalizing → pricing → classifying → FIFO → review…");
      const result = await runPipeline();
      setDetail(
        `${result.normalizedCount} normalized · ${result.pricesFilled} prices filled · ${result.taxableEvents} taxable · ${result.reviewItems} to review`
      );
      setStatus("done");

      // Fire-and-forget storage backup
      uploadCsv(source.id, file).then((path) => {
        if (path) updateDataSource(source.id, { storagePath: path });
      }).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDetail(null);
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
      <Button
        variant="secondary"
        disabled={status !== "idle" && status !== "done" && status !== "error"}
        onClick={() => fileRef.current?.click()}
      >
        Choose CSV file
      </Button>

      <PipelineProgress status={status} mode="csv" detail={detail} />

      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </Card>
  );
}
