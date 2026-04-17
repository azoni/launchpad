import type { LifterInput } from '../types';
import LifterRow from './LifterRow';

interface Props {
  lifters: LifterInput[];
  repMin: number | '';
  repMax: number | '';
  numOptions: number;
  onLifterChange: (id: string, field: 'weight' | 'reps', value: string) => void;
  onAddLifter: () => void;
  onRemoveLifter: (id: string) => void;
  onRepMinChange: (value: string) => void;
  onRepMaxChange: (value: string) => void;
  onNumOptionsChange: (n: number) => void;
  onRoll: () => void;
  hasResult: boolean;
}

export default function LifterForm({
  lifters,
  repMin,
  repMax,
  numOptions,
  onLifterChange,
  onAddLifter,
  onRemoveLifter,
  onRepMinChange,
  onRepMaxChange,
  onNumOptionsChange,
  onRoll,
  hasResult,
}: Props) {
  return (
    <div className="card lifter-section">
      <div className="section-row">
        <p className="section-label">Lifters</p>
        {lifters.length < 5 && (
          <button className="btn btn-ghost" onClick={onAddLifter}>+ Add</button>
        )}
      </div>
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

      <div className="range-row">
        <p className="section-label">Range</p>
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

      <div className="options-row">
        <p className="section-label">Options</p>
        <div className="options-pills">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={`pill ${numOptions === n ? 'active' : ''}`}
              onClick={() => onNumOptionsChange(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary btn-roll" onClick={onRoll}>
        {hasResult ? 'Re-roll' : 'Roll'}
      </button>
    </div>
  );
}
