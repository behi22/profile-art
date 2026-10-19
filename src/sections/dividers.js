(function () {
  const R = window.HL, r = R.r;
  const W = 1200, H = 56, MID = 28, LEN = 190, LOOP = 7;
  const DIVS = [
    ['pipeline', '01', 'SAY MY NAME'],
    ['waterfront', '02', 'VANCOUVER, LIVE'],
    ['readme', '03', 'ABOUT'],
    ['skills', '04', 'SKILLS'],
    ['story', '05', 'DAILY LIFE'],
    ['mixtape', '06', 'CONTRIBUTIONS'],
  ];

  // A centred chapter label with short hairlines either side that fade out, leaving open space toward the edges.
  DIVS.forEach(([key, num, name]) => window.FINAL2.push({
    id: `f-div-${key}`, section: 0, name: `Divider: ${name}`,
    line: `A slim chapter strip before ${name.toLowerCase()}: a numbered capsule and the name, with short hairlines that fade out on both sides.`,
    render(c) {
      const T = c.T, dk = T.mode === 'dark';
      const nw = r(name.length * (0.6 * 12.5 + 3.2) - 3.2), tw = 30 + 12 + nw, x0 = r(600 - tw / 2), A = r(600 + tw / 2 + 18), B = A + LEN, run = B - A - 4;
      const glow = dk ? '#ffffff' : T.a1;
      // The line draws in from the label; a soft light then glides in along it and the node answers when it arrives.
      const defs = `<linearGradient id="dvG" gradientUnits="userSpaceOnUse" x1="${A}" y1="0" x2="${B}" y2="0"><stop offset="0" stop-color="${T.a1}" stop-opacity=".9"/><stop offset=".5" stop-color="${T.a2}" stop-opacity=".45"/><stop offset="1" stop-color="${T.a2}" stop-opacity="0"/></linearGradient>
        <radialGradient id="dvH"><stop offset="0" stop-color="${glow}" stop-opacity=".95"/><stop offset=".45" stop-color="${glow}" stop-opacity=".35"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
        <path id="dvL" d="M${B} ${MID}H${A + 7}" pathLength="1" fill="none"/>
        <g id="dvR"><use href="#dvL" class="dx" stroke="url(#dvG)" stroke-width="1"/>
          <ellipse class="dg" cx="${B}" cy="${MID}" rx="18" ry="2.4" fill="url(#dvH)"/>
          <circle class="dh" cx="${A}" cy="${MID}" r="8" fill="url(#dvH)"/>
          <path class="dm" d="M${A} ${MID - 3.2}l3.2 3.2-3.2 3.2-3.2-3.2z" fill="${T.a1}"/></g>`;
      const ease = 'cubic-bezier(.45,0,.55,1)';
      const style = `
        .dx{stroke-dasharray:1 1;animation:dx 1.4s .2s cubic-bezier(.25,.8,.25,1) both}@keyframes dx{from{stroke-dashoffset:-1}to{stroke-dashoffset:0}}
        .dg{opacity:0;transform-box:view-box;animation:dg ${LOOP}s 1.6s infinite both}
        @keyframes dg{0%{opacity:0;transform:translateX(0);animation-timing-function:${ease}}14%{opacity:1}36%{opacity:1}46%,100%{opacity:0;transform:translateX(-${run}px)}}
        .dh{opacity:0;animation:dh ${LOOP}s 1.6s ease-in-out infinite both}@keyframes dh{0%,38%{opacity:0}49%{opacity:.85}68%,100%{opacity:0}}
        .dm{opacity:.85;transform-box:fill-box;transform-origin:center;animation:dm ${LOOP}s 1.6s ease-in-out infinite both}@keyframes dm{0%,38%{transform:none;opacity:.85}49%{transform:scale(1.3);opacity:1}68%,100%{transform:none;opacity:.85}}
        .dl{animation:dl .9s .1s ease-out both}@keyframes dl{from{opacity:0}}`;
      const body = `<use href="#dvR"/><use href="#dvR" transform="matrix(-1 0 0 1 ${W} 0)"/>
        <g class="dl"><rect x="${x0}" y="${MID - 9}" width="30" height="18" rx="9" fill="${T.a1}" fill-opacity=".1" stroke="${T.a1}" stroke-opacity=".5"/>
          <text class="mono" x="${x0 + 15}" y="${MID + 4}" font-size="11" font-weight="700" text-anchor="middle" fill="${T.a1}">${num}</text>
          <text class="mono" x="${x0 + 42}" y="${MID + 4.4}" font-size="12.5" letter-spacing="3.2" textLength="${nw}" lengthAdjust="spacing" fill="${T.fg}" opacity=".9">${R.esc(name)}</text></g>`;
      return R.svg({ w: W, h: H, title: `${num} · ${name}`, desc: `Section ${num}: ${name.toLowerCase()}.`, style, defs, body, still: c.still, noBand: true });
    },
  }));
})();
