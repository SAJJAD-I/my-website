// the street: drawn at art resolution on one canvas, scaled up by a whole number of device pixels.
// The world (house, café, mosque) is wider than a phone, so a camera pans along it.
// Interiors (the room, the mosque, later the café) are separate scenes registered through window.Street,
// each drawn on its own canvas at the largest whole-pixel scale that fits the screen.
// All lettering in the pictures is real pixel type: the pixel faces rasterised on the art grid.
(() => {
'use strict';

const SITE = window.SITE, SND = window.Sound;
const P = {
  ink:'#07060c', out:'#0d0a19', cloud:'#0d1230', cloudHi:'#1a2252',
  city:'#0a0c1f', cityHi:'#121633', cityWinA:'#6e4a1c', cityWinB:'#5c1a44',
  plum:'#2b1a3b', plumD:'#1f1229', plumL:'#3b2652', cornice:'#120a1a',
  fuchsia:'#ff2d7a', fuchsiaD:'#a3164f', crimson:'#8c1440',
  gold:'#ffc21a', goldM:'#e2962a', amber:'#a0581a', amberD:'#5a2e12', warm:'#c07426',
  cream:'#efe9da', wood:'#3a2a1e', woodL:'#5a4030', woodD:'#22170f',
  slate:'#191822', slateL:'#24223a', chalk:'#e4dfcf',
  road:'#09091a', roadL:'#11122a', pave:'#1a1730', paveL:'#272043', leaf:'#1f4a3a', leafL:'#2e6a4c',
  wall:'#262036', wallD:'#1d182b', wallL:'#30294a', metal:'#4f5468', metalL:'#6f7590', metalD:'#363a4a',
  stone:'#352f45', stoneL:'#423a56', stoneD:'#2a2538', dome:'#1c3346', domeL:'#2b4b63', tv:'#4b3a9a'
};
const SKY = ['#07060c', '#0a0b1c', '#0e112a', '#131838', '#181f46'];
const BAYER = [0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5].map(v => (v + .5) / 16);
const dith = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

const $ = id => document.getElementById(id);
const cv = $('scene');
const ctx = cv.getContext('2d', { alpha: false });
const st = document.createElement('canvas');
const sx = st.getContext('2d');
const ic = $('inner');
const ictx = ic.getContext('2d', { alpha: false });
const ui = {};
for (const id of ['world', 'door', 'houseDoor', 'mosqueDoor', 'lang', 'sound', 'panL', 'panR', 'links', 'boardTitle', 'siteName',
  'bio', 'bioTitle', 'bioName', 'bioText', 'bioFoot', 'note', 'noteTitle', 'noteBody', 'fade', 'inside', 'sceneHint', 'sceneExit', 'spots']) ui[id] = $(id);
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};

let W = 0, H = 0, WW = 0, S = 1, cssS = 1, L = null;
let lang = store.get('lang', 'ar') === 'en' ? 'en' : 'ar';
let door = 0, doorTo = 0, cam = 0, camTo = 0, camShown = -1, hover = -1;
let drops = [], splashes = [], rings = [], time = 0, nextFlicker = 6, flicker = 0, tail = 0, nextTail = 3, lantern = 0, bolt = null;
let active = null;
let bladeKick = 0;                 // the interior scene the visitor is in, or null on the street

/* ---------- seeded randomness, so the street is the same on every visit ---------- */
function rng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}



/* ---------- pixel lettering in the pictures: Noto Kufi Arabic at 12px, Silkscreen at 8px, thresholded to hard pixels (the windows use Pixel AE) ---------- */
const glyphCache = new Map();
function mask(str) {
  if (glyphCache.has(str)) return glyphCache.get(str);
  const rtl = /[؀-ۿ]/.test(str);
  const font = rtl ? '500 12px "Pixel Kufi", "Pixel Silk"' : '8px "Pixel Silk", "Pixel Kufi"';
  const c = document.createElement('canvas'), x = c.getContext('2d', { willReadFrequently: true });
  x.font = font;
  const w = Math.ceil(x.measureText(str).width) + 8, h = 30, base = 21;
  c.width = Math.max(1, w); c.height = h;
  x.font = font; x.direction = rtl ? 'rtl' : 'ltr'; x.textAlign = 'left'; x.fillStyle = '#fff';
  x.fillText(str, 4, base);
  const d = x.getImageData(0, 0, c.width, h).data, a = new Uint8Array(c.width * h);
  for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
  const on = PixText.binarize(a, c.width, h, 118, 160);
  let x0 = c.width, x1 = -1;
  for (let y = 0; y < h; y++) for (let i = 0; i < c.width; i++) if (on[y * c.width + i]) { if (i < x0) x0 = i; if (i > x1) x1 = i; }
  const m = { w: Math.max(0, x1 - x0 + 1), h, base, bits: new Uint8Array(Math.max(1, x1 - x0 + 1) * h), tints: {} };
  for (let y = 0; y < h; y++) for (let i = 0; i < m.w; i++) m.bits[y * m.w + i] = on[y * c.width + i + x0];
  glyphCache.set(str, m);
  return m;
}
function haloOf(m, r) {
  const k = 'h' + r;
  if (m[k]) return m[k];
  const w = m.w + r * 2, h = m.h + r * 2, bits = new Uint8Array(w * h);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.bits[y * m.w + x])
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + r) bits[(y + r + dy) * w + x + r + dx] = 1;
  return (m[k] = { w, h, base: m.base + r, bits, tints: {} });
}
function tinted(m, color) {
  if (m.tints[color]) return m.tints[color];
  const c = document.createElement('canvas'); c.width = Math.max(1, m.w); c.height = m.h;
  const x = c.getContext('2d'); x.fillStyle = color;
  for (let y = 0; y < m.h; y++) for (let i = 0; i < m.w; i++) if (m.bits[y * m.w + i]) x.fillRect(i, y, 1, 1);
  return (m.tints[color] = c);
}
const measure = str => mask(str).w;
// draws str with its baseline on y; align is where x sits: 'center', 'left' or 'right'
function text(g, str, x, y, color, o = {}) {
  let m = mask(str);
  if (o.halo) m = haloOf(m, o.halo);
  const left = o.align === 'left' ? x - (o.halo || 0) : o.align === 'right' ? x - m.w + (o.halo || 0) : x - m.w / 2;
  g.drawImage(tinted(m, color), Math.round(left), y - m.base);
  return m.w;
}

/* ---------- account icons, authored on a 9x9 grid ---------- */
const ICONS = {
  youtube: ['.RRRRRRR.', 'RRRRRRRRR', 'RRRWRRRRR', 'RRRWWRRRR', 'RRRWWWRRR', 'RRRWWRRRR', 'RRRWRRRRR', 'RRRRRRRRR', '.RRRRRRR.'],
  tiktok: ['....WW...', '....WWW..', '....W.WW.', '....W....', '..WWW....', '.W..W....', '.W..W....', '..WW.....', '.........'],
  instagram: ['.PPPPPPP.', 'P.......P', 'P.....P.P', 'P..PPP..P', 'P.P...P.P', 'P.P...P.P', 'P..PPP..P', 'P.......P', '.PPPPPPP.'],
  telegram: ['..BBBBB..', '.BBBBBBB.', 'BBBBBBWWB', 'BBBBWWWBB', 'BWWWWWBBB', 'BBBWWBBBB', 'BBBBWBBBB', '.BBBBBBB.', '..BBBBB..'],
  discord: ['.........', '.D.....D.', 'DDDDDDDDD', 'DDDDDDDDD', 'DDWDDDWDD', 'DDWDDDWDD', 'DDDDDDDDD', '.DDD.DDD.', '.........'],
  whatsapp: ['..GGGGG..', '.GGGGGGG.', 'GGWGGGGGG', 'GGWWGGGGG', 'GGGWWGGGG', 'GGGGWWWGG', 'GGGGGGGGG', '.GGGGGGG.', 'G.GGGGG..'],
  github: ['.W.....W.', '.WW...WW.', '.WWWWWWW.', 'WWWWWWWWW', 'WW.WWW.WW', 'WWWWWWWWW', '.WWWWWWW.', '..W.WWW..', '..WW.....']
};
const ICOLOR = { R: '#e8323c', W: '#f4efe2', P: '#ff5a8f', B: '#3a9be0', D: '#6b6fe8', G: '#3ad37c' };
function iconCanvas(id) {
  const rows = ICONS[id], c = document.createElement('canvas'); c.width = 11; c.height = 9;
  const x = c.getContext('2d');
  const put = (dx, col) => rows.forEach((r, y) => [...r].forEach((ch, i) => {
    if (ch === '.') return; x.fillStyle = col || ICOLOR[ch]; x.fillRect(i + dx, y, 1, 1);
  }));
  if (id === 'tiktok') { put(0, '#25f4ee'); put(2, '#fe2c55'); put(1); } else put(1);
  return c;
}
const ICON_IMG = Object.fromEntries(Object.keys(ICONS).map(k => [k, iconCanvas(k)]));

/* ---------- small drawing helpers ---------- */
function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
function frame(g, x, y, w, h, c) { rect(g, x, y, w, 1, c); rect(g, x, y + h - 1, w, 1, c); rect(g, x, y, 1, h, c); rect(g, x + w - 1, y, 1, h, c); }
function dither(g, x, y, w, h, c, density) {
  g.fillStyle = c;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (dith(x + i, y + j) < density) g.fillRect(x + i, y + j, 1, 1);
}
// a soft light drawn the pixel way: concentric bands of the colour, each a step more opaque toward the centre
function glow(g, cx, cy, rx, ry, c, peak) {
  g.fillStyle = c;
  const a0 = g.globalAlpha;
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d >= 1) continue;
    const a = Math.min(1, Math.floor(peak * (1 - d) ** 1.6 * 5) / 5);
    if (a <= 0) continue;
    g.globalAlpha = a0 * a; g.fillRect(x, y, 1, 1);
  }
  g.globalAlpha = a0;
}
function sprite(g, rows, x, y, pal) {
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if (ch !== '.') rect(g, x + i, y + j, 1, 1, pal[ch]); }));
}
const CRESCENT = ['.GG', 'G..', 'G..', 'G..', '.GG'];



/* ---------- layout, in art pixels; x is in world coordinates ---------- */
function layout() {
  WW = Math.max(W, 700);
  const cx = Math.floor(WW / 2);
  const base = Math.round(H * (H / W > 1.6 ? 0.58 : 0.68));
  const cafe = { x: cx - 105, y: base - 158, w: 210, base };
  const house = { x: cafe.x - 24 - 200, w: 200, h: 124 };
  const mosque = { x: cafe.x + cafe.w + 26, w: 220 };
  const near = H - 12;
  const n = SITE.accounts.length, rows = Math.ceil(n / 2);
  const bw = Math.min(164, W - 12), bh = 26 + rows * 22 + 6;
  const wide = W >= WW && W >= 420;
  const bx = wide ? Math.min(W - bw - 12, mosque.x - 4) : Math.round(W / 2 - bw / 2);
  const board = { x: bx, y: H - 6 - bh - 4, w: bw, h: bh, rows, cw: Math.floor((bw - 12) / 2) };
  const doorBox = { x: cafe.x + 90, y: base - 56, w: 30, h: 56 };
  const houseDoor = { x: house.x + 20, y: base - 42, w: 24, h: 42 };
  const mosqueDoor = { x: mosque.x + 88, y: base - 38, w: 22, h: 38 };
  const lamps = [], benches = [], trees = [];
  for (let x = house.x - 16, k = 0; x > 6; x -= 128, k++) { lamps.push(x); if (k) benches.push(x + 14); if (x - 64 > 12) trees.push(x - 64); }
  for (let x = mosque.x + mosque.w + 10, k = 0; x < WW - 14; x += 128, k++) { lamps.push(x); if (k) benches.push(x - 26); if (x + 64 < WW - 12) trees.push(x + 64); }
  const stops = [house.x + house.w / 2, cx, mosque.x + mosque.w / 2].map(c => clampCam(Math.round(c - W / 2)));
  return { cx, base, cafe, house, mosque, near, board, doorBox, houseDoor, mosqueDoor, lamps, benches, trees, stops,
    puddle: { x: mosque.x + 50, y: base + 16, rx: 30, ry: 3 } };
}
const clampCam = v => Math.max(0, Math.min(WW - W, v));


