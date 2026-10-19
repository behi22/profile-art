// Draws every image for this hour in both GitHub themes, checks each one, and writes the site GitHub Pages serves.
// Any failed check stops the run, so Pages keeps serving the last good hour.
const fs = require('fs'), path = require('path');
const { load } = require('./load');
const { check } = require('./check');
const { OUT } = require('./pieces');
const { drawHour } = require('./when');
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

// A plain gallery at the site root, mostly for checking a deploy by eye.
const pic = n => `<picture><source media="(prefers-color-scheme: dark)" srcset="${n}-dark.svg"><img src="${n}-light.svg" alt="${n}"></picture>`;
fs.writeFileSync(path.join(DIST, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>profile-art</title>
<style>:root{color-scheme:light dark;--bg:#ffffff;--fg:#1f2328;--mu:#59636e}@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--mu:#8b949e}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,sans-serif}main{max-width:900px;margin:0 auto;padding:24px 16px;display:grid;gap:10px}img{display:block;width:100%;height:auto}p{color:var(--mu);margin:0 0 8px}</style></head>
<body><main><p>Rendered ${status.vancouver} Vancouver time · ${status.sky}${status.theme ? ' · ' + status.theme : ''}${status.rain ? ' · raining' : ''}. Source: github.com/behi22/profile-art</p>${OUT.map(([, n]) => pic(n)).join('\n')}</main></body></html>`);

console.log(`${status.images} images for ${status.vancouver} (${status.sky}${status.theme ? ', ' + status.theme : ''}${status.rain ? ', rain ' + status.rain : ''})`);
if (bad) { console.error(`${bad} images failed their checks; not publishing this hour`); process.exit(1); }
