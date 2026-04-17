export interface LifterInput {
  id: string;
  weight: number | '';
  reps: number | '';
}

export interface LifterResult {
  id: string;
  label: string;
  oneRepMax: number;
  targetWeight: number;
  targetWeightRounded: number;
  percentOfMax: number;
  color: string;
}

export interface RollResult {
  targetReps: number;
  lifters: LifterResult[];
}
