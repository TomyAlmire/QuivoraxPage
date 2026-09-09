import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { useMapStore } from '@/store/useMapStore';
import { WORKS } from '@/data/works';
import s from './works.module.css';

/**
 * Galería interactiva de trabajos. Se abre desde el orbe central (modo `works`).
 * Lista a la izquierda + preview grande a la derecha, con toggle desktop/mobile
 * y navegación por teclado (↑↓ cambia, Enter abre el sitio, Esc cierra).
 */
export function WorksPanel() {
  const mode = useMapStore((st) => st.mode);
  const goMap = useMapStore((st) => st.goMap);
  const open = mode === 'works';

  const [sel, setSel] = useState(0);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [seen, setSeen] = useState(false); // no descargar las imágenes hasta abrir
  const rootRef = useRef<HTMLDivElement>(null);

  const work = WORKS[sel];

  // al abrir: reset y foco
  useEffect(() => {
    if (!open) return;
    setSeen(true);
    setSel(0);
    const id = window.setTimeout(() => rootRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setSel((i) => (i + 1) % WORKS.length);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setSel((i) => (i - 1 + WORKS.length) % WORKS.length);
      } else if (e.key === 'Enter' && work.url) {
        window.open(work.url, '_blank', 'noopener,noreferrer');
      }
    },
    [work],
  );

  return (
    <div
      ref={rootRef}
      className={s.wrap}
      data-open={open || undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Trabajos de Quivorax"
      tabIndex={-1}
      onKeyDown={onKey}
      style={{ '--wc': work.accent } as CSSProperties}
    >
      <div className={s.head}>
        <div>
          <span className={s.kicker}>Núcleo · Quivorax</span>
          <h2 className={s.title}>Trabajos</h2>
        </div>
        <div className={s.headRight}>
          <div className={s.toggle} role="tablist" aria-label="Vista">
            <button
              role="tab"
              aria-selected={device === 'desktop'}
              data-on={device === 'desktop' || undefined}
              onClick={() => setDevice('desktop')}
            >
              Escritorio
            </button>
            <button
              role="tab"
              aria-selected={device === 'mobile'}
              data-on={device === 'mobile' || undefined}
              onClick={() => setDevice('mobile')}
            >
              Celular
            </button>
          </div>
          <button className={s.close} onClick={goMap} aria-label="Cerrar">
            ✕ <span>esc</span>
          </button>
        </div>
      </div>

      {(open || seen) && (
      <div className={s.body}>
        <ul className={s.list} aria-label="Proyectos">
          {WORKS.map((w, i) => (
            <li key={w.id}>
              <button
                className={s.item}
                data-active={i === sel || undefined}
                style={{ '--ic': w.accent } as CSSProperties}
                onClick={() => setSel(i)}
              >
                <span className={s.itemDot} />
                <span className={s.itemText}>
                  <span className={s.itemName}>{w.name}</span>
                  <span className={s.itemKind}>{w.kind}</span>
                </span>
                <span className={s.itemNum}>{String(i + 1).padStart(2, '0')}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className={s.stage} key={work.id}>
          <figure className={s.frame} data-device={device}>
            <span className={s.chrome} aria-hidden>
              <i />
              <i />
              <i />
              <em>{work.url ? work.url.replace(/^https?:\/\//, '') : `${work.id}.quivorax`}</em>
            </span>
            <img
              className={s.shot}
              src={device === 'mobile' ? work.mobileShot : work.shot}
              alt={`Vista ${device === 'mobile' ? 'móvil' : 'de escritorio'} de ${work.name}`}
            />
          </figure>

          <div className={s.meta}>
            <span className={s.metaTag}>{work.kind}</span>
            <h3 className={s.metaName}>{work.name}</h3>
            <p className={s.metaBlurb}>{work.blurb}</p>
            <ul className={s.points}>
              {work.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            {work.url ? (
              <a className={s.visit} href={work.url} target="_blank" rel="noreferrer">
                Ver sitio ↗
              </a>
            ) : (
              <span className={s.soon}>Demo privada · a pedido</span>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
