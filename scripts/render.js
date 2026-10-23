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

// A gallery at the site root: every image as the profile shows it this hour.
const pic = n => `<picture><source media="(prefers-color-scheme: dark)" srcset="${n}-dark.svg"><img src="${n}-light.svg" alt="${n}"></picture>`;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const [, mm, dd] = v.iso.split('-').map(Number);
const SKY = { night: 'Night', dawn: 'Dawn', morning: 'Morning', day: 'Daytime', golden: 'Golden hour', dusk: 'Dusk' };
const chips = [`${v.label} ${v.tz}, ${MON[mm - 1]} ${dd}`, SKY[sky.phase] || sky.phase]
  .concat(weather.rain > 0 ? ['Raining'] : [], ev ? [ev.name] : []);
const ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230d1117'/%3E%3Cpath d='M5 16h4l2-6 3 12 3-14 3 16 2-8h5' fill='none' stroke='%237c9cff' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
fs.writeFileSync(path.join(DIST, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>profile-art · Behbod Babai</title><link rel="icon" href="${ICON}">
<style>:root{color-scheme:light dark;--bg:#ffffff;--fg:#1f2328;--mu:#59636e;--line:#d1d9e0;--chip:#f6f8fa;--ac:#0969da}@media (prefers-color-scheme:dark){:root{--bg:#0d1117;--fg:#e6edf3;--mu:#8b949e;--line:#30363d;--chip:#161b22;--ac:#4493f8}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif}
main{max-width:900px;margin:0 auto;padding:40px 16px 56px}header{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px 24px;padding-bottom:20px;margin-bottom:24px;border-bottom:1px solid var(--line)}
h1{margin:0;font-size:24px;letter-spacing:-.01em}.sub{margin:4px 0 0;color:var(--mu)}a{color:var(--ac);text-decoration:none}a:hover{text-decoration:underline}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;padding:0;list-style:none}.chips li{padding:2px 10px;border:1px solid var(--line);border-radius:999px;background:var(--chip);color:var(--mu);font-size:13px}
.gallery{display:grid;gap:10px}img{display:block;width:100%;height:auto}</style></head>
<body><main><header><div><h1>profile-art</h1><p class="sub">The live images on <a href="https://github.com/behi22">github.com/behi22</a>, redrawn every hour.</p><ul class="chips">${chips.map(c => `<li>${R.esc(c)}</li>`).join('')}</ul></div><a href="https://github.com/behi22/profile-art">How it's made</a></header>
<div class="gallery">${OUT.map(([, n]) => pic(n)).join('\n')}</div></main></body></html>`);

console.log(`${status.images} images for ${status.vancouver} (${status.sky}${status.theme ? ', ' + status.theme : ''}${status.rain ? ', rain ' + status.rain : ''})`);
if (bad) { console.error(`${bad} images failed their checks; not publishing this hour`); process.exit(1); }
