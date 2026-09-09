/* =========================================================
   QUIVORAX — backdrop canvas
   "Flow lattice": nudos geodésicos rotando con hilos curvos y
   chispas viajando por las aristas — inspirado en la referencia
   del usuario, en tonos grisáceos ↔ rosados. Reactivo a mouse
   y scroll. Todo dibujado con alpha bajo: el fondo nunca compite
   con el contenido.
   ========================================================= */

export function initBackground({ reducedMotion = false } = {}) {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || reducedMotion) return { setScroll() {}, setTint() {} };

  const ctx = canvas.getContext('2d', { alpha: true });
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;

  let W = 0, H = 0, DPR = 1;
  let raf = 0;
  let running = true;

  const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const state = { scroll: 0, hue: 0, targetHue: 0 };

  // 0 = gris medio (frío) · 1 = rosa — continuidad entre secciones
  const COLORS = {
    gray: [160, 166, 174],
    pink: [227, 140, 176],
    dot: [200, 198, 204],
    spark: [255, 240, 248],
  };

  // ---------- geometría: icosaedro (12 vértices, 30 aristas) ----------
  const PHI = (1 + Math.sqrt(5)) / 2;
  const BASE_VERTS = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
  ].map(([x, y, z]) => {
    const len = Math.hypot(x, y, z);
    return [x / len, y / len, z / len];
  });
  const EDGES = [
    [0, 1], [0, 5], [0, 7], [0, 10], [0, 11],
    [1, 5], [1, 7], [1, 8], [1, 9],
    [2, 3], [2, 4], [2, 6], [2, 10], [2, 11],
    [3, 4], [3, 6], [3, 8], [3, 9],
    [4, 5], [4, 9], [4, 11],
    [5, 9], [5, 11],
    [6, 7], [6, 8], [6, 10],
    [7, 8], [7, 10],
    [8, 9],
    [10, 11],
  ];

  let knots = [];
  let ambient = [];

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    seed();
  }

  function makeSparks(n) {
    return new Array(n).fill(0).map(() => ({
      edge: Math.floor(Math.random() * EDGES.length),
      t: Math.random(),
      speed: 0.00016 + Math.random() * 0.00026,
    }));
  }

  const STRANDS = 3; // hilos paralelos por arista, para el efecto "manojo"

  function seed() {
    const small = W < 720;
    const nKnots = isCoarse ? 1 : 2;

    knots = [
      {
        cx: W * (small ? 0.78 : 0.7),
        cy: H * (small ? 0.13 : 0.4),
        radius: Math.min(W, H) * (small ? 0.17 : 0.3),
        rx: 0.5, ry: 0.9, rz: 0.1,
        vrx: 0.00012, vry: 0.00017, vrz: 0.00006,
        wobble: 1,
        depth: small ? 0.75 : 1,
        sparks: makeSparks(isCoarse ? 14 : 22),
      },
      {
        cx: W * 0.1,
        cy: H * 0.8,
        radius: Math.min(W, H) * 0.15,
        rx: 1.2, ry: 0.3, rz: 0.5,
        vrx: -0.00015, vry: 0.00011, vrz: -0.00009,
        wobble: 0.65,
        depth: 0.55,
        sparks: makeSparks(10),
      },
    ].slice(0, nKnots);

    const area = W * H;
    const ambientCount = Math.max(16, Math.min(Math.round(area / 30000), isCoarse ? 30 : 60));
    ambient = new Array(ambientCount).fill(0).map(() => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.045,
      vy: (Math.random() - 0.5) * 0.045,
      r: Math.random() * 1.05 + 0.35,
      z: Math.random() * 0.7 + 0.3,
      tw: Math.random() * Math.PI * 2,
    }));
  }

  function mix(a, b, f) {
    return [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    ];
  }

  function rotate(v, rx, ry, rz) {
    let [x, y, z] = v;
    let c = Math.cos(rx), s = Math.sin(rx);
    let y1 = y * c - z * s, z1 = y * s + z * c;
    y = y1; z = z1;
    c = Math.cos(ry); s = Math.sin(ry);
    let x2 = x * c + z * s, z2 = -x * s + z * c;
    x = x2; z = z2;
    c = Math.cos(rz); s = Math.sin(rz);
    let x3 = x * c - y * s, y3 = x * s + y * c;
    return [x3, y3, z];
  }

  function project(v, knot, tiltX, tiltY) {
    const [x, y, z] = rotate(v, knot.rx + tiltY, knot.ry + tiltX, knot.rz);
    const persp = 2.6 / (2.6 + z);
    return { x: knot.cx + x * knot.radius * persp, y: knot.cy + y * knot.radius * persp, z, persp };
  }

  function quadPoint(p0, c, p1, t) {
    const it = 1 - t;
    return {
      x: it * it * p0.x + 2 * it * t * c.x + t * t * p1.x,
      y: it * it * p0.y + 2 * it * t * c.y + t * t * p1.y,
    };
  }

  function drawGlows(t, lineC) {
    const maxDim = Math.max(W, H);
    glow(
      W * (0.22 + Math.sin(t * 0.00007) * 0.1) + (pointer.x - 0.5) * 50,
      H * (0.28 + Math.cos(t * 0.00009) * 0.12) + (pointer.y - 0.5) * 50,
      maxDim * 0.4, lineC, 0.05
    );
    glow(
      W * (0.82 + Math.cos(t * 0.00006) * 0.08),
      H * (0.72 + Math.sin(t * 0.00008) * 0.1) - ((state.scroll * 0.02) % Math.max(1, H)),
      maxDim * 0.32, mix(COLORS.gray, COLORS.pink, 1 - state.hue), 0.045
    );
  }

  function glow(x, y, r, [cr, cg, cb], a) {
    if (!isFinite(x) || !isFinite(y) || !isFinite(r) || r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`);
    g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawGrid() {
    const gap = 64;
    const ox = (state.scroll * 0.04) % gap;
    const oy = (state.scroll * 0.12) % gap;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(210,210,216,0.02)';
    ctx.beginPath();
    for (let x = -gap + ((pointer.x - 0.5) * -12) - ox; x < W + gap; x += gap) {
      ctx.moveTo(x, 0); ctx.lineTo(x, H);
    }
    for (let y = -gap + ((pointer.y - 0.5) * -12) + oy; y < H + gap; y += gap) {
      ctx.moveTo(0, y); ctx.lineTo(W, y);
    }
    ctx.stroke();
  }

  function drawAmbient(t, lineC) {
    for (let i = 0; i < ambient.length; i++) {
      const p = ambient[i];
      p.x += p.vx * (0.5 + p.z);
      p.y += p.vy * (0.5 + p.z);
      if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; else if (p.y > H + 10) p.y = -10;
      const tw = 0.5 + 0.5 * Math.sin(t * 0.0016 + p.tw);
      ctx.fillStyle = `rgba(${lineC[0]},${lineC[1]},${lineC[2]},${0.22 * p.z * tw})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawKnot(knot, t, lineC, boost) {
    const tiltX = (pointer.x - 0.5) * 0.55 * knot.depth;
    const tiltY = (pointer.y - 0.5) * 0.55 * knot.depth;
    const pts = BASE_VERTS.map((v) => project(v, knot, tiltX, tiltY));
    const edgeGeom = new Array(EDGES.length).fill(null);
    const lineStr = `${lineC[0]},${lineC[1]},${lineC[2]}`;

    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    // pasada de glow difuso: contorno ancho y muy suave por detrás de los hilos
    ctx.shadowColor = `rgba(${lineStr},0.9)`;
    for (let i = 0; i < EDGES.length; i++) {
      const [ia, ib] = EDGES[i];
      const a = pts[ia], b = pts[ib];
      const midZ = (a.z + b.z) / 2;
      const base = Math.max(0, 0.72 - midZ * 0.4) * knot.depth * boost;
      if (base <= 0.004) continue;

      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;

      // varios hilos paralelos por arista, cada uno con su propia ondulación
      const strandCurves = [];
      for (let s = 0; s < STRANDS; s++) {
        const phase = i * 1.7 + s * 2.3;
        const spread = (s - (STRANDS - 1) / 2) * len * 0.045;
        const wob = Math.sin(t * 0.00021 + phase) * (len * 0.16) * knot.wobble;
        const c = { x: mx + nx * (wob + spread), y: my + ny * (wob + spread) };
        strandCurves.push(c);

        ctx.shadowBlur = 4.5 * knot.depth * (0.6 + boost * 0.4);
        ctx.strokeStyle = `rgba(${lineStr},${base * 0.55})`;
        ctx.lineWidth = Math.max(0.55, 1 * knot.depth * (0.5 + a.persp * 0.5));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
        ctx.stroke();
      }
      // hilo central, más nítido, usado también para las chispas viajeras
      edgeGeom[i] = { a, b, c: strandCurves[Math.floor(STRANDS / 2)] };
    }
    ctx.shadowBlur = 0;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const a = Math.max(0, 0.55 - p.z * 0.3) * 0.8 * knot.depth * boost;
      if (a <= 0.004) continue;
      ctx.shadowColor = `rgba(${lineStr},0.9)`;
      ctx.shadowBlur = 5 * knot.depth;
      ctx.fillStyle = `rgba(${lineStr},${a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.3 * (0.6 + p.persp * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    for (const s of knot.sparks) {
      s.t += s.speed * (16 + boost * 10);
      if (s.t > 1) s.t -= 1;
      const geo = edgeGeom[s.edge];
      if (!geo) continue;
      const p = quadPoint(geo.a, geo.c, geo.b, s.t);
      const glowA = 0.95 * knot.depth * boost;
      const r = 9 * knot.depth;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      grad.addColorStop(0, `rgba(${COLORS.spark[0]},${COLORS.spark[1]},${COLORS.spark[2]},${glowA})`);
      grad.addColorStop(0.4, `rgba(${COLORS.spark[0]},${COLORS.spark[1]},${COLORS.spark[2]},${glowA * 0.35})`);
      grad.addColorStop(1, `rgba(${COLORS.spark[0]},${COLORS.spark[1]},${COLORS.spark[2]},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, glowA * 1.1)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.4 * knot.depth, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  function step(t) {
    if (!running) return;
    raf = requestAnimationFrame(step);
    if (!W || !H) return;

    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    state.hue += (state.targetHue - state.hue) * 0.03;

    ctx.clearRect(0, 0, W, H);

    const lineC = mix(COLORS.gray, COLORS.pink, state.hue);

    drawGlows(t, lineC);
    drawGrid();
    drawAmbient(t, mix(COLORS.dot, COLORS.pink, state.hue * 0.6));

    for (const knot of knots) {
      knot.rx += knot.vrx * 16;
      knot.ry += knot.vry * 16;
      knot.rz += knot.vrz * 16;

      const dx = pointer.x - knot.cx / W;
      const dy = pointer.y - knot.cy / H;
      const dist = Math.hypot(dx, dy);
      const boost = 1 + Math.max(0, 0.55 - dist) * 1.3;

      drawKnot(knot, t, lineC, boost);
    }

    const gx = pointer.tx * W;
    const gy = pointer.ty * H;
    ctx.fillStyle = `rgba(${lineC[0]},${lineC[1]},${lineC[2]},0.45)`;
    ctx.beginPath();
    ctx.arc(gx, gy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------- events ----------
  const onMove = (e) => {
    const p = e.touches ? e.touches[0] : e;
    pointer.tx = p.clientX / window.innerWidth;
    pointer.ty = p.clientY / window.innerHeight;
  };
  const onVisibility = () => {
    running = !document.hidden;
    if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(step); }
  };
  let resizeT;
  const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(resize, 150); };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);

  resize();
  raf = requestAnimationFrame(step);

  return {
    /* progreso global de scroll 0..1 — desplaza levemente la rejilla y los glows */
    setScroll(v) { state.scroll = v; },
    /* 0 = gris · 1 = rosa — continuidad entre secciones */
    setTint(v) { state.targetHue = Math.max(0, Math.min(1, v)); },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    },
  };
}
