// the mosque: a prayer hall whose furnishings are its features.
// Each feature is one entry in FEATURES: where it sits in the picture, its window, and how it fills it.
// To add one later: push a feature with Mosque.add({...}) from its own file, after this one loads.
(() => {
'use strict';
const SITE = window.SITE, ST = window.Street, PR = window.Prayer, k = ST.kit;
const MW = 440, MH = 250, FY = 190;   // the hall grows with the screen; MW is its narrowest
const at = {};
const T = (ar, en) => ({ ar, en });
const tx = o => o[ST.lang];
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
// little pixel icons drawn from rows of letters
const PIX = (rows, col) => {
  const by = {};
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') (by[ch] = by[ch] || []).push(`M${x} ${y}h1v1h-1z`); }));
  return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">` + Object.entries(by).map(([ch, d]) => `<path fill="${col[ch]}" d="${d.join('')}"/>`).join('') + '</svg>';
};
const pname = key => PR.NAMES[key][ST.lang === 'ar' ? 0 : 1];
// pixel arrows; in Arabic 'previous' points right, as the text reads
const ARROW_L = '<svg viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><path d="M4 1h1v1H4zM3 2h1v1H3zM2 3h1v1H2zM3 4h1v1H3zM4 5h1v1H4z"/></svg>';
const ARROW_R = '<svg viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><path d="M2 1h1v1H2zM3 2h1v1H3zM4 3h1v1H4zM3 4h1v1H3zM2 5h1v1H2z"/></svg>';
let ARROW_PREV = ARROW_R, ARROW_NEXT = ARROW_L;
const pad = n => String(n).padStart(2, '0');
const left = ms => { const s = Math.max(0, Math.floor(ms / 1000)); return k.num(`${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`); };

/* ---------------- the picture: the prayer hall, as wide as the screen ----------------
   The same stone, teal tile and gold as the street front; the same arched lattice windows;
   the chandelier hangs under the dome; the mihrab faces the Qibla. */
// an eight-pointed star: a square and the same square turned
function star8(g, cx, cy, r, c, edge) {
  const { rect } = k, q = Math.round(r * .72);
  cx = Math.round(cx); cy = Math.round(cy);
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const inSq = Math.abs(i) <= q && Math.abs(j) <= q, inDia = Math.abs(i) + Math.abs(j) <= r;
    if (!inSq && !inDia) continue;
    const rim = (inDia && Math.abs(i) + Math.abs(j) === r && !inSq) || (inSq && (Math.abs(i) === q || Math.abs(j) === q) && Math.abs(i) + Math.abs(j) > r - 1);
    rect(g, cx + i, cy + j, 1, 1, rim && edge ? edge : c);
  }
}
function build(g) {
  const { P, rect, frame, dither, glow, sprite, rng, dith, bake } = k, R = rng(33), O = P.out;
  const W = g.canvas.width, cx = Math.floor(W / 2), MH = g.canvas.height;
  rect(g, 0, 0, W, MH, O);

  // stone walls in courses, a gold frieze under the ceiling, tile dado at the foot
  rect(g, 0, 0, W, FY, '#4a4458');
  for (let r = 0; r * 7 < FY; r++) {
    const y = r * 7, off = (r & 1) * 8;
    rect(g, 0, y, W, 1, '#3a3448');
    for (let i = off; i < W; i += 16) rect(g, i, y + 1, 1, 6, '#3a3448');
    for (let i = 0; i < W; i += 3) if (R() < .2) rect(g, i, y + 2 + Math.floor(R() * 4), 1, 1, '#56506a');
  }
  rect(g, 0, 0, W, 16, '#2a2538'); rect(g, 0, 16, W, 6, '#1f5a6a');
  for (let i = 0; i < W; i += 6) { rect(g, i + 1, 17, 4, 4, '#2f7a8a'); rect(g, i + 2, 18, 2, 2, '#e8c060'); }
  rect(g, 0, 16, W, 1, '#e8c060'); rect(g, 0, 22, W, 1, '#e8c060'); rect(g, 0, 23, W, 1, O);
  const dado = FY - 40;
  rect(g, 0, dado, W, 40, '#1f5a6a');
  for (let j = 0; j < 40; j += 8) for (let i = (j / 8 & 1) * 4; i < W; i += 8) {
    rect(g, i + 1, dado + j + 1, 6, 6, '#2f7a8a'); rect(g, i + 3, dado + j + 2, 2, 4, '#4a9aaa'); rect(g, i + 2, dado + j + 3, 4, 2, '#4a9aaa'); rect(g, i + 3, dado + j + 3, 2, 2, '#e8c060');
  }
  rect(g, 0, dado, W, 2, '#e8c060'); rect(g, 0, dado - 1, W, 1, O); rect(g, 0, FY - 1, W, 1, O);

  const arch = (ax, ay, aw, ah, fill) => {
    for (let j = 0; j < ah; j++) {
      const ins = j < aw / 2 ? Math.round(aw / 2 - Math.sqrt(Math.max(0, (aw / 2) ** 2 - (aw / 2 - j) ** 2)) * .9) : 0;
      for (let i = ins; i < aw - ins; i++) rect(g, ax + i, ay + j, 1, 1, fill(i, j));
      if (ins < aw / 2) { rect(g, ax + ins - 1, ay + j, 1, 1, O); rect(g, ax + aw - ins, ay + j, 1, 1, O); }
    }
  };
  const lattice = (i, j, h) => ((i + j) % 4 === 0 || (i - j + 400) % 4 === 0) ? '#5a3e28' : (dith(i, j) < j / h * .7 ? '#16204a' : '#0e1638');

  // windows: the street's four lattice arches, two on each side wall, with night and rain behind
  const ww = 26, wh = 64;
  at.wins = [12, 46, W - 12 - ww, W - 46 - ww].map(wx => ({ x: wx, y: 40, w: ww, h: wh }));
  for (const wn of at.wins) {
    arch(wn.x - 3, wn.y - 3, wn.w + 6, wn.h + 6, () => '#3a3448');
    arch(wn.x, wn.y, wn.w, wn.h, (i, j) => lattice(i, j, wn.h));
    rect(g, wn.x - 4, wn.y + wn.h + 3, wn.w + 8, 3, '#5a546c'); rect(g, wn.x - 4, wn.y + wn.h + 6, wn.w + 8, 1, O);
  }

  // pillars with pointed arches between the side walls and the qibla wall
  for (const px of [86, W - 98]) {
    rect(g, px, 30, 12, dado - 30, '#56506a'); rect(g, px, 30, 2, dado - 30, '#6a6480'); rect(g, px + 10, 30, 2, dado - 30, '#3a3448');
    rect(g, px - 2, 26, 16, 4, '#3a3448'); rect(g, px - 2, dado - 4, 16, 4, '#3a3448'); frame(g, px - 1, 29, 14, dado - 29, O);
  }

  // the mihrab: a tiled niche with a stepped crown, its lamp hanging before it
  const mw = 60, mx = cx - mw / 2, my = 52, mh = FY - my;
  rect(g, mx - 8, my - 10, mw + 16, mh + 10, '#1f5a6a');
  for (let j = 0; j < mh + 10; j += 3) for (let i = (j / 3 & 1) * 3; i < mw + 16; i += 6) { rect(g, mx - 8 + i, my - 10 + j, 2, 2, '#2f7a8a'); rect(g, mx - 7 + i, my - 9 + j, 1, 1, '#e8c060'); }
  frame(g, mx - 9, my - 11, mw + 18, mh + 11, O); frame(g, mx - 6, my - 8, mw + 12, mh + 8, '#e8c060');
  arch(mx, my, mw, mh, (i, j) => {
    const crown = j < 26 && (i + Math.floor(j / 4) * 2) % 8 < 2;
    return crown ? '#e8c060' : j < 26 ? (dith(i, j) < .5 ? '#2a2236' : '#332a44') : (dith(i, j) < (j - 26) / mh * .5 ? '#2a2236' : '#3a3448');
  });
  for (let j = 34; j < mh - 4; j += 8) for (let i = 8; i < mw - 8; i += 8) { rect(g, mx + i, my + j, 3, 3, '#2b4b63'); rect(g, mx + i + 1, my + j + 1, 1, 1, '#e8c060'); }
  sprite(g, ['.GG', 'G..', 'G..', 'G..', '.GG'], cx - 1, my - 22, { G: '#ffd27a' });
  rect(g, cx, 24, 1, 34, O); rect(g, cx - 3, 58, 7, 8, '#e8c060'); rect(g, cx - 2, 60, 5, 4, '#fff0c0'); rect(g, cx - 2, 66, 5, 1, '#8a6a20');
  at.mihrab = { x: mx - 9, y: my - 24, w: mw + 18, h: mh + 24 };

  // the minbar to its right
  const bx = cx + mw / 2 + 14;
  for (let s = 0; s < 8; s++) { rect(g, bx + s * 5, FY - 8 - s * 8, 5, 8 + s * 8, '#5a3e2a'); rect(g, bx + s * 5, FY - 8 - s * 8, 5, 1, '#7a5638'); rect(g, bx + s * 5 + 1, FY - 12 - s * 8, 1, 4, '#e8c060'); }
  rect(g, bx + 40, FY - 76, 8, 76, '#5a3e2a'); rect(g, bx + 38, FY - 86, 12, 10, '#3a281c');
  rect(g, bx + 41, FY - 94, 6, 8, '#1c4052'); rect(g, bx + 43, FY - 98, 2, 4, '#e8c060');
  frame(g, bx - 1, FY - 87, 50, 87, 'rgba(0,0,0,0)');

  // the prayer-times board on the wall left of the mihrab
  const B = { x: cx - mw / 2 - 86, y: 60, w: 70, h: 60 };
  // chains from the frieze, a soft shadow on the stone, the case's side and underside for depth
  for (const chx of [B.x + 10, B.x + B.w - 10]) for (let j = 24; j < B.y - 4; j += 2) rect(g, chx, j, 1, 1, '#c8a050');
  dither(g, B.x + 3, B.y + 3, B.w + 10, B.h + 10, '#1a1626', .55);
  rect(g, B.x + B.w + 4, B.y - 2, 4, B.h + 8, '#3a281c'); rect(g, B.x - 2, B.y + B.h + 4, B.w + 10, 3, '#2a1c12');
  rect(g, B.x + B.w + 4, B.y - 2, 1, B.h + 8, '#5a3e2a');
  rect(g, B.x, B.y, B.w, B.h, '#0b1020'); frame(g, B.x - 1, B.y - 1, B.w + 2, B.h + 2, O); frame(g, B.x - 3, B.y - 3, B.w + 6, B.h + 6, '#5a3e2a'); frame(g, B.x - 4, B.y - 4, B.w + 8, B.h + 8, O);
  rect(g, B.x - 3, B.y - 3, B.w + 6, 1, '#8a6a48');
  rect(g, B.x + 2, B.y + 2, B.w - 4, 1, '#1a2240');
  star8(g, B.x + B.w / 2, B.y - 9, 4, '#e8c060', '#8a6a20');
  at.board = B;

  // the framed supplication on the wall right of the minbar
  const F = { x: bx + 58, y: 64, w: 48, h: 26 };
  rect(g, F.x, F.y, F.w, F.h, '#1c3346'); frame(g, F.x - 1, F.y - 1, F.w + 2, F.h + 2, '#e8c060'); frame(g, F.x - 2, F.y - 2, F.w + 4, F.h + 4, O);
  for (let i = 4; i < F.w - 4; i += 3) rect(g, F.x + i, F.y + 8 + ((i / 3 | 0) % 3), 2, 1, '#efe6c8');
  for (let i = 6; i < F.w - 6; i += 4) rect(g, F.x + i, F.y + 17, 3, 1, '#efe6c8');
  at.frame = F;

  // low shelves of mushafs and books of adhkar along the left dado
  const S = { x: 104, y: FY - 34, w: Math.max(40, B.x - 112), h: 34 };
  rect(g, S.x, S.y, S.w, S.h, '#3e2c1e'); frame(g, S.x - 1, S.y - 1, S.w + 2, S.h + 2, O);
  for (const sy of [S.y + 15, S.y + 31]) {
    rect(g, S.x + 2, sy - 13, S.w - 4, 13, '#24180f');
    let kx = S.x + 3;
    while (kx < S.x + S.w - 4) { const w = 2 + Math.floor(R() * 2), h = 9 + Math.floor(R() * 4); rect(g, kx, sy - h, w, h, ['#1c4a3a', '#8c1440', '#1c3346', '#5a2e12', '#3d2a6e'][Math.floor(R() * 5)]); rect(g, kx, sy - h + 2, w, 1, '#e8c060'); kx += w; }
    rect(g, S.x + 1, sy, S.w - 2, 2, '#5a4030');
  }
  at.shelf = { x: S.x - 2, y: S.y - 2, w: S.w + 4, h: S.h + 4 };

  // carpet: two rows of wide prayer rugs, each a framed field with a pointed arch toward the mihrab and a medallion;
  // the last row repeats cleanly on tall screens (the scene's tile is one row)
  rect(g, 0, FY, W, MH - FY, '#5a0a24');
  rect(g, 0, FY, W, 3, '#3a0618'); rect(g, 0, FY + 3, W, 1, '#c8a050');
  const RH = 28, PW = 44, top0 = MH - RH * 2;
  for (let row = 0; row < 2; row++) {
    const y = top0 + row * RH;
    for (let x = -((W % PW) >> 1); x < W; x += PW) {
      rect(g, x + 1, y + 1, PW - 2, RH - 2, '#8c1440');
      frame(g, x + 2, y + 2, PW - 4, RH - 4, '#e8c060'); frame(g, x + 3, y + 3, PW - 6, RH - 6, '#6a0e30');
      // the arch: straight sides rising to a point
      const ax0 = x + 9, ax1 = x + PW - 10, ay = y + 6, mid = (ax0 + ax1) / 2;
      for (let j = 0; j < 7; j++) { const half = Math.round((ax1 - ax0) / 2 * Math.sqrt(j / 6)); rect(g, Math.round(mid - half), ay + j, half * 2 + 1, 1, '#7a1238'); rect(g, Math.round(mid - half), ay + j, 1, 1, '#e8c060'); rect(g, Math.round(mid + half), ay + j, 1, 1, '#e8c060'); }
      rect(g, ax0, ay + 7, ax1 - ax0 + 1, RH - 16, '#7a1238'); rect(g, ax0, ay + 7, 1, RH - 16, '#e8c060'); rect(g, ax1, ay + 7, 1, RH - 16, '#e8c060');
      rect(g, Math.round(mid), ay - 2, 1, 2, '#e8c060');
      // the medallion
      const my2 = y + 17;
      for (let d = -3; d <= 3; d++) { const w2 = 3 - Math.abs(d); rect(g, Math.round(mid) - w2, my2 + d, w2 * 2 + 1, 1, '#e8b040'); }
      rect(g, Math.round(mid), my2, 1, 1, '#8c1440');
      // tassels at the foot
      for (let i = x + 6; i < x + PW - 5; i += 3) rect(g, i, y + RH - 2, 1, 1, '#e8c060');
    }
  }
  dither(g, 0, FY, W, 6, O, .45);

  /* ----- wide halls get more: geometric panels, lanterns, a shoe rack, a water cooler, a clock ----- */
  at.lanterns = []; at.clocks = [];
  const fillHall = (x0, x1, wallOnly) => {
    const n = Math.floor((x1 - x0) / 66);
    for (let i = 0; i < n; i++) {
      const x = Math.round(x0 + (x1 - x0) * (i + .5) / n), kind = i % 3;
      // on the wall: a tiled panel of eight-pointed stars, framed in gold, standing a little off the stone
      const pw = 40, ph = 40, px = x - pw / 2, py = 44;
      rect(g, px + 3, py + 3, pw, ph, '#2a2538');
      rect(g, px, py, pw, ph, '#1f5a6a');
      for (let j = 0; j < 4; j++) for (let q = 0; q < 4; q++) star8(g, px + 5 + q * 10, py + 5 + j * 10, 3, (q + j) % 2 ? '#e8c060' : '#4a9aaa', '#173a4a');
      frame(g, px - 1, py - 1, pw + 2, ph + 2, '#e8c060'); frame(g, px - 2, py - 2, pw + 4, ph + 4, O);
      if (wallOnly) continue;
      if (kind === 0) {
        // a lantern on a tall brass stand
        rect(g, x - 1, FY - 64, 2, 64, '#8a6a30'); rect(g, x - 6, FY - 2, 12, 2, '#8a6a30');
        rect(g, x - 5, FY - 78, 10, 14, '#3a2a14'); rect(g, x - 4, FY - 76, 8, 10, '#ffd27a'); rect(g, x - 1, FY - 76, 2, 10, '#fff0c0'); rect(g, x - 3, FY - 82, 6, 4, '#8a6a30'); rect(g, x - 1, FY - 85, 2, 3, '#8a6a30');
        frame(g, x - 6, FY - 79, 12, 16, O);
        at.lanterns.push({ x, y: FY - 71 });
      } else if (kind === 1) {
        // a shoe rack against the dado, its top seen from above
        rect(g, x - 18, FY - 17, 36, 3, '#7a5638'); rect(g, x - 18, FY - 14, 36, 14, '#5a3e2a');
        for (const sy of [FY - 9, FY - 3]) rect(g, x - 17, sy, 34, 1, '#3a281c');
        for (let q = 0; q < 4; q++) { rect(g, x - 15 + q * 8, FY - 12, 6, 2, ['#2a6a8a', '#5a2e12', '#3a3448', '#8c1440'][q]); rect(g, x - 15 + q * 8, FY - 6, 6, 2, ['#3a3448', '#2a6a8a', '#8c1440', '#5a2e12'][q]); }
        frame(g, x - 19, FY - 18, 38, 18, O);
      } else {
        // a water cooler, and a round wall clock above the panel
        rect(g, x + 7, FY - 36, 3, 36, '#9a9cb0'); rect(g, x - 7, FY - 38, 14, 38, '#c8cad8'); rect(g, x - 7, FY - 38, 14, 1, '#e6e8f0');
        rect(g, x - 5, FY - 50, 10, 12, '#6ab0e8'); rect(g, x - 4, FY - 49, 3, 10, '#9ad0ff'); rect(g, x - 3, FY - 52, 6, 2, '#4a8ac0');
        rect(g, x - 2, FY - 26, 4, 3, '#3a3c50'); rect(g, x - 1, FY - 23, 2, 2, '#5ad0ff'); frame(g, x - 8, FY - 53, 19, 53, O);
        for (let j = -5; j <= 5; j++) { const hw = Math.round(Math.sqrt(25 - j * j)); rect(g, x - hw, 30 + j, hw * 2 + 1, 1, '#e8c060'); if (Math.abs(j) < 5) { const iw = Math.round(Math.sqrt(16 - Math.min(16, j * j))); rect(g, x - iw, 30 + j, iw * 2 + 1, 1, '#efe6c8'); } }
        at.clocks.push({ x, y: 30 });
      }
    }
  };
  fillHall(F.x + F.w + 12, W - 104);
  fillHall(104, B.x - 12, true);

  // a Quran on its stand, a string of beads on the carpet
  const Q = { x: cx - 74, y: FY + 22 };
  rect(g, Q.x, Q.y + 8, 2, 10, '#3a281c'); rect(g, Q.x + 18, Q.y + 8, 2, 10, '#3a281c');
  for (let i = 0; i < 20; i++) rect(g, Q.x + i, Q.y + 8 - Math.abs(10 - i) / 3, 1, 3, '#5a3e2a');
  rect(g, Q.x + 1, Q.y, 9, 7, '#efe6c8'); rect(g, Q.x + 10, Q.y, 9, 7, '#efe6c8'); rect(g, Q.x + 9, Q.y, 2, 8, '#1c4a3a');
  for (let l = 2; l < 7; l += 2) { rect(g, Q.x + 2, Q.y + l, 6, 1, '#8a8090'); rect(g, Q.x + 12, Q.y + l, 6, 1, '#8a8090'); }
  at.quran = { x: Q.x - 3, y: Q.y - 4, w: 26, h: 24 };
  for (let n = 0; n < 21; n++) { const a = n / 21 * Math.PI * 2; rect(g, Math.round(cx + 66 + Math.cos(a) * 11), Math.round(FY + 34 + Math.sin(a) * 5), 2, 2, '#e8d8a8'); }
  rect(g, cx + 76, FY + 37, 2, 6, '#e8d8a8'); rect(g, cx + 76, FY + 43, 3, 3, '#e8c060');
  at.beads = { x: cx + 52, y: FY + 24, w: 30, h: 24 };

  // the chandelier under the dome
  rect(g, cx, 0, 1, 24, O);
  for (const [ry, rw] of [[26, 46], [32, 34], [37, 20]]) { rect(g, cx - rw / 2, ry, rw, 2, '#e8c060'); rect(g, cx - rw / 2, ry + 2, rw, 1, '#8a6a20'); }
  for (const [ry, rw] of [[26, 46], [32, 34], [37, 20]]) for (let i = -rw / 2 + 2; i < rw / 2; i += 4) rect(g, cx + i, ry - 2, 1, 2, '#fff0c0');
  at.chand = { x: cx, y: 30 };

  // light: the chandelier fills the hall, the mihrab lamp glows, moonlight through the lattice
  const lights = [
    { x: cx, y: 34, rx: W * .55, ry: 150, c: '#ffd590', i: .9 },
    { x: cx, y: 64, rx: 46, ry: 60, c: '#f2cc7a', i: .7 },
    { x: B.x + B.w / 2, y: B.y + B.h / 2, rx: 50, ry: 40, c: '#7affb0', i: .35 }
  ];
  for (const wn of at.wins) lights.push({ x: wn.x + wn.w / 2, y: wn.y + wn.h, rx: 34, ry: 70, c: '#6a8ae0', i: .4 });
  for (const l of at.lanterns) lights.push({ x: l.x, y: l.y, rx: 40, ry: 60, c: '#ffcf7a', i: .6 });
  bake(g, W, MH, [.66, .66, .82], lights);
  // the lattice windows are drawn again after the light, the night still dark behind them
  for (const wn of at.wins) arch(wn.x, wn.y, wn.w, wn.h, (i, j) => lattice(i, j, wn.h));
  rect(g, cx - 2, 60, 5, 4, '#fff6d8');
}

function draw(g) {
  const { P, rect, glow, text, time, still } = k;
  // rain behind the lattice
  for (const w of at.wins) {
    g.save(); g.beginPath(); g.rect(w.x, w.y + 6, w.w, w.h - 6); g.clip();
    g.fillStyle = 'rgba(150,165,220,.45)';
    for (let n = 0; n < 18; n++) {
      const sp = 60 + (n * 37) % 40, y = (time * sp + n * 53 + w.x) % (w.h + 8) - 4, x = w.x + ((n * 29 + w.x + Math.floor(time * sp * .28)) % w.w);
      if ((x - w.x + Math.round(w.y + y)) % 4) g.fillRect(x, Math.round(w.y + y), 1, 2);
    }
    g.restore();
  }
  // the chandelier's lights breathe
  const b = still ? 1 : .8 + Math.sin(time * 1.3) * .2;
  g.globalAlpha = b;
  for (const [ry, rw] of [[26, 46], [32, 34], [37, 20]]) for (let i = -rw / 2 + 2; i < rw / 2; i += 4) rect(g, at.chand.x + i, ry - 2, 1, 2, '#fff6d8');
  g.globalAlpha = 1;

  // lanterns flicker; the clocks keep real time
  for (const l of at.lanterns || []) { const fl = still ? 0 : Math.sin(time * 8 + l.x) * .5 + Math.sin(time * 3.3 + l.x) * .5; rect(g, l.x - 1, l.y - 3, 2, fl > .2 ? 7 : 6, fl > .2 ? '#fff6d0' : '#fff0c0'); }
  const d0 = new Date();
  for (const c of at.clocks || []) {
    const ha = (d0.getHours() % 12 + d0.getMinutes() / 60) / 6 * Math.PI, ma = d0.getMinutes() / 30 * Math.PI;
    for (let q = 1; q <= 2; q++) rect(g, c.x + Math.round(Math.sin(ha) * q), c.y - Math.round(Math.cos(ha) * q), 1, 1, '#111');
    for (let q = 1; q <= 3; q++) rect(g, c.x + Math.round(Math.sin(ma) * q), c.y - Math.round(Math.cos(ma) * q), 1, 1, '#3a2a14');
  }
  // the board: the next prayer and the time left
  const B = at.board, nx = PR.next();
  if (!PR.loc) {
    text(g, tx(T('الصلاة', 'PRAYER')), B.x + B.w / 2, B.y + 26, P.gold);
    text(g, tx(T('اضبط', 'SET')), B.x + B.w / 2, B.y + 46, '#7a86b8');
  } else if (nx) {
    text(g, pname(nx.key), B.x + B.w / 2, B.y + 22, P.gold);
    const s = Math.floor((nx.at - Date.now()) / 1000);
    text(g, k.num(`${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}`), B.x + B.w / 2, B.y + 40, '#9fe0b0');
    // the day's five prayers as lights: green once passed, the next one blinking gold
    const D = PR.day(), now = new Date(), keys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    keys.forEach((key, i) => {
      const lx = B.x + 9 + i * 12, ly = B.y + B.h - 10, isNext = key === nx.key, done = D[key] < now && !isNext;
      rect(g, lx - 1, ly - 1, 6, 6, '#05070f');
      rect(g, lx, ly, 4, 4, isNext ? ((still || (time * 2 | 0) % 2) ? '#f0c850' : '#8a6a20') : done ? '#3ad08a' : '#1c2440');
    });
  }
  // a slow sheen sliding across the glass
  if (!still) { const sx = ((time * 14) % (B.w + 40)) - 20; g.globalAlpha = .07; for (let j = 0; j < B.h; j++) { const x0 = Math.max(B.x, Math.round(B.x + sx - j * .4)), x1 = Math.min(B.x + B.w, x0 + 6); if (x1 > x0) rect(g, x0, B.y + j, x1 - x0, 1, '#ffffff'); } g.globalAlpha = 1; }
}

const shift = b => b;

/* ---------------- windows ---------------- */
const panels = {};
function makePanel(id, cls, icon) { return (panels[id] = ST.panel('m_' + id, cls, icon)); }

// prayer times: a dial that fills toward the next prayer, the day's six times as tiles side by side,
// and the settings under their own tab
const pTimes = makePanel('times', 'a v-night win-wide win-reader', 'clock');
let tickTimer = 0, timesTab = 'times';
const SKY = {
  fajr: PIX(['.........', '.........', '.........', '....W....', '.........', '..BBBBB..', '.BBPPPBB.', 'BBPPPPPBB', 'KKKKKKKKK'], { W: '#e8e4d0', B: '#3a4a8a', P: '#c86a9a', K: '#1a1a2a' }),
  sunrise: PIX(['.........', '....Y....', '.Y.....Y.', '...YYY...', '..YYYYY..', 'Y.YYYYY.Y', '.........', 'KKKKKKKKK', '.........'], { Y: '#f0c850', K: '#6a5a3a' }),
  dhuhr: PIX(['....Y....', '.Y..Y..Y.', '..YYYYY..', '.YYOOOYY.', 'YYYOOOYYY', '.YYOOOYY.', '..YYYYY..', '.Y..Y..Y.', '....Y....'], { Y: '#f0c850', O: '#fff0a0' }),
  asr: PIX(['.........', '.........', '..YYY....', '.YYYYY...', '.YYYYY...', '..YYY....', '.........', 'KKKKKKKKK', '.........'], { Y: '#f0a040', K: '#6a5a3a' }),
  maghrib: PIX(['.........', '.........', '.........', '...RRR...', '..RRRRR..', 'OOOOOOOOO', '.OOOOOOO.', 'KKKKKKKKK', '.........'], { R: '#ff7a4a', O: '#c83a5a', K: '#2a1a2a' }),
  isha: PIX(['...WWW...', '..WWW....', '.WWW..S..', '.WWW.....', '.WWW...S.', '.WWWW....', '..WWWWW..', '...WWWW..', '.........'], { W: '#e8e4d0', S: '#9ab0ff' })
};
function fillTimes() {
  const b = pTimes.body, lang = ST.lang, t = TXT[lang];
  b.textContent = '';
  if (!PR.loc) { b.appendChild(el('p', '', t.needLoc)); b.appendChild(locBox()); return; }
  const tabs = el('div', 'rtabs'); tabs.setAttribute('role', 'tablist');
  for (const [key, label, ic] of [['times', t.timesTab, SKY.dhuhr], ['set', t.setTab, '']]) {
    const tb = el('button', 'rtab'); tb.type = 'button'; tb.setAttribute('role', 'tab'); tb.setAttribute('aria-selected', String(key === timesTab));
    if (ic) tb.innerHTML = ic;
    tb.appendChild(el('span', '', label));
    tb.addEventListener('click', () => { if (timesTab === key) return; timesTab = key; k.SND.click(); fillTimes(); });
    tabs.appendChild(tb);
  }
  b.appendChild(tabs);
  const head = el('div', 'rhead');
  head.appendChild(el('p', 'muted', PR.loc.name[lang === 'ar' ? 0 : 1]));
  const change = el('button', 'btn small', t.change); change.type = 'button';
  change.addEventListener('click', () => { b.textContent = ''; b.appendChild(locBox()); });
  head.appendChild(change); b.appendChild(head);
  clearInterval(tickTimer);
  if (timesTab === 'set') { b.appendChild(settingsBox(t, lang)); return; }

  const nx = PR.next(), cur = PR.current();
  // the counter: a ring of 48 pixel ticks that turn gold as the next prayer nears, the time left in three clear groups
  const dial = el('div', 'pdial');
  const ring = el('div', 'pticks'); ring.setAttribute('aria-hidden', 'true');
  const TICKS = 48;
  for (let n = 0; n < TICKS; n++) { const i = el('i'); i.style.setProperty('--a', (n / TICKS * 360) + 'deg'); if (n % 12 === 0) i.className = 'major'; ring.appendChild(i); }
  const inner = el('div', 'pinner');
  const ico = el('span', 'pico'); ico.innerHTML = SKY[nx.key] || ''; inner.appendChild(ico);
  inner.appendChild(el('span', 'pnext', pname(nx.key)));
  const groups = el('div', 'pgroups');
  const unit = (lab) => { const g = el('span', 'pg'); const v = el('b', 'pv', ''); v.dataset.pxscale = '2'; g.append(v, el('small', 'pl', lab)); groups.appendChild(g); return v; };
  const vh = unit(t.hrs), sep1 = el('b', 'psep', ':'), vm = unit(t.mins), sep2 = el('b', 'psep', ':'), vs = unit(t.secs);
  sep1.dataset.pxscale = sep2.dataset.pxscale = '2';
  groups.insertBefore(sep1, groups.children[1]); groups.insertBefore(sep2, groups.children[3]);
  inner.appendChild(groups);
  dial.append(ring, inner);
  b.appendChild(dial);
  b.appendChild(el('p', 'phijri center', PR.hijri(lang)));
  const span = cur ? nx.at - cur.at : 6 * 3600e3;
  const setRing = () => {
    const ms = Math.max(0, nx.at - Date.now()), sec = Math.floor(ms / 1000);
    const two = n => k.num(String(n).padStart(2, '0'));
    vh.textContent = two(Math.floor(sec / 3600)); vm.textContent = two(Math.floor(sec / 60) % 60); vs.textContent = two(sec % 60);
    const f = Math.max(0, Math.min(1, 1 - ms / span)), lit = Math.round(f * TICKS);
    [...ring.children].forEach((x, n) => { x.classList.toggle('on', n < lit); x.classList.toggle('head', n === lit); });
  };
  setRing();

  const tiles = el('div', 'ptiles');
  const D = PR.day();
  for (const key of PR.ORDER) {
    const isNext = key === nx.key, past = D[key] < new Date() && !isNext;
    const tile = el('div', 'ptile' + (isNext ? ' is-next' : past ? ' is-past' : '') + (cur && cur.key === key ? ' is-now' : ''));
    const ic = el('span', 'pico'); ic.innerHTML = SKY[key] || ''; tile.appendChild(ic);
    tile.appendChild(el('span', 'pname', pname(key)));
    tile.appendChild(el('b', 'ptime', PR.fmtTime(D[key], lang)));
    tiles.appendChild(tile);
  }
  b.appendChild(tiles);
  tickTimer = setInterval(() => {
    if (!pTimes.isOpen) return clearInterval(tickTimer);
    const n2 = PR.next();
    if (n2.key !== nx.key) { k.SND.bell(); fillTimes(); } else { setRing(); }
  }, 1000);
}
function settingsBox(t, lang) {
  const set = el('div', 'settings');
  const meth = el('select'); meth.setAttribute('aria-label', t.method);
  const auto = el('option', '', t.auto); auto.value = ''; meth.appendChild(auto);
  for (const [key, v] of Object.entries(PR.METH)) { const o = el('option', '', v[0][lang === 'ar' ? 0 : 1]); o.value = key; meth.appendChild(o); }
  meth.value = PR.opts.method || '';
  meth.addEventListener('change', () => { PR.setOpt('method', meth.value); fillTimes(); });
  const asr = el('select'); asr.setAttribute('aria-label', t.asr);
  for (const [v, l] of [['', t.auto], ['1', t.std], ['2', t.hanafi]]) { const o = el('option', '', l); o.value = v; asr.appendChild(o); }
  asr.value = PR.opts.asr ? String(PR.opts.asr) : '';
  asr.addEventListener('change', () => { PR.setOpt('asr', asr.value ? +asr.value : 0); fillTimes(); });
  const lab = (txt, ctl) => { const l = el('label', 'field'); l.appendChild(el('span', '', txt)); l.appendChild(ctl); return l; };
  set.appendChild(lab(t.method, meth)); set.appendChild(lab(t.asr, asr));
  const adh = el('button', 'btn toggle', PR.opts.adhan ? t.adhanOn : t.adhanOff); adh.type = 'button';
  adh.setAttribute('aria-pressed', String(!!PR.opts.adhan));
  adh.addEventListener('click', () => { PR.setOpt('adhan', !PR.opts.adhan); k.SND.unlock(); fillTimes(); });
  set.appendChild(adh);
  set.appendChild(el('p', 'win-foot', t.adhanNote));
  return set;
}
function locBox() {
  const t = TXT[ST.lang], box = el('div', 'loc');
  const me = el('button', 'btn', t.useMe); me.type = 'button';
  const msg = el('p', 'muted');
  me.addEventListener('click', () => {
    msg.textContent = t.locating;
    PR.locate('موقعي الحالي', 'My location').then(() => { fillTimes(); ST.refreshSpots(); }).catch(e => { msg.textContent = e === 'denied' ? t.denied : t.locFail; });
  });
  box.appendChild(me);
  const form = el('form', 'search'), inp = el('input'), go = el('button', 'btn small', t.search);
  inp.type = 'search'; inp.placeholder = t.city; inp.setAttribute('aria-label', t.city); go.type = 'submit';
  form.appendChild(inp); form.appendChild(go); box.appendChild(form);
  const res = el('ul', 'item-list'); box.appendChild(msg); box.appendChild(res);
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!inp.value.trim()) return;
    msg.textContent = t.searching; res.textContent = '';
    PR.search(inp.value.trim(), ST.lang).then(list => {
      msg.textContent = list.length ? '' : t.none;
      for (const c of list) {
        const li = el('li'), a = el('button', 'pick', c.name[ST.lang === 'ar' ? 0 : 1]); a.type = 'button';
        a.addEventListener('click', () => { PR.setLoc(c); fillTimes(); });
        li.appendChild(a); res.appendChild(li);
      }
    }).catch(() => { msg.textContent = t.searchFail; });
  });
  return box;
}

