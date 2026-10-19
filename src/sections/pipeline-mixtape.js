(function () {
  const R = window.HL, r = R.r;
  window.FINAL2 = window.FINAL2 || [];
  const FAF = '.fa{font-family:"Segoe UI",Tahoma,"Noto Naskh Arabic","Geeza Pro",sans-serif}';
  const pc = (t, D) => +(Math.max(0, Math.min(D, t)) / D * 100).toFixed(2);
  // Keyframes from [seconds | [seconds...], css] stops on a D-second timeline.
  const kf = (name, D, stops) => `@keyframes ${name}{${stops.map(([t, css]) => `${[].concat(t).map(x => pc(x, D) + '%').join(',')}{${css}}`).join('')}}`;
  // Visible inside any [a, b] window (seconds), hidden elsewhere; rest decides the still frame.
  function win(cls, segs, D, rest, f = 0.12) {
    if (!segs.length) return `.${cls}{opacity:${rest ? 1 : 0}}`;
    const st = [];
    segs.forEach(([a, b]) => {
      if (a <= 0) st.push([0, 1]); else st.push([a - f, 0], [a, 1]);
      if (b >= D) st.push([D, 1]); else st.push([b, 1], [b + f, 0]);
    });
    if (st[0][0] > 0) st.unshift([0, 0]);
    if (st[st.length - 1][0] < D) st.push([D, 0]);
    return `.${cls}{opacity:${rest ? 1 : 0};animation:${cls} ${D}s linear infinite}` + kf(cls, D, st.map(([t, o]) => [t, 'opacity:' + o]));
  }
  // Header tag for a date theme: icon, greeting, Persian greeting, laid out from the right edge.
  function greetTag(ev, now, T, xr, y) {
    const g = String(ev.greet(R.vanTime(now)));
    let x = xr, out = '';
    if (ev.fa) { out += `<text class="fa" x="${x}" y="${y + 1}" font-size="16" direction="rtl" text-anchor="start" fill="${T.a2}">${ev.fa}</text>`; x -= ev.fa.length * 8.6 + 14; }
    out += `<text class="mono" x="${r(x)}" y="${y}" font-size="11" letter-spacing="1.6" text-anchor="end" fill="${T.a1}">${R.esc(g)}</text>`;
    x -= g.length * 8.2 + 16;
    return out + R.icon(ev.icon, r(x), y - 4, 0.7, T);
  }

  // ---------- Section 3. Say My Name: one real voice turn, MIC to SPEAKER, that answers "How do I say your name?"
  window.FINAL2.push({
    id: 'f-pipeline', section: 3, name: 'Say My Name',
    line: 'One real voice turn, stage by stage: someone asks how to say my name, and a voice agent answers with the spelling, the Persian and the syllables.',
    render(c) {
      const { T, still, ev, now } = c;
      const D = 12, H = 380, Y0 = 50, CH = 128, CY = Y0 + CH / 2;
      const neg = t => +(t - D).toFixed(2);
      const words = [[0.40, 0.68], [0.74, 0.92], [0.98, 1.12], [1.20, 1.50], [1.56, 1.76], [1.82, 2.30]];
      const tk = [5.2, 5.75, 6.3, 6.85, 7.4];
      const SYL = ['beh', 'bod', 'baa', 'baa', 'yee'];
      const cards = [
        { x: 20, w: 136, n: '01', t: 'MIC', lat: '16 kHz', on: [0.4, 2.3] },
        { x: 196, w: 150, n: '02', t: 'VAD', lat: '', on: [0.4, 2.85] },
        { x: 386, w: 186, n: '03', t: 'SPEECH-TO-TEXT', lat: '~200 ms', on: [0.6, 2.95] },
        { x: 612, w: 190, n: '04', t: 'LLM', lat: 'FIRST TOKEN ~400 ms', on: [2.95, 4.8] },
        { x: 842, w: 194, n: '05', t: 'TEXT-TO-SPEECH', lat: 'FIRST AUDIO ~250 ms', on: [4.55, 7.75] },
        { x: 1076, w: 104, n: '06', t: 'SPEAKER', lat: '24 kHz', on: [5.1, 7.9] },
      ];
      let css = FAF, body = '';

      // Header
      body += `<text class="mono" x="24" y="30" font-size="11.5" letter-spacing="2.2" fill="${T.a3}">HOW TO SAY MY NAME</text>`;
      body += ev ? greetTag(ev, now, T, 1176, 30)
        : `<text class="mono" x="1176" y="30" font-size="10.5" letter-spacing="1.6" text-anchor="end" fill="${T.muted}">ONE REAL VOICE TURN, MIC TO SPEAKER</text>`;

      // Rails and ports behind the cards
      const gx = [156, 346, 572, 802, 1036], DX = 707;
      let rails = '';
      gx.forEach(x => { rails += `<line x1="${x}" y1="${CY}" x2="${x + 40}" y2="${CY}" stroke="${T.faint}" stroke-width="2"/><circle cx="${x}" cy="${CY}" r="3.2" fill="${T.bg}" stroke="${T.muted}"/><circle cx="${x + 40}" cy="${CY}" r="3.2" fill="${T.bg}" stroke="${T.muted}"/>`; });
      rails += `<line x1="${DX}" y1="${Y0 + CH}" x2="${DX}" y2="212" stroke="${T.faint}" stroke-width="2"/><circle cx="${DX}" cy="${Y0 + CH}" r="3.2" fill="${T.bg}" stroke="${T.muted}"/><text class="mono" x="${DX + 10}" y="199" font-size="9" letter-spacing="1.4" fill="${T.muted}">ANSWER</text>`;
      body += rails;

      // Cards
      cards.forEach((cd, i) => {
        body += `<rect x="${cd.x}" y="${Y0}" width="${cd.w}" height="${CH}" rx="14" fill="${T.panel}" stroke="${T.faint}"/>` +
          `<text class="mono" x="${cd.x + 14}" y="${Y0 + 22}" font-size="10.5" letter-spacing="1" fill="${T.a3}">${cd.n}</text>` +
          `<text class="mono" x="${cd.x + 34}" y="${Y0 + 22}" font-size="10.5" letter-spacing=".8" fill="${T.muted}">${cd.t}</text>` +
          `<circle cx="${cd.x + cd.w - 13}" cy="${Y0 + 18.5}" r="3.2" fill="${T.faint}"/>` +
          `<g class="pa${i}"><rect x="${cd.x + 0.75}" y="${Y0 + 0.75}" width="${cd.w - 1.5}" height="${CH - 1.5}" rx="13.4" fill="none" stroke="${T.a1}" stroke-width="1.5"/><circle cx="${cd.x + cd.w - 13}" cy="${Y0 + 18.5}" r="3.2" fill="${T.a3}"/></g>` +
          (cd.lat ? `<text class="mono" x="${cd.x + 14}" y="${Y0 + CH - 12}" font-size="9" letter-spacing=".8" fill="${T.muted}">${cd.lat}</text>` : '');
        css += win('pa' + i, [cd.on], D, false, 0.15);
      });

      // 01 MIC: the question as a waveform, one burst per word.
      const rng = R.rng(7), mx0 = 34, mx1 = 142, MY = 116;
      const wg = words.map(() => '');
      let floor = '';
      for (let x = mx0; x <= mx1 + 0.01; x += 3.6) {
        const t = 0.3 + (x - mx0) / (mx1 - mx0) * 2.1;
        const wi = words.findIndex(([a, b]) => t >= a - 0.02 && t <= b + 0.02);
        if (wi < 0) { floor += `M${r(x)} ${MY - 1.5}v3`; continue; }
        const [a, b] = words[wi], u = Math.min(1, Math.max(0, (t - a + 0.02) / (b - a + 0.04)));
        const h = r(2 + 26 * Math.pow(Math.sin(Math.PI * u), 0.7) * (0.55 + 0.45 * rng()));
        wg[wi] += `M${r(x)} ${r(MY - h)}v${r(2 * h)}`;
      }
      body += `<path d="${floor}" stroke="${T.faint}" stroke-width="2.2" stroke-linecap="round"/>` +
        wg.map((d, i) => `<path class="mw" d="${d}" stroke="${T.a1}" stroke-width="2.2" stroke-linecap="round" style="animation-delay:${neg(words[i][0])}s"/>`).join('');
      css += `.mw{transform-box:fill-box;transform-origin:center;opacity:.9;animation:mw ${D}s linear infinite}@keyframes mw{0%{opacity:1;transform:scaleY(1.2)}2.5%{opacity:1;transform:scaleY(1)}4%{opacity:.7}28%{opacity:.7}31%,100%{opacity:.22;transform:scaleY(1)}}`;

      // 02 VAD: speech probability, a cursor, then a 500 ms silence ring that ends the turn.
      const vx = t => r(210 + (t - 0.3) / 2.6 * 122);
      let vd = 'M210 104';
      words.forEach(([a, b]) => { vd += `H${vx(a)}V88H${vx(b)}V104`; });
      vd += 'H332';
      const ring = 'M228 128a14 14 0 1 1 0 28a14 14 0 1 1 0-28';
      body += `<line x1="210" y1="96" x2="332" y2="96" stroke="${T.faint}" stroke-dasharray="2 3"/>` +
        `<path d="${vd}" fill="none" stroke="${T.a3}" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<line class="vc" x1="210" y1="84" x2="210" y2="108" stroke="${T.fg}" stroke-width="1.2"/>` +
        `<path d="${ring}" fill="none" stroke="${T.faint}" stroke-width="3"/>` +
        `<path class="vr" d="${ring}" pathLength="1" fill="none" stroke="${T.hot}" stroke-width="3" stroke-linecap="round"/>` +
        `<text class="mono" x="228" y="144" font-size="9" text-anchor="middle" fill="${T.fg}">500</text><text class="mono" x="228" y="152" font-size="7" text-anchor="middle" fill="${T.muted}">ms</text>` +
        [['LISTENING', T.muted], ['SPEECH', T.a1], ['SILENCE', T.warm], ['END OF TURN', T.hot]].map(([s, col], i) => `<text class="mono vs${i}" x="252" y="140" font-size="9.5" letter-spacing=".6" font-weight="600" fill="${col}">${s}</text>`).join('') +
        `<text class="mono" x="252" y="153" font-size="8" letter-spacing=".6" fill="${T.muted}">SILENCE TIMER</text>`;
      css += kf('vc', D, [[[0, 0.3], 'opacity:0;transform:translateX(0)'], [0.34, 'opacity:.75;transform:translateX(0)'], [2.85, 'opacity:.75;transform:translateX(122px)'], [[3.0, D], 'opacity:0;transform:translateX(122px)']]) +
        `.vc{opacity:0;transform-box:view-box;animation:vc ${D}s linear infinite}` +
        `.vr{stroke-dasharray:1 2;stroke-dashoffset:0;animation:vr ${D}s linear infinite}` +
        kf('vr', D, [[[0, 2.3], 'stroke-dashoffset:1.1'], [[2.85, 11.4], 'stroke-dashoffset:0'], [[11.6, D], 'stroke-dashoffset:1.1']]) +
        win('vs0', [[0, 0.4], [11.6, D]], D, false, 0.08) + win('vs1', [[0.4, 2.3]], D, false, 0.08) + win('vs2', [[2.3, 2.85]], D, false, 0.06) + win('vs3', [[2.85, 11.6]], D, true, 0.08);

      // 03 SPEECH-TO-TEXT: partials, then the final transcript.
      const parts = [['how do', ''], ['how do I say', ''], ['how do I say', 'your'], ['how do I say', 'your name']];
      const pwin = [[0.8, 1.25], [1.25, 1.65], [1.65, 2.05], [2.05, 2.95]];
      parts.forEach(([a, b], i) => {
        body += `<g class="sp${i}"><text class="sans" x="400" y="102" font-size="15" font-style="italic" fill="${T.muted}">${a}</text>${b ? `<text class="sans" x="400" y="123" font-size="15" font-style="italic" fill="${T.muted}">${b}</text>` : ''}</g>`;
        css += win('sp' + i, [pwin[i]], D, false, 0.05);
      });
      body += `<g class="sf"><text class="sans" x="400" y="103" font-size="17" font-weight="600" fill="${T.fg}">How do I say</text><text class="sans" x="400" y="125" font-size="17" font-weight="600" fill="${T.fg}">your name?</text></g>` +
        `<g class="sc0"><rect x="400" y="135" width="56" height="15" rx="7.5" fill="none" stroke="${T.muted}"/><text class="mono" x="428" y="145.5" font-size="8" letter-spacing="1" text-anchor="middle" fill="${T.muted}">PARTIAL</text></g>` +
        `<g class="sc1"><rect x="400" y="135" width="46" height="15" rx="7.5" fill="none" stroke="${T.a3}"/><text class="mono" x="423" y="145.5" font-size="8" letter-spacing="1" text-anchor="middle" fill="${T.a3}">FINAL</text></g>`;
      css += win('sf', [[2.95, 11.6]], D, true, 0.08) + win('sc0', [[0.8, 2.95]], D, false, 0.06) + win('sc1', [[2.95, 11.6]], D, true, 0.08);

      // 04 LLM: thinking, then streaming tokens.
      const toks = ['It\'s', 'Beh', 'bod', 'Bab', 'ai,', 'say', 'beh', '-bod', 'baa', '-baa', '-yee', '.'];
      let tx = 626, ty = 98;
      toks.forEach((s, k) => {
        const w = s.length * 6 + 8;
        if (tx + w > 788) { tx = 626; ty += 18; }
        const name = k >= 1 && k <= 4, say = k >= 5 && k <= 10;
        const col = name ? T.a2 : say ? T.a1 : T.muted;
        body += `<g class="tk" style="animation-delay:${neg(3.55 + k * 0.11)}s"><rect x="${tx}" y="${ty}" width="${w}" height="15" rx="4" fill="${col}" fill-opacity=".14" stroke="${col}" stroke-opacity=".5"/><text class="mono" x="${r(tx + w / 2)}" y="${ty + 11}" font-size="10" text-anchor="middle" fill="${T.fg}">${s}</text></g>`;
        tx += w + 4;
      });
      [['WAITING', T.muted], ['THINKING', T.a2], ['WRITING', T.a1], ['ANSWER READY', T.a3]].forEach(([s, col], i) => {
        body += `<g class="ls${i}"><text class="mono" x="626" y="90" font-size="9" letter-spacing=".8" font-weight="600" fill="${col}">${s}</text>${i === 1 ? [0, 1, 2].map(j => `<circle class="ld" cx="${682 + j * 7}" cy="87" r="1.7" fill="${col}" style="animation-delay:${j * 0.15}s"/>`).join('') : ''}</g>`;
      });
      css += `.tk{transform-box:fill-box;opacity:1;animation:tk ${D}s linear infinite}@keyframes tk{0%{opacity:0;transform:translateY(4px)}1.5%{opacity:1;transform:translateY(0)}55%{opacity:1}57%,100%{opacity:0;transform:translateY(0)}}` +
        `.ld{animation:ld .6s ease-in-out infinite alternate}@keyframes ld{from{opacity:.25}to{opacity:1}}` +
        win('ls0', [[0, 2.95], [11.6, D]], D, false, 0.08) + win('ls1', [[2.95, 3.5]], D, false, 0.06) + win('ls2', [[3.5, 4.85]], D, false, 0.06) + win('ls3', [[4.85, 11.6]], D, true, 0.08);

      // 05 TEXT-TO-SPEECH: the answer's waveform, five syllable bursts and a playhead.
      const tx0 = 856, tx1 = 1022, TY = 108, tcs = [0.1, 0.3, 0.5, 0.7, 0.9].map(f => tx0 + (tx1 - tx0) * f);
      const tg = tcs.map(() => '');
      const rng2 = R.rng(23);
      for (let x = tx0; x <= tx1 + 0.01; x += 3.4) {
        let k = 0;
        tcs.forEach((cc, j) => { if (Math.abs(x - cc) < Math.abs(x - tcs[k])) k = j; });
        const h = r(1.5 + 21 * Math.exp(-(((x - tcs[k]) / 9) ** 2)) * (0.6 + 0.4 * rng2()));
        tg[k] += `M${r(x)} ${r(TY - h)}v${r(2 * h)}`;
      }
      body += tg.map((d, k) => `<path class="tb" d="${d}" stroke="${T.a2}" stroke-width="2.1" stroke-linecap="round" style="animation-delay:${neg(tk[k] - 0.12)}s"/>`).join('') +
        SYL.map((s, k) => `<text class="mono" x="${r(tcs[k])}" y="146" font-size="9" text-anchor="middle" fill="${T.muted}">${s}</text>`).join('') +
        `<line class="tp" x1="${tx0}" y1="84" x2="${tx0}" y2="132" stroke="${T.hot}" stroke-width="1.5"/>`;
      css += `.tb{transform-box:fill-box;transform-origin:center;opacity:.9;animation:tb ${D}s linear infinite}@keyframes tb{0%{opacity:1;transform:scaleY(1.25)}3%{transform:scaleY(1)}4.5%{opacity:.65}24%{opacity:.65}27%,100%{opacity:.22;transform:scaleY(1)}}` +
        `.tp{opacity:0;transform-box:view-box;animation:tp ${D}s linear infinite}` +
        kf('tp', D, [[[0, 4.9], 'opacity:0;transform:translateX(0)'], [4.925, 'opacity:1;transform:translateX(0)'], [7.675, `opacity:1;transform:translateX(${tx1 - tx0}px)`], [[7.8, D], `opacity:0;transform:translateX(${tx1 - tx0}px)`]]);

      // 06 SPEAKER: cone thumps and rings on every syllable.
      const sx = 1114, sy = 112;
      const arc = rr => { const a = 50 * Math.PI / 180; return `M${r(sx + rr * Math.cos(a))} ${r(sy - rr * Math.sin(a))}A${rr} ${rr} 0 0 1 ${r(sx + rr * Math.cos(a))} ${r(sy + rr * Math.sin(a))}`; };
      body += `<g class="sk"><rect x="1090" y="103" width="10" height="18" rx="2" fill="${T.muted}"/><path d="M1100 103L1111 93V131L1100 121Z" fill="${T.fg}"/></g>` +
        [9, 17, 25].map((rr, j) => `<path class="sr${j}" d="${arc(rr)}" fill="none" stroke="${T.a1}" stroke-width="2.2" stroke-linecap="round"/>`).join('');
      css += `.sk{transform-box:fill-box;transform-origin:center;animation:sk ${D}s linear infinite}` +
        kf('sk', D, [[0, 'transform:scale(1)']].concat(...tk.map(t => [[t, 'transform:scale(1)'], [t + 0.05, 'transform:scale(1.1)'], [t + 0.25, 'transform:scale(1)']])).concat([[D, 'transform:scale(1)']]));
      [0, 1, 2].forEach(j => {
        css += `.sr${j}{opacity:${[0.85, 0.6, 0.35][j]};animation:sr${j} ${D}s linear infinite}` +
          kf('sr' + j, D, [[0, 'opacity:.1']].concat(...tk.map(t => [[t + j * 0.08, 'opacity:.1'], [t + j * 0.08 + 0.07, 'opacity:1'], [t + j * 0.08 + 0.45, 'opacity:.1']])).concat([[D, 'opacity:.1']]));
      });

      // Packets of light between the stages, all on the same 12 s clock.
      const pk = [];
      for (let t = 0.45; t < 2.25; t += 0.22) pk.push([gx[0], t, T.a1, 6]);
      for (let t = 0.57; t < 2.4; t += 0.22) pk.push([gx[1], t, T.a1, 6]);
      pk.push([gx[1], 2.85, T.hot, 12], [gx[2], 2.95, T.a2, 12]);
      for (let i = 0; i < 6; i++) pk.push([gx[3], 3.6 + i * 0.2, T.a2, 6]);
      tk.forEach(t => pk.push([gx[4], t - 0.2, T.a1, 6]));
      let pks = pk.map(([x, t, col, w]) => `<rect class="ph${w}" x="${x}" y="${CY - 2}" width="${w}" height="4" rx="2" fill="${col}" style="animation-delay:${neg(t)}s"/>`).join('');
      pks += [3.75, 4.05, 4.35, 4.65].map(t => `<rect class="pv" x="${DX - 2}" y="${Y0 + CH}" width="4" height="8" rx="2" fill="${T.a2}" style="animation-delay:${neg(t)}s"/>`).join('');
      body += `<g filter="url(#pg)">${pks}</g>`;
      css += `.ph6,.ph12,.pv{opacity:0;transform-box:view-box;animation:ph6 ${D}s linear infinite}.ph12{animation-name:ph12}.pv{animation-name:pv}` +
        [['ph6', 'translateX(34px)'], ['ph12', 'translateX(28px)'], ['pv', 'translateY(26px)']].map(([n, to]) => `@keyframes ${n}{0%{opacity:0;transform:none}.3%{opacity:1}2%{opacity:1;transform:${to}}2.4%,100%{opacity:0;transform:${to}}}`).join('');

      // The answer
      body += `<rect x="20" y="212" width="1160" height="152" rx="16" fill="${T.panel}" stroke="${T.faint}"/><line x1="${DX}" y1="212" x2="${DX}" y2="364" stroke="${T.faint}"/><circle cx="${DX}" cy="212" r="3.2" fill="${T.bg}" stroke="${T.muted}"/>` +
        `<text class="mono" x="40" y="266" font-size="10.5" letter-spacing="1.6" fill="${T.muted}">SPELL IT</text><text class="mono" x="40" y="344" font-size="10.5" letter-spacing="1.6" fill="${T.muted}">SAY IT</text>` +
        `<text class="mono" x="283" y="235" font-size="8.5" letter-spacing="1.4" text-anchor="middle" fill="${T.muted}">FIRST NAME</text><text class="mono" x="566" y="235" font-size="8.5" letter-spacing="1.4" text-anchor="middle" fill="${T.muted}">FAMILY NAME</text>`;
      const lc = [];
      for (let i = 0; i < 6; i++) lc.push(168 + i * 46);
      for (let j = 0; j < 5; j++) lc.push(474 + j * 46);
      const LS = 30, LT = 244, k14 = LS / 14;
      let slots = '', dots = '', lets = '';
      'BEHBODBABAI'.split('').forEach((ch, i) => {
        slots += `M${lc[i] - 11} 284h22`;
        if (i !== 5 && i !== 10) dots += `<circle cx="${lc[i] + 23}" cy="${LT + 15}" r="2.3" fill="${T.muted}"/>`;
        lets += R.word(ch, lc[i] - R.GLYPHS[ch].w * k14 / 2, LT, LS, { sw: 3, color: T.fg, cls: 'lt', draw: true, delay: neg(3.8 + i * 0.1) }).svg;
      });
      body += `<path d="${slots}" stroke="${T.faint}" stroke-width="2" stroke-linecap="round"/>${dots}${lets}`;
      css += `.lt path{stroke-dasharray:1 2;animation:lt ${D}s linear infinite}@keyframes lt{0%{stroke-dashoffset:1.1;opacity:1}2.5%{stroke-dashoffset:0}55%{stroke-dashoffset:0;opacity:1}57.5%,100%{stroke-dashoffset:0;opacity:0}}`;

      // Syllables with a bouncing dot that lands on each one as the speaker says it.
      const sc = SYL.map((_, k) => 190 + k * 110);
      body += SYL.map((s, k) => `<text class="mono sy${k}" x="${sc[k]}" y="346" font-size="24" font-weight="500" text-anchor="middle" fill="${T.fg}">${s}</text>`).join('') +
        sc.slice(0, 4).map(x => `<circle cx="${x + 55}" cy="339" r="2.3" fill="${T.muted}"/>`).join('');
      SYL.forEach((_, k) => {
        css += `.sy${k}{transform-box:fill-box;animation:sy${k} ${D}s linear infinite}` + kf('sy' + k, D, [
          [[0, tk[k] - 0.04], `fill:${T.muted};transform:none`], [tk[k], `fill:${T.hot};transform:translateY(-4px)`], [tk[k] + 0.3, `fill:${T.hot};transform:none`],
          [[tk[k] + 0.5, 10.9], `fill:${T.fg};transform:none`], [[11.2, D], `fill:${T.muted};transform:none`]]);
      });
      const RY = 314, PY = 300, ease = ';animation-timing-function:';
      const up = ease + 'cubic-bezier(.25,.6,.45,1)', dn = ease + 'cubic-bezier(.55,0,.75,.4)';
      const bxs = [[[0, 4.85], `transform:translateX(${sc[0] - 80}px)`], [5.2, `transform:translateX(${sc[0]}px)`]];
      const bys = [[[0, 4.85], `opacity:0;transform:translateY(${RY}px)${up}`], [5.02, `opacity:1;transform:translateY(${PY}px)${dn}`], [5.2, `opacity:1;transform:translateY(${RY}px)`]];
      for (let k = 0; k < 4; k++) {
        bxs.push([tk[k] + 0.25, `transform:translateX(${sc[k]}px)`], [tk[k + 1], `transform:translateX(${sc[k + 1]}px)`]);
        bys.push([tk[k] + 0.25, `opacity:1;transform:translateY(${RY}px)${up}`], [tk[k] + 0.4, `opacity:1;transform:translateY(${PY}px)${dn}`], [tk[k + 1], `opacity:1;transform:translateY(${RY}px)`]);
      }
      bxs.push([D, `transform:translateX(${sc[4]}px)`]);
      bys.push([10.8, `opacity:1;transform:translateY(${RY}px)`], [[11.1, D], `opacity:0;transform:translateY(${RY}px)`]);
      body += `<g class="bx"><circle class="by" r="5" fill="${T.hot}"/></g>`;
      css += `.bx{transform-box:view-box;transform:translateX(${sc[0]}px);animation:bx ${D}s linear infinite}.by{transform-box:view-box;transform:translateY(${RY}px);animation:by ${D}s linear infinite}` + kf('bx', D, bxs) + kf('by', D, bys);

      // Persian, written right to left behind a shutter, with a pen nib on its edge.
      body += `<text class="mono" x="732" y="236" font-size="10.5" letter-spacing="1.6" fill="${T.muted}">IN PERSIAN</text><text class="mono" x="732" y="250" font-size="8.5" letter-spacing="1.2" fill="${T.muted}">READ RIGHT TO LEFT</text>` +
        `<text class="fa" x="1156" y="322" font-size="58" direction="rtl" text-anchor="start" fill="${T.a2}">بهبد بابایی</text>` +
        `<rect class="ps" x="740" y="258" width="426" height="90" fill="${T.panel}"/><circle class="pn" cx="1166" cy="300" r="4" fill="${T.a2}"/>`;
      css += `.ps{transform-box:view-box;transform-origin:740px 0px;transform:scaleX(0);animation:ps ${D}s linear infinite}` +
        kf('ps', D, [[[0, 4.85], 'transform:scaleX(1)'], [[5.65, 10.9], 'transform:scaleX(0)'], [[11.3, D], 'transform:scaleX(1)']]) +
        `.pn{opacity:0;transform-box:view-box;animation:pn ${D}s linear infinite}` +
        kf('pn', D, [[[0, 4.82], 'opacity:0;transform:translateX(0)'], [4.85, 'opacity:1;transform:translateX(0)'], [5.65, 'opacity:1;transform:translateX(-426px)'], [[5.75, D], 'opacity:0;transform:translateX(-426px)']]);

      const defs = `<filter id="pg" filterUnits="userSpaceOnUse" x="140" y="90" width="920" height="140"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
      const desc = (ev ? String(ev.greet(R.vanTime(now))) + '. ' : '') + 'How to say my name, as one voice agent turn: someone asks "How do I say your name?" and the audio flows through mic, voice activity detection, speech-to-text, an LLM, text-to-speech and the speaker. The answer: Behbod Babai, spelled B E H B O D, B A B A I, in Persian بهبد بابایی, said beh-bod baa-baa-yee.';
      return R.svg({ w: 1200, h: H, title: 'How to say Behbod Babai', desc, style: css, defs, body, still, noBand: true });
    },
  });

  // ---------- Section 5. Mixtape: a hi-fi dual cassette deck. Deck A plays the work account, deck B the personal one.
  window.FINAL2.push({
    id: 'f-mixtape', section: 5, name: 'Mixtape',
    line: 'My contributions as two tapes in an 80s hi-fi dual cassette deck: deck A is my work account, deck B my personal one.',
    render(c) {
      const { T, st, still, ev, now } = c;
      const H = 452, dark = T.mode === 'dark';
      const glass = '#07090c', vfd = '#5ef0d0', ink = T.muted;
      const face = dark ? '#1b1f26' : '#d3d7dd';
      const sum = a => a.reduce((x, y) => x + y, 0);
      const work = R.series('work'), pers = R.series('personal');
      const tw = sum(work), tp = sum(pers), tall = Math.max(1, tw + tp);
      const mw = st.months.map(m => sum(work.slice(m.start, m.end + 1))), mp = st.months.map(m => sum(pers.slice(m.start, m.end + 1)));
      const nm = st.months.length, mon = m => R.MON[+m.key.slice(5, 7) - 1].toUpperCase();
      const restM = Math.max(0, st.months.indexOf(st.busiest));
      const vt = R.vanTime(now);
      const MIX = { birthday: 'BIRTHDAY MIX', newyear: 'REWIND ' + (vt.m === 12 ? vt.y : vt.y - 1), valentines: 'LOVE SONGS', realmadrid: 'HALA MADRID MIX', pi: 'π MIX', suri: 'FIRE JUMP MIX', sizdah: 'PICNIC MIX', nowruz: 'NOWRUZ MIX', lunar: 'LUNAR MIX', earth: 'EARTH MIX', blossom: 'BLOSSOM MIX', canada: 'CANADA DAY MIX', lights: 'FIREWORKS MIX', pride: 'PRIDE MIX', programmers: 'DAY 256 MIX', thanksgiving: 'HARVEST MIX', halloween: 'SPOOKY MIX', winter: 'FIRST SNOW MIX', yalda: 'YALDA MIX', christmas: 'HOLIDAY MIX' };
      const mix = ev && MIX[ev.id];
      let css = '', defs = '', body = '';

      // ---- Cassette, drawn in its own 312 x 190 box.
      const cassette = (side, col, title, handle, months, share, sticker) => {
        const rMin = 10, rMax = 27, k2 = rMax * rMax - rMin * rMin;
        const rT = Math.sqrt(rMin * rMin + k2 * share), rS = Math.sqrt(rMin * rMin + k2 * (1 - share));
        const hub = (hx, rr) => {
          let teeth = '';
          for (let i = 0; i < 6; i++) teeth += `<rect x="${hx - 1.2}" y="88.6" width="2.4" height="2.8" transform="rotate(${i * 60} ${hx} 94)"/>`;
          return `<g class="mxh" style="animation-duration:${r(0.11 * rr)}s"><circle cx="${hx}" cy="94" r="9" fill="#ece8dc"/><circle cx="${hx}" cy="94" r="5" fill="#0b0d12"/><g fill="#ece8dc">${teeth}</g></g>`;
        };
        const tape = `M${r(128 - rS)} 94L32 172A6 6 0 0 0 38 178H274A6 6 0 0 0 280 172L${r(184 + rT)} 94`;
        const mx = Math.max(...months);
        let tl = '';
        months.forEach((v, i) => {
          const L = i < 7, x = L ? 28 : 216, y = 72 + (L ? i : i - 7) * 9, hit = v === mx && v > 0;
          if (hit) tl += `<rect x="${x - 3}" y="${y - 7}" width="74" height="9" rx="2" fill="${col}" fill-opacity=".38"/>`;
          tl += `<text x="${x}" y="${y}"${hit ? ' font-weight="700" fill="#1f2328"' : ''}>${String(i + 1).padStart(2, '0')} ${mon(st.months[i])}</text><text x="${x + 68}" y="${y}" text-anchor="end"${hit ? ' font-weight="700" fill="#1f2328"' : ''}>${v}</text>`;
        });
        return `<rect width="312" height="190" rx="12" fill="url(#mxsl)" stroke="#000" stroke-opacity=".5"/>
          <rect x="1.5" y="1.5" width="309" height="187" rx="11" fill="none" stroke="#fff" stroke-opacity=".07"/>
          <rect x="26" y="134" width="260" height="50" rx="7" fill="#0c0f14" stroke="#3a404b"/>
          <path d="${tape}" fill="none" stroke="#6b4a33" stroke-width="2.4"/>
          <path class="mxg" d="${tape}" fill="none" stroke="#e2c29a" stroke-width="1.6" stroke-dasharray="3 30"/>
          <g fill="#d9d4c7" stroke="#555b66"><circle cx="38" cy="172" r="6"/><circle cx="274" cy="172" r="6"/></g><g fill="#0b0d12"><circle cx="38" cy="172" r="2"/><circle cx="274" cy="172" r="2"/><circle cx="104" cy="168" r="4"/><circle cx="208" cy="168" r="4"/></g>
          <rect x="149" y="179" width="14" height="5" rx="1" fill="#8a7a66"/>
          <rect x="22" y="10" width="268" height="120" rx="6" fill="#f3efe4"/>
          <rect x="22" y="10" width="268" height="9" rx="5" fill="${col}"/><rect x="22" y="14" width="268" height="5" fill="${col}"/><rect x="22" y="21" width="268" height="1.5" fill="${col}" opacity=".5"/>
          <text class="sans" x="30" y="42" font-size="15" font-weight="700" fill="#1f2328">${R.esc(title)}</text>
          <text class="mono" x="30" y="55" font-size="8" letter-spacing="1" fill="#5b6470">${handle} · C-365</text>
          <circle cx="276" cy="37" r="11" fill="#1f2328"/><text class="sans" x="276" y="42" font-size="13" font-weight="700" text-anchor="middle" fill="#f3efe4">${side}</text>
          ${sticker}
          <g class="mono" font-size="7.6" fill="#5b6470">${tl}</g>
          <rect x="100" y="64" width="112" height="58" rx="6" fill="#0b0d12" stroke="#b9b2a2"/>
          <g clip-path="url(#mxwc)"><circle cx="128" cy="94" r="${r(rS)}" fill="#3d2a1e"/><circle cx="184" cy="94" r="${r(rT)}" fill="#3d2a1e"/>
          <circle cx="128" cy="94" r="${r(rS - 3)}" fill="none" stroke="#5a4030" stroke-width=".8"/><circle cx="184" cy="94" r="${r(rT - 3)}" fill="none" stroke="#5a4030" stroke-width=".8"/>
          ${hub(128, rS)}${hub(184, rT)}</g>
          <path d="M104 70L132 70L114 118L104 118Z" fill="#fff" opacity=".05"/>
          <g fill="#444b57" stroke="#0d0f13"><circle cx="11" cy="11" r="4"/><circle cx="301" cy="11" r="4"/><circle cx="11" cy="150" r="4"/><circle cx="301" cy="150" r="4"/></g>
          <path d="M8.5 11h5M11 8.5v5M298.5 11h5M301 8.5v5M8.5 150h5M11 147.5v5M298.5 150h5M301 147.5v5" stroke="#0d0f13" stroke-width="1"/>`;
      };

      // ---- Odometer counter that rolls up to a total.
      const odo = (x, y, val) => {
        let out = '';
        String(val).padStart(4, '0').split('').forEach((ch, i) => {
          let strip = '';
          for (let k = 0; k <= 9; k++) strip += `<tspan x="9.5" y="${r(18 + k * 24)}">${k}</tspan>`;
          out += `<g transform="translate(${x + i * 22} ${y})"><rect width="19" height="24" rx="3" fill="${glass}"/><g clip-path="url(#mxoc)"><g class="mxo" style="transform:translateY(${-ch * 24}px);animation-delay:${r(1.1 + i * 0.14)}s"><text class="mono" font-size="15" font-weight="500" text-anchor="middle" fill="${vfd}">${strip}</text></g></g><rect width="19" height="12" rx="3" fill="#fff" opacity=".04"/></g>`;
        });
        return out;
      };

      // ---- Transport buttons: rewind, play (lit), stop, fast forward, record.
      const btns = col => {
        const sym = [
          'M2-5L-4 0L2 5ZM8-5L2 0L8 5Z', 'M-3-5.5L5.5 0L-3 5.5Z', 'M-4.5-4.5h9v9h-9Z', 'M-2-5L4 0L-2 5ZM-8-5L-2 0L-8 5Z', ''];
        return sym.map((d, i) => {
          const x = 200 + i * 35, cx = x + 15, play = i === 1;
          return `<rect x="${x}" y="284" width="30" height="22" rx="4" fill="${dark ? '#000' : '#7d848e'}" opacity=".5" transform="translate(0 1.5)"/>` +
            `<rect x="${x}" y="284" width="30" height="22" rx="4" fill="${play ? col : dark ? '#2a2f37' : '#eef0f3'}" fill-opacity="${play ? 0.28 : 1}" stroke="${play ? col : dark ? '#0b0d12' : '#9aa1ab'}"/>` +
            (d ? `<path d="${d}" transform="translate(${cx} 295)" fill="${play ? col : ink}"/>` : `<circle cx="${cx}" cy="295" r="4.5" fill="${T.hot}"/>`);
        }).join('');
      };

      // ---- One deck in local coordinates (380 wide).
      const deck = (bx, side, label, handle, total, col, title, months, share, sticker, delay) => `<g transform="translate(${bx} 0)">
        <text class="mono" x="2" y="60" font-size="10" letter-spacing="1.6" fill="${ink}">${label}</text>
        <text class="mono" x="378" y="60" font-size="10" letter-spacing="1.2" text-anchor="end" fill="${col}">${handle}</text>
        <rect x="0" y="68" width="380" height="206" rx="12" fill="${glass}" stroke="${dark ? '#000' : '#8a9099'}"/>
        <rect x="5" y="73" width="370" height="196" rx="9" fill="none" stroke="#fff" stroke-opacity=".06"/>
        <g clip-path="url(#mxdc)"><g transform="translate(34 76)"><g class="mxin" style="animation-delay:${delay}s">${cassette(side, col, title, handle, months, share, sticker)}</g></g></g>
        <path d="M18 72H118L60 270H18Z" fill="#fff" opacity=".035"/>
        ${odo(0, 283, total)}
        <text class="mono" x="96" y="293" font-size="8" letter-spacing="1.2" fill="${ink}">COUNTER</text>
        <text class="mono" x="96" y="304" font-size="7.5" letter-spacing="1" fill="${ink}" opacity=".8">365 DAYS</text>
        ${btns(col)}</g>`;

      const stick = ev ? R.icon(ev.icon, 250, 37, 0.7, R.event2Palette(ev, R.theme('light'))) : '';
      const titleA = mix || 'WORK MIX', titleB = mix ? mix + ' VOL. 2' : 'SIDE PROJECTS';

      // ---- Chassis: rubber feet, wood cheeks, brushed faceplate.
      const rg = R.rng(11);
      let grain = '';
      for (let i = 0; i < 8; i++) {
        const x0 = 5 + i * 4.6 + rg() * 2;
        let d = `M${r(x0)} 10`;
        for (let y = 10; y < 440; y += 36) d += `Q${r(x0 + (rg() - 0.5) * 6)} ${y + 18} ${r(x0 + (rg() - 0.5) * 2.4)} ${y + 36}`;
        const lightLine = i % 3 === 1;
        grain += `<path d="${d}" fill="none" stroke="${lightLine ? '#c48f58' : '#2b1608'}" stroke-opacity="${lightLine ? 0.25 : 0.38}" stroke-width="${r(0.6 + rg() * 0.9)}"/>`;
      }
      grain += '<ellipse cx="22" cy="318" rx="3.2" ry="10" fill="none" stroke="#2b1608" stroke-opacity=".4"/><ellipse cx="22" cy="318" rx="1.2" ry="5" fill="#2b1608" opacity=".35"/>';
      body += `<rect x="110" y="438" width="80" height="10" rx="3" fill="#0b0d12" opacity=".8"/><rect x="1010" y="438" width="80" height="10" rx="3" fill="#0b0d12" opacity=".8"/>
        <rect x="4" y="6" width="44" height="436" rx="12" fill="url(#mxwd)"/><rect x="1152" y="6" width="44" height="436" rx="12" fill="url(#mxwd)"/>
        <use href="#mxgr" x="4"/><use href="#mxgr" x="1152"/>
        <rect x="38" y="8" width="1124" height="432" rx="5" fill="${face}"/><rect x="38" y="8" width="1124" height="432" rx="5" fill="url(#mxbr)"/><rect x="38" y="8" width="1124" height="432" rx="5" fill="url(#mxsn)" stroke="${dark ? '#000' : '#8a9099'}" stroke-opacity=".6"/>
        <line x1="52" y1="47.5" x2="1148" y2="47.5" stroke="#000" stroke-opacity="${dark ? 0.5 : 0.18}"/><line x1="52" y1="48.5" x2="1148" y2="48.5" stroke="#fff" stroke-opacity="${dark ? 0.06 : 0.6}"/>
        <text class="sans" x="58" y="37" font-size="17" font-weight="800" letter-spacing="1" fill="${T.fg}">BB-365</text>
        <text class="mono" x="138" y="36" font-size="10" letter-spacing="2.2" fill="${ink}">DUAL CASSETTE DECK</text>
        <text class="mono" x="1064" y="35" font-size="9.5" letter-spacing="1.8" text-anchor="end" fill="${ink}">AUTO REVERSE · TYPE II · STEREO</text>
        <text class="mono" x="1110" y="34" font-size="8" letter-spacing="1.4" text-anchor="end" fill="${ink}">POWER</text>
        <circle cx="1132" cy="30.5" r="12.5" fill="none" stroke="${T.a3}" stroke-width="2.2" class="mxpw" filter="url(#mxgo)"/>
        <use href="#mxkb" transform="translate(1132 30.5) scale(.66)"/>`;

      // ---- Decks
      body += deck(56, 'A', 'DECK A · WORK', '@BEHBOD-BABAI', tw, T.a1, titleA, mw, tw / tall, stick, 0.15);
      body += deck(764, 'B', 'DECK B · PERSONAL', '@BEHI22', tp, T.a2, titleB, mp, tp / tall, '', 0.45);
      css += `.mxin{transform-box:view-box;animation:mxin 1.05s cubic-bezier(.22,.9,.3,1.12) both}@keyframes mxin{from{transform:translateY(-200px)}}
        .mxh{transform-box:fill-box;transform-origin:center;animation:mxh 2.4s linear 1.3s infinite}@keyframes mxh{to{transform:rotate(360deg)}}
        .mxg{animation:mxg 1.1s linear 1.3s infinite}@keyframes mxg{to{stroke-dashoffset:-33}}
        .mxo{transform-box:view-box;animation:mxo 1.8s cubic-bezier(.3,1.25,.5,1) both}@keyframes mxo{from{transform:translateY(0)}}
        .mxpw{animation:mxpw 3.2s ease-in-out infinite}@keyframes mxpw{50%{opacity:.5}}`;

      // ---- VFD: combined total, rotating messages, the playing track and a two-channel strip.
      const msgs = [];
      if (ev) { msgs.push(String(ev.greet(vt))); if (c.evDay && c.evDay[1] > 1) msgs.push(`DAY ${c.evDay[0]} OF ${c.evDay[1]}`); }
      msgs.push('GITHUB CONTRIBUTIONS', 'LAST 365 DAYS', `${R.fmtDateY(st.start)} TO ${R.fmtDateY(st.end)}`);
      const qw = 100 / msgs.length;
      css += R.stateCss('mxq', msgs.map((_, i) => [r(i * qw), r((i + 1) * qw)]), msgs.length * 2.6, 0, 1.5);
      css += R.stateCss('mxt', st.months.map((_, i) => [r(i / nm * 100), r((i + 1) / nm * 100)]), nm, restM, 0.8);
      const NB = 142, SW = 284, SY = 175;
      const chan = (arr, sg) => R.norm(R.bins(arr, NB), Math.sqrt).map((v, i) => `M${i * 2 + 1} ${SY}v${r(sg * Math.max(0.6, v * 15))}`).join('');
      defs += `<g id="mxstr"><path d="${chan(work, -1)}" stroke="${vfd}" stroke-width="1.3"/><path d="${chan(pers, 1)}" stroke="${vfd}" stroke-opacity=".55" stroke-width="1.3"/></g>`;
      let tracks = '';
      st.months.forEach((m, i) => {
        tracks += `<g class="mxt${i}"><path d="M462 99.5l6 3.5-6 3.5z" fill="${vfd}"/><text x="473" y="106">TRACK ${String(i + 1).padStart(2, '0')} · ${mon(m)} ${m.key.slice(0, 4)}</text><text x="738" y="106" text-anchor="end">L ${mw[i]} · R ${mp[i]}</text></g>`;
      });
      body += `<rect x="452" y="68" width="296" height="128" rx="10" fill="${glass}" stroke="${dark ? '#000' : '#8a9099'}"/>
        <g class="mxv" filter="url(#mxvg)">
          <g clip-path="url(#mxmc)">${msgs.map((m, i) => `<text class="mono mxq${i}" x="600" y="87" font-size="10.5" letter-spacing="1.6" text-anchor="middle" fill="${vfd}">${R.esc(m)}</text>`).join('')}</g>
          <g class="mono" font-size="9" letter-spacing="1" fill="${vfd}" fill-opacity=".8">${tracks}</g>
          <text class="mono" x="600" y="137" font-size="32" font-weight="500" text-anchor="middle" fill="${vfd}">${R.n(st.total)}</text>
          <text class="mono" x="600" y="152" font-size="9" letter-spacing="1.8" text-anchor="middle" fill="${vfd}" opacity=".7">CONTRIBUTIONS · L WORK · R PERSONAL</text>
          <g clip-path="url(#mxvc)"><g transform="translate(458 0)"><g class="mxst"><use href="#mxstr"/><use href="#mxstr" x="${SW}"/></g></g></g>
          <line x1="458" y1="${SY}" x2="742" y2="${SY}" stroke="${vfd}" stroke-opacity=".3"/>
        </g>
        <rect x="452" y="68" width="296" height="128" rx="10" fill="url(#mxmh)" opacity=".5"/><rect x="452" y="68" width="296" height="128" rx="10" fill="url(#mxgl)"/>`;
      css += `.mxst{animation:mxst 26s linear infinite}@keyframes mxst{to{transform:translateX(-${SW}px)}}
        .mxv{animation:mxv .7s linear .1s both}@keyframes mxv{0%,18%{opacity:0}20%,40%{opacity:.7}42%,58%{opacity:.15}60%,100%{opacity:1}}`;

      // ---- VU meters: needles play the months, peak lights flash on each channel's busiest month.
      const mmax = Math.max(1, ...mw, ...mp);
      const ang = v => r(-48 + 96 * Math.sqrt(v / mmax));
      const meter = (x0, lab, cls, arr) => {
        const px = x0 + 71, py = 266;
        let ticks = '';
        for (let i = 0; i <= 10; i++) {
          const a = (-48 + i * 9.6) * Math.PI / 180, r2 = i % 5 ? 43 : 46;
          ticks += `M${r(px + Math.sin(a) * 38)} ${r(py - Math.cos(a) * 38)}L${r(px + Math.sin(a) * r2)} ${r(py - Math.cos(a) * r2)}`;
        }
        const a0 = 19.2 * Math.PI / 180, a1 = 48 * Math.PI / 180;
        const amid = r((ang(arr[nm - 1]) + ang(arr[0])) / 2);
        const keys = [[0, `transform:rotate(${amid}deg)`]].concat(arr.map((v, i) => [(i + 0.5), `transform:rotate(${ang(v)}deg)`]), [[nm, `transform:rotate(${amid}deg)`]]);
        const cmax = Math.max(...arr), hits = arr.map((v, i) => (v > 0 && v >= 0.85 * cmax ? [i + 0.2, i + 0.85] : null)).filter(Boolean);
        css += `.${cls}{transform-box:view-box;transform-origin:${px}px ${py}px;transform:rotate(${ang(arr[restM])}deg);animation:${cls} ${nm}s ease-in-out infinite}` + kf(cls, nm, keys) +
          win(cls + 'p', hits, nm, arr[restM] > 0 && arr[restM] >= 0.85 * cmax, 0.08);
        return `<rect x="${x0}" y="204" width="142" height="66" rx="7" fill="url(#mxvu)" stroke="${dark ? '#000' : '#8a9099'}"/>
          <path d="${ticks}" stroke="#2a2a2a" stroke-width="1.1"/>
          <path d="M${r(px + Math.sin(a0) * 46)} ${r(py - Math.cos(a0) * 46)}A46 46 0 0 1 ${r(px + Math.sin(a1) * 46)} ${r(py - Math.cos(a1) * 46)}" fill="none" stroke="#d1242f" stroke-width="2.4"/>
          <text class="mono" x="${x0 + 10}" y="262" font-size="9" font-weight="700" fill="#3a3a3a">${lab}</text><text class="mono" x="${px}" y="248" font-size="8" text-anchor="middle" fill="#3a3a3a">VU</text>
          <text class="mono" x="${x0 + 121}" y="217" font-size="6.5" letter-spacing=".6" text-anchor="end" fill="#5a5a5a">PEAK</text>
          <circle cx="${x0 + 129}" cy="214.5" r="3.4" fill="#4a1414"/><circle class="${cls}p" cx="${x0 + 129}" cy="214.5" r="3.4" fill="#ff3b30" filter="url(#mxgo)"/>
          <g class="${cls}"><g class="mxj" style="animation-duration:${lab === 'L' ? 0.37 : 0.43}s"><line x1="${px}" y1="${py}" x2="${px}" y2="${py - 50}" stroke="#c92a2a" stroke-width="1.5" stroke-linecap="round"/></g></g>
          <rect x="${x0 + 4}" y="262" width="134" height="6" rx="2" fill="#1c1c1c" opacity=".85"/><circle cx="${px}" cy="${py}" r="4.5" fill="#1c1c1c"/>`;
      };
      body += meter(452, 'L', 'mxnl', mw) + meter(606, 'R', 'mxnr', mp);
      css += `.mxj{transform-box:fill-box;transform-origin:50% 100%;animation:mxj .4s ease-in-out infinite alternate}@keyframes mxj{from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}}`;

      // ---- Brushed metal knobs. BALANCE leans toward the busier account, OUTPUT shows the share of active days.
      const knobs = [[506, 'BALANCE', -(tw - tp) / tall * 135], [600, 'REC LEVEL', 30], [694, 'OUTPUT', -135 + 270 * st.active / st.n]];
      body += knobs.map(([x, lab, a]) => `<use href="#mxkt" x="${x}" y="300"/><use href="#mxkb" x="${x}" y="300"/>
        <g transform="translate(${x} 300)"><g class="mxk" style="transform:rotate(${r(a)}deg)"><circle r="12" fill="none"/><line y1="-4" y2="-10" stroke="#1f2328" stroke-width="2" stroke-linecap="round"/></g></g>
        <text class="mono" x="${x}" y="331" font-size="7.5" letter-spacing="1.2" text-anchor="middle" fill="${ink}">${lab}</text>`).join('');
      css += `.mxk{transform-box:fill-box;transform-origin:center;animation:mxk 1.6s cubic-bezier(.3,1.2,.5,1) .7s both}@keyframes mxk{from{transform:rotate(-135deg)}}`;

      // ---- 53-week LED spectrum: a patterned LED stack, stepped shutters and a power-on sweep.
      const cols = Math.ceil((st.startDow + st.n) / 7), wk = new Array(cols).fill(0);
      c.s.forEach((v, i) => { wk[Math.floor((st.startDow + i) / 7)] += v; });
      const lv = R.norm(wk).map(x => Math.max(1, Math.round(x * 6)));
      const X0 = 64, LW = 1072, pitch = LW / cols, segP = 11, top = 357, bottom = top + 6 * segP;
      const rc = k => (k >= 5 ? T.hot : k >= 4 ? T.warm : T.a3);
      let pat = '';
      for (let k = 0; k < 6; k++) pat += `<rect x="0" y="${bottom - top - (k + 1) * segP + 2}" width="${r(pitch - 3)}" height="7" rx="1.5" fill="${rc(k)}"/>`;
      let sh = '';
      for (let ci = 0; ci < cols; ci++) sh += `<rect class="mxb${ci % 3}" x="${r(X0 + ci * pitch - 1)}" y="${bottom - lv[ci] * segP - 80}" width="${r(pitch + 1)}" height="80" style="animation-duration:${r(0.8 + ((ci * 37) % 9) / 10)}s"/>`;
      const pw = wk.indexOf(Math.max(...wk)), pwDate = R.dates[Math.max(0, pw * 7 - st.startDow)];
      body += `<text class="mono" x="56" y="344" font-size="9" letter-spacing="1.6" fill="${ink}">SPECTRUM · ${cols} WEEKS</text>
        <text class="mono" x="1144" y="344" font-size="9" letter-spacing="1.4" text-anchor="end" fill="${ink}">PEAK WEEK OF ${R.fmtDate(pwDate).toUpperCase()} · ${R.n(wk[pw])}</text>
        <rect x="56" y="350" width="1088" height="80" rx="6" fill="${glass}" stroke="${dark ? '#000' : '#8a9099'}"/>
        <g clip-path="url(#mxsc)"><rect x="${X0}" y="${top}" width="${LW}" height="${bottom - top}" fill="url(#mxled)"/><g fill="${glass}">${sh}</g>
        <rect x="${X0}" y="${top}" width="${LW}" height="${bottom - top}" fill="url(#mxled)" opacity=".1"/>
        <rect class="mxsw" x="58" y="352" width="1084" height="76" fill="${glass}"/></g>`;
      css += `.mxb0,.mxb1,.mxb2{animation:mxb0 1s steps(1) infinite alternate}.mxb1{animation-name:mxb1}.mxb2{animation-name:mxb2}
        @keyframes mxb0{0%{transform:translateY(0)}35%{transform:translateY(${segP}px)}70%{transform:translateY(0)}}
        @keyframes mxb1{0%{transform:translateY(${segP}px)}50%{transform:translateY(0)}80%{transform:translateY(-${segP}px)}}
        @keyframes mxb2{0%{transform:translateY(0)}40%{transform:translateY(-${segP}px)}75%{transform:translateY(${segP}px)}}
        .mxsw{transform-box:view-box;transform-origin:0 352px;transform:scaleY(0);animation:mxsw .9s cubic-bezier(.5,0,.3,1) .9s both}@keyframes mxsw{from{transform:scaleY(1)}to{transform:scaleY(0)}}`;

      // ---- Defs
      defs += `<linearGradient id="mxwd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a2814"/><stop offset=".35" stop-color="#7b4a26"/><stop offset=".6" stop-color="#8d5a30"/><stop offset="1" stop-color="#5a3218"/></linearGradient>
        <g id="mxgr">${grain}</g>
        <pattern id="mxbr" width="240" height="5" patternUnits="userSpaceOnUse"><rect width="240" height=".6" fill="#fff" opacity="${dark ? 0.035 : 0.35}"/><rect x="30" y="1.7" width="160" height=".5" fill="#000" opacity="${dark ? 0.25 : 0.05}"/><rect x="80" y="3.2" width="160" height=".6" fill="#fff" opacity="${dark ? 0.03 : 0.3}"/><rect y="4.3" width="90" height=".5" fill="#000" opacity="${dark ? 0.2 : 0.045}"/></pattern>
        <linearGradient id="mxsn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.06 : 0.35}"/><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.25 : 0.1}"/></linearGradient>
        <linearGradient id="mxsl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d323b"/><stop offset="1" stop-color="#191c22"/></linearGradient>
        <radialGradient id="mxvu" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="${dark ? '#fff4cf' : '#fcf9f0'}"/><stop offset="1" stop-color="${dark ? '#e3cd8f' : '#e8e0c9'}"/></radialGradient>
        <radialGradient id="mxkf" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#c9ced6"/><stop offset="1" stop-color="#7e858f"/></radialGradient>
        <g id="mxkb"><circle r="15.5" cy="1.5" fill="#000" opacity=".4"/><circle r="14.5" fill="#2a2f37"/><circle r="13.6" fill="none" stroke="#8b919b" stroke-width="2" stroke-dasharray="1 1.4"/><circle r="11.2" fill="url(#mxkf)"/><g fill="none" stroke-width=".5"><g stroke="#fff" stroke-opacity=".3"><circle r="2.5"/><circle r="4.6"/><circle r="6.7"/><circle r="8.8"/><circle r="10.4"/></g><g stroke="#000" stroke-opacity=".09"><circle r="3.5"/><circle r="5.6"/><circle r="7.7"/><circle r="9.6"/></g></g><ellipse cx="-3.5" cy="-4.5" rx="4" ry="2.2" fill="#fff" opacity=".5" transform="rotate(-35 -3.5 -4.5)"/></g>
        <g id="mxkt" stroke="${ink}" stroke-width="1.2">${[-135, -90, -45, 0, 45, 90, 135].map(a => { const t = a * Math.PI / 180; return `<line x1="${r(Math.sin(t) * 17.5)}" y1="${r(-Math.cos(t) * 17.5)}" x2="${r(Math.sin(t) * 20)}" y2="${r(-Math.cos(t) * 20)}"/>`; }).join('')}</g>
        <pattern id="mxled" x="${X0}" y="${top}" width="${r(pitch * 1000) / 1000}" height="${bottom - top}" patternUnits="userSpaceOnUse">${pat}</pattern>
        <pattern id="mxmh" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="#000" opacity=".28"/><rect width="1" height="3" fill="#000" opacity=".18"/></pattern>
        <linearGradient id="mxgl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".07"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <clipPath id="mxdc"><rect x="3" y="71" width="374" height="200" rx="10"/></clipPath>
        <clipPath id="mxwc"><rect x="100" y="64" width="112" height="58" rx="6"/></clipPath>
        <clipPath id="mxoc"><rect width="19" height="24" rx="3"/></clipPath>
        <clipPath id="mxmc"><rect x="458" y="73" width="284" height="20"/></clipPath>
        <clipPath id="mxvc"><rect x="458" y="157" width="284" height="36"/></clipPath>
        <clipPath id="mxsc"><rect x="56" y="350" width="1088" height="80" rx="6"/></clipPath>
        <filter id="mxvg" filterUnits="userSpaceOnUse" x="448" y="64" width="304" height="136"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="mxgo" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

      const desc = (ev ? String(ev.greet(vt)) + '. ' : '') + `GitHub contributions over the last 365 days as a dual cassette deck: ${R.n(tw)} on the work account @behbod-babai (deck A) and ${R.n(tp)} on the personal account @behi22 (deck B), ${R.n(st.total)} in total. Each tape label lists the months with the busiest one marked.`;
      return R.svg({ w: 1200, h: H, title: 'Behbod Babai contributions', desc, style: css, defs, body, still, noBand: true });
    },
  });
})();
