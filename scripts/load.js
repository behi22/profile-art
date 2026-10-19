// Loads the drawing code into the global scope, the way a browser page would, and hands back the engine and its pieces.
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'src');
const ORDER = ['engine.js', 'helpers.js', 'live.js', 'sections/header.js', 'sections/pipeline-mixtape.js', 'sections/waterfront.js', 'sections/about.js', 'sections/daily-life.js', 'sections/signoff.js', 'sections/dividers.js'];

function load(contrib) {
  global.window = global;
  global.CONTRIB = contrib;
  global.FINAL2 = [];
  for (const f of ORDER) (0, eval)(fs.readFileSync(path.join(SRC, f), 'utf8'));
  return { R: global.HL, pieces: global.FINAL2 };
}

module.exports = { load };