// adhkar: morning, evening, after prayer. Tabs across the top, the adhkar as cards side by side;
// each card counts itself down, finished cards turn green and the row moves on. Kept for the day.
const pAdhkar = makePanel('adhkar', 'a v-night win-wide win-reader', 'book');
let set = null;
const today = () => new Date().toDateString();
let prog = {};
try { prog = JSON.parse(k.store.get('adhkarProg', '{}')) || {}; } catch (e) { prog = {}; }
if (prog.d !== today()) prog = { d: today() };
const saveProg = () => k.store.set('adhkarProg', JSON.stringify(prog));
function groupOf(name) {
  const cur = PR.loc ? PR.current() : null, fm = cur && (cur.key === 'fajr' || cur.key === 'maghrib');
  return window.ADHKAR.map((a, i) => [a, i]).filter(([a]) => {
    if (name === 'm') return a.g === 'b' || a.g === 'm';
    if (name === 'e') return a.g === 'b' || a.g === 'e';
    return a.g === 'p' || (a.g === 'p1' && !fm) || (a.g === 'pf' && fm) || (a.g === 'pff' && cur && cur.key === 'fajr');
  });
}
function defaultSet() {
  const cur = PR.loc ? PR.current() : null;
  if (cur && Date.now() - cur.at < 45 * 60e3) return 'p';
  const h = new Date().getHours();
  return h >= 3 && h < 14 ? 'm' : 'e';
}
const TAB_ICONS = {
  m: PIX(['....Y....', '.Y..Y..Y.', '..YYYYY..', '.YYOOOYY.', 'YYYOOOYYY', '.YYOOOYY.', '..YYYYY..', '.Y..Y..Y.', '....Y....'], { Y: '#f0c850', O: '#fff0a0' }),
  e: PIX(['...WWW...', '..WWW....', '.WWW.....', '.WWW...S.', '.WWW.....', '.WWWW....', '..WWWWW..', '...WWWW..', '.........'], { W: '#e8e4d0', S: '#9ab0ff' }),
  p: PIX(['....G....', '...GGG...', '..GGGGG..', '..GGGGG..', '.GGGGGGG.', '.GDDDDDG.', '.GD.D.DG.', '.GD.D.DG.', 'GGGGGGGGG'], { G: '#3ad08a', D: '#0e3a26' })
};
function fillAdhkar() {
  const b = pAdhkar.body, t = TXT[ST.lang];
  if (!set) set = defaultSet();
  b.textContent = '';
  const tabs = el('div', 'rtabs'); tabs.setAttribute('role', 'tablist');
  for (const [key, label] of [['m', t.morning], ['e', t.evening], ['p', t.after]]) {
    const tb = el('button', 'rtab'); tb.type = 'button';
    tb.setAttribute('role', 'tab'); tb.setAttribute('aria-selected', String(key === set));
    tb.innerHTML = TAB_ICONS[key];
    tb.appendChild(el('span', '', label));
    tb.addEventListener('click', () => { if (set === key) return; set = key; k.SND.click(); fillAdhkar(); });
    tabs.appendChild(tb);
  }
  b.appendChild(tabs);
  const items = groupOf(set);
  const P_ = prog[set] || (prog[set] = {});
  const leftOf = ([a, i]) => P_[i] === undefined ? a.n : P_[i];
  const head = el('div', 'rhead'), status = el('p', 'muted');
  head.appendChild(status); b.appendChild(head);
  const bar = el('div', 'pbar'), fillBar = el('i'); bar.appendChild(fillBar); b.appendChild(bar);
  const row = el('div', 'cards');
  const showDone = () => {
    const done = items.filter(x => leftOf(x) === 0).length;
    status.textContent = t.progress.replace('{a}', k.num(done)).replace('{b}', k.num(items.length));
    fillBar.style.width = (items.length ? done / items.length * 100 : 0) + '%';
    const fin = b.querySelector('.all-done');
    if (done === items.length && !fin) b.appendChild(el('p', 'win-foot all-done', t.allDone));
  };
  items.forEach((it, j) => {
    const [a, i] = it, card = el('div', 'card' + (leftOf(it) === 0 ? ' done' : ''));
    const n = el('div', 'card-n');
    n.appendChild(el('span', '', k.num(j + 1) + ' / ' + k.num(items.length)));
    card.appendChild(n);
    card.appendChild(el('p', 'dhikr-text no-px', a.t));
    if (a.src) card.appendChild(el('p', 'src muted', a.src));
    const cnt = el('button', 'btn count'); cnt.type = 'button';
    const label = () => { const v = leftOf(it); cnt.textContent = v ? t.remaining.replace('{n}', k.num(v)) : t.done; cnt.disabled = !v; };
    label();
    cnt.addEventListener('click', () => {
      const v = Math.max(0, leftOf(it) - 1);
      P_[i] = v; saveProg(); label();
      card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
      if (v === 0) {
        k.SND.coin(); card.classList.add('done');
        // move on to the next card that still has counts left
        const nxt = [...row.children].find((c, x) => x > j && !c.classList.contains('done'));
        if (nxt) setTimeout(() => nxt.scrollIntoView({ block: 'nearest', inline: 'start', behavior: 'smooth' }), 260);
      } else k.SND.tap();
      showDone();
    });
    card.appendChild(cnt);
    row.appendChild(card);
  });
  b.appendChild(row);
  const nav = el('div', 'cnav');
  const step = d => () => { const w = row.firstElementChild ? row.firstElementChild.offsetWidth + 6 : 200; row.scrollBy({ left: d * w * (ST.lang === 'ar' ? -1 : 1), behavior: 'smooth' }); k.SND.click(); };
  const prev = el('button', 'btn step'), next = el('button', 'btn step');
  prev.type = next.type = 'button';
  prev.innerHTML = ARROW_PREV; next.innerHTML = ARROW_NEXT;
  prev.setAttribute('aria-label', t.prev); next.setAttribute('aria-label', t.next2);
  prev.addEventListener('click', step(-1)); next.addEventListener('click', step(1));
  nav.appendChild(prev); nav.appendChild(next); b.appendChild(nav);
  showDone();
  // open on the first card not yet finished
  const first = items.findIndex(x => leftOf(x) > 0);
  if (first > 0) requestAnimationFrame(() => { const c = row.children[first]; if (c) c.scrollIntoView({ block: 'nearest', inline: 'start' }); });
}

