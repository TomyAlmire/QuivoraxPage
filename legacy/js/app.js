/* =========================================================
   QUIVORAX — orquestación de movimiento
   GSAP + ScrollTrigger + Lenis. Cada sección tiene su propia
   personalidad de animación; el fondo y los "ghost words" dan
   continuidad entre secciones (controlled chaos).
   ========================================================= */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { initBackground } from './background.js';

gsap.registerPlugin(ScrollTrigger);

// Señal para el failsafe CSS: si este módulo no carga, .js-ok nunca aparece
document.documentElement.classList.add('js-ok');

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = window.matchMedia('(pointer: coarse)').matches;
const mm = gsap.matchMedia();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* FAILSAFE ABSOLUTO — pase lo que pase, el preloader se va y el contenido queda visible.
   Independiente de GSAP, del ticker (rAF) y de que boot() llegue a ejecutarse. */
setTimeout(() => {
  const l = document.getElementById('loader');
  if (l) { l.style.transition = 'transform .5s ease, opacity .5s ease'; l.style.transform = 'translateY(-100%)'; l.style.opacity = '0'; setTimeout(() => l.remove(), 550); }
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-ready');
}, 4500);

/* ---------------------------------------------------------
   Utilidades de texto: dividir en líneas / palabras
   Envuelve cada línea en un contenedor con overflow:hidden
   y un inner que puede desplazarse verticalmente.
--------------------------------------------------------- */
function collectWords(el) {
  // Recorre hijos preservando <br> y marcando solo el acento como clase segura
  const tokens = [];
  el.childNodes.forEach((node) => {
    if (node.nodeType === 3) {
      node.textContent.split(/\s+/).forEach((w) => { if (w) tokens.push({ text: w }); });
    } else if (node.nodeName === 'BR') {
      tokens.push({ br: true });
    } else if (node.nodeType === 1) {
      const accent = /\b(accent|w--accent)\b/.test(node.getAttribute('class') || '');
      node.textContent.split(/\s+/).forEach((w) => { if (w) tokens.push({ text: w, accent }); });
    }
  });
  return tokens;
}

function splitWords(el) {
  if (el.dataset.split) return [...el.querySelectorAll('.word__inner')];
  const tokens = collectWords(el);
  el.dataset.split = '1';
  el.textContent = '';
  const inners = [];
  tokens.forEach((t) => {
    if (t.br) { el.appendChild(document.createElement('br')); return; }
    const mask = document.createElement('span');
    mask.className = t.accent ? 'word accent' : 'word';
    const inner = document.createElement('span');
    inner.className = 'word__inner';
    inner.textContent = t.text;
    mask.appendChild(inner);
    el.appendChild(mask);
    el.appendChild(document.createTextNode(' '));
    inners.push(inner);
  });
  gsap.set(el, { autoAlpha: 1 });
  return inners;
}

/* ---------------------------------------------------------
   Lenis + sincronización con ScrollTrigger
--------------------------------------------------------- */
let lenis = null;
function initSmoothScroll() {
  if (REDUCED) return;
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToTarget(target) {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.2 });
  else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' });
}

/* ---------------------------------------------------------
   PRELOADER
--------------------------------------------------------- */
function runLoader() {
  return new Promise((resolve) => {
    const loader = document.getElementById('loader');
    if (REDUCED || !loader) {
      loader?.remove();
      resolve();
      return;
    }
    const chars = loader.querySelectorAll('[data-loader-word] span');
    const bar = loader.querySelector('[data-loader-bar]');
    const countEl = loader.querySelector('[data-loader-count]');
    const statusEl = loader.querySelector('[data-loader-status]');
    const steps = [
      'inicializando entorno seguro',
      'verificando integridad',
      'estableciendo canal cifrado',
      'listo',
    ];

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(iv);
      clearTimeout(safety);
      loader.style.transition = 'transform .6s cubic-bezier(.77,0,.175,1), opacity .5s ease';
      loader.style.transform = 'translateY(-100%)';
      loader.style.opacity = '0';
      setTimeout(() => { loader.remove(); resolve(); }, 620);
    };

    // Adorno con GSAP (best-effort, NO bloquea nada)
    try { gsap.fromTo(chars, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: 'expo.out', stagger: 0.04 }); } catch (_) {}

    // Contador por RELOJ REAL (setInterval): funciona aunque rAF esté muerto
    const DURATION = 1700;
    const t0 = (window.performance && performance.now) ? performance.now() : Date.now();
    const now = () => ((window.performance && performance.now) ? performance.now() : Date.now());
    const iv = setInterval(() => {
      const p = Math.min(1, (now() - t0) / DURATION);
      const v = Math.round(p * 100);
      if (countEl) countEl.textContent = v;
      if (bar) bar.style.width = v + '%';
      if (statusEl) {
        const s = steps[Math.min(steps.length - 1, Math.floor(v / 26))];
        if (statusEl.textContent !== s) statusEl.textContent = s;
      }
      if (p >= 1) { clearInterval(iv); setTimeout(finish, 220); }
    }, 40);

    // Seguridad absoluta
    const safety = setTimeout(finish, 3500);
  });
}

