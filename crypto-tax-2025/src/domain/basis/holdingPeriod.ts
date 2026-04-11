// Short-term vs long-term holding period (US tax rule: > 1 year = long-term).
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function holdingPeriod(acquiredAt: number, soldAt: number): "short" | "long" {
  return soldAt - acquiredAt > ONE_YEAR_MS ? "long" : "short";
}
