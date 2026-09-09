# Quivorax — Creative Developer Environment

Entorno para construir experiencias **WebGL / 3D, motion design e interfaces
interactivas** del nivel de mesh3d.gallery, sin configurar nada desde cero.

**Stack:** React · Vite · TypeScript · Three.js · React Three Fiber · drei ·
postprocessing · GSAP + ScrollTrigger · Lenis · Zustand · Framer Motion · GLSL.

---

## Empezar

```bash
npm install
npm run dev        # http://localhost:5173  (app principal R3F)
                   # http://localhost:5173/legacy/index.html  (sitio anterior)
npm run build      # tsc -b && vite build  →  dist/
npm run preview    # sirve dist/
npm run lint       # ESLint (typescript-eslint + react-hooks)
npm run typecheck  # solo tipos, sin emitir
```

> **Node:** probado con Node 24. Si `vite`/`esbuild` fallan tras un `npm install`
> (EPERM en Windows por un dev server abierto), cerrá el server y corré
> `npm rebuild esbuild`.

---

## Dependencias instaladas

| Runtime | Para qué |
|---|---|
| `react` `react-dom` 18.3 | UI |
| `three` 0.168 | motor 3D |
| `@react-three/fiber` 8.18 | React renderer para three |
| `@react-three/drei` 9.x | helpers (Environment, Float, useGLTF, ContactShadows, Sparkles, Lightformer, Adaptive*…) |
| `@react-three/postprocessing` · `postprocessing` | EffectComposer + efectos |
| `gsap` 3.12 | animación + ScrollTrigger |
| `lenis` 1.1 | smooth scroll |
| `zustand` 4.5 | estado compartido DOM ↔ escena |
| `framer-motion` 11 | microinteracciones de UI 2D |

| Dev only (no entra al bundle de producción) | |
|---|---|
| `leva` | panel de controles |
| `r3f-perf` | monitor de performance de la escena |
| `vite-plugin-glsl` | `import` de `.glsl/.vert/.frag` con `#include` |
| `typescript` · `typescript-eslint` · `eslint*` · `@types/*` | tipos y lint |

No hay `any`, `@ts-ignore` ni `@ts-nocheck` en `src/`.

---

## La página: "El mapa Quivorax"

`src/pages/Map.tsx` es la landing. Un **grafo 3D navegable** de las tres ramas
—Sistemas · Ciberseguridad · Desarrollo web— inspirado en el "mapa vivo" de
nicoborja.com, con el entorno R3F de este repo.

**Sistema de navegación** (máquina de estados en `store/useMapStore.ts`):

| modo | qué pasa | cámara |
|---|---|---|
| `intro` | apertura, entra sola a `map` a los ~2 s | dolly in |
| `map` | se ven las 3 ramas, órbita lenta idle | pull-back, orbit |
| `branch` | foco en una rama, las otras se atenúan | vuela al cluster |
| `node` | panel de detalle de un sub-servicio | zoom al nodo |

- **Ruteo por hash** (`hooks/useHashRoute.ts`), bidireccional:
  `#/` · `#/sistemas` · `#/web/web-frontend` · `#/trabajemos`
- **HUD 2D** (`components/ui/MapOverlay.tsx` + `NodePanel.tsx` + `Minimap.tsx`):
  breadcrumb `~/quivorax/rama/nodo`, selector de ramas, botón "↖ volver",
  minimapa top-down con "estás aquí", panel de detalle lateral, tecla `Esc`.
- **Datos** en `src/data/map.ts` — las 3 ramas + 3 sub-servicios cada una (copy de
  los slides de Tomás) + nodo raíz + nodo "Trabajemos". Layout calculado ahí.
- **3D**: `MapNodes` (esferas emisivas + glow), `MapEdges` (líneas del grafo que
  reaccionan a la rama activa), `MapCamera` (rig con GSAP + damping + parallax),
  `Particles`, `Effects` (Bloom fuerte para el glow + Vignette + Chromatic Ab.).

Colores de rama: Ciber `#3ddc84` · Sistemas `#6ea8fe` · Web `#b39dff`.

### Cómo agregar/editar contenido del mapa

Editá `src/data/map.ts`: el objeto `LEAVES` (sub-servicios por rama, con `title`
y `body` del panel), `BRANCHES` (label, tagline, color, ángulo) y las constantes
`CORE_DIST` / `LEAF_DIST` para el spacing. Todo lo demás (posiciones, aristas,
minimapa, breadcrumb, hash) se deriva solo.

---

## Arquitectura