/* ---------- static layer: sky, city, street and the three buildings ---------- */
function buildStatic() {
  st.width = WW; st.height = H;
  const g = sx, { base, cafe, near } = L;
  const R = rng(7);

  // sky: banded gradient, ordered-dithered between bands
  const img = g.createImageData(WW, H), d = img.data;
  const cols = SKY.map(h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)));
  for (let y = 0; y < base; y++) {
    const v = Math.min(.999, y / base) * (cols.length - 1), i = Math.floor(v), f = v - i;
    for (let x = 0; x < WW; x++) {
      const c = dith(x, y) < f ? cols[i + 1] : cols[i], o = (y * WW + x) * 4;
      d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  // a moon behind thin cloud: a pale ring and its halo
  const mx = Math.round(WW * .16), my = Math.round(base * .2);
  glow(g, mx, my, 34, 30, '#161d48', 1.1);
  glow(g, mx, my, 20, 18, '#1d2558', 1);
  for (let a = 0; a < 360; a += 2) {
    const r = 9, px = Math.round(mx + Math.cos(a * Math.PI / 180) * r), py = Math.round(my + Math.sin(a * Math.PI / 180) * r);
    if (a > 200 && a < 340) continue;
    rect(g, px, py, 1, 1, a > 20 && a < 160 ? '#6a74a8' : '#3c4680');
  }
  glow(g, mx, my, 8, 8, '#262f66', 1.3);

  // layered streaks of cloud, lit faintly from above
  for (let k = 0; k < Math.ceil(WW / 40); k++) {
    const y = 10 + Math.floor(R() * base * .42), x0 = Math.floor(R() * WW) - 30, len = 40 + Math.floor(R() * 110), th = 1 + Math.floor(R() * 3);
    for (let j = 0; j < th; j++) {
      const inset = j * 6 + Math.floor(R() * 6);
      rect(g, x0 + inset, y + j, len - inset * 2, 1, j === 0 ? '#1c2452' : '#141a3e');
    }
    dither(g, x0 + 4, y - 1, len - 8, 1, '#232c5e', .35);
  }
  for (let k = 0; k < Math.ceil(WW / 60); k++) {
    const cx = R() * WW, cy = 14 + R() * (base * .3), rw = 26 + R() * 40, rh = 5 + R() * 6;
    glow(g, cx, cy, rw, rh, P.cloud, 1.4);
    glow(g, cx - rw * .2, cy - rh * .5, rw * .6, rh * .5, P.cloudHi, .5);
  }
  // a few stars between the clouds
  for (let k = 0; k < WW / 18; k++) { const sx0 = Math.floor(R() * WW), sy0 = Math.floor(R() * base * .45); rect(g, sx0, sy0, 1, 1, R() < .3 ? '#8a94c8' : '#3a4478'); }

  // far city: taller, paler, almost lost in the haze
  let x = -6;
  while (x < WW) {
    const bw = 14 + Math.floor(R() * 22), top = Math.max(Math.round(H * .06), base - 60 - Math.floor(R() * (110 + Math.max(0, base - 220) * .6)));
    rect(g, x, top, bw, base - top, '#151b40');
    rect(g, x, top, bw, 1, '#1d2452');
    if (R() < .3) { rect(g, x + Math.floor(bw / 2), top - 8, 1, 8, '#1d2452'); if (R() < .5) rect(g, x + Math.floor(bw / 2), top - 9, 1, 1, '#ff5a96'); }
    for (let wy = top + 4; wy < base - 4; wy += 5) for (let wx = x + 2; wx < x + bw - 2; wx += 4) if (R() < .05) rect(g, wx, wy, 1, 1, '#4a3c50');
    x += bw + 1;
  }
  // haze between the two cities
  for (let y = base - 90; y < base; y++) dither(g, 0, y, WW, 1, '#1a2150', Math.max(0, (y - (base - 90)) / 90) * .55);

  // near city
  x = -4;
  while (x < WW) {
    const bw = 10 + Math.floor(R() * 18), top = Math.max(Math.round(H * .1), base - 34 - Math.floor(R() * (92 + Math.max(0, base - 220) * .6)));
    rect(g, x, top, bw, base - top, P.city);
    rect(g, x + bw - 1, top, 1, base - top, P.cityHi);
    rect(g, x, top, bw, 1, P.cityHi);
    if (R() < .25) rect(g, x + 2 + Math.floor(R() * (bw - 4)), top - 5, 1, 5, P.cityHi);
    for (let wy = top + 3; wy < base - 4; wy += 4) for (let wx = x + 2; wx < x + bw - 2; wx += 3)
      if (R() < .1) rect(g, wx, wy, 1, 2, R() < .7 ? P.cityWinA : P.cityWinB);
    x += bw + (R() < .3 ? 2 : 0);
  }
  dither(g, 0, base - 14, WW, 14, '#121838', .3);

  for (const lx of L.lamps) {
    rect(g, lx, base - 118, 2, 124, '#15132a'); rect(g, lx + 1, base - 118, 1, 124, '#24203c');
    rect(g, lx - 1, base + 4, 4, 2, '#15132a');
    rect(g, lx, base - 120, 9, 2, '#15132a');
    rect(g, lx + 6, base - 118, 6, 3, '#15132a');
    rect(g, lx + 7, base - 115, 4, 1, '#fff0c0');
  }

  L.lights = [];
  for (const tx of L.trees) drawTree(g, tx, base, R);
  drawHouse(g, R);
  drawMosque(g, R);
  drawCafe(g, R);

  rect(g, 0, base, WW, 7, P.pave);
  rect(g, 0, base, WW, 1, P.paveL);
  for (let i = 0; i < WW; i += 14) rect(g, i, base + 1, 1, 5, P.plumD);
  rect(g, 0, base + 7, WW, 1, P.out);
  rect(g, 0, base + 8, WW, near - base - 8, P.road);
  dither(g, 0, base + 8, WW, 3, P.roadL, .5);
  rect(g, 0, near, WW, H - near, P.pave);
  rect(g, 0, near, WW, 1, P.paveL);
  rect(g, 0, near - 1, WW, 1, P.out);
  for (let i = 6; i < WW; i += 22) rect(g, i, near + 2, 1, H - near - 2, P.plumD);

  drawMailbox(g);
  for (const bx of L.benches) drawBench(g, bx, base);
  drawGreenery(g, R);
  drawWires(g);

  // light: the night's blue over everything below the sky, every lit thing pouring its own colour
  const lights = L.lights;
  for (const lx of L.lamps) {
    lights.push({ x: lx + 9, y: base - 108, rx: 12, ry: 10, c: '#ffe0a0', i: 1 });
    lights.push({ x: lx + 9, y: base + 2, rx: 34, ry: 12, c: '#ffd890', i: .8 });
  }
  bake(g, WW, H, [.8, .84, 1], lights, Math.round(H * .1));

  // cones of light under the street lamps, the rain caught inside them
  for (const lx of L.lamps) cone(g, lx + 9, base - 114, base + 4, '#ffe0a0');

  // the name in neon, drawn after the light so it burns
  const s = L.sign, name = SITE.cafeName[lang] || '', ncx = s.x + s.w / 2, by = s.y + 18;
  // the board stays near black so the letters read: a soft pink bloom, a deep pink edge, a white-hot core
  rect(g, s.x + 1, s.y + 1, s.w - 2, s.h - 2, '#0c070c');
  g.globalAlpha = .22; text(g, name, ncx, by, '#ff3f88', { halo: 2 }); g.globalAlpha = 1;
  text(g, name, ncx, by, '#d81e6a', { halo: 1 });
  text(g, name, ncx, by, '#fff2f7');
}

/* ---------- lighting: ambient tint times the picture, plus coloured lights in quantised, dithered bands ---------- */
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255);
function bake(g, w, h, amb, lights, ambFrom = 0) {
  const img = g.getImageData(0, 0, w, h), d = img.data, n = w * h;
  const lr = new Float32Array(n), lg = new Float32Array(n), lb = new Float32Array(n), li = new Float32Array(n);
  for (const l of lights) {
    const [cr, cg, cb] = hexRGB(l.c), ry = l.ry || l.rx;
    const x0 = Math.max(0, Math.floor(l.x - l.rx)), x1 = Math.min(w - 1, Math.ceil(l.x + l.rx));
    const y0 = Math.max(0, Math.floor(l.y - ry)), y1 = Math.min(h - 1, Math.ceil(l.y + ry));
    for (let y = y0; y <= y1; y++) {
      const dy = (y - l.y) / ry;
      for (let x = x0; x <= x1; x++) {
        const dx = (x - l.x) / l.rx, q = dx * dx + dy * dy;
        if (q >= 1) continue;
        const f = l.i * (1 - q) * (1 - q), o = y * w + x;
        lr[o] += f * cr; lg[o] += f * cg; lb[o] += f * cb; li[o] += f;
      }
    }
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = y * w + x, p = o * 4, t = dith(x, y);
    const ar = y >= ambFrom ? amb[0] : 1, ag = y >= ambFrom ? amb[1] : 1, ab = y >= ambFrom ? amb[2] : 1;
    // light falls off in steps, the steps broken by the ordered dither: the pixel-art way to draw a glow
    // the strength steps, the colour does not: one clean band per step, no rainbow rings
    const sI = li[o], k = sI > 0 ? (Math.round(sI * 8) / 8) / sI : 0;
    const qr = lr[o] * k, qg = lg[o] * k, qb = lb[o] * k;
    d[p] = Math.min(255, d[p] * (ar + qr * 1.5) + 34 * qr * qr);
    d[p + 1] = Math.min(255, d[p + 1] * (ag + qg * 1.5) + 34 * qg * qg);
    d[p + 2] = Math.min(255, d[p + 2] * (ab + qb * 1.5) + 34 * qb * qb);
  }
  g.putImageData(img, 0, 0);
}
// a soft cone of light from a lamp down to the ground
function cone(g, x, y0, y1, color) {
  const [r, gg, b] = hexRGB(color).map(v => Math.round(v * 255));
  for (let y = y0; y <= y1; y++) {
    const k = (y - y0) / (y1 - y0), hw = 2 + k * 26;
    for (let i = -hw; i <= hw; i++) {
      const edge = 1 - Math.abs(i) / hw, a = (.16 * (1 - k * .55)) * edge;
      if (dith(Math.round(x + i), y) < a * 2.2) { g.fillStyle = `rgba(${r},${gg},${b},.22)`; g.fillRect(Math.round(x + i), y, 1, 1); }
    }
  }
}

/* ---------- power lines sagging from pole to roof to pole, the way they cross every street in Baghdad ---------- */
function wire(g, x0, y0, x1, y1, sag, c) {
  const n = Math.max(2, Math.abs(x1 - x0));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = Math.round(x0 + (x1 - x0) * t), y = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag);
    g.fillStyle = c; g.fillRect(x, y, 1, 1);
  }
}
function drawWires(g) {
  const { base, house, cafe, mosque } = L;
  const pts = [[-4, base - 150]];
  for (const lx of L.lamps.filter(x => x < house.x)) pts.push([lx + 1, base - 120]);
  pts.push([house.x + 4, base - house.h - 7], [house.x + house.w - 4, base - house.h - 7], [cafe.x - 6, base - 158], [cafe.x + cafe.w + 6, base - 158], [mosque.x + 2, base - 93]);
  for (const lx of L.lamps.filter(x => x > mosque.x)) pts.push([lx + 1, base - 120]);
  pts.push([WW + 4, base - 150]);
  pts.sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], span = x1 - x0;
    if (span < 6) continue;
    wire(g, x0, y0, x1, y1, Math.min(16, span * .12), '#0c0a18');
    wire(g, x0, y0 + 3, x1, y1 + 3, Math.min(18, span * .14), '#100e20');
  }
  // a cable dropping from the line to the house's meter
  wire(g, house.x + house.w - 18, base - house.h - 7, house.x + house.w - 18, base - 66, 0, '#0c0a18');
}

/* ---------- greenery: clustered foliage, ivy down the walls, flowers, grass at the kerb ---------- */
const LEAF = ['#0c2220', '#12342e', '#1a4a3c', '#26624a', '#3f8258', '#6aa868'];
function leafClump(g, x, y, tone) {
  const c = LEAF[Math.max(0, Math.min(LEAF.length - 1, tone))], hi = LEAF[Math.min(LEAF.length - 1, tone + 1)];
  rect(g, x + 1, y, 3, 1, c); rect(g, x, y + 1, 5, 2, c); rect(g, x + 1, y + 3, 3, 1, c);
  rect(g, x + 1, y + 1, 2, 1, hi);
}
function drawTree(g, x, base, R) {
  // trunk with bark, roots, a grate
  rect(g, x - 2, base - 30, 4, 30, '#2a1d16'); rect(g, x - 2, base - 30, 1, 30, '#3a2a1e'); rect(g, x + 1, base - 30, 1, 30, '#1a120d');
  for (let y = base - 28; y < base; y += 4) rect(g, x - 1, y, 1, 2, '#1a120d');
  rect(g, x - 4, base - 2, 3, 2, '#2a1d16'); rect(g, x + 2, base - 2, 3, 2, '#2a1d16');
  rect(g, x - 7, base, 15, 1, '#3a3050'); for (let i = -6; i < 8; i += 2) rect(g, x + i, base, 1, 1, '#15122a');
  // canopy: clumps from back and dark to front and lit (the light comes from above-left)
  const cx = x, cy = base - 44;
  for (let pass = 0; pass < 3; pass++) {
    const n = 26 + pass * 10;
    for (let k = 0; k < n; k++) {
      const a = R() * Math.PI * 2, r = Math.sqrt(R()), px = Math.round(cx + Math.cos(a) * r * (20 - pass * 3)), py = Math.round(cy + Math.sin(a) * r * (15 - pass * 2));
      const lit = (cx - px) * .04 + (cy - py) * .06;
      leafClump(g, px - 2, py - 2, Math.round(pass + lit + R() * .8));
    }
  }
  // a few leaves hanging loose
  for (let k = 0; k < 6; k++) rect(g, cx - 18 + Math.floor(R() * 36), cy + 12 + Math.floor(R() * 6), 1, 2, LEAF[2]);
}
function ivy(g, x, y0, len, R, flowers) {
  let vx = x;
  for (let y = y0; y < y0 + len; y++) {
    if (R() < .25) vx += R() < .5 ? -1 : 1;
    rect(g, vx, y, 1, 1, '#1a3a2c');
    if (y % 3 === 0) {
      const side = (y / 3) % 2 ? 1 : -3;
      rect(g, vx + side, y, 3, 2, LEAF[2 + Math.floor(R() * 3)]);
      rect(g, vx + side + 1, y, 1, 1, LEAF[4]);
      if (flowers && R() < .12) rect(g, vx + side + 1, y + 1, 1, 1, R() < .5 ? '#e83a5a' : '#f0e0b0');
    }
  }
}
function pot(g, x, y, R) {
  rect(g, x, y - 5, 7, 5, '#b0603a'); rect(g, x, y - 5, 7, 1, '#d08050'); rect(g, x + 6, y - 4, 1, 4, '#80402a');
  for (let k = 0; k < 7; k++) rect(g, x + Math.floor(R() * 7), y - 7 - Math.floor(R() * 4), 1, 2, LEAF[2 + Math.floor(R() * 3)]);
  rect(g, x + 1 + Math.floor(R() * 5), y - 10, 2, 2, R() < .6 ? '#e83a5a' : '#f4e6c0');
  rect(g, x + Math.floor(R() * 6), y - 9, 1, 1, '#ffd0a0');
}
function drawGreenery(g, R) {
  const { house, mosque, cafe, base } = L, ht = base - house.h;
  // ivy hanging from the house parapet and down the mosque's corner
  ivy(g, house.x + 3, ht - 2, 60, R, true);
  ivy(g, house.x + house.w - 8, ht - 2, 26, R, false);
  ivy(g, mosque.x + 2, base - 62, 46, R, true);
  ivy(g, cafe.x + cafe.w - 3, base - 98, 34, R, false);
  // grass where pavement meets wall and kerb
  for (let x = 0; x < WW; x += 1) {
    if (R() < .18) {
      const h = 1 + Math.floor(R() * 4);
      rect(g, x, base - h + 1, 1, h, R() < .5 ? LEAF[2] : LEAF[3]);
    }
    if (R() < .06) { const h = 1 + Math.floor(R() * 3); rect(g, x, base + 7 - h, 1, h, LEAF[1]); }
  }
  // a bush by the mosque door
  for (const bx of [mosque.x + 56, mosque.x + 128]) for (let k = 0; k < 12; k++) leafClump(g, bx + Math.floor(R() * 14), base - 9 + Math.floor(R() * 5), 1 + Math.floor(R() * 3));
}


/* ---------- the café: a two-storey corner café. Red brick above with arched lit windows and the neon name;
   below, an emerald wooden shopfront with gold lines, a scalloped awning strung with bulbs, deep windows
   that show the very room you enter, a swinging blade sign and a little table outside under the rain. ---------- */
