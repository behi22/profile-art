// Draws every image for this hour in both GitHub themes, checks each one, and writes the site GitHub Pages serves.
// Any failed check stops the run, so Pages keeps serving the last good hour.
const fs = require('fs'), path = require('path');
const { load } = require('./load');
const { check } = require('./check');
const { OUT } = require('./pieces');
const { drawHour } = require('./when');
const { renderViews, galleryHtml, GALLERY_CSS } = require('./variants');
const DIST = path.join(__dirname, '..', 'dist');
const read = (f, fallback) => { try { return JSON.parse(fs.readFileSync(path.join(DIST, 'data', f), 'utf8')); } catch (e) { return fallback; } };

const contrib = read('contrib.json', null) || JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'sample-contrib.json'), 'utf8'));
const weather = read('weather.json', { rain: 0 });
const { R, pieces } = load(contrib);

// BC has kept daylight time all year since March 2026; older time zone data would put every winter clock an hour off.
if (R.vanTime(new Date(Date.UTC(2026, 11, 21, 20))).h !== 13) { console.error('Time zone data is too old: it does not know BC stays on UTC-7 all year. Use Node 24 or newer.'); process.exit(1); }

const now = drawHour(process.env.RENDER_AT ? new Date(process.env.RENDER_AT) : new Date());
const s = R.series('both'), st = R.stats(s), ev = R.event2At(now);
fs.mkdirSync(DIST, { recursive: true });
let bad = 0;
for (const [id, name] of OUT) {
  const piece = pieces.find(p => p.id === id);
  if (!piece) { console.error(`missing piece ${id}`); bad++; continue; }
  for (const theme of ['dark', 'light']) {
    const T = R.event2Palette(ev, R.theme(theme));
    let svg;
    try { svg = piece.render({ T, s, st, still: false, source: 'both', label: R.sourceLabel('both'), now, ev, evDay: ev ? R.event2Day(ev, now) : null, weather: { rain: weather.rain } }); } catch (e) { console.error(`${name}-${theme}: ${e.message}`); bad++; continue; }
    const problems = check(id, svg);
    if (problems.length) { console.error(`${name}-${theme}: ${problems.join('; ')}`); bad++; continue; }
    fs.writeFileSync(path.join(DIST, `${name}-${theme}.svg`), svg);
  }
}

const v = R.vanTime(now), sky = R.skyPhase(now);
const status = { drawnFor: now.toISOString(), renderedAt: new Date().toISOString(), vancouver: `${v.iso} ${v.label}`, sky: sky.phase, theme: ev ? ev.name : null, rain: weather.rain, images: OUT.length * 2 - bad };
fs.mkdirSync(path.join(DIST, 'data'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'data', 'status.json'), JSON.stringify(status, null, 2));

// The gallery's extra views. One that fails its checks is left out and logged, and never holds back the live images.
const NAMES = Object.fromEntries(OUT);
const views = renderViews({ R, pieces, names: NAMES, s, st, now, check, dir: path.join(DIST, 'variants') });
views.failed.forEach(f => console.error(`gallery view left out, ${f}`));

// A gallery at the site root: every image as the profile shows it this hour.
const pic = n => `<picture><source media="(prefers-color-scheme: dark)" srcset="${n}-dark.svg"><img src="${n}-light.svg" alt="${n}"></picture>`;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const [, mm, dd] = v.iso.split('-').map(Number);
const SKY = { night: 'Night', dawn: 'Dawn', morning: 'Morning', day: 'Daytime', golden: 'Golden hour', dusk: 'Dusk' };
const chips = [`${v.label} ${v.tz}, ${MON[mm - 1]} ${dd}`, SKY[sky.phase] || sky.phase]
  .concat(weather.rain > 0 ? ['Raining'] : [], ev ? [ev.name] : []);
const WAVE = "M5 16h4l2-6 3 12 3-14 3 16 2-8h5";
const ICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230d1117'/%3E%3Cpath d='${WAVE}' fill='none' stroke='%237c9cff' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E`;
fs.writeFileSync(path.join(DIST, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Profile Art</title><link rel="icon" href="${ICON}">
<style>:root{color-scheme:light dark;--bg:#ffffff;--fg:#1f2328;--mu:#59636e;--line:#d1d9e0;--soft:#f6f8fa;--btn:#f6f8fa;--ac:#0969da;--ok:#1a7f37}@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--mu:#8b949e;--line:#30363d;--soft:#151b23;--btn:#212830;--ac:#4493f8;--ok:#3fb950}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:900px;margin:0 auto;padding:48px 16px 64px}a{color:var(--ac);text-decoration:none}a:hover{text-decoration:underline}
.hd{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px 24px}.brand{flex:1 1 auto;min-width:0}
h1{margin:0;font-size:32px;line-height:1.15;letter-spacing:-.025em;font-weight:700}.sub{margin:6px 0 0;color:var(--mu);text-wrap:balance}
.btn{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 16px 0 14px;border-radius:999px;border:1px solid var(--line);background:var(--btn);color:var(--fg);font-size:14px;font-weight:600;line-height:1;white-space:nowrap;transition:border-color .15s,background-color .15s}
.btn svg{width:16px;height:16px;flex:none}.btn:hover{text-decoration:none;border-color:var(--ac)}
.status{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin:24px 0 28px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--soft);color:var(--mu);font-size:14px}
.live{display:inline-flex;align-items:center;gap:8px;color:var(--fg);font-weight:600}.live i{width:8px;height:8px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 0 var(--ok);animation:pulse 2s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(63,185,80,.55)}70%{box-shadow:0 0 0 7px rgba(63,185,80,0)}100%{box-shadow:0 0 0 0 rgba(63,185,80,0)}}
.status span+span::before{content:"·";margin-right:12px;color:var(--mu);opacity:.6}
.gallery{display:grid;gap:10px}img{display:block;width:100%;height:auto}
@media (max-width:600px){main{padding-top:32px}h1{font-size:26px}}
@media (prefers-reduced-motion:reduce){.live i{animation:none}}
${GALLERY_CSS}</style></head>
<body><main><header class="hd"><div class="brand"><h1>Profile Art</h1><p class="sub">The live images on <a href="https://github.com/behi22">my GitHub profile</a>, redrawn every hour from real data.</p></div><a class="btn" href="https://github.com/behi22/profile-art"><svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>How it's made</a></header>
<div class="status"><span class="live"><i></i>Live</span>${chips.map(c => `<span>${R.esc(c)}</span>`).join('')}</div>
<div class="gallery">${OUT.map(([, n]) => pic(n)).join('\n')}</div>
${galleryHtml(views.shown, R.esc, NAMES)}</main></body></html>`);

console.log(`${status.images} images for ${status.vancouver} (${status.sky}${status.theme ? ', ' + status.theme : ''}${status.rain ? ', rain ' + status.rain : ''}), ${views.shown.length} gallery views`);
if (bad) { console.error(`${bad} images failed their checks; not publishing this hour`); process.exit(1); }
