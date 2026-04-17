import type { RollResult } from '../types';
import PlateStack from './PlateStack';

interface Props {
  result: RollResult;
  unit: 'lb' | 'kg';
  onUnitChange: (unit: 'lb' | 'kg') => void;
  include55: boolean;
}

export default function ResultCard({ result, unit, onUnitChange, include55 }: Props) {
  const formatWeight = (weightLb: number) => {
    if (unit === 'kg') {
      const kg = weightLb * 0.4536;
      return Math.round(kg / 2.5) * 2.5;
    }
    return weightLb;
  };

  const u = unit;

  return (
    <div className="card result-section">
      <div className="result-header">
        <div className="result-reps animate-in">{result.targetReps}</div>
        <div className="result-reps-label">reps</div>
        {result.targetReps > 20 && (
          <p className="result-disclaimer">Estimates less precise above 20 reps</p>
        )}
      </div>

      <ul className="result-list">
        {result.lifters.map((l, i) => (
          <li
            key={l.id}
            className="result-lifter animate-in"
            style={{
              borderLeftColor: l.color,
              animationDelay: `${i * 0.06}s`,
            }}
          >
            <span className="result-lifter-label" style={{ color: l.color }}>{l.label}</span>
            <span className="result-lifter-weight">
              {formatWeight(l.targetWeightRounded)} <small>{u}</small>
            </span>
            {unit === 'lb' && <PlateStack weightLb={l.targetWeightRounded} include55={include55} />}
            <span className="result-lifter-meta">
              {l.percentOfMax.toFixed(0)}% &middot; {formatWeight(Math.round(l.oneRepMax))} {u} max
            </span>
          </li>
        ))}
      </ul>

      <div className="result-actions">
        <div className="unit-toggle">
          <button
            className={unit === 'lb' ? 'active' : ''}
            onClick={() => onUnitChange('lb')}
          >
            lb
          </button>
          <button
            className={unit === 'kg' ? 'active' : ''}
            onClick={() => onUnitChange('kg')}
          >
            kg
          </button>
        </div>
      </div>
    </div>
  );
}
