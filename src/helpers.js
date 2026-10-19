(function () {
  const R = window.HL, r = R.r;
  const hex2rgb = h => [0, 2, 4].map(i => parseInt(h.replace('#', '').slice(i, i + 2), 16));
  R.lerpHex = (a, b, t) => {
    const A = hex2rgb(a), B = hex2rgb(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  R.sourceLabel = src => (src === 'personal' ? '@behi22' : src === 'work' ? '@behbod-babai' : '@behi22 + @behbod-babai');
  // Crossfades between states; `rest` is the state shown when motion is off.
  R.stateCss = (prefix, wins, dur, rest, f = 0.6) => wins.map(([a, b], i) => {
    const open = a <= 0 ? '0%{opacity:1}' : `0%{opacity:0}${r(Math.max(0, a - f))}%{opacity:0}${a}%{opacity:1}`;
    const close = b >= 100 ? '100%{opacity:1}' : `${b}%{opacity:1}${r(Math.min(100, b + f))}%{opacity:0}100%{opacity:0}`;
    return `.${prefix}${i}{opacity:${i === rest ? 1 : 0};animation:${prefix}${i} ${dur}s linear infinite}@keyframes ${prefix}${i}{${open}${close}}`;
  }).join('');
})();
