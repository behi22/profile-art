(function () {
  const R = window.HL, r = R.r, esc = R.esc;
  window.FINAL2 = window.FINAL2 || [];

  // One 24 s story loop; the still frame shows the room at TS seconds.
  const L = 24, TS = 18;
  const gs = (x, m, sd) => Math.exp(-0.5 * ((x - m) / sd) ** 2);
  const pc = t => r(Math.max(0, Math.min(L, t)) * 100 / L) + '%';
  const VB = (x, y) => `transform-box:view-box;transform-origin:${r(x)}px ${r(y)}px;`;
  const FB = 'transform-box:fill-box;transform-origin:center;';
  const kf = (n, fr) => `@keyframes ${n}{${fr.map(([t, s]) => `${pc(t)}{${s}}`).join('')}}`;
  const loop = (n, fr, base = '', ease = 'linear') => `.${n}{${base}animation:${n} ${L}s ${ease} infinite}` + kf(n, fr);
  const show = (n, segs, f = 0.3, base = '') => {
    const p = [];
    if (segs[0][0] > 0) p.push([0, 0]);
    segs.forEach(([a, b]) => {
      if (a > 0) p.push([a - f / 2, 0], [a + f / 2, 1]); else p.push([0, 1]);
      if (b < L) p.push([b - f / 2, 1], [b + f / 2, 0]); else p.push([L, 1]);
    });
    if (segs[segs.length - 1][1] < L) p.push([L, 0]);
    const on = segs.some(([a, b]) => TS >= a && TS <= b);
    return loop(n, p.map(([t, o]) => [t, 'opacity:' + o]), base + (on ? '' : 'opacity:0;'));
  };
  const tx = (x, y, fs, fill, s, ex = '') => `<text x="${r(x)}" y="${r(y)}"${fs ? ` font-size="${fs}"` : ''}${fill ? ` fill="${fill}"` : ''}${ex ? ' ' + ex : ''}>${esc(s)}</text>`;
  const dot = (x, y) => `M${r(x)} ${r(y)}h.1`;
  const FA = `font-family='"Segoe UI",Tahoma,"Noto Naskh Arabic","Geeza Pro",sans-serif'`;

  // The code screen: believable TypeScript for a voice agent turn.
  const CODE = [
    'import { stt, llm, tts } from \'./pipeline\';',
    'import { calendar } from \'./calendar\';',
    '',
    'export async function onTurn(call: Call) {',
    '  const text = await stt.transcribe(call.audio);',
    '  if (!text) return call.listen();',
    '  call.history.push({ role: \'user\', text });',
    '',
    '  const reply = await llm.respond(call.history, {',
    '    tools: [findSlots, bookSlot],',
    '    maxLatencyMs: 800,',
    '  });',
    '  await tts.speak(call, reply.text);',
    '}',
    '',
    '// stop talking the moment the caller does',
    'call.on(\'speech\', () => tts.stop(call));',
    '',
    'async function bookSlot(lead: Lead, slot: Slot) {',
    '  if (!(await calendar.isFree(slot))) {',
    '    return offerNext(lead, slot);',
    '  }',
    '  return calendar.book(lead, slot);',
    '}',
    '',
  ];
  const KW = new Set(['import', 'from', 'export', 'async', 'function', 'const', 'await', 'return', 'if', 'true', 'false']);
  const hl = ln => {
    const tk = ln.match(/\/\/.*|'[^']*'|\d+|[A-Za-z_]\w*|\s+|./g) || [];
    return tk.map((t, j) => {
      let k = '';
      if (t.startsWith('//')) k = 'xc';
      else if (t[0] === '\'') k = 'xs';
      else if (/^\d/.test(t)) k = 'xn';
      else if (KW.has(t)) k = 'xk';
      else if (/^[A-Z]/.test(t)) k = 'xt';
      else if (/^[a-z_]/i.test(t) && tk[j + 1] === '(') k = 'xf';
      return k ? `<tspan class="${k}">${esc(t)}</tspan>` : esc(t);
    }).join('');
  };

  window.FINAL2.push({
    id: 'f-story', section: 6, name: 'The Story',
    line: 'His loft at night, seen from behind his chair: code, an agent under test, a live call, a robot with pomegranate juice and real Vancouver rain on the window.',
    render(c) {
      const { T, still } = c;
      const now = c.now instanceof Date ? c.now : new Date();
      const ev = c.ev || null;
      const rain = Math.max(0, Math.min(1, +((c.weather || {}).rain) || 0));
      const dk = T.mode === 'dark';
      // Screens are dark in both modes, so their accents always come from the dark palette.
      const S = dk ? T : R.event2Palette(ev, R.theme('dark'));
      const W = 1200, H = 600;
      const q = R.rng(5150);
      const P = dk ? {
        w0: '#110e15', w1: '#1e171c', beam: '#1a120e', fr: '#0a0b0e', frH: '#3a3128', sill: '#3a2a20', sillH: '#56402f',
        far: '#1c2346', near: '#121833', snow: '#3d4878', cB: '#151b37', cF: '#0b0f22', lit: '#ffd27f', lit2: '#a9c8ff', haze: '#4a3550',
        wa0: '#0d1331', wa1: '#05081a', cloud: '#2b2d55', rain: '#b9c6ff', body: '#0a1028', bodyOp: 0.3,
        dk0: '#5a3c28', dk1: '#3a2619', edge: '#22160f', ud0: '#0d0a0c', ud1: '#030203', shelf: '#4a3325', shelfT: '#6b4b36',
        hood: '#2b3142', hood2: '#1c2030', hair: '#100b09', hair2: '#2b1e18', skin: '#6a4a3b', chair: '#101217', chairH: '#2d323e',
        metal: '#22262e', metalH: '#3f4552', mat: '#14161c', pot: '#9c5a3c', potR: '#b56a48', leaf: '#284c33', leafE: '#9fbf64',
        green: '#2f5e3a', lamp: '#ffe7bb', moon: '#f3efe0', cork: '#7a5a3c',
      } : {
        w0: '#ecdcc6', w1: '#dbc4a5', beam: '#7a5638', fr: '#26231f', frH: '#7a6c5c', sill: '#c99d6e', sillH: '#e3bd8f',
        far: '#9db2cb', near: '#7f97b3', snow: '#ffffff', cB: '#9aabc2', cF: '#7488a3', lit: '#f4f8ff', lit2: '#ffffff', haze: '#fff3e2',
        wa0: '#9cc1e2', wa1: '#5e88b4', cloud: '#ffffff', rain: '#ffffff', body: '#ffffff', bodyOp: 0.22,
        dk0: '#c28f5f', dk1: '#a36f45', edge: '#7a5234', ud0: '#3d2e25', ud1: '#211813', shelf: '#a8784e', shelfT: '#cc9d70',
        hood: '#3b4263', hood2: '#2b3150', hair: '#21150f', hair2: '#3e2a1e', skin: '#a8775a', chair: '#23262e', chairH: '#4d5363',
        metal: '#2b2f38', metalH: '#5a606d', mat: '#2a2d35', pot: '#c06c45', potR: '#d98259', leaf: '#3a7346', leafE: '#c6dc7e',
        green: '#3f7d4c', lamp: '#fff1d4', moon: '#ffffff', cork: '#b98a5c',
      };
      const ink = '#c3cbdc', mute = '#8b97b3';

      // ---------------------------------------------------------------- window view
      const GX0 = 30, GX1 = 422, GY0 = 30, GY1 = 328, GW = 392, GH = 298, HZ = 262;
      const panes = [[30, 30, 128, 66], [162, 30, 128, 66], [294, 30, 128, 66], [30, 100, 128, 228], [162, 100, 128, 228], [294, 100, 128, 228]];
      const ph = R.skyPhase(now).phase;
      const hz = dk ? ({ night: '#2a2552', dusk: '#3f2a5a', golden: '#4a2c54', dawn: '#2e3565', morning: '#2c3a6a', day: '#2c3a6a' }[ph] || '#2a2552')
        : '#f6ead8';
      const sky = dk ? ['#04081a', '#0d1533', hz] : ['#6fa8dc', '#b3d7f2', hz];
      const ridge = (f, step) => { const p = []; for (let x = GX0 - 6; x <= GX1 + 6; x += step) p.push([x, f(x)]); return p; };
      const area = (p, base) => `M${r(p[0][0])} ${base}L` + p.map(v => r(v[0]) + ' ' + r(v[1])).join('L') + `L${r(p[p.length - 1][0])} ${base}Z`;
      // North Shore: the Lions on the left, Grouse in the middle, Seymour to the right.
      const farF = x => 214 - (44 * gs(x, 92, 40) + 58 * gs(x, 160, 30) + 24 * gs(x, 152, 5) + 22 * gs(x, 170, 5) + 30 * gs(x, 262, 36) + 50 * gs(x, 352, 44) + 26 * gs(x, 430, 30)) + 2 * Math.sin(x * 0.23) + 1.4 * q();
      const nearB = x => 236 - (34 * gs(x, 66, 50) + 42 * gs(x, 250, 40) + 30 * gs(x, 392, 50));
      const far = ridge(farF, 4), near = ridge(x => nearB(x) + 1.6 * Math.sin(x * 0.31) + q(), 5);
      const season = R.season(now);
      const snowY = { winter: 178, spring: 168, autumn: 146 }[season] || 0;
      let snowD = '';
      if (snowY) {
        snowD = `M${GX0 - 6} 60H${GX1 + 6}`;
        for (let x = GX1 + 6; x >= GX0 - 6; x -= 10) snowD += `L${x} ${r(snowY + 4 * Math.sin(x * 0.19) + 3 * q())}`;
        snowD += 'Z';
      }
      let grouse = dk ? dot(250, nearB(250) + 1) : '';
      if (dk) for (let i = 0; i < 8; i++) grouse += dot(240 + i * 2.6, nearB(240 + i * 2.6) + 4 + i * 2.3);

      // Downtown: front towers first, so the back row only lights windows that can be seen.
      const top = new Float32Array(500).fill(999);
      const city = (seed, lo, hi, wLo, wHi, pLit, special, front) => {
        const qq = R.rng(seed), bld = [];
        let x = GX0 - 6;
        while (x < GX1 + 4) {
          const w = Math.round(wLo + qq() * (wHi - wLo)), t = Math.round(lo + qq() * (hi - lo));
          bld.push([x, w, t]);
          x += w + (qq() < 0.3 ? 2 : 0);
        }
        (special || []).forEach(b => bld.push(b));
        let d = '', win = '', win2 = '', off = '', refl = '';
        bld.forEach(([x0, w, t]) => {
          d += `M${x0} ${HZ}V${t}h${w}V${HZ}Z`;
          if (front) for (let k = x0; k < x0 + w; k++) if (k >= 0 && k < 500) top[k] = Math.min(top[k], t);
          let lit = 0;
          for (let wy = t + 4; wy < HZ - 3; wy += 5) for (let wx = x0 + 2; wx + 2 < x0 + w - 1; wx += 4) {
            if (!front && wx >= 0 && wx < 500 && wy + 2 > top[wx] - 1) continue;
            const k = qq(), s = `M${wx} ${wy}h2v2h-2z`;
            if (k < pLit) { lit++; if (qq() < 0.2) off += s; else win += s; } else if (k < pLit + 0.035) win2 += s;
          }
          if (front && lit > 3) refl += `M${r(x0 + w / 2)} ${HZ + 3}v${Math.min(44, 8 + lit)}`;
        });
        return { d, win, win2, off, refl, bld };
      };
      const cF = city(91, 204, 246, 14, 30, dk ? 0.3 : 0.16, [[212, 12, 148], [322, 9, 174]], true);
      const cB = city(77, 168, 222, 10, 24, dk ? 0.22 : 0.12, null, false);
      const tall = cF.bld.concat(cB.bld).filter(b => b[0] > GX0 && b[0] < GX1 - 10).sort((a, b) => a[2] - b[2]).slice(0, 3);
      const beacons = tall.map((b, i) => `<circle class="bk" style="animation-delay:${-i * 0.7}s" cx="${r(b[0] + b[1] / 2)}" cy="${b[2] - 2}" r="1.3" fill="#ff5a5a"/>`).join('') +
        `<circle class="bk" style="animation-delay:-1.9s" cx="326.5" cy="147" r="1.3" fill="#ff5a5a"/>`;
      let lamps = '';
      for (let x = GX0 + 4; x < GX1; x += 8) lamps += dot(x, HZ - 1.4);
      let clouds = '';
      const oc = 0.25 + 0.75 * rain;
      for (let i = 0; i < 6; i++) clouds += `<ellipse cx="${r(GX0 + 20 + q() * (GW - 40))}" cy="${r(46 + q() * 96)}" rx="${r(60 + q() * 70)}" ry="${r(7 + q() * 9)}" fill="url(#gK)"/>`;
      let stars = '';
      if (dk && rain < 0.25) { for (let i = 0; i < 16; i++) stars += dot(GX0 + q() * GW, GY0 + 4 + q() * 84); }
      let moon = '';
      const mp = R.moonPhase(now);
      if (!dk && rain < 0.6) moon = `<circle cx="378" cy="62" r="56" fill="url(#gM)" opacity=".85"/><circle cx="378" cy="62" r="9" fill="#fffbea"/>`;
      else if (dk && rain < 0.4 && mp.illum > 0.04) {
        const mx = 392, my = 60, mr = 8, kx = r(Math.abs(Math.cos(2 * Math.PI * mp.phase)) * mr), cres = mp.illum < 0.5;
        const limb = mp.waxing ? 1 : 0, term = mp.waxing ? (cres ? 0 : 1) : (cres ? 1 : 0);
        moon = `<circle cx="${mx}" cy="${my}" r="34" fill="url(#gM)" opacity="${dk ? 0.3 : 0.4}"/><circle cx="${mx}" cy="${my}" r="${mr}" fill="${dk ? '#1c2142' : '#c9c3dc'}" opacity=".7"/>` +
          `<path d="M${mx} ${my - mr}A${mr} ${mr} 0 0 ${limb} ${mx} ${my + mr}A${kx} ${mr} 0 0 ${term} ${mx} ${my - mr}Z" fill="${P.moon}"/>`;
      }
      // Rain outside the glass: a far layer and a near layer that loop, more of both when it rains.
      const streak = (n, len, dx, seed) => { const qq = R.rng(seed); let d = ''; for (let i = 0; i < n; i++) d += `M${Math.round(GX0 + qq() * (GW + 16))} ${Math.round(GY0 + qq() * GH)}l${dx} ${len}`; return d; };
      const nA = rain > 0 ? Math.round(18 + 52 * rain) : 0, nB = rain > 0 ? Math.round(26 + 64 * rain) : 0;
      const nC = Math.round(40 + 60 * rain);
      // Drops sitting on the glass: each one is a tiny lens with the city upside down in it.
      const nd = Math.round(44 + 74 * rain);
      let drops = '';
      for (let i = 0; i < nd; i++) {
        const k = q(), id = k < 0.16 ? 'd0' : k < 0.5 ? 'd1' : 'd2';
        drops += `<use href="#${id}" x="${r(GX0 + 3 + q() * (GW - 6))}" y="${r(GY0 + 3 + Math.sqrt(q()) * (GH - 6))}"/>`;
      }
      let bokeh = '';
      const nb = Math.round(10 + 16 * rain);
      for (let i = 0; i < nb; i++) bokeh += `<circle cx="${r(GX0 + 8 + q() * (GW - 16))}" cy="${r(196 + q() * 110)}" r="${r(2.5 + q() * 4)}" fill="url(#${q() < 0.7 ? 'gBw' : 'gBc'})" opacity="${r((dk ? 0.3 : 0.22) + q() * 0.25)}"/>`;
      let trails = '';
      const nt = Math.round(5 + 9 * rain);
      for (let i = 0; i < nt; i++) {
        let x = GX0 + 6 + q() * (GW - 12), y = 104 + q() * 120, d = `M${r(x)} ${r(y)}`;
        for (let k = 0; k < 6; k++) { x += (q() - 0.5) * 1.4; y += 8 + q() * 6; d += `L${r(x)} ${r(y)}`; }
        trails += d;
      }
      const runner = (x, y0, dur, del) => {
        let p = `M${r(x)} ${r(y0)}`, xx = x;
        for (let k = 8; k <= 112; k += 8) { xx += (q() - 0.5) * 0.9; p += `L${r(xx)} ${r(y0 + k)}`; }
        const an = `style="animation-duration:${r(dur)}s;animation-delay:${r(-del)}s"`;
        return `<path class="rdT" ${an} d="${p}" pathLength="1"/><use class="rdY" ${an} href="#dr" x="${r(x)}" y="${r(y0)}"/>`;
      };
      const runX = () => { const pn = panes[3 + Math.floor(q() * 3)]; return pn[0] + 6 + q() * (pn[2] - 12); };
      let runners = '';
      const nr = 4 + Math.round(8 * rain);
      for (let i = 0; i < nr; i++) runners += runner(runX(), 104 + q() * 100, 6 + q() * 6, q() * 12);
      let runners2 = '';
      for (let i = 0; i < 5; i++) runners2 += runner(runX(), 104 + q() * 100, 3.4 + q() * 2.4, q() * 6);
      // Date hints in the view: snow for winter, distant fireworks for the fireworks nights.
      let snow = '';
      if (ev && (ev.id === 'winter' || ev.id === 'christmas')) {
        const qs = R.rng(31);
        let fl = '';
        for (let i = 0; i < 46; i++) fl += dot(GX0 + qs() * GW, GY0 + qs() * GH);
        snow = `<g class="sw"><g class="sn" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".75"><path d="${fl}"/><path d="${fl}" transform="translate(0 -${GH})"/></g></g>`;
      }
      let fireworks = '';
      if (ev && (ev.id === 'newyear' || ev.id === 'lights' || ev.id === 'canada')) {
        const burst = (x, y, col, del) => {
          let d = '';
          for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; d += `M${r(x + Math.cos(a) * 3)} ${r(y + Math.sin(a) * 3)}L${r(x + Math.cos(a) * 11)} ${r(y + Math.sin(a) * 11)}`; }
          return `<path class="fw" style="animation-delay:${del}s" d="${d}" stroke="${col}" stroke-width="1.1" stroke-linecap="round"/>`;
        };
        fireworks = burst(120, 128, S.a1, 0) + burst(318, 112, S.a2, -2.6);
      }

      const outside = `
        <rect x="${GX0}" y="${GY0}" width="${GW}" height="${GH}" fill="url(#sk)"/>
        ${stars ? `<path d="${stars}" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".55"/>` : ''}${moon}
        <g class="cl" opacity="${r((dk ? 0.3 : 0.35) + 0.5 * oc)}">${clouds}</g>
        <g filter="url(#bl)">
          <path d="${area(far, 300)}" fill="${P.far}"/>
          ${snowD ? `<path d="${snowD}" fill="${P.snow}" clip-path="url(#fc)" opacity="${dk ? 0.75 : 0.9}"/>` : ''}
          <path d="${area(near, 300)}" fill="${P.near}"/>
          ${grouse ? `<path d="${grouse}" stroke="#fff3d6" stroke-width="1.3" stroke-linecap="round"/>` : ''}
          <rect x="${GX0}" y="190" width="${GW}" height="${HZ - 190}" fill="url(#hz)"/>
          <path d="${cB.d}" fill="${P.cB}"/>
          <path d="${cB.win}" fill="${P.lit}" opacity="${dk ? 0.6 : 0.5}"/>
          <path d="${cF.d}M392 ${HZ}a12 12 0 0 1 24 0zM314 167.5a3.5 3.5 0 0 1 3.5-3.5h18a3.5 3.5 0 0 1 0 7h-18a3.5 3.5 0 0 1-3.5-3.5z" fill="${P.cF}"/>
          <path d="M326.5 164V147M404 250v-7" stroke="${P.cF}" stroke-width="1.2"/>
          <path d="M392.6 ${HZ}a11.4 11.4 0 0 1 22.8 0M317 167.5h19" stroke="${P.lit}" stroke-width="1" stroke-dasharray="1 1.6" fill="none"/>
          <path d="${cF.win}" fill="${P.lit}" opacity="${dk ? 0.9 : 0.75}"/>
          <path d="${cF.win2}${cB.win2}" fill="${P.lit2}" opacity=".7"/>
          <rect x="${GX0}" y="${HZ}" width="${GW}" height="${GY1 - HZ}" fill="url(#wa)"/>
          <path d="M${GX0} ${HZ + 0.6}h${GW}" stroke="${dk ? '#1c2244' : '#3a3c66'}" stroke-width="1.6"/>
          <path d="${lamps}" stroke="${P.lit}" stroke-width="1.3" stroke-linecap="round"/>
        </g>
        <g class="lo" filter="url(#bl)"><path d="${cF.off}${cB.off}" fill="${P.lit}" opacity="${dk ? 0.85 : 0.7}"/></g>
        <path class="sh" d="${cF.refl}M326.5 ${HZ + 3}v30" stroke="${P.lit}" stroke-width="2.4" opacity="${dk ? 0.3 : 0.28}" fill="none"/>
        ${beacons}${snow}${fireworks}
        ${nA ? `<g stroke="${P.rain}" stroke-linecap="round" fill="none">
          <g opacity="${r((0.12 + 0.2 * rain) * 100) / 100}" stroke-width=".7"><g class="rnB"><use href="#rB"/><use href="#rB" y="-${GH}"/></g></g>
          <g opacity="${r((0.16 + 0.3 * rain) * 100) / 100}" stroke-width="1"><g class="rnA"><use href="#rA"/><use href="#rA" y="-${GH}"/></g></g></g>` : ''}
        ${bokeh}<rect x="${GX0}" y="${GY1 - 74}" width="${GW}" height="74" fill="url(#cnd)"/>
        <path d="${trails}" stroke="#fff" stroke-opacity="${dk ? 0.09 : 0.18}" stroke-width=".8" fill="none"/>
        ${drops}${runners}
        <g opacity="${r((0.35 + 0.65 * rain) * 100) / 100}"><g class="rbt">
          <rect x="${GX0}" y="${GY0}" width="${GW}" height="${GH}" fill="${dk ? '#8a97c4' : '#ffffff'}" opacity=".1"/>
          <g stroke="${P.rain}" stroke-linecap="round" fill="none" stroke-width="1.1" opacity="${dk ? 0.45 : 0.55}"><g class="rnC"><use href="#rC"/><use href="#rC" y="-${GH}"/></g></g>
          ${runners2}
        </g></g>
        <path d="M${GX0} ${GY0}h110L${GX0} 210Z" fill="#fff" opacity="${dk ? 0.03 : 0.08}"/><path d="M300 ${GY0}h46L252 ${GY1}h-24Z" fill="#fff" opacity="${dk ? 0.025 : 0.07}"/>`;

      const paneHoles = panes.map(([x, y, w, h]) => `M${x} ${y}v${h}h${w}v-${h}z`).join('');
      const windowSvg = `
        <g clip-path="url(#gl)">${outside}</g>
        <path fill-rule="evenodd" fill="${P.fr}" d="M22 22h408v314H22z${paneHoles}"/>
        <path d="${panes.map(([x, y, w, h]) => `M${x} ${y + 0.8}h${w}M${x + 0.8} ${y}v${h}`).join('')}" stroke="#000" stroke-opacity=".45" stroke-width="1.6"/>
        <path d="M22 22.6h408M22.6 22v314" stroke="${P.frH}" stroke-opacity=".5"/>
        <rect x="12" y="336" width="428" height="10" rx="2" fill="${P.sill}"/><rect x="12" y="336" width="428" height="2" fill="${P.sillH}"/><rect x="16" y="346" width="420" height="4" fill="#000" opacity=".22"/>
        <path d="M394 336l2-11h16l2 11z" fill="${P.pot}"/><rect x="393" y="323" width="22" height="3" rx="1" fill="${P.potR}"/>
        <g fill="${P.green}">${[-60, -25, 0, 25, 60, -90, 90].map((a, i) => `<ellipse cx="404" cy="${i > 4 ? 321 : 316}" rx="2.4" ry="${i > 4 ? 4.5 : 6.5}" transform="rotate(${a} 404 322)"/>`).join('')}</g>`;

      // ---------------------------------------------------------------- shelves, pennant, the muted match
      const rgbStrip = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="1.8" fill="url(#rgb)"/><rect x="${x - 4}" y="${y + 1.8}" width="${w + 8}" height="56" fill="url(#rgb)" mask="url(#mf)" opacity="${dk ? 0.3 : 0.16}"/>`;
      const shelf = y => `<rect x="978" y="${y}" width="200" height="8" fill="${P.shelf}"/><rect x="978" y="${y}" width="200" height="1.6" fill="${P.shelfT}"/>${rgbStrip(984, y + 8, 188)}`;
      const bookC = ['#40527a', '#7a3f3f', '#3f6150', '#5c4a7a', '#8a7448'].map(h => (dk ? R.lerpHex(h, '#000000', 0.35) : h));
      const books = [[990, 6, 30], [997, 8, 34], [1006, 5, 27], [1012, 7, 32], [1020, 6, 29]].map(([x, w, h], i) =>
        `<rect x="${x}" y="${104 - h}" width="${w}" height="${h}" fill="${bookC[i]}"/><rect x="${x}" y="${110 - h}" width="${w}" height="1.4" fill="#d9b45a" opacity=".55"/>`).join('') +
        `<rect x="1029" y="76" width="7" height="28" fill="${bookC[3]}" transform="rotate(-14 1029 104)"/>`;
      const cube = ['#e03131', '#f1f3f5', '#f59f00', '#1c7ed6', '#2b8a3e', '#f1f3f5', '#f59f00', '#e03131', '#1c7ed6'].map((col, i) =>
        `<rect x="${1150 + (i % 3) * 3.6}" y="${93 + Math.floor(i / 3) * 3.6}" width="3.2" height="3.2" fill="${col}"/>`).join('');
      // Real Madrid, kept small: a white desk pennant with a thin gold edge, no crest and no name.
      const pennant = `<ellipse cx="1062" cy="104" rx="7" ry="1.8" fill="#2a2420"/><path d="M1062 104V60" stroke="#b89a5a" stroke-width="1.3"/>
        <path d="M1063 61L1104 70.5L1063 80Z" fill="#f7f5ef" stroke="#c9a227" stroke-width=".9" stroke-linejoin="round"/><path d="M1063 70.5h41L1063 80Z" fill="#000" opacity=".06"/>`;
      const succ = `<path d="M1117 104l2-11h15l2 11z" fill="#d8d2c6"/><g fill="${P.green}">${[-50, -18, 18, 50].map(a => `<ellipse cx="1126.5" cy="88" rx="2.2" ry="5.5" transform="rotate(${a} 1126.5 92)"/>`).join('')}</g>`;
      let vines = '', leaves = '';
      [[1134, 200, 1128, 262], [1146, 200, 1150, 286], [1157, 200, 1166, 248]].forEach(([x0, y0, x1, y1], vi) => {
        vines += `M${x0} ${y0}C${x0 - 6} ${y0 + 20} ${x1 + 6} ${y1 - 24} ${x1} ${y1}`;
        const n = Math.round((y1 - y0) / 9);
        for (let k = 1; k <= n; k++) {
          const t = k / n, x = r(x0 + (x1 - x0) * t + Math.sin(t * 6 + vi) * 2.5), y = r(y0 + (y1 - y0) * t);
          leaves += `<use href="#lf" transform="translate(${x} ${y}) rotate(${k % 2 ? 40 : 140}) scale(${r(0.8 + 0.25 * Math.sin(k))})"/>`;
        }
      });
      const pothos = `<path d="${vines}" stroke="${P.green}" stroke-width=".9" fill="none"/><g fill="${P.green}">${leaves}
        ${[-140, -110, -70, -40].map((a, i) => `<use href="#lf" transform="translate(${1138 + i * 7} 181) rotate(${a})"/>`).join('')}</g>
        <path d="M1128 196l3-16h28l3 16z" fill="${dk ? '#8c8478' : '#d6cdbf'}"/>`;

      // The muted match: generic white kits against red, no crests.
      let stripes = '';
      for (let x = 984; x < 1124; x += 18) stripes += `M${x} 132h9v54h-9z`;
      const tm = (pts, col, cls) => `<g class="${cls}"><path d="${pts.map(([x, y]) => `M${x} ${y}v3`).join('')}" stroke="${col}" stroke-width="2" stroke-linecap="round"/></g>`;
      const tv = `
        <rect x="994" y="128" width="118" height="64" rx="3" fill="#08090c" stroke="#23262e"/>
        <path d="M1040 192h26l2 4h-30z" fill="#15171c"/>
        <g clip-path="url(#c6)"><g class="fp">
          <rect x="980" y="132" width="146" height="54" fill="#2c7a39"/><path d="${stripes}" fill="#33873f"/>
          <path d="M980 137.5h146M1053 137.5v49M1126 147h-16v30h16" stroke="#fff" stroke-opacity=".6" stroke-width=".6" fill="none"/>
          <ellipse cx="1053" cy="160" rx="10" ry="6.5" stroke="#fff" stroke-opacity=".6" stroke-width=".6" fill="none"/>
          ${tm([[1012, 150], [1030, 162], [1044, 146], [1060, 170], [1076, 156]], '#f4f4f4', 'fa')}
          ${tm([[1020, 166], [1038, 152], [1056, 158], [1070, 145], [1088, 164]], '#d6453d', 'fb')}
          <path class="fbl" d="M1050 162h.1" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>
        </g>
        <rect x="1001" y="135" width="30" height="7" rx="1" fill="#0a0c10" opacity=".85"/><rect x="1002.4" y="136.4" width="2.4" height="4.2" fill="#fff"/><rect x="1026.6" y="136.4" width="2.4" height="4.2" fill="#d6453d"/>
        ${tx(1015.6, 140.6, 4.6, '#fff', '2 - 1', 'class="sans" text-anchor="middle" font-weight="700"')}
        <path d="M1094 137.6h1.6l2-1.6v5.2l-2-1.6h-1.6z" fill="#fff" opacity=".85"/><path d="M1099.4 137.4l2.6 2.6M1102 137.4l-2.6 2.6" stroke="#fff" stroke-width=".7" opacity=".85"/>
        <rect x="998" y="132" width="110" height="54" fill="url(#gl2)"/></g>
        <circle cx="1106" cy="189.4" r=".9" fill="#ff5a5a" opacity=".7"/>`;

      let tag = '';
      if (ev) {
        const g = ev.greet(R.vanTime(now)), fa = ev.fa || '';
        const tw = Math.min(190, Math.round(g.length * 4.44 + 16)), th = fa ? 27 : 16, x0 = 1176 - tw;
        tag = `<g transform="translate(${x0} 30) rotate(-1.5)"><rect x="1.5" y="2" width="${tw}" height="${th}" fill="#000" opacity=".25"/><rect width="${tw}" height="${th}" fill="${dk ? '#d9ccb0' : '#f3e7cf'}"/>
          <circle cx="${tw / 2}" cy="2.6" r="1.8" fill="${T.hot}"/>${tx(8, 11.2, 6.4, '#3b2f20', g, 'class="mono" letter-spacing=".6"')}
          ${fa ? `<text x="${tw / 2}" y="22.4" font-size="7.4" fill="#3b2f20" direction="rtl" text-anchor="middle" ${FA}>${esc(fa)}</text>` : ''}</g>`;
      }

      const pendant = `<path d="M940 18V58" stroke="#0c0c0e" stroke-width="1.2"/><rect x="936.5" y="56" width="7" height="8" rx="1.2" fill="#8a6a3a"/>
        <ellipse cx="940" cy="74" rx="62" ry="58" fill="url(#gW)" opacity="${dk ? 0.42 : 0.3}"/>
        <ellipse cx="940" cy="73" rx="6.4" ry="8" fill="${P.lamp}" opacity=".95"/><path d="M937 71q3 5 6 0" stroke="#ffb867" stroke-width=".8" fill="none"/>`;

      // ---------------------------------------------------------------- monitors
      const bez = (x0, y0, x1, y1) => `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="4" fill="#07080b" stroke="${dk ? '#1f232c' : '#30343e'}"/>`;
      const glare = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#gl2)"/>`;
      const dots3 = (x, y) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#ff5f57"/><circle cx="${x + 5.5}" cy="${y}" r="1.5" fill="#febc2e"/><circle cx="${x + 11}" cy="${y}" r="1.5" fill="#28c840"/>`;

      // M1: code
      const LH = 9, CY0 = 208, CW = 6.2 * 0.6, CODEH = CODE.length * LH;
      const codeLines = CODE.map((ln, i) => {
        const ind = ln.length - ln.trimStart().length;
        return ln.trim() ? `<text x="${r(470 + ind * CW)}" y="${CY0 + i * LH}">${hl(ln.trim())}</text>` : '';
      }).join('');
      const nums = CODE.map((_, i) => `<text x="463" y="${CY0 + i * LH}">${i + 1}</text>`).join('');
      const m1 = `${bez(442, 184, 684, 340)}
        <rect x="446" y="188" width="234" height="148" fill="#0b0f1a"/>
        <g class="bt" style="animation-delay:.5s">
          <rect x="446" y="188" width="234" height="11" fill="#0f1424"/>${dots3(452, 193.5)}
          <rect x="470" y="188" width="38" height="11" fill="#0b0f1a"/><rect x="470" y="198" width="38" height="1" fill="${S.a1}"/>
          <g class="mono" font-size="5.4">${tx(475, 196, 0, '#c5cee0', 'agent.ts')}${tx(514, 196, 0, '#5d6984', 'booking.ts')}</g>
          <rect x="446" y="199" width="20" height="128" fill="#0a0d17"/>
          <rect x="466" y="${CY0 + 6 * LH - 7}" width="214" height="9" fill="#fff" opacity=".045"/>
          <g clip-path="url(#c1)"><g class="cs"><use href="#code"/><use href="#code" y="${CODEH}"/></g></g>
          <g opacity=".55" clip-path="url(#c1)"><g transform="translate(668 201) scale(.1) translate(-446 -200)"><use href="#code"/></g></g>
          <rect class="mv" x="667" y="200" width="12" height="6" fill="#fff" opacity=".07"/>
          <rect x="446" y="327" width="234" height="9" fill="${S.a2}" opacity=".24"/>
          <g class="mono" font-size="5" fill="#c5cee0">${tx(450, 333.4, 0, '', 'main  ✓ 0 problems')}${tx(676, 333.4, 0, '', 'TS', 'text-anchor="end"')}</g>
        </g>${glare(446, 188, 234, 148)}`;

      // M2: the agent's tests and eval in a terminal
      const TL = [
        { t: 2.0, cmd: 'npm test -- agent', ty: [2.3, 3.1] },
        { t: 3.6, pass: 'turn.spec.ts', ms: '41 ms' },
        { t: 4.1, pass: 'booking.spec.ts', ms: '58 ms' },
        { t: 4.6, pass: 'barge-in.spec.ts', ms: '33 ms' },
        { t: 5.1, pass: 'latency.spec.ts', ms: '62 ms' },
        { t: 5.7, raw: [['Tests: ', 'yb'], ['52 passed', 'yg'], [', 52 total', 'ym']] },
        { t: 6.4, cmd: 'npm run eval', ty: [6.7, 7.2] },
        { t: 7.5, ev: true },
        { t: 9.6, raw: [['✓ ', 'yg'], ['new best score, prompt v14', 'ym']] },
        { t: 11.5, raw: [['↳ ', 'ya'], ['call in, agent picked up', 'yw']] },
        { t: 18.7, raw: [['↳ ', 'ya'], ['slot booked, turn 640 ms', 'yw']] },
        { t: 19.5, cmd: 'git push', ty: [19.8, 20.2] },
        { t: 20.7, raw: [['✓ ', 'yg'], ['pushed to main', 'ym']] },
        { t: 21.2, prompt: true },
      ];
      const TCW = 6.1 * 0.6, TEND = 23.4, TBG = '#0a0d16';
      let term = '', tcss = '', cmdN = 0;
      TL.forEach((ln, i) => {
        const y = 209 + i * 9, next = TL[i + 1] ? TL[i + 1].t : TEND;
        let o = '';
        if (ln.cmd) {
          const n = ln.cmd.length, w = r(n * TCW + 4), k = cmdN++;
          o = `<text x="704" y="${y}"><tspan class="ya">$</tspan> <tspan class="yw">${esc(ln.cmd)}</tspan></text>
            <g class="v${k}"><rect x="711" y="${y - 6.5}" width="${w + 2}" height="8.6" fill="${TBG}"/><rect class="u${k}" x="711" y="${y - 6}" width="3.4" height="7.4" fill="#d6deeb"/></g>`;
          tcss += loop('v' + k, [[0, 'transform:translateX(0)'], [ln.ty[0], `transform:translateX(0);animation-timing-function:steps(${n},end)`], [ln.ty[1], `transform:translateX(${w}px)`], [TEND + 0.1, `transform:translateX(${w}px)`], [TEND + 0.2, 'transform:translateX(0)'], [L, 'transform:translateX(0)']], `transform:translateX(${w}px);`);
          tcss += show('u' + k, [[ln.t, next]], 0.05);
        } else if (ln.pass) {
          o = `<rect x="704" y="${y - 6.2}" width="17" height="7.8" rx="1" fill="#2fbf71"/>${tx(705.7, y - 0.4, 5.6, '#06120a', 'PASS', 'font-weight="700"')}
            ${tx(725, y, 0, '', ln.pass, 'class="yw"')}${tx(862, y, 0, '', ln.ms, 'class="ym" text-anchor="end"')}`;
        } else if (ln.raw) {
          o = `<text x="704" y="${y}">${ln.raw.map(([s, k]) => `<tspan class="${k}">${esc(s)}</tspan>`).join('')}</text>`;
        } else if (ln.ev) {
          let segs = '', outl = '';
          for (let k = 0; k < 10; k++) { segs += `M${r(726 + k * 5.4)} ${r(y - 5.4)}h4.4v5.4h-4.4z`; outl += `M${r(726.3 + k * 5.4)} ${r(y - 5.1)}h3.8v4.8h-3.8z`; }
          o = `${tx(704, y, 0, '', 'eval', 'class="ym"')}<path d="${segs}" fill="${S.a3}"/>
            <rect class="eb" x="725" y="${y - 6}" width="56" height="7" fill="${TBG}"/><path d="${outl}" fill="none" stroke="${S.a3}" stroke-opacity=".35" stroke-width=".6"/>
            <g font-weight="700" fill="#ffd166">${['0.81', '0.86', '0.90', '0.94'].map((s, k) => tx(784, y, 0, '', s, `class="e${k}"`)).join('')}</g>`;
          tcss += loop('eb', [[0, 'transform:translateX(0)'], [7.6, 'transform:translateX(0);animation-timing-function:steps(10,end)'], [9.2, 'transform:translateX(56px)'], [TEND + 0.1, 'transform:translateX(56px)'], [TEND + 0.2, 'transform:translateX(0)'], [L, 'transform:translateX(0)']], 'transform:translateX(56px);');
          [[7.5, 8.0], [8.0, 8.5], [8.5, 9.1], [9.1, TEND]].forEach((sg, k) => { tcss += show('e' + k, [sg], 0.04); });
        } else if (ln.prompt) {
          o = `<text x="704" y="${y}" class="ya">$</text><g class="ub"><rect x="711" y="${y - 6}" width="3.4" height="7.4" fill="#d6deeb"/></g>`;
        }
        term += `<g class="l${i}">${o}</g>`;
        tcss += show('l' + i, [[ln.t, TEND]], 0.12);
      });
      const m2 = `${bez(696, 184, 914, 340)}
        <rect x="700" y="188" width="210" height="148" fill="${TBG}"/>
        <g class="bt" style="animation-delay:.75s">
          <rect x="700" y="188" width="210" height="11" fill="#111522"/>${dots3(706, 193.5)}
          ${tx(805, 196, 5.4, '#8b97b3', '~/voice-agent  zsh', 'class="mono" text-anchor="middle"')}
          <g clip-path="url(#c2)" class="mono" font-size="6.1" fill="${ink}">${term}</g>
        </g>${glare(700, 188, 210, 148)}`;

      // M3: the agent profile card, compact
      const C3 = dk ? { bg: '#0b0f16', bar: '#121823', bd: '#283141', fg: T.fg, mu: T.muted } : { bg: '#fbfcfd', bar: '#eef1f5', bd: '#d5dce4', fg: T.fg, mu: T.muted };
      const Y3 = [
        [0, [['agent', 'zk'], [':', 'zp'], [' behbod', 'zs']]],
        [0, [['role', 'zk'], [':', 'zp'], [' full-stack engineer', 'zs']]],
        [0, [['voice', 'zk'], [':', 'zp']]],
        [2, [['pipeline', 'zk'], [':', 'zp'], [' [', 'zb'], ['stt, llm, tts', 'zs'], [']', 'zb']]],
        [2, [['barge_in', 'zk'], [':', 'zp'], [' true', 'zn']]],
        [0, [['fuel', 'zk'], [':', 'zp'], [' pomegranate juice', 'zs']]],
        [0, [['home', 'zk'], [':', 'zp'], [' Vancouver, BC', 'zs']]],
        [0, [['status', 'zk'], [':', 'zp'], [' shipping', 'zv']]],
      ];
      const yaml = Y3.map(([ind, tk], i) => `<text x="${r(477 + ind * 3.24)}" y="${r(80 + i * 8.6)}">${tk.map(([s, k]) => `<tspan class="${k}">${esc(s)}</tspan>`).join('')}</text>`).join('');
      const talk = [4, 7, 10, 6, 3].map((h, i) => `<rect class="pk" style="animation-delay:${r(-i * 0.17)}s" x="${r(585.2 + i * 2.6)}" y="${r(85 - h / 2)}" width="1.6" height="${h}" rx=".8" fill="#fff"/>`).join('');
      const spark = [[576, 166], [590, 163], [604, 164], [618, 159], [632, 157], [646, 153], [660, 151], [674, 148]];
      const m3 = `${bez(466, 54, 684, 176)}
        <rect x="470" y="58" width="210" height="114" fill="${C3.bg}"/>
        <g class="bt" style="animation-delay:.95s">
          <rect x="470" y="58" width="210" height="10" fill="${C3.bar}"/>${dots3(476, 63)}
          ${tx(530, 65.6, 5, C3.mu, 'behbod.agent.yaml', 'class="mono" text-anchor="middle"')}
          <g class="mono" font-size="5.4">${yaml}</g>
          ${tx(477, 160, 5, C3.mu, '# prompt v14', 'class="mono"')}
          <path d="M571 72V168" stroke="${C3.bd}"/>
          <circle cx="590" cy="85" r="11" fill="url(#ag)"/>
          <g class="ptk">${talk}</g><g class="pti"><path d="${dot(585.5, 85)}${dot(590, 85)}${dot(594.5, 85)}" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>
          <g class="sans">${tx(606, 84, 8.4, C3.fg, 'behbod', 'font-weight="700"')}${tx(606, 92, 5.2, C3.mu, 'voice agent')}</g>
          <rect x="576" y="100" width="98" height="12" rx="6" fill="none" stroke="${C3.bd}"/>
          <g class="pso"><circle cx="583" cy="106" r="2.2" fill="${T.a3}"/>${tx(588.5, 108, 5.4, C3.fg, 'online, ready', 'class="mono"')}</g>
          <g class="psc"><circle class="pp" cx="583" cy="106" r="2.2" fill="${T.hot}"/><circle cx="583" cy="106" r="2.2" fill="${T.hot}"/>${tx(588.5, 108, 5.4, C3.fg, 'on a call', 'class="mono"')}</g>
          <g fill="none" stroke="${C3.bd}"><rect x="576" y="120" width="28" height="10" rx="3"/><rect x="609" y="120" width="28" height="10" rx="3"/><rect x="642" y="120" width="28" height="10" rx="3"/><path d="M604 125h5M637 125h5"/></g>
          <g class="mono" font-size="5" fill="${C3.mu}" text-anchor="middle">${tx(590, 126.8, 0, '', 'STT')}${tx(623, 126.8, 0, '', 'LLM')}${tx(656, 126.8, 0, '', 'TTS')}</g>
          <g class="ptk"><circle class="pd" cx="590" cy="133.4" r="1.5" fill="${T.a3}"/></g>
          ${tx(576, 145, 5, C3.mu, 'eval', 'class="mono"')}${tx(674, 145, 6, C3.fg, '0.94', 'class="mono" text-anchor="end" font-weight="700"')}
          <path d="${R.linePath(spark)}L674 168L576 168Z" fill="${T.a1}" opacity=".14"/><path d="${R.linePath(spark)}" fill="none" stroke="${T.a1}" stroke-width="1" stroke-linejoin="round"/>
        </g>${glare(470, 58, 210, 114)}`;

      // M4: the Caller ID card: ready, ringing, live, ended
      const C4 = dk ? { c0: '#131a29', c1: '#0b0f18', fg: '#f3f6fb', mu: '#8e9ab0', wv: '#3a4459', ok: '#2fc469', no: '#ff453a' }
        : { c0: '#ffffff', c1: '#eef2f7', fg: '#141a24', mu: '#5d6878', wv: '#c9d1dd', ok: '#1fae55', no: '#e5352b' };
      const ph1 = 'M-11 -1.5c0-4.5 5-7.5 11-7.5s11 3 11 7.5l-.8 3.2c-.3 1-1.3 1.5-2.3 1.2l-3.6-1.2c-.9-.3-1.4-1.2-1.2-2.1l.3-1.7c-2.2-.7-4.6-.7-6.8 0l.3 1.7c.2.9-.3 1.8-1.2 2.1l-3.6 1.2c-1 .3-2-.2-2.3-1.2z';
      const btn = (x, col, rot) => `<circle cx="${x}" cy="102" r="8.5" fill="${col}"/><path d="${ph1}" fill="#fff" transform="translate(${x} 102) rotate(${rot}) scale(.42)"/>`;
      let wave = '';
      for (let i = 0; i < 30; i++) {
        const h = r(2 + 13 * Math.abs(Math.sin(i * 0.71 + 0.4)) * (0.45 + 0.55 * Math.abs(Math.sin(i * 0.23))));
        wave += `<rect class="cw" style="animation-delay:${r(-i * 0.13)}s" x="${r(707 + i * 5.8)}" y="${r(140 - h / 2)}" width="2.6" height="${h}" rx="1.3"/>`;
      }
      const hdr = (s, col) => tx(707, 70.5, 5.6, col, s, 'class="mono" letter-spacing="1.1" font-weight="700"');
      const m4 = `${bez(696, 54, 890, 176)}
        <rect x="700" y="58" width="186" height="114" fill="url(#cbg)"/>
        <g class="bt" style="animation-delay:1.1s">
          <g class="ca">${hdr('AGENT READY', T.a3)}<circle cx="759" cy="68.6" r="1.8" fill="${C4.ok}"/>
            ${tx(745, 104.5, 6.6, C4.mu, 'waiting for calls', 'class="sans"')}<path d="M707 140h172" stroke="${C4.wv}" stroke-width="1.2"/></g>
          <g class="cb">${hdr('INCOMING CALL', T.a1)}${[0, 1, 2].map(k => `<circle class="cdt" style="animation-delay:${k * 0.2}s" cx="${770 + k * 5}" cy="68.6" r="1.3" fill="${T.a1}"/>`).join('')}
            <circle class="cr" cx="724" cy="102" r="14" fill="none" stroke="${T.a1}" stroke-width="1.3"/><circle class="cr" style="animation-delay:-.8s" cx="724" cy="102" r="14" fill="none" stroke="${T.a1}" stroke-width="1.3"/>
            ${btn(836, C4.no, 0)}<circle class="cp" cx="864" cy="102" r="8.5" fill="none" stroke="${C4.ok}" stroke-width="1.2"/>${btn(864, C4.ok, -135)}
            <path d="M707 140h172" stroke="${C4.wv}" stroke-width="1.2"/></g>
          <g class="cc">${hdr('LIVE CALL', C4.no)}<circle class="cdt" cx="752" cy="68.6" r="1.8" fill="${C4.no}"/>${btn(864, C4.no, 0)}
            <g fill="${T.a1}">${wave}</g>${tx(707, 165, 5.2, C4.mu, 'HD voice · agent speaking', 'class="mono"')}</g>
          <g class="cd">${hdr('CALL ENDED', C4.mu)}${tx(707, 143, 7.6, C4.ok, '✓ slot booked', 'class="sans" font-weight="700"')}${tx(707, 154, 5.4, C4.mu, 'summary saved to the lead', 'class="sans"')}</g>
          <g class="cv"><g class="cz"><circle cx="724" cy="102" r="14" fill="url(#ag)"/>${tx(724, 105.8, 10, '#fff', 'BB', 'class="sans" text-anchor="middle" font-weight="700"')}</g></g>
          <g class="cn sans">${tx(745, 99.5, 9.6, C4.fg, 'Behbod Babai', 'font-weight="700"')}${tx(745, 109, 5.8, C4.mu, 'Vancouver, BC')}</g>
        </g>${glare(700, 58, 186, 114)}`;

      // M5: a paused extraction shooter, generic, no logos
      let trees = 'M948 300';
      const qt = R.rng(404);
      for (let x = 948; x <= 1124; x += 4) trees += `L${x} ${r(282 + qt() * 9)}L${x + 2} ${r(292 + qt() * 4)}`;
      trees += 'L1124 300Z';
      let ticks = '';
      for (let x = 1000; x <= 1070; x += 5) ticks += `M${x} 232.5v${(x - 1000) % 15 ? 1.6 : 3}`;
      const m5 = `${bez(944, 222, 1126, 334)}
        <path d="M1031 334h8v82h-8z" fill="${P.metal}"/><ellipse cx="1035" cy="419" rx="24" ry="4" fill="${P.metal}"/>
        <g clip-path="url(#c5)">
          <rect x="948" y="226" width="174" height="104" fill="url(#gsk)"/>
          <path d="${trees}" fill="#1d2724"/><path d="M1040 300v-28l26-8 26 8v28zM968 302v-14h32v14z" fill="#141a19"/><path d="M1048 280h10v6h-10zM1074 278h10v6h-10z" fill="#d9b45a" opacity=".35"/>
          <rect x="948" y="300" width="174" height="30" fill="#161b18"/>
          <path d="M1122 312L1090 300L1072 297L1066 298L1067 301L1086 306L1094 318L1104 330H1122ZM1086 295h18v4h-18zM1094 312l6 12h7l-4-12z" fill="#0a0c0d"/>
          <rect x="948" y="226" width="174" height="104" fill="#04060a" opacity=".52"/>
          <g fill="#e4e6dc" class="mono">
            <path d="${ticks}" stroke="#e4e6dc" stroke-width=".6" opacity=".7"/><path d="M1035 238.6l-2 2.6h4z" fill="#e8c26a"/>
            ${tx(1004, 241.4, 4.4, '', 'NW', 'text-anchor="middle" opacity=".7"')}${tx(1035, 230.6, 5, '', 'N', 'text-anchor="middle" font-weight="700"')}${tx(1066, 241.4, 4.4, '', 'NE', 'text-anchor="middle" opacity=".7"')}
            ${tx(1117, 248, 4.6, '#e8c26a', 'EXFIL OPEN', 'text-anchor="end" letter-spacing=".6"')}
            ${tx(952, 318.6, 4, '', 'HP', 'opacity=".75"')}<rect x="963" y="315.6" width="40" height="2.4" fill="#fff" opacity=".15"/><rect x="963" y="315.6" width="33" height="2.4" fill="#e4e6dc"/>
            ${tx(952, 325, 4, '', 'STA', 'opacity=".75"')}<rect x="963" y="322" width="40" height="2.4" fill="#fff" opacity=".15"/><rect x="963" y="322" width="24" height="2.4" fill="#9bd17a"/>
            ${tx(1102, 323, 10, '#f1f3ea', '30', 'text-anchor="end" font-weight="700"')}${tx(1118, 323, 5, '', '/ 90', 'text-anchor="end" opacity=".7"')}${tx(1118, 328.4, 3.8, '', 'AUTO', 'text-anchor="end" opacity=".6"')}
          </g>
          <g class="gp"><path d="M1030 254h3v9h-3zM1037 254h3v9h-3z" fill="#f4f5ef"/>${tx(1035, 279, 11, '#f4f5ef', 'PAUSED', 'class="sans" text-anchor="middle" font-weight="800" letter-spacing="2.4"')}</g>
          <text class="mono" x="1035" y="290" font-size="4.6" text-anchor="middle" fill="#aeb2a6"><tspan fill="#e8c26a">RESUME</tspan>  ·  LOADOUT  ·  SETTINGS</text>
          ${glare(948, 226, 174, 104)}
        </g>`;

      const pole = `<rect x="687" y="40" width="6" height="380" fill="${P.metal}"/><rect x="683" y="36" width="14" height="6" rx="2" fill="${P.metalH}"/>
        <rect x="680" y="110" width="20" height="8" rx="2" fill="${P.metalH}"/><rect x="680" y="258" width="20" height="8" rx="2" fill="${P.metalH}"/><rect x="681" y="410" width="18" height="12" rx="2" fill="${P.metal}"/>`;

      const mic = `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M928 414L936 304L903 285" stroke="${P.metal}" stroke-width="2.8"/><path d="M931 410L938.6 306M934 300L906 284" stroke="${P.metalH}" stroke-width=".8"/>
          <path d="M932 382l2-24M914 293l12 7" stroke="${P.metalH}" stroke-width="1.6" stroke-dasharray="1 1"/></g>
        <circle cx="936" cy="304" r="3" fill="${P.metal}"/><rect x="922" y="410" width="14" height="12" rx="2" fill="${P.metal}"/>
        <path d="M903 285v6" stroke="${P.metal}" stroke-width="2"/>
        <rect x="895" y="290" width="15" height="40" rx="7" fill="url(#mc)"/>
        <path d="M896.5 296h12M896 299h13M896 302h13M896 305h13M896.5 308h12" stroke="#000" stroke-opacity=".35" stroke-width=".6"/>
        <ellipse cx="902.5" cy="313" rx="11" ry="3" fill="none" stroke="${P.metalH}" stroke-width="1.2"/>
        <path d="M898 290.6a5 5 0 0 1 6 0" stroke="#fff" stroke-opacity=".25" fill="none"/>
        <g class="ml"><ellipse cx="902.5" cy="325" rx="16" ry="9" fill="url(#gH)" opacity=".55"/><rect x="896" y="324" width="13" height="1.8" rx=".9" fill="${S.hot}"/></g>`;

      // ---------------------------------------------------------------- desk and what is on it
      let grain = '';
      for (let i = 0; i < 7; i++) { const y = 421 + i * 7.4 + q() * 2; grain += `M0 ${r(y)}C300 ${r(y + 2.4)} 640 ${r(y - 2)} 1200 ${r(y + 1)}`; }
      const desk = `<rect y="416" width="1200" height="58" fill="url(#dk)"/>
        <path d="${grain}" stroke="#000" stroke-opacity=".1" stroke-width=".8" fill="none"/>
        <rect y="416" width="1200" height="3" fill="#000" opacity=".3"/>
        <ellipse cx="180" cy="448" rx="120" ry="28" fill="url(#gW)" opacity="${dk ? 0.55 : 0.35}"/>
        <ellipse cx="690" cy="424" rx="320" ry="22" fill="url(#gA)" opacity="${dk ? 0.24 : 0.1}"/>
        <rect y="472" width="1200" height="12" fill="${P.edge}"/><rect y="472" width="1200" height="1.4" fill="#fff" opacity="${dk ? 0.07 : 0.22}"/>
        <rect y="484" width="1200" height="116" fill="url(#ud)"/>
        <rect y="484" width="1200" height="2" fill="url(#rgb)"/>
        <rect y="486" width="1200" height="84" fill="url(#rgb)" mask="url(#mf)" opacity="${dk ? 0.32 : 0.2}"/>
        <rect y="574" width="1200" height="26" fill="${dk ? '#120d0c' : '#5a4232'}"/><rect y="574" width="1200" height="1.2" fill="#000" opacity=".4"/><rect y="575" width="1200" height="10" fill="url(#rgb)" opacity="${dk ? 0.1 : 0.08}"/>`;

      const pc0 = `<ellipse cx="1062" cy="596" rx="60" ry="4" fill="#000" opacity=".45"/><rect x="1010" y="494" width="104" height="101" rx="3" fill="#0b0c10" stroke="#262a33"/>
        <rect x="1016" y="500" width="92" height="89" rx="2" fill="#050608"/>
        <rect x="1020" y="506" width="62" height="44" fill="#0e1015"/>
        <circle cx="1050" cy="527" r="9" fill="#0b0c10" stroke="url(#rgb)" stroke-width="2.2"/><circle cx="1050" cy="527" r="4" fill="#16181e"/>
        <rect x="1063" y="508" width="2.4" height="17" fill="url(#rgb)"/><rect x="1068" y="508" width="2.4" height="17" fill="url(#rgb)"/>
        <g transform="translate(1094 527)"><circle r="9.5" fill="#0a0b0e" stroke="url(#rgb)" stroke-width="1.5"/>
          <path class="fn" d="M0 0C2-6 6-7 8-5C5-3 3-1 0 0ZM0 0C6 2 7 6 5 8C3 5 1 3 0 0ZM0 0C-2 6-6 7-8 5C-5 3-3 1 0 0ZM0 0C-6-2-7-6-5-8C-3-5-1-3 0 0Z" fill="#20232b"/></g>
        <rect x="1020" y="557" width="84" height="12" rx="1" fill="#15171d"/><rect x="1020" y="557" width="84" height="1.4" fill="${S.a1}" opacity=".85"/>
        <rect x="1016" y="573" width="92" height="16" fill="#0b0c10"/><rect x="1016" y="573" width="92" height="1" fill="url(#rgb)" opacity=".7"/>
        <path d="M1020 500h28l-32 89v-30z" fill="#fff" opacity=".035"/>`;

      const lamp = `<ellipse cx="66" cy="455" rx="24" ry="4.5" fill="#000" opacity=".3"/>
        <path d="M44 453q22-8 44 0v3H44z" fill="${P.metal}"/>
        <path d="M66 449L94 356L118 314" fill="none" stroke="${P.metal}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M70.5 447L97.5 358.5M97.4 351.6L115.6 319.6" stroke="${P.metalH}" stroke-width=".8"/>
        <circle cx="94" cy="356" r="3.6" fill="${P.metal}"/><circle cx="66" cy="449" r="3" fill="${P.metal}"/>
        <path class="lp" d="M109.6 342.6L145.6 325L265 472H139.5Z" fill="url(#cone)"/>
        <g transform="translate(121.9 322.1) rotate(-26)"><path d="M-9-9H9L20 13H-20Z" fill="${P.metal}"/><path d="M-9-9H9L10.4-6H-10.4Z" fill="${P.metalH}"/>
          <ellipse class="lp" cy="13" rx="20" ry="3.4" fill="${P.lamp}"/></g>
        <circle cx="118" cy="314" r="2.6" fill="${P.metal}"/>
        <g opacity="${dk ? 0.5 : 0.35}"><ellipse class="lp" cx="140" cy="350" rx="56" ry="44" fill="url(#gW)"/></g>
        <ellipse class="lw" cx="170" cy="430" rx="190" ry="110" fill="url(#gW)" opacity="0"/>`;

      const plant = `<g transform="translate(-40 0)"><path d="M198 454l-3-26h30l-3 26z" fill="${P.pot}"/><rect x="194" y="425" width="32" height="4" rx="1" fill="${P.potR}"/>
        <g fill="${P.leaf}" stroke="${P.leafE}" stroke-width=".7" stroke-opacity=".55">
          <path d="M201 428C197 410 190 396 185 380C194 392 202 408 206 428Z"/><path d="M214 428C220 410 228 400 235 391C228 404 221 414 219 428Z"/>
          <path d="M206 428C203 404 200 384 204 352C209 380 212 404 211 428Z"/><path d="M211 428C212 400 216 378 222 360C221 386 218 408 216 428Z"/>
          <path d="M209 428C209 396 210 372 212 340C214 372 214 400 213 428Z"/></g></g>`;

      // A good over-ear headset on a proper stand.
      const headset = `<g transform="translate(0 0)"><ellipse cx="272" cy="455" rx="22" ry="4" fill="#000" opacity=".3"/>
        <path d="M254 454q18-6 36 0v2.5h-36z" fill="${P.metal}"/><rect x="270" y="364" width="4" height="91" fill="url(#pl)"/>
        <path d="M254 368q18-14 36 0" fill="none" stroke="${P.metal}" stroke-width="4.4" stroke-linecap="round"/>
        <path d="M236 398C232 334 312 334 308 398" fill="none" stroke="#9aa3b1" stroke-width="1.8"/>
        <path d="M240 393C238 341 306 341 304 393" fill="none" stroke="#1b1e25" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M245 378C246 352 298 352 299 378" fill="none" stroke="#323744" stroke-width=".8" stroke-dasharray="1.6 1.4"/>
        <path d="M236 397v8M308 397v8" stroke="#8a929f" stroke-width="2.4"/>
        <path d="M229 409q7-6 14 0M301 409q7-6 14 0" fill="none" stroke="#2a2e38" stroke-width="2"/>
        <ellipse cx="240" cy="421" rx="7.5" ry="14.5" fill="#101216"/><ellipse cx="304" cy="421" rx="7.5" ry="14.5" fill="#101216"/>
        <ellipse cx="235" cy="421" rx="10" ry="16" fill="url(#hc)"/><ellipse cx="309" cy="421" rx="10" ry="16" fill="url(#hc)"/>
        <ellipse cx="233" cy="421" rx="6.5" ry="11.5" fill="#2a2e38" stroke="${S.a1}" stroke-opacity=".5" stroke-width=".6"/>
        <ellipse cx="311" cy="421" rx="6.5" ry="11.5" fill="#2a2e38" stroke="${S.a1}" stroke-opacity=".5" stroke-width=".6"/>
        <path d="M226.5 413a10 16 0 0 1 5-9.5M300.5 413a10 16 0 0 1 5-9.5" stroke="#ffcf96" stroke-opacity=".55" stroke-width=".9" fill="none"/>
        <path d="M318.6 414a10 16 0 0 1-1.6 18" stroke="${S.a1}" stroke-opacity=".6" stroke-width=".9" fill="none"/>
        <circle cx="230.4" cy="429" r=".8" fill="${S.a3}"/></g>`;

      const music = `<g transform="translate(20 0)"><path d="M357 436l-5 18h30l-5-18z" fill="${P.metal}"/>
        <rect x="330" y="384" width="80" height="52" rx="4" fill="#0b0d12" stroke="#262a33"/><rect x="333" y="387" width="74" height="46" rx="2" fill="#121624"/>
        <rect x="337" y="391" width="24" height="24" rx="2" fill="url(#art)"/><circle cx="354" cy="397.5" r="3" fill="#fff" opacity=".85"/>
        <path d="M342 402l-2 5M347 404l-2 5M352 402l-2 5" stroke="#fff" stroke-opacity=".55" stroke-width=".7"/>
        <g class="sans">${tx(365, 397, 5, '#e6edf3', 'rain on glass')}${tx(365, 404, 4.2, mute, 'late night mix')}</g>
        <g fill="${S.a3}">${[3, 5, 4, 6, 3.5].map((h, i) => `<rect class="mq" style="animation-delay:${r(-i * 0.21)}s" x="${365 + i * 3}" y="${413 - h}" width="1.8" height="${h}"/>`).join('')}</g>
        <rect x="337" y="421" width="66" height="1.4" rx=".7" fill="#fff" opacity=".18"/><rect class="mp" x="337" y="421" width="66" height="1.4" rx=".7" fill="${S.a3}"/>
        <path d="M357 426.5l-3 2 3 2zM353 426.5l-3 2 3 2zM368 426.3h1.2v4.4h-1.2zM371 426.3h1.2v4.4h-1.2zM381 426.5l3 2-3 2zM385 426.5l3 2-3 2z" fill="#c5cee0"/></g>`;

      const keyboard = `<rect x="546" y="428" width="344" height="38" rx="5" fill="${P.mat}"/>
        <ellipse cx="724" cy="452" rx="150" ry="14" fill="url(#gB)" opacity="${dk ? 0.6 : 0.35}"/>
        <path d="M614 432H830L838 452H606Z" fill="#191b22"/><path d="M617 434H827L834 450H610Z" fill="url(#keys)"/>
        <path d="M617 434H827L834 450H610Z" fill="url(#rgb)" opacity=".26"/><path d="M606 452.4H838" stroke="url(#rgb)" stroke-width="1.2"/>
        <ellipse cx="858" cy="447" rx="7.5" ry="10" fill="#1a1c23"/><path d="M858 438.5v5" stroke="#3a3f4b" stroke-width="1.2"/><path d="M851.5 452a7.5 6 0 0 0 13 0" stroke="url(#rgb)" fill="none"/>`;

      const console0 = `<ellipse cx="1155" cy="424" rx="20" ry="3" fill="#000" opacity=".3"/>
        <rect x="1141" y="336" width="28" height="88" rx="5" fill="#14161c" stroke="#2a2e38"/>
        <rect x="1154.2" y="343" width="1.6" height="74" rx=".8" fill="${S.a1}" opacity=".85"/><rect x="1151" y="340" width="8" height="80" fill="url(#gA)" opacity=".5"/>
        <path d="M1145 346h5M1145 349h5M1145 352h5M1145 355h5M1160 346h5M1160 349h5M1160 352h5M1160 355h5" stroke="#000" stroke-opacity=".45" stroke-width=".8"/>
        <circle cx="1163" cy="417" r="1" fill="${S.a1}"/>`;
      const controller = `<ellipse cx="1108" cy="464" rx="28" ry="3.2" fill="#000" opacity=".3"/>
        <path d="M1093 446h30c7 0 10 6 10 11s-3 7-6 7c-3 0-5-3-8-5h-22c-3 2-5 5-8 5-3 0-6-2-6-7s3-11 10-11z" fill="#1b1e25"/>
        <circle cx="1101" cy="455" r="2.6" fill="#0d0f13"/><circle cx="1115" cy="455" r="2.6" fill="#0d0f13"/>
        <path d="M1092 450h4.4M1094.2 447.8v4.4" stroke="#3a3f4b" stroke-width="1.2"/>
        <g fill="#3a3f4b"><circle cx="1123" cy="448" r=".9"/><circle cx="1125.4" cy="450.2" r=".9"/><circle cx="1120.6" cy="450.2" r=".9"/><circle cx="1123" cy="452.4" r=".9"/></g>
        <path d="M1101 446.8h14" stroke="${S.a1}" stroke-width=".9" opacity=".9"/>`;

      // The date object: the delivered juice on ordinary days, the theme's object on its days.
      const objId = ev ? ev.icon : 'default';
      // Real objects sit on the desk; symbols get a small acrylic block so nothing floats.
      // It stands on the left end of the window sill, opposite the succulent.
      const OX = 48;
      const OBJ = new Set(['pumpkin', 'cake', 'ball', 'pomegranate', 'sabzeh', 'goldfish', 'lantern', 'tree']);
      const themed = objId === 'default' ? '' : OBJ.has(objId)
        ? `<ellipse cx="${OX}" cy="336" rx="11" ry="1.8" fill="#000" opacity=".3"/>${R.icon(objId, OX, 323, 1.1, T)}`
        : `<ellipse cx="${OX}" cy="336.4" rx="13" ry="1.8" fill="#000" opacity=".3"/><rect x="${OX - 13}" y="332.4" width="26" height="3.6" rx="1" fill="#1b1e25"/>
          <rect x="${OX - 11}" y="310" width="22" height="22.4" rx="2" fill="#fff" fill-opacity="${dk ? 0.06 : 0.22}" stroke="#fff" stroke-opacity="${dk ? 0.3 : 0.6}" stroke-width=".7"/>
          ${R.icon(objId, OX, 321.2, 0.78, T)}<path d="M${OX - 8.6} 312.4v18" stroke="#fff" stroke-opacity=".35" stroke-width=".7"/>`;
      const glass = `<ellipse cx="918" cy="451" rx="10" ry="2.4" fill="${P.cork}"/><g class="gj">${R.icon('default', 918, 438.8, 1.4, T)}</g>`;

      const robot = `<g class="rm">
          <ellipse cx="1050" cy="453" rx="16" ry="3" fill="#000" opacity=".35"/>
          <g class="rt">
            <rect x="1038" y="444" width="24" height="7" rx="3.5" fill="#1b1e25"/><ellipse cx="1042" cy="451" rx="3" ry="1.6" fill="#0b0c0f"/><ellipse cx="1058" cy="451" rx="3" ry="1.6" fill="#0b0c0f"/>
            <circle cx="1050" cy="430" r="16" fill="url(#rb)"/>
            <path d="M1035 434a15 5 0 0 0 30 0" fill="none" stroke="#000" stroke-opacity=".12"/>
            <path d="M1041 418l-4-9" stroke="#6b7280" stroke-width="1.1"/><circle class="rn" cx="1037" cy="408.6" r="1.7" fill="${S.hot}"/>
            <ellipse cx="1050" cy="414.4" rx="7" ry="1.8" fill="#9aa3b2"/>
            <rect x="1039" y="420" width="22" height="15" rx="6.5" fill="#0a1020"/>
            <ellipse cx="1050" cy="427.5" rx="10" ry="6" fill="url(#gC)" opacity=".45"/>
            <g class="re" fill="${S.a3}"><rect x="1043" y="424.5" width="4" height="6" rx="2"/><rect x="1053" y="424.5" width="4" height="6" rx="2"/></g>
            <path class="rh" d="M1043 429l2-2.8 2 2.8M1053 429l2-2.8 2 2.8" stroke="${S.a3}" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1042 422.4h6" stroke="#fff" stroke-opacity=".2" stroke-linecap="round"/>
          </g></g>`;

      // ---------------------------------------------------------------- him, from behind (never the face)
      // Curly hair over the whole head, fuller on top, the head sized to the shoulders.
      const hq = R.rng(4421);
      const dense = (keys, step) => {
        const out = [keys[0]];
        for (let i = 0; i < keys.length - 1; i++) {
          const [x0, y0] = keys[i], [x1, y1] = keys[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
          for (let k = 1; k <= n; k++) out.push([x0 + (x1 - x0) * k / n + (hq() - 0.5) * 1.6, y0 + (y1 - y0) * k / n + (hq() - 0.5) * 1.6]);
        }
        return out;
      };
      const scal = pts => pts.slice(1).reduce((d, p, i) => { const q0 = pts[i], rr = r(Math.hypot(p[0] - q0[0], p[1] - q0[1]) * 0.6); return d + `A${rr} ${rr} 0 0 1 ${r(p[0])} ${r(p[1])}`; }, `M${r(pts[0][0])} ${r(pts[0][1])}`);
      const hair = dense([[574, 354], [563, 338], [557, 318], [558, 298], [564, 280], [574, 266], [586, 256], [597, 250], [609, 250], [621, 256], [631, 266], [638, 281], [642, 299], [643, 318], [637, 338], [626, 354], [613, 359], [600, 361], [587, 359], [574, 354]], 7);
      const hairTop = hair.filter(p => p[1] < 272);
      let curls = '', curlsS = '';
      for (let i = 0; i < 96; i++) {
        let x, y;
        do { x = 560 + hq() * 80; y = 252 + hq() * 106; } while (((x - 600) / 40) ** 2 + ((y - 306) / 53) ** 2 > 1);
        const top = y < 302 && Math.abs(x - 600) < 26, sz = top ? 2.4 + hq() * 1.6 : 1.6 + hq() * 1.2;
        const dx = r((hq() < 0.5 ? -1 : 1) * sz * (0.8 + hq() * 0.8)), dy = r((hq() < 0.5 ? -1 : 1) * sz * (0.4 + hq() * 0.8));
        const seg = `M${r(x)} ${r(y)}a${r(sz)} ${r(sz)} 0 1 ${hq() < 0.5 ? 0 : 1} ${dx} ${dy}`;
        if (top) curls += seg; else curlsS += seg;
      }
      const skull = 'M600 271C625 271 642 290 642 318C642 345 628 364 600 366C572 364 558 345 558 318C558 290 575 271 600 271Z';
      const person = `<g class="wh">
          <path d="M584 382C560 388 520 400 496 422C478 438 470 460 466 492L460 600H740L734 492C730 460 722 438 704 422C680 400 640 388 616 382Z" fill="url(#hd)"/>
          <path d="M470 486C474 458 486 440 506 424" fill="none" stroke="#ffb867" stroke-opacity="${dk ? 0.35 : 0.3}" stroke-width="2"/>
          <path d="M694 424C714 440 726 458 730 486" fill="none" stroke="${S.a1}" stroke-opacity=".45" stroke-width="2"/>
          <path d="M586 346h28l3 44h-34z" fill="${P.skin}"/><rect x="586" y="346" width="28" height="16" fill="#000" opacity=".3"/>
          <path d="M554 402C554 383 646 383 646 402C646 421 554 421 554 402Z" fill="${P.hood2}"/>
          <path d="M562 398C570 389 630 389 638 398" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="2"/>
          <path d="M564 391C586 385 614 385 636 391" fill="none" stroke="${S.a1}" stroke-opacity=".3" stroke-width="1.2"/>
          <g class="hd">
            <ellipse cx="557.5" cy="326" rx="4.8" ry="9.5" fill="${P.skin}"/><ellipse cx="642.5" cy="326" rx="4.8" ry="9.5" fill="${P.skin}"/>
            <path d="M556.5 321c1.8-3 3.4-3 3.4 2.4M643.5 321c-1.8-3-3.4-3-3.4 2.4" stroke="#000" stroke-opacity=".25" fill="none"/>
            <path d="${skull}" fill="${P.skin}"/>
            <path d="${scal(hair)}Z" fill="${P.hair}"/>
            <path d="${curls}" fill="none" stroke="${P.hair2}" stroke-width="1.25" stroke-linecap="round"/>
            <path d="${curlsS}" fill="none" stroke="${P.hair2}" stroke-width="1" stroke-linecap="round" opacity=".85"/>
            <path d="${scal(hairTop)}" fill="none" stroke="${S.a1}" stroke-opacity=".14" stroke-width="3" filter="url(#sf)"/>
            <path d="${scal(hairTop)}" fill="none" stroke="${S.a1}" stroke-opacity=".32" stroke-width="1"/>
            <path d="M559 300C557 320 561 340 571 354" fill="none" stroke="#ffb867" stroke-opacity=".3" stroke-width="1.2"/>
            <path d="M641 300C643 320 639 340 629 354" fill="none" stroke="${S.a1}" stroke-opacity=".25" stroke-width="1"/>
          </g></g>
        <path d="M512 600V452Q512 424 542 422H658Q688 424 688 452V600Z" fill="${P.chair}"/>
        <path d="M524 600V458Q524 436 548 434H652Q676 436 676 458V600Z" fill="url(#mesh)"/>
        <path d="M515 450Q516 425 543 423H657Q684 425 685 450" fill="none" stroke="${P.chairH}" stroke-width="2"/>
        <path d="M530 522Q600 510 670 522" fill="none" stroke="${P.chairH}" stroke-opacity=".5" stroke-width="1.4"/>
        <path d="M687 452V600" stroke="${S.a1}" stroke-opacity=".25" stroke-width="1.5"/>`;

      // ---------------------------------------------------------------- the story clock
      const buzz = [[0, 'transform:none'], [9.1, 'transform:none']];
      for (let t = 9.2, k = 0; t <= 11.2; t += 0.1, k++) buzz.push([t, `transform:rotate(${k % 2 ? 6 : -6}deg)`]);
      buzz.push([11.3, 'transform:none'], [L, 'transform:none']);
      const eye = (t, tr, o = 1) => [t, `transform:${tr};opacity:${o}`];
      const blink = t => [eye(t - 0.06, 'none'), eye(t, 'scaleY(.1)'), eye(t + 0.08, 'none')];
      const rx = (dx, dy = 0) => `transform:translate(${dx}px,${dy}px)`;
      const story =
        loop('rm', [[0, rx(0)], [13.0, rx(0)], [13.4, rx(-10)], [13.9, rx(-48, -1.5)], [14.4, rx(-86)], [14.8, rx(-96)], [16.4, rx(-96)], [16.8, rx(-86)], [17.2, rx(-48, -1.5)], [17.6, rx(-10)], [18.0, rx(0)], [L, rx(0)]], 'transform-box:view-box;') +
        loop('rt', [[0, 'transform:none'], [15.0, 'transform:none'], [15.3, 'transform:rotate(-9deg)'], [15.8, 'transform:rotate(-9deg)'], [16.2, 'transform:none'], [L, 'transform:none']], VB(1050, 452)) +
        loop('gj', [[0, rx(132, -37) + ';opacity:0'], [0.6, rx(132, -37) + ';opacity:1'], [13.0, rx(132, -37) + ';opacity:1'], [13.4, rx(122, -37) + ';opacity:1'], [13.9, rx(84, -38.5) + ';opacity:1'], [14.4, rx(46, -37) + ';opacity:1'], [14.8, rx(36, -37) + ';opacity:1'], [15.05, rx(36, -37) + ';opacity:1'], [15.4, rx(18, -46) + ';opacity:1'], [15.8, rx(0, 0) + ';opacity:1'], [23.2, rx(0, 0) + ';opacity:1'], [23.7, rx(0, 0) + ';opacity:0'], [L, rx(132, -37) + ';opacity:0']], 'transform-box:view-box;') +
        loop('re', [eye(0, 'none'), ...blink(2.0), eye(3.0, 'none'), eye(3.3, 'translateX(-2.4px)'), eye(4.2, 'translateX(-2.4px)'), eye(4.5, 'none'), ...blink(6.3), eye(7.2, 'none'), eye(7.5, 'translateX(2.4px)'), eye(8.4, 'translateX(2.4px)'), eye(8.7, 'none'), ...blink(10.1), eye(12.4, 'none'), eye(12.7, 'translateX(-2.4px)'), eye(15.3, 'translateX(-2.4px)'), eye(15.45, 'translateX(-2.4px)', 0), eye(16.6, 'none', 0), eye(16.75, 'none'), ...blink(19.4), eye(21.0, 'none'), eye(21.6, 'translateY(1.4px) scaleY(.22)'), eye(23.3, 'translateY(1.4px) scaleY(.22)'), eye(23.7, 'none'), eye(L, 'none')], FB) +
        show('rh', [[15.5, 16.7]], 0.15) +
        loop('hd', [[0, 'transform:none'], [3.4, 'transform:rotate(-1deg)'], [6.6, 'transform:none'], [9.0, 'transform:none'], [9.6, 'transform:translateX(1.5px) rotate(2.6deg)'], [11.2, 'transform:translateX(1.5px) rotate(2.6deg)'], [12.0, 'transform:none'], [14.9, 'transform:none'], [15.4, 'transform:translateX(2px) rotate(3.4deg)'], [16.4, 'transform:translateX(2px) rotate(3.4deg)'], [17.0, 'transform:none'], [20.0, 'transform:none'], [21.0, 'transform:translateY(1.2px) rotate(-1.6deg)'], [23.2, 'transform:translateY(1.2px) rotate(-1.6deg)'], [L, 'transform:none']], VB(600, 366), 'ease-in-out') +
        // the call: ready, ringing, live, ended
        show('ca', [[0, 9.0], [23.4, L]]) + show('cb', [[9.0, 11.4]]) + show('cc', [[11.4, 18.6]]) + show('cd', [[18.6, 23.4]]) + show('cn', [[9.0, 23.4]]) +
        loop('cv', [[0, 'opacity:.35'], [8.7, 'opacity:.35'], [9.0, 'opacity:1'], [23.4, 'opacity:1'], [23.7, 'opacity:.35'], [L, 'opacity:.35']]) +
        loop('cz', buzz, FB) +
        show('ptk', [[11.4, 18.6]]) + show('pti', [[0, 11.4], [18.6, L]]) + show('psc', [[11.4, 18.6]]) + show('pso', [[0, 11.4], [18.6, L]]) + show('ml', [[11.4, 18.6]], 0.2) +
        // rain swells and calms, then the late glow
        loop('rbt', [[0, 'opacity:0'], [12.0, 'opacity:0'], [14.6, 'opacity:1'], [16.6, 'opacity:1'], [20.4, 'opacity:0'], [L, 'opacity:0']], 'opacity:0;', 'ease-in-out') +
        loop('dm', [[0, 'opacity:0'], [19.4, 'opacity:0'], [21.4, 'opacity:.24'], [23.2, 'opacity:.24'], [L, 'opacity:0']], 'opacity:0;', 'ease-in-out') +
        loop('bi2', [[0, 'opacity:0'], [19.4, 'opacity:0'], [21.4, 'opacity:1'], [23.2, 'opacity:1'], [L, 'opacity:0']], 'opacity:0;', 'ease-in-out') +
        loop('lw', [[0, 'opacity:0'], [19.4, 'opacity:0'], [21.4, 'opacity:.35'], [23.2, 'opacity:.35'], [L, 'opacity:0']], '', 'ease-in-out') +
        loop('lo', [[0, 'opacity:1'], [20.4, 'opacity:1'], [22.2, 'opacity:0'], [23.3, 'opacity:0'], [L, 'opacity:1']]);

      const style = `
        .xk{fill:${S.a2}}.xf{fill:${S.a1}}.xs{fill:${S.a3}}.xn{fill:${S.warm}}.xt{fill:#e5c07b}.xc{fill:#5d6984}
        .ya{fill:${S.a3}}.yw{fill:#d6deeb}.ym{fill:${mute}}.yg{fill:#3fd17f}.yb{fill:#f3f6fb;font-weight:700}
        .zk{fill:${T.a1}}.zp{fill:${T.muted}}.zs{fill:${T.a3}}.zn{fill:${T.warm}}.zb{fill:${T.a2}}.zv{fill:${T.fg};font-weight:700}
        .in{opacity:0;animation:in 1.8s ease-out both}@keyframes in{from{opacity:1}}
        .bt{animation:bt 1.2s both}@keyframes bt{0%{opacity:0}30%{opacity:.6}42%{opacity:.15}100%{opacity:1}}
        .lp{animation:lp 1.4s .9s both}@keyframes lp{0%{opacity:0}25%{opacity:.9}35%{opacity:.2}55%,100%{opacity:1}}
        .bi{animation:bi 7s 2s ease-in-out infinite}@keyframes bi{0%,100%{opacity:1}50%{opacity:.72}}
        .rnA{${VB(0, 0)}animation:rn .72s linear infinite}.rnB{${VB(0, 0)}animation:rn 1.2s linear infinite}.rnC{${VB(0, 0)}animation:rn .55s linear infinite}
        @keyframes rn{from{transform:translateY(0)}to{transform:translateY(${GH}px)}}
        .rdT{fill:none;stroke:#fff;stroke-opacity:${dk ? 0.16 : 0.3};stroke-width:.8;stroke-dasharray:1 1;stroke-dashoffset:.6;animation:rdT 8s linear infinite}
        .rdY{transform-box:view-box;transform:translateY(45px);animation:rdY 8s linear infinite}
        @keyframes rdY{0%{transform:translateY(0);opacity:0}5%{opacity:1}18%{transform:translateY(4px)}30%{transform:translateY(5px)}42%{transform:translateY(38px)}55%{transform:translateY(42px)}66%{transform:translateY(44px)}80%{transform:translateY(96px)}92%{transform:translateY(110px);opacity:1}100%{transform:translateY(112px);opacity:0}}
        @keyframes rdT{0%{stroke-dashoffset:1;opacity:0}5%{opacity:1}18%{stroke-dashoffset:.964}30%{stroke-dashoffset:.955}42%{stroke-dashoffset:.661}55%{stroke-dashoffset:.625}66%{stroke-dashoffset:.607}80%{stroke-dashoffset:.143}92%{stroke-dashoffset:.018;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
        .cl{${VB(0, 0)}animation:cl 26s ease-in-out infinite alternate}@keyframes cl{from{transform:translateX(-10px)}to{transform:translateX(14px)}}
        .bk{animation:bk 1.6s steps(1,end) infinite}@keyframes bk{0%{opacity:1}50%{opacity:.15}}
        .sh{stroke-dasharray:2 1.6;animation:sh 2.6s linear infinite}@keyframes sh{to{stroke-dashoffset:-7.2}}
        .sn{${VB(0, 0)}animation:sn 16s linear infinite}@keyframes sn{to{transform:translateY(${GH}px)}}
        .sw{${VB(0, 0)}animation:sw 3.4s ease-in-out infinite alternate}@keyframes sw{from{transform:translateX(-3px)}to{transform:translateX(3px)}}
        .fw{${FB}opacity:.8;animation:fw 5.2s ease-out infinite}@keyframes fw{0%{opacity:0;transform:scale(.2)}8%{opacity:1}40%,100%{opacity:0;transform:scale(1.1)}}
        .cs{${VB(0, 0)}animation:cs 48s linear infinite}@keyframes cs{to{transform:translateY(-${CODEH}px)}}
        .mv{${VB(0, 0)}animation:mv 48s linear infinite}@keyframes mv{to{transform:translateY(${r(CODEH * 0.1)}px)}}
        .ub{animation:ub 1s steps(1,end) infinite}@keyframes ub{50%{opacity:0}}
        .pk{${FB}animation:pk .7s ease-in-out infinite alternate}@keyframes pk{from{transform:scaleY(.35)}}
        .pd{${VB(0, 0)}animation:pd 1.4s ease-in-out infinite}@keyframes pd{0%{transform:translateX(0);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateX(66px);opacity:0}}
        .pp{${FB}animation:pp 1.6s ease-out infinite}@keyframes pp{from{transform:scale(1);opacity:.8}to{transform:scale(2.6);opacity:0}}
        .cdt{animation:cdt 1.2s infinite}@keyframes cdt{0%,100%{opacity:.25}50%{opacity:1}}
        .cr{${FB}opacity:0;animation:cr 1.6s ease-out infinite}@keyframes cr{from{transform:scale(1);opacity:.7}to{transform:scale(1.8);opacity:0}}
        .cp{${FB}opacity:0;animation:cp 1.6s ease-out infinite}@keyframes cp{from{transform:scale(1);opacity:.6}to{transform:scale(1.6);opacity:0}}
        .cw{${FB}animation:cw .9s ease-in-out infinite alternate}@keyframes cw{from{transform:scaleY(.3)}}
        .gp{animation:gp 3.2s ease-in-out infinite}@keyframes gp{50%{opacity:.55}}
        .fp{${VB(0, 0)}animation:fp 9s ease-in-out infinite alternate}@keyframes fp{from{transform:translateX(-12px)}to{transform:translateX(8px)}}
        .fa{${VB(0, 0)}animation:fa 5s ease-in-out infinite alternate}@keyframes fa{to{transform:translate(9px,2px)}}
        .fb{${VB(0, 0)}animation:fb 5s ease-in-out infinite alternate}@keyframes fb{to{transform:translate(7px,-2px)}}
        .fbl{${VB(0, 0)}animation:fbl 5s ease-in-out infinite alternate}@keyframes fbl{0%{transform:translate(0,0)}35%{transform:translate(-12px,-8px)}70%{transform:translate(8px,4px)}100%{transform:translate(16px,-3px)}}
        .mq{transform-box:fill-box;transform-origin:center bottom;animation:mq .8s ease-in-out infinite alternate}@keyframes mq{from{transform:scaleY(.3)}}
        .mp{${VB(337, 0)}transform:scaleX(.6);animation:mp ${L}s linear infinite}@keyframes mp{from{transform:scaleX(.18)}to{transform:scaleX(.82)}}
        .fn{${FB}animation:fn 1.6s linear infinite}@keyframes fn{to{transform:rotate(360deg)}}
        .rn{animation:bk 2.2s steps(1,end) infinite}
        .wh{${VB(600, 600)}animation:wh 5.2s ease-in-out infinite}@keyframes wh{50%{transform:translateY(-1.4px)}}
        ${story}${tcss}`;

      const rgbAnim = R.smil(still, `<animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="480 0" dur="16s" repeatCount="indefinite"/>`);
      const defs = `
        <clipPath id="fr"><rect width="${W}" height="${H}" rx="16"/></clipPath>
        <clipPath id="gl">${panes.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('')}</clipPath>
        <clipPath id="fc"><path d="${area(far, 300)}"/></clipPath>
        <clipPath id="c1"><rect x="446" y="199" width="234" height="128"/></clipPath>
        <clipPath id="c2"><rect x="700" y="199" width="210" height="137"/></clipPath>
        <clipPath id="c5"><rect x="948" y="226" width="174" height="104"/></clipPath>
        <clipPath id="c6"><rect x="998" y="132" width="110" height="54"/></clipPath>
        <linearGradient id="wl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.w0}"/><stop offset="1" stop-color="${P.w1}"/></linearGradient>
        <linearGradient id="sk" x1="0" y1="${GY0}" x2="0" y2="${HZ}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".55" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient>
        <linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.haze}" stop-opacity="0"/><stop offset="1" stop-color="${P.haze}" stop-opacity="${dk ? 0.55 : 0.45}"/></linearGradient>
        <linearGradient id="wa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.wa0}"/><stop offset="1" stop-color="${P.wa1}"/></linearGradient>
        <linearGradient id="cnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="${dk ? 0.08 : 0.16}"/></linearGradient>
        <linearGradient id="dk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.dk0}"/><stop offset="1" stop-color="${P.dk1}"/></linearGradient>
        <linearGradient id="ud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.ud0}"/><stop offset="1" stop-color="${P.ud1}"/></linearGradient>
        <linearGradient id="hd" x1="0" y1="392" x2="0" y2="600" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${R.lerpHex(P.hood, '#ffffff', 0.08)}"/><stop offset="1" stop-color="${R.lerpHex(P.hood, '#000000', 0.35)}"/></linearGradient>
        <linearGradient id="rgb" x1="0" x2="480" gradientUnits="userSpaceOnUse" spreadMethod="repeat"><stop offset="0" stop-color="${S.a1}"/><stop offset=".33" stop-color="${S.a2}"/><stop offset=".66" stop-color="${S.a3}"/><stop offset="1" stop-color="${S.a1}"/>${rgbAnim}</linearGradient>
        <linearGradient id="vf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <mask id="mf" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#vf)"/></mask>
        <linearGradient id="cone" x1="0" y1="320" x2="0" y2="472" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd59a" stop-opacity="${dk ? 0.3 : 0.22}"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></linearGradient>
        <linearGradient id="gl2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".06"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <linearGradient id="cbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C4.c0}"/><stop offset="1" stop-color="${C4.c1}"/></linearGradient>
        <linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${T.a1}"/><stop offset="1" stop-color="${T.a2}"/></linearGradient>
        <linearGradient id="art" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${S.a2}"/><stop offset="1" stop-color="#7a1530"/></linearGradient>
        <linearGradient id="gsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4848"/><stop offset="1" stop-color="#6c705e"/></linearGradient>
        <linearGradient id="pl" x1="0" x2="1"><stop offset="0" stop-color="${P.metalH}"/><stop offset="1" stop-color="${P.metal}"/></linearGradient>
        <linearGradient id="mc" x1="0" x2="1"><stop offset="0" stop-color="#3a3f4b"/><stop offset=".45" stop-color="#1c1f26"/><stop offset="1" stop-color="#2a2e38"/></linearGradient>
        <radialGradient id="hc" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="#4a505e"/><stop offset="1" stop-color="#16181e"/></radialGradient>
        <radialGradient id="rb" cx=".36" cy=".28" r=".8"><stop offset="0" stop-color="${dk ? '#eef1f6' : '#ffffff'}"/><stop offset=".55" stop-color="${dk ? '#a4acbc' : '#c9cfda'}"/><stop offset="1" stop-color="${dk ? '#555d6e' : '#7d8597'}"/></radialGradient>
        <radialGradient id="gW"><stop offset="0" stop-color="#ffb867"/><stop offset="1" stop-color="#ffb867" stop-opacity="0"/></radialGradient>
        <radialGradient id="gA"><stop offset="0" stop-color="${S.a1}"/><stop offset="1" stop-color="${S.a1}" stop-opacity="0"/></radialGradient>
        <radialGradient id="gB"><stop offset="0" stop-color="${S.a2}" stop-opacity=".8"/><stop offset=".6" stop-color="${S.a1}" stop-opacity=".25"/><stop offset="1" stop-color="${S.a1}" stop-opacity="0"/></radialGradient>
        <radialGradient id="gC"><stop offset="0" stop-color="${S.a3}"/><stop offset="1" stop-color="${S.a3}" stop-opacity="0"/></radialGradient>
        <radialGradient id="gH"><stop offset="0" stop-color="${S.hot}"/><stop offset="1" stop-color="${S.hot}" stop-opacity="0"/></radialGradient>
        <radialGradient id="gK"><stop offset="0" stop-color="${P.cloud}" stop-opacity=".9"/><stop offset="1" stop-color="${P.cloud}" stop-opacity="0"/></radialGradient>
        <radialGradient id="gBw"><stop offset="0" stop-color="${P.lit}"/><stop offset=".6" stop-color="${P.lit}" stop-opacity=".5"/><stop offset="1" stop-color="${P.lit}" stop-opacity="0"/></radialGradient>
        <radialGradient id="gBc"><stop offset="0" stop-color="${P.lit2}"/><stop offset=".6" stop-color="${P.lit2}" stop-opacity=".5"/><stop offset="1" stop-color="${P.lit2}" stop-opacity="0"/></radialGradient>
        <radialGradient id="gM"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <filter id="bl" filterUnits="userSpaceOnUse" x="${GX0}" y="${GY0}" width="${GW}" height="${GH}"><feGaussianBlur stdDeviation="${r(0.55 + 0.6 * rain)}"/></filter>
        <filter id="sf" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
        <pattern id="keys" width="9" height="5.3" patternUnits="userSpaceOnUse" x="610" y="434"><rect x=".8" y=".7" width="7.4" height="4" rx="1" fill="#2a2e38"/><rect x="1.6" y=".9" width="5.8" height="2.4" rx=".8" fill="#3a3f4c"/></pattern>
        <pattern id="brk" width="26" height="13" patternUnits="userSpaceOnUse"><path d="M0 .4h26M0 6.9h26M13 .4v6.5M.4 6.9v6.5" stroke="#000" stroke-opacity="${dk ? 0.32 : 0.1}" stroke-width=".8" fill="none"/><path d="M0 1.3h26M0 7.8h26" stroke="#fff" stroke-opacity="${dk ? 0.025 : 0.12}" stroke-width=".6"/></pattern>
        <pattern id="mesh" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0M0 0l6 6" stroke="#fff" stroke-opacity=".045"/></pattern>
        <path id="lf" d="M0 0C2-3.4 7.4-4 9 0C7.4 4 2 3.4 0 0Z"/>
        <g id="d0"><circle r="2.6" fill="${P.body}" fill-opacity="${P.bodyOp}"/><path d="M-2.1-.5a2.2 2.2 0 0 1 4.2 0z" fill="${P.lit}" fill-opacity=".5"/><path d="M-2.1 1a2.4 2.4 0 0 0 4.2 0" stroke="#fff" stroke-opacity=".5" stroke-width=".5" fill="none"/><circle cx="-.9" cy="-1.1" r=".55" fill="#fff" fill-opacity=".85"/></g>
        <g id="d1"><use href="#d0" transform="scale(.62)"/></g>
        <g id="d2"><use href="#d0" transform="scale(.4)"/></g>
        <g id="dr"><path d="M0-4C1.7-1.8 2.7-.4 2.7 1.1a2.7 2.7 0 0 1-5.4 0C-2.7-.4-1.7-1.8 0-4z" fill="${P.body}" fill-opacity="${P.bodyOp}"/><path d="M-1.8 1.4a2 2 0 0 0 3.6 0" stroke="#fff" stroke-opacity=".6" stroke-width=".6" fill="none"/><path d="M-1.6-.1a1.7 1.7 0 0 1 3.2 0z" fill="${P.lit}" fill-opacity=".55"/><circle cx="-.8" cy="-.6" r=".6" fill="#fff" fill-opacity=".9"/></g>
        <path id="rA" d="${streak(nA || 1, 14, -2.4, 11)}"/><path id="rB" d="${streak(nB || 1, 8, -1.4, 23)}"/><path id="rC" d="${streak(nC, 18, -3, 37)}"/>
        <g id="code" class="mono" font-size="6.2" fill="${ink}">${codeLines}<g fill="#3e4862" text-anchor="end">${nums}</g></g>`;

      const body = `<g clip-path="url(#fr)">
        <rect width="${W}" height="420" fill="url(#wl)"/><rect width="${W}" height="416" fill="url(#brk)"/>
        <ellipse cx="160" cy="300" rx="320" ry="240" fill="url(#gW)" opacity="${dk ? 0.2 : 0.26}"/>
        <g opacity="${dk ? 0.5 : 0.3}"><ellipse class="bi" cx="690" cy="196" rx="360" ry="230" fill="url(#gB)"/></g>
        ${pendant}
        ${windowSvg}
        ${shelf(104)}${books}${pennant}${succ}${cube}
        ${shelf(196)}${tv}${pothos}${tag}
        <rect y="0" width="${W}" height="12" fill="${P.beam}"/><rect y="12" width="${W}" height="5" fill="#000" opacity=".2"/>
        <rect class="dm" width="${W}" height="416" fill="#04050b"/>
        <g opacity="${dk ? 0.35 : 0.2}"><ellipse class="bi2" cx="690" cy="220" rx="300" ry="190" fill="url(#gB)"/></g>
        ${pole}${m3}${m4}${m1}${m2}${m5}${mic}
        ${desk}${pc0}
        ${lamp}${plant}${headset}${music}${keyboard}${themed}${glass}${console0}${controller}${robot}
        ${person}
        <rect class="in" width="${W}" height="${H}" fill="#030409"/>
      </g>`;

      const weatherWord = rain >= 0.6 ? 'heavy rain' : rain > 0.15 ? 'rain' : rain > 0 ? 'drizzle' : 'a few drops';
      const desc = `Animated illustration of Behbod Babai's loft ${dk ? 'at night' : 'in the morning'} in Vancouver, seen from behind his chair. A big steel window looks over the downtown towers, the water and the North Shore mountains, with ${weatherWord} on the glass. ` +
        'On his monitors: TypeScript for a voice agent, a terminal where the agent\'s tests pass and its eval score climbs, a Caller ID card that rings, goes live and books a slot, the agent\'s profile card, a paused shooter on a side screen and a muted football match on a small TV. ' +
        `A little round desk robot rolls over with a glass of pomegranate juice${ev && objId !== 'default' ? `, and a small ${ev.name} touch sits on the window sill` : ''}. Headphones on a stand, a studio mic, a glowing keyboard, plants and a small white pennant fill the room.`;
      return R.svg({ w: W, h: H, title: 'Behbod Babai', desc, style, defs, body, still, noBand: true });
    },
  });
})();
