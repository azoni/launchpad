import type { RollResult } from '../types';

interface Props {
  result: RollResult;
  unit: 'lb' | 'kg';
  onUnitChange: (unit: 'lb' | 'kg') => void;
}

export default function ResultCard({ result, unit, onUnitChange }: Props) {
  const formatWeight = (weightLb: number) => {
    if (unit === 'kg') {
      const kg = weightLb * 0.4536;
      return Math.round(kg / 2.5) * 2.5;
    }
    return weightLb;
  };

  const unitLabel = unit === 'lb' ? 'lb' : 'kg';

  return (
    <div className="card result-section">
      <div className="result-header">
        <div className="result-reps-label">Do this many</div>
        <div className="result-reps animate-in">{result.targetReps}</div>
        <div className="result-reps-label">reps</div>
        {result.targetReps > 20 && (
          <p className="result-disclaimer">
            Estimates less precise above 20 reps
          </p>
        )}
      </div>

      <div className="onerm-summary">
        {result.lifters.map((l) => (
          <span key={l.id} className="onerm-item">
            <span className="onerm-dot" style={{ background: l.color }} />
            {l.name}: {formatWeight(Math.round(l.oneRepMax))} {unitLabel} 1RM
          </span>
        ))}
      </div>

      <ul className="result-list">
        {result.lifters.map((l, i) => (
          <li
            key={l.id}
            className="result-lifter animate-in"
            style={{
              borderLeftColor: l.color,
              animationDelay: `${i * 0.08}s`,
            }}
          >
            <span className="result-lifter-name">{l.name}</span>
            <span className="result-lifter-right">
              <span className="result-lifter-weight">
                {formatWeight(l.targetWeightRounded)} {unitLabel}
              </span>
              <span className="result-lifter-percent">
                {l.percentOfMax.toFixed(0)}%
              </span>
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