function drawCafe(g, R) {
  const { x, base, w } = L.cafe, top = base - 150, mid = base - 92, O = P.out;
  // upper storey: red brick, each brick its own tone
  rect(g, x, top, w, mid - top, '#4a2226');
  for (let r = 0; r * 5 < mid - top; r++) {
    const y = top + r * 5, off = (r & 1) * 5;
    for (let i = -off; i < w; i += 10) {
      const bx = x + Math.max(0, i), bw = Math.min(9, x + w - bx) - (i < 0 ? off : 0);
      if (bw <= 0) continue;
      rect(g, bx, y, bw, 4, ['#5a2a2c', '#522628', '#62302f', '#4c2426'][Math.floor(R() * 4)]);
      rect(g, bx, y, bw, 1, '#6a3634');
    }
  }
  // stone cornice with dentils
  rect(g, x - 6, top - 8, w + 12, 8, '#5a4e54'); rect(g, x - 6, top - 8, w + 12, 1, '#7a6e74'); rect(g, x - 6, top - 1, w + 12, 1, '#3a3036');
  for (let i = x - 4; i < x + w + 4; i += 5) rect(g, i, top, 3, 3, '#4a3e44');
  frame(g, x - 7, top - 9, w + 14, 10, O);
  frame(g, x - 1, top, w + 2, mid - top + 1, O);

  // two arched windows upstairs, lit, with curtains and flower boxes
  for (const wx of [x + 22, x + w - 56]) {
    const wy = top + 12, ww = 34, wh = 36;
    for (let j = 0; j < wh; j++) {
      const ins = j < ww / 2 ? Math.round(ww / 2 - Math.sqrt(Math.max(0, (ww / 2) ** 2 - (ww / 2 - j) ** 2))) : 0;
      if (j > 10) { /* below the arch */ }
      for (let i = ins; i < ww - ins; i++) rect(g, wx + i, wy + j, 1, 1, dith(i, j) < j / wh * .8 ? '#c87a2a' : '#f0a848');
      if (ins < ww / 2) { rect(g, wx + ins - 1, wy + j, 1, 1, O); rect(g, wx + ww - ins, wy + j, 1, 1, O); }
    }
    for (let j = 6; j < wh; j++) { rect(g, wx + 2, wy + j, 5, 1, j % 2 ? '#8c1440' : '#6a0f30'); rect(g, wx + ww - 7, wy + j, 5, 1, j % 2 ? '#8c1440' : '#6a0f30'); }
    rect(g, wx + ww / 2, wy + 4, 1, wh - 4, '#3a2418'); rect(g, wx + 2, wy + 20, ww - 4, 1, '#3a2418');
    rect(g, wx - 3, wy + wh, ww + 6, 5, '#3a2418'); rect(g, wx - 3, wy + wh, ww + 6, 1, '#5a4030'); frame(g, wx - 4, wy + wh - 1, ww + 8, 7, O);
    for (let k = 0; k < 14; k++) leafClump(g, wx - 2 + Math.floor(R() * (ww + 2)), wy + wh - 5 + Math.floor(R() * 3), 2 + Math.floor(R() * 3));
    for (let k = 0; k < 6; k++) rect(g, wx + Math.floor(R() * ww), wy + wh - 5 + Math.floor(R() * 3), 2, 2, R() < .5 ? '#ff5a7a' : '#fff0c8');
    L.lights.push({ x: wx + ww / 2, y: wy + 20, rx: 34, ry: 30, c: '#ffae52', i: .8 });
  }

  // the neon name between the upper windows, on a dark board
  const sw = 100, sh = 26, sxp = Math.round(x + w / 2 - sw / 2), sy = top + 16;
  rect(g, sxp, sy, sw, sh, '#120a12'); frame(g, sxp - 1, sy - 1, sw + 2, sh + 2, O); frame(g, sxp, sy, sw, sh, '#2a1a24');
  for (const [bx, by] of [[2, 2], [sw - 3, 2], [2, sh - 3], [sw - 3, sh - 3]]) rect(g, sxp + bx, sy + by, 1, 1, '#8a7a98');
  L.sign = { x: sxp, y: sy, w: sw, h: sh };
  L.lights.push({ x: sxp + sw / 2, y: sy + 13, rx: 80, ry: 44, c: '#ff3f88', i: .55 });

  // ground storey: the emerald wooden shopfront
  rect(g, x, mid, w, base - mid, '#1e4a3a');
  rect(g, x, mid, w, 12, '#173a2e'); rect(g, x, mid, w, 1, '#2e6a52'); rect(g, x, mid + 11, w, 1, '#c8a050');
  for (const px of [x, x + 84, x + 124, x + w - 4]) { rect(g, px, mid + 12, 4, base - mid - 12, '#1a4234'); rect(g, px, mid + 12, 1, base - mid - 12, '#2e6a52'); rect(g, px + 3, mid + 12, 1, base - mid - 12, '#0f2a20'); }
  frame(g, x - 1, mid - 1, w + 2, base - mid + 1, O);
  // gold lettering on the fascia: what the café serves
  const fascia = lang === 'ar' ? 'قهوة  ·  شاي  ·  كتب' : 'COFFEE · TEA · BOOKS';
  text(g, fascia, x + w / 2, mid + 10, '#5a4010');
  text(g, fascia, x + w / 2, mid + 9, '#e8c060');

  // the awning: cream and crimson stripes, a scalloped edge, a string of bulbs
  const cy = mid + 13, cx0 = x - 6, cw = w + 12;
  for (let j = 0; j < 9; j++) { const inset = Math.max(0, 3 - j); for (let i = inset; i < cw - inset; i++) rect(g, cx0 + i, cy + j, 1, 1, ((i >> 3) & 1) ? '#e8dcc0' : '#a3163e'); }
  for (let i = 0; i < cw; i += 8) rect(g, cx0 + i, cy + 1, 1, 7, 'rgba(0,0,0,.18)');
  rect(g, cx0, cy - 1, cw, 1, O); rect(g, cx0, cy, cw, 1, '#ffffff');
  for (let i = 0; i < cw; i++) { const k = i % 8, d = k === 0 || k === 7 ? 0 : k === 1 || k === 6 ? 1 : 2; rect(g, cx0 + i, cy + 9, 1, d, ((i >> 3) & 1) ? '#e8dcc0' : '#a3163e'); rect(g, cx0 + i, cy + 9 + d, 1, 1, O); }
  dither(g, x, cy + 12, w, 4, '#0a1a14', .6);
  for (let i = 4; i < cw - 2; i += 8) {
    const sag = Math.round(Math.sin(((i % 32) / 32) * Math.PI) * 3), by = cy + 14 + sag;
    rect(g, cx0 + i - 4, by - 1, 8, 1, '#1a1014');
    rect(g, cx0 + i, by, 1, 1, '#1a1014'); rect(g, cx0 + i, by + 1, 1, 2, i % 16 ? '#ffd27a' : '#ff8ab0');
  }
  L.bulbs = { x: cx0, y: cy + 14, w: cw };
  L.lights.push({ x: x + w / 2, y: cy + 16, rx: 120, ry: 18, c: '#ffd27a', i: .5 });

  // the big windows: the table by the window on the left, the counter on the right
  drawWindow(g, x + 8, base - 60, 72, 50, 'cup', R);
  drawWindow(g, x + w - 80, base - 60, 72, 50, 'books', R);
  for (const wx of [x + 8, x + w - 80]) {
    rect(g, wx - 2, base - 9, 76, 4, '#173a2e'); rect(g, wx - 2, base - 9, 76, 1, '#c8a050'); frame(g, wx - 3, base - 10, 78, 6, O);
    L.lights.push({ x: wx + 36, y: base - 36, rx: 62, ry: 40, c: '#ffae52', i: .95 });
  }

  // the door: arched glass on top, brass handle, a little "open" plaque, step and mat
  const D = L.doorBox;
  rect(g, D.x - 3, D.y - 6, D.w + 6, 6, '#173a2e'); rect(g, D.x - 3, D.y - 6, D.w + 6, 1, '#c8a050');
  frame(g, D.x - 3, D.y - 3, D.w + 6, D.h + 3, O);
  rect(g, D.x - 7, base - 1, D.w + 14, 2, P.paveL); rect(g, D.x - 7, base + 1, D.w + 14, 1, O);
  rect(g, D.x + 3, base - 1, D.w - 6, 1, '#5a1a2a');
  L.lights.push({ x: D.x + D.w / 2, y: base - 22, rx: 26, ry: 30, c: '#ffae52', i: .5 });

  // potted bay trees either side of the door
  for (const px of [D.x - 15, D.x + D.w + 4]) {
    rect(g, px, base - 9, 11, 9, '#6a3a24'); rect(g, px, base - 9, 11, 1, '#8a5232'); frame(g, px - 1, base - 10, 13, 11, O);
    rect(g, px + 5, base - 22, 1, 13, '#3a2a1e');
    for (let k = 0; k < 12; k++) leafClump(g, px - 3 + Math.floor(R() * 13), base - 32 + Math.floor(R() * 12), 2 + Math.floor(R() * 3));
  }

  // a little table outside under the awning, two chairs, a cup (it steams)
  const tx = x + 20, ty = base + 3;
  rect(g, tx, ty - 11, 20, 2, '#2a2a30'); rect(g, tx + 9, ty - 9, 2, 9, '#2a2a30'); rect(g, tx + 5, ty, 10, 1, '#2a2a30');
  frame(g, tx - 1, ty - 12, 22, 4, O);
  for (const [chx, flip] of [[tx - 9, 0], [tx + 24, 1]]) {
    rect(g, chx, ty - 6, 7, 2, '#3a3a44'); rect(g, chx + (flip ? 6 : 0), ty - 16, 1, 16, '#3a3a44'); rect(g, chx + (flip ? 0 : 6), ty - 4, 1, 4, '#3a3a44');
  }
  rect(g, tx + 7, ty - 15, 4, 3, '#f4ecd8'); rect(g, tx + 11, ty - 14, 1, 2, '#f4ecd8'); rect(g, tx + 6, ty - 12, 6, 1, '#c8b898');
  L.cupOut = { x: tx + 9, y: ty - 16 };

  // the blade sign's bracket (the sign itself swings, drawn each frame)
  const bxp = x + w + 1, byp = mid - 6;
  rect(g, bxp, byp, 14, 2, '#1a1014'); rect(g, bxp + 13, byp - 4, 2, 6, '#1a1014'); rect(g, bxp, byp - 3, 1, 5, '#1a1014');
  L.blade = { x: bxp + 7, y: byp + 2 };
}

function drawWindow(g, x, y, w, h, kind, R) {
  // warm interior, darker toward the floor, a checkered floor at the bottom like the room inside
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const f = j / h;
    g.fillStyle = f > .82 ? ((((x + i) >> 2) + ((y + j) >> 2)) & 1 ? '#3a1e10' : '#c89a5a') : dith(x + i, y + j) < (f - .1) * 1.2 ? '#b0601c' : '#d88a30';
    g.fillRect(x + i, y + j, 1, 1);
  }
  // back-wall brick line and pendant lamps
  rect(g, x, y + 22, w, 1, '#9a5018');
  for (const lx of [x + 14, x + w / 2, x + w - 14]) {
    rect(g, lx, y, 1, 9, '#3a1a08'); rect(g, lx - 3, y + 9, 7, 2, '#1e1008'); rect(g, lx - 2, y + 11, 5, 1, '#fff0c0');
    glow(g, lx, y + 15, 10, 8, '#ffd27a', .7);
  }
  if (kind === 'cup') {
    // the booth by the window: a table, two cups, a book, a plant on the sill
    rect(g, x + 10, y + h - 17, 36, 2, '#3a1a08'); rect(g, x + 26, y + h - 15, 2, 9, '#3a1a08');
    rect(g, x + 4, y + h - 26, 4, 18, '#7a1238'); rect(g, x + 48, y + h - 26, 4, 18, '#7a1238');
    rect(g, x + 16, y + h - 21, 5, 4, '#f4ecd8'); rect(g, x + 21, y + h - 20, 1, 2, '#f4ecd8');
    rect(g, x + 33, y + h - 20, 8, 3, '#2a6a8a'); rect(g, x + 33, y + h - 20, 8, 1, '#e8b040');
    rect(g, x + 58, y + h - 22, 6, 6, '#6a3a24'); for (let k = 0; k < 6; k++) rect(g, x + 57 + Math.floor(R() * 8), y + h - 28 + Math.floor(R() * 6), 2, 2, '#3f8258');
    L.cup = { x: x + 18, y: y + h - 22 };
    L.sill = { x: x + 6, y: y + h + 2 };
  } else {
    // the counter: shelves of cups and jars behind it, the espresso machine, the cake dome
    for (const sy of [y + 15, y + 23]) {
      let bx = x + 3;
      while (bx < x + w - 4) { rect(g, bx, sy - 5, 3, 5, ['#f4ecd8', '#e8a040', '#8c1440', '#f4ecd8', '#3f8258'][Math.floor(R() * 5)]); bx += 4; }
      rect(g, x + 2, sy, w - 4, 1, '#3a1a08');
    }
    rect(g, x, y + h - 15, w, 15, '#4a2410'); rect(g, x, y + h - 15, w, 1, '#8a5020');
    rect(g, x + 30, y + h - 28, 16, 13, '#3a3840'); rect(g, x + 30, y + h - 28, 16, 1, '#8a8890'); rect(g, x + 34, y + h - 21, 8, 2, '#1a1a20'); rect(g, x + 36, y + h - 19, 2, 2, '#c8c8d0');
    rect(g, x + 52, y + h - 24, 12, 9, 'rgba(220,240,255,.35)'); rect(g, x + 54, y + h - 20, 8, 5, '#e8c8a8'); rect(g, x + 54, y + h - 20, 8, 1, '#ff8ab0');
    rect(g, x + 8, y + h - 20, 4, 5, '#f4ecd8'); rect(g, x + 14, y + h - 19, 3, 4, '#c06a3a');
  }
  // frame and mullions in the shopfront's green, gold beading
  frame(g, x - 1, y - 1, w + 2, h + 2, P.out);
  rect(g, x - 3, y - 3, w + 6, 2, '#173a2e'); rect(g, x - 3, y - 3, 1, h + 5, '#173a2e'); rect(g, x + w + 2, y - 3, 1, h + 5, '#0f2a20');
  rect(g, x + Math.floor(w / 3), y, 1, h, '#173a2e'); rect(g, x + Math.floor(w * 2 / 3), y, 1, h, '#173a2e');
  rect(g, x, y + 18, w, 1, '#173a2e'); rect(g, x, y + 19, w, 1, '#c8a050');
  // reflections on the glass
  for (let k = 0; k < 9; k++) rect(g, x + 4 + k, y + 14 - k, 1, 1, 'rgba(255,240,220,.35)');
  for (let k = 0; k < 6; k++) rect(g, x + w - 16 + k, y + h - 10 - k, 1, 1, 'rgba(255,240,220,.25)');
}

/* ---------- the owner's house: two floors of Baghdadi brick. Upstairs is his room: the shanasheel is its window,
   the split cooler's outdoor unit hangs beside it. Downstairs: the door and the family room's television glow. ---------- */
