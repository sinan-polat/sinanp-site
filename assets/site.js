/* sinanp.dk – lidt interaktivitet, ingen frameworks */
(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Indsæt formularens adresse fra Formspree her (fx 'https://formspree.io/f/abcdwxyz').
     Står den tom, åbner formularen i stedet brugerens mailprogram med beskeden udfyldt. */
  const FORM_ENDPOINT = '';
  const MAIL = 'sinanp2020@hotmail.com';

  // header-kant ved scroll
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // mobilmenu med mørk baggrund
  const btn = $('.menu-btn'), nav = $('.nav');
  if (btn && nav) {
    const scrim = document.createElement('div'); scrim.className = 'menu-scrim'; document.body.appendChild(scrim);
    const set = open => { nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', open); root.classList.toggle('menu-open', open); };
    btn.addEventListener('click', () => set(!nav.classList.contains('open')));
    scrim.addEventListener('click', () => set(false));
    addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); btn.focus(); } });
    $$('a', nav).forEach(a => a.addEventListener('click', () => set(false)));
  }

  // elementer glider ind
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('seen'));

  // videoer: spil kun, når de er i billedet (og ikke ved "reducer bevægelse")
  const vids = $$('video[data-autoplay]');
  if (reduce) vids.forEach(v => { v.removeAttribute('autoplay'); v.controls = true; });
  else if (vids.length) {
    const vio = new IntersectionObserver(es => es.forEach(e => { e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause(); }), { threshold: .35 });
    vids.forEach(v => vio.observe(v));
  }

  // kontaktformular
  const form = $('#contactForm');
  if (form) {
    const pre = new URLSearchParams(location.search).get('ydelse');
    if (pre) { const c = $(`input[name="ydelse"][value="${CSS.escape(pre)}"]`, form); if (c) c.checked = true; }
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const need = ['navn', 'email', 'besked'];
      let first = null;
      need.forEach(n => {
        const el = form.elements[n], wrap = el.closest('.field');
        const bad = !el.value.trim() || (n === 'email' && !/^\S+@\S+\.\S+$/.test(el.value));
        wrap.classList.toggle('err', bad);
        if (bad && !first) first = el;
      });
      if (first) { first.focus(); return; }
      const data = new FormData(form);
      const ydelser = data.getAll('ydelse').join(', ') || 'Ikke valgt';
      if (FORM_ENDPOINT) {
        try {
          const r = await fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
          if (!r.ok) throw new Error();
          form.hidden = true; $('#formOk').classList.add('show'); $('#formOk').focus(); return;
        } catch (err) { /* falder tilbage til mail */ }
      }
      const body = `Navn: ${data.get('navn')}\nE-mail: ${data.get('email')}\nTelefon: ${data.get('telefon') || '-'}\nVirksomhed: ${data.get('virksomhed') || '-'}\nYdelser: ${ydelser}\n\n${data.get('besked')}`;
      location.href = `mailto:${MAIL}?subject=${encodeURIComponent('Henvendelse fra sinanp.dk: ' + ydelser)}&body=${encodeURIComponent(body)}`;
    });
    $$('input, textarea', form).forEach(el => el.addEventListener('input', () => el.closest('.field') && el.closest('.field').classList.remove('err')));
  }

  // årstal i footer
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
