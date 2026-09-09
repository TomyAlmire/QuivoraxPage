import { useEffect, useRef, type CSSProperties } from 'react';
import { useMapStore } from '@/store/useMapStore';
import { BRANCHES, NODE_BY_ID } from '@/data/map';
import { Minimap } from './Minimap';
import { Logo } from './Logo';
import s from './overlay.module.css';

/**
 * Todo el HUD 2D del mapa: breadcrumb, botón "volver", selector de ramas,
 * título de intro y minimapa. El panel de detalle es aparte (NodePanel).
 */
export function MapOverlay() {
  const { mode, branch, goMap, goBranch } = useMapStore();

  const dimIntro = mode !== 'map' && mode !== 'intro';

  return (
    <div className={s.hud}>
      <Breadcrumb />

      {mode !== 'intro' && mode !== 'map' && (
        <button
          className={s.back}
          onClick={() => (mode === 'node' && branch ? goBranch(branch) : goMap())}
        >
          ↖ {mode === 'node' && branch ? 'Volver a la rama' : 'Volver al mapa'}
        </button>
      )}

      <div className={s.intro} data-dim={dimIntro || undefined}>
        <Logo className={s.introMark} title="Quivorax" />
        <p className={s.introKicker}>Quivorax · el mapa</p>
        <h1 className={s.introTitle}>Tres ramas, un mismo criterio.</h1>
        <p className={s.introHint}>Elegí una rama · o tocá un nodo</p>
      </div>

      <div className={s.legend} data-dim={dimIntro || undefined} aria-label="Ramas">
        {BRANCHES.map((b) => (
          <button
            key={b.id}
            className={s.legendRow}
            style={{ '--bc': b.color } as CSSProperties}
            onClick={() => goBranch(b.id)}
          >
            <span className={s.legendHead}>
              {b.label}
              <span className={s.legendBar} />
            </span>
            <span className={s.legendTag}>{b.tagline}</span>
          </button>
        ))}
      </div>

      <nav className={s.branchNav} aria-label="Ramas">
        {BRANCHES.map((b) => (
          <button
            key={b.id}
            className={s.branchBtn}
            data-active={branch === b.id || undefined}
            style={{ '--bc': b.color } as CSSProperties}
            onClick={() => (branch === b.id ? goMap() : goBranch(b.id))}
          >
            <span className={s.branchDot} />
            {b.short}
          </button>
        ))}
        {(mode === 'branch' || mode === 'node') && (
          <button className={`${s.branchBtn} ${s.branchReset}`} onClick={goMap}>
            mapa
          </button>
        )}
      </nav>

      <Minimap />
    </div>
  );
}

function Breadcrumb() {
  const { mode, branch, node, goMap, goBranch } = useMapStore();
  const branchLabel = branch ? BRANCHES.find((b) => b.id === branch)?.short : null;
  const nodeLabel = node ? NODE_BY_ID[node]?.label : null;

  return (
    <div className={s.crumb}>
      <button
        className={s.crumbSeg}
        data-current={mode === 'map' || mode === 'intro' || undefined}
        onClick={goMap}
      >
        ~/quivorax
      </button>
      {branchLabel && (
        <>
          <span className={s.crumbSlash}>/</span>
          <button
            className={s.crumbSeg}
            data-current={mode === 'branch' || undefined}
            onClick={() => branch && goBranch(branch)}
          >
            {branchLabel.toLowerCase()}
          </button>
        </>
      )}
      {nodeLabel && mode === 'node' && (
        <>
          <span className={s.crumbSlash}>/</span>
          <span className={s.crumbSeg} data-current>
            {nodeLabel.toLowerCase()}
          </span>
        </>
      )}
    </div>
  );
}

/** Cierra el panel/rama con Escape. */
// eslint-disable-next-line react-refresh/only-export-components
export function useMapKeys() {
  const goMap = useMapStore((st) => st.goMap);
  const goBranch = useMapStore((st) => st.goBranch);
  const ref = useRef({ goMap, goBranch });
  ref.current = { goMap, goBranch };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const { mode, branch } = useMapStore.getState();
      if (mode === 'node' && branch) ref.current.goBranch(branch);
      else if (mode === 'branch') ref.current.goMap();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
