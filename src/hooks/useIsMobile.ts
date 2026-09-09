import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 768px), (pointer: coarse)';

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(QUERY).matches;
}

/** `true` en viewports chicos o punteros táctiles. Reactivo a cambios de tamaño. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