// the electronic tasbih: a ring of 33 beads that light one by one, an LCD count, the phrase of the round,
// a goal to pick, a small buzz under the thumb on phones. Kept on this device.
const pBeads = makePanel('beads', 'a v-night', 'beads');
const PHRASES = [T('سُبْحَانَ اللَّهِ', 'SubhanAllah'), T('الْحَمْدُ لِلَّهِ', 'Alhamdulillah'), T('اللَّهُ أَكْبَرُ', 'Allahu akbar')];
let beads = +k.store.get('beads', '0') || 0, goal = +k.store.get('beadsGoal', '33') || 33;
function fillBeads() {
  const b = pBeads.body, t = TXT[ST.lang];
  b.textContent = '';
  const tabs = el('div', 'rtabs'); tabs.setAttribute('role', 'tablist');
  for (const g of [33, 100, 1000]) {
    const tb = el('button', 'rtab', k.num(g)); tb.type = 'button'; tb.setAttribute('role', 'tab'); tb.setAttribute('aria-selected', String(g === goal));
    tb.addEventListener('click', () => { goal = g; k.store.set('beadsGoal', String(g)); k.SND.click(); fillBeads(); });
    tabs.appendChild(tb);
  }
  b.appendChild(tabs);
  const dev = el('div', 'tasbih');
  const ring = el('div', 'tring'); ring.setAttribute('aria-hidden', 'true');
  for (let n = 0; n < 33; n++) { const i = el('i'); i.style.setProperty('--a', (n / 33 * 360 - 90) + 'deg'); ring.appendChild(i); }
  const face = el('div', 'tface');
  const phrase = el('p', 'tphrase dhikr-text no-px');
  const lcd = el('div', 'tlcd'), num = el('b'), of = el('small');
  lcd.append(num, of);
  face.append(phrase, lcd);
  const press = el('button', 'tpress'); press.type = 'button'; press.setAttribute('aria-label', t.count);
  dev.append(ring, face);
  b.appendChild(dev);
  const row = el('div', 'dhikr-row');
  const reset = el('button', 'btn small', t.reset); reset.type = 'button';
  row.append(press, reset);
  b.appendChild(row);
  const show = bump => {
    const round = Math.floor(beads / 33) % 3, inRound = beads % 33;
    phrase.textContent = tx(PHRASES[round]);
    num.textContent = k.num(beads); of.textContent = '/ ' + k.num(goal);
    [...ring.children].forEach((x, n) => x.classList.toggle('on', n < inRound || (inRound === 0 && beads > 0 && bump === 'round')));
    if (bump) { lcd.classList.remove('pulse'); void lcd.offsetWidth; lcd.classList.add('pulse'); }
    press.textContent = t.count;
  };
  press.addEventListener('click', () => {
    beads++; k.store.set('beads', String(beads));
    if (navigator.vibrate) navigator.vibrate(beads % 33 === 0 ? [20, 40, 20] : 8);
    const end = beads % 33 === 0;
    if (beads === goal) { k.SND.bell(); } else if (end) k.SND.coin(); else k.SND.tap();
    show(end ? 'round' : 'step');
    if (beads === goal) { const p = el('p', 'win-foot', t.goalDone); b.appendChild(p); setTimeout(() => p.remove(), 4000); }
  });
  reset.addEventListener('click', () => { beads = 0; k.store.set('beads', '0'); k.SND.click(); show(); });
  show();
}

