// QA matrix: renders every section across hours, seasons, weather, holidays and bad inputs, and checks each result.
const fs = require('fs'), path = require('path');
const { load } = require('./load');
const { check: problemsOf } = require('./check');
const sample = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'sample-contrib.json'), 'utf8'));
const { R, pieces } = load(sample);
const ITEMS = pieces;
const byId = id => ITEMS.find(p => p.id === id);
const TIMED = ['f-waterfront', 'f-story'];
const DAY = 864e5;

let renders = 0, failCount = 0;
const fails = [], notes = [];
const fail = (where, msg) => { failCount++; if (fails.length < 80) fails.push(`${where}: ${msg}`); };

function check(id, svg, where) {
  renders++;
  for (const p of problemsOf(id, svg)) fail(where, p);
}

const series = R.series('both'), stats = R.stats(series);
function ctx(theme, now, rain, o = {}) {
  const ev = 'ev' in o ? o.ev : R.event2At(now);
  const T = R.event2Palette(ev, R.theme(theme));
  return { T, s: o.s || series, st: o.st || stats, still: !!o.still, source: 'both', label: R.sourceLabel('both'), now, ev, evDay: ev ? R.event2Day(ev, now) : null, weather: 'weather' in o ? o.weather : { rain } };
}
function vanAt(y, m, d, h, min = 0) {
  for (const off of [7, 8]) {
    const t = new Date(Date.UTC(y, m - 1, d, h + off, min)), v = R.vanTime(t);
    if (v.y === y && v.m === m && v.d === d && v.h === h) return t;
  }
  return null;
}
const render = (id, c, where) => { let svg; try { svg = byId(id).render(c); } catch (e) { fail(where, 'threw ' + e.message); return ''; } check(id, svg, where); return svg; };
const t0 = Date.now();

// ---------- A. Every hour, through the year, in three kinds of weather.
const dates = [];
for (let k = 0; k < 12; k++) { const m = ((10 + k) % 12) + 1, y = m >= 11 ? 2026 : 2027; dates.push([y, m, 15]); }
dates.push([2026, 11, 1], [2027, 3, 14], [2027, 11, 7], [2026, 12, 21], [2027, 6, 21], [2026, 12, 31], [2027, 1, 1], [2028, 2, 29], [2027, 3, 20], [2027, 9, 22]);
for (const [y, m, d] of dates) {
  for (let h = 0; h < 24; h++) {
    const now = vanAt(y, m, d, h);
    if (!now) { notes.push(`${y}-${m}-${d} ${h}:00 does not exist in Vancouver (clocks spring forward), skipped`); continue; }
    const v = R.vanTime(now), ph = R.skyPhase(now).phase;
    if (h === 12 && ph !== 'day') fail(`${y}-${m}-${d} 12:00`, `sky phase at noon is ${ph}`);
    if ((h === 0 || h === 1) && ph !== 'night') fail(`${y}-${m}-${d} ${h}:00`, `sky phase after midnight is ${ph}`);
    for (const rain of [0, 0.35, 1]) for (const theme of ['dark', 'light']) {
      const where = `${y}-${m}-${d} ${v.label} rain ${rain} ${theme}`;
      const c = ctx(theme, now, rain);
      const wf = render('f-waterfront', c, 'waterfront ' + where);
      if (wf && !wf.includes(`VANCOUVER · ${v.label} ${v.tz}`)) fail('waterfront ' + where, 'clock label does not match the hour');
      if (wf && (rain > 0) !== /class="rn0"/.test(wf)) fail('waterfront ' + where, rain > 0 ? 'no rain drawn while raining' : 'rain drawn while dry');
      render('f-story', c, 'story ' + where);
      if (h === 12 || h === 23) for (const p of ITEMS) if (!TIMED.includes(p.id)) render(p.id, c, `${p.id} ${where}`);
    }
  }
}
// Phases must step through the day in order, with no flicker back and forth.
for (const [y, m, d] of dates) {
  const order = { night: 0, dawn: 1, morning: 2, day: 3, golden: 4, dusk: 5 };
  let seq = [], last = null;
  for (let min = 0; min < 1440; min += 10) {
    const t = new Date(Date.UTC(y, m - 1, d, 8, 0) + min * 60000), p = R.skyPhase(t).phase;
    if (p !== last) { seq.push(p); last = p; }
  }
  const norm = seq.map(p => order[p]).join('');
  if (!/^5?0*1*2*3*4*5*0*1?$/.test(norm.replace(/(.)\1+/g, '$1'))) fail(`${y}-${m}-${d}`, 'sky phases out of order: ' + seq.join(' > '));
}

