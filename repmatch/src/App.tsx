import { useState, useCallback } from 'react';
import type { LifterInput, RollResult } from './types';
import { calculate1RM, weightForReps, roundToNearest, randomRep, LIFTER_COLORS } from './utils/epley';
import Header from './components/Header';
import LifterForm from './components/LifterForm';
import ResultCard from './components/ResultCard';
import Footer from './components/Footer';
import './index.css';

let nextId = 1;
function makeLifter(): LifterInput {
  return { id: String(nextId++), name: '', weight: '', reps: '' };
}

export default function App() {
  const [lifters, setLifters] = useState<LifterInput[]>([makeLifter(), makeLifter()]);
  const [repMin, setRepMin] = useState<number | ''>(3);
  const [repMax, setRepMax] = useState<number | ''>(15);
  const [result, setResult] = useState<RollResult | null>(null);
  const [unit, setUnit] = useState<'lb' | 'kg'>('lb');

  const handleLifterChange = useCallback(
    (id: string, field: keyof LifterInput, value: string) => {
      setLifters((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l;
          if (field === 'name') return { ...l, name: value };
          if (field === 'weight' || field === 'reps') {
            return { ...l, [field]: value === '' ? '' : Number(value) };
          }
          return l;
        })
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
    const targetReps = randomRep(effectiveMin, effectiveMax);

    const validLifters = lifters.filter(
      (l) => typeof l.weight === 'number' && l.weight > 0 && typeof l.reps === 'number' && l.reps > 0
    );

    if (validLifters.length === 0) return;

    const lifterResults = validLifters.map((l, i) => {
      const w = l.weight as number;
      const r = l.reps as number;
      const oneRepMax = calculate1RM(w, r);
      const targetWeight = weightForReps(oneRepMax, targetReps);
      const targetWeightRounded = roundToNearest(targetWeight, 5);
      const percentOfMax = (targetWeight / oneRepMax) * 100;
      return {
        id: l.id,
        name: l.name || `Lifter ${i + 1}`,
        oneRepMax,
        targetWeight,
        targetWeightRounded,
        percentOfMax,
        color: LIFTER_COLORS[lifters.indexOf(l) % LIFTER_COLORS.length],
      };
    });

    setResult({ targetReps, lifters: lifterResults });
  }, [lifters, repMin, repMax]);

  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="container">
          <LifterForm
            lifters={lifters}
            repMin={repMin}
            repMax={repMax}
            onLifterChange={handleLifterChange}
            onAddLifter={handleAddLifter}
            onRemoveLifter={handleRemoveLifter}
            onRepMinChange={(v) => setRepMin(v === '' ? '' : Number(v))}
            onRepMaxChange={(v) => setRepMax(v === '' ? '' : Number(v))}
            onRoll={handleRoll}
            hasResult={result !== null}
          />
          {result && (
            <ResultCard result={result} unit={unit} onUnitChange={setUnit} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