```
src/
├── main.tsx                 punto de entrada (sin <StrictMode>, ver nota abajo)
├── App.tsx                  MapPage + Debug (lazy, solo dev)
├── vite-env.d.ts            tipos de imports .glsl / .glb / .hdr …
│
├── data/
│   └── map.ts               ramas, nodos, aristas, layout del grafo
├── pages/
│   ├── Map.tsx              LA PÁGINA: mapa Quivorax
│   └── Home.tsx             escena demo de referencia (Canvas + scroll) — no se usa en la landing
├── scenes/
│   ├── MapScene.tsx         ensamblado de la escena del mapa
│   └── PlaygroundScene.tsx  escena demo de verificación (referencia)
│
├── components/
│   ├── 3d/
│   │   ├── MapNodes.tsx        nodos del grafo (esferas emisivas + glow + hover/click)
│   │   ├── MapEdges.tsx        aristas del grafo (reaccionan a la rama activa)
│   │   ├── MapCamera.tsx       rig de cámara del mapa (GSAP + damping + parallax + orbit)
│   │   ├── DistortedBlob.tsx   [demo] esfera con shader (displacement + fresnel + mouse)
│   │   ├── Particles.tsx       nube de partículas en shader (presupuesto por device)
│   │   ├── Lights.tsx          luces + sombras según tier
│   │   ├── Rig.tsx             [demo] cámara: parallax de puntero + dolly de scroll
│   │   ├── Effects.tsx         wrapper de postprocessing (opt-in por prop)
│   │   └── SceneReady.tsx      marca `ready` tras el primer frame (+ failsafe)
│   ├── ui/
│   │   ├── MapOverlay.tsx      HUD: breadcrumb + selector de ramas + intro + Esc
│   │   ├── NodePanel.tsx       panel de detalle lateral de un nodo
│   │   ├── Minimap.tsx         minimapa top-down 2D con "estás aquí"
│   │   ├── Loader.tsx          overlay de carga (useProgress + failsafe)
│   │   ├── overlay.module.css  estilos del HUD del mapa
│   │   └── Debug.tsx           leva + r3f-perf (lazy, dev)
│   ├── layout/
│   │   └── SmoothScroll.tsx    provider de Lenis + sync GSAP (para páginas con scroll)
│   └── animations/
│       ├── Reveal.tsx          reveal 2D con Framer Motion (whileInView)
│       └── SplitText.tsx       divide texto en <span> para stagger con GSAP
│
├── hooks/
│   ├── useHashRoute.ts         sincroniza el hash de la URL con useMapStore
│   ├── useIsMobile.ts          reactivo (useSyncExternalStore)
│   ├── usePointer.ts           escribe el puntero normalizado en el store
│   ├── useScrollProgress.ts    scroll 0..1 como valor de React
│   └── useGsapScope.ts         gsap.context() atado al ciclo de vida (como @gsap/react)
│
├── lib/
│   ├── gsap.ts                 registra ScrollTrigger + connectLenis()
│   ├── three.ts                CANVAS_GL, configureRenderer(), disposeObject()
│   ├── textures.ts             glowTexture() — glow radial en canvas, cacheado
│   └── device.ts               detección de GPU/mobile → quality tier + presupuestos
│
├── store/
│   ├── useAppStore.ts          zustand: ready, progress, scroll, pointer, quality
│   └── useMapStore.ts          zustand: máquina de estados del mapa (mode/branch/node/hover)
│
├── shaders/
│   ├── lib/noise.glsl          simplex 3D + fbm  (se importa con #include '../lib/noise.glsl')
│   ├── blob/{vertex,fragment}.glsl
│   └── particles/{vertex,fragment}.glsl
│
└── assets/
    ├── models/        .glb / .gltf   (ver README dentro)
    ├── textures/      .png/.jpg/.webp/.ktx2
    └── environments/  .hdr / .exr
```

Alias: `@/` → `src/`.

**Nota sobre `<StrictMode>`:** desactivado. R3F v8 tiene un bug conocido con el
doble montaje (el `<Canvas>` queda 300×150). Se reactiva al migrar a R3F v9 / React 19.

---

## Cómo hacer cada cosa

### Crear una escena nueva

```tsx
// src/scenes/MiEscena.tsx
export function MiEscena() {
  return (
    <>
      <color attach="background" args={['#05070a']} />
      <ambientLight intensity={0.4} />
      <Environment preset="city" />        {/* o Lightformers procedurales */}
      <Suspense fallback={null}>
        <MiModelo />
        <SceneReady />
      </Suspense>
      <Effects bloom vignette />
    </>
  );
}
```

Y en una página:

```tsx
<Canvas dpr={[1, device.dprMax]} gl={CANVAS_GL} shadows
        camera={{ position: [0, 0, 6], fov: 45 }}
        onCreated={({ gl }) => configureRenderer(gl)}
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh' }}>
  <Suspense fallback={null}><MiEscena /></Suspense>
</Canvas>
```

### Modelos 3D (GLTF/GLB)

Poné el archivo en `src/assets/models/`. Cargá con drei:

```tsx
import model from '@/assets/models/nave.glb';
const { scene, nodes, materials, animations } = useGLTF(model);
useGLTF.preload(model);
```

Optimizá **antes** de commitear:

```bash
npx gltfjsx nave.glb --transform --types          # componente tipado + .glb comprimido (draco/meshopt)
npx @gltf-transform/cli optimize in.glb out.glb --texture-compress webp
```