// the Qibla, from the mihrab
const pQibla = makePanel('qibla', 'a v-green', 'compass');
let heading = null;
function fillQibla() {
  const b = pQibla.body, t = TXT[ST.lang];
  b.textContent = '';
  if (!PR.loc) { b.appendChild(el('p', '', t.needLoc)); b.appendChild(locBox()); return; }
  const q = PR.qibla(), dist = Math.round(PR.distance());
  const dial = el('div', 'dial');
  const arrow = el('i', 'arrow');
  const rot = heading === null ? q : q - heading;
  arrow.style.transform = `rotate(${Math.round(rot)}deg)`;
  dial.appendChild(el('span', 'n', ST.lang === 'ar' ? 'ش' : 'N'));
  dial.appendChild(arrow);
  b.appendChild(dial);
  b.appendChild(el('p', 'center', t.qiblaDeg.replace('{d}', k.num(Math.round(q)))));
  b.appendChild(el('p', 'muted center', t.qiblaDist.replace('{k}', k.num(dist.toLocaleString('en')))));
  if (heading === null && window.DeviceOrientationEvent) {
    const btn = el('button', 'btn', t.compass); btn.type = 'button';
    btn.addEventListener('click', startCompass);
    b.appendChild(btn);
  }
}
function startCompass() {
  const on = e => {
    const h = e.webkitCompassHeading !== undefined ? e.webkitCompassHeading : (e.absolute && e.alpha !== null ? 360 - e.alpha : null);
    if (h === null) return;
    heading = h;
    const a = pQibla.body.querySelector('.arrow');
    if (a) a.style.transform = `rotate(${Math.round(PR.qibla() - heading)}deg)`;
  };
  const go = () => { addEventListener('deviceorientationabsolute', on); addEventListener('deviceorientation', on); };
  if (DeviceOrientationEvent.requestPermission) DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') go(); }).catch(() => {});
  else go();
}

