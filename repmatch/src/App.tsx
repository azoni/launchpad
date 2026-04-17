import { useState, useCallback, useRef, useEffect } from 'react';
import type { LifterInput, RollResult } from './types';
import { calculate1RM, weightForReps, roundToNearest, randomRep, LIFTER_COLORS, LIFTER_LABELS } from './utils/epley';
import Header from './components/Header';
import LifterForm from './components/LifterForm';
import ResultCard from './components/ResultCard';
import Dice from './components/Dice';
import Footer from './components/Footer';
import './index.css';

const ROLL_DELAY_MS = 750;

let nextId = 1;
function makeLifter(): LifterInput {
  return { id: String(nextId++), weight: '', reps: '' };
}

function generateUniqueReps(min: number, max: number, count: number): number[] {
  const range = max - min + 1;
  const n = Math.min(count, range);
  const reps = new Set<number>();
  while (reps.size < n) {
    reps.add(randomRep(min, max));
  }
  return Array.from(reps).sort((a, b) => a - b);
}

export default function App() {
  const [lifters, setLifters] = useState<LifterInput[]>([makeLifter(), makeLifter()]);
  const [repMin, setRepMin] = useState<number | ''>(3);
  const [repMax, setRepMax] = useState<number | ''>(15);
  const [numOptions, setNumOptions] = useState<number>(1);
  const [results, setResults] = useState<RollResult[]>([]);
  const [unit, setUnit] = useState<'lb' | 'kg'>('lb');
  const [isRolling, setIsRolling] = useState(false);
  const [rollSeed, setRollSeed] = useState(0);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    };
  }, []);

  const handleLifterChange = useCallback(
    (id: string, field: 'weight' | 'reps', value: string) => {
      setLifters((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, [field]: value === '' ? '' : Number(value) } : l
        )
      );
    },
    []
  );

  const handleAddLifter = useCallback(() => {
    setLifters((prev) => (prev.length < 5 ? [...prev, makeLifter()] : prev));
  }, []);

  const handleRemoveLifter = useCallback((id: string) => {
    setLifters((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }, []);

  const handleRoll = useCallback(() => {
    const min = typeof repMin === 'number' ? repMin : 3;
    const max = typeof repMax === 'number' ? repMax : 15;
    const effectiveMin = Math.max(1, Math.min(min, max));
    const effectiveMax = Math.max(min, max);

    const validLifters = lifters.filter(
      (l) => typeof l.weight === 'number' && l.weight > 0
    );
    if (validLifters.length === 0) return;

    const repTargets = generateUniqueReps(effectiveMin, effectiveMax, numOptions);

    const rollResults = repTargets.map((targetReps) => {
      const lifterResults = validLifters.map((l) => {
        const idx = lifters.indexOf(l);
        const w = l.weight as number;
        const r = typeof l.reps === 'number' && l.reps > 0 ? l.reps : 1;
        const oneRepMax = calculate1RM(w, r);
        const targetWeight = weightForReps(oneRepMax, targetReps);
        const targetWeightRounded = roundToNearest(targetWeight, 5);
        const percentOfMax = (targetWeight / oneRepMax) * 100;
        return {
          id: l.id,
          label: LIFTER_LABELS[idx % LIFTER_LABELS.length],
          oneRepMax,
          targetWeight,
          targetWeightRounded,
          percentOfMax,
          color: LIFTER_COLORS[idx % LIFTER_COLORS.length],
        };
      });
      return { targetReps, lifters: lifterResults };
    });

    setResults([]);
    setIsRolling(true);
    setRollSeed((s) => s + 1);
    if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    rollTimerRef.current = setTimeout(() => {
      setResults(rollResults);
      setIsRolling(false);
    }, ROLL_DELAY_MS);
  }, [lifters, repMin, repMax, numOptions]);

  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="container">
          <LifterForm
            lifters={lifters}
            repMin={repMin}
            repMax={repMax}
            numOptions={numOptions}
            onLifterChange={handleLifterChange}
            onAddLifter={handleAddLifter}
            onRemoveLifter={handleRemoveLifter}
            onRepMinChange={(v) => setRepMin(v === '' ? '' : Number(v))}
            onRepMaxChange={(v) => setRepMax(v === '' ? '' : Number(v))}
            onNumOptionsChange={setNumOptions}
            onRoll={handleRoll}
            hasResult={results.length > 0 || isRolling}
          />
          {isRolling && (
            <div className="rolling-section">
              <Dice key={rollSeed} />
            </div>
          )}
          {results.map((r) => (
            <ResultCard key={r.targetReps} result={r} unit={unit} onUnitChange={setUnit} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