### Texturas

```tsx
import tex from '@/assets/textures/metal.webp';
const map = useTexture(tex);
```

### Shaders GLSL

1. Archivo en `src/shaders/<nombre>/{vertex,fragment}.glsl`.
2. Ruido/utilidades compartidas: `#include '../lib/noise.glsl';` (ruta **relativa al shader**).
3. En el componente, `<shaderMaterial>` con uniforms en `useMemo` y update en `useFrame`:

```tsx
const uniforms = useMemo(() => ({ uTime: { value: 0 }, uPointer: { value: new THREE.Vector2() } }), []);
useFrame((_, dt) => { mat.current.uniforms.uTime.value += dt; });
return <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} toneMapped={false} />;
```

> Los custom shaders usan `toneMapped={false}` + tone mapping aproximado en el
> propio fragment, para no depender de los `ShaderChunk` de three.

### GSAP

- Importá **siempre** desde `@/lib/gsap` (ya tiene ScrollTrigger registrado).
- Dentro de componentes: `useGsapScope(ref, (ctx) => { ... }, [deps])` → limpieza automática.
- Todo lo que crees en el setup (tweens, timelines, ScrollTriggers) queda en el
  `gsap.context()` del scope.

```tsx
const scope = useRef<HTMLDivElement>(null);
useGsapScope(scope, () => {
  gsap.from('.title .unit', { yPercent: 115, stagger: 0.05,
    scrollTrigger: { trigger: '.title', start: 'top 85%' } });
}, []);
```

Animar la **cámara** con scroll: leé `useAppStore.getState().scroll` dentro de un
`useFrame` (ver `Rig.tsx`), o creá un `ScrollTrigger` que tweene un objeto y lo
apliques en `useFrame`.

### Lenis

Ya está montado en `<SmoothScroll>` (en `App.tsx`). Provee:
- scroll suave sincronizado con GSAP (`connectLenis` en `lib/gsap.ts`)
- `store.scroll` (0..1) para que la escena reaccione sin re-renders
- acceso a la instancia: `const lenis = useLenis()`

Respeta `prefers-reduced-motion` (desactiva el smoothing).

### Postprocessing

`<Effects>` deja **todo preparado pero apagado**. Activá por prop:

```tsx
<Effects bloom vignette chromaticAberration depthOfField colorGrade noise />
```

En `low` se atenúa Bloom y se desactiva DoF automáticamente. Efectos extra
disponibles en `@react-three/postprocessing` y no incluidos por defecto
(Glitch, GodRays, SSAO, Scanline, Pixelation, Outline, Sepia…): agregalos a
`Effects.tsx` cuando los necesites.

### Optimizar una escena

`lib/device.ts` calcula un **quality tier** (`low`/`mid`/`high`) una sola vez y de
ahí salen los presupuestos. Reglas del entorno:

- `dpr={[1, device.dprMax]}` en el `<Canvas>` (nunca `dpr` libre).
- Nº de partículas / segmentos de geometría / resolución de sombras → del tier.
- `<Suspense>` alrededor de todo lo que cargue assets; `useGLTF.preload()` para lo crítico.
- `<AdaptiveDpr>` + `<AdaptiveEvents>` en la escena (bajan calidad si el frame sufre).
- Liberar recursos: `disposeObject(obj)` de `lib/three.ts` en el cleanup.
- Postprocessing pesado solo si `device.heavyPostFX`.
- `prefers-reduced-motion` → `<Effects>` devuelve `null`, Lenis sin smoothing.

---

## Responsive

- Canvas: `position: fixed; inset: 0; width: 100vw; height: 100dvh` (inline, para
  que R3F mida bien desde el frame 1).
- El contenido va en un layer `pointer-events: none` encima; los controles
  interactivos reactivan `pointer-events: auto`.
- `useIsMobile()` y `device.isMobile` para ramas de layout / calidad.

---

## Sitio anterior

El sitio de marketing vanilla está en **`legacy/`** y se compila como segunda
entrada (`dist/legacy/index.html`). No se tocó su funcionalidad.

---

## Estado del build

- `tsc -b` ✅ sin errores
- `vite build` ✅ — `dist/index.html` (R3F) + `dist/legacy/index.html` (vanilla)
- Chunks: `three` ~176 kB gzip · `r3f` ~112 kB · `main` ~44 kB · `ScrollTrigger` ~51 kB · `postfx` ~21 kB
- Sin warnings salvo el tamaño de `three` (esperado, va en su chunk cacheable; el
  límite del warning ya está subido a 750 kB).
- leva y r3f-perf **no** entran al bundle de producción (lazy + `import.meta.env.DEV`).

> **Verificación visual:** la escena 3D no se pudo capturar en el entorno de
> pruebas headless porque `requestAnimationFrame` está pausado ahí (ventana
> minimizada) y el render loop de R3F/GSAP no corre. `onCreated` dispara, el
> renderer de three inicializa y no hay errores de consola. En una ventana normal
> se ve — como cualquier sitio WebGL.
