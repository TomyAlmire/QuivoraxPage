import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { BRANCHES, type BranchId } from '@/data/map';
import { WORKS } from '@/data/works';
import { useMapStore } from '@/store/useMapStore';
import { usePageScroll } from '@/hooks/usePageScroll';
import { useLenis } from '@/components/layout/SmoothScroll';
import { Logo } from '@/components/ui/Logo';
import { WHATSAPP_URL, WHATSAPP_DISPLAY, EMAIL, EMAIL_URL } from '@/lib/contact';
import s from './site.module.css';

/** Ícono de WhatsApp (glifo oficial simplificado). */
function WaIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden focusable="false">
      <path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.7 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-4.9 1 1-4.8-.3-.4c-1-1.6-1.5-3.4-1.5-5.3C4.4 9.6 9.6 4.4 16 4.4S27.6 9.6 27.6 16 22.4 24.8 16 24.8zm6.5-8.3c-.4-.2-2.1-1-2.4-1.1-.3-.1-.6-.2-.8.2s-.9 1.1-1.1 1.4c-.2.2-.4.3-.8.1-.4-.2-1.5-.6-2.9-1.8-1.1-1-1.8-2.2-2-2.6-.2-.4 0-.6.2-.8l.6-.7c.2-.2.2-.4.4-.6.1-.2.1-.5 0-.7-.1-.2-.8-2-1.1-2.7-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.5-.3.4-1.2 1.2-1.2 2.9s1.2 3.4 1.4 3.6c.2.2 2.5 3.8 6 5.3.8.4 1.5.6 2 .8.8.3 1.6.2 2.2.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.6.2-1.7-.1-.2-.4-.3-.8-.5z" />
    </svg>
  );
}

/** Aparece con desplazamiento al entrar en viewport (one-shot). */
function Reveal({ children }: { children: ReactNode }) {
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
    <div ref={ref} className={s.reveal} data-inview={seen || undefined}>
      {children}
    </div>
  );
}

/** Parallax vertical sutil de una captura, mientras está a la vista. */
function WorkShot({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let visible = false;
    const tick = () => {
      const box = el.parentElement?.getBoundingClientRect();
      if (box) {
        const center = box.top + box.height / 2;
        const off = (center - window.innerHeight / 2) / window.innerHeight; // ~-1..1
        el.style.transform = `translate3d(0, ${(-off * 6).toFixed(2)}%, 0)`;
      }
      if (visible) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
      if (!visible) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={s.workShot}>
      <div ref={ref} className={s.workPara}>
        <img src={src} alt={alt} loading="lazy" />
      </div>
    </div>
  );
}

const POINTS: Record<BranchId, string[]> = {
  sistemas: ['Ordenar procesos', 'Conectar herramientas', 'Automatizar tareas'],
  web: ['Diseño UX/UI', 'Frontend', 'Backend'],
  ciber: ['Revisar accesos', 'Detectar riesgos', 'Proponer mejoras'],
};

const STEPS = [
  { n: '01', t: 'Charlamos', d: 'Me escribís por WhatsApp y me contás qué necesitás. Te digo qué se puede hacer, en cuánto y qué conviene primero.' },
  { n: '02', t: 'Manos a la obra', d: 'Trabajo en tramos cortos y te muestro avances. Nada de desaparecer un mes y volver con una sorpresa.' },
  { n: '03', t: 'Queda tuyo', d: 'Te entrego todo funcionando y documentado, para que no dependas de mí para seguir.' },
];

export function SiteContent({ heroProgress = 0 }: { heroProgress?: number }) {
  const lenis = useLenis();
  const { progress, past } = usePageScroll();

  // el panel "sube y encastra" mientras salís del hero (solo translate = barato)
  const rise = Math.min(1, heroProgress * 1.35);
  const mainStyle: CSSProperties = { transform: `translateY(${((1 - rise) * 46).toFixed(1)}px)` };

  const toTop = () => {
    if (lenis) lenis.scrollTo(0, { duration: 1.1 });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const jumpToBranch = (id: BranchId) => {
    useMapStore.getState().goBranch(id);
    toTop();
  };

  return (
    <div className={s.root}>
      <div className={s.progress} data-on={progress > 0.01 || undefined} style={{ '--sp': progress } as CSSProperties} />

      <a
        className={s.fab}
        data-on={past || undefined}
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Escribime por WhatsApp"
      >
        <WaIcon />
        <span className={s.fabText}>Escribime</span>
      </a>

      <div className={s.heroSpace} aria-hidden />

      <main className={s.main} style={mainStyle}>
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

        <section className={s.section} id="trabajos">
          <Reveal>
            <p className={s.eyebrow}>
              <span>03</span> Trabajos
            </p>
            <h2 className={s.h2}>Cosas que ya están andando.</h2>
            <div className={s.grid2}>
              {WORKS.map((w) => (
                <article key={w.id} className={s.work} style={{ '--c': w.accent } as CSSProperties}>
                  <WorkShot src={w.shot} alt={`Sitio de ${w.name}`} />
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

        <section className={`${s.section} ${s.contact}`} id="contacto">
          <Reveal>
            <p className={s.eyebrow}>
              <span>05</span> Trabajemos
            </p>
            <h2 className={s.lead}>¿Tenés algo que construir o blindar?</h2>
            <p className={s.leadBody}>
              Escribime por WhatsApp y lo vemos. Te respondo yo, en el día.
            </p>
            <div>
              <a className={s.wa} href={WHATSAPP_URL} target="_blank" rel="noreferrer">
                <WaIcon />
                Escribime por WhatsApp
              </a>
              <span className={s.waNote}>
                {WHATSAPP_DISPLAY} · o por mail a{' '}
                <a className={s.mail} href={EMAIL_URL}>
                  {EMAIL}
                </a>
              </span>
            </div>
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
