// Reactive localStorage store. Mirrors just enough of Firestore's
// subscription pattern (onSnapshot-like) so the existing hooks work
// without modification beyond checking guest mode.
//
// Each "collection" is a localStorage key holding a JSON array.
// Subscribers get notified on any write to that collection.

type Listener<T> = (items: T[]) => void;

const PREFIX = "ct25_";
const listeners = new Map<string, Set<Listener<unknown>>>();

function key(collection: string) {
  return `${PREFIX}${collection}`;
}

function read<T>(collection: string): T[] {
  try {
    const raw = localStorage.getItem(key(collection));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(collection: string, items: T[]) {
  localStorage.setItem(key(collection), JSON.stringify(items));
  notify(collection, items);
}

function notify<T>(collection: string, items: T[]) {
  const set = listeners.get(collection);
  if (set) for (const cb of set) cb(items);
}

// --- Public API ---

export function localList<T extends { id: string }>(collection: string): T[] {
  return read<T>(collection);
}

export function localSubscribe<T extends { id: string }>(
  collection: string,
  cb: Listener<T>
): () => void {
  if (!listeners.has(collection)) listeners.set(collection, new Set());
  const set = listeners.get(collection)!;
  const wrapped = cb as Listener<unknown>;
  set.add(wrapped);
  // Emit current state immediately (like Firestore onSnapshot)
  cb(read<T>(collection));
  return () => {
    set.delete(wrapped);
  };
}

export function localSet<T extends { id: string }>(collection: string, item: T) {
  const items = read<T>(collection);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) items[idx] = item;
  else items.push(item);
  write(collection, items);
}

export function localBulkSet<T extends { id: string }>(collection: string, newItems: T[]) {
  const items = read<T>(collection);
  for (const ni of newItems) {
    const idx = items.findIndex((i) => i.id === ni.id);
    if (idx >= 0) items[idx] = ni;
    else items.push(ni);
  }
  write(collection, items);
}

export function localDelete(collection: string, id: string) {
  const items = read<{ id: string }>(collection);
  write(
    collection,
    items.filter((i) => i.id !== id)
  );
}

export function localUpdate<T extends { id: string }>(
  collection: string,
  id: string,
  patch: Partial<T>
) {
  const items = read<T>(collection);
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) {
    items[idx] = { ...items[idx], ...patch };
    write(collection, items);
  }
}

export function localReplaceAll<T extends { id: string }>(collection: string, items: T[]) {
  write(collection, items);
}

export function localClearCollection(collection: string) {
  write(collection, []);
}