// ---------- B. Every day of every holiday, 2026 to 2028.
let holidayDays = 0;
for (const e of R.EVENTS2) for (const y of [2026, 2027, 2028]) {
  const sp = e.span(y);
  if (!sp) { fail(e.id, `no dates in ${y}`); continue; }
  let won = 0;
  for (let t = sp[0]; t <= sp[1]; t += DAY) {
    const dd = new Date(t), Y = dd.getUTCFullYear(), M = dd.getUTCMonth() + 1, Dd = dd.getUTCDate();
    const hours = [12, 22].filter(h => R.event2At(vanAt(Y, M, Dd, h)) === e);
    if (!hours.length) continue;
    won++; holidayDays++;
    for (const h of hours) {
      const now = vanAt(Y, M, Dd, h), v = R.vanTime(now);
      for (const theme of ['dark', 'light']) for (const rain of h === 22 ? [0, 1] : [0]) {
        const where = `${e.id} ${Y}-${M}-${Dd} ${v.label} rain ${rain} ${theme}`;
        const c = ctx(theme, now, rain);
        if (c.ev !== e) { fail(where, 'a different theme is active: ' + (c.ev && c.ev.id)); continue; }
        for (const p of ITEMS) {
          const svg = render(p.id, c, `${p.id} ${where}`);
          if (p.id === 'f-header' && svg && !svg.includes(R.esc(e.greet(v)))) fail(`header ${where}`, 'greeting missing');
        }
      }
    }
  }
  if (!won) fail(e.id, `never shows in ${y}: another theme always wins`);
}

// ---------- C. Date rules out to 2050.
const iso = t => new Date(t).toISOString().slice(0, 10);
let persian = null;
try { persian = new Intl.DateTimeFormat('en-US-u-ca-persian', { timeZone: 'Asia/Tehran', month: 'numeric', day: 'numeric' }); } catch (e) { /* no Persian calendar here */ }
for (let y = 2026; y <= 2050; y++) {
  for (const e of R.EVENTS2) {
    const sp = e.span(y);
    if (!sp) { fail(e.id, `no dates in ${y}`); continue; }
    let won = false;
    for (let t = sp[0]; t <= sp[1] && !won; t += DAY) { const dd = new Date(t); won = [12, 21].some(h => R.event2At(vanAt(dd.getUTCFullYear(), dd.getUTCMonth() + 1, dd.getUTCDate(), h)) === e); }
    if (!won) fail(e.id, `never shows in ${y}`);
  }
  const nz = R.nowruzDay(y);
  if (persian) {
    let f1 = null;
    for (let t = Date.UTC(y, 2, 18); t <= Date.UTC(y, 2, 23); t += DAY) { const p = {}; persian.formatToParts(new Date(t + 9 * 3600000)).forEach(x => { p[x.type] = x.value; }); if (p.month === '1' && p.day === '1') { f1 = t; break; } }
    if (f1 !== nz) notes.push(`Nowruz ${y}: equinox rule says ${iso(nz)}, the calendar library says ${f1 ? iso(f1) : 'nothing'}`);
  }
  const tg = R.EVENTS2.find(e => e.id === 'thanksgiving').span(y)[1], tgd = new Date(tg);
  if (tgd.getUTCDay() !== 1 || tgd.getUTCMonth() !== 9 || tgd.getUTCDate() < 8 || tgd.getUTCDate() > 14) fail('thanksgiving', `${y} Monday is ${iso(tg)}`);
  const pr = R.EVENTS2.find(e => e.id === 'pride').span(y)[1], prd = new Date(pr);
  if (prd.getUTCDay() !== 0 || new Date(pr + DAY).getUTCMonth() !== 7 || new Date(pr + DAY).getUTCDate() > 7) fail('pride', `${y} parade day is ${iso(pr)}`);
  const pg = R.EVENTS2.find(e => e.id === 'programmers').span(y)[0];
  if (Math.round((pg - Date.UTC(y, 0, 1)) / DAY) + 1 !== 256) fail('programmers', `${y} is not day 256`);
  const su = R.EVENTS2.find(e => e.id === 'suri').span(y)[0], sud = new Date(su);
  if (sud.getUTCDay() !== 2 || nz - su > 8 * DAY || nz - su < 2 * DAY) fail('suri', `${y} eve is ${iso(su)} for Nowruz ${iso(nz)}`);
}