function drawHouse(g, R) {
  const { x, w, h } = L.house, base = L.base, top = base - h, O = P.out, mid = top + 58;
  rect(g, x, top, w, h, '#4a3a3a');
  for (let r = 0; r * 4 < h; r++) {
    const y = top + r * 4, off = (r & 1) * 4;
    for (let i = -off; i < w; i += 8) { const bx = x + Math.max(0, i), bw = Math.min(7, x + w - bx); if (bw > 0) rect(g, bx, y, bw, 3, ['#544242', '#4e3c3c', '#5a4646', '#483838'][Math.floor(R() * 4)]); }
  }
  frame(g, x - 1, top, w + 2, h + 1, O);
  // a band of upright bricks between the floors
  rect(g, x - 1, mid, w + 2, 5, '#3a2c2c'); for (let i = 0; i < w; i += 3) rect(g, x + i, mid + 1, 2, 3, '#62504e');
  // parapet
  rect(g, x - 3, top - 6, w + 6, 6, '#3a2c2c'); for (let i = 0; i < w + 6; i += 3) rect(g, x - 3 + i, top - 5, 2, 4, '#5a4646');
  frame(g, x - 4, top - 7, w + 8, 8, O);
  // on the roof: the water tank, a dish, an aerial, a washing line
  const tx = x + w - 34;
  for (const lx of [tx + 2, tx + 20]) rect(g, lx, top - 15, 2, 8, '#2a2a36');
  rect(g, tx, top - 33, 24, 18, '#6a7088'); rect(g, tx, top - 33, 24, 2, '#8a90a8'); rect(g, tx + 22, top - 31, 2, 16, '#4a5068');
  for (const y of [top - 27, top - 21]) rect(g, tx, y, 24, 1, '#4a5068');
  rect(g, tx + 8, top - 35, 8, 2, '#8a90a8'); frame(g, tx - 1, top - 34, 26, 20, O);
  sprite(g, ['..KKK..', '.KMMMK.', 'KMMLMMK', 'KMMMMK.', '.KKKK..', '...K...', '...K...', '..KKK..'], x + 12, top - 15, { K: O, M: '#6a7088', L: '#a0a6be' });
  rect(g, x + 40, top - 24, 1, 17, '#2a2a36'); rect(g, x + 34, top - 22, 13, 1, '#2a2a36'); rect(g, x + 36, top - 18, 9, 1, '#2a2a36');
  rect(g, x + 60, top - 20, 1, 13, '#2a2a36'); rect(g, x + 110, top - 20, 1, 13, '#2a2a36');
  for (let i = 0; i < 50; i++) rect(g, x + 60 + i, top - 20 + Math.round(Math.sin(i / 49 * Math.PI) * 3), 1, 1, '#2a2a36');
  for (const [cx0, c] of [[66, '#c0305a'], [76, '#d8cfb4'], [88, '#3a6ab0'], [98, '#e8b040']]) rect(g, x + cx0, top - 17 + Math.round(Math.sin((cx0 - 60) / 49 * Math.PI) * 3), 6, 7, c);

  // upstairs left: the split cooler's outdoor unit, its pipe running into the room
  const ax = x + 12, ay = top + 14;
  rect(g, ax, ay, 30, 22, '#c8cad8'); rect(g, ax, ay, 30, 2, '#e6e8f0'); rect(g, ax, ay + 20, 30, 2, '#9a9cb0');
  glow(g, ax + 11, ay + 11, 8, 8, '#5a5c70', 2); for (let a = 0; a < 6; a++) rect(g, ax + 11 + Math.round(Math.cos(a) * 4), ay + 11 + Math.round(Math.sin(a) * 4), 2, 1, '#9a9cb0');
  for (let j = 4; j < 19; j += 3) rect(g, ax + 22, ay + j, 6, 1, '#8a8ca0');
  frame(g, ax - 1, ay - 1, 32, 24, O);
  rect(g, ax + 4, ay + 22, 2, 3, '#2a2a36'); rect(g, ax + 24, ay + 22, 2, 3, '#2a2a36'); rect(g, ax + 2, ay + 25, 26, 1, '#2a2a36');
  rect(g, ax + 30, ay + 6, 14, 2, '#9a9cb0'); rect(g, ax + 30, ay + 6, 14, 1, '#c8cad8');
  L.drip = { x: ax + 14, y: ay + 26 };

  // upstairs: the shanasheel, his room's window, lit from inside
  const sx0 = x + 52, sy0 = top + 8, sbw = 96, sbh = 42;
  rect(g, sx0 - 4, sy0 - 5, sbw + 8, 5, '#3a2418'); rect(g, sx0 - 4, sy0 - 5, sbw + 8, 1, '#6a4a32');
  rect(g, sx0, sy0, sbw, sbh, '#4a2e1c');
  for (let p = 0; p < 6; p++) {
    const px = sx0 + 3 + p * 15, pw = 12;
    for (let j = 0; j < sbh - 12; j++) for (let i = 0; i < pw; i++) {
      const lat = (i + j) % 4 === 0 || (i - j + 40) % 4 === 0;
      rect(g, px + i, sy0 + 3 + j, 1, 1, lat ? '#3a2214' : (dith(i, j) < j / sbh ? '#e09a40' : '#ffc86a'));
    }
    frame(g, px - 1, sy0 + 2, pw + 2, sbh - 10, '#2a1a10');
  }
  rect(g, sx0, sy0 + sbh - 8, sbw, 8, '#3a2418'); for (let i = 2; i < sbw; i += 4) rect(g, sx0 + i, sy0 + sbh - 7, 2, 6, '#5a3a24');
  for (let i = 0; i < sbw; i += 8) rect(g, sx0 + i + 3, sy0 + sbh, 2, 4, '#3a2418');
  frame(g, sx0 - 1, sy0 - 1, sbw + 2, sbh + 2, O);
  L.lights.push({ x: sx0 + sbw / 2, y: sy0 + 18, rx: 74, ry: 40, c: '#ffae52', i: .95 });
  for (let k = 0; k < 7; k++) pot(g, sx0 + 5 + k * 13, sy0 + sbh + 10, R);
  // a small bathroom window on the right
  rect(g, x + w - 26, top + 20, 12, 14, '#2a3456'); for (let i = 1; i < 12; i += 3) rect(g, x + w - 26 + i, top + 20, 1, 14, '#3a4466');
  frame(g, x + w - 27, top + 19, 14, 16, O); rect(g, x + w - 28, top + 34, 16, 2, '#5a4646');

  // downstairs: the door with its lamp, the family room's window flickering with television
  const D = L.houseDoor;
  rect(g, D.x - 4, D.y - 5, D.w + 8, 5, '#3a2c2c');
  rect(g, D.x, D.y, D.w, D.h, '#4a2e1c');
  rect(g, D.x + Math.floor(D.w / 2), D.y, 1, D.h, '#2a1a10');
  for (let j = 5; j < D.h - 3; j += 6) for (const i of [3, D.w - 4]) rect(g, D.x + i, D.y + j, 1, 1, '#c8a050');
  rect(g, D.x + D.w / 2 - 3, D.y + 22, 2, 2, '#e8c060'); rect(g, D.x + D.w / 2 + 2, D.y + 22, 2, 2, '#e8c060');
  frame(g, D.x - 1, D.y - 1, D.w + 2, D.h + 1, O);
  rect(g, D.x - 5, base - 1, D.w + 10, 2, P.paveL);
  rect(g, D.x + D.w / 2 - 2, D.y - 11, 5, 4, '#2a2a36'); rect(g, D.x + D.w / 2 - 1, D.y - 8, 3, 2, '#ffe2a0');
  L.lights.push({ x: D.x + D.w / 2, y: D.y - 5, rx: 24, ry: 28, c: '#ffc860', i: .75 });
  const wx = x + 66, wy = base - 40, ww = 70, wh = 24;
  L.tvWin = { x: wx, y: wy, w: 30, h: 18 };
  rect(g, wx, wy, ww, wh, '#1d1838');
  rect(g, wx - 3, wy - 3, ww + 6, 2, '#3a2c2c'); frame(g, wx - 1, wy - 1, ww + 2, wh + 2, O);
  for (let i = 3; i < ww; i += 5) rect(g, wx + i, wy, 1, wh, '#2a2a36');
  rect(g, wx, wy + 11, ww, 1, '#2a2a36');
  rect(g, wx - 3, wy + wh + 1, ww + 6, 2, '#5a4646');
  L.lights.push({ x: wx + 20, y: wy + 12, rx: 40, ry: 22, c: '#8a6aff', i: .55 });
  L.lights.push({ x: wx + 55, y: wy + 12, rx: 30, ry: 20, c: '#ffae52', i: .35 });
  // electricity meter and its wires
  rect(g, x + w - 22, base - 50, 10, 13, '#5a6070'); rect(g, x + w - 20, base - 47, 6, 3, '#c8d0a0'); frame(g, x + w - 23, base - 51, 12, 15, O);
  rect(g, x + w - 18, base - 66, 1, 15, '#1a1a24');
}

/* ---------- the mosque: dressed stone, a tiled portal under a ribbed dome, four lattice windows, a tall minaret ---------- */
function drawMosque(g, R) {
  const { x, w } = L.mosque, base = L.base, bodyH = 84, top = base - bodyH, O = P.out;
  const mw = 16, mx = x + w - mw - 1, bw = w - mw - 6;
  rect(g, x, top, bw, bodyH, '#4a4458');
  for (let r = 0; r * 6 < bodyH; r++) {
    const y = top + r * 6, off = (r & 1) * 7;
    rect(g, x, y, bw, 1, '#3a3448');
    for (let i = off; i < bw; i += 14) rect(g, x + i, y + 1, 1, 5, '#3a3448');
    for (let i = 0; i < bw; i += 3) if (R() < .25) rect(g, x + i, y + 2 + Math.floor(R() * 3), 1, 1, '#56506a');
  }
  // tile dado along the foot of the wall, the same tiles as inside
  rect(g, x, base - 12, bw, 12, '#1f5a6a');
  for (let i = 0; i < bw; i += 6) { rect(g, x + i + 1, base - 10, 4, 4, '#2f7a8a'); rect(g, x + i + 2, base - 9, 2, 2, '#e8c060'); }
  rect(g, x, base - 12, bw, 1, '#e8c060');
  frame(g, x - 1, top, bw + 2, bodyH + 1, O);
  rect(g, x - 2, top - 5, bw + 4, 5, '#3a3448'); rect(g, x - 2, top - 3, bw + 4, 2, '#1f5a6a');
  for (let i = 0; i < bw + 4; i += 4) rect(g, x - 2 + i, top - 3, 2, 1, '#e8c060');
  for (let i = 0; i < bw + 2; i += 6) { rect(g, x - 1 + i, top - 9, 4, 4, '#4a4458'); rect(g, x - 1 + i, top - 9, 4, 1, '#5a546c'); }

  // ribbed dome on a windowed drum
  const dcx = x + Math.floor(bw / 2), r = 40, drumY = top - 10;
  rect(g, dcx - r + 4, drumY, (r - 4) * 2, 9, '#3a3448');
  for (let i = dcx - r + 8; i < dcx + r - 8; i += 7) { rect(g, i, drumY + 2, 3, 6, '#f2cc7a'); rect(g, i + 1, drumY + 2, 1, 1, '#3a3448'); }
  frame(g, dcx - r + 3, drumY - 1, (r - 3) * 2 + 2, 11, O);
  for (let j = 0; j <= r; j++) {
    const hw = Math.round(Math.sqrt(r * r - j * j)), y = drumY - j;
    for (let i = -hw; i < hw; i++) {
      const u = i / (hw || 1) * 5, rib = Math.abs(u - Math.round(u)) < .1;
      const lit = (i + hw) / (hw * 2 || 1) < .4 && j > 3;
      rect(g, dcx + i, y, 1, 1, rib ? '#123040' : lit ? (dith(dcx + i, y) < .5 ? '#2f6a80' : '#245468') : '#1c4052');
    }
    rect(g, dcx - hw - 1, y, 1, 1, O); rect(g, dcx + hw, y, 1, 1, O);
  }
  rect(g, dcx - 2, drumY - r - 1, 4, 1, O);
  rect(g, dcx, drumY - r - 9, 1, 8, '#e8c060'); rect(g, dcx - 1, drumY - r - 5, 3, 2, '#e8c060');
  sprite(g, CRESCENT, dcx - 1, drumY - r - 15, { G: '#ffd27a' });
  L.lights.push({ x: dcx, y: drumY + 4, rx: 50, ry: 12, c: '#f2cc7a', i: .5 });

  const arch = (ax, ay, aw, ah, fill) => {
    for (let j = 0; j < ah; j++) {
      const ins = j < aw / 2 ? Math.round(aw / 2 - Math.sqrt(Math.max(0, (aw / 2) ** 2 - (aw / 2 - j) ** 2)) * .9) : 0;
      for (let i = ins; i < aw - ins; i++) rect(g, ax + i, ay + j, 1, 1, typeof fill === 'function' ? fill(i, j) : fill);
      if (ins < aw / 2) { rect(g, ax + ins - 1, ay + j, 1, 1, O); rect(g, ax + aw - ins, ay + j, 1, 1, O); }
    }
    rect(g, ax, ay + ah, aw, 1, O);
  };
  // the portal
  const D = L.mosqueDoor, pw = 40, px = dcx - pw / 2, py = base - 62;
  D.x = dcx - 11; D.y = base - 38; D.w = 22; D.h = 38;
  rect(g, px, py, pw, 62, '#1f5a6a');
  for (let j = 0; j < 62; j += 3) for (let i = (j / 3 & 1) * 3; i < pw; i += 6) { rect(g, px + i, py + j, 2, 2, '#2f7a8a'); rect(g, px + i + 1, py + j + 1, 1, 1, '#e8c060'); }
  frame(g, px - 1, py - 1, pw + 2, 63, O); frame(g, px + 2, py + 2, pw - 4, 60, '#e8c060');
  arch(D.x - 3, D.y - 9, D.w + 6, D.h + 9, (i, j) => j < 11 ? (dith(i, j) < .5 ? '#2a2236' : '#3a3448') : '#3a2418');
  rect(g, D.x + D.w / 2, D.y, 1, D.h, '#22140c');
  for (let j = 6; j < D.h; j += 6) { rect(g, D.x + 3, D.y + j, 1, 1, '#e8c060'); rect(g, D.x + D.w - 4, D.y + j, 1, 1, '#e8c060'); }
  rect(g, D.x - 6, base - 1, D.w + 12, 2, P.paveL);
  rect(g, dcx - 1, py + 6, 3, 4, '#ffe2a0');
  L.lights.push({ x: dcx, y: py + 10, rx: 26, ry: 28, c: '#f2cc7a', i: .75 });
  // four arched lattice windows, the ones you see again from inside the hall
  const winXs = [x + 8, x + 34, x + bw - 50, x + bw - 24];
  for (const wx of winXs) {
    arch(wx, top + 18, 16, 38, (i, j) => ((i + j) % 4 === 0 || (i - j + 40) % 4 === 0) ? '#6a4a30' : (dith(i, j) < j / 38 * .6 ? '#d8a050' : '#f8d890'));
    rect(g, wx - 2, top + 57, 20, 2, '#5a546c');
    L.lights.push({ x: wx + 8, y: top + 38, rx: 24, ry: 30, c: '#f2cc7a', i: .6 });
  }

  // minaret
  const mH = Math.min(192, base - 22), mTop = base - mH;
  const b1 = base - Math.round(mH * .66), b2 = base - Math.round(mH * .84);
  rect(g, mx, b1, mw, base - b1, '#4a4458'); rect(g, mx, b1, 2, base - b1, '#5a546c'); rect(g, mx + mw - 2, b1, 2, base - b1, '#3a3448');
  frame(g, mx - 1, b1 - 1, mw + 2, base - b1 + 2, O);
  for (const by of [base - 44, base - Math.round(mH * .42)]) { rect(g, mx, by, mw, 4, '#1f5a6a'); for (let i = 1; i < mw; i += 3) rect(g, mx + i, by + 1, 1, 2, '#e8c060'); }
  for (let y = b1 + 10; y < base - 10; y += 20) rect(g, mx + 6, y, 3, 6, '#f2cc7a');
  const balcony = by => {
    rect(g, mx - 4, by, mw + 8, 3, '#3a3448'); frame(g, mx - 5, by - 1, mw + 10, 5, O);
    rect(g, mx - 4, by - 5, mw + 8, 1, O); for (let i = -4; i < mw + 4; i += 2) rect(g, mx + i, by - 4, 1, 4, O);
  };
  balcony(b1 - 2);
  L.minaretLights = { x: mx - 4, y: b1 + 1, w: mw + 8 };
  rect(g, mx + 2, b2, mw - 4, b1 - b2 - 2, '#4a4458'); rect(g, mx + 2, b2, 1, b1 - b2 - 2, '#5a546c'); frame(g, mx + 1, b2 - 1, mw - 2, b1 - b2, O);
  balcony(b2 - 2);
  rect(g, mx + 4, mTop + 12, mw - 8, b2 - mTop - 14, '#3a3448'); rect(g, mx + 5, mTop + 15, mw - 10, Math.max(2, b2 - mTop - 20), '#ffe2a0'); frame(g, mx + 3, mTop + 11, mw - 6, b2 - mTop - 12, O);
  for (let j = 0; j < 11; j++) { const hw = Math.max(0, Math.round((mw - 6) / 2 * (j / 11))); rect(g, mx + mw / 2 - hw - 1, mTop + j + 1, hw * 2 + 2, 1, j === 10 ? O : '#1c4052'); }
  rect(g, mx + mw / 2 - 1, mTop - 5, 1, 6, '#e8c060');
  sprite(g, CRESCENT, mx + mw / 2 - 2, mTop - 11, { G: '#ffd27a' });
  L.lights.push({ x: mx + mw / 2, y: b1 + 1, rx: 26, ry: 14, c: '#ffe2a0', i: .6 });
  L.lights.push({ x: mx + mw / 2, y: mTop + 18, rx: 18, ry: 16, c: '#ffe2a0', i: .8 });
}

