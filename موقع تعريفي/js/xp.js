// the room's computer boots into an old desktop in the XP style: a start menu, a taskbar, windows that move,
// maximise and minimise, and a few real programs. Everything it keeps (notes, drawings) stays on this device.
window.XP = (() => {
'use strict';
const SITE = window.SITE;
const store = {
  get(k, d) { try { const v = localStorage.getItem('xp.' + k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('xp.' + k, v); } catch (e) {} }
};
let root = null, desk = null, bar = null, tasks = null, menu = null, clockEl = null, z = 10, lang = 'ar', SND = null, onExit = null;
const wins = new Map();
const L = {
  ar: { start: 'ابدأ', off: 'إيقاف التشغيل', notepad: 'المفكرة', paint: 'الرسام', mines: 'كاسحة الألغام', projects: 'مشاريعي', accounts: 'حساباتي',
    bin: 'سلة المحذوفات', binEmpty: 'السلة فارغة.', file: 'ملف', newNote: 'جديد', saved: 'حُفظ تلقائيًا', clear: 'مسح', loading: 'جارٍ جلب المشاريع…', fail: 'تعذّر جلب المشاريع الآن.',
    none: 'لا مشاريع بعد.', welcome: 'مرحبًا', booting: 'جارٍ التشغيل…', win: 'أحسنت! نظّفت الحقل.', lose: 'انفجر لغم! حاول مرة أخرى.', about: 'حول الجهاز',
    aboutBody: 'جهاز سجاد القديم. كل ما تكتبه أو ترسمه هنا يُحفظ على جهازك فقط.', pencil: 'قلم', eraser: 'ممحاة', bucket: 'تعبئة' },
  en: { start: 'start', off: 'Turn Off Computer', notepad: 'Notepad', paint: 'Paint', mines: 'Minesweeper', projects: 'My Projects', accounts: 'My Accounts',
    bin: 'Recycle Bin', binEmpty: 'The bin is empty.', file: 'File', newNote: 'New', saved: 'Saved automatically', clear: 'Clear', loading: 'Loading projects…', fail: "Couldn't load the projects right now.",
    none: 'No projects yet.', welcome: 'Welcome', booting: 'Starting up…', win: 'Well done! Field cleared.', lose: 'Boom! Try again.', about: 'About this computer',
    aboutBody: "Sajjad's old computer. Whatever you write or draw here stays on your device.", pencil: 'Pencil', eraser: 'Eraser', bucket: 'Fill' }
};
const t = k => L[lang][k];
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const click = () => SND && SND.click();

// 16x16 pixel icons
const PX = (rows, col) => {
  const by = {};
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') (by[ch] = by[ch] || []).push(`M${x} ${y}h1v1h-1z`); }));
  return `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">` + Object.entries(by).map(([ch, d]) => `<path fill="${col[ch]}" d="${d.join('')}"/>`).join('') + '</svg>';
};
const ICON = {
  notepad: PX(['..KKKKKKKKKK....', '..KWWWWWWWWKK...', '..KWBBBBBBWKWK..', '..KWWWWWWWWKKKK.', '..KWBBBBBBBBWWK.', '..KWWWWWWWWWWWK.', '..KWBBBBBBBBBWK.', '..KWWWWWWWWWWWK.', '..KWBBBBBBBBBWK.', '..KWWWWWWWWWWWK.', '..KWBBBBBBBWWWK.', '..KWWWWWWWWWWWK.', '..KWWWWWWWWWWWK.', '..KKKKKKKKKKKKK.', '................', '................'], { K: '#20304a', W: '#ffffff', B: '#6a8ad0' }),
  paint: PX(['................', '.....KKKKKK.....', '...KKWWWWWWKK...', '..KWWRRWWBBWWK..', '.KWWWRRWWBBWWWK.', '.KWYYWWWWWWWWWK.', 'KWWYYWWWWWWGGWWK', 'KWWWWWWKKWWGGWWK', 'KWWWWWWKKWWWWWWK', '.KWWWWWWWWWWWWK.', '.KWWWWWWWWWWKK..', '..KKWWWWWWWK....', '....KKKKKKK.....', '..........KKK...', '.........KBBK...', '..........KK....'], { K: '#20304a', W: '#f4ecd8', R: '#e83a3a', B: '#3a6ae0', Y: '#f0c850', G: '#3ab05a' }),
  mines: PX(['.......K........', '.......K..W.....', '...K.KKKKK.K....', '....KKKKKKK.....', '...KKWWKKKKK....', '..KKKWWKKKKKK...', 'KKKKKKKKKKKKKKK.', '..KKKKKKKKKKK...', '...KKKKKKKKK....', '....KKKKKKK.....', '...K.KKKKK.K....', '.......K........', '.......K........', '................', '................', '................'], { K: '#111111', W: '#ffffff' }),
  projects: PX(['................', '.YYYYY..........', 'YLLLLLY.........', 'YLLLLLYYYYYYYYY.', 'YLLLLLLLLLLLLLLY', 'YLLLLLLLLLLLLLLY', 'YLLLLLLLLLLLLLLY', 'YLLLLLLLLLLLLLLY', 'YLLLLLLLLLLLLLLY', 'YLLLLLLLLLLLLLLY', 'YLLLLLLLLLLLLLLY', 'YLLLLLLLLLLLLLLY', 'YYYYYYYYYYYYYYYY', '................', '................', '................'], { Y: '#c8961a', L: '#ffd86a' }),
  accounts: PX(['................', '.....KKKKKK.....', '....KBBBBBBK....', '...KBBWWWWBBK...', '...KBWWWWWWBK...', '...KBWWWWWWBK...', '...KBBWWWWBBK...', '....KBBBBBBK....', '.....KKKKKK.....', '...KKBBBBBBKK...', '..KBBBBBBBBBBK..', '.KBBBBBBBBBBBBK.', '.KBBBBBBBBBBBBK.', '.KKKKKKKKKKKKKK.', '................', '................'], { K: '#14306a', B: '#3a8ae0', W: '#f4e0c8' }),
  bin: PX(['......KKKK......', '..KKKKKKKKKKKK..', '..KWWWWWWWWWWK..', '...KWWKWWKWWK...', '...KWWKWWKWWK...', '...KWWKWWKWWK...', '...KWWKWWKWWK...', '...KWWKWWKWWK...', '...KWWKWWKWWK...', '...KWWKWWKWWK...', '...KWWWWWWWWK...', '....KKKKKKKK....', '................', '................', '................', '................'], { K: '#30405a', W: '#c8d8e8' }),
  about: PX(['................', '.KKKKKKKKKKKKKK.', '.KBBBBBBBBBBBBK.', '.KBGGGGGGGGGGBK.', '.KBGGGGGGGGGGBK.', '.KBGGGGGGGGGGBK.', '.KBGGGGGGGGGGBK.', '.KBBBBBBBBBBBBK.', '.KKKKKKKKKKKKKK.', '......KKKK......', '....KKKKKKKK....', '................', '................', '................', '................', '................'], { K: '#30405a', B: '#c8c4b8', G: '#3a8ae0' })
};

const TOOL = {
  pencil: PX(['......KK.', '.....KYK.', '....KYK..', '...KYK...', '..KYK....', '.KPK.....', '.KKK.....', 'KK.......', '.........'], { K: '#20304a', Y: '#f0c850', P: '#f4a0a0' }),
  eraser: PX(['.........', '....KKKK.', '...KPPPK.', '..KPPPKK.', '.KWWPKK..', 'KWWWKK...', 'KKKKK....', '.........', '.........'], { K: '#20304a', P: '#f080a0', W: '#ffffff' }),
  bucket: PX(['..KKK....', '.K...K...', 'KKKKKKK..', 'KWWWWWKB.', 'KWWWWWKBB', '.KWWWK.BB', '..KKK...B', '.........', '.........'], { K: '#20304a', W: '#c8d8e8', B: '#3a6ae0' }),
  clear: PX(['.........', '.R.....R.', '..R...R..', '...R.R...', '....R....', '...R.R...', '..R...R..', '.R.....R.', '.........'], { R: '#d8401c' })
};
/* ---------- windows ---------- */
function open(id) {
  if (wins.has(id)) { const w = wins.get(id); w.el.hidden = false; focus(w); return w; }
  const app = APPS[id]; if (!app) return null;
  const small = innerWidth < 640;
  const w = { id, max: small, el: el('section', 'xpw'), task: el('button', 'xp-task') };
  w.el.setAttribute('role', 'dialog');
  const head = el('header', 'xpw-bar');
  const ic = el('span', 'xpw-ico'); ic.innerHTML = ICON[app.icon || id] || '';
  const title = el('span', 'xpw-title', t(app.title || id));
  const btns = el('span', 'xpw-btns');
  const bMin = el('button', 'xb min'), bMax = el('button', 'xb max'), bX = el('button', 'xb x');
  for (const b of [bMin, bMax, bX]) { b.type = 'button'; btns.appendChild(b); }
  bMin.setAttribute('aria-label', 'minimise'); bMax.setAttribute('aria-label', 'maximise'); bX.setAttribute('aria-label', 'close');
  head.append(ic, title, btns);
  w.body = el('div', 'xpw-body');
  w.el.append(head, w.body);
  const [ww, hh] = app.size || [360, 260];
  const n = wins.size;
  Object.assign(w.el.style, { width: Math.min(ww, innerWidth - 20) + 'px', height: Math.min(hh, innerHeight - 70) + 'px', left: Math.max(6, Math.min(innerWidth - ww - 10, lang === 'ar' ? innerWidth - ww - 100 - n * 28 : 100 + n * 28)) + 'px', top: Math.max(6, 30 + n * 24) + 'px' });
  w.el.classList.toggle('max', w.max);
  desk.appendChild(w.el);
  w.task.type = 'button'; w.task.innerHTML = ICON[app.icon || id] || ''; w.task.appendChild(el('span', '', t(app.title || id)));
  tasks.appendChild(w.task);
  wins.set(id, w);
  app.fill(w);
  bX.addEventListener('click', e => { e.stopPropagation(); close(w); });
  bMin.addEventListener('click', e => { e.stopPropagation(); w.el.hidden = true; w.task.classList.remove('on'); click(); });
  bMax.addEventListener('click', e => { e.stopPropagation(); toggleMax(w); });
  head.addEventListener('dblclick', () => toggleMax(w));
  w.task.addEventListener('click', () => { if (!w.el.hidden && w.el.style.zIndex == z) { w.el.hidden = true; w.task.classList.remove('on'); } else { w.el.hidden = false; focus(w); } click(); });
  w.el.addEventListener('pointerdown', () => focus(w));
  // drag by the title bar
  head.addEventListener('pointerdown', e => {
    if (e.target.closest('.xb') || w.max) return;
    const r = w.el.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
    head.setPointerCapture(e.pointerId);
    const mv = ev => { w.el.style.left = Math.max(-r.width + 60, Math.min(innerWidth - 60, ev.clientX - ox)) + 'px'; w.el.style.top = Math.max(0, Math.min(innerHeight - 60, ev.clientY - oy)) + 'px'; };
    const up = () => { head.removeEventListener('pointermove', mv); head.removeEventListener('pointerup', up); };
    head.addEventListener('pointermove', mv); head.addEventListener('pointerup', up);
  });
  focus(w);
  w.el.classList.add('opening'); setTimeout(() => w.el.classList.remove('opening'), 300);
  if (SND) SND.pop();
  return w;
}
function toggleMax(w) { w.max = !w.max; w.el.classList.toggle('max', w.max); click(); if (APPS[w.id].resize) APPS[w.id].resize(w); }
function focus(w) {
  w.el.style.zIndex = ++z;
  for (const o of wins.values()) { o.el.classList.toggle('blur', o !== w); o.task.classList.toggle('on', o === w && !o.el.hidden); }
}
function close(w) {
  if (APPS[w.id].close) APPS[w.id].close(w);
  w.el.classList.add('closing');
  setTimeout(() => { w.el.remove(); w.task.remove(); }, 160);
  wins.delete(w.id); click();
}

/* ---------- programs ---------- */
const APPS = {
  notepad: {
    size: [380, 280],
    fill(w) {
      const menuBar = el('div', 'xp-menu');
      const nw = el('button', '', t('newNote')); nw.type = 'button';
      const st = el('span', 'xp-status', t('saved'));
      menuBar.append(nw, st);
      const ta = el('textarea', 'xp-text');
      ta.value = store.get('note', lang === 'ar' ? 'اكتب هنا ما تشاء…' : 'Write anything here…');
      ta.dir = 'auto'; ta.spellcheck = false;
      let tm = 0;
      ta.addEventListener('input', () => { st.textContent = '…'; clearTimeout(tm); tm = setTimeout(() => { store.set('note', ta.value); st.textContent = t('saved'); }, 400); if (SND && Math.random() < .5) SND.beep(); });
      nw.addEventListener('click', () => { ta.value = ''; store.set('note', ''); ta.focus(); click(); });
      w.body.append(menuBar, ta);
      setTimeout(() => ta.focus(), 50);
    }
  },
  paint: {
    size: [420, 330],
    fill(w) {
      const PAL = ['#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7'];
      const CW = 96, CH = 64;
      let color = '#000000', tool = 'pencil', down = false;
      const tools = el('div', 'xp-tools');
      for (const id of ['pencil', 'eraser', 'bucket']) {
        const b = el('button', 'xp-tool' + (id === tool ? ' on' : '')); b.innerHTML = TOOL[id]; b.type = 'button'; b.title = t(id); b.setAttribute('aria-label', t(id));
        b.addEventListener('click', () => { tool = id; tools.querySelectorAll('.xp-tool').forEach(x => x.classList.toggle('on', x === b)); click(); });
        tools.appendChild(b);
      }
      const clr = el('button', 'xp-tool'); clr.innerHTML = TOOL.clear; clr.type = 'button'; clr.title = t('clear'); clr.setAttribute('aria-label', t('clear'));
      tools.appendChild(clr);
      const cv = el('canvas', 'xp-canvas'); cv.width = CW; cv.height = CH;
      const g = cv.getContext('2d');
      const saved = store.get('paint', '');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, CW, CH);
      if (saved) { const im = new Image(); im.onload = () => g.drawImage(im, 0, 0); im.src = saved; }
      const pal = el('div', 'xp-pal');
      const cur = el('i', 'xp-cur'); cur.style.background = color; pal.appendChild(cur);
      for (const c of PAL) { const s = el('button', 'xp-sw'); s.type = 'button'; s.style.background = c; s.setAttribute('aria-label', c); s.addEventListener('click', () => { color = c; cur.style.background = c; click(); }); pal.appendChild(s); }
      const save = () => { try { store.set('paint', cv.toDataURL()); } catch (e) {} };
      const at = e => { const r = cv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * CW), Math.floor((e.clientY - r.top) / r.height * CH)]; };
      const plot = (x, y) => { g.fillStyle = tool === 'eraser' ? '#ffffff' : color; g.fillRect(x - (tool === 'eraser' ? 1 : 0), y - (tool === 'eraser' ? 1 : 0), tool === 'eraser' ? 3 : 1, tool === 'eraser' ? 3 : 1); };
      let last = null;
      const line = (a, b) => { const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1); for (let i = 0; i <= n; i++) plot(Math.round(a[0] + (b[0] - a[0]) * i / n), Math.round(a[1] + (b[1] - a[1]) * i / n)); };
      const fillAt = (x, y) => {
        const img = g.getImageData(0, 0, CW, CH), d = img.data, i0 = (y * CW + x) * 4, from = [d[i0], d[i0 + 1], d[i0 + 2]];
        const to = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)];
        if (from.every((v, j) => v === to[j])) return;
        const st = [[x, y]];
        while (st.length) {
          const [px, py] = st.pop(); if (px < 0 || py < 0 || px >= CW || py >= CH) continue;
          const i = (py * CW + px) * 4; if (d[i] !== from[0] || d[i + 1] !== from[1] || d[i + 2] !== from[2]) continue;
          d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2]; st.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
        }
        g.putImageData(img, 0, 0);
      };
      cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const p = at(e); if (tool === 'bucket') { fillAt(...p); save(); click(); return; } down = true; last = p; plot(...p); });
      cv.addEventListener('pointermove', e => { if (!down) return; const p = at(e); line(last, p); last = p; });
      const end = () => { if (down) { down = false; save(); } };
      cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
      clr.addEventListener('click', () => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, CW, CH); save(); click(); });
      const wrap = el('div', 'xp-paint'); const area = el('div', 'xp-area'); area.appendChild(cv);
      wrap.append(tools, area);
      w.body.append(wrap, pal);
    }
  },
  mines: {
    size: [240, 336],
    fill(w) {
      const N = 9, M = 10;
      let cells, over, left, started, flags;
      const top = el('div', 'xp-mtop'), cnt = el('b', 'xp-lcd'), face = el('button', 'xp-face', '☺'), tm = el('b', 'xp-lcd');
      face.type = 'button';
      top.append(cnt, face, tm);
      const grid = el('div', 'xp-grid'); grid.style.setProperty('--n', N);
      w.body.append(top, grid);
      let timer = 0, secs = 0;
      const lcd = (e, v) => { e.textContent = String(Math.max(0, Math.min(999, v))).padStart(3, '0'); };
      const nb = i => { const x = i % N, y = Math.floor(i / N), r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < N && ny < N) r.push(ny * N + nx); } return r; };
      const reset = () => {
        cells = Array.from({ length: N * N }, () => ({ mine: false, open: false, flag: false, n: 0 }));
        over = false; left = N * N - M; started = false; flags = 0; secs = 0; clearInterval(timer);
        face.textContent = '☺'; lcd(cnt, M); lcd(tm, 0);
        grid.textContent = '';
        cells.forEach((c, i) => {
          const b = el('button', 'xp-cell'); b.type = 'button'; c.b = b;
          b.addEventListener('click', () => reveal(i));
          b.addEventListener('contextmenu', e => { e.preventDefault(); flag(i); });
          let hold = 0;
          b.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') hold = setTimeout(() => { hold = -1; flag(i); }, 420); });
          b.addEventListener('pointerup', () => { if (hold > 0) clearTimeout(hold); });
          grid.appendChild(b);
        });
      };
      const plant = safe => {
        const no = new Set([safe, ...nb(safe)]); let k = 0;
        while (k < M) { const i = Math.floor(Math.random() * N * N); if (!cells[i].mine && !no.has(i)) { cells[i].mine = true; k++; } }
        cells.forEach((c, i) => { c.n = nb(i).filter(j => cells[j].mine).length; });
      };
      const flag = i => { const c = cells[i]; if (over || c.open) return; c.flag = !c.flag; flags += c.flag ? 1 : -1; c.b.textContent = c.flag ? '⚑' : ''; c.b.classList.toggle('flag', c.flag); lcd(cnt, M - flags); if (SND) SND.tap(); };
      const reveal = i => {
        const c = cells[i]; if (over || c.open || c.flag) return;
        if (!started) { started = true; plant(i); timer = setInterval(() => lcd(tm, ++secs), 1000); }
        if (c.mine) {
          over = true; clearInterval(timer); face.textContent = '☹';
          cells.forEach(x => { if (x.mine) { x.b.textContent = '✹'; x.b.classList.add('boom'); } });
          if (SND) SND.thunder(); return;
        }
        const st = [i];
        while (st.length) {
          const j = st.pop(), x = cells[j]; if (x.open || x.flag) continue;
          x.open = true; left--; x.b.classList.add('open'); x.b.textContent = x.n || ''; x.b.dataset.n = x.n;
          if (!x.n) for (const m of nb(j)) if (!cells[m].open && !cells[m].mine) st.push(m);
        }
        if (SND) SND.click();
        if (left === 0) { over = true; clearInterval(timer); face.textContent = '☻'; if (SND) SND.coin(); }
      };
      face.addEventListener('click', () => { reset(); click(); });
      reset();
      w.cleanup = () => clearInterval(timer);
    },
    close(w) { if (w.cleanup) w.cleanup(); }
  },
  projects: {
    size: [380, 280],
    fill(w) {
      const list = el('div', 'xp-files');
      const msg = el('p', 'xp-msg', t('loading'));
      w.body.append(msg, list);
      if (!SITE.github) { msg.textContent = t('none'); return; }
      fetch('https://api.github.com/users/' + encodeURIComponent(SITE.github) + '/repos?sort=updated&per_page=12')
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => {
          const repos = d.filter(r => !r.fork);
          msg.textContent = repos.length ? '' : t('none'); msg.hidden = !!repos.length;
          for (const r of repos) {
            const a = el('a', 'xp-file'); a.href = r.html_url; a.target = '_blank'; a.rel = 'noopener';
            const ic = el('span', 'xp-fico'); ic.innerHTML = ICON.projects; a.appendChild(ic);
            a.appendChild(el('span', '', r.name));
            if (r.description) a.title = r.description;
            list.appendChild(a);
          }
        })
        .catch(() => { msg.textContent = t('fail'); });
    }
  },
  accounts: {
    size: [320, 250],
    fill(w) {
      const list = el('div', 'xp-files');
      for (const a of SITE.accounts) {
        const x = el('a', 'xp-file'); x.href = a.url || '#'; if (a.url) { x.target = '_blank'; x.rel = 'noopener'; }
        const ic = el('span', 'xp-fico'); ic.innerHTML = ICON.accounts; x.appendChild(ic);
        x.appendChild(el('span', '', a.label[lang]));
        x.appendChild(el('small', '', a.handle));
        list.appendChild(x);
      }
      w.body.appendChild(list);
    }
  },
  bin: { size: [280, 180], fill(w) { w.body.appendChild(el('p', 'xp-msg', t('binEmpty'))); } },
  about: { size: [300, 170], fill(w) { w.body.appendChild(el('p', 'xp-msg', t('aboutBody'))); } }
};