// ---------- D. Sunrise and sunset against published Vancouver times, in UTC so no clock rules are involved (within 8 minutes).
const SUN = [[2026, 12, 21, '16:05', '00:16'], [2027, 6, 21, '12:07', '04:21'], [2027, 3, 20, '14:13', '02:24'], [2027, 9, 22, '13:58', '02:09']];
for (const [y, m, d, rise, set] of SUN) {
  const start = Date.UTC(y, m - 1, d, 10), cross = [];
  let prev = R.sunElev(new Date(start));
  for (let min = 1; min < 1440; min++) {
    const t = new Date(start + min * 60000), e = R.sunElev(t);
    if ((prev < -0.833) !== (e < -0.833)) cross.push(t.getUTCHours() * 60 + t.getUTCMinutes());
    prev = e;
  }
  const mins = s => +s.slice(0, 2) * 60 + +s.slice(3), off = (a, b) => Math.min(Math.abs(a - b), 1440 - Math.abs(a - b));
  if (cross.length !== 2 || off(cross[0], mins(rise)) > 8 || off(cross[1], mins(set)) > 8) fail('sun', `${y}-${m}-${d} rise and set ${cross.join(', ')} UTC minutes vs ${rise}, ${set}`);
}
// BC has kept daylight time all year since March 2026; older time zone data would put every winter label an hour off.
if (R.vanTime(new Date(Date.UTC(2026, 11, 21, 20))).h !== 13) fail('time zone data', 'too old: it does not know BC stays on UTC-7 all year from 2026 (needs tz 2026a or newer)');

// ---------- E. Bad inputs: odd weather values, no weather, empty and spiky contribution data, still frames.
const now0 = vanAt(2026, 10, 19, 21);
for (const w of [undefined, null, {}, { rain: null }, { rain: NaN }, { rain: -1 }, { rain: 3 }, { rain: '0.5' }]) for (const p of ITEMS) render(p.id, ctx('dark', now0, 0, { weather: w }), `${p.id} weather ${JSON.stringify(w)}`);
const realSeries = R.series;
for (const [name, arr] of [['all zero', new Array(series.length).fill(0)], ['one spike', series.map((_, i) => (i === 100 ? 40 : 0))]]) {
  R.series = () => arr.slice();
  const st = R.stats(arr);
  for (const theme of ['dark', 'light']) for (const p of ITEMS) render(p.id, ctx(theme, now0, 0.5, { s: arr, st }), `${p.id} data ${name} ${theme}`);
  R.series = realSeries;
}
for (const theme of ['dark', 'light']) for (const p of ITEMS) render(p.id, ctx(theme, now0, 1, { still: true }), `${p.id} still ${theme}`);

console.log(`${renders} renders in ${((Date.now() - t0) / 1000).toFixed(0)} s, ${holidayDays} holiday days, ${failCount} problems`);
fails.forEach(f => console.log('FAIL ' + f));
[...new Set(notes)].forEach(n => console.log('NOTE ' + n));
process.exitCode = failCount ? 1 : 0;
