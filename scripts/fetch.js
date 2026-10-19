// Gathers this hour's inputs: both accounts' contribution calendars and the weather over Vancouver.
// A source that fails falls back to the last good copy on the live site, then to the sample, so the images never break.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'data');
const SITE = 'https://behi22.github.io/profile-art/';
const ACCOUNTS = { personal: 'behi22', work: 'behbod-babai' };
const DAY = 864e5;

const QUERY = 'query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}';

async function graphql(variables) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('no GITHUB_TOKEN');
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'profile-art' },
    body: JSON.stringify({ query: QUERY, variables }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.errors || !body.data || !body.data.user) throw new Error(`GitHub ${res.status} ${JSON.stringify(body.errors || '')}`);
  return body.data.user.contributionsCollection.contributionCalendar;
}

// The last 365 days, ending today in Vancouver.
async function contributions(now) {
  const end = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver' }).format(now);
  const endT = Date.parse(end + 'T00:00:00Z'), startT = endT - 364 * DAY;
  const out = { start: new Date(startT).toISOString().slice(0, 10), end };
  for (const [key, login] of Object.entries(ACCOUNTS)) {
    const cal = await graphql({ login, from: out.start + 'T00:00:00Z', to: end + 'T23:59:59Z' });
    const byDate = new Map();
    cal.weeks.forEach(w => w.contributionDays.forEach(d => byDate.set(d.date, d.contributionCount)));
    out[key] = [];
    for (let t = startT; t <= endT; t += DAY) out[key].push(byDate.get(new Date(t).toISOString().slice(0, 10)) || 0);
  }
  return out;
}

// Rain from 0 to 1. Drizzle still shows as rain; about 1.5 mm in the last quarter hour is a downpour.
async function weather() {
  const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=49.2827&longitude=-123.1207&current=rain,showers,weather_code&timezone=America%2FVancouver', { headers: { 'user-agent': 'profile-art' } });
  if (!res.ok) throw new Error('Open-Meteo ' + res.status);
  const c = (await res.json()).current || {};
  const mm = (+c.rain || 0) + (+c.showers || 0);
  const wet = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(+c.weather_code);
  const rain = mm > 0 || wet ? Math.min(1, Math.max(0.25, mm / 1.5)) : 0;
  return { rain: Math.round(rain * 100) / 100, mm, code: +c.weather_code, at: c.time };
}

async function lastGood(name) {
  try { const res = await fetch(SITE + 'data/' + name, { headers: { 'cache-control': 'no-cache' } }); if (res.ok) return await res.json(); } catch (e) { /* the site may not exist yet */ }
  return null;
}
const valid = c => c && Array.isArray(c.personal) && Array.isArray(c.work) && c.personal.length === 365 && c.work.length === 365 && /^\d{4}-\d{2}-\d{2}$/.test(c.start);

(async () => {
  const now = new Date(), notes = [];
  let contrib, wx;
  try { contrib = await contributions(now); if (!valid(contrib)) throw new Error('calendar was not 365 days'); } catch (e) {
    notes.push('contributions: ' + e.message);
    contrib = await lastGood('contrib.json');
    if (!valid(contrib)) { contrib = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'sample-contrib.json'), 'utf8')); notes.push('contributions: using the sample'); } else notes.push('contributions: using the last good copy');
  }
  try { wx = await weather(); } catch (e) { notes.push('weather: ' + e.message + ', drawing a dry sky'); wx = { rain: 0 }; }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'contrib.json'), JSON.stringify(contrib));
  fs.writeFileSync(path.join(OUT, 'weather.json'), JSON.stringify(wx));
  fs.writeFileSync(path.join(OUT, 'fetch.json'), JSON.stringify({ at: now.toISOString(), notes }, null, 2));
  const sum = a => a.reduce((x, y) => x + y, 0);
  console.log(`contributions ${contrib.start} to ${contrib.end}: personal ${sum(contrib.personal)}, work ${sum(contrib.work)}; rain ${wx.rain}`);
  notes.forEach(n => console.log('note: ' + n));
})();
