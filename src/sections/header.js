(function () {
  const R = window.HL, r = R.r;
  const W = 1200, H = 400, DY = 60, HZ = 230, TX = 910, TYL = 89, TY = TYL + DY;
  const FA = `font-family:'Segoe UI',Tahoma,'Noto Naskh Arabic','Geeza Pro',sans-serif`;
  const f2 = v => Math.round(v * 100) / 100;
  const ip = pts => 'M' + pts.map(p => Math.round(p[0]) + ' ' + Math.round(p[1])).join('L');
  const ss = u => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
  const ON = 1.9;

  // The Voice Line as the tower's broadcast: born at the antenna light, swelling over the water, settling to silence before the name.
  function voiceLine(T, s, still) {
    const xs = TX, xe = 590, len = xs - xe, mid = TY, n = 64, K = 8;
    const v = R.resample(R.norm(R.gauss(s, 6)), n);
    const env = i => {
      const t = i / (n - 1);
      const bump = Math.exp(-(((t - 0.42) / 0.3) ** 2));
      return (0.1 + 0.9 * bump) * ss(t / 0.16) * ss((1 - t) / 0.5) * (0.85 + 0.3 * v[i]);
    };
    const strandsSpec = [
      { f: 2.15, amp: 52, ph: 0, sw: 3, main: true },
      { f: 2.4, amp: 40, ph: 1.1, sw: 1.1 }, { f: 1.9, amp: 37, ph: 2.3, sw: 1 }, { f: 2.7, amp: 31, ph: 3.4, sw: 0.9 },
      { f: 2.05, amp: 27, ph: 4.4, sw: 0.9 }, { f: 2.9, amp: 22, ph: 5.2, sw: 0.8 }, { f: 1.7, amp: 19, ph: 0.6, sw: 0.8 }, { f: 3.2, amp: 14, ph: 2.9, sw: 0.7 },
    ];
    const pts = (sp, k) => Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1);
      return [xs - len * t, mid + sp.amp * env(i) * Math.sin(2 * Math.PI * sp.f * t * 0.9 + sp.ph - k * 2 * Math.PI / K)];
    });
    let defs = '', lines = '';
    strandsSpec.forEach((sp, j) => {
      const fr = [];
      for (let k = 0; k <= K; k++) fr.push(ip(pts(sp, k % K)));
      defs += `<path id="hv${j}" d="${fr[0]}" pathLength="1">${R.smil(still, `<animate attributeName="d" dur="${r(4.2 + j * 0.37)}s" repeatCount="indefinite" values="${fr.join(';')}"/>`)}</path>`;
    });
    const top = [], bot = [];
    for (let i = 0; i < n; i++) { const x = xs - len * i / (n - 1); top.push([x, mid - 40 * env(i)]); bot.unshift([x, mid + 40 * env(i)]); }
    const mainCol = T.mode === 'dark' ? '#f4f6ff' : '#1b2550';
    const strandCol = j => R.lerpHex(T.a1, T.a2, (j % 4) / 3);
    lines += `<path d="${ip(top.concat(bot))}Z" fill="url(#hvLens)" opacity="${T.mode === 'dark' ? 0.55 : 0.45}"/>`;
    strandsSpec.slice(1).forEach((sp, jj) => { const j = jj + 1; lines += `<use href="#hv${j}" fill="none" stroke="${strandCol(j)}" stroke-width="${sp.sw}" opacity="${r(0.75 - jj * 0.06)}"/>`; });
    lines += `<use href="#hv0" fill="none" stroke="${mainCol}" stroke-width="7" opacity=".22" filter="url(#hvGlow)"/><use href="#hv0" fill="none" stroke="${mainCol}" stroke-width="2.6" stroke-linecap="round"/>`;
    defs += `<linearGradient id="hvLens" x1="0" x2="1"><stop offset="0" stop-color="${T.a2}" stop-opacity="0"/><stop offset=".45" stop-color="${T.a2}" stop-opacity=".3"/><stop offset=".75" stop-color="${T.a1}" stop-opacity=".35"/><stop offset="1" stop-color="${T.a1}" stop-opacity="0"/></linearGradient>
      <filter id="hvGlow" filterUnits="userSpaceOnUse" x="${xe - 20}" y="0" width="${len + 40}" height="${H}"><feGaussianBlur stdDeviation="5"/></filter>
      <linearGradient id="hvFadeG" gradientUnits="userSpaceOnUse" x1="${xe}" x2="${xe + 170}" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <mask id="hvFade" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="${xe}" y="0" width="${len + 30}" height="${H}" fill="url(#hvFadeG)"/></mask>`;
    return { defs, lines, mid };
  }

  // The North Shore at night (dusk in light mode), from the Signal option, without its rings.
  function ridge(keys, rng, step, jit) {
    const out = [keys[0]];
    for (let i = 0; i < keys.length - 1; i++) {
      const [x0, y0] = keys[i], [x1, y1] = keys[i + 1];
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let k = 1; k <= n; k++) {
        const t = k / n, j = k === n ? 0 : (rng() - 0.5) * 2 * jit;
        out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + j]);
      }
    }
    return out;
  }
  const silhouette = (keys, rng, step, jit, base) => {
    const pts = ridge(keys, rng, step, jit), a = pts[0], b = pts[pts.length - 1];
    return R.linePath(pts) + `L${r(b[0])} ${base}L${r(a[0])} ${base}Z`;
  };
  function scene(T) {
    const dk = T.mode === 'dark';
    const P = dk ? {
      sky0: '#0d1117', sky1: '#111b31', sky2: '#1e2d50', glow: '#463b7a', glowO: 0.55,
      far: '#1c2846', mid: '#131b31', near: '#090e1a', isl: '#0a1020', snow: '#b4c4e6',
      w0: '#152039', w1: '#0d1117', star: '#e3eaff', tower: '#9aaccf', led: '#ff5d5d', shore: '#f2c47e',
      shim: '#8299c9', hull: '#05080f', deck: '#1b2338', win: '#ffd27a', hzl: '#2c3d66', refl: 0.55,
    } : {
      sky0: '#ffffff', sky1: '#eef3fa', sky2: '#d9e3f2', glow: '#f7c59c', glowO: 0.85,
      far: '#bccadf', mid: '#8797b6', near: '#4a5a7b', isl: '#71819f', snow: '#ffffff',
      w0: '#d3dfee', w1: '#ffffff', star: '#ffffff', tower: '#27314a', led: '#d1242f', shore: '#de9440',
      shim: '#8ea3c6', hull: '#27314a', deck: '#f8fafc', win: '#e8973c', hzl: '#c3d0e4', refl: 0.42,
    };
    const rng = R.rng(4207);
    const far = silhouette([[680, HZ], [720, 222], [770, 206], [820, 188], [860, 166], [890, 150], [915, 138], [940, 128], [965, 122], [990, 130], [1010, 138], [1040, 140], [1080, 136], [1110, 118], [1135, 110], [1160, 116], [1185, 104], [1200, 108]], rng, 7, 1.8, HZ + 1);
    const mid = silhouette([[800, HZ], [840, 214], [880, 198], [915, 182], [950, 164], [980, 146], [1002, 132], [1016, 114], [1024, 92], [1029, 74], [1034, 64], [1040, 66], [1045, 80], [1050, 96], [1058, 104], [1066, 100], [1071, 86], [1075, 75], [1080, 72], [1085, 84], [1092, 104], [1104, 118], [1122, 128], [1144, 132], [1168, 126], [1200, 134]], rng, 6, 1.4, HZ + 1);
    const near = silhouette([[740, HZ], [770, 226], [800, 218], [830, 206], [860, 190], [884, 174], [900, 164], [908, 160], [916, 161], [930, 168], [955, 180], [985, 190], [1015, 186], [1045, 194], [1080, 190], [1115, 198], [1150, 194], [1180, 200], [1200, 198]], rng, 6, 1.2, HZ + 1);
    const isl = silhouette([[505, HZ], [525, 227], [548, 224], [575, 222], [600, 218], [622, 215], [640, 217], [662, 212], [684, 210], [700, 213], [724, 215], [748, 219], [772, 223], [800, 227], [825, HZ]], rng, 5, 0.7, HZ + 0.5);

    let stars = '';
    if (dk) {
      const sr = R.rng(77);
      for (let i = 0; i < 48; i++) {
        const x = 500 + sr() * 700, y = 6 - DY + Math.pow(sr(), 1.3) * (184 + DY), rr = 0.45 + sr() * 0.8, o = 0.3 + sr() * 0.6;
        const tw = sr() < 0.35;
        stars += `<circle cx="${r(x)}" cy="${r(y)}" r="${f2(rr)}" opacity="${f2(o)}"${tw ? ` class="sgst" style="animation-delay:${r(-sr() * 4)}s"` : ''}/>`;
      }
    }
    const lr = R.rng(911);
    let lights = '', lrefl = '';
    for (let i = 0; i < 34; i++) {
      const x = 790 + lr() * 410;
      const up = lr() < 0.32 && x > 845 ? lr() * (x > 960 ? 26 : 12) : 0;
      const y = HZ - 1.5 - up, o = (dk ? 0.55 : 0.45) + lr() * 0.4;
      lights += `<circle cx="${r(x)}" cy="${r(y)}" r="${f2(0.6 + lr() * 0.6)}" opacity="${f2(o)}"${lr() < 0.25 ? ` class="sgst" style="animation-delay:${r(-lr() * 4)}s"` : ''}/>`;
      if (!up) lrefl += `<path d="M${r(x)} ${HZ + 2}v${r(3 + lr() * 8)}" opacity="${f2(o * 0.45)}"/>`;
    }
    const shr = R.rng(55);
    let shim = '';
    for (let i = 0; i < 30; i++) {
      const t = Math.pow(shr(), 1.6), y = HZ + 4 + t * 100, len = 5 + t * 34 + shr() * 10, x = 520 + shr() * 680;
      shim += `<path d="M${r(x)} ${r(y)}h${r(len)}" opacity="${f2(0.15 + shr() * 0.3)}"${shr() < 0.5 ? ` class="sgsh" style="animation-delay:${r(-shr() * 6)}s"` : ''}/>`;
    }

    const tb = 161, tt = 104;
    const lx = y => 904 + (y - tb) / (tt - tb) * 5, rx = y => 916 - (y - tb) / (tt - tb) * 5;
    let brace = '', side = 0;
    for (let y = tb - 3; y > tt + 2; y -= 7) {
      const y2 = Math.max(tt + 2, y - 7);
      brace += side ? `M${r(lx(y))} ${r(y)}L${r(rx(y2))} ${r(y2)}` : `M${r(rx(y))} ${r(y)}L${r(lx(y2))} ${r(y2)}`;
      side ^= 1;
    }
    const tower = `<g class="sgtw" fill="none" stroke="${P.tower}" stroke-linecap="round">
      <path d="M904 ${tb}L909 ${tt}M916 ${tb}L911 ${tt}" stroke-width="1.3" pathLength="1"/>
      <path d="${brace}" stroke-width=".6" pathLength="1" style="animation-delay:1.35s"/>
      <path d="M906 113h8M907 106h6M910 ${tt}V90" stroke-width="1" pathLength="1" style="animation-delay:1.6s"/></g>
      <g class="sgli"><g class="sgled"><circle cx="${TX}" cy="${TYL}" r="5" fill="${P.led}" opacity=".28"/><circle cx="${TX}" cy="${TYL}" r="1.7" fill="${P.led}"/></g></g>`;

    const defs = `
      <linearGradient id="sg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky0}"/><stop offset=".55" stop-color="${P.sky1}"/><stop offset="1" stop-color="${P.sky2}"/></linearGradient>
      <linearGradient id="sg-wa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.w0}"/><stop offset="1" stop-color="${P.w1}"/></linearGradient>
      <radialGradient id="sg-gl"><stop offset="0" stop-color="${P.glow}" stop-opacity="${P.glowO}"/><stop offset="1" stop-color="${P.glow}" stop-opacity="0"/></radialGradient>
      <linearGradient id="sg-fg" gradientUnits="userSpaceOnUse" x1="468" y1="0" x2="660" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <linearGradient id="sg-rf" gradientUnits="userSpaceOnUse" x1="0" y1="${HZ}" x2="0" y2="${HZ + 74}"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="sg-wk"><stop offset="0" stop-color="${dk ? '#c9d6f2' : '#ffffff'}" stop-opacity=".5"/><stop offset="1" stop-color="${dk ? '#c9d6f2' : '#ffffff'}" stop-opacity="0"/></linearGradient>
      <mask id="sg-fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#sg-fg)"/></mask>
      <mask id="sg-rm" maskUnits="userSpaceOnUse" x="0" y="${HZ}" width="${W}" height="${H - HZ}"><rect y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#sg-rf)"/></mask>
      <clipPath id="sg-sk"><rect y="${-DY}" width="${W}" height="${HZ + DY}"/></clipPath>
      ${dk ? '<mask id="sg-mn" maskUnits="userSpaceOnUse" x="1130" y="-22" width="40" height="40"><circle cx="1150" cy="-2" r="8.5" fill="#fff"/><circle cx="1154" cy="-5" r="7.6" fill="#000"/></mask>' : ''}
      <path id="sg-m1" d="${far}"/><path id="sg-m2" d="${mid}"/><path id="sg-m3" d="${near}"/>`;

    const back = `
      <g class="sgA">
        <rect x="440" y="${-DY}" width="760" height="${HZ + DY}" fill="url(#sg-sky)"/>
        <ellipse cx="650" cy="${HZ}" rx="250" ry="78" fill="url(#sg-gl)"/>
        ${dk ? `<g fill="${P.star}">${stars}</g><circle cx="1150" cy="-2" r="16" fill="#c9d6f5" opacity=".06"/><circle cx="1150" cy="-2" r="8.5" fill="#e9eefb" mask="url(#sg-mn)"/>` : ''}
        <rect x="440" y="${HZ}" width="760" height="${H - DY - HZ}" fill="url(#sg-wa)"/>
      </g>
      <g clip-path="url(#sg-sk)"><use href="#sg-m1" class="sgL1" fill="${P.far}"/></g>
      <path class="sgA" d="M470 ${HZ + 0.5}H${W}" stroke="${P.hzl}" stroke-width="1"/>
      <path class="sgA" d="${isl}" fill="${P.isl}"/>
      <g class="sgA" mask="url(#sg-rm)" opacity="${P.refl}">
        <use href="#sg-m1" fill="${P.far}" transform="matrix(1 0 0 -1 0 ${2 * HZ})"/>
        <use href="#sg-m2" fill="${P.mid}" transform="matrix(1 0 0 -1 0 ${2 * HZ})"/>
        <use href="#sg-m3" fill="${P.near}" transform="matrix(1 0 0 -1 0 ${2 * HZ})"/>
        <path d="${isl}" fill="${P.isl}" transform="matrix(1 0 0 -1 0 ${2 * HZ})"/>
      </g>
      <g clip-path="url(#sg-sk)"><use href="#sg-m2" class="sgL2" fill="${P.mid}"/></g>
      <path class="sgL2" d="M1027 83L1031 71L1034 65.5M1072 86L1075 77L1079 73M1018 106L1023 95" fill="none" stroke="${P.snow}" stroke-width="1.1" stroke-linecap="round" opacity="${dk ? 0.45 : 0.75}"/>`;
    const front = `
      <g clip-path="url(#sg-sk)"><use href="#sg-m3" class="sgL3" fill="${P.near}"/></g>
      <g class="sgsl" fill="${P.shore}">${lights}</g>
      <g class="sgsl" stroke="${P.shore}" stroke-width=".9">${lrefl}</g>
      <g stroke="${P.shim}" stroke-width=".8" stroke-linecap="round">${shim}</g>
      ${tower}`;
    const css = `
      .sgA{animation:sgf 1.3s .05s both}@keyframes sgf{from{opacity:0}}
      .sgL1,.sgL2,.sgL3{transform-box:view-box;animation:sgu 1.5s cubic-bezier(.2,.7,.2,1) both}.sgL1{animation-delay:.3s}.sgL2{animation-delay:.48s}.sgL3{animation-delay:.66s}
      @keyframes sgu{from{opacity:0;transform:translateY(16px)}}
      .sgtw path{stroke-dasharray:1 1;animation:sgd 1s 1.1s cubic-bezier(.6,0,.2,1) both}@keyframes sgd{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
      .sgli{animation:sgf .4s ${ON}s both}.sgled{animation:sgled 2.4s ${ON + 2.4}s infinite}@keyframes sgled{0%,46%{opacity:1}54%,92%{opacity:.18}}
      .sgsl{animation:sgf 1.4s .9s both}
      .sgst{animation:sgst 4s ease-in-out infinite}@keyframes sgst{50%{opacity:.12}}
      .sgsh{animation:sgsh 6s ease-in-out infinite}@keyframes sgsh{50%{opacity:.03}}`;
    return { defs, back, front, css, led: P.led };
  }

  // A floatplane comes in over the mountains, touches down with a burst of spray and glides off toward the island.
  function floatplane(T, dk) {
    const PL = 22, PD = 4;
    const spr = dk ? '#c9d6f2' : '#8ea3c6';
    const M = R.floatplane({ T, id: 'fq', face: 1, scale: 0.72, beam: dk });
    const wake = `<g class="fpw" fill="none" stroke="url(#sg-wk)" stroke-width="1.3"><path d="M22 .7Q46 2 82 3.4"/><path d="M12 1.4Q38 4.2 70 7"/></g>`;
    const splash = `<g transform="translate(796 338)">
      <ellipse class="fpr" cx="0" cy="1" rx="12" ry="2" fill="none" stroke="${spr}" stroke-width=".9" opacity="0"/>
      <g class="fpx" opacity="0"><path d="M-2 0Q-5 -8 -13 -7M3 0Q6 -10 15 -7M0 0Q-1 -11 -4 -14M-7 0Q-12 -4 -18 -1M7 0Q12 -5 19 -2" fill="none" stroke="${spr}" stroke-width="1.1" stroke-linecap="round"/>
        <g fill="${spr}"><circle cx="-14" cy="-9" r=".9"/><circle cx="16" cy="-9.5" r=".9"/><circle cx="-5" cy="-16" r=".8"/><circle cx="9" cy="-13" r=".7"/><circle cx="-19" cy="-3" r=".7"/></g></g></g>`;
    const svg = `${splash}<g class="fpm" transform="translate(700 337)">${wake}<g class="fpp">${M.svg}</g></g>`;
    const defs = M.defs;
    const run = `${PL}s ${PD}s linear infinite both`;
    const css = `
      .fpm{transform-box:view-box;animation:fpm ${run}}
      @keyframes fpm{0%{transform:translate(1240px,196px);opacity:0}4%{opacity:1}26%{transform:translate(858px,326px)}32%{transform:translate(790px,336px);animation-timing-function:cubic-bezier(.2,.6,.4,1)}50%{transform:translate(652px,337px);opacity:1}57%,100%{transform:translate(640px,337px);opacity:0}}
      .fpp{transform-box:fill-box;transform-origin:50% 50%;animation:fpp ${run}}
      @keyframes fpp{0%,22%{transform:rotate(-4deg)}28%{transform:rotate(3deg)}33%{transform:rotate(-1deg)}37%,100%{transform:rotate(0deg)}}
      .fpw{animation:fpw ${run}}@keyframes fpw{0%,32%{opacity:0}35%,48%{opacity:1}56%,100%{opacity:0}}
      .fpx{transform-box:fill-box;transform-origin:50% 100%;animation:fpx ${PL}s ${PD}s ease-out infinite both}
      @keyframes fpx{0%,31.6%{opacity:0;transform:scale(.3,.2)}33%{opacity:.95}39%,100%{opacity:0;transform:scale(1.25,1.1)}}
      .fpr{transform-box:fill-box;transform-origin:50% 50%;animation:fpr ${PL}s ${PD}s ease-out infinite both}
      @keyframes fpr{0%,32%{opacity:0;transform:scale(.4)}34%{opacity:.7}46%,100%{opacity:0;transform:scale(2.6,1.8)}}
      ${M.css}`;
    return { svg, defs, css };
  }

  window.FINAL2.push({
    id: 'f-header', section: 1, name: 'Header',
    line: 'The Signal view of the North Shore: the tower broadcasts the Voice Line across the water, your name goes out on it, and a floatplane comes in to land.',
    render(c) {
      const { s, still } = c;
      const T = c.T, dk = T.mode === 'dark';
      const ev = c.ev, vt = R.vanTime(c.now || new Date());
      const L = R.wordLayout(R.NAME, 46);
      const V = voiceLine(T, s, still), S = scene(T), F = floatplane(T, dk);
      const NY = 30;
      const name = R.word(R.NAME, 64, 116 + NY, 46, { sw: 2.8, color: T.fg, cls: 'nm', draw: true, stagger: 0.09 });
      const letters = L.items.length, D = 2.4;
      // When the tower light comes on it sends your name out: one pulse per letter while the line swells up.
      const pulseCol = dk ? '#ffffff' : T.a2;
      let pulses = '';
      for (let i = 0; i < letters; i++) pulses += `<use href="#hv0" class="kp" fill="none" stroke="${pulseCol}" stroke-width="2.6" stroke-linecap="round" style="animation-delay:${r(ON + 0.3 + i * 0.16)}s"/>`;
      const handle = ev ? `@BEHI22 · ${ev.greet(vt)}` : '@BEHI22';
      const mottos = ['Clear the corners, then ship.', 'Low latency, high standards.', 'No silent failures.'];
      // Each motto gets 6 s and fades out before the next fades in.
      const MT = 6 * mottos.length, seg = 100 / mottos.length, mf = 2.5;
      const mtCss = mottos.map((_, i) => { const a = i * seg, b = (i + 1) * seg; return `.mt${i}{${i ? 'opacity:0;' : ''}animation:mt${i} ${MT}s linear infinite}@keyframes mt${i}{${a ? `0%,${r(a)}%{opacity:0}` : '0%{opacity:0}'}${r(a + mf)}%,${r(b - mf)}%{opacity:1}${r(b)}%,100%{opacity:0}}`; }).join('');
      const style = R.drawCss('nm', 0.9) + S.css + F.css + `
        .vl{animation:sgf .5s ${ON}s both}
        .kp{opacity:0;stroke-dasharray:.035 1.2;animation:kp 1.6s cubic-bezier(.3,0,.3,1) both}
        @keyframes kp{0%{opacity:.95;stroke-dashoffset:.035}85%{opacity:.95}100%{opacity:0;stroke-dashoffset:-1}}
        .ap{opacity:0;stroke-dasharray:.035 1.2;animation:ap 7s ${r(ON + D + 1)}s linear infinite}.ap2{animation-delay:${r(ON + D + 4.5)}s}
        @keyframes ap{0%,62%{stroke-dashoffset:.035;opacity:0}63%{opacity:1}100%{stroke-dashoffset:-1;opacity:1}}
        .sw{transform-box:view-box;transform-origin:0 ${V.mid}px;animation:sw ${D}s ${ON}s cubic-bezier(.22,.8,.3,1) both,br 6s ${r(ON + D)}s ease-in-out infinite}
        @keyframes sw{from{transform:scaleY(.04)}to{transform:scaleY(1)}}
        @keyframes br{50%{transform:scaleY(1.08)}}
        .lk{opacity:0;animation:lk ${r(D + 0.6)}s ${ON}s ease-in-out both}@keyframes lk{0%{opacity:0}12%,70%{opacity:1}100%{opacity:0}}
        .hd,.rl{animation:fi 1s both}.hd{animation-delay:.05s}.rl{animation-delay:1.4s}
        @keyframes fi{from{opacity:0;transform:translateY(6px)}}
        ${mtCss}
        .mts{animation:fi 1s 1.8s both}`;
      const icon = ev ? R.icon(ev.icon, 72, 86 + NY, 0.62, T) : '';
      const hx = ev ? 90 : 64;
      const fa = ev && ev.fa ? `<text x="${64 + L.width}" y="${92 + NY}" font-size="17" direction="rtl" text-anchor="start" style="${FA}" fill="${T.a2}" class="hd">${ev.fa}</text>` : '';
      const signal = `<g class="vl" mask="url(#hvFade)"><g class="sw">${V.lines}<use href="#hv0" class="ap" fill="none" stroke="${pulseCol}" stroke-width="3" stroke-linecap="round"/><use href="#hv0" class="ap ap2" fill="none" stroke="${T.a3}" stroke-width="2.4" stroke-linecap="round"/>${pulses}</g></g>`;
      const body = `
        <g mask="url(#sg-fade)">
          <g transform="translate(0 ${DY})">${S.back}</g>
          ${signal}
          <g transform="translate(0 ${DY})">${S.front}</g>
          ${F.svg}
          <g class="lk"><circle cx="${TX}" cy="${TY}" r="9" fill="${S.led}" opacity=".35"/><circle cx="${TX}" cy="${TY}" r="2.6" fill="#fff"/></g>
        </g>
        ${icon}<text class="mono hd" x="${hx}" y="${92 + NY}" font-size="12.5" letter-spacing="2.4" fill="${ev ? T.a1 : T.a3}">${R.esc(handle)}</text>${fa}
        ${name.svg}
        <text class="sans rl" x="64" y="${210 + NY}" font-size="20" fill="${T.fg}" opacity=".86">Full-stack engineer building voice AI</text>
        <g class="mts">${mottos.map((m, i) => `<text class="sans mt${i}" x="64" y="${246 + NY}" font-size="16" font-style="italic" fill="${T.muted}">${m}</text>`).join('')}</g>`;
      const view = dk ? 'A night' : 'A dusk';
      return R.svg({ h: H, title: 'Behbod Babai', desc: `Behbod Babai, @behi22. Full-stack engineer building voice AI. ${mottos.join(' ')} ${view} view of Vancouver's North Shore: a slim tower on a peak below the twin Lions broadcasts a voice line across the water toward Vancouver Island while a floatplane comes in to land.`, style, defs: S.defs + V.defs + F.defs, body, still, noBand: true });
    },
  });
})();
