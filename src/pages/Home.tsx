import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { PlaygroundScene } from '@/scenes/PlaygroundScene';
import { Loader } from '@/components/ui/Loader';
import { SplitText } from '@/components/animations/SplitText';
import { Reveal } from '@/components/animations/Reveal';
import { useGsapScope } from '@/hooks/useGsapScope';
import { gsap } from '@/lib/gsap';
import { CANVAS_GL, configureRenderer } from '@/lib/three';
import { useAppStore } from '@/store/useAppStore';
import styles from './Home.module.css';

/**
 * Página de demostración del entorno.
 * - Canvas fijo fullscreen detrás (el posicionamiento va inline para que R3F
 *   mida bien desde el primer frame).
 * - Contenido scrolleable delante (Lenis) que revela la escena.
 * - GSAP ScrollTrigger para los reveals de texto y el parallax.
 */
export function Home() {
  const scope = useRef<HTMLDivElement>(null);
  const device = useAppStore((s) => s.device);
  const shadows = useAppStore((s) => s.quality() !== 'low');

  useGsapScope(
    scope,
    () => {
      gsap.utils.toArray<HTMLElement>('[data-animate="heading"] .unit').forEach((el) => {
        gsap.from(el, {
          yPercent: 115,
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });

      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const depth = Number(el.dataset.parallax) || 0.2;
        gsap.to(el, {
          yPercent: -14 * depth * 10,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    },
    [],
  );

  return (
    <div ref={scope} className={styles.page}>
      <Canvas
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', zIndex: 0 }}
        aria-hidden
        dpr={[1, device.dprMax]}
        gl={CANVAS_GL}
        shadows={shadows}
        camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 100 }}
        resize={{ scroll: false }}
        onCreated={({ gl }) => configureRenderer(gl)}
      >
        <Suspense fallback={null}>
          <PlaygroundScene />
        </Suspense>
      </Canvas>

      <Loader />

      <main className={styles.content}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Quivorax · creative dev environment</p>
          <h1 data-animate="heading" className={styles.title}>
            <SplitText text="Entorno listo." by="word" as="span" />
          </h1>
          <p className={styles.lead} data-parallax="0.15">
            React · Vite · TypeScript · React Three Fiber · drei · postprocessing · GSAP · Lenis ·
            shaders GLSL. Esta escena existe solo para verificar que todo funciona.
          </p>
        </section>

        <section className={styles.panel}>
          <Reveal>
            <h2 data-animate="heading">
              <SplitText text="Movete el mouse." by="word" as="span" />
            </h2>
            <p>
              El shader de la esfera reacciona al puntero (atracción + fresnel) y la cámara hace
              parallax suave. Las partículas se repelen del cursor.
            </p>
          </Reveal>
        </section>

        <section className={styles.panel}>
          <Reveal>
            <h2 data-animate="heading">
              <SplitText text="Hacé scroll." by="word" as="span" />
            </h2>
            <p data-parallax="0.3">
              Lenis y GSAP/ScrollTrigger están sincronizados: el scroll modula la distorsión y la
              escala del objeto, y hace dolly de la cámara. Postprocessing: Bloom + Vignette +
              Chromatic Aberration.
            </p>
          </Reveal>
        </section>

        <section className={styles.outro}>
          <Reveal>
            <h2 data-animate="heading">
              <SplitText text="Ahora sí: a construir." by="word" as="span" />
            </h2>
            <p>
              Pedime una landing con escena 3D y arrancamos desde acá. Todo está tipado, es
              responsive y respeta prefers-reduced-motion.
            </p>
          </Reveal>
        </section>
      </main>
    </div>
  );
}