// supplications, as cards side by side
const pDuas = makePanel('duas', 'a v-night win-wide win-reader', 'hands');
function fillDuas() {
  const b = pDuas.body, t = TXT[ST.lang];
  b.textContent = '';
  const row = el('div', 'cards');
  window.DUAS.forEach((d, j) => {
    const card = el('div', 'card');
    const n = el('div', 'card-n'); n.appendChild(el('span', '', k.num(j + 1) + ' / ' + k.num(window.DUAS.length))); card.appendChild(n);
    card.appendChild(el('p', 'dhikr-text no-px', d.ar));
    if (ST.lang === 'en') card.appendChild(el('p', 'src muted no-px', d.en));
    card.appendChild(el('p', 'src muted', d.src));
    row.appendChild(card);
  });
  b.appendChild(row);
  b.appendChild(cardNav(row, t));
}
function cardNav(row, t) {
  const nav = el('div', 'cnav');
  const step = d => () => { const w = row.firstElementChild ? row.firstElementChild.offsetWidth + 6 : 200; row.scrollBy({ left: d * w * (ST.lang === 'ar' ? -1 : 1), behavior: 'smooth' }); k.SND.click(); };
  const prev = el('button', 'btn step'), next = el('button', 'btn step');
  prev.type = next.type = 'button';
  prev.innerHTML = ARROW_PREV; next.innerHTML = ARROW_NEXT;
  prev.setAttribute('aria-label', t.prev); next.setAttribute('aria-label', t.next2);
  prev.addEventListener('click', step(-1)); next.addEventListener('click', step(1));
  nav.appendChild(prev); nav.appendChild(next);
  return nav;
}

