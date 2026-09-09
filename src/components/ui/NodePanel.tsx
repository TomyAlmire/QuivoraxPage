import { type CSSProperties } from 'react';
import { useMapStore } from '@/store/useMapStore';
import { NODE_BY_ID, BRANCHES, nodeColor } from '@/data/map';
import s from './overlay.module.css';

/**
 * Panel de detalle de un nodo (hoja o contacto). Entra desde la derecha cuando
 * `mode === 'node'`. Para el nodo de contacto muestra el mail.
 */
export function NodePanel() {
  const { mode, node, branch, goBranch, goMap } = useMapStore();
  const n = node ? NODE_BY_ID[node] : null;
  const open = mode === 'node' && !!n;
  const color = n ? nodeColor(n) : '#fff';
  const branchLabel = n?.branch ? BRANCHES.find((b) => b.id === n.branch)?.label : null;

  return (
    <aside className={s.panel} data-open={open || undefined} style={{ '--pc': color } as CSSProperties}>
      {n && (
        <>
          <span className={s.panelTag}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: color,
                display: 'inline-block',
              }}
            />
            {n.kind === 'contact' ? 'Contacto' : branchLabel}
          </span>

          <h2 className={s.panelTitle}>{n.title}</h2>
          <p className={s.panelBody}>
            {n.kind === 'contact' ? (
              <>
                Contame qué necesitás y lo charlamos. Respondo en menos de 24 h ·{' '}
                <a className={s.panelMail} href="mailto:hola@quivorax.com">
                  hola@quivorax.com
                </a>
              </>
            ) : (
              n.body
            )}
          </p>

          <button
            className={s.panelClose}
            onClick={() => (n.branch ? goBranch(n.branch) : goMap())}
          >
            {branch ? '↖ volver a la rama' : '↖ volver al mapa'} · esc
          </button>
        </>
      )}
    </aside>
  );
}
