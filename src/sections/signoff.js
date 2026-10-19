(function () {
  const R = window.HL, r = R.r;
  const W = 1200, H = 190, HZ = 124, BX0 = -430, BX1 = -118;
  const f2 = v => Math.round(v * 100) / 100;
  const ridge = (keys, rng, step, jit) => {
    const pts = [keys[0]];
    for (let i = 0; i < keys.length - 1; i++) {
      const [x0, y0] = keys[i], [x1, y1] = keys[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let k = 1; k <= n; k++) pts.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n + (k === n ? 0 : (rng() - 0.5) * 2 * jit)]);
    }
    return R.linePath(pts) + `L${W} ${HZ + 1}L0 ${HZ + 1}Z`;
  };

  // The header's floatplane, heading east, tows a thank-you banner across the evening sky over the inlet.
  window.FINAL2.push({
    id: 'f-signoff', section: 7, name: 'Sign-off',
    line: 'The floatplane from the header tows a "Thanks for stopping by" banner across the evening sky over the water, with its reflection below.',
    render(c) {
      const T = c.T, dk = T.mode === 'dark', still = c.still;
      const P = dk
        ? { s0: '#0d1117', s1: '#121c33', s2: '#2a2f5c', glow: '#463b7a', far: '#1e2a48', near: '#0d1322', w0: '#162241', w1: '#0d1117', cloud: '#34416d', shim: '#8299c9', hz: '#2c3d66', cloth: '#eef1f6', edge: '#9aaccf', ink: '#1b2550', rope: '#9aaccf', shore: '#f2c47e' }
        : { s0: '#ffffff', s1: '#f1f4fa', s2: '#f8dcc6', glow: '#f7c59c', far: '#c3cde0', near: '#8e9cb8', w0: '#d6e1ef', w1: '#ffffff', cloud: '#e2e8f2', shim: '#8ea3c6', hz: '#c3d0e4', cloth: '#ffffff', edge: '#c3d0e4', ink: '#1b2550', rope: '#4a5a7b', shore: '#de9440' };
      const rg = R.rng(808);
      const far = ridge([[0, HZ - 14], [90, HZ - 20], [180, HZ - 26], [240, HZ - 34], [270, HZ - 44], [282, HZ - 53], [292, HZ - 46], [300, HZ - 41], [312, HZ - 51], [322, HZ - 44], [350, HZ - 32], [430, HZ - 24], [520, HZ - 30], [600, HZ - 22], [700, HZ - 29], [800, HZ - 20], [900, HZ - 27], [1000, HZ - 18], [1100, HZ - 25], [1200, HZ - 16]], rg, 7, 1.4);
      const near = ridge([[0, HZ - 6], [120, HZ - 10], [260, HZ - 8], [400, HZ - 12], [560, HZ - 7], [720, HZ - 11], [900, HZ - 6], [1050, HZ - 10], [1200, HZ - 5]], rg, 4, 1.2);
      let stars = '', lights = '', lrefl = '', shim = '';
      if (dk) for (let i = 0; i < 40; i++) stars += `<circle cx="${r(rg() * W)}" cy="${r(6 + Math.pow(rg(), 1.4) * 84)}" r="${f2(0.45 + rg() * 0.7)}" opacity="${f2(0.3 + rg() * 0.55)}"${rg() < 0.35 ? ` class="bst" style="animation-delay:${r(-rg() * 4)}s"` : ''}/>`;
      for (let i = 0; i < 30; i++) {
        const x = r(rg() * W), o = f2((dk ? 0.5 : 0.35) + rg() * 0.4);
        lights += `<circle cx="${x}" cy="${r(HZ - 1.5)}" r="${f2(0.6 + rg() * 0.5)}" opacity="${o}"/>`;
        lrefl += `<path d="M${x} ${HZ + 2}v${r(3 + rg() * 9)}" opacity="${f2(o * 0.4)}"/>`;
      }
      for (let i = 0; i < 26; i++) { const t = rg(), y = HZ + 5 + t * 56; shim += `<path d="M${r(rg() * W)} ${r(y)}h${r(5 + t * 26 + rg() * 8)}" opacity="${f2(0.12 + rg() * 0.28)}"${rg() < 0.5 ? ` class="bsh" style="animation-delay:${r(-rg() * 6)}s"` : ''}/>`; }
      const clouds = [[180, 34, 120, 7], [520, 22, 160, 8], [860, 40, 140, 7], [1080, 18, 110, 6]].map(([x, y, rx, ry], i) => `<ellipse class="bcl${i % 2}" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('');

      // Cloth and lettering share one wave, which runs from the pole to the loose end and grows as it goes.
      const K = 6, n = 18, FLAP = 1.4;
      const wav = (u, k) => { const a = 0.6 + 4 * u, ph = 2 * Math.PI * (1.6 * u - k / K); return [a * Math.sin(ph), a * Math.sin(ph + 0.5)]; };
      const flag = k => {
        const top = [], bot = [];
        for (let i = 0; i <= n; i++) { const u = i / n, x = BX1 - (BX1 - BX0) * u, [a, b] = wav(u, k); top.push([x, -20 + a]); bot.push([x, 20 + b]); }
        return 'M' + top.concat(bot.reverse()).map(p => r(p[0]) + ' ' + r(p[1])).join('L') + 'Z';
      };
      const base = k => {
        const pts = [];
        for (let i = n; i >= 1; i--) { const u = i / n * 0.94 + 0.03, [a, b] = wav(u, k); pts.push([BX1 - (BX1 - BX0) * u, (a + b) / 2 + 7.5]); }
        return 'M' + pts.map(p => r(p[0]) + ' ' + r(p[1])).join('L');
      };
      const seq = f => Array.from({ length: K + 1 }, (_, k) => f(k % K)).join(';');
      const flap = R.smil(still, `<animate attributeName="d" dur="${FLAP}s" repeatCount="indefinite" values="${seq(flag)}"/>`);
      const sag = R.smil(still, `<animate attributeName="d" dur="2.3s" repeatCount="indefinite" calcMode="spline" keySplines=".45 0 .55 1;.45 0 .55 1" values="M-25 -15.5Q-60 -3 -96 -2;M-25 -15.5Q-60 3 -96 -2;M-25 -15.5Q-60 -3 -96 -2"/>`);
      const M = R.floatplane({ T, id: 'bq', face: -1, scale: 0.72 });
      const train = `<g class="bp" transform="translate(860 64)"><g class="bv"><g class="bb">
          <path d="M-25 -15.5Q-60 -3 -96 -2" fill="none" stroke="${P.rope}" stroke-width=".9" opacity=".75">${sag}</path>
          <path d="M-96 -2L${BX1} -22M-96 -2L${BX1} 22" fill="none" stroke="${P.rope}" stroke-width=".7" opacity=".7"/><circle cx="-96" cy="-2" r="1.3" fill="${P.rope}"/>
          <g class="bw"><use href="#bnP" fill="${P.cloth}" stroke="${P.edge}" stroke-width=".8"/><use href="#bnP" fill="url(#bnF)"/><use href="#bnP" fill="url(#bnT)"/>
            <rect x="${BX1 - 12}" y="-19.6" width="11" height="39.2" fill="${T.a1}"/>
            <text class="sans" font-size="21" font-weight="600" fill="${P.ink}"><textPath href="#bnC" startOffset="50%" text-anchor="middle">Thanks for stopping by</textPath></text>
            <path d="M${BX1} -25V25" stroke="${P.rope}" stroke-width="2" stroke-linecap="round"/><circle cx="${BX1}" cy="25" r="1.8" fill="${P.rope}"/></g>
          <g class="bpp">${M.svg}</g></g></g></g>`;

      const defs = `<linearGradient id="bnS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.s0}"/><stop offset=".55" stop-color="${P.s1}"/><stop offset="1" stop-color="${P.s2}"/></linearGradient>
        <radialGradient id="bnG"><stop offset="0" stop-color="${P.glow}" stop-opacity="${dk ? 0.5 : 0.75}"/><stop offset="1" stop-color="${P.glow}" stop-opacity="0"/></radialGradient>
        <linearGradient id="bnW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.w0}"/><stop offset="1" stop-color="${P.w1}"/></linearGradient>
        <linearGradient id="bnE" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".12" stop-color="#fff"/><stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <mask id="bnM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#bnE)"/></mask>
        <linearGradient id="bnRG" gradientUnits="userSpaceOnUse" x1="0" y1="${HZ}" x2="0" y2="${H}"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <mask id="bnRM" maskUnits="userSpaceOnUse" x="0" y="${HZ}" width="${W}" height="${H - HZ}"><rect y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#bnRG)"/></mask>
        <filter id="bnR" filterUnits="userSpaceOnUse" x="0" y="${HZ}" width="${W}" height="${H - HZ}"><feTurbulence type="fractalNoise" baseFrequency=".012 .22" numOctaves="1" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation=".7"/></filter>
        <filter id="bnB" x="-20%" y="-200%" width="140%" height="500%"><feGaussianBlur stdDeviation="5"/></filter>
        <linearGradient id="bnF" gradientUnits="userSpaceOnUse" x1="${BX0}" y1="0" x2="${BX0 + 195}" y2="0" spreadMethod="repeat"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity="${dk ? 0.16 : 0.09}"/><stop offset="1" stop-color="#000" stop-opacity="0"/>${R.smil(still, `<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="-195 0" dur="${FLAP}s" repeatCount="indefinite"/>`)}</linearGradient>
        <linearGradient id="bnT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${dk ? 0.12 : 0.4}"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${dk ? 0.14 : 0.06}"/></linearGradient>
        <path id="bnP" d="${flag(0)}">${flap}</path>
        <path id="bnC" d="${base(0)}">${R.smil(still, `<animate attributeName="d" dur="${FLAP}s" repeatCount="indefinite" values="${seq(base)}"/>`)}</path>
        ${M.defs}`;
      const run = '15s -3.8s infinite';
      const style = `
        .bp{transform-box:view-box;animation:bp ${run} linear}
        @keyframes bp{0%{transform:translate(-60px,64px)}87%{transform:translate(1660px,64px)}87.01%,100%{transform:translate(-60px,64px)}}
        .bv{animation:bv ${run} ease-in-out}@keyframes bv{0%{transform:translateY(8px)}22%{transform:translateY(-6px)}44%{transform:translateY(4px)}66%{transform:translateY(-8px)}87%{transform:translateY(2px)}87.01%,100%{transform:translateY(8px)}}
        .bpp{transform-box:fill-box;transform-origin:50% 60%;animation:bpp ${run} ease-in-out}@keyframes bpp{0%,87%,100%{transform:none}11%,55%{transform:rotate(-3deg)}33%,77%{transform:rotate(2.5deg)}}
        .bb{animation:bb 3.4s ease-in-out infinite}@keyframes bb{50%{transform:translateY(-3px)}}
        .bw{transform-box:fill-box;transform-origin:100% 50%;animation:bw 2.8s ease-in-out infinite}@keyframes bw{50%{transform:rotate(-1.4deg) translateY(1px)}}
        .bst{animation:bst 4s ease-in-out infinite}@keyframes bst{50%{opacity:.12}}
        .bsh{animation:bsh 6s ease-in-out infinite}@keyframes bsh{50%{opacity:.03}}
        .bcl0,.bcl1{animation:bcl 60s ease-in-out infinite alternate}.bcl1{animation-duration:80s}@keyframes bcl{to{transform:translateX(70px)}}
        .ba{animation:ba 1.2s both}@keyframes ba{from{opacity:0}}
        ${M.css}`;
      const body = `<g mask="url(#bnM)" class="ba">
        <rect width="${W}" height="${HZ}" fill="url(#bnS)"/><ellipse cx="600" cy="${HZ}" rx="760" ry="64" fill="url(#bnG)"/>
        ${dk ? `<g fill="#e3eaff">${stars}</g>` : ''}<g fill="${P.cloud}" opacity="${dk ? 0.45 : 0.9}" filter="url(#bnB)">${clouds}</g>
        <path d="${far}" fill="${P.far}"/><path d="${near}" fill="${P.near}"/>
        <rect y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#bnW)"/><path d="M0 ${HZ + 0.5}H${W}" stroke="${P.hz}"/>
        <g mask="url(#bnRM)"><g filter="url(#bnR)" opacity="${dk ? 0.3 : 0.26}"><g transform="matrix(1 0 0 -1 0 ${2 * HZ})"><path d="${far}" fill="${P.far}"/><path d="${near}" fill="${P.near}"/>${train}</g></g></g>
        <g fill="${P.shore}">${lights}</g><g stroke="${P.shore}" stroke-width=".9">${lrefl}</g>
        <g stroke="${P.shim}" stroke-width=".8" stroke-linecap="round">${shim}</g>
        ${train}
      </g>`;
      return R.svg({ w: W, h: H, title: 'Thanks for stopping by', desc: `Thanks for stopping by. A small floatplane tows a banner with those words across ${dk ? 'a night' : 'an evening'} sky over the water, its reflection rippling below.`, style, defs, body, still, noBand: true });
    },
  });
})();
