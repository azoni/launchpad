type Face = 1 | 2 | 3 | 4 | 5 | 6;

const PIP_POSITIONS: Record<Face, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
};

function randomFace(): Face {
  return (Math.floor(Math.random() * 6) + 1) as Face;
}

function Die({ face, delay }: { face: Face; delay: number }) {
  return (
    <svg
      className="die"
      viewBox="0 0 100 100"
      style={{ animationDelay: `${delay}ms` }}
      aria-label={`die showing ${face}`}
    >
      <rect x={4} y={4} width={92} height={92} rx={18} fill="#fafafa" stroke="#38383f" strokeWidth={2} />
      {PIP_POSITIONS[face].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={8} fill="#1a1a1a" />
      ))}
    </svg>
  );
}

export default function Dice() {
  const [a, b] = [randomFace(), randomFace()];
  return (
    <div className="dice-container">
      <Die face={a} delay={0} />
      <Die face={b} delay={80} />
    </div>
  );
}
