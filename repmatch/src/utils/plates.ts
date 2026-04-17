export const BAR_WEIGHT_LB = 45;

export interface Plate {
  weight: number;
  color: string;
  label: string;
  height: number;
  textColor: string;
}

export const PLATES: Plate[] = [
  { weight: 55, color: '#e63946', label: '55', height: 42, textColor: '#fff' },
  { weight: 45, color: '#3b82f6', label: '45', height: 38, textColor: '#fff' },
  { weight: 35, color: '#f4a261', label: '35', height: 32, textColor: '#1a1a1a' },
  { weight: 25, color: '#2a9d8f', label: '25', height: 26, textColor: '#fff' },
  { weight: 10, color: '#f5f5f5', label: '10', height: 18, textColor: '#1a1a1a' },
  { weight: 5, color: '#111113', label: '5', height: 16, textColor: '#fff' },
  { weight: 2.5, color: '#c0c4cc', label: '2.5', height: 12, textColor: '#1a1a1a' },
];

export function computePlatesPerSide(totalLb: number): Plate[] {
  if (totalLb <= BAR_WEIGHT_LB) return [];
  let remaining = (totalLb - BAR_WEIGHT_LB) / 2;
  const out: Plate[] = [];
  for (const p of PLATES) {
    while (remaining + 1e-9 >= p.weight) {
      out.push(p);
      remaining -= p.weight;
    }
  }
  return out;
}
