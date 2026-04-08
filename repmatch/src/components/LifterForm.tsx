import type { LifterInput } from '../types';
import LifterRow from './LifterRow';

interface Props {
  lifters: LifterInput[];
  repMin: number | '';
  repMax: number | '';
  onLifterChange: (id: string, field: keyof LifterInput, value: string) => void;
  onAddLifter: () => void;
  onRemoveLifter: (id: string) => void;
  onRepMinChange: (value: string) => void;
  onRepMaxChange: (value: string) => void;
  onRoll: () => void;
  hasResult: boolean;
}

export default function LifterForm({
  lifters,
  repMin,
  repMax,
  onLifterChange,
  onAddLifter,
  onRemoveLifter,
  onRepMinChange,
  onRepMaxChange,
  onRoll,
  hasResult,
}: Props) {
  return (
    <div className="card lifter-section">
      <p className="section-label">Lifters</p>
      {lifters.map((lifter, i) => (
        <LifterRow
          key={lifter.id}
          lifter={lifter}
          index={i}
          canRemove={lifters.length > 1}
          onChange={onLifterChange}
          onRemove={onRemoveLifter}
        />
      ))}

      <div className="form-actions">
        {lifters.length < 5 && (
          <button className="btn btn-ghost" onClick={onAddLifter}>
            + Add Lifter
          </button>
        )}
      </div>

      <p className="section-label">Rep Range</p>
      <div className="range-row">
        <div className="input-range">
          <input
            type="number"
            placeholder="Min"
            inputMode="numeric"
            min={1}
            value={repMin}
            onChange={(e) => onRepMinChange(e.target.value)}
          />
        </div>
        <span>to</span>
        <div className="input-range">
          <input
            type="number"
            placeholder="Max"
            inputMode="numeric"
            min={1}
            value={repMax}
            onChange={(e) => onRepMaxChange(e.target.value)}
          />
        </div>
        <span>reps</span>
      </div>

      <div className="roll-btn-wrap">
        <button className="btn btn-primary btn-roll" onClick={onRoll}>
          {hasResult ? 'Re-roll' : 'Roll'}
        </button>
      </div>
    </div>
  );
}
