(function () {
  const R = window.HL, r = R.r;
  const DAY = 864e5;
  const D = (y, m, d) => Date.UTC(y, m - 1, d);
  window.FINAL2 = window.FINAL2 || [];

  // ---------- Vancouver clock, sun, moon and season (all computed, nothing to maintain)
  R.vanTime = function (date) {
    const parts = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Vancouver', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short' })
      .formatToParts(date).forEach(p => { parts[p.type] = p.value; });
    const h = +parts.hour % 24;
    return { y: +parts.year, m: +parts.month, d: +parts.day, h, min: +parts.minute, tz: parts.timeZoneName, iso: `${parts.year}-${parts.month}-${parts.day}`,
      label: `${((h + 11) % 12) + 1}:${parts.minute} ${h < 12 ? 'AM' : 'PM'}` };
  };
  // Solar elevation for Vancouver (NOAA approximation, within about a degree).
  R.sunElev = function (date) {
    const lat = 49.2827 * Math.PI / 180, lon = -123.1207;
    const jd = date.getTime() / DAY + 2440587.5, n = jd - 2451545.0;
    const L = (280.46 + 0.9856474 * n) % 360, g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
    const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * Math.PI / 180, eps = (23.439 - 0.0000004 * n) * Math.PI / 180;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
    const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
    const ha = ((gmst * 15 + lon) * Math.PI / 180) - ra;
    return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)) * 180 / Math.PI;
  };
  // night, dawn, morning, day, golden, dusk from the sun's height and whether it is rising.
  R.skyPhase = function (date) {
    const e = R.sunElev(date), rising = R.sunElev(new Date(date.getTime() + 15 * 60000)) > e;
    if (e < -10) return { phase: 'night', elev: e, rising };
    if (e < 0) return { phase: rising ? 'dawn' : 'dusk', elev: e, rising };
    if (e < 8) return { phase: rising ? 'morning' : 'golden', elev: e, rising };
    return { phase: 'day', elev: e, rising };
  };
  // Moon phase from a known new moon: 0 new, 0.5 full.
  R.moonPhase = function (date) {
    const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14);
    const p = (((date.getTime() - ref) / DAY) % syn + syn) % syn / syn;
    return { phase: p, illum: (1 - Math.cos(2 * Math.PI * p)) / 2, waxing: p < 0.5 };
  };
  R.season = function (date) {
    const v = R.vanTime(date), md = v.m * 100 + v.d;
    if (md >= 1221 || md < 320) return 'winter';
    if (md < 621) return 'spring';
    if (md < 923) return 'summer';
    return 'autumn';
  };

  // ---------- The 21 date themes he kept. Lower priority number wins when two overlap.
  function nowruz(y) {
    const Y = (y - 2000) / 1000;
    const jde = 2451623.80984 + 365242.37404 * Y + 0.05169 * Y * Y - 0.00411 * Y ** 3 - 0.00057 * Y ** 4;
    const t = new Date((jde - 2440587.5) * DAY + 3.5 * 3600000);
    const day = D(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
    return t.getUTCHours() >= 12 ? day + DAY : day;
  }
  const nthWeekday = (y, m, dow, nth) => { let t = D(y, m, 1); while (new Date(t).getUTCDay() !== dow) t += DAY; return t + (nth - 1) * 7 * DAY; };
  const suri = y => { const n = nowruz(y); let t = n - DAY; while (new Date(t).getUTCDay() !== 3) t -= DAY; return t - DAY; };
  const prideSunday = y => nthWeekday(y, 8, 1, 1) - DAY;
  // Lunar New Year: the official dates; the runtime's Chinese calendar is a day off in close years (2027, 2030), so it is only used past the table.
  const LUNAR = { 2026: [2, 17], 2027: [2, 6], 2028: [1, 26], 2029: [2, 13], 2030: [2, 3], 2031: [1, 23], 2032: [2, 11], 2033: [1, 31], 2034: [2, 19], 2035: [2, 8],
    2036: [1, 28], 2037: [2, 15], 2038: [2, 4], 2039: [1, 24], 2040: [2, 12], 2041: [2, 1], 2042: [1, 22], 2043: [2, 10], 2044: [1, 30], 2045: [2, 17], 2046: [2, 6], 2047: [1, 26], 2048: [2, 14], 2049: [2, 2], 2050: [1, 23] };
  const lunarNY = (() => {
    let fmt = null;
    try {
      fmt = new Intl.DateTimeFormat('en-US-u-ca-chinese', { timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric' });
      if (fmt.resolvedOptions().calendar !== 'chinese') fmt = null;
    } catch (e) { fmt = null; }
    const memo = {};
    return y => {
      if (y in memo) return memo[y];
      let out = LUNAR[y] ? D(y, LUNAR[y][0], LUNAR[y][1]) : null;
      if (out == null && fmt) {
        for (let t = D(y, 1, 19); t <= D(y, 2, 22); t += DAY) {
          const p = {};
          fmt.formatToParts(new Date(t + 6 * 3600000)).forEach(x => { p[x.type] = x.value; });
          if (p.month === '1' && p.day === '1') { out = t; break; }
        }
      }
      return (memo[y] = out);
    };
  })();
  R.lunarNY = lunarNY;
  R.nowruzDay = y => nowruz(y);
  const P = (a1, a2, a3, hot) => ({ a1, a2, a3, hot });
  R.EVENTS2 = [
    { id: 'birthday', name: 'Your birthday', pr: 0, icon: 'cake', span: y => [D(y, 3, 5), D(y, 3, 5)], greet: () => 'IT\'S MY BIRTHDAY', fa: 'تولدم مبارک', dark: P('#ffd43b', '#b197fc', '#63e6be', '#ff6b6b'), light: P('#c77700', '#6741d9', '#0b8a6f', '#d6336c') },
    { id: 'newyear', name: 'New Year', pr: 1, icon: 'firework', span: y => [D(y, 12, 31), D(y + 1, 1, 2)], greet: d => 'HAPPY NEW YEAR ' + (d.m === 12 ? d.y + 1 : d.y), dark: P('#f5d06f', '#e9a8ff', '#9be7ff', '#ffd43b'), light: P('#a16207', '#86198f', '#0e7490', '#b45309') },
    { id: 'valentines', name: 'Valentine\'s Day', pr: 1, icon: 'heart', span: y => [D(y, 2, 14), D(y, 2, 14)], greet: () => 'HAPPY VALENTINE\'S DAY', dark: P('#ff8fab', '#f783ac', '#ffc9c9', '#ff6b81'), light: P('#c2255c', '#e03131', '#e64980', '#c2255c') },
    { id: 'realmadrid', name: 'Real Madrid\'s birthday', pr: 1, icon: 'ball', span: y => [D(y, 3, 6), D(y, 3, 6)], greet: d => `HALA MADRID · ${d.y - 1902} YEARS`, dark: P('#ffffff', '#f2c14e', '#b197fc', '#f2c14e'), light: P('#3b2f8f', '#b07800', '#5f3dc4', '#b07800') },
    { id: 'pi', name: 'Pi Day', pr: 3, icon: 'pi', span: y => [D(y, 3, 14), D(y, 3, 14)], greet: () => 'HAPPY π DAY', dark: P('#63e6be', '#748ffc', '#ffd43b', '#63e6be'), light: P('#087f5b', '#3b5bdb', '#a16207', '#087f5b') },
    { id: 'suri', name: 'Chaharshanbe Suri', pr: 1, eve: 17, icon: 'fire', span: y => [suri(y), suri(y)], greet: () => 'CHAHARSHANBE SURI', fa: 'چهارشنبه‌سوری', dark: P('#ff922b', '#ffd43b', '#ff6b6b', '#ff922b'), light: P('#d9480f', '#e67700', '#c92a2a', '#d9480f') },
    { id: 'sizdah', name: 'Sizdah Bedar', pr: 1, icon: 'sabzeh', span: y => [nowruz(y) + 12 * DAY, nowruz(y) + 12 * DAY], greet: () => 'SIZDAH BEDAR', fa: 'سیزده‌به‌در', dark: P('#8ce99a', '#74c0fc', '#ffe066', '#8ce99a'), light: P('#2f9e44', '#1971c2', '#a16207', '#2f9e44') },
    { id: 'nowruz', name: 'Nowruz', pr: 2, icon: 'goldfish', span: y => [nowruz(y), nowruz(y) + 11 * DAY], greet: () => 'HAPPY NOWRUZ', fa: 'نوروز مبارک', dark: P('#7bd88f', '#ff8fb1', '#ffd166', '#ff8fb1'), light: P('#15803d', '#be185d', '#a16207', '#be185d') },
    { id: 'lunar', name: 'Lunar New Year', pr: 2, icon: 'lantern', span: y => { const t = lunarNY(y); return t == null ? null : [t, t + 2 * DAY]; }, greet: () => 'HAPPY LUNAR NEW YEAR', dark: P('#ff4d4d', '#ffd43b', '#ff8787', '#ff4d4d'), light: P('#c92a2a', '#e67700', '#c92a2a', '#c92a2a') },
    { id: 'earth', name: 'Earth Day', pr: 1, icon: 'leaf', span: y => [D(y, 4, 22), D(y, 4, 22)], greet: () => 'HAPPY EARTH DAY', dark: P('#8ce99a', '#74c0fc', '#c0eb75', '#8ce99a'), light: P('#2f9e44', '#1971c2', '#5c940d', '#2f9e44') },
    { id: 'blossom', name: 'Cherry blossom season', pr: 5, icon: 'blossom', span: y => [D(y, 4, 1), D(y, 4, 21)], greet: () => 'CHERRY BLOSSOM SEASON', dark: P('#ffafcc', '#cdb4db', '#a2d2ff', '#ff8fab'), light: P('#c2255c', '#7048e8', '#1971c2', '#c2255c') },
    { id: 'canada', name: 'Canada Day', pr: 1, icon: 'maple', span: y => [D(y, 7, 1), D(y, 7, 1)], greet: () => 'HAPPY CANADA DAY', dark: P('#ff4d4d', '#ffffff', '#ffb3b3', '#ff4d4d'), light: P('#d52b1e', '#7f1d1d', '#d52b1e', '#d52b1e') },
    { id: 'lights', name: 'Celebration of Light', pr: 3, icon: 'firework', span: y => [D(y, 7, 25), D(y, 8, 1)], greet: () => 'CELEBRATION OF LIGHT', dark: P('#ffd43b', '#74c0fc', '#ff8fab', '#ffd43b'), light: P('#c77700', '#1971c2', '#c2255c', '#c77700') },
    { id: 'pride', name: 'Vancouver Pride', pr: 2, icon: 'rainbow', span: y => [prideSunday(y) - DAY, prideSunday(y)], greet: () => 'HAPPY PRIDE', dark: P('#ff8787', '#74c0fc', '#ffe066', '#b197fc'), light: P('#e03131', '#1971c2', '#e67700', '#7048e8') },
    { id: 'programmers', name: 'Programmers\' Day', pr: 1, icon: 'binary', span: y => { const t = D(y, 1, 1) + 255 * DAY; return [t, t]; }, greet: () => 'HAPPY PROGRAMMERS\' DAY · DAY 256', dark: P('#69db7c', '#38d9a9', '#c0eb75', '#69db7c'), light: P('#2b8a3e', '#087f5b', '#5c940d', '#2b8a3e') },
    { id: 'thanksgiving', name: 'Thanksgiving', pr: 2, icon: 'autumn', span: y => { const m = nthWeekday(y, 10, 1, 2); return [m - 2 * DAY, m]; }, greet: () => 'HAPPY THANKSGIVING', dark: P('#ffa94d', '#e8590c', '#ffd43b', '#ff922b'), light: P('#d9480f', '#a61e4d', '#c77700', '#d9480f') },
    { id: 'halloween', name: 'Halloween', pr: 2, icon: 'pumpkin', span: y => [D(y, 10, 25), D(y, 10, 31)], greet: () => 'HAPPY HALLOWEEN', dark: P('#ffb300', '#ff6d00', '#b197fc', '#ff3d00'), light: P('#c2410c', '#7c2d12', '#6741d9', '#b91c1c') },
    { id: 'remembrance', name: 'Remembrance Day', pr: 1, icon: 'poppy', span: y => [D(y, 11, 11), D(y, 11, 11)], greet: () => 'LEST WE FORGET', dark: P('#e03131', '#adb5bd', '#ced4da', '#e03131'), light: P('#c92a2a', '#495057', '#868e96', '#c92a2a') },
    { id: 'winter', name: 'Winter', pr: 5, icon: 'snowflake', span: y => [D(y, 12, 1), D(y, 12, 19)], greet: () => 'FIRST SNOW', dark: P('#a5d8ff', '#e7f5ff', '#91a7ff', '#a5d8ff'), light: P('#1c7ed6', '#364fc7', '#4263eb', '#1c7ed6') },
    { id: 'yalda', name: 'Yalda Night', pr: 1, icon: 'pomegranate', span: y => [D(y, 12, 20), D(y, 12, 21)], greet: () => 'HAPPY YALDA · THE LONGEST NIGHT', fa: 'یلدا مبارک', dark: P('#ff4d6d', '#ff99ac', '#ffd6a5', '#ff4d6d'), light: P('#be123c', '#9f1239', '#b45309', '#be123c') },
    { id: 'christmas', name: 'Christmas and the holidays', pr: 2, icon: 'tree', span: y => [D(y, 12, 22), D(y, 12, 30)], greet: () => 'HAPPY HOLIDAYS', dark: P('#ff6b6b', '#8ce99a', '#ffd43b', '#ff6b6b'), light: P('#c92a2a', '#2b8a3e', '#c77700', '#c92a2a') },
  ];
  // An evening theme (eve) only outranks a clashing theme from that hour on; alone, it still shows all day.
  const rank = (e, v) => (e.eve && v.h < e.eve ? e.pr + 10 : e.pr);
  R.event2At = function (date) {
    const v = R.vanTime(date), t = D(v.y, v.m, v.d);
    let best = null;
    R.EVENTS2.forEach(e => [v.y, v.y - 1].forEach(yy => { const s = e.span(yy); if (s && t >= s[0] && t <= s[1] && (!best || rank(e, v) < rank(best, v))) best = e; }));
    return best;
  };
  // The next day this theme is actually the one showing, so an overlap with a higher-priority theme is skipped.
  R.event2Next = function (e, date) {
    const v = R.vanTime(date), t = D(v.y, v.m, v.d);
    for (const yy of [v.y, v.y + 1]) {
      const s = e.span(yy);
      if (!s || s[1] < t) continue;
      for (let d = Math.max(s[0], t); d <= s[1]; d += DAY) for (const h of [20, 28]) { const at = new Date(d + h * 3600000); if (R.event2At(at) === e) return at; }
    }
    return null;
  };
  R.event2Day = function (e, date) {
    const v = R.vanTime(date), t = D(v.y, v.m, v.d);
    for (const yy of [v.y, v.y - 1]) { const s = e.span(yy); if (s && t >= s[0] && t <= s[1]) return [Math.round((t - s[0]) / DAY) + 1, Math.round((s[1] - s[0]) / DAY) + 1]; }
    return [1, 1];
  };
  R.event2Palette = (e, T) => (e ? Object.assign({}, T, T.mode === 'dark' ? e.dark : e.light) : T);

  // ---------- Small holiday icons, drawn on a 24-unit box centred at (x, y), scale s (1 = 24 px).
  R.icon = function (id, x, y, s, T) {
    const g = inner => `<g transform="translate(${r(x)} ${r(y)}) scale(${s})">${inner}</g>`;
    const ink = T.mode === 'dark' ? '#e9ecf4' : '#1f2328';
    switch (id) {
      case 'pumpkin': return g(`<path d="M0-6c6-2 11 2 11 7s-5 9-11 9-11-4-11-9 5-9 11-7z" fill="#f08c00"/><path d="M0-6c-2 3-2 13 0 16M0-6c2 3 2 13 0 16" stroke="#c76b00" stroke-width="1.2" fill="none"/><path d="M0-6c0-3 1-5 3-6" stroke="#2b8a3e" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M-6 0l2-2 2 2zM2 0l2-2 2 2zM-5 4h10l-2 2-2-1-2 1-2-1z" fill="#2b1a00"/>`);
      case 'firework': { let o = ''; for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; o += `<line x1="${r(Math.cos(a) * 3)}" y1="${r(Math.sin(a) * 3)}" x2="${r(Math.cos(a) * 10)}" y2="${r(Math.sin(a) * 10)}"/>`; } return g(`<g stroke="${T.a1}" stroke-width="1.6" stroke-linecap="round">${o}</g><circle r="2" fill="${T.a2}"/>`); }
      case 'heart': return g(`<path d="M0 9c-7-5-11-8-11-13 0-3 2-6 6-6 2 0 4 1 5 4 1-3 3-4 5-4 4 0 6 3 6 6 0 5-4 8-11 13z" fill="#e64980"/>`);
      case 'cake': return g(`<rect x="-10" y="-1" width="20" height="10" rx="2" fill="#f783ac"/><rect x="-10" y="-1" width="20" height="3" fill="#fff" opacity=".8"/><rect x="-1" y="-8" width="2" height="7" fill="#ffd43b"/><path d="M0-12c2 2 1 4 0 4s-2-2 0-4z" fill="#ff922b"/>`);
      case 'ball': return g(`<circle r="10" fill="#fff" stroke="${ink}" stroke-width="1.2"/><path d="M0-4l4 3-1.5 4.6h-5L-4-1z" fill="${ink}"/><path d="M0-4V-9M4-1l5-2M2.5 3.6l3 4M-2.5 3.6l-3 4M-4-1l-5-2" stroke="${ink}" stroke-width="1"/>`);
      case 'pi': return g(`<text y="7" font-size="22" text-anchor="middle" font-family="Georgia,serif" fill="${T.a1}">π</text>`);
      case 'fire': return g(`<path d="M0 10c-6 0-9-4-8-9 1-4 4-6 4-10 3 2 5 5 4 9 1-1 2-3 2-5 3 3 5 7 4 10-1 3-3 5-6 5z" fill="#ff922b"/><path d="M0 10c-3 0-4-2-3-5 1-2 2-3 2-5 2 2 4 4 3 7 0 2-1 3-2 3z" fill="#ffd43b"/>`);
      case 'sabzeh': { let o = ''; for (let i = -4; i <= 4; i++) o += `<path d="M${i * 1.6} 4q${i % 2 ? -2 : 2} -6 ${i * 0.6} ${-10 - Math.abs(i % 3) * 2}" stroke="#40c057" stroke-width="1.4" fill="none" stroke-linecap="round"/>`; return g(`${o}<path d="M-9 4h18l-2 6h-14z" fill="#e8590c"/><rect x="-9" y="2" width="18" height="2" fill="#ff6b6b"/>`); }
      case 'goldfish': return g(`<path d="M-6 -8Q-12 -6 -11.5 1Q-11 10 0 10.5Q11 10 11.5 1Q12 -6 6 -8Z" fill="#a5d8ff" fill-opacity=".28" stroke="#74c0fc" stroke-width=".8"/><path d="M-10.9 -3H10.9Q11.6 1 11 4Q9 10 0 10.3Q-9 10 -11 4Q-11.6 1 -10.9 -3Z" fill="#4dabf7" opacity=".35"/><ellipse cy="-8" rx="6.2" ry="1.2" fill="none" stroke="#74c0fc" stroke-width=".8"/><circle cx="-4" cy="8.6" r="1.2" fill="#e9ecef"/><circle cx="3" cy="9" r="1" fill="#ced4da"/><g transform="translate(1 2.6) scale(.62)"><path d="M-6 0c3-5 9-5 11 0-2 5-8 5-11 0zm-1 0l-5-4v8z" fill="#ff922b"/><circle cx="3" cy="-1" r="1.2" fill="#1f2328"/></g><circle cx="5.4" cy="-1.4" r=".9" fill="none" stroke="#ffffff" stroke-width=".5" opacity=".8"/>`);
      case 'lantern': return g(`<line y1="-12" y2="-8" stroke="#ffd43b"/><rect x="-7" y="-8" width="14" height="16" rx="6" fill="#e03131"/><rect x="-4" y="-9" width="8" height="2.5" fill="#ffd43b"/><rect x="-4" y="7" width="8" height="2.5" fill="#ffd43b"/><line y1="10" y2="13" stroke="#ffd43b"/>`);
      case 'leaf': return g(`<path d="M-8 8c0-10 6-16 16-16 0 10-6 16-16 16z" fill="#40c057"/><path d="M-8 8L6-6" stroke="#2b8a3e" stroke-width="1.2"/>`);
      case 'blossom': { let o = ''; for (let i = 0; i < 5; i++) { const a = i * 72 * Math.PI / 180; o += `<ellipse cx="${r(Math.cos(a) * 5)}" cy="${r(Math.sin(a) * 5)}" rx="5" ry="3.6" transform="rotate(${i * 72} ${r(Math.cos(a) * 5)} ${r(Math.sin(a) * 5)})" fill="#ffafcc"/>`; } return g(`${o}<circle r="2.4" fill="#ffd43b"/>`); }
      case 'maple': return g(`<path d="M0-11l2 5 5-2-2 6 5 1-6 4 1 5-5-2-1 6-1-6-5 2 1-5-6-4 5-1-2-6 5 2z" fill="#e03131"/>`);
      case 'rainbow': return g(['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'].map((c, i) => `<path d="M${-11 + i * 1.6} 6a${11 - i * 1.6} ${11 - i * 1.6} 0 0 1 ${22 - i * 3.2} 0" stroke="${c}" stroke-width="1.6" fill="none"/>`).join(''));
      case 'binary': return g(`<text y="2" font-size="8" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" fill="${T.a1}">1011</text><text y="10" font-size="8" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" fill="${T.a2}">0110</text>`);
      case 'autumn': return g(`<path d="M0-11c3 3 9 2 9 2s-1 6 2 8c-3 1-5 5-5 5s-3-2-6-1c-3-1-6 1-6 1s-2-4-5-5c3-2 2-8 2-8s6 1 9-2z" fill="#e8590c"/><path d="M0-8v18" stroke="#a61e4d" stroke-width="1.2"/>`);
      case 'poppy': return g(`<circle cx="-4" cy="-3" r="5" fill="#e03131"/><circle cx="4" cy="-3" r="5" fill="#e03131"/><circle cx="-3" cy="3" r="5" fill="#c92a2a"/><circle cx="3" cy="3" r="5" fill="#c92a2a"/><circle r="2.6" fill="#1f2328"/>`);
      case 'pomegranate': return g(`<circle cy="2" r="9" fill="#c92a2a"/><path d="M-3-6l1-4 2 2 2-2 1 4z" fill="#a61e4d"/><circle cx="-3" cy="3" r="1.4" fill="#ffc9c9"/><circle cx="2" cy="0" r="1.4" fill="#ffc9c9"/><circle cx="3" cy="5" r="1.4" fill="#ffc9c9"/>`);
      case 'snowflake': return g(`<g stroke="${T.mode === 'dark' ? '#e7f5ff' : '#1c7ed6'}" stroke-width="1.6" stroke-linecap="round">${[0, 60, 120].map(a => `<g transform="rotate(${a})"><line x1="-10" x2="10"/><path d="M6-3l3 3-3 3M-6-3l-3 3 3 3" fill="none"/></g>`).join('')}</g>`);
      case 'tree': return g(`<path d="M0-12l7 9h-4l6 8h-6l5 7h-16l5-7h-6l6-8h-4z" fill="#2b8a3e"/><rect x="-2" y="12" width="4" height="3" fill="#a0522d"/><circle cx="-3" cy="2" r="1.4" fill="#ff6b6b"/><circle cx="3" cy="7" r="1.4" fill="#ffd43b"/><circle cx="1" cy="-4" r="1.4" fill="#74c0fc"/><path d="M0-15l1 2h2l-2 1 1 2-2-1-2 1 1-2-2-1h2z" fill="#ffd43b"/>`);
      default: return g(`<rect x="-6" y="-8" width="12" height="16" rx="3" fill="#c92a2a" opacity=".9"/><rect x="-6" y="-8" width="12" height="4" rx="2" fill="#fff" opacity=".35"/><line x1="3" y1="-12" x2="1" y2="-4" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>`);
    }
  };

  // A Beaver-style floatplane, unbranded. Drawn facing left with the float bottoms on y=0; face -1 mirrors it to fly right.
  R.floatplane = function ({ T, id, face = 1, scale = 0.72, beam = false }) {
    const dk = T.mode === 'dark';
    const C = dk
      ? { b0: '#46557a', b1: '#1c2438', f0: '#33405e', f1: '#161d2e', rim: '#9aaccf', win: '#ffd27a', winO: 0.85, panel: '#0b1020', prop: '#c9d6f2' }
      : { b0: '#ffffff', b1: '#cfd8e6', f0: '#eef2f7', f1: '#b9c4d6', rim: '#27314a', win: '#2b3a55', winO: 0.8, panel: '#27314a', prop: '#27314a' };
    const nav = face === 1 ? '#ff4d4d' : '#3ddc84';
    const ln = `stroke="${C.rim}" stroke-width=".45" stroke-opacity=".7"`;
    const floatP = 'M-36 -5.6Q-36.6 -7.2 -34.6 -7.2H21Q26.6 -6.9 29.4 -4.8L26.6 -2.8H3.4L2.2 0H-27Q-33.4 -.2 -36 -5.6Z';
    const svg = `<g transform="scale(${face * scale} ${scale})">
      ${beam ? `<path d="M-17 -29.6L-96 -10L-93 0Z" fill="url(#${id}L)"/>` : ''}
      <path d="${floatP}" transform="translate(5 -2.4)" fill="${C.f1}" ${ln}/>
      <path d="M-14 -9.6L-12.2 -13.4M4 -9.6L5.6 -14.2" stroke="${C.rim}" stroke-width=".8" opacity=".55"/>
      <path d="M22 -24.6C24.5 -30 27 -35.5 30.5 -36.8C33 -37.4 34.6 -36.6 35 -34.4L34.2 -22.8Z" fill="url(#${id}B)" ${ln}/>
      <path d="M27.6 -34.6C29.4 -36.6 32.8 -37.6 34.8 -35.4L34.9 -33.2C32.5 -34.4 29.6 -33.8 27.2 -33Z" fill="${T.a1}"/>
      <path d="M31.8 -36.6L31.2 -22.8" stroke="${C.panel}" stroke-width=".4" opacity=".45"/>
      <path d="M-27 -24.5C-24 -26 -21 -26.6 -18 -27L-12 -29H3C14 -27.5 24 -24.5 34 -22.6L34.6 -20.4C24 -19.4 14 -16.5 4 -14L-16 -13C-22 -13.2 -26 -14 -28 -15.5C-29.6 -17.5 -29.6 -22.5 -27 -24.5Z" fill="url(#${id}B)" ${ln}/>
      <path d="M-27.4 -20.4C-10 -19.8 10 -19.4 34.4 -21.7" fill="none" stroke="${T.a1}" stroke-width="1.6"/>
      <path d="M-26.6 -18.6C-10 -18 8 -17.4 30 -19.4" fill="none" stroke="${T.a2}" stroke-width=".6" opacity=".8"/>
      <path d="M24 -21.6H38.6L37.4 -20.4H25Z" fill="url(#${id}B)" ${ln}/>
      <path d="M-24 -25.6Q-23 -19.5 -24.5 -13.6M-6 -28.7V-14.2M14 -26.6L13.4 -16.8" fill="none" stroke="${C.panel}" stroke-width=".4" opacity=".35"/>
      <ellipse cx="-28" cy="-19.8" rx="2" ry="5" fill="${C.b1}" ${ln}/>
      <path d="M-29.6 -21.6Q-33.2 -19.8 -29.6 -18Z" fill="${C.rim}"/>
      <ellipse class="${id}p" cx="-30.8" cy="-19.8" rx="1.3" ry="10.5" fill="${C.prop}" opacity=".2"/>
      <path d="M-22.4 -14.4l1.8 2.4" stroke="${C.panel}" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>
      <path d="M-17.6 -26.6L-12.6 -28.2V-22.4H-18.8Z" fill="${C.win}" opacity="${C.winO}"/>
      <path d="M-10.4 -27.8h6.2v5.4h-6.2zM-2.6 -27.8h6v5.2h-6zM5.4 -27.2h3.6l-.6 4.4h-3z" fill="${C.win}" opacity="${C.winO}"/>
      ${dk ? '' : `<path d="M-17 -26L-13.6 -27.2M-9.6 -27.2l2.4 0" stroke="#ffffff" stroke-width=".6" opacity=".7"/>`}
      <path d="M-11.2 -21.4v7.6M-3.4 -21.4v7.2" stroke="${C.panel}" stroke-width=".4" opacity=".4"/>
      <path d="M-17 -29.2C-16 -31.6 -10 -32.2 4 -31L5.5 -30.2L4 -29.4H-16Z" fill="url(#${id}B)" ${ln}/>
      <path d="M-16 -29.4H4L3 -28.4H-15Z" fill="${C.b1}" opacity=".9"/>
      <path d="M-11 -13.6L-2 -28.6" stroke="${C.rim}" stroke-width=".9" opacity=".75"/>
      <path d="${floatP}" fill="url(#${id}F)" ${ln}/>
      <path d="M-34 -6.6H21" stroke="#ffffff" stroke-width=".5" opacity="${dk ? 0.15 : 0.7}"/>
      <path d="M-17 -7.2L-14.6 -13.2M1 -7.2L3.4 -14M-17 -7.2L3.4 -14" stroke="${C.rim}" stroke-width=".9" opacity=".85"/>
      <circle cx="-16.6" cy="-30.4" r="2.2" fill="${nav}" opacity=".22"/><circle cx="-16.6" cy="-30.4" r="1" fill="${nav}"/>
      <g class="${id}s"><circle cx="32.6" cy="-37.4" r="3.6" fill="#fff" opacity="${dk ? 0.4 : 0.6}"/><circle cx="32.6" cy="-37.4" r=".9" fill="${dk ? '#ffffff' : C.rim}"/></g>
      <circle cx="-17.4" cy="-29.4" r="${dk ? 4 : 2.6}" fill="#fff6d8" opacity="${dk ? 0.3 : 0.25}"/><circle cx="-17.4" cy="-29.4" r=".9" fill="${dk ? '#fff6d8' : '#f2a33a'}"/></g>`;
    const defs = `<linearGradient id="${id}B" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.b0}"/><stop offset="1" stop-color="${C.b1}"/></linearGradient>
      <linearGradient id="${id}F" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.f0}"/><stop offset="1" stop-color="${C.f1}"/></linearGradient>
      ${beam ? `<linearGradient id="${id}L" gradientUnits="userSpaceOnUse" x1="-17" y1="0" x2="-96" y2="0"><stop offset="0" stop-color="#fff6d8" stop-opacity=".38"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>` : ''}`;
    const css = `.${id}s{animation:${id}s 1.3s linear infinite}@keyframes ${id}s{0%,7%{opacity:1}9%,100%{opacity:0}}
      .${id}p{animation:${id}p .16s linear infinite}@keyframes ${id}p{50%{opacity:.34}}`;
    return { svg, defs, css };
  };
})();