function drawMailbox(g) {
  const x = L.house.x + 50, base = L.base;
  rect(g, x + 3, base - 10, 2, 10, P.out);
  rect(g, x, base - 19, 9, 9, P.crimson); rect(g, x, base - 19, 9, 1, P.fuchsiaD);
  rect(g, x + 2, base - 16, 5, 1, P.out);
  frame(g, x - 1, base - 20, 11, 11, P.out);
  rect(g, x + 9, base - 18, 1, 4, P.gold);
}

function drawBench(g, x, base) {
  rect(g, x, base - 7, 20, 2, P.woodL); rect(g, x, base - 5, 20, 1, P.woodD);
  rect(g, x, base - 13, 20, 2, P.wood); rect(g, x, base - 10, 20, 1, P.wood);
  for (const lx of [x + 2, x + 17]) rect(g, lx, base - 13, 1, 13, '#0e0d1a');
  frame(g, x - 1, base - 8, 22, 4, P.out);
  dither(g, x, base - 4, 20, 1, P.goldM, .2);
}


/* ---------- per-frame layers (drawn in world space) ---------- */
function drawDoor(g) {
  const D = L.doorBox, t = door;
  rect(g, D.x, D.y, D.w, D.h, P.amberD);
  if (t > 0) {
    for (let j = 0; j < D.h; j++) for (let i = 0; i < D.w; i++)
      if (dith(D.x + i, D.y + j) < t * (1 - j / D.h * .5)) rect(g, D.x + i, D.y + j, 1, 1, j < D.h * .8 ? P.warm : P.amber);
    for (let j = 0; j < 9; j++) {
      const sp = Math.round(j * 1.6), y = L.base + j - 1;
      for (let i = -sp; i < D.w + sp; i++) if (dith(D.x + i, y) < t * .75 * (1 - j / 9)) rect(g, D.x + i, y, 1, 1, P.goldM);
    }
  }
  const lw = Math.max(3, Math.round(D.w * (1 - .78 * t)));
  rect(g, D.x, D.y, lw, D.h, P.wood);
  if (lw > 8) {
    const gx = D.x + 3, gw = lw - 6;
    for (let j = 0; j < 20; j++) for (let i = 0; i < gw; i++)
      rect(g, gx + i, D.y + 4 + j, 1, 1, dith(gx + i, j) < .25 + j / 40 ? P.goldM : P.gold);
    frame(g, gx - 1, D.y + 3, gw + 2, 22, P.woodD);
    frame(g, gx - 1, D.y + 29, gw + 2, 18, P.woodD);
    rect(g, D.x + lw - 4, D.y + 30, 2, 2, P.gold);
  }
  if (t < .35) plaque(g, SITE.ui[lang].door, D.x + D.w / 2, D.y + 8, hover === 99);
  rect(g, D.x + lw, D.y, 1, D.h, P.out);
}

function drawLife(g) {
  // television glow flickering in the house
  const tv = L.tvWin, k = motion.matches ? .5 : (Math.sin(time * 7) * .5 + Math.sin(time * 2.3) * .5 + 1) / 2;
  for (const half of [0, 16]) dither(g, tv.x + half, tv.y, 14, 18, P.tv, .35 + k * .45);
  rect(g, tv.x + 15, tv.y, 1, 18, P.wood);

  // the cooler drips
  if (!motion.matches) {
    const p = (time * .7) % 1;
    if (p < .6) rect(g, L.drip.x, L.drip.y + Math.round(p * p * 40), 1, 2, 'rgba(160,190,240,.7)');
  }

  // minaret lights breathe slowly
  const m = L.minaretLights, b = motion.matches ? 1 : .75 + Math.sin(time * 1.2) * .25;
  g.globalAlpha = b;
  for (let i = 0; i < m.w; i += 2) rect(g, m.x + i, m.y, 1, 1, '#ffe2a0');
  g.globalAlpha = 1;

  // a brass lantern on the café's sill, its candle breathing; touched, it flares
  const s = L.sill, lx = s.x + 3, ly = s.y - 11, fl = motion.matches ? 0 : Math.sin(time * 9) * .5 + Math.sin(time * 3.1) * .5;
  glow(g, lx + 3, ly + 6, 7 + Math.round(lantern * 6), 6 + Math.round(lantern * 5), '#ffcf7a', .5 + lantern * .6);
  rect(g, lx + 2, ly - 2, 3, 1, '#8a6a30'); rect(g, lx + 3, ly - 3, 1, 1, '#8a6a30');
  rect(g, lx, ly, 7, 2, '#a07a34'); rect(g, lx + 1, ly + 2, 5, 7, '#2a2010'); rect(g, lx, ly + 9, 7, 2, '#a07a34');
  rect(g, lx + 2, ly + 3, 3, 5, fl > .3 || lantern > 0 ? '#ffe08a' : '#ffc860'); rect(g, lx + 3, ly + 4, 1, 3, '#fff6d0');
  rect(g, lx + 1, ly + 2, 1, 7, '#c8a050'); rect(g, lx + 5, ly + 2, 1, 7, '#c8a050');
  frame(g, lx - 1, ly - 1, 9, 13, 'rgba(13,10,25,.7)');
}

// a lit station clock on an iron bracket off the café's upper corner; it keeps real time, second hand and all
let clockShow = 0;
function drawClock(g) {
  const c = L.cafe, cx = c.x + c.w + 13, cy = c.base - 124, R = 10, O = P.out;
  rect(g, c.x + c.w, cy - 1, 4, 2, '#1a1014'); rect(g, c.x + c.w, cy - 7, 1, 13, '#1a1014'); rect(g, c.x + c.w + 1, cy - 5, 1, 1, '#1a1014'); rect(g, c.x + c.w + 1, cy + 4, 1, 1, '#1a1014');
  glow(g, cx, cy, R + 6, R + 6, '#ffe9b0', .5);
  for (let j = -R - 2; j <= R + 2; j++) { const hw = Math.round(Math.sqrt(Math.max(0, (R + 2) ** 2 - j * j))); rect(g, cx - hw, cy + j, hw * 2 + 1, 1, O); }
  for (let j = -R - 1; j <= R + 1; j++) { const hw = Math.round(Math.sqrt(Math.max(0, (R + 1) ** 2 - j * j))); rect(g, cx - hw, cy + j, hw * 2 + 1, 1, '#c8961a'); }
  for (let j = -R + 1; j <= R - 1; j++) { const hw = Math.round(Math.sqrt(Math.max(0, (R - 1) ** 2 - j * j))); rect(g, cx - hw, cy + j, hw * 2 + 1, 1, j < -3 ? '#fffaf0' : '#f4ecd8'); }
  // twelve marks, the quarters longer
  for (let h = 0; h < 12; h++) {
    const a = h / 6 * Math.PI, q = h % 3 === 0;
    for (let s = q ? 6 : 7; s <= 8; s++) rect(g, cx + Math.round(Math.sin(a) * s), cy - Math.round(Math.cos(a) * s), 1, 1, q ? '#1a1014' : '#8a7a68');
  }
  const d = new Date(), sec = d.getSeconds(), mn = d.getMinutes() + sec / 60, hr = d.getHours() % 12 + mn / 60;
  const hand = (ang, len, col) => { for (let s = 0; s <= len; s++) rect(g, cx + Math.round(Math.sin(ang) * s), cy - Math.round(Math.cos(ang) * s), 1, 1, col); };
  hand(hr / 6 * Math.PI, 4, '#1a1014'); hand(hr / 6 * Math.PI + .12, 3, '#1a1014');
  hand(mn / 30 * Math.PI, 7, '#1a1014');
  if (!motion.matches) hand(sec / 30 * Math.PI, 7, '#d81e3a');
  rect(g, cx, cy, 1, 1, '#c8961a');
  // touched: the time in figures on a little plaque beneath
  if (clockShow > 0) {
    const tt = d.toLocaleTimeString(lang === 'ar' ? 'ar' : 'en', { hour: 'numeric', minute: '2-digit' });
    plaque(g, tt, cx, cy + R + 4, true);
  }
}
function drawBlade(g) {
  const b = L.blade; if (!b) return;
  const a = motion.matches ? 0 : Math.sin(time * 1.3) * .12 + (bladeKick > 0 ? Math.sin(time * 14) * bladeKick : 0);
  const ox = Math.round(Math.sin(a) * 9);
  rect(g, b.x - 5, b.y, 1, 3, '#1a1014'); rect(g, b.x + 5, b.y, 1, 3, '#1a1014');
  const sx0 = b.x - 9 + ox, sy0 = b.y + 3;
  rect(g, sx0, sy0, 19, 17, '#173a2e'); rect(g, sx0, sy0, 19, 1, '#2e6a52'); frame(g, sx0 - 1, sy0 - 1, 21, 19, P.out); frame(g, sx0 + 1, sy0 + 1, 17, 15, '#c8a050');
  rect(g, sx0 + 5, sy0 + 7, 7, 5, '#f4ecd8'); rect(g, sx0 + 12, sy0 + 8, 2, 3, '#f4ecd8'); rect(g, sx0 + 4, sy0 + 12, 9, 1, '#c8b898');
  for (let k = 0; k < 3; k++) rect(g, sx0 + 6 + k * 2, sy0 + 3 + (k & 1), 1, 3, '#e8c060');
}
function drawSteam(g) {
  if (L.cupOut && !motion.matches) {
    g.fillStyle = 'rgba(255,245,230,.5)';
    for (let k = 0; k < 3; k++) { const p = (time * .55 + k / 3) % 1; g.fillRect(L.cupOut.x + Math.round(Math.sin(p * 6 + k) * 1.3), L.cupOut.y - 1 - Math.round(p * 9), 1, 1); }
  }
  if (!L.cup || door > .5) return;
  g.fillStyle = 'rgba(255,240,220,.45)';
  for (let k = 0; k < 3; k++) {
    const p = (time * .6 + k / 3) % 1;
    g.fillRect(L.cup.x + Math.round(Math.sin(p * 6 + k) * 1.2), L.cup.y - 1 - Math.round(p * 8), 1, 1);
  }
}

function drawPuddle(g) {
  const p = L.puddle;
  glow(g, p.x, p.y, p.rx, p.ry, '#1e2a5a', 1.2);
  dither(g, p.x - 8, p.y, 10, 1, '#ff5a96', .3);
  for (const r of rings) {
    if (r.r < 0) continue;
    const rr = Math.round(r.r);
    if (r.max) {
      g.globalAlpha = Math.max(0, 1 - r.r / r.max) * .8;
      for (let a = 0; a < 24; a++) rect(g, Math.round(r.x + Math.cos(a / 24 * Math.PI * 2) * rr), Math.round(r.y + Math.sin(a / 24 * Math.PI * 2) * rr * .3), 1, 1, '#b8c8f8');
      continue;
    }
    g.globalAlpha = Math.max(0, 1 - r.r / 6);
    rect(g, r.x - rr, r.y, 1, 1, '#9fb0e8'); rect(g, r.x + rr, r.y, 1, 1, '#9fb0e8');
    if (rr > 1) { rect(g, r.x - 1, r.y - 1, 2, 1, '#9fb0e8'); rect(g, r.x - 1, r.y + 1, 2, 1, '#9fb0e8'); }
  }
  g.globalAlpha = 1;
}

// each platform's own colour: face, lit top edge, deep base
const BADGE = {
  youtube: ['#e8323c', '#ff7a6a', '#9a1418'], tiktok: ['#24242a', '#4a4a54', '#0c0c10'],
  instagram: ['#c8367e', '#f07ab0', '#7a1a4a'], telegram: ['#2a8ee0', '#7ac4ff', '#145a9a'],
  whatsapp: ['#2aa85a', '#6ad88a', '#146a32'], github: ['#3e3e4a', '#6a6a7a', '#1a1a22'],
  discord: ['#5a5ae8', '#9a9aff', '#30309a']
};
// a pixel badge: stepped corners, a lit top row, a two-pixel base, its icon and name in white with a dark drop
function badge(g, x, y, w, h, cols, lift) {
  const [face, lit, base] = cols, O = P.out;
  y -= lift;
  rect(g, x + 1, y + 2, w - 2, h - 2, base); rect(g, x + 2, y + h, w - 4, 1, base);
  rect(g, x + 1, y, w - 2, h - 2, face); rect(g, x, y + 1, w, h - 4, face);
  rect(g, x + 2, y, w - 4, 1, lit); rect(g, x + 1, y + 1, 1, 2, lit);
  rect(g, x + 2, y - 1, w - 4, 1, O); rect(g, x + 2, y + h + 1, w - 4, 1, O);
  rect(g, x - 1, y + 2, 1, h - 3, O); rect(g, x + w, y + 2, 1, h - 3, O);
  rect(g, x, y + 1, 1, 1, O); rect(g, x + 1, y, 1, 1, O); rect(g, x + w - 1, y + 1, 1, 1, O); rect(g, x + w - 2, y, 1, 1, O);
  rect(g, x, y + h - 2, 1, 2, O); rect(g, x + 1, y + h, 1, 1, O); rect(g, x + w - 1, y + h - 2, 1, 2, O); rect(g, x + w - 2, y + h, 1, 1, O);
  return y;
}
function drawBoard(g) {
  const B = L.board;
  // the A-frame's legs and its shadow
  rect(g, B.x + 6, B.y + B.h - 2, 3, 9, P.woodD); rect(g, B.x + B.w - 9, B.y + B.h - 2, 3, 9, P.woodD);
  frame(g, B.x + 5, B.y + B.h - 2, 5, 10, P.out); frame(g, B.x + B.w - 10, B.y + B.h - 2, 5, 10, P.out);
  dither(g, B.x + 2, H - 4, B.w - 4, 2, P.out, .55);
  // a wooden frame round a dark slate, chalk dust in the corners
  rect(g, B.x, B.y, B.w, B.h, P.wood);
  rect(g, B.x, B.y, B.w, 1, P.woodL); rect(g, B.x, B.y, 1, B.h, P.woodL);
  rect(g, B.x, B.y + B.h - 1, B.w, 1, P.woodD); rect(g, B.x + B.w - 1, B.y, 1, B.h, P.woodD);
  for (const [nx, ny] of [[2, 2], [B.w - 3, 2], [2, B.h - 3], [B.w - 3, B.h - 3]]) rect(g, B.x + nx, B.y + ny, 1, 1, '#c8a050');
  frame(g, B.x - 1, B.y - 1, B.w + 2, B.h + 2, P.out);
  rect(g, B.x + 3, B.y + 3, B.w - 6, B.h - 6, '#1a2420');
  frame(g, B.x + 3, B.y + 3, B.w - 6, B.h - 6, P.out);
  const R = rng(11);
  for (let k = 0; k < B.w * B.h / 46; k++) rect(g, B.x + 5 + Math.floor(R() * (B.w - 10)), B.y + 5 + Math.floor(R() * (B.h - 10)), 1 + Math.floor(R() * 3), 1, '#24302a');
  // the title in chalk, a pink chalk stroke under it
  const cx = B.x + B.w / 2, title = SITE.ui[lang].board;
  text(g, title, cx, B.y + 18, '#0c120f', { halo: 0 });
  text(g, title, cx, B.y + 17, '#f4efe2');
  const tw = measure(title);
  for (let i = -tw / 2 - 3; i < tw / 2 + 3; i += 2) rect(g, Math.round(cx + i), B.y + 21 + ((i >> 1) & 1), 2, 1, P.fuchsia);
  // the accounts as badges, two to a row
  const rtl = lang === 'ar';
  SITE.accounts.forEach((a, i) => {
    const col = rtl ? 1 - (i % 2) : i % 2, row = Math.floor(i / 2);
    const x = B.x + 7 + col * B.cw, y = B.y + 26 + row * 22, on = hover === i, label = a.label[lang];
    const yy = badge(g, x, y, B.cw - 4, 17, BADGE[a.id] || BADGE.github, on ? 1 : 0);
    const lw = measure(label), total = 11 + 3 + lw, sx0 = x + Math.round((B.cw - 4 - total) / 2);
    const ix = rtl ? sx0 + lw + 3 : sx0, tx = rtl ? sx0 : sx0 + 14;
    g.drawImage(ICON_IMG[a.id], ix, yy + 4);
    text(g, label, tx, yy + 13, 'rgba(0,0,0,.55)', { align: 'left' });
    text(g, label, tx, yy + 12, '#ffffff', { align: 'left' });
  });
  // the handle of the account under the finger, in a little speech bubble
  if (hover >= 0 && hover < SITE.accounts.length && SITE.accounts[hover].handle) {
    const a = SITE.accounts[hover], col = rtl ? 1 - (hover % 2) : hover % 2, row = Math.floor(hover / 2);
    const bx = B.x + 7 + col * B.cw + (B.cw - 4) / 2, by = B.y + 26 + row * 22 - 22;
    plaque(g, a.handle, Math.max(B.x + measure(a.handle) / 2 + 6, Math.min(B.x + B.w - measure(a.handle) / 2 - 6, bx)), by, false);
  }
}

