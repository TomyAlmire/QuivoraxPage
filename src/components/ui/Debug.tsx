import { Leva, useControls } from 'leva';
import { Perf } from 'r3f-perf';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { QualityTier } from '@/lib/device';

/**
 * Panel de debug. Este módulo se carga SOLO con lazy() cuando `import.meta.env.DEV`
 * es true (ver App.tsx / PlaygroundScene.tsx), así que en `npm run build` ni leva
 * ni r3f-perf entran al bundle.
 */
export function DebugUI() {
  const setQualityOverride = useAppStore((s) => s.setQualityOverride);
  const device = useAppStore((s) => s.device);

  const { quality } = useControls('quivorax', {
    quality: {
      value: 'auto',
      options: ['auto', 'low', 'mid', 'high'],
      label: 'quality tier',
    },
    detected: {
      value: `${device.tier} · ${device.isMobile ? 'mobile' : 'desktop'} · dpr≤${device.dprMax}`,
      editable: false,
    },
    particles: { value: device.particleBudget, editable: false },
  });

  useEffect(() => {
    setQualityOverride(quality === 'auto' ? null : (quality as QualityTier));
  }, [quality, setQualityOverride]);

  return <Leva collapsed titleBar={{ title: 'quivorax · debug' }} />;
}

/** Monitor de performance de R3F. Va DENTRO del <Canvas>. */
export function DebugPerf() {
  return <Perf position="bottom-left" minimal />;
}
