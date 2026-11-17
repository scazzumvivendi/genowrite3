import type { Counts } from './counts';

let snapshot: ReadonlyMap<string, Counts> = new Map();
const listeners = new Set<() => void>();
export function publishCounts(id: string, value: Counts) {
  snapshot = new Map(snapshot).set(id, value);
  listeners.forEach((listener) => listener());
}
export const subscribeCounts = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getLiveCounts = () => snapshot;
export function clearLiveCounts(id: string) {
  const next = new Map(snapshot);
  next.delete(id);
  snapshot = next;
  listeners.forEach((listener) => listener());
}
