/**
 * Epley formula — most common 1RM estimator.
 * 1RM = weight × (1 + reps / 30)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Inverse Epley — weight needed for a target rep count at a given 1RM.
 * weight = 1RM / (1 + targetReps / 30)
 */
export function weightForReps(oneRepMax: number, targetReps: number): number {
  if (targetReps <= 0 || oneRepMax <= 0) return 0;
  if (targetReps === 1) return oneRepMax;
  return oneRepMax / (1 + targetReps / 30);
}

/** Round to nearest increment (5 lb or 2.5 kg). */
export function roundToNearest(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

/** Pick one random integer in [min, max] inclusive. */
export function randomRep(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Lifter labels. */
export const LIFTER_LABELS = ['A', 'B', 'C', 'D', 'E'];

/** Lifter colors — persistent by index. */
export const LIFTER_COLORS = [
  '#e63946', // red
  '#f4a261', // amber
  '#2a9d8f', // teal
  '#a855f7', // purple
  '#3b82f6', // blue
];
