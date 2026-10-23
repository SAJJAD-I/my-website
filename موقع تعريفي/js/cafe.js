// the café inside: a booth under the street window, the counter and its machine, a reading corner by the fire.
// What the street sees through its two windows is what you find here.
(() => {
'use strict';
const SITE = window.SITE, ST = window.Street, k = ST.kit;
const MIN_W = 500, H = 250, FY = 194;
const at = {};
const T = (ar, en) => ({ ar, en });
let lampsOn = [true, true];
try { const v = JSON.parse(localStorage.getItem('cafeLamps')); if (Array.isArray(v)) lampsOn = v; } catch (e) {}
let ordered = null, brewAt = -1, servedAt = -99, machineBtn = null, fan = 1, swing = 0, fireKick = 0, flash = 0, pulled = null, cakeLeft = 6, coins = 2;

const pMenu = ST.panel('c_menu', 'a v-night win-wide win-reader', 'list');
const pBrew = ST.panel('c_brew', 'a v-coral', 'cup');
const pCake = ST.panel('c_cake', 'a v-pink', 'cake');
const pBooks = ST.panel('c_books', 'a v-green', 'book');
const pSeat = ST.panel('c_seat', 'a v-blue', 'fire');

function leaf(g, x, y, tone) {
  const C = ['#0c2220', '#12342e', '#1a4a3c', '#26624a', '#3f8258', '#6aa868'];
  g.fillStyle = C[Math.min(5, tone)]; g.fillRect(x + 1, y, 3, 1); g.fillRect(x, y + 1, 5, 2); g.fillRect(x + 1, y + 3, 3, 1);
  g.fillStyle = C[Math.min(5, tone + 1)]; g.fillRect(x + 1, y + 1, 2, 1);
}

// a small table for two with bentwood chairs and a picture above it; fills the floor on wide screens
function tableSet(g, x, R, lights) {
  const { rect, frame, P } = k, O = P.out;
  rect(g, x - 11, FY - 24, 22, 3, '#6a4a32'); rect(g, x - 11, FY - 24, 22, 1, '#8a6a48'); frame(g, x - 12, FY - 25, 24, 5, O);
  rect(g, x - 1, FY - 21, 3, 18, '#3a281c'); rect(g, x - 6, FY - 3, 13, 2, '#3a281c');
  rect(g, x - 4, FY - 30, 5, 5, '#f4ecd8'); rect(g, x + 1, FY - 29, 2, 2, '#f4ecd8'); rect(g, x + 4, FY - 28, 4, 3, '#e8c8a8');
  for (const s of [-1, 1]) {
    const cx = x + s * 20;
    rect(g, cx - 6, FY - 20, 12, 3, '#8c1440'); rect(g, cx - 6, FY - 20, 12, 1, '#c0305a');
    const bx = s < 0 ? cx - 6 : cx + 4;
    rect(g, bx, FY - 38, 2, 18, '#3a281c'); rect(g, s < 0 ? bx : bx - 6, FY - 38, 8, 2, '#3a281c');
    rect(g, cx - 5, FY - 17, 1, 17, '#3a281c'); rect(g, cx + 4, FY - 17, 1, 17, '#3a281c');
  }
  // a picture: a gold cup steaming on crimson, or a crescent over palms on navy
  const px = x - 14, py = 64, night = R() < .5;
  rect(g, px, py, 28, 34, night ? '#1a2450' : '#8c1440');
  if (night) { rect(g, px + 17, py + 6, 4, 4, '#ffe2a0'); rect(g, px + 18, py + 5, 3, 4, '#1a2450'); for (const t of [px + 7, px + 14]) { rect(g, t, py + 14, 1, 18, '#0e1430'); for (let a = -3; a <= 3; a++) rect(g, t + a, py + 15 - Math.abs(a), 1, 1, '#0e1430'); } }
  else { rect(g, px + 8, py + 16, 12, 10, '#e8b040'); rect(g, px + 20, py + 18, 3, 5, '#e8b040'); rect(g, px + 6, py + 26, 16, 2, '#e8b040'); for (const sx of [px + 10, px + 15]) for (let j = 0; j < 8; j++) rect(g, sx + (j % 4 < 2 ? 0 : 1), py + 5 + j, 1, 1, '#f4ecd8'); }
  frame(g, px - 1, py - 1, 30, 36, '#c8a050'); frame(g, px - 2, py - 2, 32, 38, O);
  at.lamps.push({ x, y: 104 });
  lights.push({ x, y: 112, rx: 50, ry: 70, c: '#ffcf8a', i: .75 });
}
function plantSet(g, x, R) {
  const { rect, frame, P } = k, O = P.out;
  rect(g, x - 7, FY - 16, 14, 16, '#b0603a'); rect(g, x - 7, FY - 16, 14, 1, '#d08050'); frame(g, x - 8, FY - 17, 16, 18, O);
  rect(g, x - 1, FY - 52, 2, 36, '#3a2a1e');
  for (let n = 0; n < 30; n++) leaf(g, x - 14 + Math.floor(R() * 26), FY - 80 + Math.floor(R() * 44), 2 + Math.floor(R() * 3));
  // a little shelf of jars above
  rect(g, x - 16, 70, 32, 3, '#5a3e2a'); rect(g, x - 16, 70, 32, 1, '#7a5638'); frame(g, x - 17, 69, 34, 5, O);
  for (let i = 0; i < 3; i++) { rect(g, x - 13 + i * 10, 61, 7, 9, '#d8e8f0'); rect(g, x - 12 + i * 10, 64, 5, 6, ['#6a3a1a', '#e8b040', '#3f8258'][i]); rect(g, x - 13 + i * 10, 61, 7, 1, '#8a6a48'); }
}

function build(g) {
  const { P, rect, frame, dither, glow, rng, dith, bake, text, measure } = k, R = rng(55), O = P.out;
  const W = g.canvas.width;
  at.lamps = [];
  rect(g, 0, 0, W, H, O);

  // walls: warm brick above green wood panelling, a gold rail between
  rect(g, 0, 0, W, FY, '#5a2a26');
  for (let r = 0; r * 6 < FY; r++) for (let i = (r & 1) * 6 - 6; i < W; i += 12) rect(g, i, r * 6, 11, 5, ['#6a322c', '#622e2a', '#743832', '#5c2a26'][Math.floor(R() * 4)]);
  const PT = FY - 58;
  rect(g, 0, PT, W, FY - PT, '#1e4a3a');
  for (let i = 4; i < W; i += 24) { frame(g, i, PT + 8, 18, FY - PT - 14, '#173a2e'); rect(g, i + 1, PT + 9, 16, 1, '#2e6a52'); }
  rect(g, 0, PT, W, 3, '#2e6a52'); rect(g, 0, PT + 3, W, 1, '#c8a050'); rect(g, 0, PT - 1, W, 1, O);
  rect(g, 0, FY - 5, W, 5, '#173a2e'); rect(g, 0, FY - 5, W, 1, '#2e6a52');
  // ceiling: a dark beam with joists
  rect(g, 0, 0, W, 10, '#2a1810'); rect(g, 0, 9, W, 2, '#3a2418');
  for (let i = 30; i < W; i += 90) { rect(g, i, 0, 8, 12, '#3a2418'); rect(g, i, 0, 1, 12, '#5a3a24'); }

  // floor: dark walnut planks running along the room, narrow at the wall and wider toward you, so it recedes
  for (let y = FY, h = 3, row = 0; y < H; y += h, h = Math.min(9, h + 1), row++) {
    rect(g, 0, y, W, h, ['#3a2418', '#36221a', '#3e281c'][row % 3]);
    rect(g, 0, y, W, 1, '#4a3022'); rect(g, 0, y + h - 1, W, 1, '#22140c');
    for (let x = Math.floor(R() * 40); x < W; x += 34 + Math.floor(R() * 24)) { rect(g, x, y, 1, h, '#22140c'); rect(g, x + 1, y + 1, 1, h - 2, '#4a3022'); }
    for (let n = 0; n < W / 30; n++) rect(g, Math.floor(R() * W), y + 1 + Math.floor(R() * Math.max(1, h - 2)), 3 + Math.floor(R() * 5), 1, '#32201a');
  }
  // a big rug in front of the counter, and a smaller one by the fire
  k.rug(g, 146, FY + 7, Math.max(120, W - 338), 30, 'crimson');
  k.rug(g, W - 182, FY + 9, 104, 24, 'navy');
  dither(g, 0, FY, W, 5, O, .4);
  rect(g, 0, FY - 1, W, 1, O);

  /* ----- left: the street window, the crimson booth under it ----- */
  const W0 = { x: 14, y: 30, w: 112, h: 96 };
  at.win = W0;
  rect(g, W0.x - 6, W0.y - 6, W0.w + 12, W0.h + 12, '#173a2e'); rect(g, W0.x - 6, W0.y - 6, W0.w + 12, 1, '#2e6a52'); frame(g, W0.x - 7, W0.y - 7, W0.w + 14, W0.h + 14, O);
  rect(g, W0.x - 9, W0.y + W0.h + 5, W0.w + 18, 4, '#5a3e2a'); rect(g, W0.x - 9, W0.y + W0.h + 5, W0.w + 18, 1, '#7a5638'); frame(g, W0.x - 10, W0.y + W0.h + 4, W0.w + 20, 6, O);
  // a flower pot on the sill
  rect(g, W0.x + W0.w - 16, W0.y + W0.h, 8, 5, '#b0603a'); for (let n = 0; n < 6; n++) leaf(g, W0.x + W0.w - 20 + Math.floor(R() * 12), W0.y + W0.h - 8 + Math.floor(R() * 6), 3);
  rect(g, W0.x + W0.w - 13, W0.y + W0.h - 10, 2, 2, '#ff5a96');
  // the booth: a tufted crimson bench against the panelling, its table standing in front
  rect(g, 8, FY - 48, 128, 3, '#c0305a'); rect(g, 8, FY - 45, 128, 21, '#8c1440');
  for (let i = 14; i < 132; i += 12) for (const ty of [FY - 40, FY - 31]) { rect(g, i + (ty < FY - 35 ? 0 : 6), ty, 1, 1, '#4a0c20'); rect(g, i + (ty < FY - 35 ? 0 : 6), ty + 1, 1, 1, '#c0305a'); }
  rect(g, 6, FY - 24, 132, 5, '#a3163e'); rect(g, 6, FY - 24, 132, 1, '#d02a5a'); rect(g, 8, FY - 19, 128, 19, '#5a0f28');
  for (let i = 18; i < 132; i += 16) rect(g, i, FY - 17, 1, 15, '#4a0c20');
  frame(g, 7, FY - 49, 130, 50, O); rect(g, 6, FY - 25, 132, 1, O);
  rect(g, 36, FY - 30, 72, 4, '#6a4a32'); rect(g, 36, FY - 30, 72, 1, '#8a6a48'); frame(g, 35, FY - 31, 74, 6, O);
  rect(g, 70, FY - 26, 4, 23, '#3a281c'); rect(g, 60, FY - 3, 24, 3, '#3a281c'); rect(g, 60, FY - 3, 24, 1, '#5a3e2a');
  rect(g, 44, FY - 36, 6, 6, '#f4ecd8'); rect(g, 50, FY - 35, 2, 3, '#f4ecd8'); rect(g, 43, FY - 30, 8, 1, '#c8b898'); rect(g, 45, FY - 36, 4, 1, '#5a2a10');
  rect(g, 88, FY - 35, 6, 5, '#f4ecd8'); rect(g, 94, FY - 34, 2, 3, '#f4ecd8'); rect(g, 89, FY - 35, 4, 1, '#5a2a10');
  at.cupA = { x: 46, y: FY - 38 }; at.cupB = { x: 90, y: FY - 37 };
  rect(g, 58, FY - 33, 18, 3, '#efe6c8'); rect(g, 66, FY - 33, 2, 3, '#c8b898'); rect(g, 58, FY - 31, 18, 1, '#8c1440');
  rect(g, 100, FY - 37, 3, 7, '#8ad0e0'); rect(g, 101, FY - 41, 1, 4, '#3f8258'); rect(g, 100, FY - 43, 3, 2, '#ff5a96');
  at.table = { x: 34, y: FY - 44, w: 76, h: 44 };
  // a cushion and the day's newspaper folded on the bench
  rect(g, 10, FY - 31, 14, 7, '#e8b040'); rect(g, 10, FY - 31, 14, 1, '#ffd27a'); rect(g, 16, FY - 29, 2, 2, '#c07426'); frame(g, 9, FY - 32, 16, 9, O);
  rect(g, 112, FY - 27, 16, 3, '#e8e2d0'); for (let i = 114; i < 127; i += 3) rect(g, i, FY - 26, 2, 1, '#8a8478'); rect(g, 112, FY - 27, 16, 1, '#fffaf0'); frame(g, 111, FY - 28, 18, 5, O);
  at.paper = { x: 108, y: FY - 32, w: 24, h: 10 };
  // the fan turns above the booth; its mount
  at.fan = { x: 70, y: 14 };
  rect(g, at.fan.x, 10, 1, 4, O);

  /* ----- centre: the counter and what stands on it, shelves and the chalk menu behind ----- */
  const R0 = W - 186, s0 = 142, span = R0 - 4 - s0;
  const cw = Math.min(200, span - 8), c0 = s0 + Math.floor((span - cw) / 2), c1 = c0 + cw;
  at.c0 = c0; at.c1 = c1;
  for (const sy of [76, 100]) {
    rect(g, c0 + 2, sy, cw - 4, 3, '#5a3e2a'); rect(g, c0 + 2, sy, cw - 4, 1, '#7a5638'); frame(g, c0 + 1, sy - 1, cw - 2, 5, O);
    let x = c0 + 6;
    while (x < c1 - 12) {
      const kind = R();
      if (kind < .4) { rect(g, x, sy - 9, 7, 9, '#d8e8f0'); rect(g, x, sy - 9, 7, 1, '#8a6a48'); rect(g, x + 1, sy - 6, 5, 6, ['#6a3a1a', '#e8b040', '#3a1a10', '#3f8258'][Math.floor(R() * 4)]); x += 9; }
      else if (kind < .72) { rect(g, x, sy - 6, 6, 6, '#f4ecd8'); rect(g, x + 6, sy - 5, 1, 3, '#f4ecd8'); rect(g, x, sy - 6, 6, 1, '#fffaf0'); x += 9; }
      else { rect(g, x, sy - 11, 8, 11, ['#8a5a32', '#5a3a24', '#a3163e'][Math.floor(R() * 3)]); rect(g, x + 2, sy - 8, 4, 3, '#efe6c8'); x += 11; }
    }
  }
  const M = { x: c0 + 18, y: 14, w: cw - 36, h: 40 };
  rect(g, M.x, M.y, M.w, M.h, '#1a2420'); frame(g, M.x - 1, M.y - 1, M.w + 2, M.h + 2, '#5a3e2a'); frame(g, M.x - 2, M.y - 2, M.w + 4, M.h + 4, '#3a281c'); frame(g, M.x - 3, M.y - 3, M.w + 6, M.h + 6, O);
  for (let n = 0; n < 40; n++) rect(g, M.x + 2 + Math.floor(R() * (M.w - 4)), M.y + 2 + Math.floor(R() * (M.h - 4)), 1 + Math.floor(R() * 3), 1, '#24302a');
  at.menu = M;
  const CT = FY - 46;
  at.ct = CT;
  rect(g, c0 - 4, CT, cw + 8, 5, '#7a5638'); rect(g, c0 - 4, CT, cw + 8, 1, '#9a7650'); frame(g, c0 - 5, CT - 1, cw + 10, 7, O);
  rect(g, c0, CT + 5, cw, FY - CT - 5, '#1e4a3a');
  for (let i = c0 + 4; i < c1 - 10; i += 22) { frame(g, i, CT + 10, 18, FY - CT - 16, '#173a2e'); rect(g, i + 1, CT + 11, 16, 1, '#2e6a52'); }
  rect(g, c0, CT + 6, cw, 1, '#c8a050'); frame(g, c0 - 1, CT + 5, cw + 2, FY - CT - 4, O);
  // what stands on the counter, left to right: the cake, the grinder, the machine, the tip jar, cups, the till
  const b0 = c0 + Math.floor((cw - 154) / 2);
  at.cake = { x: b0 + 4, y: CT - 22, w: 26, h: 22 };
  const gx = b0 + 36;
  rect(g, gx, CT - 22, 10, 6, '#3a2418'); rect(g, gx + 1, CT - 27, 8, 5, '#9ab0c0'); rect(g, gx + 2, CT - 25, 6, 3, '#3a1a10'); rect(g, gx + 2, CT - 16, 6, 16, '#2a2a30'); rect(g, gx + 2, CT - 16, 1, 16, '#4a4a52'); frame(g, gx - 1, CT - 28, 12, 28, O);
  const E = { x: b0 + 52, y: CT - 30, w: 34, h: 30 };
  rect(g, E.x, E.y, E.w, E.h, '#b8bcc8'); rect(g, E.x, E.y, E.w, 2, '#e0e4ec'); rect(g, E.x + E.w - 3, E.y, 3, E.h, '#8a8e9a');
  rect(g, E.x + 2, E.y + 4, E.w - 4, 7, '#2a2a30'); rect(g, E.x + 5, E.y + 5, 5, 5, '#e8e4d0'); rect(g, E.x + 24, E.y + 5, 5, 5, '#e8e4d0'); rect(g, E.x + 26, E.y + 6, 2, 1, '#111'); rect(g, E.x + 7, E.y + 7, 1, 2, '#111');
  rect(g, E.x + 12, E.y + 14, 10, 4, '#2a2a30'); rect(g, E.x + 15, E.y + 18, 4, 2, '#4a4a52'); rect(g, E.x + 9, E.y + 15, 4, 2, '#1a1a20');
  rect(g, E.x + E.w, E.y + 12, 4, 2, '#8a8e9a'); rect(g, E.x + E.w + 3, E.y + 14, 1, 9, '#8a8e9a');
  rect(g, E.x + 4, E.y + E.h - 4, E.w - 8, 3, '#4a4a52'); for (let i = E.x + 5; i < E.x + E.w - 5; i += 2) rect(g, i, E.y + E.h - 4, 1, 1, '#2a2a30');
  frame(g, E.x - 1, E.y - 1, E.w + 2, E.h + 1, O);
  rect(g, E.x + 9, E.y - 6, 16, 6, '#f4ecd8'); for (let i = 0; i < 4; i++) rect(g, E.x + 9 + i * 4, E.y - 6, 1, 6, '#d8cfb4'); frame(g, E.x + 8, E.y - 7, 18, 7, O);
  at.machine = E;
  at.jar = { x: b0 + 98, y: CT - 16, w: 12, h: 16 };
  rect(g, at.jar.x + 1, CT - 14, 10, 14, '#2a3a44'); rect(g, at.jar.x + 2, CT - 14, 1, 13, '#c8e0f0'); rect(g, at.jar.x, CT - 16, 12, 2, '#8a6a48'); frame(g, at.jar.x, CT - 15, 12, 15, O);
  for (let n = 0; n < 4; n++) { rect(g, b0 + 116, CT - 5 - n * 4, 9, 4, '#f4ecd8'); rect(g, b0 + 116, CT - 5 - n * 4, 9, 1, '#fffaf0'); rect(g, b0 + 116, CT - 2 - n * 4, 9, 1, '#d8cfb4'); }
  rect(g, b0 + 132, CT - 14, 16, 14, '#3a3448'); rect(g, b0 + 132, CT - 14, 16, 1, '#5a5468'); rect(g, b0 + 130, CT - 3, 20, 3, '#2a2438'); frame(g, b0 + 131, CT - 15, 18, 15, O);
  at.till = { x: b0 + 134, y: CT - 12 };
  for (const l of [c0 + 8, c1 - 8]) at.lamps.push({ x: l, y: 60 });

  /* ----- right: the reading corner by the fire ----- */
  const st = R0 + 2;
  rect(g, st, FY - 18, 18, 3, '#3d2a6e'); rect(g, st, FY - 18, 18, 1, '#5d4a8e'); rect(g, st + 7, FY - 15, 4, 15, '#2d1e54'); rect(g, st + 3, FY - 2, 12, 2, '#2d1e54'); frame(g, st - 1, FY - 19, 20, 5, O);
  // the yellow folder on the side table, like the corner in the shorts
  rect(g, st + 3, FY - 26, 12, 8, '#e8b030'); rect(g, st + 3, FY - 28, 6, 2, '#e8b030'); rect(g, st + 3, FY - 26, 12, 1, '#ffd060'); rect(g, st + 4, FY - 23, 10, 1, '#c89020'); frame(g, st + 2, FY - 29, 14, 12, O);
  const A = { x: R0 + 22, y: FY - 44, w: 38, h: 44 };
  rect(g, A.x + 4, A.y, A.w - 8, 26, '#8c1440'); rect(g, A.x + 4, A.y, A.w - 8, 2, '#b01c50');
  for (let i = A.x + 10; i < A.x + A.w - 8; i += 8) rect(g, i, A.y + 10, 1, 1, '#c0305a');
  rect(g, A.x, A.y + 14, 8, 26, '#a3163e'); rect(g, A.x + A.w - 8, A.y + 14, 8, 26, '#a3163e'); rect(g, A.x, A.y + 14, 8, 1, '#d02a5a'); rect(g, A.x + A.w - 8, A.y + 14, 8, 1, '#d02a5a');
  rect(g, A.x + 6, A.y + 24, A.w - 12, 10, '#a3163e'); rect(g, A.x + 6, A.y + 24, A.w - 12, 1, '#d02a5a');
  rect(g, A.x + 3, A.y + 40, 3, 4, '#3a281c'); rect(g, A.x + A.w - 6, A.y + 40, 3, 4, '#3a281c');
  frame(g, A.x - 1, A.y - 1, A.w + 2, A.h - 2, O);
  // a woollen throw over the arm
  for (let j = 0; j < 12; j++) rect(g, A.x + A.w - 9, A.y + 14 + j, 9, 1, j % 3 ? '#e8b040' : '#c07426');
  at.chair = A;
  // a floor lamp behind the chair
  const fl = R0 + 64;
  rect(g, fl, FY - 80, 2, 80, '#2a2438'); rect(g, fl - 7, FY - 90, 16, 10, '#e8d8b0'); rect(g, fl - 7, FY - 90, 16, 1, '#fff0c8'); frame(g, fl - 8, FY - 91, 18, 12, O); rect(g, fl - 4, FY - 2, 10, 2, '#2a2438');
  // a pendulum clock on the wall above the chair; its hands keep real time
  const CK = { x: R0 + 34, y: 84 };
  rect(g, CK.x - 6, CK.y + 8, 12, 22, '#5a3420'); rect(g, CK.x - 4, CK.y + 10, 8, 18, '#2a1810'); frame(g, CK.x - 7, CK.y + 7, 14, 24, O);
  for (let j = -8; j <= 8; j++) { const hw = Math.round(Math.sqrt(64 - j * j)); rect(g, CK.x - hw, CK.y + j, hw * 2 + 1, 1, '#5a3420'); }
  for (let j = -7; j <= 7; j++) { const hw = Math.round(Math.sqrt(49 - j * j)); rect(g, CK.x - hw, CK.y + j, hw * 2 + 1, 1, '#f4ecd8'); }
  for (let h = 0; h < 12; h++) rect(g, CK.x + Math.round(Math.sin(h / 6 * Math.PI) * 6), CK.y - Math.round(Math.cos(h / 6 * Math.PI) * 6), 1, 1, '#5a3420');
  at.clock = CK;
  // the fireplace in crimson brick with a wooden mantel; candles and a picture above it
  const F = { x: R0 + 76, y: FY - 70, w: 62, h: 70 };
  rect(g, F.x, F.y, F.w, F.h, '#4a1220');
  for (let r = 0; r * 5 < F.h; r++) for (let i = (r & 1) * 5 - 5; i < F.w; i += 10) { const bx = Math.max(0, i), bw = Math.min(i + 9, F.w) - bx; if (bw > 0) rect(g, F.x + bx, F.y + r * 5, bw, 4, ['#5e1a2a', '#561626', '#66202e'][Math.floor(R() * 3)]); }
  rect(g, F.x - 4, F.y - 6, F.w + 8, 6, '#5a3e2a'); rect(g, F.x - 4, F.y - 6, F.w + 8, 1, '#7a5638'); frame(g, F.x - 5, F.y - 7, F.w + 10, 8, O);
  rect(g, F.x + 12, F.y + 22, F.w - 24, F.h - 22, '#140a0a'); frame(g, F.x + 11, F.y + 21, F.w - 22, F.h - 21, O);
  rect(g, F.x + 16, FY - 6, F.w - 32, 3, '#4a2a1a'); rect(g, F.x + 18, FY - 9, F.w - 36, 3, '#5a3420');
  frame(g, F.x - 1, F.y - 1, F.w + 2, F.h + 1, O);
  rect(g, F.x - 8, FY - 4, F.w + 16, 4, '#3a3448'); rect(g, F.x - 8, FY - 4, F.w + 16, 1, '#5a5468');
  // a poker leaning beside it
  rect(g, F.x + F.w + 2, FY - 10, 4, 6, '#2a2438'); rect(g, F.x + F.w + 3, FY - 24, 1, 14, '#2a2438');
  at.fire = F;
  at.candles = [F.x + 3, F.x + F.w - 6];
  for (const cx of at.candles) { rect(g, cx, F.y - 13, 3, 7, '#f4ecd8'); rect(g, cx - 1, F.y - 7, 5, 1, '#c8a050'); }
  const pic = { x: F.x + 12, y: F.y - 38, w: 38, h: 26 };
  rect(g, pic.x, pic.y, pic.w, pic.h, '#1a2450');
  for (let j = 0; j < pic.h; j++) dither(g, pic.x, pic.y + j, pic.w, 1, '#2a3870', j / 32);
  rect(g, pic.x + 26, pic.y + 5, 4, 4, '#ffe2a0'); rect(g, pic.x + 27, pic.y + 4, 3, 4, '#1a2450');
  for (const px of [pic.x + 8, pic.x + 17]) { rect(g, px, pic.y + 10, 1, 16, '#0e1430'); for (let a = -3; a <= 3; a++) rect(g, px + a, pic.y + 11 - Math.abs(a), 1, 1, '#0e1430'); }
  frame(g, pic.x - 1, pic.y - 1, pic.w + 2, pic.h + 2, '#e8c060'); frame(g, pic.x - 2, pic.y - 2, pic.w + 4, pic.h + 4, '#a07830'); frame(g, pic.x - 3, pic.y - 3, pic.w + 6, pic.h + 6, O);
  // the bookcase, floor to ceiling
  const bs = { x: W - 40, y: 18, w: 36, h: FY - 18 };
  rect(g, bs.x, bs.y, bs.w, bs.h, '#3e2c1e'); rect(g, bs.x, bs.y, 1, bs.h, '#5a4030'); frame(g, bs.x - 1, bs.y - 1, bs.w + 2, bs.h + 1, O);
  at.spines = [];
  for (let sy = bs.y + 24; sy < FY - 4; sy += 24) {
    rect(g, bs.x + 2, sy - 22, bs.w - 4, 22, '#24180f');
    let x = bs.x + 3;
    while (x < bs.x + bs.w - 5) {
      const w2 = 2 + Math.floor(R() * 3), h2 = 12 + Math.floor(R() * 8), c = ['#8c1440', '#3d2a6e', '#d8cfb4', '#5a2e12', '#2a6a8a', '#3f8258', '#c07426'][Math.floor(R() * 7)];
      rect(g, x, sy - h2, w2, h2, c); rect(g, x, sy - h2 + 2, w2, 1, '#e8b040');
      at.spines.push({ x, y: sy - h2, w: w2, h: h2, c });
      x += w2 + (R() < .12 ? 2 : 0);
    }
    rect(g, bs.x + 1, sy, bs.w - 2, 2, '#5a4030');
  }
  at.books = bs;

  /* ----- wide screens: more tables and plants between the zones ----- */
  const lights = [];
  const fill = (x0, x1) => {
    const gw = x1 - x0;
    if (gw < 70) return;
    const n = Math.max(1, Math.floor(gw / 84)), step = gw / n;
    for (let i = 0; i < n; i++) { const x = Math.round(x0 + step * (i + .5)); if (i % 2) plantSet(g, x, R); else tableSet(g, x, R, lights); }
  };
  fill(s0, c0 - 6); fill(c1 + 6, R0 - 4);

  // light: pendants over the counter, the fire, the reading lamp, the cold street through the glass
  lights.push(
    ...at.lamps.slice(0, 2).filter((l, i) => lampsOn[i] !== false).map(l => ({ x: l.x, y: l.y + 10, rx: 70, ry: 90, c: '#ffcf8a', i: .9 })),
    { x: F.x + F.w / 2, y: FY - 18, rx: 80, ry: 56, c: '#ff8a3a', i: .75 },
    { x: fl + 1, y: FY - 84, rx: 60, ry: 76, c: '#ffd590', i: .7 },
    { x: W0.x + W0.w / 2, y: W0.y + W0.h, rx: 90, ry: 96, c: '#6a8ae0', i: .45 },
    { x: 72, y: FY - 40, rx: 56, ry: 30, c: '#ffcf8a', i: .4 }
  );
  bake(g, W, H, [.62, .58, .72], lights);

  // drawn after the light so it stays itself: the cold street, the chalk, the screens
  for (let j = 0; j < W0.h; j++) for (let i = 0; i < W0.w; i++) rect(g, W0.x + i, W0.y + j, 1, 1, dith(i, j) < j / W0.h * .9 ? '#16204a' : '#0c1236');
  let bxw = W0.x;
  while (bxw < W0.x + W0.w) {
    const w2 = Math.min(6 + Math.floor(R() * 10), W0.x + W0.w - bxw), h2 = 18 + Math.floor(R() * 36);
    rect(g, bxw, W0.y + W0.h - 22 - h2, w2, h2, '#0a0c22');
    for (let n = 0; n < h2 / 4; n++) if (R() < .5) rect(g, bxw + 1 + Math.floor(R() * Math.max(1, w2 - 2)), W0.y + W0.h - 22 - h2 + 2 + Math.floor(R() * (h2 - 3)), 1, 1, R() < .7 ? '#e8a040' : '#ff5a96');
    bxw += w2;
  }
  rect(g, W0.x, W0.y + W0.h - 22, W0.w, 22, '#0a0a1a'); rect(g, W0.x, W0.y + W0.h - 22, W0.w, 1, '#272043');
  for (const lpx of [W0.x + 22, W0.x + 90]) {
    rect(g, lpx, W0.y + W0.h - 62, 1, 40, '#15132a'); rect(g, lpx - 2, W0.y + W0.h - 64, 5, 2, '#fff0c0');
    for (let j = 1; j < 6; j++) rect(g, lpx - Math.floor(j / 2), W0.y + W0.h - 62 + j, 1 + 2 * Math.floor(j / 2), 1, j < 3 ? '#4a4060' : '#2a2648');
    rect(g, lpx - 5, W0.y + W0.h - 21, 11, 1, '#4a4060');
  }
  // the menu in chalk: the board reads the café's own list
  const ar = ST.lang === 'ar', items = SITE.menu[ST.lang].slice(0, 4), colW = Math.floor((M.w - 16) / 2);
  const two = items.every(it => measure(it[0]) <= colW);
  (two ? items : items.slice(0, 2)).forEach((it, i) => {
    const col = two ? i % 2 : 0, row = two ? Math.floor(i / 2) : i;
    const x = ar ? M.x + M.w - 6 - col * (colW + 4) : M.x + 6 + col * (colW + 4);
    text(g, it[0], x, M.y + 16 + row * 17, '#f4efe2', { align: ar ? 'right' : 'left' });
  });
  if (!two) {
    // a chalk cup in the free half of the board, steam curling off it
    const ch = '#d8d4c8', dx = ar ? M.x + 12 : M.x + M.w - 30, dy = M.y + 16;
    frame(g, dx, dy, 12, 10, ch); rect(g, dx + 12, dy + 2, 3, 1, ch); rect(g, dx + 14, dy + 3, 1, 3, ch); rect(g, dx + 12, dy + 6, 3, 1, ch);
    rect(g, dx - 3, dy + 11, 18, 1, ch); rect(g, dx - 1, dy + 12, 14, 1, ch);
    for (const sx of [dx + 3, dx + 8]) for (let j = 0; j < 9; j++) rect(g, sx + (j % 4 < 2 ? 0 : 1), dy - 3 - j, 1, 1, ch);
    for (let i = 0; i < 3; i++) rect(g, dx + 2 + i * 3, dy + 4, 1, 1, '#ff5a96');
  }
  rect(g, at.till.x, at.till.y, 12, 4, '#9fe0b0'); rect(g, at.till.x + 1, at.till.y + 1, 5, 1, '#2a6a4a');
}

function draw(g) {
  const { P, rect, glow, sprite, spawn, time, still } = k, O = P.out;
  // rain runs down the street window; lightning when asked
  const W0 = at.win;
  g.save(); g.beginPath(); g.rect(W0.x, W0.y, W0.w, W0.h); g.clip();
  g.fillStyle = 'rgba(160,178,236,.45)';
  for (let n = 0; n < W0.w * .7; n++) { const sp = 55 + (n * 37) % 50, y = (time * sp + n * 53) % (W0.h + 10) - 5, x = W0.x + ((n * 29 + Math.floor(time * sp * .22)) % W0.w); g.fillRect(x, Math.round(W0.y + y), 1, 3); }
  g.fillStyle = 'rgba(200,215,255,.55)';
  for (let n = 0; n < 12; n++) { const y = (time * (4 + n % 3) + n * 17) % W0.h; g.fillRect(W0.x + (n * 11 + 3) % W0.w, Math.round(W0.y + y), 1, 2); }
  if (flash > 0) { g.globalAlpha = Math.min(1, flash) * .7; g.fillStyle = '#dfe6ff'; g.fillRect(W0.x, W0.y, W0.w, W0.h); g.globalAlpha = 1; flash -= .04; }
  g.restore();
  const m1 = W0.x + Math.floor(W0.w / 3), m2 = W0.x + Math.floor(W0.w * 2 / 3);
  rect(g, m1, W0.y, 2, W0.h, '#173a2e'); rect(g, m2, W0.y, 2, W0.h, '#173a2e'); rect(g, W0.x, W0.y + 32, W0.w, 2, '#173a2e'); rect(g, W0.x, W0.y + 34, W0.w, 1, '#c8a050');

  // the fire: tongues that never hold still, embers rising
  const F = at.fire, fx0 = F.x + 16, fw = F.w - 32;
  for (let i = 0; i < fw; i++) {
    const mid = i > 3 && i < fw - 3 ? 6 : 0;
    const h = Math.max(2, 7 + mid + Math.round((Math.sin(time * 9 + i * 1.7) + Math.sin(time * 5.3 + i * .9)) * 2.5 + fireKick * 9 * Math.sin(i / fw * Math.PI)));
    for (let j = 0; j < h; j++) rect(g, fx0 + i, FY - 9 - j, 1, 1, j < h * .35 ? '#fff0a0' : j < h * .7 ? '#ffb040' : '#e8502a');
  }
  if (!still && Math.random() < .05 + fireKick * .5) spawn('spark', fx0 + Math.random() * fw, FY - 16, 1);
  fireKick = Math.max(0, fireKick - .012);
  for (const cx of at.candles) { const f = still ? 0 : Math.round(Math.sin(time * 11 + cx) * .8); rect(g, cx + 1, F.y - 16 + f, 1, 3 - f, '#ffd060'); rect(g, cx + 1, F.y - 15, 1, 1, '#fff6d0'); }

  // pendant lamps swing a little, more after a touch
  for (const [n, l] of at.lamps.entries()) {
    const sw = still ? 0 : Math.sin(time * 1.3 + n) * (.6 + swing * 4);
    const lx = Math.round(l.x + sw);
    for (let j = 11; j < l.y; j++) rect(g, Math.round(l.x + sw * (j - 11) / (l.y - 11)), j, 1, 1, O);
    rect(g, lx - 4, l.y, 9, 2, '#1e4a3a'); rect(g, lx - 6, l.y + 2, 13, 3, '#2e6a52'); rect(g, lx - 6, l.y + 2, 13, 1, '#4a8a6a');
    const lit = n > 1 || lampsOn[n] !== false;
    rect(g, lx - 5, l.y + 5, 11, 1, lit ? '#fff0c0' : '#3a3448'); rect(g, lx - 1, l.y + 6, 3, 1, lit ? '#fff8e0' : '#2a2438');
    if (lit) glow(g, lx, l.y + 8, 10, 5, '#ffe6aa', .45);
  }
  swing = Math.max(0, swing - .005);

  // the ceiling fan turns at its speed
  const fa = at.fan, ang = still ? .4 : time * 3.4 * fan;
  for (let b = 0; b < 4; b++) {
    const a = ang + b * Math.PI / 2, ex = Math.cos(a) * 17, ey = Math.sin(a) * 2.5;
    for (let s = 3; s <= 17; s++) rect(g, fa.x + Math.round(ex * s / 17), fa.y + 1 + Math.round(ey * s / 17), 1, s > 5 ? 2 : 1, s > 5 ? '#5a3e2a' : '#3a3448');
  }
  rect(g, fa.x - 2, fa.y, 5, 3, '#3a3448'); rect(g, fa.x - 1, fa.y + 3, 3, 1, '#ffd27a');

  // the cups on the booth table keep steaming
  if (!still && Math.random() < .07) spawn('steam', at.cupA.x + Math.random() * 3, at.cupA.y, 1);
  if (!still && Math.random() < .05) spawn('steam', at.cupB.x + Math.random() * 3, at.cupB.y, 1);

  // the machine: a cup is placed, coffee runs, steam bursts, then it is ready
  const E = at.machine;
  if (brewAt >= 0) {
    const t = time - brewAt, cupX = E.x + 13, cupY = at.ct - 7;
    rect(g, E.x + 7, E.y + 7, 1, 2, (time * 6 | 0) % 2 ? '#5aff7a' : '#e83a3a');
    rect(g, cupX, cupY, 8, 7, '#f4ecd8'); rect(g, cupX + 8, cupY + 2, 2, 3, '#f4ecd8'); rect(g, cupX - 1, cupY + 7, 10, 1, '#c8b898');
    if (t > .3 && t < 2) for (let j = E.y + 20; j < cupY + 1; j++) rect(g, cupX + 3 + (j % 2), j, 1, 1, '#6a3418');
    const fillH = Math.max(0, Math.min(5, Math.floor((t - .3) * 3)));
    if (fillH) { rect(g, cupX + 1, cupY + 6 - fillH, 6, fillH, '#6a3418'); rect(g, cupX + 1, cupY + 6 - fillH, 6, 1, '#c08a50'); }
    if (!still && Math.random() < .5) spawn('steam', E.x + E.w + 3, E.y + 22, 1);
    if (t > 2.1 && !still && Math.random() < .3) spawn('steam', cupX + 3, cupY - 1, 1);
    if (t > 2.6) { brewAt = -1; servedAt = time; spawn('heart', cupX + 4, cupY - 4, 2); k.SND.coin(); showBrew(); }
  } else if (time - servedAt < 12) {
    // the cup waits on the tray, still steaming, until it cools
    const cupX = E.x + 13, cupY = at.ct - 7;
    rect(g, cupX, cupY, 8, 7, '#f4ecd8'); rect(g, cupX + 8, cupY + 2, 2, 3, '#f4ecd8'); rect(g, cupX - 1, cupY + 7, 10, 1, '#c8b898');
    rect(g, cupX + 1, cupY + 1, 6, 1, '#c08a50');
    if (!still && Math.random() < .08) spawn('steam', cupX + 2 + Math.random() * 3, cupY - 1, 1);
  }
  // coins gather in the jar
  const J = at.jar;
  for (let n = 0; n < Math.min(12, coins); n++) rect(g, J.x + 3 + (n % 3) * 2, J.y + 13 - Math.floor(n / 3) * 2, 2, 2, n % 2 ? '#e8c060' : '#c8a040');

  // the cake under its glass dome, a slice fewer each time
  const ck = at.cake;
  rect(g, ck.x + 1, ck.y + 20, ck.w - 2, 2, '#d8d4cc'); rect(g, ck.x + 1, ck.y + 21, ck.w - 2, 1, '#8a8478');
  if (cakeLeft) {
    const cwid = Math.round((ck.w - 8) * cakeLeft / 6);
    rect(g, ck.x + 4, ck.y + 10, cwid, 10, '#e8c8a8'); rect(g, ck.x + 4, ck.y + 10, cwid, 2, '#ff8ab0'); rect(g, ck.x + 4, ck.y + 15, cwid, 1, '#a0602a');
    for (let i = 0; i < cwid - 1; i += 4) rect(g, ck.x + 5 + i, ck.y + 9, 2, 1, '#e83a5a');
  }
  for (let j = 0; j < 18; j++) { const hw = Math.round(Math.sqrt(Math.max(0, 1 - ((18 - j) / 18) ** 2)) * (ck.w / 2 - 1)); rect(g, ck.x + ck.w / 2 - hw, ck.y + 2 + j, 1, 1, '#c8e0f0'); rect(g, ck.x + ck.w / 2 + hw - 1, ck.y + 2 + j, 1, 1, '#c8e0f0'); }
  rect(g, ck.x + ck.w / 2 - 1, ck.y, 2, 2, '#c8e0f0'); rect(g, ck.x + 6, ck.y + 6, 1, 4, '#ffffff');

  // the clock keeps real time; its pendulum swings
  const CK = at.clock, d = new Date();
  const ha = (d.getHours() % 12 + d.getMinutes() / 60) / 6 * Math.PI, ma = d.getMinutes() / 30 * Math.PI;
  for (let s = 1; s <= 3; s++) rect(g, CK.x + Math.round(Math.sin(ha) * s), CK.y - Math.round(Math.cos(ha) * s), 1, 1, O);
  for (let s = 1; s <= 5; s++) rect(g, CK.x + Math.round(Math.sin(ma) * s), CK.y - Math.round(Math.cos(ma) * s), 1, 1, '#5a3420');
  rect(g, CK.x, CK.y, 1, 1, '#c0305a');
  const pa = still ? 0 : Math.sin(time * Math.PI) * .35;
  for (let s = 0; s < 13; s++) rect(g, CK.x + Math.round(Math.sin(pa) * s), CK.y + 11 + s, 1, 1, '#c8a050');
  rect(g, CK.x + Math.round(Math.sin(pa) * 13) - 1, CK.y + 23, 3, 3, '#e8c060');

  // a book lifted from the shelf, put back after a moment
  if (pulled) {
    const b = pulled, lift = Math.max(0, Math.min(1, (time - b.at) * 6, (b.at + 2.2 - time) * 6));
    rect(g, b.x, b.y, b.w, b.h, '#24180f');
    rect(g, b.x, b.y - Math.round(lift * 5), b.w, b.h, b.c); rect(g, b.x, b.y - Math.round(lift * 5) + 2, b.w, 1, '#ffd060');
    if (time > b.at + 2.4) pulled = null;
  }
}

function say(panel, b, ar, en) {
  panel.body.textContent = '';
  const p = document.createElement('p'); p.textContent = ST.lang === 'ar' ? ar : en; panel.body.appendChild(p);
  panel.open(b);
}
function list(panel, b, items) {
  panel.body.textContent = '';
  const ul = document.createElement('ul'); ul.className = 'item-list';
  for (const x of items) { const li = document.createElement('li'); li.textContent = x; ul.appendChild(li); }
  panel.body.appendChild(ul); panel.open(b);
}
function openBooks(b) {
  const lang = ST.lang, names = SITE.cafeBooks[lang], notes = (SITE.cafeBookNotes || {})[lang] || [];
  pBooks.body.textContent = '';
  const ul = document.createElement('ul'); ul.className = 'item-list';
  names.forEach((nm, i) => {
    const li = document.createElement('li'), a = document.createElement('button'); a.type = 'button'; a.className = 'pick'; a.textContent = nm;
    a.addEventListener('click', () => {
      k.SND.page();
      pBooks.body.textContent = '';
      const page = document.createElement('div'); page.className = 'mushaf-page book-page';
      const h = document.createElement('p'); h.className = 'card-title'; h.textContent = nm; page.appendChild(h);
      const p = document.createElement('p'); p.textContent = notes[i] || ''; page.appendChild(p);
      pBooks.body.appendChild(page);
      const back = document.createElement('button'); back.type = 'button'; back.className = 'btn small'; back.textContent = lang === 'ar' ? 'رجوع إلى الرف' : 'Back to the shelf';
      back.addEventListener('click', () => { k.SND.click(); openBooks(b); });
      pBooks.body.appendChild(back);
    });
    li.appendChild(a); ul.appendChild(li);
  });
  pBooks.body.appendChild(ul);
  if (!pBooks.isOpen) pBooks.open(b);
}
function showBrew() {
  const at2 = machineBtn && machineBtn.isConnected ? machineBtn : null;
  if (ordered) say(pBrew, at2, 'طلبك جاهز: ' + ordered[0] + '. بالهناء والعافية!', 'Your order is ready: ' + ordered[0] + '. Enjoy!');
  else say(pBrew, at2, 'تفضّل، قهوتك جاهزة. بالهناء والعافية!', 'Here you go, your coffee is ready. Enjoy!');
  ordered = null;
}
const CUP = '<svg viewBox="0 0 9 8" shape-rendering="crispEdges" aria-hidden="true"><path fill="#e8e4d0" d="M2 0h1v1H2zM4 0h1v1H4zM3 1h1v1H3zM5 1h1v1H5zM0 3h7v1H0zM0 4h1v3H0zM6 4h1v3H6zM7 4h2v1H7zM8 5h1v1H8zM7 6h1v1H7zM1 7h5v1H1z"/><path fill="#c08a50" d="M1 4h5v3H1z"/></svg>';
function openMenu(b) {
  const lang = ST.lang, ar = lang === 'ar';
  pMenu.body.textContent = '';
  const row = document.createElement('div'); row.className = 'cards menu-cards';
  SITE.menu[lang].forEach((it, i) => {
    const card = document.createElement('div'); card.className = 'card';
    const ic = document.createElement('span'); ic.className = 'pico'; ic.innerHTML = CUP; card.appendChild(ic);
    const n = document.createElement('p'); n.className = 'card-title'; n.textContent = it[0]; card.appendChild(n);
    const d = document.createElement('p'); d.className = 'src muted'; d.textContent = it[1]; card.appendChild(d);
    const go = document.createElement('button'); go.type = 'button'; go.className = 'btn count'; go.textContent = ar ? 'اطلب' : 'Order';
    go.addEventListener('click', () => {
      if (brewAt >= 0) return;
      ordered = it; pMenu.close();
      const mb = [...document.querySelectorAll('#spots button')].find(x => x.getAttribute('aria-label') === (ar ? 'آلة القهوة' : 'Espresso machine'));
      machineBtn = mb || b; brewAt = k.time; k.SND.hiss(2.4);
    });
    card.appendChild(go);
    row.appendChild(card);
  });
  pMenu.body.appendChild(row);
  pMenu.open(b);
}
ST.onLang(lang => {
  const ar = lang === 'ar';
  pMenu.title(ar ? 'قائمة المشروبات' : 'Drinks'); pBrew.title(ar ? 'آلة القهوة' : 'Espresso'); pCake.title(ar ? 'الكيك' : 'Cake');
  pBooks.title(ar ? 'رف المقهى' : 'The café shelf'); pSeat.title(ar ? 'ركن القراءة' : 'Reading corner');
});

ST.scene({
  id: 'cafe', w: MIN_W, minW: MIN_W, h: H, focus: 250, build, draw,
  enter() { k.SND.ambient('cafe'); }, leave() { k.SND.ambient(null); },
  hint: { ar: SITE.ui.ar.cafeHint, en: SITE.ui.en.cafeHint },
  spots: () => {
    const E = at.machine, ck = at.cake, J = at.jar, M = at.menu, F = at.fire, A = at.chair, CK = at.clock, W0 = at.win, S = k.SND;
    return [
      { box: { x: E.x - 3, y: E.y - 8, w: E.w + 10, h: E.h + 8 }, label: T('آلة القهوة', 'Espresso machine'),
        open: b => { if (brewAt >= 0) return; brewAt = k.time; machineBtn = b; S.hiss(2.4); } },
      { box: { x: M.x - 3, y: M.y - 3, w: M.w + 6, h: M.h + 6 }, label: T('قائمة المشروبات', 'Drinks menu'),
        open: b => openMenu(b) },
      { box: { x: ck.x - 2, y: ck.y - 2, w: ck.w + 4, h: ck.h + 4 }, label: T('الكيك', 'Cake'),
        open: b => {
          if (cakeLeft > 0) { cakeLeft--; k.spawn('heart', ck.x + ck.w / 2, ck.y + 4, 3); }
          say(pCake, b, cakeLeft > 0 ? 'قطعة كيك بالفراولة، تفضّل.' : 'نفد الكيك! عُد غدًا.', cakeLeft > 0 ? 'A slice of strawberry cake, help yourself.' : 'The cake is all gone! Come back tomorrow.');
        } },
      { box: { x: J.x - 3, y: J.y - 4, w: J.w + 6, h: J.h + 4 }, label: T('جرّة الإكراميات', 'Tip jar'),
        open: () => { coins++; S.coin(); k.spawn('coin', J.x + 6, J.y - 2, 2); k.spawn('star', J.x + 6, J.y - 6, 6); } },
      { box: { x: at.books.x - 2, y: at.books.y, w: at.books.w + 4, h: at.books.h }, label: T('رف الكتب', 'Bookcase'),
        open: b => { pulled = Object.assign({ at: k.time }, at.spines[Math.floor(Math.random() * at.spines.length)]); S.tap(); openBooks(b); } },
      { box: { x: F.x, y: F.y + 20, w: F.w, h: F.h - 20 }, label: T('المدفأة', 'Fireplace'),
        open: () => { fireKick = 1; S.crackle(); k.spawn('spark', F.x + F.w / 2, FY - 18, 16); } },
      { box: { x: A.x - 2, y: A.y - 2, w: A.w + 4, h: A.h }, label: T('كرسي القراءة', 'Reading chair'),
        open: b => say(pSeat, b, 'كرسي دافئ قرب المدفأة، وكتاب، وصوت المطر على الزجاج. اجلس قليلًا.', 'A warm chair by the fire, a book, and the rain on the glass. Sit a while.') },
      ...at.lamps.slice(0, 2).map((l, i) => ({ box: { x: l.x - 8, y: l.y - 6, w: 17, h: 14 }, label: T('المصباح', 'Lamp'), pressed: () => lampsOn[i] !== false,
        open: () => { lampsOn[i] = lampsOn[i] === false; try { localStorage.setItem('cafeLamps', JSON.stringify(lampsOn)); } catch (e) {} swing = 1; S.click(); ST.refreshSpots(); } })),
      { box: { x: at.fan.x - 19, y: 8, w: 39, h: 12 }, label: T('المروحة', 'Ceiling fan'),
        open: () => { fan = fan >= 3 ? 0 : fan + 1; S.click(); } },
      { box: at.table, label: T('طاولة النافذة', 'Window table'),
        open: () => { k.spawn('steam', at.cupA.x + 1, at.cupA.y, 6); k.spawn('steam', at.cupB.x + 1, at.cupB.y, 6); S.hiss(.5); } },
      { box: { x: W0.x, y: W0.y, w: W0.w, h: W0.h }, label: T('النافذة', 'Window'),
        open: () => { flash = 1.4; setTimeout(() => { flash = 1; }, 160); setTimeout(() => S.thunder(), 500); } },
      { box: at.paper, label: T('جريدة اليوم', "Today's paper"),
        open: b => { S.tap(); say(pSeat, b, 'جريدة اليوم: «أمطار متواصلة الليلة، والمقهى مفتوح حتى الفجر.»', "Today's paper: 'Steady rain tonight; the café stays open till dawn.'"); } },
      { box: { x: CK.x - 8, y: CK.y - 9, w: 17, h: 42 }, label: T('الساعة', 'Clock'),
        open: () => { S.tap(); setTimeout(() => S.tap(), 380); } }
    ];
  }
});
})();
