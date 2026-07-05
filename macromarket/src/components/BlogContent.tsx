import type { ReactNode } from "react";

/** Inline markdown: **bold**, [text](url), bare URLs. */
function inline(text: string): ReactNode[] {
  const TOKEN =
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)|(\*\*)([^*]+)\*\*|(https?:\/\/[^\s)]+)/g;
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] && m[2]) {
      out.push(
        <a key={key++} href={m[2]} className="font-semibold text-primary underline underline-offset-2">
          {m[1]}
        </a>,
      );
    } else if (m[4]) {
      out.push(<strong key={key++} className="text-ink">{m[4]}</strong>);
    } else if (m[5]) {
      out.push(
        <a key={key++} href={m[5]} className="font-semibold text-primary underline underline-offset-2">
          {m[5]}
        </a>,
      );
    }
    last = TOKEN.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const BLOCK_START = /^(#{1,3}\s|\s*[-*]\s|\s*\d+\.\s|>\s)/;

/** Minimal, safe markdown → React (headings, lists, quotes, paragraphs). No raw HTML. */
export function BlogContent({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={key++} className="mt-6 font-heading text-lg font-bold text-ink">
          {inline(line.slice(4))}
        </h3>,
      );
      i++;
    } else if (line.startsWith("## ") || line.startsWith("# ")) {
      const text = line.replace(/^#{1,2}\s/, "");
      blocks.push(
        <h2 key={key++} className="mt-8 font-heading text-2xl font-bold text-ink">
          {inline(text)}
        </h2>,
      );
      i++;
    } else if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
          {items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </ul>,
      );
    } else if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="mt-3 list-decimal space-y-1 pl-5 text-muted-foreground">
          {items.map((it, j) => (
            <li key={j}>{inline(it)}</li>
          ))}
        </ol>,
      );
    } else if (line.startsWith("> ")) {
      blocks.push(
        <blockquote
          key={key++}
          className="mt-4 border-l-4 border-line pl-4 italic text-muted-foreground"
        >
          {inline(line.slice(2))}
        </blockquote>,
      );
      i++;
    } else {
      const para: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i])) {
        para.push(lines[i]);
        i++;
      }
      blocks.push(
        <p key={key++} className="mt-3 leading-relaxed text-muted-foreground">
          {inline(para.join(" "))}
        </p>,
      );
    }
  }

  return <div className="text-[15px]">{blocks}</div>;
}