/* ---------- the shell: desktop, icons, taskbar, start menu ---------- */
function build() {
  root = el('div', 'xp no-px'); root.hidden = true;
  desk = el('div', 'xp-desk');
  const icons = el('div', 'xp-icons');
  for (const id of ['projects', 'accounts', 'notepad', 'paint', 'mines', 'bin']) {
    const b = el('button', 'xp-icon'); b.type = 'button'; b.dataset.app = id;
    const ic = el('span', 'xp-iico'); ic.innerHTML = ICON[id];
    b.append(ic, el('span', 'xp-ilabel', ''));
    b.addEventListener('click', () => { icons.querySelectorAll('.xp-icon').forEach(x => x.classList.toggle('sel', x === b)); });
    b.addEventListener('dblclick', () => open(id));
    // one tap opens on touch screens
    b.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') open(id); });
    b.addEventListener('keydown', e => { if (e.key === 'Enter') open(id); });
    icons.appendChild(b);
  }
  desk.appendChild(icons);
  bar = el('div', 'xp-bar');
  const startB = el('button', 'xp-start'); startB.type = 'button';
  startB.innerHTML = '<i class="xp-flag" aria-hidden="true"></i><span></span>';
  tasks = el('div', 'xp-tasks');
  const tray = el('div', 'xp-tray'); clockEl = el('span', 'xp-clock'); tray.appendChild(clockEl);
  bar.append(startB, tasks, tray);
  menu = el('div', 'xp-menu-start'); menu.hidden = true;
  const mhead = el('div', 'xp-mhead'); const av = el('i', 'xp-av'); mhead.append(av, el('b', '', ''));
  const mlist = el('div', 'xp-mlist');
  for (const id of ['projects', 'accounts', 'notepad', 'paint', 'mines', 'about']) {
    const b = el('button', 'xp-mitem'); b.type = 'button'; b.dataset.app = id;
    const ic = el('span', 'xp-fico'); ic.innerHTML = ICON[id]; b.append(ic, el('span', '', ''));
    b.addEventListener('click', () => { menu.hidden = true; startB.classList.remove('on'); open(id); });
    mlist.appendChild(b);
  }
  const mfoot = el('div', 'xp-mfoot'); const off = el('button', 'xp-off'); off.type = 'button'; off.innerHTML = '<i aria-hidden="true"></i><span></span>';
  off.addEventListener('click', shutdown);
  mfoot.appendChild(off);
  menu.append(mhead, mlist, mfoot);
  startB.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; startB.classList.toggle('on', !menu.hidden); click(); });
  desk.addEventListener('pointerdown', e => { if (!e.target.closest('.xp-menu-start')) { menu.hidden = true; startB.classList.remove('on'); } });
  const boot = el('div', 'xp-boot'); boot.innerHTML = '<b>XP</b><span class="xp-bootbar"><i></i><i></i><i></i></span><small></small>';
  root.append(desk, bar, menu, boot);
  document.body.appendChild(root);
  addEventListener('keydown', e => { if (!root.hidden && e.key === 'Escape') { if (!menu.hidden) { menu.hidden = true; startB.classList.remove('on'); } else shutdown(); } });
  setInterval(tick, 10e3);
}
function relabel() {
  if (!root) return;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr'; root.lang = lang;
  root.querySelectorAll('.xp-icon').forEach(b => { b.querySelector('.xp-ilabel').textContent = t(b.dataset.app); });
  root.querySelectorAll('.xp-mitem').forEach(b => { b.lastChild.textContent = t(b.dataset.app); });
  root.querySelector('.xp-start span').textContent = t('start');
  root.querySelector('.xp-off span').textContent = t('off');
  root.querySelector('.xp-mhead b').textContent = SITE.name[lang];
  root.querySelector('.xp-boot small').textContent = t('booting');
  for (const w of wins.values()) { w.el.querySelector('.xpw-title').textContent = t(w.id); w.task.lastChild.textContent = t(w.id); }
  tick();
}
function tick() {
  if (!clockEl) return;
  const d = new Date();
  clockEl.textContent = d.toLocaleTimeString(lang === 'ar' ? 'ar' : 'en', { hour: 'numeric', minute: '2-digit' });
}
function boot(opts) {
  SND = opts.sound; onExit = opts.onExit; lang = opts.lang || 'ar';
  if (!root) build();
  relabel();
  root.hidden = false; root.classList.remove('off');
  const b = root.querySelector('.xp-boot');
  b.hidden = false; b.classList.remove('done');
  setTimeout(() => { b.classList.add('done'); setTimeout(() => { b.hidden = true; }, 400); if (SND) SND.pop(); }, opts.still ? 0 : 1300);
  document.body.classList.add('xp-on');
}
function shutdown() {
  if (!root || root.hidden) return;
  for (const w of [...wins.values()]) close(w);
  menu.hidden = true; root.querySelector('.xp-start').classList.remove('on');
  root.classList.add('off');
  if (SND) SND.shut();
  setTimeout(() => { root.hidden = true; root.classList.remove('off'); document.body.classList.remove('xp-on'); if (onExit) onExit(); }, 420);
}
return { boot, shutdown, setLang(l) { lang = l; relabel(); }, get on() { return !!root && !root.hidden; } };
})();
