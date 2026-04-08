import type { LifterInput } from '../types';
import { LIFTER_COLORS } from '../utils/epley';

interface Props {
  lifter: LifterInput;
  index: number;
  canRemove: boolean;
  onChange: (id: string, field: keyof LifterInput, value: string) => void;
  onRemove: (id: string) => void;
}

export default function LifterRow({ lifter, index, canRemove, onChange, onRemove }: Props) {
  const color = LIFTER_COLORS[index % LIFTER_COLORS.length];

  return (
    <div className="lifter-row">
      <span className="lifter-color-dot" style={{ background: color }} />
      <div className="input-name">
        <input
          type="text"
          placeholder={`Lifter ${index + 1}`}
          value={lifter.name}
          onChange={(e) => onChange(lifter.id, 'name', e.target.value)}
        />
      </div>
      <div className="input-weight">
        <input
          type="number"
          placeholder="Weight"
          inputMode="decimal"
          min={0}
          value={lifter.weight}
          onChange={(e) => onChange(lifter.id, 'weight', e.target.value)}
        />
      </div>
      <span className="input-x">&times;</span>
      <div className="input-reps">
        <input
          type="number"
          placeholder="Reps"
          inputMode="numeric"
          min={1}
          max={100}
          value={lifter.reps}
          onChange={(e) => onChange(lifter.id, 'reps', e.target.value)}
        />
      </div>
      {canRemove && (
        <button
          className="btn-remove"
          onClick={() => onRemove(lifter.id)}
          aria-label="Remove lifter"
        >
          &times;
        </button>
      )}
    </div>
  );
}
