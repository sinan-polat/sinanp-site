/* =========================================================
   Prikken – logoets punktum som lille figur
   1. Logo-prikken vågner ved hover/fokus, følger markøren og hopper ved klik
   2. Menu-prikken hopper hen til den sektion, man er i, og bliver til markeringen
   3. 404-siden: prikken leder efter siden og bliver selv til nullet
   4. Kolofonen: en prompt til Claude, og punktummet i svaret vågner
   Kræver dot.css. Respekterer "reducer bevægelse".
   ========================================================= */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const EYES = '<i class="eye"><b></b></i><i class="eye"><b></b></i>';
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const later = (ms, fn) => setTimeout(fn, ms);
  const cssVar = v => getComputedStyle(root).getPropertyValue(v).trim();
  const lookAt = (el, x, y) => { el.style.setProperty('--lx', x.toFixed(3)); el.style.setProperty('--ly', y.toFixed(3)); };
  const blink = el => { el.classList.add('blink'); later(130, () => el.classList.remove('blink')); };

  // et lille hop med squash & stretch (bruges af logo-prikken)
  function hop(el, big = 1) {
    if (reduce || !el.animate) return;
    const cs = getComputedStyle(el), s = parseFloat(cs.getPropertyValue('--s')) || 1, up = 14 * big;
    const tx = `translateX(${cs.getPropertyValue('--tx').trim() || '0px'})`;
    el.animate([
      { transform: `${tx} translateY(0) scale(${s})` },
      { transform: `${tx} translateY(0) scale(${s * 1.28},${s * .72})`, offset: .14 },
      { transform: `${tx} translateY(${-up}px) scale(${s * .84},${s * 1.2})`, offset: .42 },
      { transform: `${tx} translateY(0) scale(${s * 1.3},${s * .7})`, offset: .7 },
      { transform: `${tx} translateY(0) scale(${s * .92},${s * 1.08})`, offset: .86 },
      { transform: `${tx} translateY(0) scale(${s})` }
    ], { duration: 640, easing: 'ease-out' });
  }

  /* ---------- 1. Logo-prikken ---------- */
  const brand = $('.brand'), dot = brand && $('.dot', brand);
  const awake = () => dot.classList.contains('awake') || brand.matches(':hover') || brand.matches(':focus-visible');
  if (dot) {
    dot.innerHTML = EYES;
    // øjnene følger markøren, mens prikken er vågen
    let px = 0, py = 0, raf = 0;
    const follow = () => {
      raf = 0;
      const r = dot.getBoundingClientRect(), dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1, k = clamp(d / 140);
      lookAt(dot, dx / d * k, dy / d * k);
    };
    if (fine && !reduce) addEventListener('pointermove', e => {
      px = e.clientX; py = e.clientY;
      if (!raf && !dot.dataset.peek && awake()) raf = requestAnimationFrame(follow);
    }, { passive: true });
    if (!reduce) setInterval(() => { if (awake()) blink(dot); }, 2800);
    // hopper, når man klikker på logoet (til toppen)
    brand.addEventListener('click', () => hop(dot));
    // kigger sig omkring én gang pr. besøg
    let seen = false;
    try { seen = sessionStorage.getItem('prik-kig') === '1'; sessionStorage.setItem('prik-kig', '1'); } catch (e) {}
    if (!seen && !reduce) later(1400, () => {
      dot.dataset.peek = '1'; lookAt(dot, 0, 0); dot.classList.add('awake');
      later(450, () => lookAt(dot, -1, .15));
      later(1100, () => lookAt(dot, 1, .1));
      later(1600, () => blink(dot));
      later(1900, () => lookAt(dot, 0, .3));
      later(2500, () => { dot.classList.remove('awake'); delete dot.dataset.peek; });
    });
  }

  /* ---------- 2. Menu-prikken ---------- */
  const header = $('.site-header'), nav = $('#nav'), links = nav ? $$('a', nav) : [];
  const wideMQ = matchMedia('(min-width: 761px)');
  if (header && nav && links.length && dot && !reduce) {
    const nd = document.createElement('span');
    nd.className = 'nav-dot'; nd.setAttribute('aria-hidden', 'true'); nd.innerHTML = EYES;
    header.appendChild(nd);
    const S = 20;          // størrelse som prik
    let st = null;         // nuværende form: x, y (i headeren), w, h, c (0 = orange prik, 1 = mørk pille), e (øjne), o (synlig)
    let goal = null;       // link, prikken er på vej til (null = hjem i logoet)
    let job = 0;           // id på den animation, der kører

    const hRect = () => header.getBoundingClientRect();
    const linkBox = a => { const h = hRect(), r = a.getBoundingClientRect(); return { x: r.left - h.left, y: r.top - h.top, w: r.width, h: r.height }; };
    const homeBox = () => {
      const h = hRect(), r = dot.getBoundingClientRect(), cx = r.left + r.width / 2 - h.left, cy = r.top + r.height / 2 - h.top;
      return { x: cx - 4, y: cy - 4, w: 8, h: 8 };
    };
    const paint = (s, sx = 1, sy = 1) => {
      st = s;
      nd.style.width = s.w + 'px'; nd.style.height = s.h + 'px';
      nd.style.transform = `translate(${s.x}px,${s.y}px) scale(${sx},${sy})`;
      nd.style.setProperty('--c', s.c.toFixed(3)); nd.style.setProperty('--e', s.e.toFixed(3));
      nd.style.opacity = s.o;
    };
    const markLit = a => links.forEach(l => l.classList.toggle('lit', l === a));

    function travel(to) {
      const id = ++job;
      const was = links.find(l => l.classList.contains('lit'));
      const spawn = !(st && st.o > 0);
      const from = spawn ? { ...homeBox(), c: 0, e: 0, o: 1 } : { ...st };
      if (spawn) hop(dot, .45);   // logo-prikken sender en prik afsted
      const end = to ? linkBox(to) : homeBox();
      const fc = { x: from.x + from.w / 2, y: from.y + from.h / 2 }, ec = { x: end.x + end.w / 2, y: end.y + end.h / 2 };
      const dist = Math.hypot(ec.x - fc.x, ec.y - fc.y);
      const tShrink = from.w > from.h + 2 ? 150 : 0;
      const tHop = 260 + Math.min(260, dist * .45);
      const tGrow = to ? 170 : 0;
      const s0 = tShrink ? S : from.w, s1 = to ? S : 8;
      const peak = Math.max(4, Math.min(16 + dist * .03, Math.min(fc.y, ec.y) - S / 2 - 3));
      lookAt(nd, Math.sign(ec.x - fc.x) || 0, -.25);
      const t0 = performance.now();
      const step = now => {
        if (id !== job) return;
        const t = now - t0;
        if (was && t >= tShrink * .5) markLit(null);         // teksten skifter farve, når pillen er halvt væk
        if (t < tShrink) {                                   // pille -> prik
          const u = easeInOut(t / tShrink), w = lerp(from.w, S, u), h = lerp(from.h, S, u);
          paint({ x: fc.x - w / 2, y: fc.y - h / 2, w, h, c: lerp(from.c, 0, u), e: u, o: 1 });
        } else if (t < tShrink + tHop) {                     // hop
          const u = (t - tShrink) / tHop, v = easeInOut(u), size = lerp(s0, s1, v);
          const cx = lerp(fc.x, ec.x, v), cy = lerp(fc.y, ec.y, v) - 4 * peak * u * (1 - u);
          const k = Math.abs(1 - 2 * u) < .85 ? .18 * (1 - Math.abs(1 - 2 * u)) : 0;
          const c = tShrink ? 0 : lerp(from.c, 0, clamp(u * 3)), e = to ? Math.max(tShrink ? 1 : from.e, clamp(u * 4)) : 1 - clamp((u - .7) / .3);
          paint({ x: cx - size / 2, y: cy - size / 2, w: size, h: size, c, e, o: 1 }, 1 - k / 2, 1 + k);
        } else if (t < tShrink + tHop + tGrow) {             // prik -> pille
          const u = easeOut((t - tShrink - tHop) / tGrow), w = lerp(S, end.w, u), h = lerp(S, end.h, u), q = (1 - u) * .22;
          paint({ x: ec.x - w / 2, y: ec.y - h / 2, w, h, c: u, e: 1 - u, o: 1 }, 1 + q, 1 - q);
        } else {
          if (to) { paint({ ...end, c: 1, e: 0, o: 1 }); markLit(to); }
          else { paint({ ...end, c: 0, e: 0, o: 0 }); hop(dot, .35); }
          return;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    const snap = () => {
      job++;
      const a = links.find(l => l.classList.contains('active')) || null;
      goal = a;
      if (a) { paint({ ...linkBox(a), c: 1, e: 0, o: 1 }); markLit(a); }
      else { paint({ ...homeBox(), c: 0, e: 0, o: 0 }); markLit(null); }
    };
    let timer = 0;
    const check = () => {
      if (!header.classList.contains('has-navdot')) return;
      const a = links.find(l => l.classList.contains('active')) || null;
      if (a === goal) return;
      goal = a; travel(a);
    };
    new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(check, 90); })
      .observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
    const setMode = () => {
      const on = wideMQ.matches;
      header.classList.toggle('has-navdot', on);
      if (on) snap(); else { job++; nd.style.opacity = 0; markLit(null); }
    };
    wideMQ.addEventListener('change', setMode);
    addEventListener('resize', () => { if (header.classList.contains('has-navdot')) snap(); });
    setMode();
    if (document.fonts) document.fonts.ready.then(() => { if (header.classList.contains('has-navdot')) snap(); });
  }

  /* ---------- 4. Kolofon: prompten, og punktummet der vågner ---------- */
  const chat = $('.colo-chat');
  if (chat) {
    const [me, ai] = $$('.cmsg', chat);
    const lines = $$('.cprompt p > span', me).map(el => ({ el, text: el.textContent }));
    const labels = $$('.cprompt p > b', me);
    const txt = $('.ctext', ai), cdot = $('.cdot', ai), aiWords = txt.textContent.split(' ');
    cdot.innerHTML = EYES;
    let timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    function play() {
      timers.forEach(clearTimeout); timers = [];
      chat.classList.add('armed');
      [me, ai].forEach(m => m.classList.remove('show'));
      cdot.classList.remove('awake', 'pop'); lookAt(cdot, 0, 0);
      lines.forEach(l => { l.el.textContent = ''; }); labels.forEach(b => b.classList.remove('on'));
      txt.textContent = '';
      // prompten skrives linje for linje: rolle, mål, krav, lever
      at(150, () => me.classList.add('show'));
      let t = 300;
      lines.forEach((l, i) => {
        at(t, () => labels[i].classList.add('on'));
        [...l.text].forEach((ch, k) => at(t + 120 + k * 13, () => { l.el.textContent += ch; }));
        t += 120 + l.text.length * 13 + 220;
      });
      // Claude tænker med tre hoppende prikker og svarer ord for ord
      const t1 = t + 250;
      at(t1, () => { ai.classList.add('show'); txt.innerHTML = '<span class="ctyping"><i></i><i></i><i></i></span>'; });
      const t2 = t1 + 1300;
      at(t2, () => { txt.textContent = ''; });
      aiWords.forEach((w, i) => at(t2 + i * 70, () => { txt.textContent += (i ? ' ' : '') + w; }));
      // ... og punktummet vågner
      const t3 = t2 + aiWords.length * 70 + 150;
      at(t3, () => cdot.classList.add('pop'));
      at(t3 + 700, () => cdot.classList.add('awake'));
      at(t3 + 1050, () => lookAt(cdot, .7, -.9));            // kigger op på prompten
      at(t3 + 1700, () => lookAt(cdot, -.4, .25));           // og ud på dig
      at(t3 + 2200, () => blink(cdot));
      at(t3 + 2450, () => hop(cdot, .8));
      at(t3 + 3600, () => { lookAt(cdot, 0, 0); cdot.classList.remove('awake'); });
    }
    if (!reduce) {
      new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { play(); obs.disconnect(); } }, { threshold: .4 }).observe(chat);
      chat.addEventListener('click', play);
      const replay = $('.colo-replay');
      if (replay) replay.addEventListener('click', play);
    }
  }

  /* ---------- 3. 404: prikken bliver til nullet ---------- */
  const cv = $('.nf-stage');
  if (cv && cv.getContext) {
    const ctx = cv.getContext('2d');
    const W = 1000, BL = 330, FS = 300, R = 24, RC = 92, CX = 500, CY = 226, RING_B = CY + RC - 3;
    const HOPS = [[0.35, 0.75, [1080, BL], [800, BL], 90], [0.75, 1.30, [800, BL], [CX, RING_B], 250]];
    const look0 = [[0, [-1, 0]], [1.32, [0, .3]], [1.42, [-1, .1]], [1.6, [-1, .1]], [1.68, [1, .1]], [1.86, [1, .1]], [1.94, [0, -.9]], [2.32, [0, -.9]], [2.42, [0, 0]]];
    const kf = (t, keys) => {
      if (t <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
        const [a0, a] = keys[i - 1], [b0, b] = keys[i], s = easeInOut((t - a0) / (b0 - a0));
        return a.map((v, j) => lerp(v, b[j], s));
      }
      return keys[keys.length - 1][1];
    };
    const outBack = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
    let scale = 1, dpr = 1, start = 0, ptr = null, hoverBtn = false, boing = -9, blinkAt = 4.2;
    const END = 3.1;   // herefter står prikken som nullet og følger markøren
    const size = () => { const r = cv.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); scale = r.width / W; };
    addEventListener('resize', size);
    addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); ptr = [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale]; }, { passive: true });
    $$('.nf .actions a').forEach(a => { a.addEventListener('pointerenter', () => hoverBtn = true); a.addEventListener('pointerleave', () => hoverBtn = false); a.addEventListener('focus', () => hoverBtn = true); a.addEventListener('blur', () => hoverBtn = false); });
    cv.addEventListener('click', () => { boing = (performance.now() - start) / 1000; });

    function character(x, y, r, sx, sy, look, open, wide, col) {
      ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
      ctx.beginPath(); ctx.arc(0, -r, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      const er = .3 * r * wide, pr = .15 * r * wide, ex = .38 * r, ey = -r - .12 * r + look[1] * .04 * r;
      [-1, 1].forEach(side => {
        const cx = side * ex + look[0] * .12 * r;
        ctx.save(); ctx.beginPath(); ctx.ellipse(cx, ey, er, er * open, 0, 0, Math.PI * 2); ctx.fillStyle = '#F5F2EC'; ctx.fill(); ctx.clip();
        const px = cx + look[0] * .13 * r, py = ey + look[1] * .12 * r;
        ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fillStyle = '#15171C'; ctx.fill();
        ctx.beginPath(); ctx.arc(px - pr * .35, py - pr * .4, pr * .32, 0, Math.PI * 2); ctx.fillStyle = '#F5F2EC'; ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    }
    function mark(str, x, y, sizePx, col, a, sc) {
      if (a <= .01) return;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(.12); ctx.scale(sc, sc);
      ctx.font = `600 ${sizePx}px Fraunces, Georgia, serif`; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.fillText(str, 0, 0); ctx.restore();
    }
    function draw(t) {
      const ink = cssVar('--ink'), acc = cssVar('--accent'), line = cssVar('--line');
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
      ctx.clearRect(0, 0, W, 420);
      ctx.font = `600 ${FS}px Fraunces, Georgia, serif`; ctx.textAlign = 'center'; ctx.fillStyle = ink;
      ctx.fillText('4', CX - 215, BL); ctx.fillText('4', CX + 215, BL);
      // radius: lille prik -> pustet op til nullet
      let r = R;
      if (t >= 2.55) r = lerp(R, RC, Math.min(outBack(clamp((t - 2.55) / .5)), 1.08));
      if (t >= 3.05) { const u = t - 3.05; r = RC * (1 + .03 * Math.exp(-u * 7) * Math.sin(u * 30) + .008 * Math.sin(t * 2.2)); }
      const bu = t - boing; if (bu > 0 && bu < 1) r *= 1 + .07 * Math.exp(-bu * 6) * Math.sin(bu * 26);
      const ringA = 1 - clamp((r - 40) / 30);
      if (ringA > .01) {
        ctx.save(); ctx.globalAlpha = ringA; ctx.strokeStyle = line; ctx.lineWidth = 5; ctx.setLineDash([14, 12]); ctx.lineDashOffset = -t * 18;
        ctx.beginPath(); ctx.arc(CX, CY, RC - 2, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      // position
      let x = 1080, y = BL, air = false, vy = 0;
      const h = HOPS.find(([a, b]) => t >= a && t < b);
      if (h) { const [a, b, p, q, pk] = h, s = (t - a) / (b - a); x = lerp(p[0], q[0], s); y = lerp(p[1], q[1], s) - 4 * pk * s * (1 - s); vy = ((q[1] - p[1]) - 4 * pk * (1 - 2 * s)) / (b - a); air = true; }
      else if (t >= 1.30) { x = CX; y = RING_B; }
      // squash & stretch
      let sx = 1, sy = 1;
      if (air) { const k = .26 * clamp(Math.abs(vy) / (20 * R)); sx = 1 - k / 2; sy = 1 + k; }
      for (const [c, amp] of [[.75, .4], [1.30, .6], [2.05, .35], [2.22, .35]]) { const d = t - c; if (d > 0 && d < 1) { const q = .45 * amp * Math.exp(-d * 12) * Math.cos(d * 24); sx += q; sy -= q; } }
      for (const s0 of [1.95, 2.12]) { const u = (t - s0) / .1; if (u > 0 && u < 1) { const q = .16 * Math.sin(Math.PI * u); sx -= q / 2; sy += q; } }
      if (t > 2.42 && t < 2.55) { const q = .2 * Math.sin(Math.PI * (t - 2.42) / .13); sx += q; sy -= q; }
      // øjne
      let look = air ? (vy < 0 ? [-1, -.4] : [-1, .3]) : kf(t, look0), wide = 1, open = 1;
      if (t > 2.33 && t < 2.95) wide = 1.3;
      if (t >= END) {
        if (hoverBtn) { look = [0, 1]; wide = 1.15; }
        else if (ptr) { const dx = ptr[0] - CX, dy = ptr[1] - (RING_B - r), d = Math.hypot(dx, dy) || 1, k = clamp(d / 260); look = [dx / d * k, dy / d * k]; }
        else look = [0, .2];
        if (t > blinkAt) { if (t > blinkAt + .13) blinkAt = t + 2.4 + Math.random() * 2.4; else open = .08; }
      }
      character(x, y, r, sx, sy, look, open, wide, acc);
      const bob = Math.sin(t * 5) * 4;
      mark('?', x + 24, y - 2 * r - 22 + bob, 52, cssVar('--muted'), clamp((t - 1.42) / .12) * (1 - clamp((t - 2.25) / .1)), clamp((t - 1.42) / .2) * 1.0);
      mark('!', x + 24, y - 2 * r - 22, 58, acc, clamp((t - 2.33) / .08) * (1 - clamp((t - 2.62) / .12)), clamp((t - 2.33) / .15));
    }
    const run = now => { draw((now - start) / 1000); requestAnimationFrame(run); };
    const go = () => { size(); start = performance.now() - (reduce ? END * 1000 + 200 : 0); requestAnimationFrame(run); };
    (document.fonts ? document.fonts.load('600 300px Fraunces').catch(() => {}) : Promise.resolve()).then(go, go);
  }
})();