// the mushaf on its stand opens on the short surahs read most often
const pMushaf = makePanel('mushaf', 'a v-night win-wide win-reader', 'book');
const FATIHA = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ';
const fromAdhkar = name => { const a = window.ADHKAR.find(x => x.src === name); return a ? a.t : ''; };
const SURAHS = () => [
  [T('الفاتحة', 'Al-Fatiha'), FATIHA],
  [T('آية الكرسي', 'Ayat al-Kursi'), fromAdhkar('آية الكرسي')],
  [T('الإخلاص', 'Al-Ikhlas'), fromAdhkar('سورة الإخلاص')],
  [T('الفلق', 'Al-Falaq'), fromAdhkar('سورة الفلق')],
  [T('الناس', 'An-Nas'), fromAdhkar('سورة الناس')]
].filter(s => s[1]);
let surah = 0;
function fillMushaf() {
  const b = pMushaf.body, list = SURAHS();
  b.textContent = '';
  const tabs = el('div', 'rtabs'); tabs.setAttribute('role', 'tablist');
  list.forEach(([name], i) => {
    const tb = el('button', 'rtab', tx(name)); tb.type = 'button';
    tb.setAttribute('role', 'tab'); tb.setAttribute('aria-selected', String(i === surah));
    tb.addEventListener('click', () => { if (surah === i) return; surah = i; k.SND.page(); fillMushaf(); });
    tabs.appendChild(tb);
  });
  b.appendChild(tabs);
  const page = el('div', 'mushaf-page');
  page.appendChild(el('p', 'dhikr-text no-px', list[Math.min(surah, list.length - 1)][1]));
  b.appendChild(page);
}

