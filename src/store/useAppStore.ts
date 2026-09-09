/**
 * Estado global mínimo, compartido entre el DOM (React) y la escena (R3F).
 *
 * Regla: acá va SOLO lo que de verdad tienen que compartir la UI 2D y el canvas
 * (progreso de scroll, si terminó de cargar, calidad, puntero). Todo lo demás
 * vive en estado local del componente.
 *
 * Nota de performance: leer del store dentro del `useFrame` de R3F NO dispara
 * re-renders de React si usás `useAppStore.getState()` o un selector estable.
 */
import { create } from 'zustand';
import { getDeviceProfile, type DeviceProfile, type QualityTier } from '@/lib/device';

interface AppState {
  /** Assets cargados y primera escena lista */
  ready: boolean;
  setReady: (ready: boolean) => void;

  /** Progreso de carga 0..1 (drei useProgress) */
  progress: number;
  setProgress: (progress: number) => void;

  /** Progreso de scroll global 0..1 (lo alimenta Lenis) */
  scroll: number;
  setScroll: (scroll: number) => void;

  /** Puntero normalizado -1..1 (x derecha, y arriba). Suavizado en el hook. */
  pointer: { x: number; y: number };
  setPointer: (x: number, y: number) => void;

  /** Perfil de dispositivo y overrides manuales de calidad */
  device: DeviceProfile;
  qualityOverride: QualityTier | null;
  setQualityOverride: (tier: QualityTier | null) => void;
  /** Tier efectivo (override o el detectado) */
  quality: () => QualityTier;
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  setReady: (ready) => set({ ready }),

  progress: 0,
  setProgress: (progress) => set({ progress }),

  scroll: 0,
  setScroll: (scroll) => set({ scroll }),

  pointer: { x: 0, y: 0 },
  setPointer: (x, y) => set({ pointer: { x, y } }),

  device: getDeviceProfile(),
  qualityOverride: null,
  setQualityOverride: (qualityOverride) => set({ qualityOverride }),
  quality: () => get().qualityOverride ?? get().device.tier,
}));
