const STORAGE_KEY = 'benchmark_history';
const MAX_ITEMS = 20;

export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(result) {
  const history = getHistory();
  // Avoid duplicates based on normalized_input
  const filtered = history.filter(
    (item) => item.normalized_input !== result.normalized_input
  );
  filtered.unshift(result);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
