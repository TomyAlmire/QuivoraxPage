import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { BRANCHES, type BranchId } from '@/data/map';
import { WORKS } from '@/data/works';
import { useMapStore } from '@/store/useMapStore';
import { Logo } from '@/components/ui/Logo';
import s from './site.module.css';

/** Aparece con un pequeño desplazamiento al entrar en viewport (one-shot). */
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    io.observe(el);
    // failsafe: si el observer no reporta (entornos raros) pero el bloque ya
    // está a la vista, revelarlo igual.
    const failsafe = window.setInterval(() => {
      const r = ref.current?.getBoundingClientRect();
      if (r && r.top < window.innerHeight * 1.05) {
        setSeen(true);
        window.clearInterval(failsafe);
      }
    }, 1200);
    return () => {
      io.disconnect();
      window.clearInterval(failsafe);
    };
  }, []);

  return (
    <div ref={ref} className={`${s.reveal}${className ? ` ${className}` : ''}`} data-inview={seen || undefined}>
      {children}
    </div>
  );
}

/** Sub-servicios de cada rama (los mismos de los slides de Tomás). */
const POINTS: Record<BranchId, string[]> = {
  sistemas: ['Ordenar procesos', 'Conectar herramientas', 'Automatizar tareas'],
  web: ['Diseño UX/UI', 'Frontend', 'Backend'],
  ciber: ['Revisar accesos', 'Detectar riesgos', 'Proponer mejoras'],
};

const STEPS = [
  {
    n: '01',
    t: 'Charlamos',
    d: 'Me contás qué necesitás. Te digo qué se puede hacer, en cuánto tiempo y qué conviene primero.',
  },
  {
    n: '02',
    t: 'Manos a la obra',
    d: 'Trabajo en tramos cortos y te muestro avances. Nada de desaparecer un mes y volver con una sorpresa.',
  },
  {
    n: '03',
    t: 'Queda tuyo',
    d: 'Te entrego todo funcionando y documentado, para que no dependas de mí para seguir.',
  },
];

function jumpToBranch(id: BranchId) {
  useMapStore.getState().goBranch(id);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function SiteContent() {
  return (
    <div className={s.root}>
      {/* el hero 3D vive detrás; este bloque deja pasar los clicks al canvas */}
      <div className={s.heroSpace} aria-hidden />

      <main className={s.main}>
        {/* ---- 01 · manifiesto ---- */}
        <section className={s.section} id="quivorax">
          <Reveal>
            <p className={s.eyebrow}>
              <span>01</span> Quivorax
            </p>
            <h2 className={s.lead}>Tecnología que se nota cuando funciona, no cuando falla.</h2>
            <p className={s.leadBody}>
              Soy Tomás. Ayudo a negocios chicos a poner su parte técnica en orden: sitios que
              trabajan, procesos que no dependen de que alguien se acuerde, y accesos que no son un
              agujero. Sin vueltas y explicado en criollo.
            </p>
          </Reveal>
        </section>

        {/* ---- 02 · qué hago ---- */}
        <section className={s.section} id="que-hago">
          <Reveal>
            <p className={s.eyebrow}>
              <span>02</span> Qué hago
            </p>
            <h2 className={s.h2}>Tres frentes, un mismo criterio.</h2>
            <div className={s.grid3}>
              {BRANCHES.map((b) => (
                <article key={b.id} className={s.card} style={{ '--c': b.color } as CSSProperties}>
                  <span className={s.cardDot} />
                  <h3 className={s.cardTitle}>{b.label}</h3>
                  <p className={s.cardTag}>{b.tagline}</p>
                  <ul className={s.cardList}>
                    {POINTS[b.id].map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <button className={s.cardLink} onClick={() => jumpToBranch(b.id)}>
                    Verlo en el mapa →
                  </button>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ---- 03 · trabajos ---- */}
        <section className={s.section} id="trabajos">
          <Reveal>
            <p className={s.eyebrow}>
              <span>03</span> Trabajos
            </p>
            <h2 className={s.h2}>Cosas que ya están andando.</h2>
            <div className={s.grid2}>
              {WORKS.map((w) => (
                <article key={w.id} className={s.work} style={{ '--c': w.accent } as CSSProperties}>
                  <div className={s.workShot}>
                    <img src={w.shot} alt={`Sitio de ${w.name}`} loading="lazy" />
                  </div>
                  <div className={s.workBody}>
                    <p className={s.workKind}>{w.kind}</p>
                    <h3 className={s.workName}>{w.name}</h3>
                    <p className={s.workBlurb}>{w.blurb}</p>
                    {w.url ? (
                      <a className={s.workLink} href={w.url} target="_blank" rel="noreferrer">
                        Ver sitio ↗
                      </a>
                    ) : (
                      <span className={s.workSoon}>Demo a pedido</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ---- 04 · cómo trabajo ---- */}
        <section className={s.section} id="como-trabajo">
          <Reveal>
            <p className={s.eyebrow}>
              <span>04</span> Cómo trabajo
            </p>
            <h2 className={s.h2}>Simple, y sin humo.</h2>
            <div className={s.steps}>
              {STEPS.map((st) => (
                <div key={st.n} className={s.step}>
                  <span className={s.stepN}>{st.n}</span>
                  <h3 className={s.stepT}>{st.t}</h3>
                  <p className={s.stepD}>{st.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ---- 05 · contacto ---- */}
        <section className={`${s.section} ${s.contact}`} id="contacto">
          <Reveal>
            <p className={s.eyebrow}>
              <span>05</span> Trabajemos
            </p>
            <h2 className={s.lead}>¿Tenés algo que construir o blindar?</h2>
            <p className={s.leadBody}>Contame qué necesitás y lo vemos. Respondo en menos de 24 h.</p>
            <a className={s.mail} href="mailto:hola@quivorax.com">
              hola@quivorax.com
            </a>
          </Reveal>
        </section>

        <footer className={s.footer}>
          <Logo className={s.footLogo} title="Quivorax" />
          <p>Quivorax · Ciberseguridad · Desarrollo web · Sistemas</p>
          <p className={s.footYear}>© {new Date().getFullYear()}</p>
        </footer>
      </main>
    </div>
  );
}
