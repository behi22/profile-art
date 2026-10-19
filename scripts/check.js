// The checks every image must pass before it is published: well-formed, self-contained, no broken numbers, within size.
const CAP_KB = { 'f-waterfront': 140, 'f-story': 140 };

function balance(svg) {
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^'">])*?)(\/?)>/g;
  const stack = [];
  let m;
  while ((m = re.exec(svg))) {
    if (m[0].startsWith('<!--') || m[4]) continue;
    if (m[1]) { const top = stack.pop(); if (top !== m[2]) return `</${m[2]}> closes <${top}>`; } else stack.push(m[2]);
  }
  return stack.length ? `unclosed <${stack[stack.length - 1]}>` : '';
}

function check(id, svg) {
  const out = [];
  if (typeof svg !== 'string' || !/^<svg[\s>]/.test(svg) || !svg.endsWith('</svg>')) return ['not an svg'];
  const bi = svg.search(/NaN|undefined|Infinity/);
  if (bi >= 0) out.push('broken number or value: ' + svg.slice(Math.max(0, bi - 40), bi + 20));
  if (svg.includes(String.fromCharCode(0x2014))) out.push('em dash');
  const kb = Buffer.byteLength(svg) / 1024;
  if (kb > (CAP_KB[id] || 100)) out.push(`size ${kb.toFixed(1)} KB`);
  const b = balance(svg);
  if (b) out.push('markup ' + b);
  const seen = new Set();
  for (const x of svg.matchAll(/\sid="([^"]+)"/g)) { if (seen.has(x[1])) { out.push('duplicate id ' + x[1]); break; } seen.add(x[1]); }
  for (const x of [...svg.matchAll(/url\(#([^)]+)\)/g), ...svg.matchAll(/href="#([^"]+)"/g)]) if (!seen.has(x[1])) { out.push('missing reference #' + x[1]); break; }
  if (/(?:href|src)="(?!#)[^"]+"/.test(svg)) out.push('loads an outside resource');
  return out;
}

module.exports = { check };
