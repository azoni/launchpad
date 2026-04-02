import { useRef, useCallback } from 'react';

export default function ResultCard({ result, onReset }) {
  const cardRef = useRef(null);

  const copyText = useCallback(() => {
    const text = `Benchmark\n"${result.normalized_input}"\n${result.bench_estimate} lbs\n"${result.explanation}"`;
    navigator.clipboard.writeText(text).catch(() => {});
  }, [result]);

  const shareResult = useCallback(async () => {
    const text = `Benchmark: "${result.normalized_input}" = ${result.bench_estimate} lbs. ${result.explanation}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Benchmark', text });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }, [result]);

  const downloadImage = useCallback(async () => {
    const card = cardRef.current;
    if (!card) return;

    // Dynamic import for html2canvas-style approach using canvas API
    try {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = 600 * scale;
      canvas.height = 400 * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      // Draw card background
      ctx.fillStyle = '#1a1a2e';
      roundRect(ctx, 0, 0, 600, 400, 16);
      ctx.fill();

      // Border
      ctx.strokeStyle = '#2a2a4a';
      ctx.lineWidth = 2;
      roundRect(ctx, 1, 1, 598, 398, 16);
      ctx.stroke();

      // Title
      ctx.fillStyle = '#6c63ff';
      ctx.font = 'bold 18px Inter, system-ui, sans-serif';
      ctx.fillText('Benchmark', 40, 50);

      // Input text
      ctx.fillStyle = '#aaa';
      ctx.font = '16px Inter, system-ui, sans-serif';
      const inputText = `"${result.normalized_input}"`;
      wrapText(ctx, inputText, 40, 90, 520, 22);

      // Bench number
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 72px Inter, system-ui, sans-serif';
      ctx.fillText(`${result.bench_estimate}`, 40, 210);

      // "lbs" label
      ctx.fillStyle = '#6c63ff';
      ctx.font = 'bold 28px Inter, system-ui, sans-serif';
      const numWidth = ctx.measureText(`${result.bench_estimate}`).width;
      ctx.font = 'bold 72px Inter, system-ui, sans-serif';
      const bigNumWidth = ctx.measureText(`${result.bench_estimate}`).width;
      ctx.font = 'bold 28px Inter, system-ui, sans-serif';
      ctx.fillText('lbs', 40 + bigNumWidth + 12, 210);

      // Explanation
      ctx.fillStyle = '#ccc';
      ctx.font = '15px Inter, system-ui, sans-serif';
      wrapText(ctx, `"${result.explanation}"`, 40, 260, 520, 22);

      // Domain tag
      ctx.fillStyle = '#2a2a4a';
      roundRect(ctx, 40, 320, ctx.measureText(result.domain).width + 24, 32, 8);
      ctx.fill();
      ctx.fillStyle = '#888';
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.fillText(result.domain, 52, 341);

      // Watermark
      ctx.fillStyle = '#444';
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillText('benchmarkapp.netlify.app', 40, 380);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `benchmark-${result.bench_estimate}lbs.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Image generation failed:', err);
    }
  }, [result]);

  // Strength tier label
  const tier = getTier(result.bench_estimate);

  return (
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
        <button className="btn btn-ghost" onClick={copyText}>
          Copy
        </button>
        <button className="btn btn-ghost" onClick={shareResult}>
          Share
        </button>
        <button className="btn btn-ghost" onClick={downloadImage}>
          Download
        </button>
      </div>
    </div>
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

// Canvas helpers
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