/* ---------------------------------------------------------
   HERO — entrada escalonada + movimiento ambiental
--------------------------------------------------------- */
function initHero() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const words = hero.querySelectorAll('.hero__title .w');
  const eyebrow = hero.querySelector('.hero__eyebrow');
  const lead = hero.querySelector('.hero__lead');
  const leadWords = lead ? splitWords(lead) : [];
  const actions = hero.querySelector('.hero__actions');
  const floats = hero.querySelectorAll('[data-float]');
  const ghost = hero.querySelector('[data-ghost]');
  const scrollCue = hero.querySelector('.hero__scroll');

  gsap.set(words, { y: 0, yPercent: 115, rotate: 4 });
  gsap.set([eyebrow, actions, scrollCue], { autoAlpha: 0, y: 24 });
  gsap.set(lead, { autoAlpha: 1 });
  gsap.set(leadWords, { yPercent: 110 });
  gsap.set(floats, { autoAlpha: 0, scale: 0.9, y: (i) => (i % 2 ? 40 : -40), x: (i) => (i % 2 ? 30 : -30) });
  gsap.set(ghost, { autoAlpha: 0, xPercent: 12 });

  if (REDUCED) {
    gsap.set([eyebrow, actions, scrollCue, ...leadWords, ...floats, ghost], { clearProps: 'all' });
    gsap.set(words, { clearProps: 'all' });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.8 }, 0)
    .to(words, {
      yPercent: 0,
      rotate: 0,
      duration: 1.15,
      stagger: { each: 0.08, from: 'start' },
    }, 0.15)
    .to(leadWords, { yPercent: 0, duration: 0.9, stagger: 0.012 }, 0.5)
    .to(actions, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.75)
    .to(ghost, { autoAlpha: 1, xPercent: 0, duration: 1.6, ease: 'power3.out' }, 0.3)
    .to(floats, {
      autoAlpha: 1, scale: 1, x: 0, y: 0,
      duration: 1.1, stagger: 0.09, ease: 'elastic.out(0.7, 0.6)',
    }, 0.6)
    .to(scrollCue, { autoAlpha: 1, y: 0, duration: 0.7 }, 1);

  // Seguridad: si la pestaña carga oculta (rAF pausado), garantizar que el hero
  // termine su entrada al volver a estar visible o pasado un límite de tiempo.
  const settleHero = () => {
    if (tl.progress() < 1) tl.progress(1);
    gsap.set([eyebrow, actions, scrollCue, ...floats, ...leadWords], { clearProps: 'visibility' });
  };
  setTimeout(settleHero, (tl.duration() + 4) * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { ScrollTrigger.refresh(); }
  });

  // Movimiento ambiental persistente (muy sutil) tras la entrada
  tl.add(() => {
    words.forEach((w, i) => {
      gsap.to(w, {
        yPercent: gsap.utils.random(-3, 3),
        duration: gsap.utils.random(3.5, 5.5),
        repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.15,
      });
    });
    floats.forEach((f, i) => {
      gsap.to(f, {
        y: `+=${gsap.utils.random(-14, 14)}`,
        x: `+=${gsap.utils.random(-8, 8)}`,
        rotate: gsap.utils.random(-2, 2),
        duration: gsap.utils.random(4, 7),
        repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * 0.2,
      });
    });
  });
}