// a hanging plaque with pixel lettering; returns its box
function plaque(g, str, cx, y, hot) {
  const w = measure(str) + 8, x = Math.round(cx - w / 2), h = 15, O = P.out;
  rect(g, x + 1, y, w - 2, h, '#ffffff'); rect(g, x, y + 1, w, h - 2, '#ffffff');
  rect(g, x + 1, y - 1, w - 2, 1, O); rect(g, x + 1, y + h, w - 2, 1, O); rect(g, x - 1, y + 1, 1, h - 2, O); rect(g, x + w, y + 1, 1, h - 2, O);
  rect(g, x, y, 1, 1, O); rect(g, x + w - 1, y, 1, 1, O); rect(g, x, y + h - 1, 1, 1, O); rect(g, x + w - 1, y + h - 1, 1, 1, O);
  if (hot) rect(g, x + 1, y + h - 2, w - 2, 1, '#d8d4cc');
  // the tail, pointing down at the thing
  const tx = Math.round(cx);
  rect(g, tx - 2, y + h, 5, 1, '#ffffff'); rect(g, tx - 1, y + h + 1, 3, 1, '#ffffff'); rect(g, tx, y + h + 2, 1, 1, '#ffffff');
  for (const [dx, dy] of [[-3, 0], [3, 0], [-2, 1], [2, 1], [-1, 2], [1, 2], [0, 3]]) rect(g, tx + dx, y + h + dy, 1, 1, O);
  text(g, str, cx, y + 12, '#111111');
  return { x, y, w, h };
}

function drawReflections(g, cx) {
  const r0 = L.base + 8, r1 = L.near - 1, n = r1 - r0;
  for (let k = 0; k < n; k++) {
    const srcY = L.base - 1 - k;
    if (srcY < 0) break;
    const f = k / n, wob = motion.matches ? 0 : Math.round(Math.sin(time * 1.7 + k * .55) * (.6 + f * 1.6));
    g.globalAlpha = .34 * (1 - f) + .05;
    g.drawImage(st, cx, srcY, W, 1, wob, r0 + k, W, 1);
  }
  if (door > 0) {
    const D = L.doorBox;
    g.globalAlpha = door * .35;
    for (let k = 0; k < Math.min(n, 30); k++) {
      const wob = motion.matches ? 0 : Math.round(Math.sin(time * 1.7 + k * .55) * 1.2);
      rect(g, D.x - cx + wob, r0 + k, Math.round(D.w * (1 - k / 40)), 1, P.goldM);
    }
  }
  g.globalAlpha = 1;
}

/* ---------- rain (screen space) ---------- */
function seedRain() {
  const n = Math.min(700, Math.round(W * H / 380));
  drops = Array.from({ length: n }, () => newDrop(true));
  splashes = []; rings = [];
}
function newDrop(anyY) {
  const near = Math.random() < .22;
  const floor = near ? L.near + 2 + Math.random() * (H - L.near - 3) : L.base + Math.random() * (L.near - L.base);
  return { x: Math.random() * (W + 40), y: anyY ? Math.random() * floor : -6 - Math.random() * 30,
    v: near ? 190 + Math.random() * 60 : 120 + Math.random() * 50, len: near ? 5 : 3, near, floor };
}
function stepRain(dt, cx) {
  const p = L.puddle;
  for (const d of drops) {
    d.y += d.v * dt; d.x -= d.v * dt * .28;
    if (d.y >= d.floor) {
      const wx = d.x + cx;
      if (!d.near && Math.abs(wx - p.x) < p.rx - 3 && Math.abs(d.floor - p.y) < 6 && rings.length < 30) rings.push({ x: Math.round(wx), y: p.y + Math.round((Math.random() - .5) * 3), r: 0 });
      else if (splashes.length < 220) splashes.push({ x: Math.round(d.x), y: Math.round(d.floor), life: 3 });
      Object.assign(d, newDrop(false));
    }
  }
  for (const s of splashes) s.life -= dt * 22;
  splashes = splashes.filter(s => s.life > 0);
  for (const r of rings) r.r += dt * 9;
  rings = rings.filter(r => r.r < (r.max || 6));
}
function lit(wx, y) {
  for (const lx of L.lamps) if (y > L.base - 112 && Math.abs(wx - lx - 9) < (y - (L.base - 112)) * .35 + 3) return true;
  return false;
}
function drawRain(g, cx) {
  for (const d of drops) {
    g.fillStyle = lit(d.x + cx, d.y) ? 'rgba(255,214,140,.75)' : d.near ? 'rgba(170,184,236,.42)' : 'rgba(130,144,206,.22)';
    for (let i = 0; i < d.len; i++) g.fillRect(Math.round(d.x + i * .28), Math.round(d.y - i), 1, 1);
  }
  g.fillStyle = 'rgba(190,200,240,.6)';
  for (const s of splashes) {
    if (s.life > 1.5) { g.fillRect(s.x - 1, s.y - 1, 1, 1); g.fillRect(s.x + 1, s.y - 1, 1, 1); }
    else g.fillRect(s.x, s.y, 1, 1);
  }
}



// a far lightning stroke: the sky blinks, a jagged line runs down and fades
function drawBolt(g, cx, dt) {
  if (!bolt) return;
  bolt.t -= dt * 2.2;
  if (bolt.t <= 0) { bolt = null; return; }
  const k = bolt.t > .75 || (bolt.t > .45 && bolt.t < .6) ? 1 : bolt.t * .8;
  // only the sky lights up, fading out in bands just above the roofs
  const sky = L.cafe.y - 14;
  g.fillStyle = '#c8d4ff';
  g.globalAlpha = k * .2; g.fillRect(0, 0, W, sky - 12);
  for (let i = 0; i < 3; i++) { g.globalAlpha = k * .2 * (3 - i) / 4; g.fillRect(0, sky - 12 + i * 4, W, 4); }
  g.globalAlpha = k;
  for (const path of bolt.paths) for (let i = 1; i < path.length; i++) {
    const [x0, y0] = path[i - 1], [x1, y1] = path[i], n = Math.max(1, Math.abs(y1 - y0));
    for (let j = 0; j < n; j++) rect(g, Math.round(x0 + (x1 - x0) * j / n) - cx, y0 + j, 1, 1, '#f4f6ff');
  }
  g.globalAlpha = 1;
}
function streetTap(wx, y) {
  const s = L.sill, b = L.blade, n = L.sign;
  if (s && wx > s.x - 3 && wx < s.x + 14 && y > s.y - 16 && y < s.y + 2) { lantern = 1; SND.tap(); spawn('spark', s.x + 6, s.y - 8, 6); return; }
  if (b && Math.abs(wx - b.x) < 12 && y > b.y && y < b.y + 22) { bladeKick = 1; SND.tap(); return; }
  const ccx = L.cafe.x + L.cafe.w + 13, ccy = L.cafe.base - 124;
  if (Math.hypot(wx - ccx, y - ccy) < 14) { clockShow = 4; SND.tap(); setTimeout(() => SND.tap(), 260); return; }
  if (n && wx > n.x && wx < n.x + n.w && y > n.y && y < n.y + n.h) { flicker = .5; SND.click(); return; }
  if (y > L.base + 2) {
    const x = Math.round(wx), yy = Math.round(y);
    rings.push({ x, y: yy, r: 0, max: 11 }, { x, y: yy, r: -3, max: 11 });
    spawn('drop', wx, y, 6); SND.plip(); return;
  }
  if (y < L.cafe.y - 14 && !bolt) {
    // the stroke falls from the top of the sky to somewhere behind the roofs
    const end = L.cafe.y - 18, main = [[wx, 0]];
    let x = wx;
    for (let yy = 6; yy < end; yy += 5 + Math.floor(Math.random() * 6)) { x += Math.round((Math.random() - .5) * 9); main.push([x, yy]); }
    const at = main[Math.floor(main.length * .4)], branch = [at];
    let bx = at[0];
    for (let yy = at[1] + 5; yy < at[1] + 34; yy += 5) { bx += 3 + Math.round(Math.random() * 3) * Math.sign(wx - (L.cafe.x + 105) || 1); branch.push([bx, yy]); }
    bolt = { t: 1, paths: [main, branch] };
    setTimeout(() => SND.thunder(), 380 + Math.random() * 300);
  }
}
let tapAt = null;
cv.addEventListener('pointerdown', e => { tapAt = { x: e.clientX, y: e.clientY }; });
cv.addEventListener('pointerup', e => {
  const t = tapAt; tapAt = null;
  if (!t || active || !L || Math.hypot(e.clientX - t.x, e.clientY - t.y) > 6) return;
  streetTap(Math.round(cam) + e.clientX / cssS, e.clientY / cssS);
});

/* ---------- frame loop ---------- */
let last = performance.now(), raf = 0;
function tick(now) {
  raf = requestAnimationFrame(tick);
  if (!L) return;
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const still = motion.matches;
  const ease = k => still ? 1 : 1 - Math.exp(-dt / k);
  if (!still) time += dt;
  if (active) { drawInterior(); return; }

  cam += (camTo - cam) * ease(.14);
  if (Math.abs(camTo - cam) < .05) cam = camTo;
  const cx = Math.round(cam);
  if (!still) {
    stepRain(dt, cx);
    nextFlicker -= dt;
    if (nextFlicker <= 0) { flicker = .18; nextFlicker = 7 + Math.random() * 9; }
    flicker = Math.max(0, flicker - dt);
    nextTail -= dt;
    if (nextTail <= 0) { tail = .5; nextTail = 4 + Math.random() * 6; }
    tail = Math.max(0, tail - dt);
  }
  bladeKick = Math.max(0, bladeKick - dt * .7);
  lantern = Math.max(0, lantern - dt * .8);
  clockShow = Math.max(0, clockShow - dt);
  door += (doorTo - door) * ease(.11);
  if (Math.abs(doorTo - door) < .002) door = doorTo;

  ctx.drawImage(st, cx, 0, W, H, 0, 0, W, H);
  ctx.save(); ctx.translate(-cx, 0);
  drawDoor(ctx);
  ctx.restore();
  drawReflections(ctx, cx);
  ctx.save(); ctx.translate(-cx, 0);
  drawPuddle(ctx);
  drawLife(ctx);
  drawSteam(ctx);
  drawBlade(ctx);
  drawClock(ctx);
  drawFx(ctx, dt);
  if (flicker > 0 && (flicker * 40 | 0) % 2) {
    const s = L.sign; ctx.globalAlpha = .55; rect(ctx, s.x + 1, s.y + 1, s.w - 2, s.h - 2, '#0b0812'); ctx.globalAlpha = 1;
  }
  const t = SITE.ui[lang], hd = L.houseDoor, md = L.mosqueDoor;
  plaque(ctx, t.house, hd.x + hd.w / 2, hd.y - 19, hover === 97);
  plaque(ctx, t.mosque, md.x + md.w / 2, md.y - 22, hover === 98);
  ctx.restore();
  drawBolt(ctx, cx, dt);
  drawRain(ctx, cx);
  drawBoard(ctx);

  if (cx !== camShown) {
    camShown = cx;
    ui.world.style.transform = `translateX(${-cx * cssS}px)`;
    ui.panL.hidden = WW <= W || camTo <= L.stops[0] + .5;
    ui.panR.hidden = WW <= W || camTo >= L.stops[2] - .5;
  }
}

