// Tells the workflow whether the live site already shows the hour this run would draw.
const fs = require('fs');
const { drawHour, alreadyDrawn } = require('./when');
const SITE = 'https://behi22.github.io/profile-art/';

(async () => {
  let status = null;
  try {
    const res = await fetch(`${SITE}data/status.json?v=${Date.now()}`, { signal: AbortSignal.timeout(15000) });
    if (res.ok) status = await res.json();
  } catch (e) { /* site unreachable: draw anyway */ }
  const target = drawHour(new Date()), done = alreadyDrawn(status, target);
  console.log(done ? `${target.toISOString()} is already live, skipping this run` : `drawing ${target.toISOString()}`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `drawn=${done}\n`);
})();
