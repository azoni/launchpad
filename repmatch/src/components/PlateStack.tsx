import { BAR_WEIGHT_LB, computePlatesPerSide } from '../utils/plates';

interface Props {
  weightLb: number;
}

const PLATE_W = 12;
const PLATE_GAP = 2;
const BAR_STUB_W = 20;
const COLLAR_W = 6;
const SLEEVE_CAP_W = 4;
const HEIGHT = 44;
const BAR_THICKNESS = 6;
const COLLAR_THICKNESS = 10;

export default function PlateStack({ weightLb }: Props) {
  if (weightLb <= BAR_WEIGHT_LB) {
    return <div className="plate-stack-empty">Bar Only</div>;
  }

  const plates = computePlatesPerSide(weightLb);
  if (plates.length === 0) {
    return <div className="plate-stack-empty">Bar Only</div>;
  }

  const platesWidth = plates.length * PLATE_W + (plates.length - 1) * PLATE_GAP;
  const width = BAR_STUB_W + COLLAR_W + platesWidth + SLEEVE_CAP_W;
  const midY = HEIGHT / 2;
  const aria = `Per side: ${plates.map((p) => p.label).join(' + ')}`;

  return (
    <div className="plate-stack">
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role="img"
        aria-label={aria}
      >
        <rect
          x={0}
          y={midY - BAR_THICKNESS / 2}
          width={BAR_STUB_W}
          height={BAR_THICKNESS}
          fill="#6b6b72"
          rx={1}
        />
        <rect
          x={BAR_STUB_W}
          y={midY - COLLAR_THICKNESS / 2}
          width={COLLAR_W}
          height={COLLAR_THICKNESS}
          fill="#8a8a95"
          rx={1}
        />

        {plates.map((p, i) => {
          const x = BAR_STUB_W + COLLAR_W + i * (PLATE_W + PLATE_GAP);
          const y = midY - p.height / 2;
          const fontSize = p.label.length > 2 ? 6.5 : 8.5;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={PLATE_W}
                height={p.height}
                rx={2}
                fill={p.color}
                stroke="rgba(0,0,0,0.25)"
                strokeWidth={0.5}
              />
              <text
                x={x + PLATE_W / 2}
                y={midY + fontSize / 3}
                textAnchor="middle"
                fontFamily="Oswald, sans-serif"
                fontSize={fontSize}
                fontWeight={700}
                fill={p.textColor}
              >
                {p.label}
              </text>
            </g>
          );
        })}

        <rect
          x={BAR_STUB_W + COLLAR_W + platesWidth}
          y={midY - BAR_THICKNESS / 2}
          width={SLEEVE_CAP_W}
          height={BAR_THICKNESS}
          fill="#6b6b72"
          rx={1}
        />
      </svg>
    </div>
  );
}