/* ---------------- the adhan, while the page is open ---------------- */
const adhan = new Audio('audio/adhan-qatami.mp3');
adhan.preload = 'none';
const pAdhan = makePanel('adhan', 'a v-pink', 'horn');
let lastCalled = k.store.get('adhanLast', '');
function checkAdhan() {
  if (!PR.loc || !PR.opts.adhan) return;
  const cur = PR.current();
  if (!cur || cur.key === 'sunrise') return;
  const id = cur.key + cur.at.toDateString();
  if (id === lastCalled || Date.now() - cur.at > 90e3) return;
  lastCalled = id; k.store.set('adhanLast', id);
  const t = TXT[ST.lang];
  pAdhan.title(t.adhanTitle);
  pAdhan.body.textContent = '';
  pAdhan.body.appendChild(el('p', 'dhikr-text', t.itsTime.replace('{p}', pname(cur.key))));
  const stop = el('button', 'btn', t.stop); stop.type = 'button';
  stop.addEventListener('click', () => { adhan.pause(); adhan.currentTime = 0; pAdhan.close(); });
  pAdhan.body.appendChild(stop);
  pAdhan.open(null);
  if (!k.SND.muted) adhan.play().catch(() => {});
}
setInterval(checkAdhan, 15e3);

/* ---------------- features: what is where, and what it opens ---------------- */
const FEATURES = [
  { id: 'times', label: T('مواقيت الصلاة', 'Prayer times'), box: () => ({ x: at.board.x - 2, y: at.board.y - 2, w: at.board.w + 4, h: at.board.h + 4 }), panel: pTimes, fill: fillTimes },
  { id: 'qibla', label: T('المحراب: القبلة', 'Mihrab: Qibla'), box: () => at.mihrab, panel: pQibla, fill: fillQibla },
  { id: 'adhkar', label: T('الأذكار', 'Adhkar'), box: () => at.shelf, panel: pAdhkar, fill: fillAdhkar },
  { id: 'duas', label: T('الأدعية', 'Supplications'), box: () => ({ x: at.frame.x - 3, y: at.frame.y - 3, w: at.frame.w + 6, h: at.frame.h + 6 }), panel: pDuas, fill: fillDuas },
  { id: 'beads', label: T('المسبحة', 'Prayer beads'), box: () => at.beads, panel: pBeads, fill: fillBeads },
  { id: 'quran', label: T('المصحف', 'The Quran'), box: () => at.quran, panel: pMushaf, fill: fillMushaf }
];
const TITLES = {
  times: T('مواقيت الصلاة', 'Prayer times'), qibla: T('اتجاه القبلة', 'Qibla direction'), adhkar: T('الأذكار', 'Adhkar'),
  duas: T('أدعية مأثورة', 'Supplications'), mushaf: T('المصحف', 'The Quran'), beads: T('المسبحة', 'Prayer beads')
};
function retitle() { for (const [id, p] of Object.entries(panels)) if (TITLES[id]) p.title(tx(TITLES[id])); }

