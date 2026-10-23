// sounds built from noise and sine tones with Web Audio: no music, no audio files
window.Sound = (() => {
  'use strict';
  let ac = null, master = null, rainGain = null, roomF = null, roomG = null, roof = null;
  let indoor = false, amb = null, pendingAmb = null;
  let muted = false;
  try { muted = localStorage.getItem('muted') === '1'; } catch (e) {}

  function noiseBuffer(sec) {
    const b = ac.createBuffer(1, ac.sampleRate * sec, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function start() {
    if (ac) return;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    ac = new C();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ac.destination);

    // rain: a hiss band plus a soft low wash, slowly breathing
    const src = ac.createBufferSource();
    src.buffer = noiseBuffer(4); src.loop = true;
    const hiss = ac.createBiquadFilter(); hiss.type = 'bandpass'; hiss.frequency.value = 1300; hiss.Q.value = .35;
    const wash = ac.createBiquadFilter(); wash.type = 'lowpass'; wash.frequency.value = 380;
    const hg = ac.createGain(); hg.gain.value = .016;
    const wg = ac.createGain(); wg.gain.value = .04;
    rainGain = ac.createGain(); rainGain.gain.value = 0;
    src.connect(hiss).connect(hg).connect(rainGain);
    src.connect(wash).connect(wg).connect(rainGain);
    // indoors the rain is heard through walls and glass: low-passed, quieter, with a low roof drum
    roomF = ac.createBiquadFilter(); roomF.type = 'lowpass'; roomF.Q.value = .4; roomF.frequency.value = 20000;
    roomG = ac.createGain(); roomG.gain.value = 1;
    rainGain.connect(roomF).connect(roomG).connect(master);
    const rs = ac.createBufferSource(); rs.buffer = src.buffer; rs.loop = true; rs.playbackRate.value = .5;
    const rf = ac.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 160;
    roof = ac.createGain(); roof.gain.value = 0;
    rs.connect(rf).connect(roof).connect(master); rs.start();
    applyRoom(0);
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = .05; lg.gain.value = .008;
    lfo.connect(lg).connect(hg.gain);
    src.start(); lfo.start();
    rainGain.gain.setTargetAtTime(1, ac.currentTime, 1.5);
    patter();
  }

  // single drops landing near the listener, now and then
  function patter() {
    if (!ac) return;
    setTimeout(patter, 500 + Math.random() * 1400);
    if (muted || document.hidden) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(900 + Math.random() * 900, t);
    o.frequency.exponentialRampToValueAtTime(600, t + .04);
    g.gain.setValueAtTime(.003 + Math.random() * .004, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05);
    o.connect(g).connect(roomF || master); o.start(t); o.stop(t + .06);
    // on the window, now and then, a heavier drop
    if (indoor && Math.random() < .15) {
      const o2 = ac.createOscillator(), g2 = ac.createGain();
      o2.frequency.setValueAtTime(420 + Math.random() * 200, t); o2.frequency.exponentialRampToValueAtTime(180, t + .06);
      g2.gain.setValueAtTime(.008, t); g2.gain.exponentialRampToValueAtTime(.0001, t + .09);
      o2.connect(g2).connect(master); o2.start(t); o2.stop(t + .1);
    }
  }
  function applyRoom(dur) {
    if (!roomF) return;
    const t = ac.currentTime, k = Math.max(.01, dur / 3);
    roomF.frequency.setTargetAtTime(indoor ? 650 : 20000, t, k);
    roomG.gain.setTargetAtTime(indoor ? .55 : 1, t, k);
    roof.gain.setTargetAtTime(indoor ? .22 : 0, t, k);
  }

  function tone(freq, at, dur, vol, type = 'sine') {
    const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + .02);
  }

  // a square-wave blip with a pitch slide: the voice of 8-bit menus
  function blip(f0, f1, at, dur, vol, type = 'square') {
    const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    lp.type = 'lowpass'; lp.frequency.value = 4200;
    g.gain.setValueAtTime(vol, t); g.gain.setValueAtTime(vol, t + dur * .7); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(lp).connect(g).connect(master); o.start(t); o.stop(t + dur + .01);
  }
  // the dry tick of an old mouse button: a hair of noise, high-passed, and a soft body under it
  let tickBuf = null;
  function tick(at = 0, vol = .22) {
    if (!tickBuf) { tickBuf = ac.createBuffer(1, ac.sampleRate * .02, ac.sampleRate); const d = tickBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * .12)); }
    const t = ac.currentTime + at, n = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain();
    n.buffer = tickBuf; hp.type = 'highpass'; hp.frequency.value = 2200; g.gain.value = vol;
    n.connect(hp).connect(g).connect(master); n.start(t);
    blip(420, 260, at, .025, .025, 'triangle');
  }

  return {
    // browsers only allow sound after the visitor touches the page
    unlock() { start(); if (ac && ac.state === 'suspended') ac.resume(); if (ac && pendingAmb) { const p = pendingAmb; pendingAmb = null; this.ambient(p); } },
    get muted() { return muted; },
    setIndoor(v) { indoor = v; applyRoom(.8); },
    setMuted(m) {
      muted = m;
      try { localStorage.setItem('muted', m ? '1' : '0'); } catch (e) {}
      if (master) master.gain.setTargetAtTime(m ? 0 : 1, ac.currentTime, .08);
    },
    bell() { if (!ac) return; tone(1319, 0, 1.4, .07); tone(1760, .13, 1.6, .06); tone(2637, .13, .6, .015); },
    // counting a dhikr or a bead: the 8-bit menu step
    tap() { if (!ac) return; blip(660, 660, 0, .035, .035); blip(990, 990, .04, .05, .03); },
    // a window opening: three soft dialogue beeps, the way a speech box talks
    pop() { if (!ac) return; [0, .07, .14].forEach((at, i) => blip(820 + (i % 2) * 120, 800 + (i % 2) * 120, at, .045, .03)); },
    // steam from the espresso wand: a breath of filtered noise
    hiss(dur = 1.6) {
      if (!ac) return;
      const t = ac.currentTime, n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      n.buffer = noiseBuffer(dur + .2); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = .8;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .15); g.gain.setValueAtTime(.05, t + dur * .7); g.gain.linearRampToValueAtTime(0, t + dur);
      n.connect(f).connect(g).connect(master); n.start(t); n.stop(t + dur + .1);
    },
    // a log settling in the fire
    crackle() { if (!ac) return; for (let i = 0; i < 6; i++) tick(Math.random() * .6, .08 + Math.random() * .1); },
    // a coin into the jar
    coin() { if (!ac) return; blip(1900, 1900, 0, .06, .03, 'triangle'); blip(2600, 2600, .06, .12, .025, 'triangle'); },
    // a page turning: a short sweep of soft noise
    page() {
      if (!ac) return;
      const t = ac.currentTime, n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      n.buffer = noiseBuffer(.4); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(700, t + .28);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.045, t + .04); g.gain.exponentialRampToValueAtTime(.001, t + .3);
      n.connect(f).connect(g).connect(master); n.start(t); n.stop(t + .35);
    },
    // a room's own quiet sound: in the café a far murmur of talk and now and then a cup on a saucer
    ambient(kind) {
      if (!ac) { pendingAmb = kind; return; }
      if (amb) { const a = amb; a.g.gain.setTargetAtTime(0, ac.currentTime, .4); setTimeout(() => { try { a.n.stop(); } catch (e) {} clearInterval(a.clink); }, 1500); amb = null; }
      if (kind !== 'cafe') return;
      const n = ac.createBufferSource(), f = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      n.buffer = noiseBuffer(4); n.loop = true;
      f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 1.6; f2.type = 'lowpass'; f2.frequency.value = 900;
      g.gain.value = 0; g.gain.setTargetAtTime(.022, ac.currentTime, 1.2);
      lfo.frequency.value = .9; lg.gain.value = .008; lfo.connect(lg).connect(g.gain);
      n.connect(f).connect(f2).connect(g).connect(master); n.start(); lfo.start();
      const clink = setInterval(() => { if (Math.random() < .5) { tone(2300 + Math.random() * 500, 0, .25, .006); } }, 3200);
      amb = { n, g, clink };
    },
    // a distant roll of thunder
    thunder() { if (!ac) return; const t = ac.currentTime, n = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); n.buffer = noiseBuffer(3); f.type = 'lowpass'; f.frequency.value = 140; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.14, t + .35); g.gain.exponentialRampToValueAtTime(.001, t + 2.8); n.connect(f).connect(g).connect(master); n.start(t); n.stop(t + 3); },
    // a drop landing in a puddle
    plip() { if (!ac) return; blip(1400, 500, 0, .07, .03, 'sine'); },
    // one letter of a speech box appearing
    beep() { if (!ac) return; blip(900 + Math.random() * 80, 880, 0, .022, .014); },
    // any button: the retro UI click
    click() { if (!ac) return; tick(0, .18); blip(1500, 900, .005, .03, .02); },
    // a door: the old mouse click and a low step down
    shut() { if (!ac) return; tick(0, .26); blip(330, 180, .03, .09, .035); }
  };
})();
