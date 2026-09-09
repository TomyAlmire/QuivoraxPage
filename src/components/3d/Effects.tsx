import { useMemo, type ReactElement } from 'react';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  Noise,
  DepthOfField,
  BrightnessContrast,
  HueSaturation,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';

/**
 * Wrapper de postprocessing.
 *
 * Sistema PREPARADO, no encendido entero: activá cada efecto por prop.
 * En 'low' se atenúa Bloom y se desactiva DoF. Otros efectos disponibles en
 * @react-three/postprocessing y NO incluidos acá por defecto (agregar cuando
 * haga falta): Glitch, GodRays, SSAO, Scanline, Pixelation, DotScreen, Outline,
 * ToneMapping, Sepia, TiltShift, Autofocus.
 */
export interface EffectsProps {
  bloom?: boolean;
  vignette?: boolean;
  chromaticAberration?: boolean;
  noise?: boolean;
  depthOfField?: boolean;
  /** Color grading: contraste/brillo + saturación/tono */
  colorGrade?: boolean;
  bloomIntensity?: number;
}

export function Effects({
  bloom = true,
  vignette = true,
  chromaticAberration = false,
  noise = false,
  depthOfField = false,
  colorGrade = false,
  bloomIntensity = 0.55,
}: EffectsProps) {
  const tier = useAppStore((s) => s.quality());
  const isMobile = useAppStore((s) => s.device.isMobile);
  const reduced = useAppStore((s) => s.device.prefersReducedMotion);

  const caOffset = useMemo(() => new THREE.Vector2(0.0006, 0.0006), []);

  // DoF: pasada pesada. Alto siempre; medio sólo en desktop; nunca en 'low'.
  const useDof = depthOfField && !reduced && (tier === 'high' || (tier === 'mid' && !isMobile));
  const bloomStrength = tier === 'low' ? bloomIntensity * 0.4 : bloomIntensity;
  const bloomThreshold = tier === 'low' ? 0.97 : 0.9;
  const sat = tier === 'low' ? -0.04 : 0.12;

  const passes = useMemo<ReactElement[]>(() => {
    if (reduced) return [];
    const list: ReactElement[] = [];

    if (bloom) {
      list.push(
        <Bloom
          key="bloom"
          intensity={bloomStrength}
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={0.2}
          mipmapBlur
        />,
      );
    }
    if (useDof) {
      list.push(
        <DepthOfField key="dof" focusDistance={0.012} focalLength={0.055} bokehScale={3.5} />,
      );
    }
    if (chromaticAberration) {
      list.push(
        <ChromaticAberration
          key="ca"
          offset={caOffset}
          radialModulation={false}
          modulationOffset={0}
        />,
      );
    }
    if (colorGrade) {
      list.push(<BrightnessContrast key="bc" brightness={0} contrast={0.08} />);
      list.push(<HueSaturation key="hs" hue={0} saturation={sat} />);
    }
    if (noise) {
      list.push(
        <Noise key="noise" premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.35} />,
      );
    }
    if (vignette) {
      list.push(<Vignette key="vig" eskil={false} offset={0.28} darkness={0.72} />);
    }
    return list;
  }, [
    reduced,
    bloom,
    bloomStrength,
    bloomThreshold,
    sat,
    useDof,
    chromaticAberration,
    caOffset,
    colorGrade,
    noise,
    vignette,
  ]);

  if (passes.length === 0) return null;

  return (
    <EffectComposer multisampling={tier === 'high' ? 4 : 0} enableNormalPass={useDof}>
      {passes}
    </EffectComposer>
  );
}
