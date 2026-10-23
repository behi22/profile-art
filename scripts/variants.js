// The gallery's extra views: the waterfront in every sky and weather, and the look of each date theme's day.
const fs = require('fs'), path = require('path');
const SKIES = [['night', 'Night'], ['dawn', 'Dawn'], ['morning', 'Morning'], ['day', 'Daytime'], ['golden', 'Golden hour'], ['dusk', 'Dusk']];
// Only the waterfront follows the clock; the room's window keeps its own sky in light mode.
const SKY_PIECES = ['f-waterfront'];
const THEME_PIECES = ['f-header', 'f-waterfront', 'f-story'];
// Themes that are about the evening (fireworks, fire, lights) are drawn at 9 PM, the rest at 1 PM.
const AFTER_DARK = new Set(['newyear', 'suri', 'lights', 'halloween', 'yalda', 'christmas']);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// A Vancouver wall-clock time as a Date, or null for an hour the clocks skip.
function vanAt(R, y, m, d, h, min = 0) {
  for (const off of [7, 8]) {
    const t = new Date(Date.UTC(y, m - 1, d, h + off, min)), v = R.vanTime(t);
    if (v.y === y && v.m === m && v.d === d && v.h === h && v.min === min) return t;
  }
  return null;
}

// For each sky phase, the whole hour on that Vancouver day nearest the middle of the phase's longest stretch.
// Only whole hours count, because the profile only ever draws whole hours.
function skyHours(R, y, m, d) {
  const start = vanAt(R, y, m, d, 0), runs = [];
  for (let min = 0; min < 1440; min += 10) {
    const t = new Date(start.getTime() + min * 60000), p = R.skyPhase(t).phase, last = runs[runs.length - 1];
    if (last && last.p === p) last.n++; else runs.push({ p, from: t.getTime(), n: 1 });
  }
  const mid = {};
  for (const r of runs) if (!mid[r.p] || r.n > mid[r.p].n) mid[r.p] = { n: r.n, t: r.from + (r.n - 1) * 300000 };
  const out = {};
  for (let h = 0; h < 24; h++) {
    const t = vanAt(R, y, m, d, h);
    if (!t) continue;
    const p = R.skyPhase(t).phase;
    if (!out[p] || Math.abs(t - mid[p].t) < Math.abs(out[p] - mid[p].t)) out[p] = t;
  }
  return out;
}

// Golden hour and morning sometimes fall between two whole hours (about 36 and 30 days a year): use the nearest day that has one.
function skyHour(R, v, p) {
  for (let k = 0; k <= 30; k++) for (const dk of k ? [k, -k] : [0]) {
    const dd = new Date(Date.UTC(v.y, v.m - 1, v.d + dk)), t = skyHours(R, dd.getUTCFullYear(), dd.getUTCMonth() + 1, dd.getUTCDate())[p];
    if (t) return t;
  }
  return null;
}

const day = t => { const d = new Date(t); return [d.getUTCMonth(), d.getUTCDate()]; };
function dateLabel(e, v) {
  const t = Date.UTC(v.y, v.m - 1, v.d);
  for (const yy of [v.y, v.y - 1]) {
    const s = e.span(yy);
    if (!s || t < s[0] || t > s[1]) continue;
    const [m0, d0] = day(s[0]), [m1, d1] = day(s[1]);
    if (s[0] === s[1]) return `${MON[m0]} ${d0}`;
    return m0 === m1 ? `${MON[m0]} ${d0} to ${d1}` : `${MON[m0]} ${d0} to ${MON[m1]} ${d1}`;
  }
  return `${MON[v.m - 1]} ${v.d}`;
}

// Every view the gallery shows for the hour `now`: the six skies around today, rain, snow, then each theme but the birthday on its next day.
function plan(R, now) {
  const v = R.vanTime(now), out = [];
  for (const [p, title] of SKIES) {
    const at = skyHour(R, v, p);
    if (at) out.push({ key: 'sky-' + p, group: 'sky', title, sub: R.vanTime(at).label, at, ev: null, rain: 0, pieces: SKY_PIECES });
  }
  out.push({ key: 'sky-rain', group: 'sky', title: 'Rain', sub: '12:00 PM', at: vanAt(R, v.y, v.m, v.d, 12), ev: null, rain: 1, pieces: SKY_PIECES });
  out.push({ key: 'sky-snow', group: 'sky', title: 'Snow', sub: '12:00 PM', at: vanAt(R, v.m <= 3 ? v.y : v.y + 1, 1, 15, 12), ev: null, rain: 0, pieces: SKY_PIECES });
  const live = R.event2At(now), themes = [];
  for (const e of R.EVENTS2) {
    if (e.id === 'birthday') continue;
    const next = R.event2Next(e, now);
    if (!next) continue;
    const nv = R.vanTime(next);
    const at = [AFTER_DARK.has(e.id) ? 21 : 13, 13, 21].map(h => vanAt(R, nv.y, nv.m, nv.d, h)).find(t => t && R.event2At(t) === e) || next;
    themes.push({ key: 'theme-' + e.id, group: 'theme', title: e.name, sub: dateLabel(e, nv), at, ev: e, rain: 0, pieces: THEME_PIECES, live: live === e, order: nv.m * 100 + nv.d });
  }
  themes.sort((a, b) => a.order - b.order);
  return out.concat(themes);
}

