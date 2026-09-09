import { useAppStore } from '@/store/useAppStore';

/**
 * Progreso de scroll global 0..1 como valor reactivo de React.
 *
 * OJO: dispara re-render en cada cambio de scroll. Para usar el scroll dentro
 * de un `useFrame` de R3F (sin re-renders) leé `useAppStore.getState().scroll`.
 */
export function useScrollProgress(): number {
  return useAppStore((s) => s.scroll);
}
