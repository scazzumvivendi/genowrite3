import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
export function useSystemTheme() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
}
