/* =========================================================
   sinanp.dk – interaktivitet (samme greb som portfolien)
   ========================================================= */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  /* Formularen sendes direkte fra siden via FormSubmit (formsubmit.co) til din mail.
     Første gang sender FormSubmit en aktiveringsmail til dig: klik "Activate Form".
     Efter aktivering får du en hemmelig kode; erstat mailen herunder med den, så din mail ikke står i koden. */
  const FORM_ENDPOINT = 'https://formsubmit.co/ajax/sinanp2020@hotmail.com';
  /* Hurtigere og mere stabilt: Web3Forms. Hent en gratis nøgle på web3forms.com (skriv din mail, nøglen kommer på mail)
     og sæt den ind her. Når nøglen står her, bruges Web3Forms i stedet for FormSubmit. */
  const WEB3FORMS_KEY = '';
  const MAIL = 'sinanp2020@hotmail.com';

  /* ---------- Tema: mørkt som standard, lyst kan vælges ---------- */
  const isDark = () => root.dataset.theme !== 'light';
  const tt = $('#themeToggle');
  if (tt) tt.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('tema-sinanp', next); } catch (e) {}
    $('meta[name="theme-color"]').content = next === 'dark' ? '#101114' : '#F5F2EC';
  });

  /* ---------- Mobilmenu med mørk baggrund ---------- */
  const menuBtn = $('#menuBtn'), nav = $('#nav');
  if (menuBtn && nav) {
    const scrim = document.createElement('div'); scrim.className = 'menu-scrim'; document.body.appendChild(scrim);
    const setMenu = open => { nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); root.classList.toggle('menu-open', open); };
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    scrim.addEventListener('click', () => setMenu(false));
    addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); } });
    $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  }

  /* ---------- Interne ankre: blød scroll ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1), t = id && document.getElementById(id);
    if (!t) return;
    e.preventDefault(); t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }));

  /* ---------- Scroll: progress, header og aktiv menu ---------- */
  const bar = $('.progress'), header = $('.site-header');
  const navLinks = $$('.nav a[data-sec]');
  const pageActive = $('.nav a[data-page]');
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    header.classList.toggle('scrolled', scrollY > 10);
    if (pageActive) return; // undersider: menupunktet står fast
    let cur = '';
    navLinks.forEach(a => { const s = document.getElementById(a.dataset.sec); if (s && s.getBoundingClientRect().top < innerHeight * .4) cur = a.dataset.sec; });
    navLinks.forEach(a => a.classList.toggle('active', a.dataset.sec === cur));
  };
  if (pageActive) pageActive.classList.add('active');
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Reveal ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => {
    const sibs = $$(':scope > .reveal', el.parentElement);
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * .08}s`);
    io.observe(el);
  });

  /* ---------- Roterende ord ---------- */
  const word = $('.rotator-word');
  if (word && !reduceMotion) {
    const words = (word.dataset.words || '').split('|').filter(Boolean); let wi = 0;
    // usynlige kopier af alle ord i samme gittercelle, så bredden passer til det længste ord
    words.forEach(w => { const g = document.createElement('span'); g.className = 'rotator-word'; g.textContent = w; g.setAttribute('aria-hidden', 'true'); g.style.visibility = 'hidden'; word.parentElement.appendChild(g); });
    if (words.length) setInterval(() => {
      word.classList.add('out');
      setTimeout(() => {
        wi = (wi + 1) % words.length; word.textContent = words[wi];
        word.classList.remove('out'); word.classList.add('in');
        requestAnimationFrame(() => requestAnimationFrame(() => word.classList.remove('in')));
      }, 350);
    }, 2600);
  }

  /* ---------- Hero: prikfelt ---------- */
  const canvas = $('.hero-field'), hero = $('.hero');
  if (canvas && canvas.getContext && hero) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, dots = [], mouse = { x: -999, y: -999 }, raf = null; const t0 = performance.now(), GAP = 30;
    const col = v => getComputedStyle(root).getPropertyValue(v).trim();
    function draw(now) {
      const ink = col('--ink'), acc = col('--accent'), t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        const dx = d.x - mouse.x, dy = d.y - mouse.y, dist = Math.hypot(dx, dy), near = Math.max(0, 1 - dist / 150);
        const wave = reduceMotion ? 0 : (Math.sin(d.x * .012 + t * .8) + Math.cos(d.y * .015 + t * .6)) * .25 + .5;
        const r = 1 + near * 3.2 + wave * .5, push = near * 10;
        ctx.globalAlpha = .08 + wave * .07 + near * .6; ctx.fillStyle = near > .05 ? acc : ink;
        ctx.beginPath(); ctx.arc(d.x + (dist ? dx / dist : 0) * push, d.y + (dist ? dy / dist : 0) * push, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2); w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = []; for (let y = GAP / 2; y < h; y += GAP) for (let x = GAP / 2; x < w; x += GAP) dots.push({ x, y });
      draw(performance.now());
    };
    let visible = true;
    const loop = now => { draw(now); raf = visible && !reduceMotion ? requestAnimationFrame(loop) : null; };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && !reduceMotion) raf = requestAnimationFrame(loop); }).observe(hero);
    hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; if (reduceMotion) draw(performance.now()); });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    addEventListener('resize', resize); resize();
    if (tt) tt.addEventListener('click', () => draw(performance.now()));
  }

  /* ---------- Parallax på chips og magnetiske knapper ---------- */
  const pv = $('[data-parallax]');
  if (pv && finePointer && !reduceMotion) hero.addEventListener('pointermove', e => {
    const cx = e.clientX / innerWidth - .5, cy = e.clientY / innerHeight - .5;
    $$('.chip', pv).forEach(c => { const d = +c.dataset.depth; c.style.transform = `translate(${cx * d}px, ${cy * d}px)`; });
  });
  if (finePointer && !reduceMotion) $$('.magnetic').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });

  /* ---------- Kort: lys der følger musen ---------- */
  if (finePointer && !reduceMotion) $$('.skill, .proto-shot').forEach(c => {
    c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) / r.width * 100 + '%'); c.style.setProperty('--my', (e.clientY - r.top) / r.height * 100 + '%'); });
  });

  /* ---------- Videoer ---------- */
  const mvids = $$('.mvid');
  const setSound = (btn, on) => { btn.setAttribute('aria-pressed', on); btn.setAttribute('aria-label', on ? 'Slå lyd fra' : 'Slå lyd til'); };
  const quietOthers = keep => mvids.forEach(v => { if (v === keep) return; if (v.hasAttribute('data-autoplay')) { v.muted = true; const b = v.parentElement.querySelector('.msound'); if (b) setSound(b, false); } else if (!v.paused) v.pause(); });
  if (reduceMotion) mvids.forEach(v => { if (!v.hasAttribute('data-autoplay')) return; v.removeAttribute('data-autoplay'); v.controls = true; const b = v.parentElement.querySelector('.msound'); if (b) b.remove(); });
  const auto = mvids.filter(v => v.hasAttribute('data-autoplay'));
  if (auto.length) { const vio = new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause(); }), { threshold: .35 }); auto.forEach(v => vio.observe(v)); }
  $$('.msound').forEach(btn => btn.addEventListener('click', () => { const v = btn.parentElement.querySelector('video'), on = v.muted; if (on) { quietOthers(v); v.currentTime = 0; } v.muted = !on; setSound(btn, on); v.play().catch(() => {}); }));
  mvids.forEach(v => v.addEventListener('play', () => { if (!v.muted) quietOthers(v); }));

  /* ---------- Kopiér e-mail ---------- */
  const toast = $('.toast');
  const showToast = msg => { if (!toast) return; toast.textContent = msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove('show'), 2200); };
  const cm = $('#copyMail');
  if (cm) cm.addEventListener('click', async () => { try { await navigator.clipboard.writeText(MAIL); showToast('E-mail kopieret ✓'); } catch (e) { location.href = 'mailto:' + MAIL; } });

  /* ---------- Kontaktformular ---------- */
  const form = $('#contactForm');
  if (form) {
    const pre = new URLSearchParams(location.search).get('ydelse');
    if (pre) $$('input[name="ydelse"]', form).forEach(c => { if (c.value === pre) c.checked = true; });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      let first = null;
      ['email'].forEach(n => {
        const el = form.elements[n], bad = !el.value.trim() || (n === 'email' && !/^\S+@\S+\.\S+$/.test(el.value));
        el.closest('.field').classList.toggle('err', bad); if (bad && !first) first = el;
      });
      if (first) { first.focus(); return; }
      if (form.elements._honey && form.elements._honey.value) return; // spam-fælde
      const data = new FormData(form), yd = data.getAll('ydelse').join(', ') || 'Ikke valgt';
      const btn = $('button[type="submit"]', form), label = btn.innerHTML, fail = $('#formFail');
      btn.disabled = true; btn.innerHTML = 'Sender …'; if (fail) fail.hidden = true;
      const slow = setTimeout(() => { btn.innerHTML = 'Sender stadig … et øjeblik'; }, 4000);
      const ctrl = new AbortController(), stop = setTimeout(() => ctrl.abort(), 60000);
      const fields = { email: data.get('email'), 'Det drejer sig om': yd, Besked: data.get('besked') || '(ingen besked)', Side: location.pathname };
      const subject = 'Ny forespørgsel fra sinanp.dk: ' + yd;
      const payload = WEB3FORMS_KEY
        ? { access_key: WEB3FORMS_KEY, subject, from_name: 'sinanp.dk', replyto: data.get('email'), ...fields }
        : { _subject: subject, _template: 'table', _captcha: 'false', _replyto: data.get('email'), ...fields };
      try {
        const r = await fetch(WEB3FORMS_KEY ? 'https://api.web3forms.com/submit' : FORM_ENDPOINT, {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });
        const res = await r.json().catch(() => ({}));
        clearTimeout(slow); clearTimeout(stop);
        if (!r.ok || res.success === false || res.success === 'false') throw 0;
        form.hidden = true; const ok = $('#formOk'); ok.classList.add('show'); ok.focus();
        track('generate_lead', { side: location.pathname });
      } catch (err) {
        clearTimeout(slow); clearTimeout(stop);
        btn.disabled = false; btn.innerHTML = label;
        if (fail) { fail.hidden = false; fail.focus(); }
      }
    });
    $$('input, textarea', form).forEach(el => el.addEventListener('input', () => { const f = el.closest('.field'); if (f) f.classList.remove('err'); }));
  }

  /* ---------- Mobil-CTA: skjules øverst og ved kontaktsektionen ---------- */
  const bar2 = $('.cta-bar'), foot = $('#kontakt'), heroEl = $('.hero, .page-hero'), formEl = $('#contactForm');
  if (bar2) {
    const upd = () => {
      const pastTop = scrollY > (heroEl ? heroEl.offsetHeight * .55 : 200);
      const atEnd = (foot && foot.getBoundingClientRect().top < innerHeight * .9) || (formEl && formEl.getBoundingClientRect().top < innerHeight * .9 && formEl.getBoundingClientRect().bottom > 0);
      bar2.classList.toggle('hide', !pastTop || atEnd);
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* ---------- Måling til Google Ads / Analytics ----------
     Når du har sat Google-tagget (gtag.js) ind i <head>, bliver opkald, mails og formularer
     sendt som hændelser, så du kan måle konverteringer. Uden tag sker der ingenting. */
  const track = (name, params) => { try { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); } catch (e) {} };
  $$('a[href^="tel:"]').forEach(a => a.addEventListener('click', () => track('klik_telefon')));
  $$('a[href^="mailto:"], #copyMail').forEach(a => a.addEventListener('click', () => track('klik_mail')));

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
