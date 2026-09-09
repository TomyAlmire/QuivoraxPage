/**
 * Estado del mapa Quivorax.
 *
 * Máquina de estados: intro → map → branch → node
 *  - intro:  apertura, la cámara entra. Pasa a `map` sola.
 *  - map:    se ven las 3 ramas, orbit suave.
 *  - branch: foco en una rama (las otras se atenúan).
 *  - node:   foco en un nodo hoja, con panel de detalle abierto.
 *
 * El hash de la URL es la fuente de verdad de la navegación
 * (ver hooks/useHashRoute.ts). Este store guarda el estado derivado + hover.
 */
import { create } from 'zustand';
import type { BranchId } from '@/data/map';
import { NODE_BY_ID } from '@/data/map';

export type MapMode = 'intro' | 'map' | 'branch' | 'node';

interface MapState {
  mode: MapMode;
  branch: BranchId | null;
  node: string | null;
  hovered: string | null;
  /** el usuario tomó control de la órbita → frenamos la rotación automática */
  userControlled: boolean;

  setHovered: (id: string | null) => void;
  setUserControlled: (v: boolean) => void;

  /** Navegación de alto nivel (también actualiza el hash vía useHashRoute) */
  goMap: () => void;
  goBranch: (branch: BranchId) => void;
  goNode: (nodeId: string) => void;
  finishIntro: () => void;

  /** Aplica un estado que viene del hash (sin volver a escribir el hash) */
  applyRoute: (route: { branch: BranchId | null; node: string | null }) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  mode: 'intro',
  branch: null,
  node: null,
  hovered: null,
  userControlled: false,

  setHovered: (hovered) => set({ hovered }),
  setUserControlled: (userControlled) => set({ userControlled }),

  goMap: () => set({ mode: 'map', branch: null, node: null }),

  goBranch: (branch) => set({ mode: 'branch', branch, node: null, userControlled: false }),

  goNode: (nodeId) => {
    const n = NODE_BY_ID[nodeId];
    if (!n) return;
    // Un core abre su rama; una hoja/contacto abre el panel
    if (n.kind === 'core' && n.branch) {
      set({ mode: 'branch', branch: n.branch, node: null, userControlled: false });
    } else {
      set({ mode: 'node', node: nodeId, branch: n.branch ?? get().branch, userControlled: false });
    }
  },

  finishIntro: () => {
    if (get().mode === 'intro') set({ mode: 'map' });
  },

  applyRoute: ({ branch, node }) => {
    if (node) {
      const n = NODE_BY_ID[node];
      set({ mode: 'node', node, branch: n?.branch ?? branch });
    } else if (branch) {
      set({ mode: 'branch', branch, node: null });
    } else {
      set((s) => ({ mode: s.mode === 'intro' ? 'intro' : 'map', branch: null, node: null }));
    }
  },
}));
