(function () {
  const R = window.HL, r = R.r;
  window.FINAL2 = window.FINAL2 || [];
  const FA = '"Segoe UI",Tahoma,"Noto Naskh Arabic","Geeza Pro",sans-serif';
  const W = 1200, H = 430, yH = 292;
  const lerp = R.lerpHex, esc = R.esc;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const f1 = v => {
    let t = String(Math.round(v * 10) / 10);
    if (t.startsWith('0.')) t = t.slice(1); else if (t.startsWith('-0.')) t = '-' + t.slice(2);
    return t === '-0' ? '0' : t;
  };
  // Relative polyline; deltas come from rounded absolutes so the error never accumulates.
  const relPath = pts => {
    let px = Math.round(pts[0][0] * 10), py = Math.round(pts[0][1] * 10);
    let d = 'M' + f1(px / 10) + ' ' + f1(py / 10) + 'l';
    for (let i = 1; i < pts.length; i++) {
      const x = Math.round(pts[i][0] * 10), y = Math.round(pts[i][1] * 10);
      const dx = f1((x - px) / 10), dy = f1((y - py) / 10);
      d += (i === 1 || dx[0] === '-' ? '' : ' ') + dx + (dy[0] === '-' ? '' : ' ') + dy;
      px = x; py = y;
    }
    return d;
  };
  const boxes = (pts, w = 3, h = 4) => pts.map(([x, y], i) => (i ? `m${f1(x - pts[i - 1][0])} ${f1(y - pts[i - 1][1])}` : `M${f1(x)} ${f1(y)}`) + `h${w}v${h}h-${w}z`).join('');
  const circ = (cx, cy, q) => `M${f1(cx - q)} ${f1(cy)}a${f1(q)} ${f1(q)} 0 1 0 ${f1(2 * q)} 0a${f1(q)} ${f1(q)} 0 1 0 ${f1(-2 * q)} 0`;

  // Window fonts: every lit pixel is one real window on the glass tower.
  const F57 = {
    B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
    0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    3: ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
    4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  };
  const F35 = {
    H: ['101', '101', '111', '101', '101'], A: ['010', '101', '111', '101', '101'], L: ['100', '100', '100', '100', '111'],
    M: ['101', '111', '111', '101', '101'], D: ['110', '101', '101', '101', '110'], R: ['110', '101', '110', '101', '101'],
    I: ['111', '010', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 5: ['111', '100', '111', '001', '111'],
    6: ['111', '100', '111', '101', '111'], ' ': ['00', '00', '00', '00', '00'],
  };
  const HEART = ['01110001110', '11111011111', '11111111111', '11111111111', '01111111110', '00111111100', '00011111000', '00001110000', '00000100000'];
  const bitmap = (str, font) => {
    const out = font[str[0]].map(() => '');
    [...str].forEach((ch, i) => font[ch].forEach((row, k) => { out[k] += (i ? '0' : '') + row; }));
    return out;
  };

  // Sky, land and water for each part of the day, in both GitHub themes.
  const PAL = {
    night: {
      d: { sky: ['#03060f', '#0a1230', '#1a2550'], glow: '#ff9156', go: 0.14, far: '#161f3c', rim: '#4f5f96', ro: 0.5, near: '#0e1530', back: '#0b1128', front: '#070b1a', off: '#18203c', wat: ['#0b1433', '#02050c'], st: 70 },
      l: { sky: ['#17214a', '#2c3870', '#5b5d96', '#9a7fa6'], glow: '#ffbf94', go: 0.32, far: '#3f4476', rim: '#a3a3d6', ro: 0.5, near: '#30345f', back: '#262a52', front: '#1c1f42', off: '#33375f', wat: ['#2a3166', '#10132b'], st: 36 },
    },
    dawn: {
      d: { sky: ['#0b1434', '#33396f', '#a86a86', '#f0a07a'], glow: '#ffb08a', go: 0.38, far: '#353763', rim: '#e9a3a0', ro: 0.55, near: '#27284d', back: '#1d1d3b', front: '#15152c', off: '#2a2a4a', wat: ['#2a2e5c', '#0a0d22'], st: 16 },
      l: { sky: ['#3e4d8c', '#8c86bb', '#eab0ad', '#ffd2a6'], glow: '#ffd9b0', go: 0.5, far: '#6f6c9e', rim: '#ffd0c0', ro: 0.65, near: '#565585', back: '#423f6c', front: '#322f56', off: '#4a4774', wat: ['#5a6aa0', '#262d55'], st: 6 },
    },
    morning: {
      d: { sky: ['#2f5f98', '#7fa9cf', '#efc59c', '#ffd7a6'], glow: '#fff0d0', go: 0.45, far: '#6a7ba1', rim: '#ffe2c4', ro: 0.6, near: '#4f6189', back: '#3c4b6f', front: '#2b3754', off: '#46557a', wat: ['#45729f', '#152741'], st: 0 },
      l: { sky: ['#8ab8e3', '#c3daef', '#f8e0c6', '#ffe8cb'], glow: '#fff4e0', go: 0.55, far: '#9aa9c6', rim: '#ffffff', ro: 0.6, near: '#7f90b1', back: '#677998', front: '#526380', off: '#73839f', wat: ['#79a5cf', '#3b6690'], st: 0 },
    },
    day: {
      d: { sky: ['#1d5a9a', '#4a8ac4', '#a5c8e4'], glow: '#ffffff', go: 0.22, far: '#6b87ad', rim: '#e8f0ff', ro: 0.35, near: '#4c6990', back: '#3a5273', front: '#293b57', off: '#4a6386', wat: ['#2c6699', '#0f263d'], st: 0 },
      l: { sky: ['#78b1e3', '#b0d3f0', '#e6f2fb'], glow: '#ffffff', go: 0.3, far: '#9cb1cd', rim: '#ffffff', ro: 0.5, near: '#7e97b7', back: '#6880a3', front: '#526a8c', off: '#7590b0', wat: ['#6d9dca', '#2c5782'], st: 0 },
    },
    golden: {
      d: { sky: ['#283b74', '#9a6488', '#f0965c', '#ffc46c'], glow: '#ffb35c', go: 0.5, far: '#584870', rim: '#ffc08a', ro: 0.7, near: '#43385c', back: '#312748', front: '#221a34', off: '#3a304f', wat: ['#4a3d68', '#130e22'], st: 0 },
      l: { sky: ['#5a6db0', '#cf8ea0', '#ffb98a', '#ffe0a0'], glow: '#ffd090', go: 0.55, far: '#8a739a', rim: '#ffd2a8', ro: 0.75, near: '#6f5c84', back: '#56476d', front: '#433858', off: '#5e5078', wat: ['#7a6aa0', '#3a2f5c'], st: 0 },
    },
    dusk: {
      d: { sky: ['#0a1131', '#2a2a64', '#864d77', '#e0825d'], glow: '#ff8a5c', go: 0.32, far: '#262a50', rim: '#c27aa0', ro: 0.5, near: '#1b1e3f', back: '#151732', front: '#0e0f25', off: '#222445', wat: ['#1b2047', '#05070f'], st: 14 },
      l: { sky: ['#1f2b58', '#4d4a84', '#c47c88', '#f3b27f'], glow: '#ffd7a8', go: 0.4, far: '#6c5d8e', rim: '#f7b9a2', ro: 0.7, near: '#4a3e6c', back: '#2e2850', front: '#211b3b', off: '#3a3459', wat: ['#3a3a6b', '#191b38'], st: 6 },
    },
  };
  // How far the city lights are on.
  const LF = { night: 1, dusk: 0.9, dawn: 0.75, golden: 0.4, morning: 0.2, day: 0 };
  // Deciduous canopy colours with their share of trees; conifers stay evergreen all year.
  const DECID = {
    summer: [['#3f7a45', 0.4], ['#4d8a4f', 0.35], ['#356a3c', 0.25]],
    spring: [['#6a9f55', 0.45], ['#86b066', 0.3], ['#dcaabb', 0.25]],
    autumn: [['#5d7442', 0.45], ['#a88a3e', 0.32], ['#8f4f30', 0.23]],
    harvest: [['#5d7442', 0.25], ['#b58f3a', 0.42], ['#9a4f2c', 0.33]],
    winter: [['#6a5f58', 0.4], ['#5c534e', 0.35], ['#786b61', 0.25]],
    blossom: [['#f0b3c6', 0.45], ['#f6cad8', 0.3], ['#e59fb6', 0.25]],
    earth: [['#58c46a', 0.4], ['#7fd68c', 0.35], ['#45a85a', 0.25]],
  };
  const CONIF = ['#1f3a2c', '#284636'];
  // Snow gullies on the Lions, Crown, Grouse and Seymour, and Grouse's ski runs.
  const STREAKS = 'M238 182l-4 14l-2 10M262 184l2 13l-1 9M300 183l3 12l2 10M408 183l-3 12M430 184l4 13M524 183l-2 11M960 183l-3 10M1040 184l3 9';
  const LIONS = 'M246 150l-3 10l-1 6M258 150l2 9M288 151l-2 9M298 152l3 9';
  const ROCK = 'M249.5 124l-2 10M255.5 121l2 9M291 128l-2 8M295 129l2 7';
  const RUNS = 'M598 171l-6 18l-5 22M617 170l2 20l2 22M638 171l7 19l4 20';

  // ---------- The city never changes shape, so it is built once.
  let G = null;
  function geo() {
    if (G) return G;
    const rg = R.rng(604);
    const env = x => 40 + 112 * Math.exp(-(((x - 900) / 240) ** 2)) + 40 * Math.exp(-(((x - 430) / 150) ** 2));
    const HCX = 742, HCW = 22, HCH = 134, FX = 858, FW = 81, FH = 184, SX = 262, SW = 120, SH = 54;
    const backT = [], frontT = [];
    let x = 100;
    while (x < 1112) {
      const w = 14 + 4 * Math.floor(rg() * 7);
      if (x + w > HCX - 12 && x < HCX + HCW + 12) { x = HCX + HCW + 12; continue; }
      if (x + w > FX - 8 && x < FX + FW + 8) { x = FX + FW + 8; continue; }
      let h = env(x + w / 2) * (0.62 + 0.5 * rg());
      if (Math.abs(x + w / 2 - HCX - 11) < 70) h = Math.min(h, 104);
      if (Math.abs(x + w / 2 - FX - FW / 2) < 150) h = Math.min(h, FH - 36);
      backT.push({ x, w, h: Math.round(h), ty: rg() });
      x += w + 2 * Math.floor(rg() * 3);
    }
    x = 88;
    while (x < 1118) {
      const w = 18 + 4 * Math.floor(rg() * 7);
      if (x + w > SX - 10 && x < SX + SW + 10) { x = SX + SW + 10 + Math.floor(rg() * 12); continue; }
      let h = Math.max(18, env(x + w / 2) * (0.3 + 0.32 * rg()));
      if (x + w > FX - 10 && x < FX + FW + 10) h = Math.min(h, 66);
      frontT.push({ x, w, h: Math.round(h), ty: rg() });
      x += w + 10 + Math.floor(rg() * 26);
    }
    frontT.push({ x: SX, w: SW, h: SH, ty: 0.3 });
    const crown = t => (t.ty >= 0.45 && t.ty < 0.7 ? 6 + Math.round(t.ty * 10) : 0);
    const shape = t => {
      const top = yH - t.h, c2 = crown(t);
      if (c2) return `M${t.x} ${yH}V${top}H${t.x + 3}V${top - c2}H${t.x + t.w - 3}V${top}H${t.x + t.w}V${yH}Z`;
      if (t.ty >= 0.85) return `M${t.x} ${yH}V${top + 9}L${t.x + t.w} ${top}V${yH}Z`;
      return `M${t.x} ${yH}V${top}H${t.x + t.w}V${yH}Z`;
    };
    const roof = t => {
      const top = yH - t.h, c2 = crown(t);
      if (t.ty >= 0.85) return `M${t.x} ${top + 9}L${t.x + t.w} ${top}v2.2L${t.x} ${top + 11.2}z`;
      return `M${t.x} ${top}h${t.w}v2h-${t.w}z` + (c2 ? `M${t.x + 3} ${top - c2}h${t.w - 6}v2h-${t.w - 6}z` : '');
    };
    const antennas = [...backT, ...frontT].filter(t => t.ty >= 0.7 && t.ty < 0.85).map(t => `M${t.x + t.w / 2} ${yH - t.h}v-${8 + Math.round(t.ty * 12)}`).join('');
    const hidden = (wx, wy) => frontT.some(f => wx + 3 > f.x - 1 && wx < f.x + f.w + 1 && wy + 4 > yH - f.h - crown(f) - 1)
      || (wx + 3 > SX - 6 && wx < SX + SW + 6 && wy + 4 > yH - SH - 26);
    const slots = [];
    const addSlots = (tx, tw, th, ty, back) => {
      const cols = Math.floor((tw - 4) / 6);
      if (cols < 1) return;
      const ox = tx + Math.round((tw - (cols * 6 - 3)) / 2);
      for (let wy = yH - th + (ty >= 0.85 ? 13 : 6); wy + 4 <= yH - 14; wy += 8) {
        for (let k = 0; k < cols; k++) {
          const wx = ox + k * 6;
          if (back && hidden(wx, wy)) continue;
          slots.push({ x: wx, y: wy, o: rg() });
        }
      }
    };
    backT.forEach(t => addSlots(t.x, t.w, t.h, t.ty, true));
    addSlots(HCX, HCW, HCH - 4, 0, true);
    frontT.forEach(t => addSlots(t.x, t.w, t.h, t.ty, false));
    // The glass tower: a finer 15-column grid that can spell things.
    const ftop = yH - FH, fox = FX + 4, fy0 = ftop + 9;
    for (let rw = 0; fy0 + rw * 7 + 4 <= yH - 14; rw++) {
      for (let c = 0; c < 15; c++) {
        const wx = fox + c * 5, wy = fy0 + rw * 7;
        if (!hidden(wx, wy)) slots.push({ x: wx, y: wy, o: rg(), f: 1 });
      }
    }
    slots.sort((a, b) => a.x - b.x || a.o - b.o);

    // Trees: conifers as layered irregular tiers, deciduous trees as jittered canopy outlines.
    const tr = R.rng(311), conifers = [], decid = [];
    const conPath = (x, b, h) => {
      const w = h * (0.27 + tr() * 0.08), n = h > 26 ? 4 : 3, Rs = [], Ls = [];
      for (let i = 1; i <= n; i++) {
        const y = b - h + h * 0.92 * i / n, wi = w * (0.32 + 0.68 * i / n);
        Rs.push([x + wi * (0.85 + 0.3 * tr()), y + (tr() - 0.5) * 1.4]);
        Ls.push([x - wi * (0.85 + 0.3 * tr()), y + (tr() - 0.5) * 1.4]);
        if (i < n) { Rs.push([x + wi * 0.4, y - h * 0.07]); Ls.push([x - wi * 0.4, y - h * 0.07]); }
      }
      const tip = [x + (tr() - 0.5) * 0.8, b - h], L0 = Ls[0], R0 = Rs[0];
      const snow = relPath([tip, [tip[0] + (R0[0] - tip[0]) * 0.55, tip[1] + (R0[1] - tip[1]) * 0.55], [tip[0] + (L0[0] - tip[0]) * 0.55, tip[1] + (L0[1] - tip[1]) * 0.55]]) + 'z';
      conifers.push({ d: relPath([tip, ...Rs, [x + w * 0.12, b], [x - w * 0.12, b], ...Ls.reverse()]) + 'z', snow, g: tr() < 0.5 ? 0 : 1 });
    };
    const canPath = (x, b, w, h) => {
      const cy = b - h * 0.6 - 1.6, n = 10, P = [];
      for (let i = 0; i < n; i++) {
        const a = i / n * 2 * Math.PI - Math.PI / 2;
        let f = (i % 2 ? 0.8 : 1) * (0.88 + 0.22 * tr());
        if (Math.sin(a) > 0.5) f *= 0.8;
        P.push([Math.round((x + Math.cos(a) * w / 2 * f) * 10), Math.round((cy + Math.sin(a) * h / 2 * f) * 10)]);
      }
      const M = i => [Math.round((P[i][0] + P[(i + 1) % n][0]) / 2), Math.round((P[i][1] + P[(i + 1) % n][1]) / 2)];
      let c = M(n - 1), d = `M${f1(c[0] / 10)} ${f1(c[1] / 10)}`;
      for (let i = 0; i < n; i++) { const m = M(i); d += `q${f1((P[i][0] - c[0]) / 10)} ${f1((P[i][1] - c[1]) / 10)} ${f1((m[0] - c[0]) / 10)} ${f1((m[1] - c[1]) / 10)}`; c = m; }
      decid.push({ d: d + `zM${f1(x - 0.6)} ${f1(cy + h * 0.25)}h1.2V${f1(b)}h-1.2z`, c: tr() });
    };
    // Stanley Park: tall firs on the left, lower toward the city.
    for (let xx = -8; xx < 110; xx += 4.5 + tr() * 4) { const k = Math.max(0, 1 - (xx + 8) / 120); conPath(xx, yH - tr() * 1.5, 14 + 30 * k + tr() * 9); }
    for (let xx = 92; xx < 118; xx += 8) canPath(xx, yH - 1, 9 + tr() * 4, 8 + tr() * 3);
    // Seawall park strips in small clusters, and a mixed park on the right.
    for (let cx = 126; cx < 1090; cx += 64 + tr() * 70) {
      const n = 2 + Math.floor(tr() * 4);
      for (let i = 0; i < n; i++) { const xx = cx + i * (7 + tr() * 5); if (tr() < 0.2) conPath(xx, yH - 1, 10 + tr() * 6); else { const col = tr() < 0.3; canPath(xx, yH - 1, (7 + tr() * 5) * (col ? 0.7 : 1), (7 + tr() * 4) * (col ? 1.35 : 1)); } }
    }
    for (let xx = 1104; xx < 1214; xx += 7 + tr() * 6) { const k = Math.min(1, (xx - 1104) / 110); if (tr() < 0.55) conPath(xx, yH - 1, 12 + 14 * k + tr() * 8); else canPath(xx, yH - 1, 8 + tr() * 5, 7 + tr() * 4 + 4 * k); }
    const parks = `M-12 ${yH}V${yH - 24}Q30 ${yH - 30} 70 ${yH - 16}T114 ${yH - 2}V${yH}ZM1100 ${yH}Q1150 ${yH - 10} 1212 ${yH - 12}V${yH}Z`;
    const lampX = [];
    for (let lx = 116; lx < 1100; lx += 30) lampX.push(lx);

    // The North Shore across Burrard Inlet: hand-placed key points with a little deterministic jitter.
    const mr = R.rng(4207);
    const ridge = (keys, step, jit) => {
      const out = [keys[0]];
      for (let i = 0; i < keys.length - 1; i++) {
        const [x0, y0] = keys[i], [x1, y1] = keys[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
        for (let k = 1; k <= n; k++) { const t = k / n; out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + (k === n ? 0 : (mr() - 0.5) * 2 * jit)]); }
      }
      return out;
    };
    const close = `L1212 ${yH + 2}L-12 ${yH + 2}Z`;
    // Distant Coast Mountains, only seen through the gaps.
    const farPts = ridge([[-12, 192], [40, 184], [90, 178], [140, 182], [180, 170], [214, 162], [240, 168], [330, 168], [360, 158], [392, 150], [420, 142], [446, 137], [470, 146], [500, 156], [540, 166], [600, 172], [660, 168], [700, 160], [730, 152], [756, 145], [782, 150], [810, 160], [846, 170], [900, 168], [960, 164], [1040, 158], [1070, 151], [1096, 145], [1120, 150], [1150, 158], [1178, 151], [1212, 160]], 7, 1.6);
    // The Lions on the left, Crown, the broad Grouse shoulder, the Lynn valley dip, the Seymour ridge.
    const midPts = ridge([[-12, 214], [30, 207], [80, 197], [130, 186], [170, 176], [200, 166], [222, 156], [236, 146], [244, 134], [249, 122], [252, 117], [256, 119], [260, 130], [265, 141], [271, 148], [278, 146], [284, 138], [289, 129], [292, 125], [296, 128], [301, 139], [310, 151], [326, 161], [350, 168], [378, 171], [400, 165], [418, 161], [436, 166], [462, 177], [495, 181], [530, 176], [565, 170], [600, 166], [630, 165], [662, 168], [695, 175], [728, 188], [758, 199], [790, 203], [822, 196], [852, 186], [884, 177], [915, 170], [944, 163], [966, 154], [980, 148], [994, 153], [1008, 149], [1022, 155], [1046, 164], [1080, 172], [1112, 180], [1150, 189], [1186, 195], [1212, 198]], 5, 1.2);
    // Forested foothills right behind the city, with a fine sawtooth treeline.
    const footKeys = ridge([[-12, 246], [50, 240], [120, 244], [190, 236], [260, 242], [330, 234], [400, 240], [470, 232], [540, 238], [610, 230], [680, 236], [740, 242], [800, 236], [880, 240], [950, 234], [1020, 240], [1090, 234], [1150, 240], [1212, 236]], 14, 1.4);
    const footAt = xx => { for (let i = 1; i < footKeys.length; i++) if (footKeys[i][0] >= xx) { const a = footKeys[i - 1], b = footKeys[i]; return a[1] + (b[1] - a[1]) * (xx - a[0]) / Math.max(1e-6, b[0] - a[0]); } return footKeys[footKeys.length - 1][1]; };
    const saw = [];
    for (let xx = -12; xx <= 1212; xx += 4) { const b = footAt(xx); saw.push([xx, b + mr() * 0.8], [xx + 2, b - 1.8 - mr() * 2.4 - (mr() < 0.1 ? 2.6 : 0)]); }
    const snowLine = (thr, amp) => { const pts = []; for (let xx = 1212; xx >= -12; xx -= 5) pts.push(`${xx} ${f1(thr + amp * (Math.sin(xx / 11) * 0.6 + Math.sin(xx / 4.3) * 0.4) + (mr() - 0.5) * 3)}`); return `M-12 0H1212L${pts.join('L')}Z`; };
    const tall = backT.slice().sort((a, b) => b.h - a.h).slice(0, 9);
    const pump = frontT.filter(t => t.x > 560 && t.x < 720).sort((a, b) => b.w - a.w)[0] || frontT[0];
    G = {
      HCX, HCW, HCH, FX, FW, FH, SX, SW, SH, ftop, fox, fy0, backT, frontT, crown, slots, conifers, decid, parks, lampX, tall, pump, antennas,
      backD: backT.map(shape).join(''), frontD: frontT.map(shape).join(''), roofD: [...backT, ...frontT].map(roof).join(''),
      farD: relPath(farPts) + close, midD: relPath(midPts) + close, footD: relPath(saw) + close,
      snowFar: [0, snowLine(150, 4), snowLine(190, 5)], snowMid: [0, snowLine(152, 4), snowLine(184, 6)],
    };
    return G;
  }

  // The moon as it really is tonight: lit limb plus an elliptical terminator.
  const moonPath = (cx, cy, q, p) => {
    const k = Math.abs(Math.cos(2 * Math.PI * p)) * q, wax = p < 0.5;
    const top = `${f1(cx)} ${f1(cy - q)}`, bot = `${f1(cx)} ${f1(cy + q)}`;
    const sw = wax ? (p < 0.25 ? 0 : 1) : (p < 0.75 ? 0 : 1);
    return `M${top}A${f1(q)} ${f1(q)} 0 0 ${wax ? 1 : 0} ${bot}A${f1(k)} ${f1(q)} 0 0 ${sw} ${top}Z`;
  };

  window.FINAL2.push({
    id: 'f-waterfront', section: 2, name: 'Waterfront',
    line: 'Vancouver from across the water at his current hour: one lit window per active day, the North Shore behind, the real sky, moon, season and rain, and the stage for every date theme.',
    render(ctx) {
      const { T, s, st, still, now, ev, evDay } = ctx;
      const g = geo();
      const rain = clamp(+((ctx.weather && ctx.weather.rain) || 0), 0, 1);
      const dark = T.mode === 'dark';
      const vt = R.vanTime(now), sk = R.skyPhase(now), ph = sk.phase, mp = R.moonPhase(now), season = R.season(now);
      const E = ev ? ev.id : '', evN = evDay ? evDay[0] : 1;
      const L = LF[ph], nightish = L >= 0.7;
      const emis = ev ? ev.dark : { a1: '#7c9cff', a2: '#a78bfa', a3: '#3dd6b5', hot: '#ff6b6b' };
      const X = { sky: '', city: '', air: '', water: '', top: '', css: '', defs: '' };

      // ---------- Palette for this hour, greyed by rain, tinted by the date.
      const P0 = PAL[ph][dark ? 'd' : 'l'];
      const grey = nightish ? (dark ? '#151a23' : '#3a4150') : (dark ? '#56606d' : '#9aa3ae');
      const gk = rain ? 0.3 + 0.42 * rain : 0;
      const gr = c => (gk ? lerp(c, grey, gk) : c);
      const P = Object.assign({}, P0, { sky: P0.sky.map(gr), far: gr(P0.far), near: gr(P0.near), wat: P0.wat.map(gr), glow: P0.glow, go: P0.go * (1 - 0.5 * rain) });
      const glowTint = { suri: ['#ff7a2a', 0.42], lunar: ['#ff4d4d', 0.3], yalda: ['#ff4d6d', 0.4], realmadrid: ['#8a6cf0', 0.34], thanksgiving: ['#ffa94d', 0.34], halloween: ['#ff7a1a', 0.3], valentines: ['#ff8fab', 0.3], lights: ['#ffcf70', 0.3], christmas: ['#ffcf8a', 0.24] }[E];
      if (glowTint && L >= 0.4) { P.glow = glowTint[0]; P.go = Math.max(P.go, glowTint[1]); }
      if (E === 'remembrance') P.sky = P.sky.map(c => lerp(c, dark ? '#20232b' : '#5d6270', 0.3));
      if (E === 'halloween' && nightish) P.sky[0] = lerp(P.sky[0], '#2a0f3a', 0.45);
      const topDark = lum(P.sky[0]) < 0.5;
      const txt = topDark ? '#dfe6f5' : '#1f2a44';

      // ---------- Seasons: snow line, roof snow and the trees.
      let snowLv = season === 'winter' ? 2 : (season === 'spring' && vt.m <= 4) || (vt.m === 11 && vt.d > 15) || vt.m === 12 ? 1 : 0;
      if (E === 'winter' || E === 'christmas') snowLv = 2;
      const roofSnow = season === 'winter' || E === 'winter' || E === 'christmas';
      const treeKey = { blossom: 'blossom', nowruz: 'spring', sizdah: 'spring', earth: 'earth', thanksgiving: 'harvest', winter: 'winter', christmas: 'winter' }[E] || season;
      const tk = E === 'earth' ? 0.12 : L * (dark ? 0.6 : 0.48);
      const shade = c => lerp(c, P.front, tk);
      const snowC = lerp('#f4f8ff', dark ? '#7f8aa6' : '#9aa3c4', L * 0.75);

      // ---------- Windows: one per active day, in date order, brighter when busier.
      const patEv = ['birthday', 'newyear', 'valentines', 'realmadrid', 'programmers'].includes(E);
      const SL = patEv ? g.slots.filter(q => !q.f) : g.slots;
      const days = [];
      s.forEach((v, i) => { if (v > 0) days.push(i); });
      const Mx = SL.length, A = Math.min(days.length, Mx);
      const xL = SL[0].x, xR = SL[Mx - 1].x;
      const rank = [];
      for (let j = 0; j < A; j++) {
        const tx = xL + (xR - xL) * days[j] / Math.max(1, st.n - 1);
        let lo = 0, hi = Mx - 1;
        while (lo < hi) { const m = (lo + hi) >> 1; if (SL[m].x < tx) lo = m + 1; else hi = m; }
        rank.push(j ? Math.max(lo, rank[j - 1] + 1) : lo);
      }
      for (let j = A - 1; j >= 0; j--) rank[j] = Math.min(rank[j], Mx - A + j, j < A - 1 ? rank[j + 1] - 1 : Mx - 1);
      const q4 = R.quartiles(s), litSet = new Set(rank);
      const warmEv = E === 'thanksgiving' || E === 'christmas';
      let WC;
      if (E === 'programmers') WC = ['', '#1f6b3a', '#2fa34f', '#57d86e', '#c3ffc9'];
      else if (nightish) WC = warmEv ? ['', '#9a5a2a', '#d98a3e', '#ffb054', '#ffe0a8'] : ['', '#86683f', '#c9944e', '#f2bd67', '#fff1c9'];
      else if (ph === 'golden') WC = [0, 0.3, 0.5, 0.72, 0.95].map(t => lerp(P.back, '#ffc070', t));
      else if (ph === 'morning') WC = [0, 0.22, 0.4, 0.6, 0.88].map(t => lerp(P.back, '#fff2d8', t));
      else WC = [0, 0.2, 0.36, 0.56, 0.86].map(t => lerp(P.back, '#e8f4ff', t));
      const offPts = [];
      g.slots.forEach(q => { if (q.f && patEv) offPts.push([q.x, q.y]); });
      SL.forEach((q, k) => { if (!litSet.has(k)) offPts.push([q.x, q.y]); });
      const flick = new Set(Array.from({ length: 12 }, (_, i) => Math.floor((i + 0.5) * A / 12)));
      const groups = {}, hotPts = [];
      let flk = '';
      rank.forEach((k, j) => {
        const q = SL[k], lv = Math.max(1, R.level(s[days[j]], q4)), dk = Math.round(29 * j / Math.max(1, A - 1));
        if (flick.has(j)) flk += `<path class="${j % 2 ? 'fk' : 'fk2'}" style="animation-delay:${r(0.7 + 2.6 * dk / 29)}s,${j % 2 ? 4 + (j % 5) : 6 + (j % 7)}s" fill="${WC[lv]}" d="${boxes([[q.x, q.y]])}"/>`;
        else (groups[lv + '|' + dk] = groups[lv + '|' + dk] || []).push([q.x, q.y]);
        if (lv === 4) hotPts.push([q.x, q.y]);
      });
      const lit = Object.keys(groups).map(key => { const [lv, dk] = key.split('|'); return `<path class="w d${dk}" fill="${WC[lv]}" d="${boxes(groups[key])}"/>`; }).join('') + flk;
      const dimCity = E === 'earth' ? 0.28 : E === 'remembrance' ? 0.55 : 1;
      const offAttr = E === 'programmers' ? `fill="none" stroke="#2f9e44" stroke-opacity=".55" stroke-width=".6"` : `fill="${P.off}"`;

      // ---------- Sky: stars, sun, moon and rain clouds.
      const starN = Math.round((E === 'yalda' && nightish ? 230 : P.st + (E === 'earth' ? 50 : 0)) * (1 - rain));
      const sr = R.rng(77);
      let stars = ['', '', ''];
      for (let i = 0, made = 0; i < 1400 && made < starN; i++) {
        const sx = 12 + sr() * 1176, sy = 8 + sr() * (E === 'yalda' ? 200 : 150), q = 0.45 + sr() * (sy < 90 ? 1 : 0.7);
        if ((sx < 330 && sy < 48) || (sx > 820 && sy < 66) || (Math.hypot(sx - 1000, sy - 86) < 34) || (E === 'yalda' && Math.hypot(sx - 985, sy - 112) < 62)) continue;
        stars[made % 3] += circ(sx, sy, q);
        made++;
      }
      const starCol = E === 'yalda' ? ['#ffffff', '#ffd6dd', '#ff9fb0'] : ['#ffffff', '#ffffff', '#e6ecff'];
      const starsSvg = starN ? `<g opacity="${dark ? 0.9 : 0.7}">${stars.map((d, i) => d ? `<path class="tw${i}" d="${d}" fill="${starCol[i]}"/>` : '').join('')}</g>` : '';
      // East on the right, west on the left; the arc peaks at today's real noon height.
      const noonE = Math.max(5, R.sunElev(new Date(Date.UTC(vt.y, vt.m - 1, vt.d, 20, 10))));
      const arc = 500 * (1 - clamp(sk.elev / noonE, 0, 1));
      const sunX = sk.rising ? 600 + arc : 600 - arc, sunY = clamp(sk.elev < 10 ? yH - 90 - sk.elev * 5 : yH - 140 - (sk.elev - 10) * 2.6, 46, yH + 12);
      const sunCol = sk.elev < 10 ? '#ffb35c' : '#fff3d6';
      const sun = sk.elev > -4 ? `<circle cx="${f1(sunX)}" cy="${f1(sunY)}" r="90" fill="url(#sh)" opacity="${f1(1 - 0.7 * rain)}"/><circle cx="${f1(sunX)}" cy="${f1(sunY)}" r="${sk.elev < 10 ? 17 : 14}" fill="${sunCol}" opacity="${f1(1 - 0.85 * rain)}"/>` : '';
      const big = E === 'yalda' ? [985, 112, 40] : E === 'halloween' ? [1064, 158, 30] : [1000, 86, 15];
      const [mx, my, mr] = big;
      const moonCol = E === 'halloween' ? '#ffae55' : E === 'yalda' ? '#fff0e2' : '#f4f0e2';
      const moonOn = L >= 0.7;
      const moon = moonOn ? `<g opacity="${f1(1 - 0.8 * rain)}"><circle cx="${mx}" cy="${my}" r="${mr * 4.2}" fill="url(#mh)" opacity="${f1(0.1 + 0.9 * mp.illum)}"/>
        <circle cx="${mx}" cy="${my}" r="${mr}" fill="${moonCol}" opacity=".09"/><path d="${moonPath(mx, my, mr, mp.phase)}" fill="${moonCol}"/>
        <g clip-path="url(#mcl)" fill="#000" opacity=".07"><circle cx="${f1(mx - mr * 0.3)}" cy="${f1(my - mr * 0.22)}" r="${f1(mr * 0.24)}"/><circle cx="${f1(mx + mr * 0.3)}" cy="${f1(my + mr * 0.25)}" r="${f1(mr * 0.16)}"/><circle cx="${f1(mx + mr * 0.12)}" cy="${f1(my - mr * 0.42)}" r="${f1(mr * 0.12)}"/></g></g>` : '';
      const clouds = rain ? `<g filter="url(#cb)" fill="${dark ? (nightish ? '#2a303c' : '#77808d') : (nightish ? '#4a5262' : '#b7bec8')}" opacity="${f1(0.45 + 0.4 * rain)}">${[[160, 40, 260, 30], [520, 26, 320, 34], [900, 46, 300, 30], [1120, 24, 220, 26], [340, 96, 260, 22], [760, 104, 300, 24]].map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`).join('')}</g>` : '';

      // ---------- The North Shore: farther is lighter and hazier, nearer is darker and greener.
      const skyH = P.sky[P.sky.length - 1];
      const farC = lerp(P.far, skyH, nightish ? 0.25 : 0.5), midC = lerp(P.far, P.near, nightish ? 0.7 : rain ? 0.5 : 0.35), footC = lerp(lerp(P.near, P.front, 0.45), '#173326', L < 0.5 ? 0.28 : 0.12);
      const lowSun = ph === 'golden' || ph === 'dawn' || ph === 'morning';
      const mountains = `<use href="#mf" fill="${farC}"/>${snowLv ? `<path clip-path="url(#rkf)" d="${g.snowFar[snowLv]}" fill="${lerp(snowC, farC, 0.35)}" opacity=".85"/>` : ''}
          <use href="#mm" fill="${midC}"/>${snowLv ? `<path clip-path="url(#rkm)" d="${g.snowMid[snowLv]}" fill="${snowC}" opacity=".95"/>` : ''}
          ${snowLv ? `<path d="${snowLv === 2 ? STREAKS + RUNS : LIONS}" fill="none" stroke="${snowC}" stroke-width="1.2" stroke-linecap="round" opacity="${snowLv === 2 ? 0.7 : 0.5}"/>` : ''}${snowLv === 2 ? `<path d="${ROCK}" fill="none" stroke="${midC}" stroke-width="1.1" stroke-linecap="round" opacity=".75"/>` : ''}
          ${lowSun ? `<use href="#mm" fill="none" stroke="${P.rim}" stroke-opacity="${r(P.ro * 50) / 100}" stroke-width=".9"/>` : ''}
          <rect y="176" width="${W}" height="74" fill="url(#ms)"/>
          ${nightish && E !== 'earth' ? `<path d="M612 168.6h2.4M623 169h1.8${snowLv ? '' : 'M603 171h1.4'}" stroke="#ffe7b0" stroke-width="1.3" opacity=".85"/>${snowLv ? `<path d="${RUNS}" fill="none" stroke="#fff1c9" stroke-width="1.3" stroke-linecap="round" stroke-dasharray="0 3.4" opacity=".7"/>` : ''}` : ''}
          <path d="${g.footD}" fill="${footC}"/>`;

      // ---------- The glass tower, Harbour Centre, the neon sign.
      const { FX, FW, FH, ftop, HCX, HCW, HCH, SX, SW, SH } = g;
      const fcx = FX + FW / 2;
      const hcTop = yH - HCH, hx = HCX + HCW / 2;
      const feat = `<path d="M${FX} ${yH}V${ftop}H${FX + FW}V${yH}ZM${FX + 10} ${ftop}v-6h${FW - 20}v6z"/><path d="M${fcx} ${ftop - 6}v-30" stroke="${P.back}" stroke-width="1.6"/>`;
      const hc = `<path d="M${HCX} ${yH}V${hcTop}H${HCX + HCW}V${yH}Z"/><path d="M${hx - 27} ${hcTop - 3}h54l-5 9h-44zM${hx - 8} ${hcTop - 3}v-6h16v6zM${hx - 2} ${hcTop - 9}v-4h4v4z"/><path d="M${hx} ${hcTop - 13}V${hcTop - 34}" stroke-width="1.4" stroke="${P.back}"/>`;
      const sheen = !nightish ? `<rect x="${FX}" y="${ftop}" width="${FW}" height="${FH}" fill="url(#gs)"/>` : '';
      const crownCol = E === 'realmadrid' ? '#f2c14e' : E === 'pride' ? '#b197fc' : '#cfe3ff';
      const crownLight = nightish ? `<path d="M${FX + 11} ${ftop - 4.5}h${FW - 22}" stroke="${crownCol}" stroke-width="1.6" opacity=".85"/>` : '';
      const signOn = nightish && E !== 'earth' && E !== 'remembrance';
      const neon = ev ? emis.hot : '#ff4f7b', neonCore = lerp(neon, '#ffffff', 0.62);
      const scx = SX + SW / 2, sy = yH - SH;
      const word = (t, x2, anchor, extra) => `<text class="sans" x="${x2}" y="${sy - 8}" text-anchor="${anchor}" font-size="13" font-weight="700" letter-spacing="1.2" ${extra}>${t}</text>`;
      const pair = extra => word('HELLO', scx - 5, 'end', extra) + word('WORLD', scx + 5, 'start', extra);
      const sign = `<g><path d="M${scx - 46} ${sy}V${sy - 23}M${scx + 46} ${sy}V${sy - 23}M${scx - 58} ${sy - 4.5}H${scx + 58}M${scx - 30} ${sy}l5 -4.5M${scx + 30} ${sy}l-5 -4.5" stroke="${nightish ? '#1a1d2c' : (dark ? '#2a3550' : '#4a5672')}" stroke-width="1.1"/>
        ${nightish ? pair('fill="none" stroke="#3b3f52" stroke-width=".8"') : pair('fill="none" stroke="#1d2433" stroke-opacity=".4" stroke-width="2.4"') + pair('fill="none" stroke="#eef2f7" stroke-width=".9"')}
        ${signOn ? `<g class="nn"><g filter="url(#ng)" opacity=".75">${word('HELLO', scx - 5, 'end', `fill="none" stroke="${neon}" stroke-width="3"`)}<g class="nz">${word('WORLD', scx + 5, 'start', `fill="none" stroke="${neon}" stroke-width="3"`)}</g></g>
          ${word('HELLO', scx - 5, 'end', `fill="${neonCore}" stroke="${neon}" stroke-width="1.1" paint-order="stroke"`)}<g class="nz">${word('WORLD', scx + 5, 'start', `fill="${neonCore}" stroke="${neon}" stroke-width="1.1" paint-order="stroke"`)}</g></g>` : ''}</g>`;
      const tallest = g.tall.slice(0, 2);
      const avs = tallest.map((t, i) => `<circle class="av" cx="${t.x + t.w / 2}" cy="${yH - t.h - g.crown(t) - 2}" r="1.7" fill="#ff4b3e" style="animation-delay:${i * 0.7}s"/>`).join('')
        + `<circle class="av" cx="${hx}" cy="${hcTop - 35}" r="1.7" fill="#ff4b3e" style="animation-delay:.35s"/>`
        + (E === 'canada' ? '' : `<circle class="av" cx="${fcx}" cy="${ftop - 37}" r="1.8" fill="#ff4b3e" style="animation-delay:1.1s"/>`);

      // ---------- Trees.
      const pal = DECID[treeKey], cpaths = ['', ''], dpaths = pal.map(() => '');
      g.conifers.forEach(t => { cpaths[t.g] += t.d; });
      g.decid.forEach(t => { let k = 0, acc = pal[0][1]; while (k < pal.length - 1 && t.c >= acc) acc += pal[++k][1]; dpaths[k] += t.d; });
      let trees = `<path d="${g.parks}" fill="${shade(CONIF[0])}"/>` + cpaths.map((d, i) => `<path d="${d}" fill="${shade(CONIF[i])}"/>`).join('')
        + `<g${treeKey === 'winter' ? ' opacity=".82"' : ''}>${dpaths.map((d, i) => (d ? `<path d="${d}" fill="${shade(pal[i][0])}"/>` : '')).join('')}</g>`;
      if (treeKey === 'winter') trees += `<path d="${g.conifers.map(t => t.snow).join('')}" fill="${snowC}" opacity=".9"/>`;
      if (E === 'earth') trees = `<g filter="url(#tg)" opacity=".8"><path d="${dpaths.join('')}${cpaths.join('')}" fill="#8ce99a"/></g>` + trees;
      // Seawall lamps: tiny posts, lit from dusk to dawn.
      const lampOn = nightish && E !== 'earth';
      const postC = nightish ? '#2a2f40' : (dark ? '#33415c' : '#56627a');
      const lamps = `<path d="${g.lampX.map(x => `M${x} ${yH}v-5.5`).join('')}" stroke="${postC}" stroke-width=".8"/>`
        + (lampOn ? `<path d="${g.lampX.map(x => circ(x, yH - 6.2, 3.2)).join('')}" fill="#ffcf8a" opacity=".22"/><path d="${g.lampX.map(x => circ(x, yH - 6.2, 0.95)).join('')}" fill="#ffe7b0"/>`
          : `<path d="${g.lampX.map(x => `M${x - 1} ${yH - 6.6}h2v1.2h-2z`).join('')}" fill="${postC}"/>`);

      // ---------- Date themes: each one changes the city itself.
      const fx0 = g.fox, fy0 = g.fy0;
      const patPts = (rows, c0, r0) => { const pts = []; rows.forEach((row, ri) => [...row].forEach((b, ci) => { if (b === '1') pts.push([fx0 + (c0 + ci) * 5, fy0 + (r0 + ri) * 7]); })); return pts; };
      const patDraw = (pts, col, glow, cls) => { const d = boxes(pts); return `<g${cls ? ` class="${cls}"` : ''}><path d="${d}" fill="${glow}" opacity=".8" filter="url(#pg)"/><path d="${d}" fill="${col}"/></g>`; };
      if (patEv) X.defs += `<filter id="pg" filterUnits="userSpaceOnUse" x="${FX - 30}" y="${ftop - 30}" width="${FW + 60}" height="${FH}"><feGaussianBlur stdDeviation="2.2"/></filter>`;
      const fireworks = (list, cols, o = {}) => {
        const dur = o.dur || 6;
        let out = '';
        list.forEach(([x, y, rad, kind, dl], i) => {
          const rr = R.rng(500 + i * 7), n = kind === 'w' ? 22 : 18;
          const c1 = cols[i % cols.length], c2 = cols[(i + 2) % cols.length];
          let d1 = '', d2 = '';
          for (let k = 0; k < n; k++) {
            const a = (k + rr() * 0.3) / n * 2 * Math.PI, len = rad * (0.82 + 0.18 * rr()), i0 = rad * 0.2;
            const sx = Math.cos(a) * i0, sy = Math.sin(a) * i0, ex = Math.cos(a) * len, ey = Math.sin(a) * len;
            const seg = kind === 'w' ? `M${f1(sx)} ${f1(sy)}Q${f1(ex * 0.85)} ${f1(ey * 0.85 - rad * 0.12)} ${f1(ex)} ${f1(ey + rad * 0.5)}` : `M${f1(sx)} ${f1(sy)}L${f1(ex)} ${f1(ey)}`;
            if (k % 2) d2 += seg; else d1 += seg;
          }
          const ox = o.from ? o.from[0] - x : 0, oy = (o.from ? o.from[1] : yH) - y;
          const shell = R.smil(still, `<circle r="1.3" fill="${c1}" opacity="0"><animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.01;.1;.11;1" dur="${dur}s" begin="${dl}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="${f1(ox)} ${f1(oy)};0 0;0 0" keyTimes="0;.1;1" dur="${dur}s" begin="${dl}s" repeatCount="indefinite"/></circle>`);
          out += `<g transform="translate(${f1(x)} ${f1(y)})"><g class="fb" style="animation-delay:${dl}s"><circle r="${f1(rad * 1.6)}" fill="url(#fwg)" stroke="none"/><path d="${d1}" stroke="${c1}"/><path d="${d2}" stroke="${c2}" stroke-dasharray="1.2 2.6"/><circle r="${f1(Math.max(1.2, rad * 0.08))}" fill="#fff" stroke="none"/></g>${shell}</g>`;
        });
        X.defs += `<radialGradient id="fwg"><stop offset="0" stop-color="#fff" stop-opacity="${o.glow || 0.16}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`;
        X.css += `.fb{transform-box:view-box;transform-origin:0 0;animation:fb ${dur}s cubic-bezier(.15,.7,.3,1) infinite both}@keyframes fb{0%,10%{transform:scale(.08);opacity:0}11%{opacity:1}42%{transform:scale(1);opacity:1}78%{transform:scale(1.04) translateY(3px);opacity:0}100%{transform:scale(1.04);opacity:0}}`;
        X.air += `<g id="fwk" fill="none" stroke-width="${o.sw || 1.5}" stroke-linecap="round">${out}</g>`;
        X.water += `<g mask="url(#rf)" opacity="${o.refl || 0.45}"><g filter="url(#rp)"><use href="#fwk" transform="matrix(1 0 0 -.55 0 ${f1(yH * 1.55)})"/></g></g>`;
      };
      // Light caps and beams on the tallest roofs.
      const towerTops = (cols, beam, wash) => {
        const list = g.tall.concat([{ x: FX + 10, w: FW - 20, h: FH + 6, feat: 1 }]).sort((a, b) => a.x - b.x);
        cols.forEach((c, k) => { X.defs += `<linearGradient id="tb${k}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c}" stop-opacity=".55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`; });
        if (wash) X.defs += `<linearGradient id="tw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6dc" stop-opacity=".32"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></linearGradient>`;
        let o = '';
        list.forEach((t, i) => {
          const k = i % cols.length, top = yH - t.h - (t.feat ? 0 : g.crown(t)), cx = t.x + t.w / 2;
          o += `<path class="bm" style="animation-delay:${r(-i * 0.7)}s" d="M${t.x} ${top}L${f1(cx - t.w * 0.9)} ${top - beam}H${f1(cx + t.w * 0.9)}L${t.x + t.w} ${top}Z" fill="url(#tb${k})"/>`;
          if (wash) o += `<rect x="${t.x}" y="${top}" width="${t.w}" height="${f1(t.h * 0.7)}" fill="url(#tw)"/>`;
          o += `<rect x="${t.x}" y="${top - 1}" width="${t.w}" height="3" fill="${cols[k]}"/>`;
        });
        X.css += '.bm{animation:bm 4.6s ease-in-out infinite alternate}@keyframes bm{to{opacity:.55}}';
        return o;
      };
      const tile = (id, items, dur, dx, dy, op) => {
        X.css += `.${id}{animation:${id} ${dur}s linear infinite}@keyframes ${id}{to{transform:translate(${dx}px,${dy}px)}}`;
        return `<g opacity="${op}"><g class="${id}"><g id="${id}g">${items}</g><use href="#${id}g" transform="translate(${-dx} ${-dy})"/></g></g>`;
      };
      const fallItems = (n, seed, dx, fn) => { const q = R.rng(seed); let o = ''; for (let i = 0; i < n; i++) o += fn(-Math.abs(dx) + q() * (W + 2 * Math.abs(dx)), q() * H, q, i); return o; };
      const snowfall = (layers) => layers.map(([n, rad, dur, op], i) => tile(`sn${i}`, `<path d="${fallItems(n, 70 + i, 30, (x, y, q) => circ(x, y, rad * (0.7 + 0.5 * q())))}" fill="#ffffff"/>`, dur, 30 - i * 16, H, op)).join('');

      if (E === 'birthday') {
        X.city += patDraw(patPts(bitmap('BB', F57), 2, 1), '#fff0bf', '#ffb703', 'pt');
        X.css += '.pt{animation:pt 3.2s ease-in-out infinite}@keyframes pt{50%{opacity:.72}}';
        fireworks([[190, 122, 34, 'p', 0.4], [372, 86, 42, 'p', 2.2], [560, 130, 30, 'p', 3.7], [690, 78, 36, 'w', 1.3], [1100, 150, 32, 'p', 4.6]], [emis.a1, emis.a2, emis.a3, emis.hot], { dur: 6.4 });
      } else if (E === 'newyear') {
        const yy = String((vt.m === 12 ? vt.y + 1 : vt.y) % 100).padStart(2, '0');
        const yearPat = patDraw(patPts(bitmap(yy, F57), 2, 1), '#fff2c4', '#f5d06f');
        if (evN === 1) {
          X.city += ['5', '4', '3', '2', '1'].map((d, i) => `<g class="cd${i}">${patDraw(patPts(F57[d], 5, 1), '#ffffff', '#9be7ff')}</g>`).join('') + `<g class="cd5">${yearPat}</g>`;
          X.css += R.stateCss('cd', [[0, 6], [6, 12], [12, 18], [18, 24], [24, 30], [30, 100]], 16, 5, 0.4);
        } else X.city += yearPat;
        fireworks([[150, 110, 40, 'p', 5], [330, 74, 46, 'w', 5.8], [480, 140, 34, 'p', 6.6], [620, 92, 44, 'p', 7.4], [700, 168, 28, 'w', 8.1], [1050, 168, 36, 'p', 8.8], [250, 170, 30, 'w', 9.5], [560, 60, 30, 'p', 10.2]], ['#f5d06f', '#fff4d6', '#e9a8ff', '#9be7ff', '#ffd43b'], { dur: 5.6, refl: 0.8, glow: 0.2 });
      } else if (E === 'valentines') {
        X.city += patDraw(patPts(HEART, 2, 1), '#ffd6e0', '#ff4d7d', 'hb');
        X.css += '.hb{animation:hb 2.2s ease-in-out infinite}@keyframes hb{0%,45%,100%{opacity:1}12%,30%{opacity:.6}}';
        X.defs += '<radialGradient id="vg"><stop offset="0" stop-color="#ff6b8b" stop-opacity=".34"/><stop offset="1" stop-color="#ff6b8b" stop-opacity="0"/></radialGradient>';
        X.water += `<ellipse cx="${fcx}" cy="${yH + 34}" rx="90" ry="30" fill="url(#vg)"/>`;
        X.sky += `<ellipse cx="${fcx}" cy="${ftop + 30}" rx="110" ry="70" fill="url(#vg)"/>`;
      } else if (E === 'realmadrid') {
        X.city += towerTops(['#ffffff', '#f2c14e'], 54, true);
        const strip = bitmap('HALA MADRID ', F35), SC = strip[0].length + 1;
        X.defs += `<clipPath id="mq"><rect x="${fx0 - 1}" y="${fy0 + 14 - 1}" width="75" height="35"/></clipPath>`;
        X.city += `<g clip-path="url(#mq)"><g class="mq">${patDraw(patPts(strip.map(row => row + '0' + row + '0'), 0, 2), '#ffffff', '#f2c14e')}</g></g>`;
        X.css += `.mq{animation:mq ${r(SC * 0.34)}s steps(${SC}) infinite}@keyframes mq{to{transform:translateX(-${SC * 5}px)}}`;
      } else if (E === 'pi') {
        const PI = [[512, 98], [530, 91], [550, 88], [570, 87], [590, 87], [610, 88], [626, 84], [550, 106], [547, 124], [541, 142], [532, 156], [592, 106], [593, 126], [596, 144], [606, 155], [616, 150]];
        const lines = `M${PI.slice(0, 7).map(p => p.join(' ')).join('L')}M550 88L${PI.slice(7, 11).map(p => p.join(' ')).join('L')}M590 87L${PI.slice(11).map(p => p.join(' ')).join('L')}`;
        X.sky += `<g opacity="${nightish ? 1 : 0.55}"><path class="pil" d="${lines}" pathLength="1" fill="none" stroke="${emis.a1}" stroke-opacity=".5" stroke-width=".9"/>
          <g fill="#ffffff">${PI.map((p, i) => `<circle class="tw${i % 3}" cx="${p[0]}" cy="${p[1]}" r="${[0, 3, 6, 10, 14].includes(i) ? 2.2 : 1.5}"/>`).join('')}</g>
          <path d="${PI.map(p => circ(p[0], p[1], 5)).join('')}" fill="${emis.a1}" opacity=".16"/></g>`;
        X.css += '.pil{stroke-dasharray:1 1;animation:pil 3s 1.6s cubic-bezier(.5,0,.3,1) both}@keyframes pil{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}';
      } else if (E === 'suri') {
        X.defs += '<radialGradient id="fg"><stop offset="0" stop-color="#ff9a3c" stop-opacity=".55"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>';
        let fires = '', sparks = '';
        [130, 236, 404, 520, 642, 980, 1086].forEach((x, i) => {
          fires += `<g transform="translate(${x} ${yH - 1}) scale(1.35)"><circle cy="-4" r="13" fill="url(#fg)" class="fgw" style="animation-delay:${r(-i * 0.37)}s"/><path class="fl" style="animation-delay:${r(-i * 0.23)}s" d="M0 0c-4 0-5-3-4-6 1-2 2-3 2-6 2 1 3 3 3 5 1-1 1-2 1-3 2 2 3 4 2 6-1 2-2 4-4 4z" fill="#ff922b"/><path class="fl" style="animation-delay:${r(-i * 0.31)}s" d="M0 0c-2 0-2.4-2-1.4-3.4l1.2-3c1 1 2 2.2 2 4 0 1.4-.8 2.4-1.8 2.4z" fill="#ffe066"/><path d="M-4.5 .6l9-1.6M-4.5-1l9 1.6" stroke="#3b2414" stroke-width="1.2"/></g>`;
          for (let k = 0; k < 4; k++) sparks += `<circle class="sp${k % 2}" style="animation-delay:${r(-(i * 0.53 + k * 0.61) % 2.4)}s" cx="${x + (k - 1.5) * 3}" cy="${yH - 12 - k * 7}" r="${k % 2 ? 0.9 : 1.2}" fill="${k % 2 ? '#ffd43b' : '#ff922b'}"/>`;
        });
        X.city += fires;
        X.air += sparks;
        X.css += '.fl{transform-box:fill-box;transform-origin:50% 100%;animation:fl .45s ease-in-out infinite alternate}@keyframes fl{to{transform:scale(.86,1.14)}}.fgw{animation:fgw 1.3s ease-in-out infinite alternate}@keyframes fgw{to{opacity:.6}}'
          + '.sp0,.sp1{animation:sp0 2.4s ease-out infinite}.sp1{animation-name:sp1}@keyframes sp0{from{transform:translate(0,14px);opacity:1}to{transform:translate(5px,-30px);opacity:0}}@keyframes sp1{from{transform:translate(0,14px);opacity:1}to{transform:translate(-4px,-36px);opacity:0}}';
      } else if (E === 'sizdah' || E === 'nowruz') {
        X.defs += `<g id="sz"><ellipse cy="1.5" rx="13" ry="2.4" fill="none" stroke="#ffffff" stroke-opacity=".28"/>${[-6, -4, -2, 0, 2, 4, 6].map((b, i) => `<path d="M${b} 0q${i % 2 ? -2 : 2} -6 ${f1(b * 0.5)} -${10 + (i % 3) * 2}" stroke="${i % 2 ? '#51cf66' : '#8ce99a'}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`).join('')}<path d="M-6-2.5h12v2h-12z" fill="#e03131"/></g>`;
        X.css += '.bob{transform-box:fill-box;transform-origin:50% 100%;animation:bob 3.4s ease-in-out infinite alternate}@keyframes bob{from{transform:translateY(-1px) rotate(-3deg)}to{transform:translateY(1.5px) rotate(3deg)}}';
        if (E === 'sizdah') {
          X.water += [[120, 316, 0.6], [300, 330, 0.75], [470, 312, 0.55], [610, 336, 0.8], [800, 320, 0.65], [980, 334, 0.8], [1110, 314, 0.55], [210, 404, 1.2], [560, 412, 1.3], [880, 400, 1.15], [1060, 418, 1.3]]
            .map(([x, y, sc], i) => `<g transform="translate(${x} ${y}) scale(${sc})"><use href="#sz" class="bob" style="animation-delay:${r(-i * 0.7)}s"/></g>`).join('');
        } else {
          X.city += [470, 506, 700].map(x => `<g transform="translate(${x} ${yH - 1}) scale(.55)"><use href="#sz"/></g>`).join('');
          // A goldfish leaps from the water every nine seconds.
          X.water += `<g transform="translate(640 334)"><g opacity="1"><path d="M-8 0c3-5 10-5 13 0-3 5-10 5-13 0zm-1 0l-6-4.5v9z" fill="#ff8a1f"/><path d="M-2-3.4l3-2.6 2 2.2z" fill="#ffa94d"/><circle cx="2.6" cy="-1" r=".9" fill="#1f2328"/>${R.smil(still, '<animateMotion path="M-34 20Q0 -18 34 20" rotate="auto" dur="9s" repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;.62;.8;1" calcMode="linear"/><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.62;.621;.8;.801;1" dur="9s" repeatCount="indefinite"/>')}</g>
            ${R.smil(still, [[-34, 0.62], [34, 0.8]].map(([x, t]) => `<ellipse cx="${x}" cy="20" rx="10" ry="2.2" fill="none" stroke="#ffffff" stroke-width="1" opacity="0"><animate attributeName="opacity" values="0;0;.7;0;0" keyTimes="0;${t};${(t + 0.01).toFixed(3)};${(t + 0.12).toFixed(3)};1" dur="9s" repeatCount="indefinite"/><animate attributeName="rx" values="3;3;3;14;14" keyTimes="0;${t};${(t + 0.01).toFixed(3)};${(t + 0.12).toFixed(3)};1" dur="9s" repeatCount="indefinite"/></ellipse>`).join(''))}</g>`;
        }
      } else if (E === 'lunar') {
        X.defs += '<radialGradient id="lg2"><stop offset="0" stop-color="#ff5a3c" stop-opacity=".5"/><stop offset="1" stop-color="#ff5a3c" stop-opacity="0"/></radialGradient><g id="ln"><circle cy="4" r="9" fill="url(#lg2)"/><path d="M0 0v-6" stroke="#ffd43b" stroke-width=".6"/><ellipse cy="4" rx="3.6" ry="4.4" fill="#e8322e"/><path d="M-2 -.4h4v1.3h-4zM-2 7.4h4v1.3h-4z" fill="#ffd43b"/><path d="M0 8.7v3" stroke="#ffd43b" stroke-width=".7"/></g>';
        let rope = '', lan = '';
        for (let x0 = 100; x0 < 1100; x0 += 125) {
          const x1 = x0 + 125;
          rope += `M${x0} ${yH - 30}Q${x0 + 62.5} ${yH - 14} ${x1} ${yH - 30}`;
          [0.2, 0.4, 0.6, 0.8].forEach((t, k) => { const lx = x0 + 125 * t, ly = yH - 30 + 16 * 2 * t * (1 - t); lan += `<g transform="translate(${f1(lx)} ${f1(ly)})"><use href="#ln" class="swg" style="animation-delay:${r(-(x0 / 125 + k) * 0.6 % 3)}s"/></g>`; });
        }
        X.city += `<path d="${rope}" stroke="#ffd43b" stroke-opacity=".5" stroke-width=".6" fill="none"/>${lan}`;
        // A dragon of lights weaves through the windows.
        const yc = x2 => yH - 52 - 13 * Math.sin((x2 - 180) / 70);
        const dragon = g.slots.filter(q => q.x > 150 && q.x < 1100 && Math.abs(q.y - yc(q.x)) <= 4.5);
        const bucket = {};
        dragon.forEach(q => { const b = Math.floor(q.x / 30), head = q.x > 1040; const key = b + '|' + (head ? 2 : (b % 2)); (bucket[key] = bucket[key] || []).push([q.x, q.y]); });
        X.city += Object.keys(bucket).map(key => { const [b, c] = key.split('|').map(Number); return `<path class="dg" style="animation-delay:${r(b * 0.09 - 3.4)}s" d="${boxes(bucket[key])}" fill="${['#ff4d4d', '#ffb703', '#ffe066'][c]}"/>`; }).join('');
        X.css += '.swg{transform-box:fill-box;transform-origin:50% 0;animation:swg 3s ease-in-out infinite alternate}@keyframes swg{from{transform:rotate(-5deg)}to{transform:rotate(5deg)}}.dg{animation:dg 3.4s ease-in-out infinite}@keyframes dg{0%,100%{opacity:.35}50%{opacity:1}}';
      } else if (E === 'earth') {
        X.defs += `<filter id="tg" filterUnits="userSpaceOnUse" x="-20" y="${yH - 70}" width="1240" height="80"><feGaussianBlur stdDeviation="4"/></filter>`;
        const q = R.rng(42);
        X.air += `<g fill="#d8f5a2">${Array.from({ length: 22 }, (_, i) => `<circle class="ff${i % 3}" cx="${f1(q() * 1200)}" cy="${f1(yH - 6 - q() * 34)}" r="${f1(0.8 + q() * 0.8)}"/>`).join('')}</g>`;
        X.css += '.ff0{animation:ff 3.1s ease-in-out infinite}.ff1{animation:ff 4.3s 1s ease-in-out infinite}.ff2{animation:ff 2.6s .5s ease-in-out infinite}@keyframes ff{50%{opacity:.1}}';
      } else if (E === 'blossom') {
        const pet = (x, y, q) => `<ellipse class="pr${Math.floor(q() * 2)}" cx="${f1(x)}" cy="${f1(y)}" rx="2" ry="1.2"/>`;
        X.top += tile('pf', `<g fill="#ffc2d6">${fallItems(30, 13, 60, (x, y, q) => pet(x, y * 0.7, q))}</g>`, 16, -60, H, 0.9);
        const q = R.rng(14);
        X.water += `<g class="drift" fill="#ffc2d6" opacity=".75">${Array.from({ length: 46 }, () => { const y = yH + 8 + q() * 130, k = (y - yH) / 138; return `<ellipse cx="${f1(q() * 1200)}" cy="${f1(y)}" rx="${f1(1 + 1.6 * k)}" ry="${f1(0.4 + 0.5 * k)}"/>`; }).join('')}</g>`;
        X.css += '.pr0,.pr1{transform-box:fill-box;transform-origin:center;animation:pr 2.2s linear infinite}.pr1{animation-duration:3.1s;animation-direction:reverse}@keyframes pr{to{transform:rotate(360deg)}}.drift{animation:drift 14s ease-in-out infinite alternate}@keyframes drift{to{transform:translateX(-10px)}}';
      } else if (E === 'canada' || E === 'lights') {
        if (E === 'canada') {
          fireworks([[200, 118, 36, 'p', 0.5], [380, 84, 42, 'w', 1.7], [560, 128, 32, 'p', 2.9], [690, 82, 38, 'p', 4.1], [1080, 150, 34, 'w', 5.2], [470, 176, 26, 'p', 3.5]], ['#ff3b3b', '#ffffff', '#ffd0d0'], { dur: 6.2 });
          X.city += `<g transform="translate(${fcx} ${ftop - 36})"><circle r="1.4" fill="#e9ecf4"/><g class="flg"><path d="M0 0h26v13h-26z" fill="#ffffff"/><path d="M0 0h6.5v13h-6.5zM19.5 0h6.5v13h-6.5z" fill="#d52b1e"/><path transform="translate(13 6.8) scale(.3)" d="M0-11l2 5 5-2-2 6 5 1-6 4 1 5-5-2-1 6-1-6-5 2 1-5-6-4 5-1-2-6 5 2z" fill="#d52b1e"/></g></g>`;
          X.css += '.flg{transform-box:fill-box;transform-origin:0 50%;animation:flg 1.5s ease-in-out infinite alternate}@keyframes flg{from{transform:skewY(-6deg) scaleX(.94)}to{transform:skewY(5deg) scaleX(1)}}';
        } else {
          const bx = 600, by = yH + 14;
          X.water += `<g><path d="M${bx - 26} ${by}h52l-3 4h-46z" fill="#0a0d18"/><path d="M${bx - 20} ${by}v-3h40v3z" fill="#141a2b"/><path d="M${bx - 18} ${by - 1.5}h36" stroke="#ffd58a" stroke-width="1" stroke-dasharray="1 3"/><ellipse cx="${bx}" cy="${by + 8}" rx="80" ry="10" fill="#ffcf70" opacity=".16" class="fbg"/></g>`;
          fireworks([[300, 110, 58, 'w', 0.3], [470, 76, 66, 'p', 1.1], [640, 112, 62, 'w', 1.9], [800, 70, 54, 'p', 2.7], [560, 160, 40, 'p', 3.4], [380, 168, 44, 'w', 4.2], [720, 176, 40, 'p', 4.9], [520, 58, 46, 'p', 5.6], [1080, 120, 48, 'w', 2.3], [180, 150, 42, 'p', 3.8], [940, 150, 44, 'w', 0.8]], [emis.a1, emis.a2, emis.a3, '#ffffff', '#b2f2bb'], { dur: 6.8, from: [bx, by], refl: 0.6, glow: 0.22, sw: 1.7 });
          X.css += '.fbg{animation:fbg 1.7s ease-in-out infinite alternate}@keyframes fbg{to{opacity:.04}}';
        }
      } else if (E === 'pride') {
        X.city += towerTops(['#ff5d5d', '#ff9f43', '#ffe066', '#51cf66', '#4dabf7', '#9775fa'], 70, false);
      } else if (E === 'programmers') {
        X.city += patDraw(patPts(bitmap('256', F35), 2, 2), '#d3ffd9', '#40c057');
        const q = R.rng(256);
        const bits = Array.from({ length: 40 }, () => SL[Math.floor(q() * SL.length)]);
        X.city += `<path class="bit" d="${boxes(bits.filter((_, i) => i % 2).map(b => [b.x, b.y]))}" fill="#8ce99a"/><path class="bit bit2" d="${boxes(bits.filter((_, i) => !(i % 2)).map(b => [b.x, b.y]))}" fill="#8ce99a"/>`;
        X.css += '.bit{animation:bit 1.6s steps(1,end) infinite}.bit2{animation-duration:2.3s;animation-delay:.4s}@keyframes bit{50%{opacity:0}}';
      } else if (E === 'thanksgiving') {
        const leaf = 'q3 -3 7 -1q-1 4 -7 1z';
        X.top += tile('lf', `<g fill="#e8590c">${fallItems(16, 9, 40, (x, y, q) => `<path class="pr${Math.floor(q() * 2)}" d="M${f1(x)} ${f1(y * 0.75)}${leaf}" fill="${['#e8590c', '#f59f00', '#c92a2a'][Math.floor(q() * 3)]}"/>`)}</g>`, 18, -40, H, 0.85);
        const q = R.rng(15);
        X.water += `<g class="drift">${Array.from({ length: 14 }, () => `<path d="M${f1(q() * 1180)} ${f1(yH + 14 + q() * 120)}${leaf}" fill="${['#e8590c', '#f59f00', '#c92a2a'][Math.floor(q() * 3)]}" opacity=".8"/>`).join('')}</g>`;
        X.css += '.pr0,.pr1{transform-box:fill-box;transform-origin:center;animation:pr 2.6s linear infinite}.pr1{animation-duration:3.4s;animation-direction:reverse}@keyframes pr{to{transform:rotate(360deg)}}.drift{animation:drift 14s ease-in-out infinite alternate}@keyframes drift{to{transform:translateX(-10px)}}';
      } else if (E === 'halloween') {
        const nb = 5 + Math.floor(evN / 2);
        const bat = 'M0 0c-2-3-6-4-10-2 2 0 3 1 3 3-2-1-4 0-5 1 3 0 6 1 8 2 1-1 3-2 4-1 1-1 3 0 4 1 2-1 5-2 8-2-1-1-3-2-5-1 0-2 1-3 3-3-4-2-8-1-10 2z';
        X.defs += `<path id="bt" d="${bat}"/>`;
        X.air += Array.from({ length: nb }, (_, i) => { const y0 = 120 + (i * 37) % 130, x0 = 160 + (i * 233) % 900, sc = f1(0.7 + (i % 3) * 0.2); return `<g transform="translate(0 ${y0})"><g class="bf" style="transform:translateX(${x0}px);animation-duration:${26 + (i * 7) % 14}s;animation-delay:${-i * 5.3}s"><g class="bb" style="animation-delay:${r(-i * 0.4)}s"><g transform="scale(${sc})"><use href="#bt" class="bw" fill="${dark || nightish ? '#06070d' : '#2b1a3a'}" style="animation-delay:${r(-i * 0.13)}s"/></g></g></g></g>`; }).join('');
        X.css += '.bf{animation:bf 30s linear infinite}@keyframes bf{from{transform:translateX(-40px)}to{transform:translateX(1260px)}}.bb{animation:bb 1.9s ease-in-out infinite alternate}@keyframes bb{to{transform:translateY(10px)}}.bw{transform-box:fill-box;transform-origin:50% 40%;animation:bw .28s ease-in-out infinite alternate}@keyframes bw{to{transform:scaleY(-.5)}}';
        X.defs += `<filter id="fog" filterUnits="userSpaceOnUse" x="-100" y="${yH - 60}" width="1400" height="130"><feGaussianBlur stdDeviation="9"/></filter>`;
        X.top += `<g filter="url(#fog)" fill="${dark ? '#a9b2c9' : '#e6e3ef'}"><g class="fo1" opacity=".26"><rect x="-80" y="${yH - 14}" width="620" height="22" rx="11"/><rect x="640" y="${yH - 8}" width="620" height="18" rx="9"/></g><g class="fo2" opacity=".18"><rect x="200" y="${yH + 10}" width="760" height="18" rx="9"/></g></g>`;
        X.css += '.fo1{animation:fo 22s ease-in-out infinite alternate}.fo2{animation:fo 17s ease-in-out infinite alternate-reverse}@keyframes fo{to{transform:translateX(70px)}}';
        const pt = g.pump, px = pt.x + pt.w / 2, py = yH - pt.h - g.crown(pt) - 5;
        X.defs += '<radialGradient id="pk"><stop offset="0" stop-color="#ff9a1f" stop-opacity=".6"/><stop offset="1" stop-color="#ff9a1f" stop-opacity="0"/></radialGradient>';
        X.city += `<g transform="translate(${px} ${py})"><circle r="16" fill="url(#pk)" class="fgw"/><path d="M0-5c5-1 8 1 8 5s-3 5-8 5-8-1-8-5 3-6 8-5z" fill="#f08c00"/><path d="M0-5c-1.5 2-1.5 8 0 10" stroke="#c76b00" stroke-width=".8" fill="none"/><path d="M0-5c0-2 1-3 2-3.6" stroke="#2b8a3e" stroke-width="1.4" fill="none"/><path d="M-4.5-1l1.6-1.8 1.6 1.8zM1.5-1l1.6-1.8 1.6 1.8zM-4 1.6h8l-1.6 1.6-1.6-.8-1.6.8-1.6-.8z" fill="#ffe066" class="fgw"/></g>`;
        X.css += '.fgw{animation:fgw 1.3s ease-in-out infinite alternate}@keyframes fgw{to{opacity:.6}}';
      } else if (E === 'remembrance') {
        X.water += `<g transform="translate(888 392)"><g class="bob2"><ellipse cy="7" rx="16" ry="2.6" fill="none" stroke="#ffffff" stroke-opacity=".22"/>${R.icon('poppy', 0, 0, 0.95, T)}</g><g transform="translate(0 15) scale(1 -.5)" opacity=".22">${R.icon('poppy', 0, 0, 0.95, T)}</g></g>`;
        X.css += '.bob2{animation:bob2 4.6s ease-in-out infinite alternate}@keyframes bob2{to{transform:translateY(1.6px)}}';
      } else if (E === 'winter') {
        if (!rain) X.top += snowfall([[22, 1.1, 22, 0.75], [10, 1.6, 15, 0.85]]);
      } else if (E === 'yalda') {
        X.defs += '<radialGradient id="yg"><stop offset="0" stop-color="#ff4d6d" stop-opacity=".3"/><stop offset="1" stop-color="#ff4d6d" stop-opacity="0"/></radialGradient>';
        X.sky += `<ellipse cx="600" cy="${yH - 40}" rx="640" ry="110" fill="url(#yg)"/>`;
        X.water += `<ellipse cx="600" cy="${yH + 30}" rx="600" ry="60" fill="url(#yg)" opacity=".7"/>`;
      } else if (E === 'christmas') {
        if (!rain) X.top += snowfall([[46, 0.9, 24, 0.6], [30, 1.4, 16, 0.8], [14, 2.1, 11, 0.9]]);
        const tx2 = 44, tb = yH - 1;
        const q = R.rng(25);
        const bulbs = Array.from({ length: 30 }, (_, i) => { const t = q(), y = tb - 6 - t * 50, half = (1 - t) * 15; return `<circle class="tw${i % 3}" cx="${f1(tx2 + (q() * 2 - 1) * half)}" cy="${f1(y)}" r="1.2" fill="${['#ff6b6b', '#ffd43b', '#74c0fc', '#ffffff'][i % 4]}"/>`; }).join('');
        X.city += `<g><circle cx="${tx2}" cy="${tb - 26}" r="44" fill="url(#mh)" opacity=".5"/><path d="M${tx2} ${tb - 58}l9 16h-5l11 16h-6l12 18h-42l12-18h-6l11-16h-5z" fill="#1f4a32"/><path d="M${tx2 - 2} ${tb - 8}h4v8h-4z" fill="#5c3a21"/>${bulbs}<path class="tw0" d="M${tx2} ${tb - 64}l1.6 3.4 3.6.4-2.7 2.4.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.7-2.4 3.6-.4z" fill="#ffd43b"/></g>`;
      }

      // ---------- Water: reflection, moon or sun path, the ferry.
      const glitX = moonOn ? mx : sunX;
      const glitC = moonOn ? moonCol : sunCol;
      let glit = '';
      if (moonOn ? mp.illum > 0.08 : sk.elev > -2) {
        // A scattered glitter path: loose sparkles that widen toward the viewer, over a soft glow, never an even ladder.
        const gq = R.rng(91), cnt = moonOn ? 44 : 78;
        for (let j = 0; j < cnt; j++) {
          const t = Math.pow(gq(), 0.85), gy = yH + 5 + t * 112, spread = (moonOn ? 5 : 9) + t * (moonOn ? 24 : 44);
          const gx = glitX + (gq() + gq() + gq() - 1.5) * spread, len = 1.5 + gq() * (3 + t * (moonOn ? 6 : 11));
          glit += `<path class="tw${j % 3}" d="M${f1(gx - len / 2)} ${f1(gy)}h${f1(len)}" opacity="${f1(0.45 + gq() * 0.55)}"/>`;
        }
        const op = (moonOn ? 0.25 + 0.35 * mp.illum : 0.6) * (1 - 0.7 * rain);
        glit = `<ellipse cx="${f1(glitX)}" cy="${yH + 52}" rx="${moonOn ? 26 : 46}" ry="62" fill="url(#${moonOn ? 'mh' : 'sh'})" opacity="${f1(op * 0.6)}"/>` +
          `<g stroke="${glitC}" stroke-width="1.2" stroke-linecap="round" opacity="${f1(op)}">${glit}</g>`;
      }
      const fyY = yH + 24;
      const fHull = nightish ? '#0b0f1f' : '#1d2a40', fUp = nightish ? '#161b2f' : ph === 'golden' || ph === 'dusk' ? '#d9cfd2' : '#f1f4f8';
      const fWin = nightish ? '#ffd58a' : '#3a4862';
      const ferry = `<g class="fy"><g transform="translate(0 ${fyY})">
        <path d="M-3 4.5L-170 3.4V6.4Z" fill="url(#wk)"/><path d="M-4 6.5Q-70 10-150 8.5" stroke="#ffffff" stroke-opacity=".22" fill="none"/>
        <path d="M0 0h84l-7 7h-71z" fill="${fHull}"/><path d="M6 0v-6h66v6zM14-6v-5h46v5zM30-11v-7h8v7z" fill="${fUp}"/><path d="M30-18h8v2h-8z" fill="${nightish ? '#2a3150' : '#c92a2a'}"/>
        <path d="M9-3h60M17-8.4h40" stroke="${fWin}" stroke-width="1.3" stroke-dasharray="1.8 2"/>
        ${nightish ? `<path d="M9 9.5h60M17 12.5h40" stroke="#ffd58a" stroke-opacity=".28" stroke-width="1.2" stroke-dasharray="1.8 2"/><circle cx="72" cy="-8" r="1.1" fill="#7dff9b"/>` : `<path d="M2 8h78" stroke="${fHull}" stroke-opacity=".25" stroke-width="3"/>`}
        <path d="M80 6.5q5-1.6 9 0" stroke="#ffffff" stroke-opacity=".55" fill="none"/></g></g>`;
      let ripples = '', rainSvg = '';
      if (rain) {
        const q = R.rng(5);
        const rc = nightish ? '#9fb2d6' : '#eef3fa';
        rainSvg = [[60, 9, 0.6, 0.9, 0.32], [42, 14, 0.8, 0.7, 0.42], [24, 22, 1.1, 0.55, 0.5]].map(([n, len, sw, dur, op], i) => {
          const cnt = Math.round(n * (0.4 + 0.6 * rain));
          let d = '';
          for (let k = 0; k < cnt; k++) { const x = -110 + q() * 1430, y = q() * H; d += `M${f1(x)} ${f1(y)}l${f1(-len * 0.26)} ${len}`; }
          return tile(`rn${i}`, `<path d="${d}" stroke="${rc}" stroke-width="${sw}" stroke-linecap="round"/>`, dur, -r(H * 0.26), H, op);
        }).join('');
        ripples = `<g fill="none" stroke="${rc}" stroke-opacity=".55">${Array.from({ length: Math.round(10 + 14 * rain) }, (_, i) => { const y = yH + 8 + q() * 128, k = 0.4 + (y - yH) / 110; return `<ellipse class="rpl" style="animation-delay:${r(-q() * 2.4)}s" cx="${f1(q() * 1200)}" cy="${f1(y)}" rx="${f1(5 * k)}" ry="${f1(1.2 * k)}" vector-effect="non-scaling-stroke"/>`; }).join('')}</g>`;
        X.css += '.rpl{transform-box:fill-box;transform-origin:center;animation:rpl 2.4s ease-out infinite}@keyframes rpl{from{transform:scale(.15);opacity:1}to{transform:scale(1.3);opacity:0}}';
      }

      // ---------- Text: the time, quietly, and the greeting on theme days.
      const timeTxt = `VANCOUVER · ${vt.label} ${vt.tz}`;
      let greet = '';
      if (ev) {
        const gcol = topDark ? ev.dark.a1 : ev.light.a1;
        greet = `<g class="gt"><text class="sans" x="1166" y="38" text-anchor="end" font-size="13" font-weight="600" letter-spacing="2.4" fill="${gcol}">${esc(ev.greet(vt))}</text>`
          + (ev.fa ? `<text x="1166" y="62" direction="rtl" text-anchor="start" font-size="15" fill="${topDark ? '#ece6f6' : '#3a3550'}" style='font-family:${FA}'>${esc(ev.fa)}</text>` : '') + '</g>';
      }

      const delays = Array.from({ length: 30 }, (_, k) => `.d${k}{animation-delay:${r(0.7 + 2.6 * k / 29)}s}`).join('');
      const style = `.w{animation:won .7s ease-out both}@keyframes won{0%{opacity:0}35%{opacity:1}60%{opacity:.7}100%{opacity:1}}${delays}
        .fk{animation:won .7s ease-out both,fk 13s 4s ease-in-out infinite}.fk2{animation:won .7s ease-out both,fk2 17s 6s ease-in-out infinite}
        @keyframes fk{0%,70%,100%{opacity:1}73%,88%{opacity:.12}91%{opacity:1}}@keyframes fk2{0%,40%,100%{opacity:1}42%{opacity:.2}44%{opacity:1}46%{opacity:.3}48%{opacity:1}}
        .hg{animation:fi 1.4s 3.2s both}@keyframes fi{from{opacity:0}}
        .av{animation:av 2.4s steps(1,end) infinite}@keyframes av{0%{opacity:1}50%{opacity:.15}}
        .hcl{animation:hcl 2.6s linear infinite}@keyframes hcl{to{stroke-dashoffset:-9}}
        .tw0{animation:st 4.2s ease-in-out infinite}.tw1{animation:st 5.6s 1.3s ease-in-out infinite}.tw2{animation:st 3.4s .6s ease-in-out infinite}@keyframes st{50%{opacity:.3}}
        .nn{animation:nn 1.6s 3s both}@keyframes nn{0%{opacity:0}18%{opacity:1}24%{opacity:.1}31%{opacity:1}36%{opacity:.25}44%,100%{opacity:1}}
        .nz{animation:nz 9.4s 6s infinite}@keyframes nz{0%,90%,100%{opacity:1}91%{opacity:.3}92.5%{opacity:1}94%{opacity:.45}95%{opacity:1}}
        .fy{transform-box:view-box;transform:translateX(205px);animation:fy 100s 4s linear infinite both}@keyframes fy{0%{transform:translateX(-180px)}36%{transform:translateX(1370px)}100%{transform:translateX(1370px)}}
        .tl{animation:tf 1.2s .4s both}.gt{animation:tf 1.2s 1s both}@keyframes tf{from{opacity:0;transform:translateY(-4px)}}${X.css}`;

      const defs = `<clipPath id="fr"><rect width="${W}" height="${H}" rx="16"/></clipPath>
        <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">${P.sky.map((c, i) => `<stop offset="${r(i / (P.sky.length - 1))}" stop-color="${c}"/>`).join('')}</linearGradient>
        <linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.glow}" stop-opacity="0"/><stop offset="1" stop-color="${P.glow}" stop-opacity="${r(P.go * 100) / 100}"/></linearGradient>
        <linearGradient id="wt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.wat[0]}"/><stop offset="1" stop-color="${P.wat[1]}"/></linearGradient>
        <radialGradient id="mh"><stop offset="0" stop-color="${moonCol}" stop-opacity=".35"/><stop offset="1" stop-color="${moonCol}" stop-opacity="0"/></radialGradient>
        <radialGradient id="sh"><stop offset="0" stop-color="${sunCol}" stop-opacity=".55"/><stop offset=".3" stop-color="${sunCol}" stop-opacity=".18"/><stop offset="1" stop-color="${sunCol}" stop-opacity="0"/></radialGradient>
        <linearGradient id="gs" x1="0" y1="0" x2="1" y2="0"><stop offset=".15" stop-color="#ffffff" stop-opacity="0"/><stop offset=".35" stop-color="#ffffff" stop-opacity=".16"/><stop offset=".5" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
        <linearGradient id="wk" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".6"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
        <clipPath id="mcl"><path d="${moonPath(mx, my, mr, mp.phase)}"/></clipPath>
        <linearGradient id="rfg" gradientUnits="userSpaceOnUse" x1="0" y1="${yH}" x2="0" y2="${H}"><stop offset="0" stop-color="#fff" stop-opacity="${nightish ? 0.62 : 0.5}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <mask id="rf" maskUnits="userSpaceOnUse" x="0" y="${yH}" width="${W}" height="${H - yH}"><rect y="${yH}" width="${W}" height="${H - yH}" fill="url(#rfg)"/></mask>
        <filter id="rp" filterUnits="userSpaceOnUse" x="0" y="${yH}" width="${W}" height="${H - yH}"><feTurbulence type="fractalNoise" baseFrequency=".006 ${rain ? 0.16 : 0.11}" numOctaves="1" seed="4" result="n">${R.smil(still, `<animate attributeName="baseFrequency" dur="10s" values=".006 .11;.008 .135;.006 .11" repeatCount="indefinite"/>`)}</feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="${rain ? 20 : 14}" xChannelSelector="R" yChannelSelector="G"/></filter>
        <filter id="wg" filterUnits="userSpaceOnUse" x="0" y="80" width="${W}" height="${yH - 70}"><feGaussianBlur stdDeviation="${rain ? 3.4 : 2.4}"/></filter>
        ${rain ? `<filter id="wb" filterUnits="userSpaceOnUse" x="0" y="80" width="${W}" height="${yH - 70}"><feGaussianBlur stdDeviation="${r(0.4 + 0.4 * rain)}"/></filter><filter id="cb" filterUnits="userSpaceOnUse" x="-100" y="-60" width="1400" height="240"><feGaussianBlur stdDeviation="16"/></filter>` : ''}
        <filter id="ng" filterUnits="userSpaceOnUse" x="${SX - 40}" y="${yH - SH - 50}" width="${SW + 80}" height="70"><feGaussianBlur stdDeviation="2.4"/></filter>
        <path id="mf" d="${g.farD}"/><path id="mm" d="${g.midD}"/>
        <clipPath id="rkf"><use href="#mf"/></clipPath><clipPath id="rkm"><use href="#mm"/></clipPath>
        <linearGradient id="ms" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyH}" stop-opacity="0"/><stop offset="1" stop-color="${skyH}" stop-opacity="${nightish ? 0.2 : 0.36}"/></linearGradient>${X.defs}`;

      const city = `<g id="cty">
          ${mountains}
          <rect y="150" width="${W}" height="${yH - 148}" fill="url(#hz)"/>
          <g fill="${P.back}"><path d="${g.backD}"/>${hc}${feat}</g>${sheen}
          <path d="${g.antennas}" stroke="${P.back}" stroke-width="1.4"/>
          <g fill="${P.front}"><path d="${g.frontD}"/></g>
          ${roofSnow ? `<path d="${g.roofD}M${FX} ${ftop}h${FW}v2h-${FW}z" fill="${snowC}" opacity=".92"/>` : ''}
          <g opacity="${dimCity}"${rain ? ' filter="url(#wb)"' : ''}><path d="${boxes(offPts)}" ${offAttr}/>
          ${nightish && hotPts.length ? `<path class="hg" d="${boxes(hotPts)}" fill="${WC[4]}" opacity="${rain ? 0.95 : 0.75}" filter="url(#wg)"/>` : ''}
          ${lit}</g>${crownLight}
          ${sign}
          ${trees}
          ${lamps}
          ${X.city}
        </g>`;

      const body = `<g clip-path="url(#fr)">
        <rect width="${W}" height="${yH + 2}" fill="url(#sk)"/>${clouds}
        ${starsSvg}${X.sky}${sun}${moon}
        ${city}
        ${nightish && E !== 'earth' ? `<path class="hcl" d="M${hx - 23} ${hcTop + 1.6}H${hx + 23}" stroke="${E === 'pride' ? '#9775fa' : E === 'realmadrid' ? '#f2c14e' : '#ffe2a8'}" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="0 4.5"/>` : ''}
        ${avs}
        <rect y="${yH}" width="${W}" height="${H - yH}" fill="url(#wt)"/>
        <g mask="url(#rf)"><g filter="url(#rp)"><use href="#cty" transform="matrix(1 0 0 -1 0 ${2 * yH})"/></g></g>
        ${glit}
        <path d="M0 ${yH + 0.6}H${W}" stroke="${nightish ? '#3a3f55' : (dark ? '#c9d6ea' : '#ffffff')}" stroke-opacity="${nightish ? 0.8 : 0.4}" stroke-width="1.2"/>
        ${X.water}
        ${E === 'lights' ? '' : ferry}
        ${ripples}${X.air}${rainSvg}${X.top}
        <text class="mono tl" x="34" y="38" font-size="11" letter-spacing="1.8" fill="${txt}" opacity=".78">${esc(timeTxt)}</text>
        ${greet}
      </g>`;

      const when = { night: 'at night', dawn: 'at dawn', morning: 'in the morning', day: 'in the daytime', golden: 'at golden hour', dusk: 'at dusk' }[ph];
      const desc = `Vancouver's skyline across the water ${when}, ${vt.label} ${vt.tz}${rain ? ', in the rain' : ''}. Every lit window is one day in the past year that Behbod shipped code, in date order from left to right, with the North Shore mountains behind.`
        + (ev ? ` Today is ${ev.name}.` : '');
      return R.svg({ w: W, h: H, title: 'Vancouver waterfront', desc, style, defs, body, still, noBand: true });
    },
  });
})();