/* ---------- interiors: registered scenes, each on its own canvas ---------- */
const scenes = {};
let IS = 1, icss = 1, iLeft = 0, iTop = 0, hot = null, spotEls = [], entry = null;
const fx = [];
// spawn n particles of a kind at (x, y) in the current room's pixels
function spawn(kind, x, y, n = 1) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = Math.random();
    const p = { kind, x, y, vx: 0, vy: 0, life: 1, age: 0 };
    if (kind === 'steam') { p.vx = (Math.random() - .5) * 4; p.vy = -10 - sp * 8; p.life = 1.6; }
    if (kind === 'spark') { p.vx = (Math.random() - .5) * 18; p.vy = -24 - sp * 22; p.life = .9; }
    if (kind === 'heart') { p.vx = (Math.random() - .5) * 8; p.vy = -14 - sp * 6; p.life = 1.4; }
    if (kind === 'coin') { p.vx = (Math.random() - .5) * 30; p.vy = -40 - sp * 20; p.life = 1.1; }
    if (kind === 'drop') { p.vx = Math.cos(a) * 20 * sp; p.vy = -20 - sp * 15; p.life = .6; }
    if (kind === 'star') { p.vx = Math.cos(a) * 16 * sp; p.vy = Math.sin(a) * 16 * sp; p.life = .8; }
    fx.push(p);
  }
}
const HEART = ['.R.R.', 'RRRRR', 'RRRRR', '.RRR.', '..R..'];
function drawFx(g, dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const p = fx[i];
    p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.kind === 'spark' || p.kind === 'coin' || p.kind === 'drop') p.vy += 70 * dt;
    if (p.age >= p.life) { fx.splice(i, 1); continue; }
    const k = 1 - p.age / p.life, x = Math.round(p.x), y = Math.round(p.y);
    g.globalAlpha = Math.min(1, k * 1.6);
    if (p.kind === 'steam') { rect(g, x, y, 2, 2, '#f4f0e8'); if (p.age > .5) rect(g, x + 1, y - 1, 1, 1, '#ffffff'); }
    else if (p.kind === 'spark') rect(g, x, y, 1, 1, k > .5 ? '#ffe08a' : '#ff7a2a');
    else if (p.kind === 'heart') sprite(g, HEART, x - 2, y - 2, { R: '#ff5a8f' });
    else if (p.kind === 'coin') { rect(g, x - 1, y - 1, 3, 3, '#e8c060'); rect(g, x, y - 1, 1, 1, '#fff0a0'); }
    else if (p.kind === 'drop') rect(g, x, y, 1, 1, '#a8c0ff');
    else if (p.kind === 'star') { rect(g, x, y, 1, 1, '#fff6c0'); if (k > .5) { rect(g, x - 1, y, 1, 1, '#ffd27a'); rect(g, x + 1, y, 1, 1, '#ffd27a'); } }
  }
  g.globalAlpha = 1;
}
// a pixel rug seen from above and a little in front: a shadow, fringe on both short ends, an outer and an inner border
// with a running motif, a field with a stepped central medallion and quarter medallions in the corners.
// pal: [base, field, border, motif, medallion, medallion core]
const RUGS = {
  crimson: ['#4a0c1c', '#8c1c34', '#1c2a4a', '#e8b040', '#e8b040', '#1c2a4a'],
  navy: ['#0e1a30', '#1e3a5a', '#7a1a30', '#e8c060', '#c8963a', '#8c1c34'],
  forest: ['#0c2a20', '#1e4a3a', '#5a1a2a', '#e8c060', '#c8963a', '#efe6c8']
};
function rug(g, x, y, w, h, kind = 'crimson') {
  const [base, field, border, motif, med, core] = RUGS[kind] || RUGS.crimson;
  x = Math.round(x); y = Math.round(y);
  dither(g, x + 2, y + h, w, 2, P.out, .5);
  for (let j = 1; j < h - 1; j += 2) { rect(g, x - 2, y + j, 2, 1, '#d8cfb4'); rect(g, x + w, y + j, 2, 1, '#d8cfb4'); }
  rect(g, x, y, w, h, base);
  rect(g, x + 1, y + 1, w - 2, h - 2, border);
  for (let i = x + 3; i < x + w - 3; i += 4) { rect(g, i, y + 2, 2, 1, motif); rect(g, i + 2, y + h - 3, 2, 1, motif); }
  for (let j = y + 4; j < y + h - 4; j += 4) { rect(g, x + 2, j, 1, 2, motif); rect(g, x + w - 3, j + 2, 1, 2, motif); }
  rect(g, x + 4, y + 4, w - 8, h - 8, base);
  rect(g, x + 5, y + 5, w - 10, h - 10, field);
  const mx = x + Math.floor(w / 2), my = y + Math.floor(h / 2), mr = Math.max(3, Math.min(Math.floor((h - 12) / 2), 9));
  for (let d = -mr; d <= mr; d++) { const ww = Math.round((mr - Math.abs(d)) * 1.8); rect(g, mx - ww, my + d, ww * 2 + 1, 1, med); }
  for (let d = -mr + 2; d <= mr - 2; d++) { const ww = Math.round((mr - 2 - Math.abs(d)) * 1.8); rect(g, mx - ww, my + d, ww * 2 + 1, 1, core); }
  rect(g, mx - 1, my, 3, 1, med);
  for (const [cx, cy, sx, sy] of [[x + 5, y + 5, 1, 1], [x + w - 6, y + 5, -1, 1], [x + 5, y + h - 6, 1, -1], [x + w - 6, y + h - 6, -1, -1]])
    for (let q = 0; q < 4; q++) rect(g, sx > 0 ? cx : cx - (3 - q), cy + sy * q, 4 - q, 1, med);
  // a row of small diamonds either side of the medallion on long rugs
  for (let i = mx - mr * 2 - 8; i > x + 12; i -= 12) { rect(g, i, my - 1, 1, 3, motif); rect(g, i - 1, my, 3, 1, motif); }
  for (let i = mx + mr * 2 + 8; i < x + w - 12; i += 12) { rect(g, i, my - 1, 1, 3, motif); rect(g, i - 1, my, 3, 1, motif); }
}
const kit = {
  P, rect, frame, dither, glow, sprite, rng, dith, text, measure, plaque, bake, cone, spawn, rug, ICON_IMG, SND, store,
  get time() { return time; }, get still() { return motion.matches; }, get lang() { return lang; },
  num: n => lang === 'ar' ? String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]) : String(n),
  t: o => o ? (o[lang] !== undefined ? o[lang] : o) : ''
};
function sizeInterior() {
  // the room fills the whole screen: its height sets the pixel scale, its width grows with the screen,
  // and where it is wider than the screen the visitor walks along it
  const sc = active, dpr = window.devicePixelRatio || 1;
  const dw = innerWidth * dpr, dh = innerHeight * dpr;
  // on wide screens the whole room shows; on tall phones it fills the height and you walk along it
  IS = S;
  icss = IS / dpr;
  sc.w = Math.max(sc.minW, Math.ceil(dw / IS));
  const hh = Math.max(sc.h, Math.ceil(dh / IS));
  iOff = Math.floor((hh - sc.h) / 2);
  ic.width = sc.w; ic.height = hh;
  const cw = sc.w * icss, ch = hh * icss;
  iLeft = 0; iTop = Math.round((innerHeight - ch) / 2);
  iMax = Math.max(0, sc.w - Math.ceil(dw / IS));
  Object.assign(ic.style, { width: cw + 'px', height: ch + 'px', left: '0px', top: iTop + 'px' });
  document.documentElement.style.setProperty('--ipx', icss.toFixed(3));
  if (!sc.canvas) sc.canvas = document.createElement('canvas');
  const t = document.createElement('canvas'); t.width = sc.w; t.height = sc.h;
  sc.build(t.getContext('2d'), kit);
  sc.canvas.width = sc.w; sc.canvas.height = hh;
  const cg = sc.canvas.getContext('2d');
  if (iOff) cg.drawImage(t, 0, 2, sc.w, 1, 0, 0, sc.w, iOff);   // more ceiling above
  cg.drawImage(t, 0, iOff);
  // the floor continues below by repeating its last band; a scene can say how tall that band is
  const tile = sc.tile || 12;
  for (let y = iOff + sc.h; y < hh; y += tile) cg.drawImage(t, 0, sc.h - tile, sc.w, tile, 0, y, sc.w, tile);
  // touchable things become real buttons laid over the picture
  ui.spots.textContent = ''; spotEls = [];
  for (const s of sc.spots()) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'hit';
    b.setAttribute('aria-label', kit.t(s.label));
    if (s.pressed) b.setAttribute('aria-pressed', String(s.pressed()));
    Object.assign(b.style, { left: s.box.x * icss + 'px', top: iTop + (s.box.y + iOff) * icss + 'px', width: s.box.w * icss + 'px', height: s.box.h * icss + 'px' });
    const on = () => { hot = s; }, off = () => { if (hot === s) hot = null; };
    b.addEventListener('pointerenter', on); b.addEventListener('pointerleave', off);
    b.addEventListener('focus', () => { on(); lookAt(s.box.x + s.box.w / 2); }); b.addEventListener('blur', off);
    b.addEventListener('click', () => { if (iDrag && iDrag.moved) return; s.open(b); if (s.pressed) b.setAttribute('aria-pressed', String(s.pressed())); });
    ui.spots.appendChild(b); spotEls.push(b);
  }
  ui.sceneHint.textContent = kit.t(sc.hint);
  if (ipan === null || ipan > iMax) ipan = ipanTo = Math.round(Math.min(iMax, Math.max(0, (sc.focus || sc.w / 2) - dw / IS / 2)));
  ipanShown = -1;
}
let iOff = 0, iMax = 0, ipan = null, ipanTo = 0, ipanShown = -1, iDrag = null;
function lookAt(x) { ipanTo = Math.max(0, Math.min(iMax, Math.round(x - innerWidth * (window.devicePixelRatio || 1) / IS / 2))); }
ic.addEventListener('pointerdown', e => { if (!active || !iMax) return; iDrag = { x: e.clientX, p: ipanTo, moved: false }; ic.setPointerCapture(e.pointerId); });
ic.addEventListener('pointermove', e => { if (!iDrag) return; const d = (e.clientX - iDrag.x) / icss; if (Math.abs(d) > 2) iDrag.moved = true; ipanTo = Math.max(0, Math.min(iMax, Math.round(iDrag.p - d))); });
const iEnd = () => { setTimeout(() => { iDrag = null; }, 0); };
ic.addEventListener('pointerup', iEnd); ic.addEventListener('pointercancel', iEnd);
function drawInterior() {
  const sc = active;
  ipan += (ipanTo - ipan) * (motion.matches ? 1 : .18);
  if (Math.abs(ipanTo - ipan) < .05) ipan = ipanTo;
  const px = Math.round(ipan);
  if (px !== ipanShown) {
    ipanShown = px;
    ic.style.transform = ui.spots.style.transform = 'translateX(' + (-px * icss) + 'px)';
    ui.panL.hidden = !iMax || ipanTo <= 0; ui.panR.hidden = !iMax || ipanTo >= iMax;
  }
  ictx.drawImage(sc.canvas, 0, 0);
  ictx.save(); ictx.translate(0, iOff);
  sc.draw(ictx, kit);
  drawFx(ictx, Math.min(.05, (performance.now() - (drawInterior.last || performance.now())) / 1000)); drawInterior.last = performance.now();
  if (hot) {
    // the name of what is under the finger, on a plaque just above it
    const b = hot.box, label = kit.t(hot.label), w = measure(label) + 8;
    const cx = Math.max(w / 2 + 2, Math.min(sc.w - w / 2 - 2, b.x + b.w / 2));
    plaque(ictx, label, cx, Math.max(5 - iOff, b.y - 18), true);
  }
  ictx.restore();
  ctx.fillStyle = P.ink; ctx.fillRect(0, 0, W, H);
}
function swap(into, after) {
  ui.fade.classList.add('on');
  setTimeout(() => {
    for (const w of wins) if (!w.hidden) closeWin(w, true);
    if (active && active.leave) active.leave(kit);
    active = into; hot = null; ipan = null; fx.length = 0;
    document.body.classList.toggle('inside', !!into);
    ui.inside.hidden = !into; ic.hidden = !into;
    if (into) { sizeInterior(); if (into.enter) into.enter(kit); }
    SND.setIndoor(!!into);
    ui.fade.classList.remove('on');
    after();
  }, motion.matches ? 0 : 360);
}
function enter(id, from) {
  const sc = scenes[id];
  if (!sc) return;
  entry = from; SND.shut();
  swap(sc, () => { if (spotEls[0]) spotEls[0].focus({ preventScroll: true }); });
}
function leave() {
  if (!active) return;
  if (active.id === 'cafe') setTimeout(() => { doorTo = 0; }, 420);
  SND.shut();
  swap(null, () => { if (entry) entry.focus({ preventScroll: true }); });
}
ui.sceneExit.addEventListener('click', leave);

/* ---------- windows ---------- */
const CLOSE_SVG = '<svg viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><path d="M1 1h1v1h1v1h1V2h1V1h1v1H5v1H4v1h1v1h1v1H5V5H4V4H3v1H2v1H1V5h1V4h1V3H2V2H1z"/></svg>';
const MIN_SVG = '<svg viewBox="0 0 7 7" shape-rendering="crispEdges"><rect x="1" y="5" width="5" height="1"/></svg>';
const MAX_SVG = '<svg viewBox="0 0 7 7" shape-rendering="crispEdges"><path d="M1 1h5v5H1zM2 2v3h3V2z" fill-rule="evenodd"/></svg>';
const wins = [ui.bio];
const UICON = {
  ask: ['..WWWW..', '.WW..WW.', '.....WW.', '....WW..', '...WW...', '...WW...', '........', '...WW...'],
  monitor: ['WWWWWWWWW', 'WBBBBBBBW', 'WBCCBBBBW', 'WBBBBCCBW', 'WBBBBBBBW', 'WWWWWWWWW', '....W....', '..WWWWW..'],
  tv: ['..W...W..', '...W.W...', 'WWWWWWWWW', 'WPPPPPPWW', 'WPPPPPPWR', 'WPPPPPPWW', 'WWWWWWWWW', '.W.....W.'],
  book: ['.WWW.WWW.', 'WGGGWGGGW', 'WGGGWGGGW', 'WGGGWGGGW', 'WGGGWGGGW', 'WGGGWGGGW', '.WWWWWWW.', '....W....'],
  folder: ['YYY......', 'YYYYYYYYY', 'YLLLLLLLY', 'YYYYYYYYY', 'YYYYYYYYY', 'YYYYYYYYY', 'YYYYYYYYY', '.........'],
  clock: ['..WWWWW..', '.W.....W.', 'W...K...W', 'W...K...W', 'W...KKK.W', 'W.......W', '.W.....W.', '..WWWWW..'],
  compass: ['....W....', '...WRW...', '..WRRRW..', '.W.RRR.W.', '.W.WWW.W.', '..WWWWW..', '...WWW...', '....W....'],
  beads: ['..W.W.W..', '.W.....W.', 'W.......W', '.W.....W.', '..W.W.W..', '....W....', '....Y....', '...YYY...'],
  hands: ['.WW...WW.', 'WWWW.WWWW', 'WWWW.WWWW', 'WWWW.WWWW', '.WWW.WWW.', '..WWWWW..', '...WWW...', '.........'],
  cup: ['.........', '..W.W.W..', '...W.W...', 'WWWWWWW..', 'WCCCCCWWW', 'WCCCCCW.W', 'WCCCCCWWW', '.WWWWW...'],
  cake: ['....R....', '...WWW...', '..WPPPW..', '.WWWWWWW.', 'WPPPPPPPW', 'WWWWWWWWW', 'WCCCCCCCW', 'WWWWWWWWW'],
  fire: ['....Y....', '...YRY...', '..YRRY...', '.YRRYRY..', '.YRYYRY..', 'YRYYYYRY.', '.YRRRRY..', 'WWWWWWWWW'],
  list: ['WWWWWWWW.', 'W......W.', 'W.KKKK.W.', 'W......W.', 'W.KKKK.W.', 'W......W.', 'W.KKK..W.', 'WWWWWWWW.'],
  horn: ['......W..', '....WWW..', 'WWWWWWW.W', 'WRRWWWW..', 'WRRWWWW.W', 'WWWWWWW..', '....WWW..', '......W..']
};
const UICOL = { W: '#ffffff', B: '#2a6ac0', C: '#8a5020', P: '#ff8ab0', R: '#e83a3a', G: '#3a9a5a', Y: '#ffd23a', L: '#fff3a0', K: '#111111' };
// a window's corner icon, drawn from a little pixel map
function uiIcon(name) {
  const rows = UICON[name]; if (!rows) return '';
  const by = {};
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') (by[ch] = by[ch] || []).push('M' + x + ' ' + y + 'h1v1h-1z'); }));
  return '<svg viewBox="0 0 ' + rows[0].length + ' ' + rows.length + '" shape-rendering="crispEdges" aria-hidden="true">' +
    Object.entries(by).map(([ch, d]) => '<path fill="' + UICOL[ch] + '" d="' + d.join('') + '"/>').join('') + '</svg>';
}
function panel(id, cls = '', icon = '') {
  const el = document.createElement('section');
  el.className = 'win ' + (/\b[ab]\b/.test(cls) ? cls : 'a v-yellow ' + cls); el.id = id; el.hidden = true;
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-labelledby', id + 'T');
  el.innerHTML = `<header class="win-bar"><span class="win-btns"><button class="win-btn close" type="button">${CLOSE_SVG}</button><span class="win-btn" aria-hidden="true">${MAX_SVG}</span><span class="win-btn" aria-hidden="true">${MIN_SVG}</span></span><span class="win-title" id="${id}T"></span><span class="win-ico">${uiIcon(icon)}</span></header><div class="win-body"></div>`;
  document.body.appendChild(el);
  const close = el.querySelector('.close');
  close.addEventListener('click', () => closeWin(el));
  wins.push(el);
  PixText.watch(el);
  return {
    el, body: el.querySelector('.win-body'),
    title(t) { el.querySelector('.win-title').textContent = t; close.setAttribute('aria-label', SITE.ui[lang].close); },
    open(from) { openWin(el, from); }, close() { closeWin(el); },
    get isOpen() { return !el.hidden; }
  };
}
let noteTimer = 0, opener = null;
// a window opens beside whoever is speaking: above them when there is room, else below,
// with a pixel tail pointing back at them; it unfolds from that point
const tailEl = document.createElement('i'); tailEl.className = 'tail'; tailEl.setAttribute('aria-hidden', 'true'); document.body.appendChild(tailEl);
function placeWin(el) {
  if (el.hidden || !L) return;
  const w = el.offsetWidth, h = el.offsetHeight, src = opener && opener.getBoundingClientRect ? opener.getBoundingClientRect() : null;
  const tailH = tailEl.offsetHeight || 20, gap = tailH - 4;
  let cx = src && src.width ? src.left + src.width / 2 : innerWidth / 2, top, dir = null;
  cx = Math.max(w / 2 + 10, Math.min(innerWidth - w / 2 - 10, cx));
  // a reading window is too big to hang off what opened it: it sits in the middle of the screen
  const centred = el.classList.contains('win-reader');
  if (centred) { cx = innerWidth / 2; top = Math.max(56, (innerHeight - h) / 2); }
  else if (src && src.width) {
    top = src.top - h - gap; dir = 'down';
    if (top < 56) { top = src.bottom + gap; dir = 'up'; }
    if (top + h > innerHeight - 10) { top = Math.max(56, innerHeight - h - 10); dir = null; }
  } else top = Math.max(56, (innerHeight - h) / 2);
  // the window's edges land on whole device pixels, so its pixel lettering stays sharp
  const dpr = window.devicePixelRatio || 1, snap = v => Math.round(v * dpr) / dpr;
  el.style.left = snap(cx - w / 2) + 'px'; el.style.top = snap(top) + 'px';
  const kind = (el.className.match(/v-([a-z]+)/) || [])[1];
  tailEl.className = 'tail t-' + (el.classList.contains('b') ? 'b' : kind || 'yellow') + (dir === 'up' ? ' up' : '');
  if (dir) {
    const tx = Math.max(cx - w / 2 + 22, Math.min(cx + w / 2 - 22, src.left + src.width / 2));
    tailEl.style.left = Math.round(tx) + 'px';
    tailEl.style.top = Math.round(dir === 'down' ? top + h - 3 : top - tailH + 3) + 'px';
    el.style.transformOrigin = Math.round(tx - (cx - w / 2)) + 'px ' + (dir === 'down' ? '100%' : '0');
    el.dataset.tail = '1';
  } else { el.style.transformOrigin = '50% 50%'; delete el.dataset.tail; }
}
function showTail(el) { tailEl.classList.toggle('on', !!el.dataset.tail && el.classList.contains('on')); }
let typing = null;
function finishTyping() { if (typing) { typing.finish(); typing = null; } }
function typeIn(root) {
  finishTyping();
  PixText.all(root);
  if (motion.matches) return;
  typing = PixText.type(root, () => SND.beep());
}
function openWin(el, from) {
  for (const w of wins) if (w !== el && !w.hidden) closeWin(w, true);
  opener = from;
  el.hidden = false; el.classList.remove('out'); placeWin(el);
  el.classList.add('opening'); clearTimeout(el._opening); el._opening = setTimeout(() => el.classList.remove('opening'), 700);
  PixText.all(el); placeWin(el);
  requestAnimationFrame(() => requestAnimationFrame(() => { placeWin(el); el.classList.add('on'); setTimeout(() => showTail(el), 260); }));
  setTimeout(() => { if (el.classList.contains('on')) typeIn(el); }, motion.matches ? 0 : 300);
  const f = el.querySelector('.close'); if (f) f.focus({ preventScroll: true });
  SND.pop();
}
function closeWin(el, quiet) {
  finishTyping();
  el.classList.remove('on'); el.classList.add('out'); tailEl.classList.remove('on');
  setTimeout(() => { if (!el.classList.contains('on')) { el.hidden = true; el.classList.remove('out'); } }, motion.matches ? 0 : 200);
  if (!quiet && opener) opener.focus({ preventScroll: true });
}
function openBio(from) {
  openWin(ui.bio, from);
}
function openBioFromDoor() {
  doorTo = 1; ui.door.setAttribute('aria-expanded', 'true');
  SND.bell();
  setTimeout(() => openWin(ui.bio, ui.door), motion.matches ? 0 : 260);
}
function showNote(from) {
  clearTimeout(noteTimer);
  const keep = opener; opener = from;
  ui.note.hidden = false; ui.note.classList.remove('out'); placeWin(ui.note); opener = keep;
  requestAnimationFrame(() => requestAnimationFrame(() => { ui.note.classList.add('on'); setTimeout(() => showTail(ui.note), 260); }));
  SND.pop();
  setTimeout(() => typeIn(ui.note), 280);
  noteTimer = setTimeout(() => { ui.note.classList.remove('on'); ui.note.classList.add('out'); tailEl.classList.remove('on'); setTimeout(() => { if (!ui.note.classList.contains('on')) { ui.note.hidden = true; ui.note.classList.remove('out'); } }, 200); }, 3000);
}
ui.bio.querySelector('.close').addEventListener('click', () => closeWin(ui.bio));

