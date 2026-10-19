(function () {
  const R = window.HL, r = R.r, esc = R.esc;
  window.FINAL2 = window.FINAL2 || [];
  const add = c => window.FINAL2.push(Object.assign({ section: 4 }, c));
  const FA = `font-family:'Segoe UI',Tahoma,'Noto Naskh Arabic','Geeza Pro',sans-serif`;
  const sum = a => a.reduce((x, y) => x + y, 0);
  const f2 = n => Math.round(n * 100) / 100;
  const nb = s => esc(s).replace(/ /g, '&#160;');
  const HEX = /^#[0-9a-f]{6}$/i;
  const mix = (a, b, t) => {
    if (!HEX.test(a) || !HEX.test(b)) return a;
    const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const greetOf = c => (c.ev ? { text: c.ev.greet(R.vanTime(c.now || new Date())), fa: c.ev.fa || '' } : null);

  // Every fact from his current README; the work count is floored so the "1,000+" claim stays true by itself.
  const F = { site: 'behi22.github.io', work: '@behbod-babai', email: 'behibabai@gmail.com', linkedin: 'linkedin.com/in/behbod-babai' };
  const workCount = () => {
    const w = sum(R.series('work'));
    const f = w >= 1000 ? Math.floor(w / 1000) * 1000 : w >= 100 ? Math.floor(w / 100) * 100 : w;
    return R.n(f) + (f < w ? '+' : '');
  };
  const workNote = () => `private repos at Alebex AI, ${workCount()} contributions in the last year`;
  const ABOUT = 'Hello, World. I\'m Behbod Babai, a full-stack engineer based in Vancouver, BC, Canada. I specialize in building AI-powered applications and scalable web systems across frontend, backend and infrastructure. Experience: React, TypeScript, Node.js, cloud infrastructure, CI/CD, AI agents, RAG systems, voice AI and enterprise integrations. Currently building AI systems, automation platforms and voice AI solutions. Interested in software architecture, AI engineering, DevOps and full-stack development. Always learning new technologies and improving engineering practices.';

  // ---------- Shared geometry for the console and the five link rows.
  const FS = 16, CW = 9.6, LH = 25, GAP = 9, X0 = 72, XL = 40.5, XR = 1159.5, RAD = 12;
  // Clear space under the console and around each link card, so every gap in the column is the same.
  const PAD = 6;
  const pal = T => (T.mode === 'dark'
    ? { bg: '#0b0f14', bar: '#141a21', line: '#2a313c' }
    : { bg: '#f6f8fa', bar: '#eaeef2', line: '#d1d9e0' });
  // Each image is a complete card, so it looks right however a browser spaces stacked images (phones add gaps).
  const card = (y0, y1, a = RAD) => `M${XL} ${y0 + a}a${a} ${a} 0 0 1 ${a} -${a}H${XR - a}a${a} ${a} 0 0 1 ${a} ${a}V${y1 - a}a${a} ${a} 0 0 1 -${a} ${a}H${XL + a}a${a} ${a} 0 0 1 -${a} -${a}Z`;
  const chevron = (x, y, col) => `<path d="M${x} ${y - 11}l5.5 5.5-5.5 5.5" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;

  // ---------- 1. Console
  const LS = [['react', 'typescript', 'node.js', 'cloud-infrastructure', 'ci-cd'], ['ai-agents', 'rag-systems', 'voice-ai', 'enterprise-integrations']];
  const lsRows = () => {
    const cols = [];
    LS.forEach(rw => rw.forEach((n, i) => { cols[i] = Math.max(cols[i] || 0, n.length); }));
    const at = cols.map((_, i) => cols.slice(0, i).reduce((a, w) => a + w + 3, 0));
    return LS.map(rw => rw.map((n, i) => [at[i], n, 'a1', 600]));
  };
  const linkFiles = () => {
    let at = 0;
    return LINKS.map(L => {
      const n = L.name.toLowerCase().replace(/ /g, '-') + (L.down ? '.pdf' : ''), seg = [at, n, 'a1', 600];
      at += n.length + 3;
      return seg;
    });
  };
  const BLOCKS = () => [
    { cmd: 'echo "Hello, World"', out: [[[null, 'Hello, World', 'a1', 700]]] },
    { cmd: 'whoami', out: [[[null, 'Behbod Babai', 'fg', 700], [null, ' · full-stack engineer', 'fg']]] },
    { cmd: 'whereis behbod', out: [[[null, 'behbod: ', 'muted'], [null, 'Vancouver, BC, Canada', 'fg']]] },
    { cmd: 'cat specialty.txt', out: [[[null, 'AI-powered applications and scalable web systems, across frontend, backend and infrastructure.', 'fg']]] },
    { cmd: 'ls experience/', out: lsRows() },
    { cmd: 'jobs', note: '  # currently building', out: [['[1] ', 'AI systems'], ['[2]-', 'automation platforms'], ['[3]+', 'voice AI solutions']].map(([j, n]) => [[0, j, 'muted'], [5, 'Running', 'a3'], [15, n, 'fg']]) },
    { cmd: 'cat interests.txt', out: [['software architecture', 'AI engineering', 'DevOps', 'full-stack development'].reduce((a, n, i) => a.concat(i ? [[null, ' · ', 'muted']] : [], [[null, n, 'fg']]), [])] },
    { cmd: 'echo $MOTTO', out: [[[null, 'Always learning new technologies and improving engineering practices.', 'fg']]] },
    { cmd: 'ls links/', note: '  # open one below', out: [linkFiles()] },
  ];

  // One timeline for the typing, so the link lines can start their shimmer once the console has finished.
  const TY = { start: 0.45, spd: 0.04, pre: 0.18, post: 0.12, after: 0.26, line: 0.05 };
  const typing = () => {
    let t = TY.start;
    const steps = BLOCKS().map(b => {
      const n = (b.cmd + (b.note || '')).length, ts = t + TY.pre, ot = ts + n * TY.spd + TY.post;
      const s = { b, t, ts, ot, n };
      t = ot + b.out.length * TY.line + TY.after;
      return s;
    });
    return { steps, end: t };
  };

  add({
    id: 'f-console', name: 'Console',
    line: 'His README as a terminal: Hello World first, then whoami, whereis, his specialty, experience, running jobs, interests, his motto and a listing of the links below, typed in and left on a blinking prompt.',
    render(c) {
      const T = c.T, P = pal(T), still = c.still, g = greetOf(c);
      const cx = X0 + 22, plan = typing();
      const row = (segs, y, delay) => `<text class="mono tl" x="${X0}" y="${y}" font-size="${FS}" style="animation-delay:${f2(delay)}s">` +
        segs.map(([col, txt, ck, w]) => `<tspan${col != null ? ` x="${r(X0 + col * CW)}"` : ''} fill="${T[ck]}"${w ? ` font-weight="${w}"` : ''}>${nb(txt)}</tspan>`).join('') + '</text>';
      let y = 88, out = '', css = '';
      plan.steps.forEach(({ b, t, ts, ot, n }, bi) => {
        if (bi) y += LH + GAP;
        const w = r(n * CW);
        out += `<g class="tl" style="animation-delay:${f2(t)}s">${chevron(X0, y, T.a3)}<text class="mono" x="${cx}" y="${y}" font-size="${FS}" textLength="${w}" lengthAdjust="spacing"><tspan fill="${T.fg}" font-weight="600">${nb(b.cmd)}</tspan>${b.note ? `<tspan fill="${T.muted}">${nb(b.note)}</tspan>` : ''}</text>`;
        if (!still) {
          // The cursor walks in steps; its fade runs separately and smoothly, so it always ends fully hidden.
          out += `<g class="tw" style="animation:tw${bi} ${f2(n * TY.spd)}s steps(${n},end) ${f2(ts)}s both,twh ${f2(n * TY.spd)}s linear ${f2(ts)}s both"><rect x="${cx}" y="${y - 15}" width="${CW}" height="20" fill="${T.fg}" opacity=".8"/><rect x="${r(cx + CW)}" y="${y - 17}" width="${r(w + 24)}" height="24" fill="${P.bg}"/></g>`;
          css += `@keyframes tw${bi}{from{transform:translateX(0)}to{transform:translateX(${w}px)}}`;
        }
        out += '</g>';
        b.out.forEach((segs, li) => { y += LH; out += row(segs, y, ot + li * TY.line); });
      });
      y += LH + GAP;
      out += `<g class="tl" style="animation-delay:${f2(plan.end)}s">${chevron(X0, y, T.a3)}<rect class="cur" x="${cx}" y="${y - 15}" width="${CW}" height="20" fill="${T.fg}" opacity=".75"/></g>`;
      const H = y + 30, top = 12, box = card(top + 0.5, H - 0.5), yb = top + 38.5;
      let greet = '';
      if (g) {
        const gw = g.text.length * 8;
        greet = `<text class="mono" x="1136" y="36" font-size="11" letter-spacing="1.4" text-anchor="end" fill="${T.a1}">${esc(g.text)}</text>` +
          (g.fa ? `<text x="${r(1136 - gw - 12)}" y="37" font-size="13" direction="rtl" text-anchor="start" style="${FA}" fill="${T.a2}">${g.fa}</text>` : '');
      }
      const style = css + `.tl{animation:tl .01s linear both}@keyframes tl{from{opacity:0}}.tw{opacity:0;transform-box:view-box}@keyframes twh{0%,96%{opacity:1}100%{opacity:0}}` +
        `.cur{animation:cur 1.1s steps(1,end) infinite}@keyframes cur{50%{opacity:0}}.cw{animation:cw .5s ease-out both}@keyframes cw{from{opacity:0}}`;
      const body = `<g class="cw"><path d="${box}" fill="${P.bg}"/>
        <path d="M${XL} ${top + 0.5 + RAD}a${RAD} ${RAD} 0 0 1 ${RAD} -${RAD}H${XR - RAD}a${RAD} ${RAD} 0 0 1 ${RAD} ${RAD}V${yb}H${XL}Z" fill="${P.bar}"/>
        <line x1="${XL}" y1="${yb}" x2="${XR}" y2="${yb}" stroke="${P.line}"/><path d="${box}" fill="none" stroke="${P.line}"/>
        <g fill="none" stroke="${T.muted}" stroke-opacity=".55"><circle cx="64" cy="31.5" r="5.5"/><circle cx="84" cy="31.5" r="5.5"/><circle cx="104" cy="31.5" r="5.5"/></g>
        <text class="mono" x="600" y="36" font-size="12" text-anchor="middle" fill="${T.muted}">behbod@vancouver: ~</text>${greet}
        ${out}</g>`;
      return R.svg({ w: 1200, h: H + PAD, title: 'About Behbod Babai', desc: ABOUT, style, body, still, noBand: true, stretch: true });
    },
  });

  // ---------- 2. Link rows, one image each so each can carry its own link
  const LINKS = [
    { id: 'f-link-site', name: 'Site', value: F.site, alt: `Site: ${F.site}` },
    { id: 'f-link-work', name: 'Work GitHub', value: F.work, note: true },
    { id: 'f-link-email', name: 'Email', value: F.email, alt: `Email: ${F.email}` },
    { id: 'f-link-linkedin', name: 'LinkedIn', value: F.linkedin, alt: `LinkedIn: ${F.linkedin}` },
    { id: 'f-link-resume', name: 'Resume', value: 'PDF', down: true, alt: 'Resume: download the PDF' },
  ];
  const ARROW = { out: 'M-4.5 4.5L4.5-4.5M-2-4.5h6.5V2', down: 'M0-6v8.5M-4-1.5L0 2.5l4-4M-5.5 6.5h11' };
  function linkSvg(c, L, i) {
    const T = c.T, P = pal(T), dk = T.mode === 'dark', H = 76, y = 44, box = card(PAD + 0.5, H - PAD - 0.5, 10);
    const lx = X0 + 22, vx = r(X0 + 22 + 13 * CW);
    const note = L.note ? `<text class="mono" x="${r(vx + (L.value.length + 3) * CW)}" y="${y}" font-size="${FS - 1}" fill="${T.muted}">${nb('# ' + workNote())}</text>` : '';
    const ad = L.down ? ARROW.down : ARROW.out, nudge = L.down ? 'translate(0,2px)' : 'translate(2px,-2px)';
    const arrow = a => `<path d="${ad}" fill="none" stroke="${a}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
    const d0 = f2(typing().end + 0.5 + i * 0.14);
    const style = `.lkI{animation:lkI .6s ${f2(0.2 + i * 0.07)}s ease-out both}@keyframes lkI{from{opacity:0}}
      .lkS,.lkT,.lkB,.lkA{animation-duration:8s;animation-delay:${d0}s;animation-iteration-count:infinite;animation-fill-mode:both;animation-timing-function:ease-in-out}
      .lkS{transform-box:view-box;animation-name:lkS}@keyframes lkS{0%{transform:translateX(0)}16%,100%{transform:translateX(1500px)}}
      .lkT,.lkB,.lkA{opacity:0}
      .lkT{animation-name:lkT}@keyframes lkT{0%,26%,100%{opacity:0}5%,15%{opacity:${dk ? 0.07 : 0.05}}}
      .lkB{animation-name:lkB}@keyframes lkB{0%,26%,100%{opacity:0}5%,15%{opacity:1}}
      .lkA{transform-box:view-box;animation-name:lkA}@keyframes lkA{0%,26%,100%{opacity:0;transform:none}6%,16%{opacity:1;transform:${nudge}}}`;
    const defs = `<clipPath id="lkC"><path d="${box}"/></clipPath>
      <linearGradient id="lkG" x1="0" x2="1"><stop offset="0" stop-color="${T.a1}" stop-opacity="0"/><stop offset=".5" stop-color="${dk ? '#ffffff' : T.a1}" stop-opacity="${dk ? 0.08 : 0.1}"/><stop offset="1" stop-color="${T.a1}" stop-opacity="0"/></linearGradient>`;
    const body = `<g class="lkI"><path d="${box}" fill="${P.bg}"/>
      <g clip-path="url(#lkC)"><rect class="lkT" x="40" y="6" width="1120" height="64" fill="${T.a1}"/>
        <g class="lkS"><rect x="-240" y="-10" width="240" height="${H + 20}" fill="url(#lkG)" transform="skewX(-18)"/></g>
        <rect class="lkB" x="41" y="6" width="2.5" height="64" fill="${T.a1}"/></g>
      <path d="${box}" fill="none" stroke="${P.line}"/>
      ${chevron(X0, y, T.a3)}
      <text class="mono" x="${lx}" y="${y}" font-size="${FS}" fill="${T.muted}">${nb(L.name)}</text>
      <text class="mono" x="${vx}" y="${y}" font-size="${FS}" font-weight="600" fill="${T.fg}">${nb(L.value)}</text>${note}
      <g transform="translate(1124 ${y - 5.5})">${arrow(T.muted)}<g class="lkA">${arrow(T.a1)}</g></g></g>`;
    const desc = L.note ? `Work GitHub: ${F.work}, ${workNote()}.` : L.alt + '.';
    return R.svg({ w: 1200, h: H, title: `${L.name} · ${L.value}`, desc, style, defs, body, still: c.still, noBand: true, stretch: true });
  }
  LINKS.forEach((L, i) => add({
    id: L.id, name: L.name + ' link',
    line: `${L.name} row under the console: its own image so the README can wrap it in a real link, with a light sweeping across now and then.`,
    render(c) { return linkSvg(c, L, i); },
  }));

  // ---------- 3. Loadout: a kill feed snipes his 16 skills, then they sit as loot on the extraction screen.
  const SK = [
    ['TypeScript', 'ts', 0], ['JavaScript', 'js', 0], ['Python', 'py', 0], ['React', 'jsx', 1], ['Node.js', 'loop', 2], ['WebSockets', 'ws', 2],
    ['AI agents', 'bot', 3], ['RAG', 'rag', 3], ['Voice AI', 'wave', 3], ['Prompt engineering', 'prompt', 3], ['Guardrails', 'shield', 3],
    ['OpenAI', 'net', 3], ['Claude', 'chat', 3], ['AWS', 'cloud', 4], ['Docker', 'box', 4], ['CI/CD', 'inf', 4],
  ];
  // [column, row, width in cells, height in cells] inside each container.
  const GROUPS = [
    { name: 'LANGUAGES', cols: 2, cells: { TypeScript: [0, 0, 2, 1], JavaScript: [0, 1, 1, 1], Python: [1, 1, 1, 1] } },
    { name: 'FRONTEND', cols: 1, cells: { React: [0, 0, 1, 2] } },
    { name: 'BACKEND', cols: 1, cells: { 'Node.js': [0, 0, 1, 1], WebSockets: [0, 1, 1, 1] } },
    { name: 'AI', cols: 4, cells: { 'AI agents': [0, 0, 1, 1], RAG: [1, 0, 1, 1], 'Voice AI': [2, 0, 1, 1], Guardrails: [3, 0, 1, 1], 'Prompt engineering': [0, 1, 2, 1], OpenAI: [2, 1, 1, 1], Claude: [3, 1, 1, 1] } },
    { name: 'CLOUD', cols: 2, cells: { AWS: [0, 0, 1, 1], Docker: [1, 0, 1, 1], 'CI/CD': [0, 1, 2, 1] } },
  ];
  // Item glyphs on a 24 unit box centred at 0,0, stroked in currentColor. Generic shapes, no product logos.
  const DOT = (x, y, rr = 1.6) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="currentColor" stroke="none"/>`;
  const GL = {
    ts: '<path d="M-6.5-6.5L-12 0l5.5 6.5M6.5-6.5L12 0l-5.5 6.5M-4-5h8M0-5v10.5"/>',
    js: '<path d="M-11-3.5h10M-11 3.5h10M3-7.5l7.5 7.5-7.5 7.5"/>',
    py: `<path d="M-11 8h7a3.5 3.5 0 0 0 0-7h-2a3.5 3.5 0 0 1 0-7h8M7-6h4"/>${DOT(4.5, -6, 2.4)}`,
    jsx: '<path d="M-5.5-7.5L-12 0l6.5 7.5M5.5-7.5L12 0l-6.5 7.5M2.5-10l-5 20"/>',
    loop: `<path d="M7.8 4.5A9 9 0 1 1 7.8-4.5M8.6-8.9L7.8-4.5 3.6-6"/>${DOT(0, 0, 2.2)}`,
    ws: '<path d="M-11-4h20M5-8l4 4-4 4M11 4h-20M-5 0l-4 4 4 4"/>',
    bot: `<rect x="-8" y="-5" width="16" height="13" rx="3"/><path d="M0-5v-4M-2.5 4.5h5M-11 0v3M11 0v3"/>${DOT(0, -10.5)}${DOT(-3.5, 1)}${DOT(3.5, 1)}`,
    rag: '<path d="M-11-10h8l4 4v13h-12z"/><path d="M-8-3h6M-8 1h4M8 7l4 4"/><circle cx="5" cy="4" r="4.2"/>',
    wave: '<path d="M-10-2v4M-5-7v14M0-10.5v21M5-5.5v11M10-2.5v5"/>',
    prompt: '<rect x="-12" y="-9" width="24" height="18" rx="2.5"/><path d="M-7.5-3.5l4 3.5-4 3.5M0 4.5h6.5"/>',
    shield: '<path d="M0-11l9 3.2v6c0 6-4 9.5-9 12-5-2.5-9-6-9-12v-6zM-4 0l3 3 5.5-6"/>',
    net: `<path d="M-9-6L0-8.5M-9-6L0 0M-9-6L0 8.5M-9 6L0-8.5M-9 6L0 0M-9 6L0 8.5M0-8.5L9-4.5M0 0L9-4.5M0 8.5L9-4.5M0-8.5L9 4.5M0 0L9 4.5M0 8.5L9 4.5" stroke-width="1"/>${[[-9, -6], [-9, 6], [0, -8.5], [0, 0], [0, 8.5], [9, -4.5], [9, 4.5]].map(p => DOT(p[0], p[1], 2.2)).join('')}`,
    chat: `<path d="M-11-9h22v14H-1l-5.5 5v-5H-11z"/>${DOT(-5, -2)}${DOT(0, -2)}${DOT(5, -2)}`,
    cloud: '<path d="M-6 7.5h12.5a5 5 0 0 0 .6-10A7.2 7.2 0 0 0-6.8-1.2 4.4 4.4 0 0 0-6 7.5z"/>',
    box: '<path d="M-12-7h24v14h-24z"/><path d="M-7.5-7v14M-3-7v14M1.5-7v14M6-7v14" stroke-width="1.1"/>',
    inf: '<path d="M0 0c-2.6-3.6-5.2-5.5-8-5.5a5.5 5.5 0 0 0 0 11c2.8 0 5.4-1.9 8-5.5s5.2-5.5 8-5.5a5.5 5.5 0 0 1 0 11c-2.8 0-5.4-1.9-8-5.5zM5.5-7.5l2.5 2-2.5 2"/>',
  };

  add({
    id: 'f-loadout', name: 'Loadout',
    line: 'A kill feed snipes his 16 skills one by one through a scope, then cuts to an extraction screen where they sit as loot, grouped, and the loop reruns.',
    render(c) {
      const T = c.T, still = c.still, dk = T.mode === 'dark';
      const HD = c.ev && R.event2Palette ? R.event2Palette(c.ev, R.theme('dark')) : R.theme('dark');
      const D = 21, N = SK.length, T0 = 1.5, STEP = 0.62, SHOT = 0.4, FL = 0.24;
      const at = i => T0 + i * STEP + SHOT, A_END = at(N - 1) + 0.6, B0 = A_END + 0.1;
      const P = t => f2(Math.max(0, Math.min(100, t / D * 100))) + '%';
      const cx = 600, cy = 196, RS = 150;
      const A = dk
        ? { s0: '#0a0f1c', s1: '#2b3652', far: '#1a2338', near: '#0e141d', sur: '#05070a', so: 0.82, ret: '#d5dbe3', tg: '#eef1f6' }
        : { s0: '#aebccb', s1: '#efeee6', far: '#97a8b8', near: '#6c7d8d', sur: '#141920', so: 0.74, ret: '#11161d', tg: '#121720' };
      const M = dk
        ? { bg: '#0d110e', box: '#111612', tile: '#161b17', ln: '#2b3429', fg: '#e0e4d8', mu: '#8a917f', grid: '#1a2019' }
        : { bg: '#f4f3ec', box: '#eeece3', tile: '#e8e6da', ln: '#cfcbb6', fg: '#262a22', mu: '#666957', grid: '#e7e5da' };
      const OK = T.a3;
      const CAT = [T.a1, T.a3, T.warm, T.a2, mix(T.a1, T.a3, 0.5)];

      // Part A scene: dusk ridges with trees, seen bare and through a 1.9x scope.
      const rng = R.rng(2316);
      const ridge = (base, amp, n, trees) => {
        const pts = [];
        for (let i = 0; i <= n; i++) pts.push([1200 * i / n, base - amp * (0.35 + 0.65 * rng()) * (i % 2 ? 1 : 0.6)]);
        let tr = '';
        if (trees) {
          for (let k = 0; k < trees; k++) {
            const x = 20 + rng() * 1160, j = Math.min(n - 1, Math.floor(x / (1200 / n))), f = x / (1200 / n) - j;
            const yy = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f + 2, h = 9 + rng() * 14, w = h * 0.42;
            tr += `M${r(x)} ${r(yy - h)}l${r(w / 2)} ${r(h)}h${r(-w)}z`;
          }
        }
        return { d: R.smoothPath(pts, 0.7) + `L1200 400L0 400Z` + tr, pts };
      };
      const RF = ridge(236, 46, 16, 26), RN = ridge(300, 34, 22, 40);
      const land = `<g id="lsL"><path d="${RF.d}" fill="${A.far}"/><path d="${RN.d}" fill="${A.near}"/></g>`;

      // Kill feed: newest line enters at the bottom; the list scrolls up once six are on screen.
      const FX = 1136, FY = 28, FP = 30;
      let feed = '', fscroll = `0%{transform:translateY(0)}`;
      SK.forEach(([name], i) => {
        const w = r(12 + 46 + 10 + 16 + 10 + name.length * 6.9 + 12), x = r(FX - w), y = FY + i * FP;
        feed += `<g class="lfL" style="animation-delay:${f2(i * STEP)}s"><rect x="${x}" y="${y}" width="${w}" height="24" rx="3" fill="#05070b" opacity=".74"/>` +
          `<text class="sans" x="${r(x + 12)}" y="${y + 16.5}" font-size="13" font-weight="700" fill="${HD.a1}">behbod</text>` +
          `<use href="#lsX" x="${r(x + 76)}" y="${y + 12}"/><text class="sans" x="${r(x + 94)}" y="${y + 16.5}" font-size="13" fill="#ffffff">${esc(name)}</text></g>`;
        if (i >= 6) fscroll += `${P(at(i) - 0.01)}{transform:translateY(${-(i - 6) * FP}px)}${P(at(i) + 0.14)}{transform:translateY(${-(i - 5) * FP}px)}`;
      });
      fscroll += `97%{transform:translateY(${-(N - 6) * FP}px)}97.5%,100%{transform:translateY(0)}`;

      // Targets stand on the ridge peaks; the scope sweeps to each one, locks, fires and drops it.
      const SPOT = [['F', 5], ['N', 11], ['F', 9], ['N', 17], ['F', 7], ['N', 5], ['F', 3], ['N', 9], ['F', 11], ['N', 15], ['N', 7], ['F', 6], ['N', 13], ['N', 19], ['F', 8], ['N', 3]];
      const spots = SPOT.map(([rd, k]) => { const RG = rd === 'F' ? RF : RN; return { x: r(1200 * k / (RG.pts.length - 1)), y: r(RG.pts[k][1]) }; });
      const plate = dk ? '#d9dee6' : '#f4f6f9', ink = dk ? '#0e141d' : '#11161d', post = dk ? '#5b6472' : '#3a424d';
      const worldT = SK.map(([, gl], i) => {
        const { x, y } = spots[i], yc = y - 21, dl = `style="animation-delay:${f2(i * STEP)}s"`;
        return `<g class="lt${i}"><path d="M${x} ${y - 8}V${y + 2}M${x - 5} ${y + 2}h10" stroke="${post}" stroke-width="2.2" stroke-linecap="round"/>` +
          `<rect x="${x - 13}" y="${y - 34}" width="26" height="26" rx="4" fill="${plate}" stroke="${T.hot}" stroke-width="1.2"/>` +
          `<use href="#gl-${gl}" transform="translate(${x} ${yc}) scale(.72)" color="${ink}"/>` +
          `<rect class="lsW" ${dl} x="${x - 13}" y="${y - 34}" width="26" height="26" rx="4" fill="#ffffff"/></g>` +
          `<g class="lsU" ${dl}><circle cx="${x}" cy="${yc}" r="7" fill="#ffffff" opacity=".45"/><path d="M${x - 7} ${yc - 7}l-6-6M${x + 7} ${yc - 7}l6-6M${x - 8} ${yc + 4}l-7 3M${x + 8} ${yc + 4}l7 3M${x} ${yc - 10}v-7" stroke="#ffd27a" stroke-width="1.6" stroke-linecap="round"/></g>`;
      }).join('');
      const overlays = SK.map(([name], i) => {
        const label = name.toUpperCase(), dist = SPOT[i][0] === 'F' ? 380 + Math.round(rng() * 200) : 150 + Math.round(rng() * 180), w = r((label.length + 7) * 8.2 + 22);
        return `<g class="lsT" style="animation-delay:${f2(i * STEP)}s"><path class="lsB" style="animation-delay:${f2(i * STEP)}s" d="M${cx - 34} ${cy - 25}v-9h9M${cx + 34} ${cy - 25}v-9h-9M${cx - 34} ${cy + 25}v9h9M${cx + 34} ${cy + 25}v9h-9" fill="none" stroke="${T.hot}" stroke-width="1.6"/>` +
          `<rect x="${r(cx - w / 2)}" y="${cy + 44}" width="${w}" height="22" rx="3" fill="${A.sur}" opacity=".66"/>` +
          `<text class="mono" x="${cx}" y="${cy + 59.5}" font-size="12" letter-spacing="1.2" text-anchor="middle" fill="#ffffff">${esc(label)}<tspan fill="#9aa4b2">&#160;&#160;${dist} M</tspan></text></g>`;
      }).join('');
      // The scope moves by d to sit on each target; the magnified world inside it moves by -d so the view matches the aim.
      const dOf = i => [r(spots[i].x - cx), r(spots[i].y - 21 - cy)];
      const tr = (d, k = 1) => `translate(${d[0] * k}px,${d[1] * k}px)`;
      const dS = [-170, 60], dL = dOf(N - 1);
      let ks = `0%{transform:${tr(dS)};opacity:1}${P(1.1)}{transform:${tr(dOf(0))}}`, kz = `0%{transform:${tr(dS, -1)}}${P(1.1)}{transform:${tr(dOf(0), -1)}}`;
      for (let i = 1; i < N; i++) {
        const m = T0 + i * STEP;
        ks += `${P(m)}{transform:${tr(dOf(i - 1))}}${P(m + FL)}{transform:${tr(dOf(i))}}`;
        kz += `${P(m)}{transform:${tr(dOf(i - 1), -1)}}${P(m + FL)}{transform:${tr(dOf(i), -1)}}`;
      }
      ks += `${P(A_END - 0.05)}{transform:${tr(dL)};opacity:1}${P(A_END + 0.35)},96%{transform:${tr(dL)} scale(2.4);opacity:0}96.5%,100%{transform:${tr(dS)};opacity:1}`;
      kz += `${P(A_END - 0.05)},96%{transform:${tr(dL, -1)}}96.5%,100%{transform:${tr(dS, -1)}}`;
      let tcss = '';
      SK.forEach((_, i) => {
        const a = at(i);
        tcss += `.lt${i}{transform-box:fill-box;transform-origin:50% 100%;animation:lt${i} ${D}s linear infinite}@keyframes lt${i}{0%,${P(a)}{opacity:1;transform:none}${P(a + 0.06)}{opacity:1;transform:rotate(-9deg)}${P(a + 0.36)},97.6%{opacity:0;transform:translateY(5px) rotate(78deg)}98.4%,100%{opacity:1;transform:none}}`;
      });

      let hit = '0%{opacity:0}', kick = '0%{transform:none}', pips = '', pcss = '';
      SK.forEach((_, i) => {
        const a = at(i);
        hit += `${P(a - 0.01)}{opacity:0}${P(a + 0.01)}{opacity:1}${P(a + 0.26)}{opacity:0}`;
        kick += `${P(a)}{transform:none}${P(a + 0.04)}{transform:translateY(-6px)}${P(a + 0.3)}{transform:none}`;
        pips += `<rect class="lp${i}" x="${992 + i * 9}" y="350" width="5" height="18" rx="1" fill="#e6edf3"/>`;
        pcss += `.lp${i}{animation:lp${i} ${D}s linear infinite}@keyframes lp${i}{0%,${P(a)}{opacity:.95}${P(a + 0.05)},97.5%{opacity:.2}98%,100%{opacity:.95}}`;
      });
      hit += '100%{opacity:0}'; kick += '100%{transform:none}';

      const reticle = `<path d="M-1200-800H2400V1200H-1200ZM${cx - RS} ${cy}a${RS} ${RS} 0 1 0 ${2 * RS} 0a${RS} ${RS} 0 1 0 ${-2 * RS} 0Z" fill="${A.sur}" fill-rule="evenodd" opacity="${A.so}"/>
        <circle cx="${cx}" cy="${cy}" r="${RS}" fill="none" stroke="${A.sur}" stroke-width="10"/><circle cx="${cx}" cy="${cy}" r="${RS - 6}" fill="none" stroke="${A.ret}" stroke-opacity=".22"/>
        <g stroke="${A.ret}"><path d="M${cx - RS} ${cy}H${cx - 14}M${cx + 14} ${cy}H${cx + RS}M${cx} ${cy - RS}V${cy - 14}M${cx} ${cy + 14}V${cy + RS}" stroke-width="1.3"/>
          <path d="M${cx - RS} ${cy}H${cx - 72}M${cx + 72} ${cy}H${cx + RS}M${cx} ${cy + 72}V${cy + RS}" stroke-width="4"/>
          <path d="${[-56, -42, -28, 28, 42, 56].map(d => `M${cx + d} ${cy - 4}V${cy + 4}M${cx - 4} ${cy + d}H${cx + 4}`).join('')}" stroke-width="1.3"/>
          <circle cx="${cx}" cy="${cy}" r="2.4" fill="${T.hot}" stroke="none"/></g>`;

      const nv = dk ? `<g clip-path="url(#lsC)"><g class="lsG"><rect x="${cx - RS - 20}" y="${cy - RS - 20}" width="${2 * RS + 40}" height="${2 * RS + 40}" filter="url(#lsGr)" opacity=".24"/></g>` +
        `<rect x="${cx - RS}" y="${cy - RS}" width="${2 * RS}" height="${2 * RS}" fill="url(#lsSc)"/><circle cx="${cx}" cy="${cy}" r="${RS}" fill="url(#lsVg)"/></g>` +
        `<text class="mono" x="${cx}" y="${cy - RS + 30}" font-size="10" letter-spacing="2.4" text-anchor="middle" fill="#9dffb0" opacity=".8">NV</text>` : '';
      const nvDefs = dk ? `<filter id="lsNV" filterUnits="userSpaceOnUse" x="${cx - RS - 10}" y="${cy - RS - 10}" width="${2 * RS + 20}" height="${2 * RS + 20}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".075 .15 .025 0 .02 .48 .94 .18 0 .12 .105 .21 .04 0 .03 0 0 0 1 0"/></filter>
        <filter id="lsGr" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="1" seed="5"/><feColorMatrix values="0 0 0 0 .72 0 0 0 0 1 0 0 0 0 .76 1.6 0 0 0 -.55"/></filter>
        <pattern id="lsSc" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".22"/></pattern>
        <radialGradient id="lsVg"><stop offset=".58" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>` : '';
      const partA = `<g class="lA"><rect x="40" y="8" width="1120" height="376" fill="url(#lsSky)"/><use href="#lsL"/>${worldT}
        <g class="lsS"><g class="lsK"><g clip-path="url(#lsC)"${dk ? ' filter="url(#lsNV)"' : ''}><g transform="translate(${cx} ${cy}) scale(1.9) translate(${-cx} ${-cy})"><g class="lsZ"><rect x="-1200" y="-800" width="3600" height="2000" fill="url(#lsSky)"/><use href="#lsL"/>${worldT}</g></g></g>${nv}
          ${overlays}${reticle}
          <path class="lsH" d="M${cx - 12} ${cy - 12}l6 6M${cx + 12} ${cy - 12}l-6 6M${cx - 12} ${cy + 12}l6-6M${cx + 12} ${cy + 12}l-6-6" stroke="${T.hot}" stroke-width="2.4" stroke-linecap="round"/></g></g>
        <circle class="lsD" cx="70" cy="35.5" r="4.5" fill="${HD.hot}"/>
        <text class="mono" x="82" y="40" font-size="12" font-weight="700" letter-spacing="1.6" fill="#eef1f6">LIVE · SPECTATING BEHBOD</text>
        <text class="mono" x="64" y="62" font-size="11" letter-spacing="1.4" fill="#aab3c0">ZONE · VANCOUVER, BC</text>
        <text class="mono" x="64" y="366" font-size="11" letter-spacing="1.6" fill="#aab3c0">MODE · SKILL HUNT · ${N} TARGETS</text>
        <text class="mono" x="980" y="364" font-size="10.5" letter-spacing="1.6" text-anchor="end" fill="#aab3c0">ROUNDS</text>${pips}
        <g class="lfG">${feed}</g></g>`;

      // Part B: the extraction screen, which is also the still frame.
      const TS = 88, PITCH = 96, BY = 136;
      let gx = 68, conts = '';
      const order = {};
      SK.forEach((s, i) => { order[s[0]] = i; });
      GROUPS.forEach((G, gi) => {
        const cw = G.cols * TS + (G.cols - 1) * 8 + 16, ch = 2 * TS + 8 + 16, col = CAT[gi];
        const names = Object.keys(G.cells);
        conts += `<text class="mono" x="${gx}" y="121" font-size="10.5" letter-spacing="1.6" fill="${M.mu}">${G.name}</text>` +
          `<text class="mono" x="${gx + cw}" y="121" font-size="10.5" text-anchor="end" fill="${col}">${names.length}</text>` +
          `<rect x="${gx + 0.5}" y="128.5" width="${cw - 1}" height="${ch - 1}" rx="4" fill="${M.box}" stroke="${M.ln}"/>`;
        names.forEach(nm => {
          const [cc, rr, sw, sh] = G.cells[nm], s = SK[order[nm]];
          const x = gx + 8 + cc * PITCH, y = BY + rr * PITCH, w = sw * TS + (sw - 1) * 8, h = sh * TS + (sh - 1) * 8;
          const gy = sh > 1 ? y + h / 2 - 12 : y + 38;
          conts += `<g class="lbT" style="animation-delay:${f2(order[nm] * 0.05)}s"><rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="3" fill="${mix(M.tile, col, dk ? 0.1 : 0.08)}" stroke="${mix(M.ln, col, 0.35)}"/>` +
            `<rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${r(h * 0.45)}" rx="2.5" fill="url(#lbG)"/>` +
            `<path d="M${x + w - 16} ${y + 11}l2.5 2.5 5-5" fill="none" stroke="${M.mu}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>` +
            `<use href="#gl-${s[1]}" transform="translate(${r(x + w / 2)} ${r(gy)}) scale(1.45)" color="${col}"/>` +
            `<text class="sans" x="${x + 9}" y="${y + h - 10}" font-size="12" fill="${M.fg}">${esc(nm)}</text></g>`;

        });
        gx += cw + 16;
      });
      const icon = c.ev ? R.icon(c.ev.icon, 266, 363.5, 0.55, T) : '';
      const partB = `<g class="lB"><rect x="40" y="8" width="1120" height="376" fill="${M.bg}"/><rect x="40" y="8" width="1120" height="376" fill="url(#lbP)"/>
        <circle class="lbD" cx="72" cy="36" r="3.5" fill="${OK}"/><text class="mono" x="82" y="40" font-size="11" letter-spacing="2" fill="${M.mu}">RAID STATUS</text>
        <g class="lbS"><text class="sans" x="66" y="85" font-size="38" font-weight="800" letter-spacing="1" fill="${OK}">EXTRACTED</text>
          <circle cx="342" cy="71" r="13" fill="none" stroke="${OK}" stroke-width="2"/><path d="M336 71l4 4 8-8" fill="none" stroke="${OK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>
        <text class="mono" x="1132" y="40" font-size="11" letter-spacing="2" text-anchor="end" fill="${M.mu}">LOOT SECURED</text>
        <text class="sans" x="1132" y="82" font-size="30" font-weight="800" text-anchor="end" fill="${M.fg}">${N} / ${N}</text>
        <line x1="68" y1="100.5" x2="1132" y2="100.5" stroke="${M.ln}"/>
        ${conts}
        <g class="lbW"><rect x="-160" y="128" width="160" height="200" fill="url(#lbS)"/></g>
        <line x1="68" y1="344.5" x2="1132" y2="344.5" stroke="${M.ln}"/>
        <text class="mono" x="68" y="368" font-size="11" letter-spacing="1.6" fill="${M.mu}">EXFIL · VANCOUVER, BC</text>${icon}
        <path d="M548 361.5l2.5 2.5 5-5" fill="none" stroke="${M.mu}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        <text class="mono" x="562" y="368" font-size="11" letter-spacing="1.6" fill="${M.mu}">FOUND IN RAID</text>
        <text class="mono lbQ" x="1132" y="368" font-size="11" letter-spacing="1.6" text-anchor="end" fill="${M.mu}">RAID COMPLETE</text>
        <g class="lbR"><text class="mono" x="960" y="368" font-size="11" letter-spacing="1.6" text-anchor="end" fill="${M.mu}">NEXT RAID</text>
          <rect x="972" y="362" width="160" height="4" rx="2" fill="${M.ln}"/><rect class="lbN" x="972" y="362" width="160" height="4" rx="2" fill="${OK}"/></g></g>`;

      const defs = `<clipPath id="lsF"><rect x="40" y="8" width="1120" height="376" rx="14"/></clipPath>
        <clipPath id="lsC"><circle cx="${cx}" cy="${cy}" r="${RS - 4}"/></clipPath>
        <linearGradient id="lsSky" gradientUnits="userSpaceOnUse" x1="0" y1="8" x2="0" y2="384"><stop offset="0" stop-color="${A.s0}"/><stop offset="1" stop-color="${A.s1}"/></linearGradient>
        <linearGradient id="lbG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="${dk ? 0.06 : 0.5}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
        <linearGradient id="lbS" x1="0" x2="1"><stop offset="0" stop-color="${OK}" stop-opacity="0"/><stop offset=".85" stop-color="${OK}" stop-opacity=".14"/><stop offset="1" stop-color="${OK}" stop-opacity="0"/></linearGradient>
        <pattern id="lbP" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${M.grid}"/></pattern>
        <g id="lsX" fill="none" stroke="#ffffff" stroke-width="1.5"><circle r="5.5"/><path d="M-8.5 0h5M3.5 0h5M0-8.5v5M0 3.5v5"/></g>
        ${Object.keys(GL).map(id => `<g id="gl-${id}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${GL[id]}</g>`).join('')}
        ${land}${nvDefs}`;

      const EZ = 'cubic-bezier(.5,0,.2,1)', MV = 'cubic-bezier(.3,.75,.25,1)';
      const style = `.lA{opacity:0;animation:lA ${D}s linear infinite}@keyframes lA{0%,${P(A_END)}{opacity:1}${P(A_END + 0.3)},97.5%{opacity:0}100%{opacity:1}}
        .lB{animation:lB ${D}s linear infinite}@keyframes lB{0%,${P(A_END)}{opacity:0}${P(A_END + 0.15)},99.5%{opacity:1}100%{opacity:0}}
        .lfl{opacity:0;animation:lfl ${D}s linear infinite}@keyframes lfl{0%,${P(A_END - 0.05)}{opacity:0}${P(A_END + 0.05)}{opacity:${dk ? 0.3 : 0.5}}${P(A_END + 0.45)},100%{opacity:0}}
        .lsS{transform-box:view-box;transform-origin:${cx}px ${cy}px;animation:lsS ${D}s ${MV} infinite both}@keyframes lsS{${ks}}
        .lsZ{transform-box:view-box;animation:lsZ ${D}s ${MV} infinite both}@keyframes lsZ{${kz}}
        .lsK{transform-box:view-box;animation:lsK ${D}s linear infinite}@keyframes lsK{${kick}}
        .lsH{opacity:0;animation:lsH ${D}s linear infinite}@keyframes lsH{${hit}}
        .lsT{opacity:0;animation:lsT ${D}s linear infinite both}@keyframes lsT{0%,${P(T0 + FL - 0.06)}{opacity:0}${P(T0 + FL)},${P(T0 + SHOT + 0.14)}{opacity:1}${P(T0 + SHOT + 0.22)},100%{opacity:0}}
        .lsB{transform-box:fill-box;transform-origin:center;animation:lsB ${D}s ${EZ} infinite both}@keyframes lsB{0%,${P(T0 + FL - 0.06)}{transform:scale(1.6)}${P(T0 + FL + 0.08)},100%{transform:none}}
        .lsW{opacity:0;animation:lsW ${D}s linear infinite both}@keyframes lsW{0%,${P(T0 + SHOT)}{opacity:0}${P(T0 + SHOT + 0.02)}{opacity:.9}${P(T0 + SHOT + 0.2)},100%{opacity:0}}
        .lsU{opacity:0;transform-box:fill-box;transform-origin:center;animation:lsU ${D}s ease-out infinite both}@keyframes lsU{0%,${P(T0 + SHOT)}{opacity:0;transform:scale(.4)}${P(T0 + SHOT + 0.03)}{opacity:1}${P(T0 + SHOT + 0.4)},100%{opacity:0;transform:scale(1.7)}}
        ${tcss}
        .lsG{animation:lsG .45s steps(1) infinite}@keyframes lsG{0%{transform:translate(0,0)}25%{transform:translate(-7px,4px)}50%{transform:translate(5px,-6px)}75%{transform:translate(-3px,-2px)}}
        .lfG{transform-box:view-box;animation:lfG ${D}s ease-out infinite}@keyframes lfG{${fscroll}}
        .lfL{opacity:0;transform-box:view-box;animation:lfL ${D}s ease-out infinite both}
        @keyframes lfL{0%,${P(T0 + SHOT - 0.01)}{opacity:0;transform:translateX(18px)}${P(T0 + SHOT + 0.16)},${P(T0 + SHOT + 6 * STEP - 0.04)}{opacity:1;transform:none}${P(T0 + SHOT + 6 * STEP + 0.12)},100%{opacity:0;transform:none}}
        .lsD,.lbD{animation:bl 1.4s ease-in-out infinite}@keyframes bl{50%{opacity:.25}}
        .lbS{transform-box:fill-box;transform-origin:center;animation:lbS ${D}s ${EZ} infinite}
        @keyframes lbS{0%,${P(B0 + 0.05)}{opacity:0;transform:scale(1.3)}${P(B0 + 0.4)},100%{opacity:1;transform:none}}
        .lbT{transform-box:fill-box;transform-origin:center;animation:lbT ${D}s ${EZ} infinite both}
        @keyframes lbT{0%,${P(B0 + 0.3)}{opacity:0;transform:translateY(10px) scale(.94)}${P(B0 + 0.7)},100%{opacity:1;transform:none}}
        .lbW{transform-box:view-box;animation:lbW ${D}s ease-in-out infinite}@keyframes lbW{0%,${P(B0 + 1.3)}{transform:translateX(0)}${P(B0 + 2.7)},100%{transform:translateX(1340px)}}
        .lbR{opacity:0;animation:lbR ${D}s linear infinite}@keyframes lbR{0%,100%{opacity:1}}
        .lbQ{animation:lbQ ${D}s linear infinite}@keyframes lbQ{0%,100%{opacity:0}}
        .lbN{transform-box:view-box;transform-origin:972px 364px;animation:lbN ${D}s linear infinite}@keyframes lbN{0%,${P(B0 + 0.8)}{transform:scaleX(0)}99%,100%{transform:scaleX(1)}}
        ${pcss}`;

      const body = `<g clip-path="url(#lsF)">${partB}${partA}<rect class="lfl" x="40" y="8" width="1120" height="376" fill="#ffffff"/></g>
        <rect x="40.5" y="8.5" width="1119" height="375" rx="14" fill="none" stroke="${M.ln}"/>`;
      const groups = GROUPS.map(G => `${G.name[0] + G.name.slice(1).toLowerCase()}: ${Object.keys(G.cells).sort((a, b) => order[a] - order[b]).join(', ')}`).join('. ');
      const desc = `Behbod Babai's loadout. A battle royale style kill feed snipes his ${N} skills one by one through a scope, then the extraction screen shows them as loot, extracted. ${groups.replace('Ai:', 'AI:')}.`;
      return R.svg({ w: 1200, h: 392, title: 'Behbod Babai: loadout', desc, style, defs, body, still, noBand: true });
    },
  });
})();