// Draws every view in both GitHub themes into `dir`. A view with any failed image is left out whole, so the gallery never shows half a look.
function drawViews({ R, pieces, names, s, st, now, check, dir }) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const shown = [], failed = [];
  for (const it of plan(R, now)) {
    const files = [];
    try {
      for (const id of it.pieces) for (const theme of ['dark', 'light']) {
        const T = R.event2Palette(it.ev, R.theme(theme));
        const svg = pieces.find(p => p.id === id).render({ T, s, st, still: false, source: 'both', label: R.sourceLabel('both'), now: it.at, ev: it.ev, evDay: it.ev ? R.event2Day(it.ev, it.at) : null, weather: { rain: it.rain } });
        const problems = check(id, svg);
        if (problems.length) throw new Error(`${id}-${theme}: ${problems.join('; ')}`);
        files.push([`${it.key}-${names[id]}-${theme}.svg`, svg]);
      }
    } catch (e) { failed.push(`${it.key}: ${e.message}`); continue; }
    for (const [f, svg] of files) fs.writeFileSync(path.join(dir, f), svg);
    shown.push(it);
  }
  return { shown, failed };
}

// Never throws: the live images are already written when this runs, and nothing here may stop them being published.
function renderViews(args) {
  try { return drawViews(args); } catch (e) { return { shown: [], failed: [`every view: ${e.message}`] }; }
}

const GALLERY_CSS = `.more{margin-top:52px}.more+.more{margin-top:44px}h2{margin:0;font-size:22px;line-height:1.25;letter-spacing:-.015em;font-weight:700}.more>.sub{margin:4px 0 16px}
.vgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.vt{display:block;width:100%;padding:0;border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--soft);color:inherit;font:inherit;text-align:left;cursor:pointer;transition:border-color .15s}
.vt:hover,.vt:focus-visible{border-color:var(--ac);outline:none}
.cap{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:10px 14px;border-top:1px solid var(--line);font-size:14px}.cap b{font-weight:600}.cap span{color:var(--mu);white-space:nowrap}.cap .now{color:var(--ok);font-weight:600}
dialog{width:min(900px,calc(100vw - 32px));max-height:calc(100vh - 32px);padding:0;border:1px solid var(--line);border-radius:14px;background:var(--bg);color:var(--fg);overflow:auto}
dialog::backdrop{background:rgba(1,4,9,.72)}
.dh{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 12px 12px 18px;border-bottom:1px solid var(--line);background:var(--bg)}.dh b{display:block;font-size:16px}.dh span{color:var(--mu);font-size:14px}
.x{display:grid;place-items:center;width:34px;height:34px;padding:0;border:1px solid var(--line);border-radius:999px;background:var(--btn);color:var(--fg);cursor:pointer}.x:hover{border-color:var(--ac)}.x svg{width:16px;height:16px}
@media (max-width:600px){.vgrid{grid-template-columns:1fr}}`;

const pic = (base, alt, lazy) => `<picture><source media="(prefers-color-scheme: dark)" srcset="${base}-dark.svg"><img src="${base}-light.svg" alt="${alt}"${lazy ? ' loading="lazy"' : ''}></picture>`;

// The two gallery sections, the full-size viewer and its script, for the views that rendered.
function galleryHtml(shown, esc, names) {
  const sky = shown.filter(i => i.group === 'sky'), themes = shown.filter(i => i.group === 'theme');
  const tile = i => `<button class="vt" type="button" data-k="${i.key}">${pic(`variants/${i.key}-${names['f-waterfront']}`, esc(`The waterfront: ${i.title}`), true)}<span class="cap"><b>${esc(i.title)}</b>${i.live ? '<span class="now">Today</span>' : `<span>${esc(i.sub)}</span>`}</span></button>`;
  const data = Object.fromEntries(shown.map(i => [i.key, { t: i.title, s: i.live ? 'Today' : i.sub, p: i.pieces.map(id => names[id]) }]));
  const parts = [];
  if (sky.length) parts.push(`<section class="more"><h2>Every sky</h2><p class="sub">The waterfront follows Vancouver's real sky and weather, hour by hour. Here it is from night to dusk, plus rain and snow.</p><div class="vgrid">${sky.map(tile).join('')}</div></section>`);
  if (themes.length) parts.push(`<section class="more"><h2>Through the year</h2><p class="sub">${themes.length} date themes. Each one restyles the header, the waterfront and the room for its day.</p><div class="vgrid">${themes.map(tile).join('')}</div></section>`);
  if (!parts.length) return '';
  return parts.join('\n') + `
<dialog id="look" aria-labelledby="look-t"><div class="dh"><div><b id="look-t"></b><span id="look-s"></span></div><button class="x" type="button" aria-label="Close"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button></div><div class="db"></div></dialog>
<script>
const V=${JSON.stringify(data).replace(/</g, '\\u003c')},look=document.getElementById('look'),body=look.querySelector('.db');
document.querySelectorAll('.vt').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.k,v=V[k];document.getElementById('look-t').textContent=v.t;document.getElementById('look-s').textContent=v.s;
body.replaceChildren(...v.p.map(n=>{const p=document.createElement('picture'),s=document.createElement('source'),i=document.createElement('img');s.media='(prefers-color-scheme: dark)';s.srcset='variants/'+k+'-'+n+'-dark.svg';i.src='variants/'+k+'-'+n+'-light.svg';i.alt=v.t+': the '+n.replace('-',' ');p.append(s,i);return p;}));look.showModal();}));
look.querySelector('.x').addEventListener('click',()=>look.close());look.addEventListener('click',e=>{if(e.target===look)look.close();});
</script>`;
}

module.exports = { plan, renderViews, galleryHtml, GALLERY_CSS };
