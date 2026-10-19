(function () {
  const C = window.CONTRIB;
  const E = {};
  const r = n => Math.round(n * 10) / 10;
  E.r = r;

  E.dates = (function () {
    const out = [];
    const d0 = Date.parse(C.start + 'T00:00:00Z');
    for (let i = 0; i < C.personal.length; i++) out.push(new Date(d0 + i * 86400000).toISOString().slice(0, 10));
    return out;
  })();

  E.series = function (source) {
    if (source === 'personal') return C.personal.slice();
    if (source === 'work') return C.work.slice();
    return C.personal.map((v, i) => v + C.work[i]);
  };

  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  E.MON = MON;
  E.fmtDate = iso => MON[+iso.slice(5, 7) - 1] + ' ' + (+iso.slice(8, 10));
  E.fmtDateY = iso => (+iso.slice(8, 10)) + ' ' + MON[+iso.slice(5, 7) - 1].toUpperCase() + ' ' + iso.slice(0, 4);
  E.fmtMonth = key => MON[+key.slice(5, 7) - 1] + ' ' + key.slice(0, 4);
  E.n = v => v.toLocaleString('en-US');

  E.stats = function (s) {
    const dates = E.dates;
    const n = s.length;
    let total = 0, active = 0, max = 0, maxI = 0, run = 0, best = 0, bestEnd = 0;
    s.forEach((v, i) => {
      total += v;
      if (v > 0) { active++; run++; if (run > best) { best = run; bestEnd = i; } } else run = 0;
      if (v > max) { max = v; maxI = i; }
    });
    let cur = 0, i = n - 1;
    if (s[i] === 0) i--;
    while (i >= 0 && s[i] > 0) { cur++; i--; }
    const months = [];
    let key = null;
    s.forEach((v, j) => {
      const k = dates[j].slice(0, 7);
      if (k !== key) { months.push({ key: k, total: 0, start: j, end: j }); key = k; }
      const m = months[months.length - 1];
      m.total += v; m.end = j;
    });
    const startDow = new Date(dates[0] + 'T00:00:00Z').getUTCDay();
    const weekday = new Array(7).fill(0);
    s.forEach((v, j) => { weekday[(startDow + j) % 7] += v; });
    const busiest = months.reduce((a, b) => (b.total > a.total ? b : a), months[0]);
    return {
      n, total, active, max, maxI, maxDate: dates[maxI], longest: best, longestEnd: bestEnd,
      longestStart: bestEnd - best + 1, current: cur, months, startDow, weekday, busiest,
      start: dates[0], end: dates[n - 1],
    };
  };

  E.gauss = function (arr, sigma) {
    if (sigma <= 0) return arr.slice();
    const rad = Math.ceil(sigma * 3), k = [];
    for (let i = -rad; i <= rad; i++) k.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
    return arr.map((_, i) => {
      let s = 0, ws = 0;
      for (let j = -rad; j <= rad; j++) {
        const idx = i + j;
        if (idx < 0 || idx >= arr.length) continue;
        s += arr[idx] * k[j + rad]; ws += k[j + rad];
      }
      return s / ws;
    });
  };

  E.resample = (arr, n) => Array.from({ length: n }, (_, i) => {
    const t = i * (arr.length - 1) / (n - 1);
    const a = Math.floor(t), b = Math.min(arr.length - 1, a + 1), f = t - a;
    return arr[a] * (1 - f) + arr[b] * f;
  });

  E.bins = (arr, n) => {
    const out = new Array(n).fill(0);
    arr.forEach((v, i) => { out[Math.min(n - 1, Math.floor(i * n / arr.length))] += v; });
    return out;
  };

  E.norm = (arr, f = Math.sqrt) => {
    const m = Math.max(...arr.map(f)) || 1;
    return arr.map(v => f(v) / m);
  };

  E.linePath = pts => 'M' + pts.map(p => r(p[0]) + ' ' + r(p[1])).join('L');

  E.smoothPath = function (pts, tension = 1) {
    if (pts.length < 2) return '';
    let d = 'M' + r(pts[0][0]) + ' ' + r(pts[0][1]);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + r(p1[0] + (p2[0] - p0[0]) / 6 * tension) + ' ' + r(p1[1] + (p2[1] - p0[1]) / 6 * tension) + ' ' +
        r(p2[0] - (p3[0] - p1[0]) / 6 * tension) + ' ' + r(p2[1] - (p3[1] - p1[1]) / 6 * tension) + ' ' +
        r(p2[0]) + ' ' + r(p2[1]);
    }
    return d;
  };

  E.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  E.quartiles = function (s) {
    const nz = s.filter(v => v > 0).sort((a, b) => a - b);
    if (!nz.length) return [0, 0, 0];
    const q = p => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))];
    return [q(0.25), q(0.5), q(0.75)];
  };
  E.level = (v, q) => (v === 0 ? 0 : v <= q[0] ? 1 : v <= q[1] ? 2 : v <= q[2] ? 3 : 4);

  // Single-stroke letters on a 14-unit cap height, like a plotter or an oscilloscope beam would draw them.
  const GLYPHS = {
    B: { w: 9.1, d: 'M0 14V0H5.5C9.6 0 9.6 7 5.5 7H0M5.5 7C10.2 7 10.2 14 5.5 14H0' },
    E: { w: 9, d: 'M9 0H0V14H9M0 7H7' },
    H: { w: 10, d: 'M0 0V14M10 0V14M0 7H10' },
    O: { w: 11, d: 'M5.5 0C12.8 0 12.8 14 5.5 14C-1.8 14 -1.8 0 5.5 0Z' },
    D: { w: 9.8, d: 'M0 0V14H4.5C11.5 14 11.5 0 4.5 0H0' },
    A: { w: 10, d: 'M0 14L5 0L10 14M2.2 8.6H7.8' },
    I: { w: 0, d: 'M0 0V14' },
    ' ': { w: 3.5, d: '' },
  };
  E.GLYPHS = GLYPHS;
  E.NAME = 'BEHBOD BABAI';

  E.wordLayout = function (str, size, spacing = 4.4) {
    const k = size / 14;
    const items = [];
    let x = 0;
    for (const ch of str) {
      const g = GLYPHS[ch];
      if (!g) continue;
      if (g.d) items.push({ ch, x, d: g.d });
      x += g.w + spacing;
    }
    return { items, width: (x - spacing) * k, k };
  };

  // Draws a word as stroked single-line letters; opts.draw adds a staggered pen-drawing animation.
  E.word = function (str, x, y, size, o = {}) {
    const L = E.wordLayout(str, size, o.spacing);
    const sw = (o.sw || 2) / L.k;
    const cls = o.cls || '';
    const parts = L.items.map((it, i) => {
      const anim = o.draw ? ` style="animation-delay:${r((o.delay || 0) + i * (o.stagger || 0.12))}s"` : '';
      return `<path d="${it.d}" transform="translate(${r(it.x)} 0)" pathLength="1"${anim}/>`;
    }).join('');
    return {
      svg: `<g class="${cls}" transform="translate(${r(x)} ${r(y)}) scale(${r(L.k * 1000) / 1000})" fill="none" stroke="${o.color || 'currentColor'}" stroke-width="${r(sw * 100) / 100}" stroke-linecap="round" stroke-linejoin="round">${parts}</g>`,
      width: L.width,
    };
  };

  E.drawCss = (cls, dur = 0.9, ease = 'cubic-bezier(.6,0,.2,1)') =>
    `.${cls} path{stroke-dasharray:1 1;animation:${cls}-d ${dur}s ${ease} both}@keyframes ${cls}-d{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}`;

  let sampler = null;
  E.samplePath = function (d, m) {
    if (!sampler) {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
      svg.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
      const p = document.createElementNS(ns, 'path');
      svg.appendChild(p);
      document.body.appendChild(svg);
      sampler = p;
    }
    sampler.setAttribute('d', d);
    const L = sampler.getTotalLength();
    return { len: L, pts: Array.from({ length: m }, (_, i) => { const q = sampler.getPointAtLength(L * i / (m - 1)); return [q.x, q.y]; }) };
  };

  // Every stroke of the name as absolute polylines, split at each moveto.
  E.nameStrokes = function (str, x, y, size, m) {
    const L = E.wordLayout(str, size);
    const out = [];
    L.items.forEach(it => {
      it.d.split(/(?=M)/).filter(Boolean).forEach(sub => {
        const s = E.samplePath(sub, 64);
        out.push({ len: s.len * L.k, sub, ox: it.x });
      });
    });
    const totalLen = out.reduce((a, b) => a + b.len, 0);
    return out.map(o => {
      const count = Math.max(6, Math.round(m * o.len / totalLen));
      const s = E.samplePath(o.sub, count);
      return s.pts.map(p => [x + (p[0] + o.ox) * L.k, y + p[1] * L.k]);
    });
  };

  E.theme = function (t) {
    return t === 'light'
      ? { mode: 'light', bg: '#ffffff', panel: '#f6f8fa', fg: '#1f2328', muted: '#59636e', faint: '#d1d9e0', a1: '#3451d1', a2: '#6d4ad1', a3: '#0f8b8d', warm: '#c2410c', hot: '#d1242f' }
      : { mode: 'dark', bg: '#0d1117', panel: '#151b23', fg: '#e6edf3', muted: '#8b949e', faint: '#2a313c', a1: '#7c9cff', a2: '#a78bfa', a3: '#3dd6b5', warm: '#f0a35b', hot: '#ff6b6b' };
  };

  const SANS = `-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif`;
  const MONO = `ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,"Liberation Mono",monospace`;
  E.SANS = SANS; E.MONO = MONO;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  E.esc = esc;

  E.svg = function ({ w = 1200, h = 300, title, desc, style = '', defs = '', body, still, noBand }) {
    const ev = !noBand && E.activeEvent && E.eventDecorate ? E.eventDecorate(E.activeEvent.e, E.activeEvent.T, w, h, E.activeEvent.date) : null;
    if (ev) {
      // A nested viewport keeps every view-box transform origin inside the concept unchanged.
      body = `${ev.top}<svg x="0" y="${ev.band}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" overflow="visible">${body}${ev.over}</svg>`;
      h += ev.band; defs += ev.defs; style += ev.css;
      desc = E.activeEvent.e.badge(E.activeEvent.date) + '. ' + desc;
    }
    const base = `.sans{font-family:${SANS}}.mono{font-family:${MONO}}@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;
    const freeze = still ? '*{animation:none!important}' : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">` +
      `<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>` +
      `<style>${base}${style}${freeze}</style>${defs ? '<defs>' + defs + '</defs>' : ''}${body}</svg>`;
  };

  // SMIL animations are dropped in still mode so the frame shows its resting state.
  E.smil = (still, markup) => (still ? '' : markup);

  E.altText = function (st, sourceLabel) {
    return `Behbod Babai's last 365 days of GitHub activity drawn as a voice waveform: ${E.n(st.total)} contributions across ${st.active} active days (${sourceLabel}), busiest on ${E.fmtDate(st.maxDate)} with ${st.max}.`;
  };

  window.HL = E;
  window.CONCEPTS = [];
  window.ME_ITEMS = [];
  window.README_OPTS = [];
  window.HEADER_OPTS = [];
})();
