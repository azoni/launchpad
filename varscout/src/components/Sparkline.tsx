/**
 * Minimal inline sparkline. Hand-rolled SVG rather than a charting library —
 * a tearsheet wants a hairline trace, and this keeps the bundle free of a
 * dependency whose default styling would fight the design.
 */
export function Sparkline({
  values,
  width = 120,
  height = 26,
  stroke = "var(--color-ink-2)",
  zeroLine = false,
  className = "",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  zeroLine?: boolean;
  className?: string;
}) {
  if (!values || values.length < 2) {
    return (
      <svg width={width} height={height} className={className} aria-hidden="true">
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--color-rule)"
          strokeDasharray="2 3"
        />
      </svg>
    );
  }

  const pad = 2;
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (zeroLine) {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  if (hi === lo) {
    hi = lo + 1e-9;
  }

  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => height - pad - ((v - lo) / (hi - lo)) * (height - pad * 2);
  const d = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");

  return (
    <svg
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={`Trend across ${values.length} readings`}
    >
      {zeroLine && lo < 0 && hi > 0 && (
        <line x1={0} y1={y(0)} x2={width} y2={y(0)} stroke="var(--color-rule-2)" strokeWidth={1} />
      )}
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.25} strokeLinejoin="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={1.9} fill="var(--color-rust)" />
    </svg>
  );
}
