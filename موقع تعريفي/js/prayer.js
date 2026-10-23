// prayer times, Hijri date and Qibla, computed on the device from the visitor's location.
// The astronomy and the method table come from the owner's other site «مَحطّة».
window.Prayer = (() => {
  'use strict';
  const NAMES = {
    fajr: ['الفجر', 'Fajr'], sunrise: ['الشروق', 'Sunrise'], dhuhr: ['الظهر', 'Dhuhr'],
    asr: ['العصر', 'Asr'], maghrib: ['المغرب', 'Maghrib'], isha: ['العشاء', 'Isha']
  };
  const ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  // [name, fajr angle, isha angle or minutes after maghrib as a string]
  const METH = {
    MWL: [['رابطة العالم الإسلامي', 'Muslim World League'], 18, 17],
    Makkah: [['أم القرى، مكة المكرمة', 'Umm al-Qura, Makkah'], 18.5, '90'],
    Egypt: [['الهيئة المصرية العامة للمساحة', 'Egyptian General Authority'], 19.5, 17.5],
    Karachi: [['جامعة العلوم الإسلامية، كراتشي', 'University of Islamic Sciences, Karachi'], 18, 18],
    Gulf: [['الكويت', 'Kuwait'], 18, 17.5], Qatar: [['قطر', 'Qatar'], 18, '90'], Dubai: [['الإمارات', 'UAE'], 18.2, 18.2],
    Turkey: [['رئاسة الشؤون الدينية، تركيا', 'Diyanet, Turkey'], 18, 17],
    Morocco: [['المغرب', 'Morocco'], 19, 17], Algeria: [['الجزائر', 'Algeria'], 18, 17], Tunisia: [['تونس', 'Tunisia'], 18, 18],
    SEA: [['جنوب شرق آسيا (جاكيم)', 'JAKIM, Southeast Asia'], 20, 18], ISNA: [['أمريكا الشمالية (ISNA)', 'ISNA, North America'], 15, 15]
  };
  const BY_COUNTRY = { SA: 'Makkah', YE: 'Makkah', AE: 'Dubai', KW: 'Gulf', QA: 'Qatar', BH: 'Gulf', OM: 'Gulf', EG: 'Egypt', SD: 'Egypt', LY: 'Egypt',
    SY: 'Egypt', LB: 'Egypt', JO: 'Egypt', PS: 'Egypt', TR: 'Turkey', PK: 'Karachi', IN: 'Karachi', BD: 'Karachi', AF: 'Karachi',
    US: 'ISNA', CA: 'ISNA', MA: 'Morocco', DZ: 'Algeria', TN: 'Tunisia', MY: 'SEA', SG: 'SEA', ID: 'SEA', BN: 'SEA' };
  const HANAFI = ['TR', 'PK', 'IN', 'BD', 'AF'];
  const TZ_COUNTRY = { 'Asia/Baghdad': 'IQ', 'Asia/Riyadh': 'SA', 'Asia/Kuwait': 'KW', 'Asia/Qatar': 'QA', 'Asia/Bahrain': 'BH', 'Asia/Dubai': 'AE',
    'Asia/Muscat': 'OM', 'Africa/Cairo': 'EG', 'Asia/Amman': 'JO', 'Asia/Beirut': 'LB', 'Asia/Damascus': 'SY', 'Europe/Istanbul': 'TR',
    'Asia/Karachi': 'PK', 'Africa/Casablanca': 'MA', 'Africa/Algiers': 'DZ', 'Africa/Tunis': 'TN', 'Asia/Aden': 'YE', 'Asia/Gaza': 'PS',
    'Asia/Hebron': 'PS', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Jakarta': 'ID', 'Africa/Khartoum': 'SD', 'Africa/Tripoli': 'LY' };

  const R = Math.PI / 180, sn = d => Math.sin(d * R), cs = d => Math.cos(d * R), tn = d => Math.tan(d * R);
  const asn = x => Math.asin(x) / R, acs = x => Math.acos(x) / R, at2 = (y, x) => Math.atan2(y, x) / R;
  const fx = (a, b) => { a -= b * Math.floor(a / b); return a < 0 ? a + b : a; };
  const julian = (y, m, d) => { if (m <= 2) { y--; m += 12; } const A = Math.floor(y / 100); return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + 2 - A + Math.floor(A / 4) - 1524.5; };
  const sunPos = jd => {
    const D = jd - 2451545, g = fx(357.529 + .98560028 * D, 360), q = fx(280.459 + .98564736 * D, 360);
    const L = fx(q + 1.915 * sn(g) + .02 * sn(2 * g), 360), e = 23.439 - .00000036 * D;
    return { d: asn(sn(e) * sn(L)), q: q / 15 - fx(at2(cs(e) * sn(L), cs(L)) / 15, 24) };
  };
  // hours (local to the location's time zone) for each event on a given day
  function calc(y, m, d, lat, lng, tz, M, af) {
    const jd = julian(y, m, d) - lng / 360, noon = t => fx(12 - sunPos(jd + t).q, 24);
    const at = (a, t, ccw) => { const dc = sunPos(jd + t).d, v = acs((-sn(a) - sn(dc) * sn(lat)) / (cs(dc) * cs(lat))) / 15; return noon(t) + (ccw ? -v : v); };
    const asr = (f, t) => { const dc = sunPos(jd + t).d; return at(-Math.atan(1 / (f + tn(Math.abs(lat - dc)))) / R, t); };
    let T = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, maghrib: 18, isha: 18 };
    for (let it = 0; it < 2; it++) {
      const p = {}; for (const k in T) p[k] = T[k] / 24;
      T = { fajr: at(M[1], p.fajr, 1), sunrise: at(.833, p.sunrise, 1), dhuhr: noon(p.dhuhr), asr: asr(af, p.asr), sunset: at(.833, p.sunset),
        maghrib: at(.833, p.maghrib), isha: typeof M[2] === 'number' ? at(M[2], p.isha) : 18 };
    }
    for (const k in T) T[k] += tz - lng / 15;
    if (typeof M[2] !== 'number') T.isha = T.maghrib + (+M[2]) / 60;
    // high latitudes: never let night prayers drift past the angle-based share of the night
    const night = fx(T.sunrise - T.sunset, 24);
    const adj = (t, b, a, ccw) => { const pr = a / 60 * night, df = ccw ? fx(b - t, 24) : fx(t - b, 24); return isNaN(t) || df > pr ? b + (ccw ? -pr : pr) : t; };
    T.fajr = adj(T.fajr, T.sunrise, M[1], 1);
    if (typeof M[2] === 'number') T.isha = adj(T.isha, T.sunset, M[2]);
    T.dhuhr += 1 / 60;                                   // a minute past the zenith, as the timetables do
    return T;
  }
  const DTZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  function parts(tz, date) {
    let f;
    try { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }); }
    catch (e) { return parts(DTZ, date); }
    const o = {}; for (const x of f.formatToParts(date)) o[x.type] = +x.value; if (o.hour === 24) o.hour = 0; return o;
  }
  const tzOff = (tz, y, m, d) => { const u = Date.UTC(y, m - 1, d, 12), o = parts(tz, new Date(u)); return (Date.UTC(o.year, o.month - 1, o.day, o.hour, o.minute, o.second) - u) / 36e5; };

  const KAABA = [21.4225, 39.8262];
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  let loc = store.get('prayerLoc');           // { lat, lng, name, tz, cc }
  let opts = store.get('prayerOpts') || {};   // { method, asr, adhan }

  const method = () => (opts.method && METH[opts.method]) ? opts.method : BY_COUNTRY[loc && loc.cc] || 'MWL';
  const asrFactor = () => opts.asr || (HANAFI.includes(loc && loc.cc) ? 2 : 1);

  // Date objects for each event of the location's calendar day containing `when`, offset by `dayShift`
  function day(when = new Date(), dayShift = 0) {
    if (!loc) return null;
    const p = parts(loc.tz, when), base = new Date(Date.UTC(p.year, p.month - 1, p.day + dayShift));
    const y = base.getUTCFullYear(), m = base.getUTCMonth() + 1, d = base.getUTCDate();
    const off = tzOff(loc.tz, y, m, d), T = calc(y, m, d, loc.lat, loc.lng, off, METH[method()], asrFactor());
    const out = {};
    for (const k of ORDER) out[k] = new Date(Date.UTC(y, m - 1, d) + (T[k] - off) * 36e5);
    return out;
  }
  function next(now = new Date()) {
    if (!loc) return null;
    for (const shift of [0, 1]) {
      const T = day(now, shift);
      for (const k of PRAYERS) if (T[k] > now) return { key: k, at: T[k] };
    }
    return null;
  }
  // the prayer whose time has come and is still running (for after-prayer adhkar)
  function current(now = new Date()) {
    if (!loc) return null;
    const T = day(now), Y = day(now, -1);
    let cur = { key: 'isha', at: Y.isha };
    for (const k of PRAYERS) if (T[k] <= now) cur = { key: k, at: T[k] };
    if (cur.key === 'fajr' && T.sunrise <= now) return null;
    return cur;
  }

  const fmtTime = (date, lang) => {
    try { return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-arab' : 'en', { hour: 'numeric', minute: '2-digit', timeZone: loc ? loc.tz : DTZ }).format(date); }
    catch (e) { return date.toLocaleTimeString(); }
  };
  const hijri = (lang, date = new Date()) => {
    try { return new Intl.DateTimeFormat((lang === 'ar' ? 'ar' : 'en') + '-u-ca-islamic-umalqura' + (lang === 'ar' ? '-nu-arab' : ''), { day: 'numeric', month: 'long', year: 'numeric', timeZone: loc ? loc.tz : DTZ }).format(date); }
    catch (e) { return ''; }
  };
  const qibla = () => loc ? fx(at2(sn(KAABA[1] - loc.lng), cs(loc.lat) * tn(KAABA[0]) - sn(loc.lat) * cs(KAABA[1] - loc.lng)), 360) : null;
  const distance = () => {
    if (!loc) return null;
    const h = Math.sin((KAABA[0] - loc.lat) * R / 2) ** 2 + cs(loc.lat) * cs(KAABA[0]) * Math.sin((KAABA[1] - loc.lng) * R / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(h));
  };

  function setLoc(l) { loc = l; store.set('prayerLoc', l); }
  function locate(nameAr, nameEn) {
    return new Promise((ok, no) => {
      if (!navigator.geolocation) return no('unsupported');
      navigator.geolocation.getCurrentPosition(p => {
        setLoc({ lat: p.coords.latitude, lng: p.coords.longitude, name: [nameAr, nameEn], tz: DTZ, cc: TZ_COUNTRY[DTZ] || '' });
        ok(loc);
      }, e => no(e.code === 1 ? 'denied' : 'failed'), { enableHighAccuracy: false, timeout: 15000, maximumAge: 6e5 });
    });
  }
  // city search: Open-Meteo's free geocoder, which also returns the time zone
  function search(q, lang) {
    return fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&language=' + (lang === 'ar' ? 'ar' : 'en') + '&name=' + encodeURIComponent(q))
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => (d.results || []).map(r => ({ lat: r.latitude, lng: r.longitude, tz: r.timezone || DTZ, cc: r.country_code || '',
        name: [r.name + (r.country ? '، ' + r.country : ''), r.name + (r.country ? ', ' + r.country : '')] })));
  }

  return {
    NAMES, ORDER, PRAYERS, METH,
    get loc() { return loc; }, setLoc, locate, search,
    get opts() { return opts; }, setOpt(k, v) { opts[k] = v; store.set('prayerOpts', opts); },
    method, day, next, current, fmtTime, hijri, qibla, distance
  };
})();
