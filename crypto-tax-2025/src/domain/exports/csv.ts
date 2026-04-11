// Tiny CSV writer with strict quoting. No external dep.

export type CsvRow = Record<string, string | number | null | undefined>;

function escape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(rows: CsvRow[], columns: string[]): string {
  const header = columns.map(escape).join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(row[c])).join(","))
    .join("\n");
  return body ? `${header}\n${body}\n` : `${header}\n`;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