/* ---------------------------------------------------------
   PARALLAX DE PUNTERO — capas con distinta profundidad
--------------------------------------------------------- */
function initPointerParallax() {
  if (REDUCED || COARSE) return;
  const layers = [...document.querySelectorAll('[data-depth]')].map((el) => {
    const depth = parseFloat(el.dataset.depth) || 0.1;
    return {
      el,
      depth,
      qx: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }),
      qy: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' }),
      qr: gsap.quickTo(el, 'rotate', { duration: 1.2, ease: 'power3' }),
    };
  });

  window.addEventListener('pointermove', (e) => {
    const rx = e.clientX / window.innerWidth - 0.5;
    const ry = e.clientY / window.innerHeight - 0.5;
    layers.forEach((l) => {
      const mag = l.depth * 60;
      l.qx(-rx * mag);
      l.qy(-ry * mag);
      l.qr(-rx * l.depth * 6);
    });
  }, { passive: true });
}

/* ---------------------------------------------------------
   ESCENAS DE SCROLL — una personalidad por sección
--------------------------------------------------------- */
function initScrollScenes(bg) {
  if (REDUCED) return;

  /* progreso global -> fondo */
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      bg.setScroll(self.scroll());
      bg.setTint(self.progress * 1.4);
    },
  });

  /* HERO — el contenido se aleja levemente, el ghost cruza la pantalla */
  gsap.to('.hero__grid', {
    yPercent: -8, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__eyebrow, .hero__title', {
    autoAlpha: 0.25, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'center top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__scroll', {
    autoAlpha: 0, y: 20, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '18% top', scrub: true },
  });
  gsap.to('[data-ghost]', {
    xPercent: -60, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
  });
  gsap.to('.hero__float--a, .hero__float--c', {
    yPercent: -120, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 },
  });
  gsap.to('.hero__float--b, .hero__float--d', {
    yPercent: 90, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.5 },
  });

  /* MANIFESTO — reveal por líneas atado al scroll + drift horizontal */
  const manifesto = document.querySelector('.manifesto__text');
  if (manifesto) {
    const mWords = splitWords(manifesto);
    gsap.set(mWords, { yPercent: 110, opacity: 0.14 });
    gsap.to(mWords, {
      yPercent: 0, opacity: 1, stagger: 0.06, ease: 'none',
      scrollTrigger: { trigger: '.manifesto', start: 'top 92%', end: 'top 18%', scrub: true },
    });
  }
  gsap.to('.manifesto [data-drift]', {
    xPercent: -30, ease: 'none',
    scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: 1 },
  });
  gsap.to('.manifesto__aside', {
    yPercent: -60, ease: 'none',
    scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: 1.4 },
  });

  /* Títulos de sección con reveal por palabra enmascarada */
  document.querySelectorAll('[data-reveal="lines-scrub"]').forEach((el) => {
    const w = splitWords(el);
    gsap.set(w, { yPercent: 120 });
    gsap.to(w, {
      yPercent: 0, stagger: 0.045, ease: 'expo.out', duration: 0.9,
      scrollTrigger: { trigger: el, start: 'top 82%' },
    });
  });

  /* data-reveal="fade" — wipe con clip + deriva, no un fade genérico */
  document.querySelectorAll('[data-reveal="fade"]').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.fromTo(el,
      { autoAlpha: 0, x: -18, clipPath: 'inset(0 100% 0 0)' },
      {
        autoAlpha: 1, x: 0, clipPath: 'inset(0 0% 0 0)',
        duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
      });
  });

  /* data-reveal="lines" (fuera del hero) */
  document.querySelectorAll('[data-reveal="lines"]').forEach((el) => {
    if (el.closest('.hero')) return;
    const w = splitWords(el);
    gsap.set(w, { yPercent: 110 });
    gsap.to(w, {
      yPercent: 0, stagger: 0.02, ease: 'expo.out', duration: 0.8,
      scrollTrigger: { trigger: el, start: 'top 86%' },
    });
  });

  /* CAPABILITIES — entrada con stagger + blur, y parallax diferencial */
  const caps = gsap.utils.toArray('[data-cap]');
  gsap.set(caps, { autoAlpha: 0, y: 80, filter: 'blur(14px)' });
  ScrollTrigger.batch(caps, {
    start: 'top 85%',
    onEnter: (batch) => gsap.to(batch, {
      autoAlpha: 1, y: 0, filter: 'blur(0px)',
      duration: 1.1, ease: 'expo.out', stagger: 0.12, overwrite: true,
    }),
  });
  caps.forEach((cap) => {
    const dir = cap.dataset.offset?.startsWith('up') ? 1 : -1;
    gsap.to(cap, {
      yPercent: dir * 8, ease: 'none',
      scrollTrigger: { trigger: cap, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
    });
  });

  /* WORK — scroll vertical mueve el track horizontalmente (pin) */
  mm.add('(min-width: 901px)', () => {
    const track = document.querySelector('[data-work-track]');
    const section = document.querySelector('.work');
    if (!track || !section) return;

    const tween = gsap.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth * 0.9),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + (track.scrollWidth - window.innerWidth * 0.9 + window.innerHeight),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });

    // parallax interno de cada imagen mientras el track se mueve
    gsap.utils.toArray('[data-proj-img]').forEach((img) => {
      gsap.fromTo(img, { xPercent: -5 }, {
        xPercent: 5, ease: 'none',
        scrollTrigger: {
          trigger: img.closest('.proj'),
          containerAnimation: tween,
          start: 'left right',
          end: 'right left',
          scrub: true,
        },
      });
    });

    // títulos de proyecto entran con clip
    gsap.utils.toArray('.proj__title span').forEach((t) => {
      gsap.from(t, {
        yPercent: 120, ease: 'expo.out', duration: 0.9,
        scrollTrigger: {
          trigger: t.closest('.proj'),
          containerAnimation: tween,
          start: 'left 78%',
        },
      });
    });

    return () => { tween.scrollTrigger?.kill(); tween.kill(); gsap.set(track, { clearProps: 'x' }); };
  });

  // fallback mobile: proyectos aparecen apilados con stagger
  mm.add('(max-width: 900px)', () => {
    gsap.utils.toArray('[data-proj]').forEach((p) => {
      gsap.from(p, {
        autoAlpha: 0, y: 60, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: p, start: 'top 88%' },
      });
    });
  });

  /* APPROACH — línea que se dibuja, pasos escalonados, forma que rota */
  gsap.to('[data-approach-line]', {
    height: '100%', ease: 'none',
    scrollTrigger: { trigger: '.approach', start: 'top 60%', end: 'bottom 80%', scrub: true },
  });
  gsap.utils.toArray('[data-step]').forEach((step, i) => {
    gsap.from(step, {
      autoAlpha: 0, y: 60, x: i % 2 ? 40 : -40, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: step, start: 'top 85%' },
    });
  });
  gsap.to('[data-approach-shape]', {
    rotate: 180, yPercent: 60, borderRadius: '60% 40% 33% 67% / 55% 62% 38% 45%', ease: 'none',
    scrollTrigger: { trigger: '.approach', start: 'top bottom', end: 'bottom top', scrub: 1.4 },
  });

  /* STACK — filas que entran escalonadas + ghost horizontal */
  gsap.utils.toArray('[data-stack]').forEach((row, i) => {
    gsap.from(row, {
      autoAlpha: 0, yPercent: 60, ease: 'expo.out', duration: 0.7,
      scrollTrigger: { trigger: row, start: 'top 92%' },
      delay: (i % 6) * 0.03,
    });
  });
  const stackGhost = document.querySelector('.stack__ghost');
  if (stackGhost) {
    gsap.fromTo(stackGhost, { xPercent: 6 }, {
      xPercent: -34, ease: 'none',
      scrollTrigger: { trigger: '.stack', start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
  }

  /* CTA — glow que sube con el scroll + título por líneas */
  gsap.to('.cta', {
    '--o': 1, ease: 'none',
    scrollTrigger: { trigger: '.cta', start: 'top 70%', end: 'center center', scrub: true },
  });
  const ctaWords = [];
  document.querySelectorAll('.cta__title .line').forEach((line) => ctaWords.push(...splitWords(line)));
  gsap.set(ctaWords, { yPercent: 120 });
  gsap.to(ctaWords, {
    yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.05,
    scrollTrigger: { trigger: '.cta', start: 'top 72%' },
  });

  /* FOOTER — wordmark con parallax + escala, marquee */
  gsap.fromTo('[data-footer-word]',
    { xPercent: -8, scale: 0.94 },
    {
      xPercent: 4, scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
    });
}

/* ---------------------------------------------------------
   MARQUEES infinitos
--------------------------------------------------------- */
function initMarquees() {
  if (REDUCED) return;
  document.querySelectorAll('[data-marquee]').forEach((el) => {
    const w = el.scrollWidth / 2;
    gsap.to(el, { x: -w, duration: 24, ease: 'none', repeat: -1 });
  });
}

/* ---------------------------------------------------------
   MOVIMIENTO AMBIENTAL — nada queda perfectamente quieto
   Deriva mínima e infinita, desfasada, sobre elementos decorativos.
   Solo transform. Se compone sobre lo que ya anima el scroll/hover
   usando un wrapper implícito (gsap "+=" relativo evita pisar layout).
--------------------------------------------------------- */
function initAmbient() {
  if (REDUCED) return;
  const drift = (els, opts = {}) => {
    gsap.utils.toArray(els).forEach((el, i) => {
      gsap.to(el, {
        yPercent: opts.y ?? gsap.utils.random(-2.2, 2.2),
        xPercent: opts.x ?? gsap.utils.random(-1.4, 1.4),
        rotation: opts.r ?? gsap.utils.random(-1.1, 1.1),
        duration: gsap.utils.random(opts.dMin ?? 3.4, opts.dMax ?? 6.2),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: i * (opts.stagger ?? 0.35),
      });
    });
  };

  // Solo elementos SIN transform propio (base ni :hover), para no pisar micro-interacciones
  drift('.step__n', { x: 0, r: 0 });
  drift('.proj__index', { r: gsap.utils.random(-2, 2) });
  drift('.manifesto__aside span', { x: 0 });
  gsap.to('.nav__mark', { rotation: 6, duration: 5, ease: 'sine.inOut', repeat: -1, yoyo: true });
  // los chips del hero ya derivan desde initHero
}

/* ---------------------------------------------------------
   CURSOR
--------------------------------------------------------- */
function initCursor() {
  if (REDUCED || COARSE) return;
  const cursor = document.getElementById('cursor');
  if (!cursor) return;
  const dot = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');
  const label = cursor.querySelector('[data-cursor-label]');

  const qxD = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power2' });
  const qyD = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power2' });
  const qxR = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
  const qyR = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
  const qxL = gsap.quickTo(label, 'x', { duration: 0.35, ease: 'power3' });
  const qyL = gsap.quickTo(label, 'y', { duration: 0.35, ease: 'power3' });

  window.addEventListener('pointermove', (e) => {
    qxD(e.clientX); qyD(e.clientY);
    qxR(e.clientX); qyR(e.clientY);
    qxL(e.clientX); qyL(e.clientY + 34);
  }, { passive: true });

  const hoverTargets = '[data-magnetic], a[href], [data-cap], [data-proj], [data-cursor]';
  document.querySelectorAll(hoverTargets).forEach((t) => {
    t.addEventListener('pointerenter', () => {
      document.body.classList.add('cursor-hover');
      gsap.to(ring, { scale: 1.7, duration: 0.4, ease: 'power3' });
      const txt = t.dataset.cursor;
      if (txt) { label.textContent = txt; gsap.to(label, { autoAlpha: 1, duration: 0.3 }); }
    });
    t.addEventListener('pointerleave', () => {
      document.body.classList.remove('cursor-hover');
      gsap.to(ring, { scale: 1, duration: 0.4, ease: 'power3' });
      gsap.to(label, { autoAlpha: 0, duration: 0.2 });
    });
  });
}

/* ---------------------------------------------------------
   BOTONES MAGNÉTICOS + brillo de cards al puntero
--------------------------------------------------------- */
function initMagnetic() {
  if (REDUCED || COARSE) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = 0.35;
    const inner = el.querySelector('span') || el;
    const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    const qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    const qix = gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3' });
    const qiy = gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3' });

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left - r.width / 2;
      const my = e.clientY - r.top - r.height / 2;
      qx(mx * strength); qy(my * strength);
      qix(mx * strength * 0.4); qiy(my * strength * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      qx(0); qy(0); qix(0); qiy(0);
    });
  });

  // glow que sigue al puntero dentro de cada card
  document.querySelectorAll('[data-cap]').forEach((cap) => {
    cap.addEventListener('pointermove', (e) => {
      const r = cap.getBoundingClientRect();
      cap.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
      cap.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
    });
  });

  // imagen de proyecto reacciona independiente del contenedor al hover
  document.querySelectorAll('[data-proj]').forEach((proj) => {
    const img = proj.querySelector('[data-proj-img]');
    if (!img) return;
    proj.addEventListener('pointermove', (e) => {
      const r = proj.getBoundingClientRect();
      const mx = (e.clientX - r.left) / r.width - 0.5;
      const my = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(img, { x: mx * 26, y: my * 26, duration: 0.6, ease: 'power3' });
    });
    proj.addEventListener('pointerleave', () => {
      gsap.to(img, { x: 0, y: 0, duration: 0.8, ease: 'power3' });
    });
  });
}

