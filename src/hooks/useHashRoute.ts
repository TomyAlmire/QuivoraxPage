import { useEffect } from 'react';
import { useMapStore } from '@/store/useMapStore';
import { NODE_BY_ID, type BranchId } from '@/data/map';

const BRANCH_IDS: BranchId[] = ['sistemas', 'ciber', 'web'];

function parseHash(hash: string): { branch: BranchId | null; node: string | null } {
  // formatos: #/  ·  #/sistemas  ·  #/web/web-frontend  ·  #/trabajemos
  const path = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (path.length === 0) return { branch: null, node: null };

  const [a, b] = path;
  if (BRANCH_IDS.includes(a as BranchId)) {
    if (b && NODE_BY_ID[b]) return { branch: a as BranchId, node: b };
    return { branch: a as BranchId, node: null };
  }
  if (NODE_BY_ID[a]) {
    const n = NODE_BY_ID[a];
    return { branch: n.branch, node: n.kind === 'core' ? null : a };
  }
  return { branch: null, node: null };
}

export function routeToHash(branch: BranchId | null, node: string | null): string {
  if (node) {
    const n = NODE_BY_ID[node];
    return n?.branch ? `#/${n.branch}/${node}` : `#/${node}`;
  }
  if (branch) return `#/${branch}`;
  return '#/';
}

/**
 * Sincroniza el hash de la URL con el store del mapa en ambas direcciones.
 * Montar una sola vez.
 */
export function useHashRoute(): void {
  const applyRoute = useMapStore((s) => s.applyRoute);

  // hash → store
  useEffect(() => {
    const sync = () => applyRoute(parseHash(window.location.hash));
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [applyRoute]);

  // store → hash
  useEffect(() => {
    return useMapStore.subscribe((s) => {
      if (s.mode === 'intro') return;
      const next = routeToHash(s.branch, s.node);
      if (window.location.hash !== next) {
        window.history.replaceState(null, '', next);
      }
    });
  }, []);
}
