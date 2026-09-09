import { lazy, Suspense } from 'react';
import { MapPage } from '@/pages/Map';
import { usePointerTracking } from '@/hooks/usePointer';

// leva + r3f-perf solo en desarrollo (no entran al bundle de producción)
const DebugUI = import.meta.env.DEV
  ? lazy(() => import('@/components/ui/Debug').then((m) => ({ default: m.DebugUI })))
  : () => null;

export default function App() {
  usePointerTracking();

  return (
    <>
      <MapPage />
      <Suspense fallback={null}>
        <DebugUI />
      </Suspense>
    </>
  );
}