/* ---------- sizing ---------- */
function resize() {
  if (!innerWidth || !innerHeight) return;
  const dpr = window.devicePixelRatio || 1;
  const dw = Math.round(innerWidth * dpr), dh = Math.round(innerHeight * dpr);
  // wide screens see more street; the art pixel never gets so small the café is lost
  S = Math.max(1, Math.floor(Math.min(dw / 260, dh / 380)));
  S = Math.max(S, Math.ceil(dh / 560));
  W = Math.ceil(dw / S); H = Math.ceil(dh / S);
  cssS = S / dpr;
  cv.width = W; cv.height = H;
  cv.style.width = W * cssS + 'px'; cv.style.height = H * cssS + 'px';
  const root = document.documentElement.style;
  root.setProperty('--px', cssS.toFixed(3));
  // window lettering: the pixel faces at a whole number of device pixels per font pixel, chunky but readable
  const u = Math.max(1, Math.round(1.25 * dpr)) / dpr;
  root.setProperty('--u', u.toFixed(3));
  L = layout();
  buildStatic();
  seedRain();
  cam = camTo = L.stops[1]; camShown = -1;
  place();
  if (active) sizeInterior();
  if (window.PixText) pixelRefresh();
}
const box = (el, b) => Object.assign(el.style, {
  left: b.x * cssS + 'px', top: b.y * cssS + 'px', width: b.w * cssS + 'px', height: b.h * cssS + 'px'
});
function place() {
  box(ui.door, L.doorBox);
  box(ui.houseDoor, { x: L.houseDoor.x - 4, y: L.houseDoor.y - 22, w: L.houseDoor.w + 8, h: L.houseDoor.h + 22 });
  box(ui.mosqueDoor, { x: L.mosqueDoor.x - 8, y: L.mosqueDoor.y - 25, w: L.mosqueDoor.w + 16, h: L.mosqueDoor.h + 25 });
  const B = L.board, rtl = lang === 'ar';
  [...ui.links.children].forEach((li, i) => {
    const col = rtl ? 1 - (i % 2) : i % 2, row = Math.floor(i / 2);
    box(li.firstChild, { x: B.x + 6 + col * B.cw, y: B.y + 24 + row * 22, w: B.cw, h: 22 });
  });
  // arrows sit on the wet road, clear of the buildings and the board
  const roadY = (L.base + 14) * cssS;
  ui.panL.style.top = ui.panR.style.top = Math.round(Math.min(roadY, L.board.y * cssS - 54)) + 'px';
  for (const w of wins) placeWin(w);
}

/* ---------- camera ---------- */
function goTo(i) { camTo = L.stops[Math.max(0, Math.min(2, i))]; camShown = -1; }
function stopIndex() { let best = 0; L.stops.forEach((s, i) => { if (Math.abs(s - camTo) < Math.abs(L.stops[best] - camTo)) best = i; }); return best; }
ui.panL.addEventListener('click', () => active ? lookAt(ipanTo - innerWidth * (window.devicePixelRatio || 1) / IS * .1) : goTo(stopIndex() - 1));
ui.panR.addEventListener('click', () => active ? lookAt(ipanTo + innerWidth * (window.devicePixelRatio || 1) / IS * 1.1) : goTo(stopIndex() + 1));
let drag = null;
cv.addEventListener('pointerdown', e => {
  if (!L || WW <= W || active) return;
  drag = { x: e.clientX, cam: camTo, moved: false };
  cv.setPointerCapture(e.pointerId); cv.classList.add('drag');
});
cv.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = (e.clientX - drag.x) / cssS;
  if (Math.abs(dx) > 2) drag.moved = true;
  camTo = clampCam(drag.cam - dx); camShown = -1;
});
const endDrag = () => {
  if (!drag) return;
  if (drag.moved) {
    // settle on the nearest building, biased toward the direction of the swipe
    const d = camTo - drag.cam, i = stopIndex();
    goTo(Math.abs(d) > 18 && L.stops[i] === drag.cam ? i + Math.sign(d) : i);
  }
  drag = null; cv.classList.remove('drag');
};
cv.addEventListener('pointerup', endDrag);
cv.addEventListener('pointercancel', endDrag);
addEventListener('keydown', e => {
  if (active || (e.target.closest && e.target.closest('.win'))) return;
  if (e.key === 'ArrowLeft') goTo(stopIndex() - 1);
  if (e.key === 'ArrowRight') goTo(stopIndex() + 1);
});
ui.houseDoor.addEventListener('focus', () => goTo(0));
ui.door.addEventListener('focus', () => goTo(1));
ui.mosqueDoor.addEventListener('focus', () => goTo(2));



/* ---------- content + language ---------- */
const langHooks = [];
function render() {
  const t = SITE.ui[lang], name = SITE.name[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = name;
  ui.siteName.textContent = name;
  ui.lang.textContent = t.lang;
  ui.lang.setAttribute('aria-label', t.langLabel);
  ui.lang.lang = lang === 'ar' ? 'en' : 'ar';
  ui.sound.setAttribute('aria-label', SND.muted ? t.soundOn : t.soundOff);
  ui.sound.setAttribute('aria-pressed', String(!SND.muted));
  ui.door.setAttribute('aria-label', t.doorLabel);
  ui.houseDoor.setAttribute('aria-label', t.enterHome);
  ui.mosqueDoor.setAttribute('aria-label', t.enterMosque);
  ui.panL.setAttribute('aria-label', t.panLeft);
  ui.panR.setAttribute('aria-label', t.panRight);
  ui.boardTitle.textContent = t.board;
  ui.links.textContent = '';
  SITE.accounts.forEach((a, i) => {
    const li = document.createElement('li'), el = document.createElement('a');
    el.className = 'hit';
    el.textContent = a.label[lang];
    if (a.url) { el.href = a.url; el.target = '_blank'; el.rel = 'noopener'; }
    else { el.href = '#'; el.setAttribute('aria-disabled', 'true'); el.addEventListener('click', e => { e.preventDefault(); showNote(el); }); }
    const on = () => { hover = i; }, off = () => { if (hover === i) hover = -1; };
    el.addEventListener('pointerenter', on); el.addEventListener('pointerleave', off);
    el.addEventListener('focus', on); el.addEventListener('blur', off);
    li.appendChild(el); ui.links.appendChild(li);
  });
  // the bio is Sajjad speaking: his name in the strip
  ui.bioTitle.textContent = name;
  ui.bioName.textContent = ''; ui.bioName.hidden = true;
  ui.bioText.textContent = '';
  for (const line of SITE.bio[lang]) { const p = document.createElement('p'); p.textContent = line; ui.bioText.appendChild(p); }
  ui.bioFoot.textContent = ''; ui.bioFoot.hidden = true;
  ui.bio.querySelector('.close').setAttribute('aria-label', t.close);
  ui.noteTitle.textContent = t.noteTitle;
  document.getElementById('noteIco').innerHTML = uiIcon('ask');
  ui.noteBody.textContent = t.noteBody;
  ui.sceneExit.textContent = t.exit;
  for (const f of langHooks) f(lang);
}
function setLang(next) {
  lang = next;
  store.set('lang', lang);
  render();
  if (L) { buildStatic(); place(); if (active) sizeInterior(); }
}

/* ---------- street controls ---------- */
const hoverOn = (el, id) => {
  el.addEventListener('pointerenter', () => { hover = id; });
  el.addEventListener('pointerleave', () => { if (hover === id) hover = -1; });
  el.addEventListener('focus', () => { hover = id; });
  el.addEventListener('blur', () => { if (hover === id) hover = -1; });
};
hoverOn(ui.door, 99); hoverOn(ui.houseDoor, 97); hoverOn(ui.mosqueDoor, 98);
ui.door.addEventListener('click', () => {
  goTo(1); doorTo = 1; SND.bell();
  setTimeout(() => enter('cafe', ui.door), motion.matches ? 0 : 320);
});
ui.houseDoor.addEventListener('click', () => { goTo(0); enter('room', ui.houseDoor); });
ui.mosqueDoor.addEventListener('click', () => { goTo(2); enter('mosque', ui.mosqueDoor); });
document.addEventListener('pointerdown', e => {
  if (e.target.closest && (e.target.closest('.win') || e.target.closest('#corner'))) return;
  for (const w of wins) if (!w.hidden && w.classList.contains('on')) closeWin(w, true);
}, true);
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const open = wins.filter(w => !w.hidden);
  if (open.length) open.forEach(w => closeWin(w)); else if (active) leave();
});
ui.lang.addEventListener('click', () => setLang(lang === 'ar' ? 'en' : 'ar'));
ui.sound.addEventListener('click', () => {
  SND.unlock(); SND.setMuted(!SND.muted);
  ui.sound.setAttribute('aria-pressed', String(!SND.muted));
  ui.sound.setAttribute('aria-label', SND.muted ? SITE.ui[lang].soundOn : SITE.ui[lang].soundOff);
});
// every button and link answers with the retro click
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('button, a, select')) SND.click(); }, true);
// the rain starts with the visitor's first touch, as browsers require
addEventListener('pointerdown', () => SND.unlock(), { once: true });
addEventListener('keydown', () => SND.unlock(), { once: true });

document.addEventListener('visibilitychange', () => {
  if (document.hidden) cancelAnimationFrame(raf);
  else { last = performance.now(); raf = requestAnimationFrame(tick); }
});
let rt = 0;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });

/* ---------- the API other places use to join the street ---------- */
window.Street = {
  // def: { id, w, h, build(g, kit), draw(g, kit), spots() -> [{ box, label, open(button), pressed? }], hint, enter?, leave? }
  scene(def) { scenes[def.id] = def; },
  panel, kit, enter, leave, openBio,
  onLang(f) { langHooks.push(f); f(lang); },
  refreshSpots() { if (active) sizeInterior(); },
  get lang() { return lang; }
};

/* ---------- pixel lettering for the interface ---------- */
function pixelAll() {
  for (const el of [ui.bio, ui.note, document.getElementById('corner'), ui.inside, ...wins]) PixText.watch(el);
}
function pixelRefresh() { for (const el of [document.getElementById('corner'), ui.inside, ...wins]) PixText.refresh(el); }

/* ---------- start once the faces are in ---------- */
addEventListener('DOMContentLoaded', () => {
  render();
  const fonts = document.fonts ? Promise.race([
    Promise.all([document.fonts.load('400 10px "Pixel AE"', 'اسم'), document.fonts.load('700 10px "Pixel AE"', 'اسم'), document.fonts.load('400 12px "Pixel Kufi"', 'اسم'), document.fonts.load('8px "Pixel Silk"', 'Aa')]),
    new Promise(r => setTimeout(r, 2500))
  ]) : Promise.resolve();
  const pl = document.getElementById('preload');
  if (pl) pl.classList.add('go');
  fonts.catch(() => {}).then(() => {
    glyphCache.clear(); resize(); pixelAll(); raf = requestAnimationFrame(tick);
    // the loading screen folds away once the world is drawn
    if (pl) { pl.classList.add('done'); setTimeout(() => pl.remove(), 600); }
  });
  // a face that arrives late (a slow network) redraws the lettering in the pictures too
  if (document.fonts) document.fonts.addEventListener('loadingdone', () => { if (!L) return; glyphCache.clear(); buildStatic(); if (active) sizeInterior(); });
});
})();