/* ---------------------------------------------------------
   NAV — ocultar al bajar, mostrar al subir
--------------------------------------------------------- */
function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const toggle = document.getElementById('nav-toggle');

  // numerar los links del menú móvil
  document.querySelectorAll('#nav-links a').forEach((a, i) => {
    a.dataset.i = '0' + (i + 1);
  });

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle?.setAttribute('aria-expanded', String(open));
    toggle?.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (open) lenis?.stop(); else lenis?.start();
  };
  toggle?.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));

  let last = 0;
  ScrollTrigger.create({
    start: 'top top',
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      if (nav.classList.contains('is-open')) return;
      if (y > last && y > 300) nav.classList.add('is-hidden');
      else nav.classList.remove('is-hidden');
      last = y;
    },
  });

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        if (nav.classList.contains('is-open')) setMenu(false);
        scrollToTarget(id);
      }
    });
  });
}

/* ---------------------------------------------------------
   RELOJ + año
--------------------------------------------------------- */
function initClock() {
  const els = document.querySelectorAll('[data-clock]');
  const yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
  if (!els.length) return;
  const tick = () => {
    const d = new Date();
    const s = [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map((n) => String(n).padStart(2, '0')).join(':');
    els.forEach((el) => (el.textContent = s));
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------------------------------------------------------
   BOOT
--------------------------------------------------------- */
function revealFailsafe() {
  document.documentElement.classList.add('failsafe');
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-ready');
  const l = document.getElementById('loader');
  if (l) l.remove();
  try { document.querySelectorAll('[data-reveal]').forEach((el) => gsap.set(el, { clearProps: 'all' })); } catch (_) {}
}

async function boot() {
  try { initClock(); } catch (_) {}

  // El viewport puede reportar 0 mientras el panel no está montado (máx 2s)
  if (!window.innerWidth) {
    await new Promise((res) => {
      const check = () => { if (window.innerWidth) { window.removeEventListener('resize', check); res(); } };
      window.addEventListener('resize', check);
      setTimeout(res, 2000);
    });
  }

  let bg = { setScroll() {}, setTint() {} };
  try { bg = initBackground({ reducedMotion: REDUCED }); } catch (_) {}
  try { initSmoothScroll(); } catch (_) {}
  try { initCursor(); } catch (_) {}

  document.body.classList.add('is-ready');
  lenis?.stop();

  try { await Promise.race([document.fonts.ready, wait(1200)]); } catch (_) {}

  await runLoader();

  document.body.classList.remove('is-loading');
  lenis?.start();

  try {
    initHero();
    initPointerParallax();
    initScrollScenes(bg);
    initMagnetic();
    initMarquees();
    initNav();
    initAmbient();
    ScrollTrigger.refresh();
  } catch (err) {
    console.error('[quivorax] fallo de animación, modo failsafe:', err);
    revealFailsafe();
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { try { ScrollTrigger.refresh(); } catch (_) {} });
  }
  window.addEventListener('load', () => { try { ScrollTrigger.refresh(); } catch (_) {} });
  window.addEventListener('resize', () => { try { ScrollTrigger.refresh(); } catch (_) {} });
}

function start() {
  boot().catch((err) => {
    console.error('[quivorax] boot falló, modo failsafe:', err);
    revealFailsafe();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