const TXT = {
  ar: {
    needLoc: 'لحساب مواقيت الصلاة واتجاه القبلة نحتاج إلى موقعك، ويُحفظ على جهازك فقط.',
    useMe: 'استخدم موقعي', city: 'اكتب اسم مدينتك', search: 'ابحث', searching: 'جارٍ البحث…', none: 'لا توجد نتائج.',
    searchFail: 'تعذّر البحث الآن، تحقّق من الاتصال.', locating: 'جارٍ تحديد موقعك…', denied: 'لم يُسمح بالوصول إلى الموقع، ابحث عن مدينتك.', locFail: 'تعذّر تحديد الموقع، ابحث عن مدينتك.',
    change: 'تغيير', next: 'القادمة:', method: 'طريقة الحساب', asr: 'وقت العصر', auto: 'تلقائي', std: 'الجمهور', hanafi: 'الحنفي',
    adhanOn: 'الأذان: مفعّل', adhanOff: 'الأذان: متوقف', adhanNote: 'يُرفع الأذان بصوت ناصر القطامي عند دخول الوقت، ما دامت الصفحة مفتوحة والصوت غير مكتوم.',
    timesTab: 'المواقيت', setTab: 'الإعدادات', hrs: 'ساعة', mins: 'دقيقة', secs: 'ثانية', morning: 'الصباح', evening: 'المساء', after: 'بعد الصلاة', progress: 'أتممت {a} من {b}', remaining: 'بقي {n}', done: 'تمّ', prev: 'السابق', next2: 'التالي',
    allDone: 'أتممت أذكارك، تقبّل الله منك.', count: 'سبّح', reset: 'تصفير', goalDone: 'بلغت هدفك، تقبّل الله منك.',
    qiblaDeg: 'القبلة على {d}° من الشمال', qiblaDist: 'المسافة إلى مكة {k} كم', compass: 'تشغيل البوصلة',
    adhanTitle: 'الأذان', itsTime: 'حان الآن وقت صلاة {p}', stop: 'إيقاف الأذان'
  },
  en: {
    needLoc: 'To work out prayer times and the Qibla we need your location. It stays on your device.',
    useMe: 'Use my location', city: 'Type your city', search: 'Search', searching: 'Searching…', none: 'No results.',
    searchFail: "Couldn't search right now, check your connection.", locating: 'Finding you…', denied: 'Location was not allowed; search your city instead.', locFail: "Couldn't find your location; search your city instead.",
    change: 'Change', next: 'Next:', method: 'Calculation method', asr: 'Asr time', auto: 'Automatic', std: 'Standard', hanafi: 'Hanafi',
    adhanOn: 'Adhan: on', adhanOff: 'Adhan: off', adhanNote: 'The adhan by Nasser Al-Qatami plays when each prayer begins, while the page is open and sound is on.',
    timesTab: 'Times', setTab: 'Settings', hrs: 'hrs', mins: 'min', secs: 'sec', morning: 'Morning', evening: 'Evening', after: 'After prayer', progress: '{a} of {b} done', remaining: '{n} left', done: 'Done', prev: 'Previous', next2: 'Next',
    allDone: 'All done. May Allah accept it from you.', count: 'Count', reset: 'Reset', goalDone: 'Goal reached. May Allah accept it.',
    qiblaDeg: 'Qibla at {d}° from north', qiblaDist: '{k} km to Makkah', compass: 'Turn on the compass',
    adhanTitle: 'Adhan', itsTime: 'It is now time for {p}', stop: 'Stop the adhan'
  }
};

ST.onLang(lang => { ARROW_PREV = lang === 'ar' ? ARROW_R : ARROW_L; ARROW_NEXT = lang === 'ar' ? ARROW_L : ARROW_R; retitle(); for (const f of FEATURES) if (f.panel.isOpen) f.fill(); });

ST.scene({
  id: 'mosque', w: MW, minW: MW, h: MH, tile: 28, build, draw,
  hint: T('المس أي شيء في المسجد.', 'Touch anything in the mosque.'),
  spots: () => FEATURES.map(f => ({ box: shift(f.box()), label: f.label, open: b => { f.fill(); f.panel.open(b); } }))
});

window.Mosque = {
  // add({ id, label:{ar,en}, box:()=>({x,y,w,h}), title:{ar,en}, fill(panel) }) — a new thing in the hall with its own window
  add(f) {
    const p = makePanel(f.id, f.cls || '', f.icon || '');
    TITLES[f.id] = f.title || f.label;
    FEATURES.push({ id: f.id, label: f.label, box: f.box, panel: p, fill: () => f.fill(p) });
    retitle(); ST.refreshSpots();
  },
  at, kit: k
};
})();
