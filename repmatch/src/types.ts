export interface LifterInput {
  id: string;
  name: string;
  weight: number | '';
  reps: number | '';
}

export interface LifterResult {
  id: string;
  name: string;
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
