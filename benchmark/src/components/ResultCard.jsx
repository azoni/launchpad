import { useRef, useState, useCallback } from 'react';

export default function ResultCard({ result, onReset }) {
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const shareResult = useCallback(async () => {
    try {
      const blob = await renderCardToBlob(result);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);

      // Copy to clipboard in background
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {
        // Clipboard failed but preview still shows
      }
    } catch {
      const text = `Benchmark: "${result.normalized_input}" = ${result.bench_estimate} lbs. ${result.explanation}\n\nbenchmark-app-azoni.netlify.app`;
      navigator.clipboard.writeText(text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const copyImage = useCallback(async () => {
    if (!previewUrl) return;
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback
    }
  }, [previewUrl]);

  const closePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setCopied(false);
    }
  }, [previewUrl]);

  const tier = getTier(result.bench_estimate);

  return (
    <>
      <div className="result-card fade-in" ref={cardRef}>
        <div className="result-header">
          <span className="result-label">Benchmark</span>
          <span className="result-domain">{result.domain}</span>
        </div>

        <p className="result-input">"{result.normalized_input}"</p>

        <div className="result-number">
          <span className="result-lbs">{result.bench_estimate}</span>
          <span className="result-unit">lbs</span>
        </div>

        <div className="result-tier">{tier}</div>

        <p className="result-explanation">"{result.explanation}"</p>

        <div className="result-stats">
          <StatBar label="Prestige" value={result.prestige} />
          <StatBar label="Physicality" value={result.physicality} />
          <StatBar label="Competitive" value={result.competitiveness} />
          <StatBar label="Discipline" value={result.discipline} />
        </div>

        <div className="result-actions">
          <button className="btn btn-secondary" onClick={onReset}>
            Try another
          </button>
          <button
            className={`btn btn-share${copied ? ' copied' : ''}`}
            onClick={shareResult}
          >
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>

      {previewUrl && (
        <div className="share-overlay" onClick={closePreview}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <img src={previewUrl} alt="Share card" className="share-preview" />
            <div className="share-actions">
              <button
                className={`btn btn-copy-image${copied ? ' copied' : ''}`}
                onClick={copyImage}
              >
                {copied ? 'Copied!' : 'Copy Image'}
              </button>
              <button className="btn btn-ghost" onClick={closePreview}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatBar({ label, value }) {
  const pct = (value / 10) * 100;
  return (
    <div className="stat-bar">
      <div className="stat-bar-header">
        <span className="stat-bar-label">{label}</span>
        <span className="stat-bar-value">{value}/10</span>
      </div>
      <div className="stat-bar-track">
        <div className="stat-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function getTier(lbs) {
  if (lbs >= 355) return 'Elite';
  if (lbs >= 295) return 'Advanced';
  if (lbs >= 225) return 'Intermediate';
  if (lbs >= 185) return 'Novice+';
  return 'Beginner';
}

const SITE_URL = 'benchmark-app-azoni.netlify.app';

/** Render the result as a PNG blob using Canvas */
async function renderCardToBlob(result) {
  const canvas = document.createElement('canvas');
  const scale = 2;
  const W = 600;
  const H = 420;
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = '#1a1917';
  roundRect(ctx, 0, 0, W, H, 16);
  ctx.fill();

  // Top accent stripe
  ctx.fillStyle = '#ff6b35';
  ctx.fillRect(0, 0, W, 3);

  // Border
  ctx.strokeStyle = '#33322e';
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, W - 2, H - 2, 16);
  ctx.stroke();

  // "BENCHMARK" label
  ctx.fillStyle = '#ff6b35';
  ctx.font = '500 13px "DM Mono", monospace';
  ctx.fillText('BENCHMARK', 36, 42);

  // Domain tag
  ctx.font = '12px "DM Mono", monospace';
  const domainWidth = ctx.measureText(result.domain).width;
  ctx.fillStyle = '#242320';
  roundRect(ctx, W - 36 - domainWidth - 16, 28, domainWidth + 16, 22, 4);
  ctx.fill();
  ctx.fillStyle = '#5e5b53';
  ctx.fillText(result.domain, W - 36 - domainWidth - 8, 43);

  // Input text
  ctx.fillStyle = '#9e9a8f';
  ctx.font = '500 15px "Plus Jakarta Sans", system-ui, sans-serif';
  wrapText(ctx, `"${result.normalized_input}"`, 36, 80, W - 72, 21);

  // Big number
  ctx.fillStyle = '#f5f0e8';
  ctx.font = '800 80px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`${result.bench_estimate}`, 36, 195);

  // "lbs"
  const numW = ctx.measureText(`${result.bench_estimate}`).width;
  ctx.fillStyle = '#ff6b35';
  ctx.font = '700 30px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('lbs', 36 + numW + 10, 195);

  // Tier
  ctx.fillStyle = '#ffc233';
  ctx.font = '500 11px "DM Mono", monospace';
  ctx.fillText(getTier(result.bench_estimate).toUpperCase(), 36, 220);

  // Explanation
  ctx.fillStyle = '#9e9a8f';
  ctx.font = '500 14px "Plus Jakarta Sans", system-ui, sans-serif';
  wrapText(ctx, `"${result.explanation}"`, 36, 255, W - 72, 20);

  // Bottom bar with site branding
  ctx.fillStyle = '#141210';
  roundRect(ctx, 0, H - 52, W, 52, 0);
  ctx.fill();
  // Re-draw bottom corners
  ctx.fillStyle = '#141210';
  roundRect(ctx, 0, H - 52, W, 52, 16);
  ctx.fill();
  // Separator line
  ctx.strokeStyle = '#33322e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, H - 52);
  ctx.lineTo(W, H - 52);
  ctx.stroke();

  // Site URL - prominent
  ctx.fillStyle = '#ff6b35';
  ctx.font = '600 14px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(SITE_URL, 36, H - 24);

  // "Try yours" CTA
  ctx.fillStyle = '#5e5b53';
  ctx.font = '500 12px "Plus Jakarta Sans", system-ui, sans-serif';
  const ctaText = 'Try yours →';
  const ctaW = ctx.measureText(ctaText).width;
  ctx.fillText(ctaText, W - 36 - ctaW, H - 24);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, curY);
      line = word + ' ';
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}
