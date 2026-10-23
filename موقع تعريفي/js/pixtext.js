// pixel lettering for the HTML: each text element is redrawn as crisp pixel type.
// The open-source Noto Kufi Arabic and Silkscreen are rasterised at a small native size,
// thresholded to hard pixels and scaled up by a whole number of device pixels. The real text stays
// in the page for screen readers and search; only its picture changes.
window.PixText = (() => {
  'use strict';
  const AR = '"Pixel AE", "Pixel Kufi", "Pixel Silk", sans-serif', LA = '"Pixel Silk", "Pixel Kufi", sans-serif';
  const isAr = t => /[؀-ۿ]/.test(t);
  const scratch = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  // css px per font pixel: always a whole number of device pixels
  // on a desktop screen one font pixel is one screen pixel: thin and neat; on dense phones a little larger
  // the lettering is drawn at the face's native 10px grid; on an ordinary screen each of its pixels is two screen pixels so it reads easily
  const scale = () => { const d = window.devicePixelRatio || 1; return (d < 1.5 ? 2 : Math.max(2, Math.round(1.25 * d))) / d; };
  const SKIP = '.dhikr-card, .dua, .dua-ar, .countdown, .no-px, select, option, input, textarea, svg, canvas';

  // Arabic in Pixel AE at its native 10px (bold for titles), Latin in Silkscreen at its native 8px
  function font(text, size) { return isAr(text) ? `${size > 12 ? 700 : 400} 10px ${AR}` : `8px ${LA}`; }
  // has the face itself arrived? Until it has, text drawn now is a stand-in and is drawn again later
  const ready = f => !document.fonts || document.fonts.check(f, 'اA');

  // coverage to hard pixels: solid where the glyph covers most of a pixel; where a thin stroke
  // falls between two pixels (an alef, a lam) the stronger of the two is kept so the letter never drops out
  function binarize(a, w, h, t = 104, pair = 150) {
    const on = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) on[i] = a[i] >= t ? 1 : 0;
    const base = on.slice();
    // only a real stroke counts: the pair stands above both its outer neighbours (so the faint gap
    // between two letters, which sits below its neighbours, is never filled)
    const rescue = (i, j, before, after) => {
      if (base[i] || base[j] || a[i] + a[j] < pair) return;
      const lo = Math.min(a[i], a[j]);
      if (lo < 48 || before >= lo || after >= lo) return;
      on[a[i] >= a[j] ? i : j] = 1;
    };
    for (let y = 0; y < h; y++) for (let x = 0; x < w - 1; x++) {
      const i = y * w + x;
      rescue(i, i + 1, x > 0 ? a[i - 1] : 0, x + 2 < w ? a[i + 2] : 0);
    }
    for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      rescue(i, i + w, y > 0 ? a[i - w] : 0, y + 2 < h ? a[i + 2 * w] : 0);
    }
    return on;
  }

  // one line of text as a canvas of hard pixels
  function lineCanvas(text, size, color) {
    const f = font(text, size), x = scratch;
    x.font = f;
    // Pixel AE sits in a 16px line, its baseline at 12; Silkscreen keeps the taller box
    const ar = isAr(text), w = Math.ceil(x.measureText(text).width) + 4, h = ar ? 16 : Math.round(size * 1.7), base = ar ? 12 : Math.round(size * 1.25);
    const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.font = f; g.direction = isAr(text) ? 'rtl' : 'ltr'; g.textAlign = 'left'; g.fillStyle = '#000';
    g.fillText(text, 2, base);
    const img = g.getImageData(0, 0, c.width, h), d = img.data, a = new Uint8Array(c.width * h);
    for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
    const on = binarize(a, c.width, h);
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color) || [0, 17, 17, 17];
    for (let i = 0; i < a.length; i++) { d[i * 4] = +m[1]; d[i * 4 + 1] = +m[2]; d[i * 4 + 2] = +m[3]; d[i * 4 + 3] = on[i] ? 255 : 0; }
    g.putImageData(img, 0, 0);
    c.className = 'px';
    return c;
  }

  // break words into lines that fit `maxW` font pixels
  function wrap(text, size, maxW) {
    scratch.font = font(text, size);
    if (!isFinite(maxW)) return [text];
    const words = text.split(/\s+/).filter(Boolean), lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (scratch.measureText(t).width + 4 > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function isLeaf(el) {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) continue;
      if (n.nodeType === 1 && (n.classList.contains('px-sr') || n.classList.contains('px-lines'))) continue;
      return false;
    }
    return true;
  }

  function render(el) {
    if (el.closest(SKIP) || !isLeaf(el)) return;
    const sr = el.querySelector(':scope > .px-sr');
    const text = (sr ? sr.textContent : el.textContent).replace(/\s+/g, ' ').trim();
    if (!text) return;
    const cs = getComputedStyle(el), big2 = el.closest('[data-pxscale]'), s = scale() * (big2 ? +big2.dataset.pxscale || 1 : 1);
    const inline = cs.display.startsWith('inline') || el.matches('button, a, .btn, .tab, .pick, b, span, small, label');
    const big = el.matches('h2, .win-sub, .win-title, .hijri');
    const size = big ? 13 : 12;
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const maxW = inline && !el.matches('.pick, .item-list a, li > span, .bubble p') ? Infinity : Math.max(40, Math.floor((el.clientWidth - padX) / s));
    const key = text + '|' + maxW + '|' + s + '|' + cs.color + (ready(font(text, size)) ? '' : '|stand-in');
    if (el.dataset.px === key) return;
    el.dataset.px = key;
    const lines = wrap(text, size, maxW);
    const box = document.createElement(inline ? 'span' : 'span');
    box.className = 'px-lines' + (inline ? ' px-inline' : '');
    const align = cs.textAlign === 'center' ? 'center' : (cs.textAlign === 'left' || (cs.textAlign === 'start' && cs.direction === 'ltr') || (cs.textAlign === 'end' && cs.direction === 'rtl')) ? 'left' : 'right';
    box.style.alignItems = align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end';
    for (const ln of lines) {
      const c = lineCanvas(ln, size, cs.color);
      c.style.width = c.width * s + 'px'; c.style.height = c.height * s + 'px';
      box.appendChild(c);
    }
    const hidden = document.createElement('span'); hidden.className = 'px-sr'; hidden.textContent = text;
    el.textContent = '';
    el.append(hidden, box);
  }

  function all(root) {
    if (!root) return;
    const els = root.matches && root.matches('p, h2, h3, li, span, b, small, button, a, label') ? [root] : [];
    els.push(...root.querySelectorAll('p, h2, h3, li, span, b, small, button, a, label'));
    for (const el of els) if (!el.classList.contains('px-sr') && !el.classList.contains('px-lines')) render(el);
    if (!snapping.has(root)) { snapping.add(root); requestAnimationFrame(() => { snapping.delete(root); snap(root); }); }
  }

  // centring can leave a line on half a device pixel, which smears thin strokes and can drop a 1px alef:
  // nudge every line onto the device grid. A window still unfolding is measured once it has settled.
  const snapping = new Set();
  function snap(root) {
    const win = root.closest ? root.closest('.win') : null;
    if (win && win.getAnimations && win.getAnimations().length) return;
    const dpr = window.devicePixelRatio || 1, frac = v => { const f = ((v * dpr) % 1 + 1) % 1; return f > .5 ? f - 1 : f; };
    const cs = [...root.querySelectorAll('canvas.px')];
    for (const c of cs) c.style.translate = '';
    const moves = cs.map(c => { const r = c.getBoundingClientRect(); return r.width ? [frac(r.left), frac(r.top)] : [0, 0]; });
    cs.forEach((c, i) => { const [dx, dy] = moves[i]; if (Math.abs(dx) > .01 || Math.abs(dy) > .01) c.style.translate = `${(-dx / dpr).toFixed(3)}px ${(-dy / dpr).toFixed(3)}px`; });
  }

  // re-draw a root whenever its content changes, without reacting to our own drawing
  const watched = new Set();
  // when a face finishes loading, everything drawn with a stand-in is drawn again
  if (document.fonts) document.fonts.addEventListener('loadingdone', () => { for (const root of watched) all(root); });
  function watch(root) {
    if (watched.has(root)) return;
    watched.add(root);
    let pending = 0;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = requestAnimationFrame(() => { pending = 0; all(root); mo.takeRecords(); });
    });
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    root.addEventListener('animationend', e => { if (e.target === root) snap(root); });
    all(root); mo.takeRecords();
  }

  // type the lines out: each line is uncovered from its reading start, one after another, with a beep now and then
  function type(root, beep, speed = 1) {
    const lines = [...root.querySelectorAll('.px-lines:not(.px-inline) > canvas')].filter(c => !c.closest('.times, .item-list, .no-type'));
    if (!lines.length) return { finish() {} };
    const timers = [];
    const cover = c => { const ar = c.closest('[dir="rtl"], :lang(ar)') && getComputedStyle(c.parentNode).direction !== 'ltr'; c.style.transition = 'none'; c.style.clipPath = ar ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)'; };
    lines.forEach(cover);
    let t = 60;
    for (const c of lines) {
      const ms = Math.max(120, c.width * 7 / speed);
      timers.push(setTimeout(() => {
        c.style.transition = `clip-path ${ms}ms steps(${Math.max(4, Math.round(c.width / 6))}, end)`;
        c.style.clipPath = 'inset(0 0 0 0)';
        for (let b = 0; b < ms; b += 70) timers.push(setTimeout(beep, b));
      }, t));
      t += ms + 40;
    }
    return { finish() { timers.forEach(clearTimeout); lines.forEach(c => { c.style.transition = 'none'; c.style.clipPath = 'none'; }); } };
  }

  return { all, render, watch, type, binarize, ready, snap, refresh(root) { for (const el of root.querySelectorAll('[data-px]')) delete el.dataset.px; all(root); } };
})();
