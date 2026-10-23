// the owner's room: a lit cutaway inside the house. Everything in it can be touched.
(() => {
'use strict';
const SITE = window.SITE, ST = window.Street;
const RH = 250, FY = 196;      // the room is as wide as the screen allows; FY is where the wall meets the floor
const at = {};                            // positions of the things the draw pass animates
let lightOn = true;
// what moves when touched: the curtains, the desk drawer, the dresser's top drawer, the clock's chime
let curtainTo = 0;
try { curtainTo = localStorage.getItem('curtain') === '1' ? 1 : 0; } catch (e) {}
let curtain = curtainTo, drawerOpen = 0, drawerTo = 0, dresserOpen = 0, dresserTo = 0, chime = 0;

const pc = ST.panel('pcWin', 'a v-blue win-wide', 'monitor');
const tv = ST.panel('tvWin', 'a v-coral', 'tv');
const shelf = ST.panel('shelfWin', 'a v-yellow', 'book');
const note = ST.panel('roomNote', 'a v-pink', 'folder');
let repos = null;

function build(g, k) {
  const { P, rect, frame, dither, glow, rng, dith, bake } = k, R = rng(21), O = P.out;
  const RW = g.canvas.width, RH = g.canvas.height;
  lightOn = k.store.get('light', '1') !== '0';
  const rx = Math.max(316, RW - 136);          // where the window wall begins
  at.rx = rx;
  rect(g, 0, 0, RW, RH, O);

  // wall: plaster with faint paper lines, a beam under the ceiling, wooden posts
  rect(g, 0, 0, RW, FY, '#3a3058');
  for (let i = 3; i < RW; i += 8) rect(g, i, 12, 1, FY - 16, '#40365f');
  for (let n = 0; n < RW * 1.6; n++) rect(g, Math.floor(R() * RW), 12 + Math.floor(R() * (FY - 16)), 1, 1, R() < .5 ? '#352c50' : '#443a66');
  rect(g, 0, 0, RW, 12, '#2a2140'); rect(g, 0, 9, RW, 3, '#4a3424'); rect(g, 0, 9, RW, 1, '#6a4a32'); rect(g, 0, 12, RW, 1, '#20180f');
  for (const px of [0, 134, rx - 12]) { rect(g, px, 12, 5, FY - 12, '#4a3424'); rect(g, px, 12, 1, FY - 12, '#6a4a32'); rect(g, px + 4, 12, 1, FY - 12, '#2a1d14'); }
  rect(g, 0, FY - 5, RW, 5, '#2a1d14'); rect(g, 0, FY - 5, RW, 1, '#5a4030');

  // floor planks and a rug
  rect(g, 0, FY, RW, RH - FY, '#5a3e2a');
  for (let y = FY + 4; y < RH; y += 6) {
    rect(g, 0, y, RW, 1, '#3a281c');
    for (let i = (y * 7) % 31; i < RW; i += 31) rect(g, i, y - 5, 1, 5, '#3a281c');
    for (let i = (y * 13) % 19; i < RW; i += 19) rect(g, i, y - 3, 4, 1, '#664832');
  }
  const rgx = 150, rgy = FY + 12, rgw = Math.min(170, rx - 160);
  k.rug(g, rgx, rgy - 2, rgw, 32, 'crimson');

  /* ----- left: the cooler, a shelf, the notes board, posters, a low cabinet with the television ----- */
  rect(g, 12, 18, 66, 17, '#c8cad8'); rect(g, 12, 18, 66, 2, '#e6e8f0'); rect(g, 12, 33, 66, 2, '#9a9cb0');
  rect(g, 16, 29, 58, 2, '#5a5c70'); rect(g, 16, 29, 58, 1, '#3a3c50'); rect(g, 72, 21, 2, 1, '#5ad0ff');
  frame(g, 11, 17, 68, 19, O);
  rect(g, 78, 32, 2, 18, '#9a9cb0'); rect(g, 78, 50, 8, 2, '#9a9cb0'); rect(g, 86, 46, 6, 6, '#8a8ca0'); frame(g, 85, 45, 8, 8, O);

  rect(g, 10, 66, 54, 3, '#6a4a32'); rect(g, 10, 69, 54, 1, '#2a1d14');
  rect(g, 13, 53, 10, 13, '#5a3e2a'); rect(g, 15, 55, 6, 6, '#e8dcc0'); rect(g, 17, 56, 1, 3, O); rect(g, 17, 58, 3, 1, O); frame(g, 12, 52, 12, 15, O);
  rect(g, 38, 60, 12, 6, '#b0603a'); rect(g, 38, 60, 12, 1, '#d08050');
  for (const [lx, ly, c] of [[1, -3, 3], [3, -7, 4], [6, -4, 3], [8, -8, 4], [10, -3, 2], [5, -10, 5], [2, -9, 3], [9, -11, 5]]) rect(g, 38 + lx, 60 + ly, 2, 2, ['#0c2220', '#12342e', '#1a4a3c', '#26624a', '#3f8258', '#6aa868'][c]);

  rect(g, 10, 76, 56, 36, '#a87440'); frame(g, 9, 75, 58, 38, '#4a3424'); frame(g, 8, 74, 60, 40, O);
  for (let n = 0; n < 70; n++) rect(g, 11 + Math.floor(R() * 54), 77 + Math.floor(R() * 34), 1, 1, R() < .5 ? '#946232' : '#bc8850');
  const notes = [[13, 79, 11, 10, '#efe6c8'], [27, 78, 10, 12, '#ff8aae'], [40, 80, 12, 9, '#8ad0a0'], [54, 79, 9, 11, '#9ab8ff'], [15, 94, 12, 12, '#efe6c8'], [30, 95, 9, 10, '#ffd27a'], [43, 94, 8, 12, '#9ab8ff'], [53, 96, 10, 9, '#ff8aae']];
  for (const [x, y, w, h, c] of notes) { rect(g, x, y, w, h, c); for (let l = 2; l < h - 2; l += 2) rect(g, x + 1, y + l, w - 3 - (l % 4), 1, '#6a5a60'); rect(g, x + Math.floor(w / 2), y, 1, 1, '#e83a3a'); }
  at.notes = { x: 8, y: 74, w: 60, h: 40 };

  rect(g, 76, 44, 28, 42, '#1a2450');
  for (let j = 0; j < 42; j++) dither(g, 76, 44 + j, 28, 1, '#2a3870', j / 50);
  glow(g, 94, 54, 4, 4, '#ffe2a0', 1.6); rect(g, 93, 52, 2, 4, '#1a2450');
  for (const [bx, bh] of [[77, 10], [81, 15], [86, 9], [90, 18], [96, 11], [100, 13]]) rect(g, bx, 86 - bh, 4, bh, '#0e1430');
  rect(g, 91, 64, 1, 4, '#0e1430'); rect(g, 90, 67, 3, 1, '#0e1430');
  frame(g, 75, 43, 30, 44, '#efe6c8'); frame(g, 74, 42, 32, 46, O); rect(g, 89, 41, 2, 2, '#e83a3a');
  rect(g, 110, 50, 20, 30, '#a3164f');
  for (let n = 0; n < 4; n++) frame(g, 112 + n * 2, 52 + n * 2, 16 - n * 4, 26 - n * 4, n % 2 ? '#ff5a96' : '#e8b040');
  frame(g, 109, 49, 22, 32, O);

  rect(g, 6, 152, 124, FY - 152, '#3e2c1e'); rect(g, 6, 152, 124, 2, '#6a4a32');
  for (const sy of [166, 180]) {
    rect(g, 9, sy - 12, 118, 12, '#24180f'); rect(g, 8, sy, 120, 2, '#5a4030');
  }
  let bx = 10; while (bx < 60) { const w = 2 + Math.floor(R() * 3), h = 6 + Math.floor(R() * 5); rect(g, bx, 166 - h, w, h, ['#8c1440', '#3d2a6e', '#d8cfb4', '#2a6a8a', '#3f8258'][Math.floor(R() * 5)]); bx += w; }
  rect(g, 70, 157, 26, 9, '#c06a8a'); for (let i = 71; i < 95; i += 3) rect(g, i, 158, 1, 7, '#8a3a5a');
  rect(g, 100, 160, 20, 6, '#1c1828'); rect(g, 101, 161, 4, 1, '#5ad0ff');
  for (let i = 0; i < 6; i++) rect(g, 12 + i * 18, 171, 14, 8, ['#2a6a8a', '#d8cfb4', '#8c1440', '#3d2a6e', '#5a2e12', '#3f8258'][i]);
  frame(g, 5, 151, 126, FY - 150, O);
  const T = { x: 46, y: 122, w: 34, h: 22 };
  rect(g, 40, 117, 46, 34, '#3a3448'); rect(g, 40, 117, 46, 1, '#5a5468'); frame(g, 39, 116, 48, 36, O);
  rect(g, 82, 124, 2, 2, '#e83a3a'); rect(g, 82, 130, 2, 2, '#8a8a9a');
  rect(g, 52, 108, 1, 9, O); rect(g, 72, 105, 1, 12, O);
  at.tv = T;

  /* ----- centre: the bookcase, the desk, a calendar, the lamp ----- */
  const bc = 146;
  rect(g, bc, 74, 36, FY - 74, '#3e2c1e'); rect(g, bc, 74, 1, FY - 74, '#5a4030'); rect(g, bc + 35, 74, 1, FY - 74, '#22170f');
  for (const sy of [96, 120, 144, 168]) {
    rect(g, bc + 2, sy - 22, 32, 22, '#24180f');
    let x = bc + 3;
    while (x < bc + 32) {
      const w = 2 + Math.floor(R() * 3), h = 12 + Math.floor(R() * 8);
      const c = ['#8c1440', '#3d2a6e', '#d8cfb4', '#5a2e12', '#a3164f', '#2a6a8a', '#3f8258', '#c07426'][Math.floor(R() * 8)];
      if (R() < .12) { rect(g, x, sy - 3, 8, 3, c); rect(g, x, sy - 6, 7, 3, '#d8cfb4'); x += 9; continue; }
      rect(g, x, sy - h, w, h, c); rect(g, x, sy - h + 2, w, 1, '#e8b040');
      x += w + (R() < .15 ? 2 : 0);
    }
    rect(g, bc + 1, sy, 34, 2, '#5a4030');
  }
  rect(g, bc + 3, 174, 30, 18, '#24180f'); rect(g, bc + 5, 178, 12, 12, '#b07ad0'); rect(g, bc + 19, 180, 12, 10, '#e8b040');
  frame(g, bc - 1, 73, 38, FY - 73, O);
  rect(g, bc + 4, 62, 28, 12, '#1c1828'); rect(g, bc + 6, 65, 10, 4, '#2a6ac0'); rect(g, bc + 7, 66, 6, 1, '#bff0ff'); rect(g, bc + 22, 66, 2, 2, '#e8b040'); rect(g, bc + 26, 66, 2, 2, '#ff5a96');
  rect(g, bc + 30, 50, 1, 12, O); frame(g, bc + 3, 61, 30, 14, O);
  at.shelf = { x: bc - 1, y: 60, w: 38, h: FY - 60 };

  // calendar
  rect(g, 236, 56, 36, 38, '#e8e2d0'); rect(g, 236, 56, 36, 8, '#c0305a');
  for (let j = 0; j < 5; j++) for (let i = 0; i < 7; i++) frame(g, 238 + i * 5, 66 + j * 5, 5, 5, '#b0a890');
  rect(g, 248, 76, 3, 3, '#c0305a'); frame(g, 235, 55, 38, 40, O); rect(g, 253, 54, 2, 2, '#6a5a60');

  // desk: monitor, laptop, mug, bottle, papers; the chair
  const dx = 190, dw = Math.min(120, rx - 214);
  rect(g, dx, 160, dw, 4, '#7a5638'); rect(g, dx, 160, dw, 1, '#9a7650'); rect(g, dx, 164, dw, 1, '#3a281c');
  rect(g, dx + 2, 164, 3, FY - 164, '#4a3424'); rect(g, dx + dw - 5, 164, 3, FY - 164, '#4a3424');
  rect(g, dx + dw - 30, 164, 26, 18, '#5a3e2a'); frame(g, dx + dw - 30, 164, 26, 9, '#3a281c'); frame(g, dx + dw - 30, 173, 26, 9, '#3a281c');
  rect(g, dx + dw - 19, 167, 4, 1, '#c8a050'); rect(g, dx + dw - 19, 176, 4, 1, '#c8a050');
  at.drawer = { x: dx + dw - 30, y: 164, w: 26, h: 18 };
  frame(g, dx - 1, 159, dw + 2, 6, O);
  const M = { x: dx + 8, y: 126, w: 42, h: 27 };
  // an old CRT: a deep beige case seen a little from the side, a thick bezel, a power light, on a swivel foot
  const bz = 4, cx0 = M.x - bz, cy0 = M.y - bz, cw0 = M.w + bz * 2, ch0 = M.h + bz * 2;
  for (let j = 0; j < ch0 - 4; j++) rect(g, cx0 + cw0, cy0 + 2 + j, 9 - Math.round(j / (ch0 - 4) * 2), 1, j < 2 ? '#c8c0a4' : '#a8a088');
  for (let i = 0; i < 9; i++) rect(g, cx0 + cw0 + i, cy0 + 2 - Math.round(i / 4), 1, Math.round(i / 4) + 1, '#d8d0b8');
  rect(g, cx0, cy0, cw0, ch0, '#d8d0b8'); rect(g, cx0, cy0, cw0, 1, '#ece6d0'); rect(g, cx0, cy0 + ch0 - 1, cw0, 1, '#a8a088');
  rect(g, M.x - 1, M.y - 1, M.w + 2, M.h + 2, '#3a3830');
  rect(g, cx0 + cw0 - 7, cy0 + ch0 - 3, 2, 1, '#5ad08a');
  frame(g, cx0 - 1, cy0 - 1, cw0 + 11, ch0 + 1, O);
  rect(g, M.x + 14, cy0 + ch0, 16, 2, '#b8b098'); rect(g, M.x + 10, cy0 + ch0 + 2, 24, 2, '#c8c0a4'); frame(g, M.x + 9, cy0 + ch0, 26, 5, O);
  at.mon = M;
  // the keyboard and mouse on the desk, in the same beige
  const kx = dx + 50;
  rect(g, kx, 156, 28, 4, '#c8c0a4'); rect(g, kx + 1, 155, 26, 1, '#d8d0b8');
  for (let i = 0; i < 12; i++) rect(g, kx + 2 + i * 2, 156 + (i % 2), 1, 1, '#8a8470');
  rect(g, kx + 8, 158, 12, 1, '#8a8470'); frame(g, kx - 1, 154, 30, 7, O);
  rect(g, kx + 31, 157, 4, 3, '#d8d0b8'); rect(g, kx + 32, 157, 1, 1, '#8a8470'); frame(g, kx + 30, 156, 6, 5, O); rect(g, kx + 28, 156, 3, 1, '#6a6458');
  // the tower case under the desk, with its floppy slot and a light that flickers with the disk
  const tw = { x: dx + 47, y: FY - 32, w: 14, h: 32 };
  rect(g, tw.x + tw.w, tw.y + 2, 4, tw.h - 2, '#a8a088'); rect(g, tw.x, tw.y, tw.w, tw.h, '#d8d0b8'); rect(g, tw.x, tw.y, tw.w, 1, '#ece6d0');
  rect(g, tw.x + 2, tw.y + 4, 10, 2, '#5a5648'); rect(g, tw.x + 2, tw.y + 9, 10, 1, '#8a8470'); rect(g, tw.x + 2, tw.y + 12, 10, 1, '#8a8470');
  for (let j = tw.y + 18; j < tw.y + 28; j += 2) rect(g, tw.x + 3, j, 8, 1, '#b8b098');
  frame(g, tw.x - 1, tw.y - 1, tw.w + 6, tw.h + 1, O);
  at.tower = tw;
  rect(g, dx + 88, 150, 7, 10, '#efe6c8'); rect(g, dx + 95, 152, 2, 4, '#efe6c8'); rect(g, dx + 89, 150, 5, 1, '#5a2e12'); frame(g, dx + 87, 149, 9, 12, O);
  if (dw > 104) { rect(g, dx + 100, 144, 5, 16, '#e83a5a'); rect(g, dx + 100, 148, 5, 4, '#efe6c8'); rect(g, dx + 101, 141, 3, 3, '#e83a5a'); frame(g, dx + 99, 140, 7, 21, O); }
  rect(g, dx + 14, 157, 16, 3, '#e8dcc0'); rect(g, dx + 16, 156, 13, 1, '#d0c4a8');
  rect(g, dx + 18, 170, 24, 5, '#8c1440'); rect(g, dx + 18, 170, 24, 1, '#c0305a'); rect(g, dx + 38, 150, 5, 21, '#8c1440');
  rect(g, dx + 28, 175, 3, 17, '#2a2438'); rect(g, dx + 20, 192, 20, 1, '#2a2438'); frame(g, dx + 17, 169, 26, 7, O);

  // ceiling lamp over the desk
  const lx = dx + 60;
  rect(g, lx, 12, 1, 26, O);
  for (let j = 0; j < 10; j++) rect(g, lx - 3 - j, 38 + j, 7 + j * 2, 1, j < 1 ? '#2a2438' : '#3a3448');
  rect(g, lx - 12, 48, 25, 1, '#ffe2a0');
  at.lamp = { x: lx, y: 51 };

  /* ----- right: the big window, the curtain, the bed, the heater ----- */
  /* ----- the gap between the desk and the window wall fills with the screen: a dresser, a reading corner,
     another bookcase, plants; frames, a shelf and a clock on the wall ----- */
  at.dresser = null; at.dresserLamp = null; at.wallClock = null; at.readLamp = null;
  const gx0 = dx + dw + 8, gx1 = rx - 58, gw = gx1 - gx0;
  const plant = px => {
    rect(g, px - 7, FY - 16, 14, 16, '#b0603a'); rect(g, px - 7, FY - 16, 14, 1, '#d08050'); frame(g, px - 8, FY - 17, 16, 18, O);
    rect(g, px - 1, FY - 50, 2, 34, '#3a2a1e');
    for (let n = 0; n < 26; n++) leaf(g, px - 15 + Math.floor(R() * 30), FY - 76 + Math.floor(R() * 40), 2 + Math.floor(R() * 3));
  };
  if (gw > 40 && gw < 110) plant(Math.round((gx0 + gx1) / 2));
  else if (gw >= 110) {
    const slots = Math.floor(gw / 74), step = gw / slots;
    for (let i = 0; i < slots; i++) {
      const x = Math.round(gx0 + step * (i + .5)), kind = i % 4;
      if (kind === 0) {
        // a chest of three drawers, its top seen from above, a lamp and a framed photo on it
        const D = { x: x - 22, y: FY - 40, w: 44, h: 40 };
        rect(g, D.x + 2, D.y - 3, D.w, 3, '#7a5638'); rect(g, D.x, D.y, D.w, D.h, '#5a3e2a'); rect(g, D.x + D.w, D.y - 1, 3, D.h + 1, '#3a281c');
        for (let q = 0; q < 3; q++) { const dy = D.y + 3 + q * 12; rect(g, D.x + 3, dy, D.w - 6, 10, '#6a4a32'); rect(g, D.x + 3, dy, D.w - 6, 1, '#8a6a48'); rect(g, D.x + D.w / 2 - 3, dy + 4, 6, 2, '#c8a050'); }
        frame(g, D.x - 1, D.y - 4, D.w + 5, D.h + 4, O);
        rect(g, D.x + 6, D.y - 15, 8, 12, '#efe6c8'); rect(g, D.x + 7, D.y - 14, 6, 8, '#3a6ab0'); rect(g, D.x + 7, D.y - 8, 6, 2, '#3f8258'); frame(g, D.x + 5, D.y - 16, 10, 14, O);
        rect(g, D.x + D.w - 12, D.y - 6, 2, 3, '#2a2438'); rect(g, D.x + D.w - 16, D.y - 14, 10, 8, '#e8b040'); rect(g, D.x + D.w - 16, D.y - 14, 10, 1, '#ffd27a'); frame(g, D.x + D.w - 17, D.y - 15, 12, 10, O);
        at.dresser = D; at.dresserLamp = { x: D.x + D.w - 11, y: D.y - 10 };
        // a shelf of frames above it
        rect(g, x - 26, 70, 52, 3, '#5a4030'); rect(g, x - 26, 70, 52, 1, '#7a5638'); frame(g, x - 27, 69, 54, 5, O);
        for (let q = 0; q < 3; q++) { const fx = x - 22 + q * 16; rect(g, fx, 58, 12, 12, '#efe6c8'); rect(g, fx + 1, 59, 10, 10, ['#1a2450', '#8c1440', '#1f5a6a'][q]); rect(g, fx + 3, 63, 6, 4, ['#e8c060', '#ff8ab0', '#4a9aaa'][q]); frame(g, fx - 1, 57, 14, 14, O); }
      } else if (kind === 1) {
        // a reading corner: a low armchair, a floor lamp, a stack of books
        const A = { x: x - 18, y: FY - 34, w: 36, h: 34 };
        rect(g, A.x + 4, A.y, A.w - 8, 20, '#3d2a6e'); rect(g, A.x + 4, A.y, A.w - 8, 2, '#5d4a8e');
        rect(g, A.x, A.y + 10, 7, 22, '#4a3482'); rect(g, A.x + A.w - 7, A.y + 10, 7, 22, '#4a3482');
        rect(g, A.x + 5, A.y + 18, A.w - 10, 9, '#4a3482'); rect(g, A.x + 5, A.y + 18, A.w - 10, 1, '#6a54a2');
        rect(g, A.x + 3, A.y + 32, 3, 2, '#2a1d14'); rect(g, A.x + A.w - 6, A.y + 32, 3, 2, '#2a1d14');
        frame(g, A.x - 1, A.y - 1, A.w + 2, A.h, O);
        rect(g, A.x + 10, A.y + 14, 14, 4, '#e8b040'); rect(g, A.x + 10, A.y + 14, 14, 1, '#ffd27a');
        const lx2 = A.x + A.w + 8;
        rect(g, lx2, FY - 74, 2, 74, '#2a2438'); rect(g, lx2 - 7, FY - 84, 16, 10, '#e8d8b0'); rect(g, lx2 - 7, FY - 84, 16, 1, '#fff0c8'); frame(g, lx2 - 8, FY - 85, 18, 12, O); rect(g, lx2 - 4, FY - 2, 10, 2, '#2a2438');
        at.readLamp = { x: lx2 + 1, y: FY - 76 };
        // the wall clock above
        const cy2 = 64; for (let j = -7; j <= 7; j++) { const hw = Math.round(Math.sqrt(49 - j * j)); rect(g, x - hw, cy2 + j, hw * 2 + 1, 1, '#4a3424'); if (Math.abs(j) < 6) { const iw = Math.round(Math.sqrt(Math.max(0, 36 - j * j))); rect(g, x - iw, cy2 + j, iw * 2 + 1, 1, '#efe6c8'); } }
        for (let h = 0; h < 12; h += 3) rect(g, x + Math.round(Math.sin(h / 6 * Math.PI) * 5), cy2 - Math.round(Math.cos(h / 6 * Math.PI) * 5), 1, 1, '#4a3424');
        at.wallClock = { x, y: cy2 };
      } else if (kind === 2) {
        // a second bookcase, its side showing
        const bx2 = x - 17;
        rect(g, bx2 + 34, 92, 4, FY - 92, '#2a1d14'); rect(g, bx2, 90, 34, FY - 90, '#3e2c1e'); rect(g, bx2, 90, 34, 2, '#6a4a32');
        for (let sy = 112; sy < FY - 4; sy += 22) {
          rect(g, bx2 + 2, sy - 20, 30, 20, '#24180f');
          let kx = bx2 + 3; while (kx < bx2 + 31) { const w = 2 + Math.floor(R() * 3), h = 11 + Math.floor(R() * 8); rect(g, kx, sy - h, w, h, ['#8c1440', '#3d2a6e', '#d8cfb4', '#2a6a8a', '#3f8258', '#c07426'][Math.floor(R() * 6)]); rect(g, kx, sy - h + 2, w, 1, '#e8b040'); kx += w; }
          rect(g, bx2 + 1, sy, 32, 2, '#5a4030');
        }
        frame(g, bx2 - 1, 89, 40, FY - 89, O);
      } else plant(x);
    }
    // a woven rug under it all
    k.rug(g, gx0 + 6, FY + 10, gw - 12, 30, 'navy');
  }
  const W0 = { x: rx + 6, y: 24, w: RW - rx - 16, h: 128 };
  at.win = W0;
  rect(g, W0.x - 5, W0.y - 5, W0.w + 10, W0.h + 10, '#3a281c'); rect(g, W0.x - 5, W0.y - 5, W0.w + 10, 1, '#5a4030');
  frame(g, W0.x - 6, W0.y - 6, W0.w + 12, W0.h + 12, O);
  rect(g, W0.x - 7, W0.y + W0.h + 5, W0.w + 14, 3, '#6a4a32'); rect(g, W0.x - 7, W0.y + W0.h + 8, W0.w + 14, 1, '#2a1d14');
  for (let j = -8; j < W0.h + 14; j++) { const sw = j % 7 < 3 ? 0 : 1; rect(g, W0.x - 14 + sw, W0.y + j, 8, 1, j % 2 ? '#8c1440' : '#6a0f30'); rect(g, W0.x - 13 + sw, W0.y + j, 1, 1, '#c0305a'); }
  rect(g, W0.x - 16, W0.y - 10, W0.w + 20, 2, '#22170f');

  const bedX = rx - 4, bedW = RW - bedX;
  rect(g, bedX, FY - 22, bedW, 24, '#4a3424'); rect(g, bedX, FY - 22, bedW, 1, '#6a4a32');
  rect(g, bedX + 2, FY - 29, bedW - 2, 9, '#e0d8c4'); rect(g, RW - 22, FY - 35, 18, 7, '#f0e8d4'); frame(g, RW - 23, FY - 36, 20, 9, O);
  for (let i = 0; i < bedW - 26; i++) for (let j = 0; j < 10; j++) rect(g, bedX + 2 + i, FY - 30 + j, 1, 1, ((i >> 2) + (j >> 2)) % 2 ? '#d02a6a' : '#8c1440');
  rect(g, bedX + 2, FY - 30, bedW - 26, 1, '#ff5a96');
  frame(g, bedX - 1, FY - 37, bedW + 1, 40, O);
  // a folded quilt and a cushion at the foot of the bed
  rect(g, bedX + 14, FY - 35, 18, 5, '#e8b040'); rect(g, bedX + 14, FY - 35, 18, 1, '#ffd27a'); rect(g, bedX + 14, FY - 32, 18, 1, '#c07426'); frame(g, bedX + 13, FY - 36, 20, 7, O);
  rect(g, bedX + 36, FY - 36, 12, 6, '#3a6ab0'); rect(g, bedX + 36, FY - 36, 12, 1, '#5a8ad0'); rect(g, bedX + 41, FY - 34, 2, 2, '#ffd27a'); frame(g, bedX + 35, FY - 37, 14, 8, O);
  at.quilt = { x: bedX + 13, y: FY - 37, w: 36, h: 9 };
  const hx = rx - 34;
  rect(g, hx, FY - 30, 12, 32, '#2a2438'); rect(g, hx, FY - 30, 12, 1, '#4a4460'); rect(g, hx + 9, FY - 28, 2, 2, '#e83a3a'); frame(g, hx - 1, FY - 31, 14, 34, O);
  at.heater = { x: hx + 2, y: FY - 26, w: 7, h: 22 };

  /* ----- the lived-in things ----- */
  // a hanging plant from the beam, its vines trailing
  const hp = 134;
  rect(g, hp + 6, 12, 1, 16, '#2a2438'); rect(g, hp + 2, 28, 9, 6, '#b0603a'); rect(g, hp + 2, 28, 9, 1, '#d08050'); frame(g, hp + 1, 27, 11, 8, O);
  for (let n = 0; n < 10; n++) leaf(g, hp - 4 + Math.floor(R() * 16), 20 + Math.floor(R() * 10), 2 + Math.floor(R() * 3));
  for (const vx of [hp + 2, hp + 9]) for (let j = 0; j < 22 + Math.floor(R() * 14); j++) { rect(g, vx + Math.round(Math.sin(j / 4) * 1.5), 34 + j, 1, 1, '#1a4a3c'); if (j % 4 === 0) rect(g, vx + Math.round(Math.sin(j / 4) * 1.5) - 1, 34 + j, 3, 2, '#3f8258'); }
  // a game console and its pad beside the television
  rect(g, 90, 146, 16, 5, '#1c1828'); rect(g, 91, 147, 3, 1, '#5ad0ff'); frame(g, 89, 145, 18, 7, O);
  rect(g, 108, 148, 10, 4, '#3a3448'); rect(g, 109, 149, 2, 1, '#e83a3a'); rect(g, 115, 149, 2, 1, '#5ad08a'); frame(g, 107, 147, 12, 6, O);
  // books stacked on the floor by the bookcase
  for (const [by, bw2, c] of [[FY - 4, 14, '#8c1440'], [FY - 8, 12, '#2a6a8a'], [FY - 11, 13, '#d8cfb4'], [FY - 14, 10, '#3f8258']]) { rect(g, 130, by, bw2, 3, c); rect(g, 130, by, bw2, 1, '#e8b040'); }
  frame(g, 129, FY - 15, 16, 15, O);
  // hooks on the wall by the window: a jacket, a cap and a string of prayer beads
  const hk = rx - 50;
  rect(g, hk, 58, 26, 2, '#5a4030'); for (const hx of [hk + 4, hk + 13, hk + 21]) rect(g, hx, 60, 1, 3, '#c8a050');
  rect(g, hk + 1, 62, 9, 26, '#2a3a6a'); rect(g, hk + 1, 62, 9, 1, '#3a4a80'); rect(g, hk + 5, 64, 1, 22, '#1a2450'); rect(g, hk + 2, 70, 2, 6, '#1a2450'); frame(g, hk, 61, 11, 28, O);
  rect(g, hk + 11, 63, 7, 4, '#c0305a'); rect(g, hk + 10, 66, 10, 2, '#8c1440'); frame(g, hk + 10, 62, 9, 7, O);
  for (let n = 0; n < 11; n++) { const a = n / 10 * Math.PI; rect(g, Math.round(hk + 21 + Math.cos(a) * 3), Math.round(68 + Math.sin(a) * 10), 1, 1, '#e8d8a8'); }
  rect(g, hk + 21, 78, 1, 4, '#e8d8a8'); rect(g, hk + 20, 82, 3, 2, '#e8c060');
  // a rolled prayer rug leaning in the corner, slippers by the bed
  rect(g, RW - 12, FY - 46, 7, 46, '#1c4a3a'); for (let j = 0; j < 46; j += 6) rect(g, RW - 12, FY - 46 + j, 7, 1, '#e8c060'); rect(g, RW - 12, FY - 46, 7, 2, '#2a6a4a'); frame(g, RW - 13, FY - 47, 9, 48, O);
  rect(g, rx + 6, FY + 3, 8, 4, '#3a6ab0'); rect(g, rx + 16, FY + 4, 8, 4, '#3a6ab0'); rect(g, rx + 6, FY + 3, 8, 1, '#5a8ad0'); rect(g, rx + 16, FY + 4, 8, 1, '#5a8ad0');
  // fairy lights along the ceiling beam
  at.fairy = [];
  for (let x = 6, n = 0; x < RW - 4; x += 9, n++) { const y = 13 + Math.round(Math.sin(x / 18) * 1.5 + 1.5); rect(g, x - 4, y - 1, 9, 1, '#2a2438'); at.fairy.push([x, y, n % 3]); }

  // a little clock under the poster
  for (let j = -6; j <= 6; j++) { const hw = Math.round(Math.sqrt(36 - j * j)); rect(g, 120 - hw, 92 + j, hw * 2 + 1, 1, '#c8a050'); if (Math.abs(j) < 5) { const iw = Math.round(Math.sqrt(Math.max(0, 25 - j * j))); rect(g, 120 - iw, 92 + j, iw * 2 + 1, 1, '#efe6c8'); } }
  rect(g, 117, 99, 2, 2, '#c8a050'); rect(g, 122, 99, 2, 2, '#c8a050');
  at.clock = { x: 120, y: 92 };

  // light switch on the post by the window
  rect(g, rx - 10, 98, 3, 6, '#efe6c8'); rect(g, rx - 9, lightOn ? 99 : 101, 1, 2, '#6a5a60'); frame(g, rx - 11, 97, 5, 8, O);
  at.sw = { x: rx - 10, y: 98 };

  // light: the lamp's warm pool, the cold of screens and moon, the heater's orange
  const lights = [
    { x: M.x + 21, y: M.y + 14, rx: 46, ry: 36, c: '#5aa8ff', i: .75 },
    { x: T.x + 17, y: T.y + 11, rx: 34, ry: 28, c: '#9a7aff', i: .6 },
    { x: hx + 6, y: FY - 12, rx: 44, ry: 34, c: '#ff8a3a', i: .9 },
    { x: W0.x + W0.w / 2, y: W0.y + W0.h, rx: W0.w * .7, ry: 90, c: '#6a8ae0', i: .5 }
  ];
  for (let x = 30; x < RW; x += 70) lights.push({ x, y: 14, rx: 34, ry: 18, c: '#ffbf70', i: .32 });
  if (at.readLamp) lights.push({ x: at.readLamp.x, y: at.readLamp.y, rx: 56, ry: 80, c: '#ffd590', i: .7 });
  if (at.dresserLamp) lights.push({ x: at.dresserLamp.x, y: at.dresserLamp.y, rx: 34, ry: 30, c: '#ffcf7a', i: .55 });
  if (lightOn) lights.push({ x: lx, y: 56, rx: 190, ry: 150, c: '#ffcf8a', i: .95 }, { x: lx, y: 50, rx: 22, ry: 12, c: '#fff0c0', i: 1 });
  bake(g, RW, RH, lightOn ? [.72, .7, .82] : [.42, .46, .7], lights);

  // what gives light is drawn after the light, so it burns
  for (let j = 0; j < W0.h; j++) for (let i = 0; i < W0.w; i++) rect(g, W0.x + i, W0.y + j, 1, 1, dith(i, j) < j / W0.h * .9 ? '#1a2458' : '#0e1438');
  for (let n = 0; n < W0.w * .5; n++) rect(g, W0.x + Math.floor(R() * W0.w), W0.y + Math.floor(R() * W0.h * .6), 1, 1, R() < .3 ? '#cfd8ff' : '#6a78b8');
  for (const [cy, cx, cl] of [[20, 4, 40], [34, 30, 46], [52, 0, 34], [64, 50, 40]]) { const l = Math.min(cl, W0.w - cx); rect(g, W0.x + cx, W0.y + cy, l, 2, '#26306a'); rect(g, W0.x + cx + 3, W0.y + cy - 1, Math.max(0, l - 8), 1, '#33407e'); }
  let cxw = W0.x;
  while (cxw < W0.x + W0.w) {
    const w = Math.min(5 + Math.floor(R() * 9), W0.x + W0.w - cxw), h = 14 + Math.floor(R() * 34);
    rect(g, cxw, W0.y + W0.h - h, w, h, '#0a0c22');
    for (let n = 0; n < h / 3; n++) if (R() < .6) rect(g, cxw + 1 + Math.floor(R() * Math.max(1, w - 2)), W0.y + W0.h - h + 2 + Math.floor(R() * (h - 3)), 1, 1, R() < .7 ? '#e8a040' : '#ff5a96');
    cxw += w;
  }
  // the window is the shanasheel seen from inside: wooden lattice panels with the night behind them
  const lat = document.createElement('canvas'); lat.width = W0.w; lat.height = W0.h;
  const lg = lat.getContext('2d'), panels = Math.max(3, Math.round(W0.w / 22)), pw = W0.w / panels;
  lg.fillStyle = '#3a2214';
  for (let j = 0; j < W0.h; j++) for (let i = 0; i < W0.w; i++) {
    const li = Math.floor(i - Math.floor(i / pw) * pw);
    if ((li + j) % 5 === 0 || (li - j + 500) % 5 === 0) lg.fillRect(i, j, 1, 1);
  }
  lg.fillStyle = '#4a2e1c';
  for (let p = 1; p < panels; p++) lg.fillRect(Math.round(p * pw) - 1, 0, 3, W0.h);
  lg.fillRect(0, Math.round(W0.h * .62), W0.w, 4); lg.fillRect(0, 0, W0.w, 2);
  lg.fillStyle = '#6a4a32';
  for (let p = 1; p < panels; p++) lg.fillRect(Math.round(p * pw) - 1, 0, 1, W0.h);
  lg.fillRect(0, Math.round(W0.h * .62), W0.w, 1);
  at.lat = lat;
  g.drawImage(lat, W0.x, W0.y);
  rect(g, M.x, M.y, M.w, M.h, '#1c4a8a');
  rect(g, M.x, M.y, M.w, 4, '#2a6ac0'); rect(g, M.x + 2, M.y + 1, 3, 2, '#ffd27a');
  // the screen shows code: he is learning to program
  rect(g, M.x, M.y + 4, 7, M.h - 4, '#16345e');
  for (let l = 0; l < 6; l++) rect(g, M.x + 1, M.y + 6 + l * 3, 4, 1, '#3a6aa0');
  const toks = [['#ff7ab0', 4], ['#ffd27a', 7], ['#e8e8f0', 5], ['#7ad8ff', 6], ['#9fe0a0', 9], ['#e8e8f0', 3]];
  for (let l = 0; l < 6; l++) { let tx0 = M.x + 9 + (l % 3 === 2 ? 3 : 0); for (let t = 0; t < 3; t++) { const [col, len] = toks[(l * 2 + t) % toks.length]; if (tx0 + len > M.x + M.w - 2) break; rect(g, tx0, M.y + 6 + l * 3, len, 1, col); tx0 += len + 2; } }
  for (let j = 0; j < at.heater.h; j += 2) rect(g, at.heater.x, at.heater.y + j, at.heater.w, 1, j % 4 ? '#ffb04a' : '#ff7a2a');
  if (lightOn) { rect(g, lx - 12, 48, 25, 1, '#fff6d8'); glow(g, lx, 50, 12, 4, '#fff0c0', 1.2); }
  // a moon low in the window
  glow(g, W0.x + W0.w - 18, W0.y + 22, 8, 8, '#2a3a7a', 1.4); rect(g, W0.x + W0.w - 21, W0.y + 19, 6, 6, '#e8e4d0'); rect(g, W0.x + W0.w - 19, W0.y + 18, 3, 1, '#e8e4d0'); rect(g, W0.x + W0.w - 18, W0.y + 20, 2, 2, '#c8c4b0');
  g.drawImage(lat, W0.x, W0.y);
  // today on the calendar
  { const dd = new Date(), first = new Date(dd.getFullYear(), dd.getMonth(), 1).getDay(), cell = (first + dd.getDate() - 1) % 35; rect(g, 238 + (cell % 7) * 5 + 1, 66 + Math.floor(cell / 7) * 5 + 1, 3, 3, '#c0305a'); }
}
function leaf(g, x, y, tone) {
  const C = ['#0c2220', '#12342e', '#1a4a3c', '#26624a', '#3f8258', '#6aa868'];
  g.fillStyle = C[Math.min(5, tone)]; g.fillRect(x + 1, y, 3, 1); g.fillRect(x, y + 1, 5, 2); g.fillRect(x + 1, y + 3, 3, 1);
  g.fillStyle = C[Math.min(5, tone + 1)]; g.fillRect(x + 1, y + 1, 2, 1);
}

function draw(g, k) {
  const { P, rect, dither, sprite, time, still } = k, W0 = at.win, T = at.tv;
  g.save(); g.beginPath(); g.rect(W0.x, W0.y, W0.w, W0.h); g.clip();
  g.fillStyle = 'rgba(170,185,240,.5)';
  for (let n = 0; n < W0.w; n++) {
    const sp = 50 + (n * 37) % 50, y = (time * sp + n * 53) % (W0.h + 10) - 5, x = W0.x + ((n * 29 + Math.floor(time * sp * .2)) % W0.w);
    g.fillRect(x, Math.round(W0.y + y), 1, 3);
  }
  g.fillStyle = 'rgba(200,215,255,.6)';
  for (let n = 0; n < 14; n++) { const y = (time * (4 + n % 3) + n * 17) % W0.h; g.fillRect(W0.x + (n * 11 + 3) % W0.w, Math.round(W0.y + y), 1, 2); }
  g.restore();
  g.drawImage(at.lat, W0.x, W0.y);

  const f = still ? .5 : (Math.sin(time * 4.3) + 1) / 2;
  rect(g, T.x, T.y, T.w, T.h, '#2a2060');
  dither(g, T.x, T.y, T.w, T.h, '#6a4ad0', .3 + f * .4);
  dither(g, T.x + 3, T.y + 13, 14, 6, '#ff5a96', .3 + (1 - f) * .3);
  rect(g, T.x + 1, T.y + 1, 4, 1, 'rgba(255,255,255,.4)');
  // the CRT: faint scanlines rolling down, the disk light blinking now and then
  { const M = at.mon; g.globalAlpha = .18; for (let j = (Math.floor(time * 12) % 3); j < M.h; j += 3) rect(g, M.x, M.y + j, M.w, 1, '#000'); g.globalAlpha = 1;
    rect(g, M.x, M.y, 1, 1, '#3a3830'); rect(g, M.x + M.w - 1, M.y, 1, 1, '#3a3830'); rect(g, M.x, M.y + M.h - 1, 1, 1, '#3a3830'); rect(g, M.x + M.w - 1, M.y + M.h - 1, 1, 1, '#3a3830');
    const tw = at.tower; rect(g, tw.x + 10, tw.y + 15, 2, 1, (still || Math.sin(time * 7) + Math.sin(time * 2.3) > .8) ? '#ffb040' : '#5a4a2a'); rect(g, tw.x + 3, tw.y + 15, 2, 1, '#5ad08a'); }
  if (!still) { g.globalAlpha = .25 + Math.sin(time * 3) * .15; rect(g, at.heater.x, at.heater.y, at.heater.w, at.heater.h, '#ffe08a'); g.globalAlpha = 1; }

  // fairy lights twinkle, the mug steams
  for (const [fx, fy, ph] of at.fairy) { const on = still || Math.sin(time * 1.5 + ph * 2.1 + fx * .07) > -.3; rect(g, fx, fy, 1, 2, on ? ['#ffd27a', '#ff8ab0', '#fff0c0'][ph] : '#5a4a3a'); }
  if (!still) { g.fillStyle = 'rgba(255,245,230,.4)'; for (let n = 0; n < 3; n++) { const p = (time * .5 + n / 3) % 1; g.fillRect(281 + Math.round(Math.sin(p * 6 + n) * 1.5), 147 - Math.round(p * 12), 1, 1); } }

  const ease = v => still ? 1 : .12;
  curtain += (curtainTo - curtain) * ease(); drawerOpen += (drawerTo - drawerOpen) * ease(); dresserOpen += (dresserTo - dresserOpen) * ease();
  // the curtains draw across the window from both sides, in pleats
  if (curtain > .01) {
    const hw = Math.round(W0.w / 2 * curtain);
    for (const side of [0, 1]) for (let i = 0; i < hw; i++) {
      const x = side ? W0.x + W0.w - 1 - i : W0.x + i, c = (i % 6) < 2 ? '#6a0f30' : (i % 6) < 4 ? '#8c1440' : '#a3164f';
      rect(g, x, W0.y - 4, 1, W0.h + 8 + (i % 3 === 0 ? 1 : 0), c);
    }
    rect(g, W0.x, W0.y - 4, W0.w, 1, '#3a0820');
  }
  // the desk drawer slides out, a notebook and pencils inside
  const dr = at.drawer;
  if (drawerOpen > .02) {
    const o = Math.round(drawerOpen * 5);
    rect(g, dr.x, dr.y, dr.w, 9, '#1a120c');
    rect(g, dr.x + 3, dr.y + 2, 8, 4, '#efe6c8'); rect(g, dr.x + 13, dr.y + 3, 7, 1, '#e8b040'); rect(g, dr.x + 13, dr.y + 5, 6, 1, '#c0305a');
    rect(g, dr.x - 1, dr.y + o, dr.w + 2, 9, '#6a4a32'); rect(g, dr.x - 1, dr.y + o, dr.w + 2, 1, '#8a6a48'); rect(g, dr.x + 11, dr.y + o + 3, 4, 1, '#c8a050');
    rect(g, dr.x - 1, dr.y + o + 9, dr.w + 2, 1, P.out);
  }
  if (at.dresser && dresserOpen > .02) {
    const D = at.dresser, o = Math.round(dresserOpen * 6), dy = D.y + 3;
    rect(g, D.x + 3, dy, D.w - 6, 10, '#1a120c');
    rect(g, D.x + 6, dy + 3, 10, 5, '#3a6ab0'); rect(g, D.x + 17, dy + 3, 10, 5, '#efe6c8'); rect(g, D.x + 28, dy + 3, 9, 5, '#8c1440');
    rect(g, D.x + 2, dy + o, D.w - 4, 10, '#7a5638'); rect(g, D.x + 2, dy + o, D.w - 4, 1, '#9a7650'); rect(g, D.x + D.w / 2 - 3, dy + o + 4, 6, 2, '#c8a050');
    rect(g, D.x + 2, dy + o + 10, D.w - 4, 1, P.out);
  }
  // the clocks keep real time; touched, the hands spin round once
  const d = new Date(), spin = chime > 0 ? (1 - chime) * Math.PI * 4 : 0;
  for (const c of [at.clock, at.wallClock]) {
    if (!c) continue;
    const ha = (d.getHours() % 12 + d.getMinutes() / 60) / 6 * Math.PI + spin / 3, ma = d.getMinutes() / 30 * Math.PI + spin;
    for (let q = 1; q <= 2; q++) rect(g, c.x + Math.round(Math.sin(ha) * q), c.y - Math.round(Math.cos(ha) * q), 1, 1, '#1c1828');
    for (let q = 1; q <= 4; q++) rect(g, c.x + Math.round(Math.sin(ma) * q), c.y - Math.round(Math.cos(ma) * q), 1, 1, '#5a3e2a');
    rect(g, c.x, c.y, 1, 1, '#c0305a');
  }
  chime = Math.max(0, chime - .015);
}

/* the computer shows the owner's projects, straight from GitHub when a username is set */
function showRepos() {
  const t = SITE.ui[ST.lang], b = pc.body;
  b.textContent = '';
  const h = document.createElement('h3'); h.className = 'win-sub'; h.textContent = t.pcProjects; b.appendChild(h);
  const list = document.createElement('ul'); list.className = 'item-list'; b.appendChild(list);
  const line = txt => { const li = document.createElement('li'); li.textContent = txt; list.appendChild(li); };
  if (!SITE.github) line(t.pcEmpty);
  else if (repos === null) line(t.pcLoading);
  else if (repos === false) line(t.pcFail);
  else for (const r of repos) {
    const li = document.createElement('li'), a = document.createElement('a');
    a.href = r.html_url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = r.name;
    if (r.description) { const s = document.createElement('small'); s.textContent = r.description; a.appendChild(s); }
    li.appendChild(a); list.appendChild(li);
  }
  const p = document.createElement('p'); p.className = 'win-foot'; p.textContent = SITE.bio[ST.lang].join(' '); b.appendChild(p);
}
function loadRepos() {
  showRepos();
  if (!SITE.github || repos) return;
  fetch('https://api.github.com/users/' + encodeURIComponent(SITE.github) + '/repos?sort=updated&per_page=8')
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => { repos = d.filter(r => !r.fork); showRepos(); })
    .catch(() => { repos = false; showRepos(); });
}
function fillTV() {
  const t = SITE.ui[ST.lang], b = tv.body;
  b.textContent = '';
  const p = document.createElement('p'); p.textContent = t.tvBody; b.appendChild(p);
  const yt = SITE.accounts.find(a => a.id === 'youtube');
  if (yt && yt.url) { const a = document.createElement('a'); a.className = 'btn'; a.href = yt.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = t.tvGo; b.appendChild(a); }
}
function say(b, ar, en) {
  note.body.textContent = '';
  const p = document.createElement('p'); p.textContent = ST.lang === 'ar' ? ar : en; note.body.appendChild(p);
  note.open(b);
}
function fillShelf() {
  const b = shelf.body;
  b.textContent = '';
  const list = document.createElement('ul'); list.className = 'item-list';
  for (const x of SITE.likes[ST.lang]) { const li = document.createElement('li'); li.textContent = x; list.appendChild(li); }
  b.appendChild(list);
}
ST.onLang(lang => {
  const t = SITE.ui[lang];
  pc.title(t.pcTitle); tv.title(t.tvTitle); shelf.title(t.shelfTitle); note.title(lang === 'ar' ? 'ملاحظة' : 'Note');
  if (window.XP && window.XP.on) window.XP.setLang(lang);
  showRepos(); fillTV(); fillShelf();
});

ST.scene({
  id: 'room', w: 440, minW: 440, h: RH, focus: 240, build, draw,
  hint: { ar: SITE.ui.ar.roomHint, en: SITE.ui.en.roomHint },
  spots: () => [
    { box: { x: at.mon.x - 3, y: at.mon.y - 3, w: at.mon.w + 6, h: at.mon.h + 18 }, label: { ar: SITE.ui.ar.pc, en: SITE.ui.en.pc }, open: b => { ST.kit.SND.click(); window.XP.boot({ lang: ST.lang, sound: ST.kit.SND, still: ST.kit.still, onExit: () => b.focus({ preventScroll: true }) }); } },
    { box: { x: at.tv.x - 3, y: at.tv.y - 3, w: at.tv.w + 6, h: at.tv.h + 6 }, label: { ar: SITE.ui.ar.tv, en: SITE.ui.en.tv }, open: b => tv.open(b) },
    { box: at.shelf, label: { ar: SITE.ui.ar.shelf, en: SITE.ui.en.shelf }, open: b => shelf.open(b) },
    { box: at.notes, label: { ar: 'لوحة الملاحظات: عنّي', en: 'Notes board: about me' }, open: b => ST.openBio(b) },
    { box: { x: at.sw.x - 6, y: at.sw.y - 6, w: 15, h: 18 }, label: { ar: SITE.ui.ar.light, en: SITE.ui.en.light },
      pressed: () => lightOn,
      open: () => { lightOn = !lightOn; ST.kit.store.set('light', lightOn ? '1' : '0'); ST.kit.SND.tap(); ST.refreshSpots(); } },
    { box: at.quilt, label: { ar: 'اللحاف', en: 'Quilt' }, open: () => { ST.kit.SND.tap(); ST.kit.spawn('star', at.quilt.x + 18, at.quilt.y, 6); } },
    { box: { x: at.win.x, y: at.win.y, w: at.win.w, h: at.win.h }, label: { ar: 'الستائر', en: 'Curtains' }, pressed: () => curtainTo > 0,
      open: () => { curtainTo = curtainTo ? 0 : 1; try { localStorage.setItem('curtain', curtainTo ? '1' : '0'); } catch (e) {} ST.kit.SND.page(); } },
    { box: at.drawer, label: { ar: 'درج المكتب', en: 'Desk drawer' },
      open: b => { drawerTo = drawerTo ? 0 : 1; ST.kit.SND.tap(); if (drawerTo) say(b, 'في الدرج: دفتر ملاحظات وأقلام، وشاحن قديم لا أعرف لأي جهاز هو.', "In the drawer: a notebook, pencils, and an old charger for who knows what."); else note.close(); } },
    { box: { x: at.clock.x - 7, y: at.clock.y - 7, w: 15, h: 15 }, label: { ar: 'الساعة', en: 'Clock' },
      open: b => { chime = 1; ST.kit.SND.tap(); setTimeout(() => ST.kit.SND.tap(), 300); const d = new Date(); say(b, 'الساعة الآن ' + d.toLocaleTimeString('ar', { hour: 'numeric', minute: '2-digit' }) + '.', 'It is ' + d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }) + ' now.'); } },
    ...(at.dresser ? [{ box: at.dresser, label: { ar: 'الأدراج', en: 'Chest of drawers' },
      open: b => { dresserTo = dresserTo ? 0 : 1; ST.kit.SND.tap(); if (dresserTo) say(b, 'ملابس مطويّة بعناية… تقريبًا.', 'Clothes, folded neatly… mostly.'); else note.close(); } }] : []),
    ...(at.wallClock ? [{ box: { x: at.wallClock.x - 8, y: at.wallClock.y - 8, w: 17, h: 17 }, label: { ar: 'ساعة الحائط', en: 'Wall clock' }, open: () => { chime = 1; ST.kit.SND.bell(); } }] : [])
  ]
});
})();
