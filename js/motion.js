// ---------- Motion (experiment branch): Wrapped-style reveals, count-ups, depth ----------
// Sugar on top of the static site: with JS off or "reduce motion" on, the page is
// exactly the normal version. Everything here only adds classes / CSS variables.
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  const root = document.documentElement;
  root.classList.add('motion');

  // ---- 1. reveal: blocks rise in, one after another inside the same parent ----
  const REVEAL = [
    '.hero__text > *', '.hero .arch',
    '.cs-hero__text > *', '.cs-hero .arch', '.cs-hero__visual', '.cs-poster', '.b35-hero__text > *', '.collage',
    '.section-title', '.card', '.numbers .stat', '.posters__head > *', '.poster',
    '.cs-section > h2', '.cs-section__body > *', '.part__text > *', '.part__logo', '.part__poster',
    '.did li', '.facts li', '.ground li', '.series li', '.views__bars li', '.values article', '.day li',
    '.fix dl > div', '.target__key li', '.flow-steps li', '.role-strip li', '.top-post__row li',
    '.roll__head > *', '.filmstrip-wrap', '.golden > *', '.night__head > *', '.night__grid li',
    '.chant', '.school', '.certs li', '.certs > .label', '.about__text > *', '.contact > *',
    '.exhibit__head > *', '.next',
  ].join(',');

  const els = [...document.querySelectorAll(REVEAL)].filter((el) => !el.closest('dialog'));
  const order = new Map();
  els.forEach((el) => {
    const n = order.get(el.parentElement) || 0;
    order.set(el.parentElement, n + 1);
    el.style.setProperty('--rv-i', Math.min(n, 6));
    el.classList.add('rv');
  });

  const done = (el) => {
    // hand the element back to its normal styles (hover effects, own transitions)
    el.classList.remove('rv', 'rv-in');
    el.style.removeProperty('--rv-i');
  };
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('rv-in');
      revealIO.unobserve(el);
      countUpIn(el);
      setTimeout(() => done(el), 1000);
    });
  }, { threshold: 0, rootMargin: '0px 0px 25% 0px' });   // start before the slide lands
  els.forEach((el) => revealIO.observe(el));

  // ---- 2. count-up: numbers roll up from 0 to their real value, then snap back to the exact text ----
  const NUM = '.stat b, .facts strong, .top-post__big b, .top-post__row b, .series__num b, .meter figcaption strong, .card__big b, .views__track b, [data-count]';
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function countUp(el) {
    if (el.dataset.counted) return;
    const final = el.textContent;
    const m = final.match(/^(\D*?)(\d[\d,]*\.?\d*)(.*)$/);
    if (!m) return;
    el.dataset.counted = '1';
    const [, pre, num, post] = m;
    const target = parseFloat(num.replace(/,/g, ''));
    const decimals = (num.split('.')[1] || '').length;
    const commas = num.includes(',');
    const fmt = (v) => {
      const s = v.toFixed(decimals);
      return commas ? Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : s;
    };
    const t0 = performance.now(), dur = 1300;
    el.style.fontVariantNumeric = 'tabular-nums';
    (function tick(now) {
      const t = Math.min(1, (now - t0) / dur);
      el.textContent = pre + fmt(target * ease(t)) + post;
      if (t < 1) requestAnimationFrame(tick);
      else { el.textContent = final; el.style.fontVariantNumeric = ''; }
    })(t0);
  }
  function countUpIn(scope) {
    if (scope.matches(NUM)) countUp(scope);
    scope.querySelectorAll(NUM).forEach(countUp);
  }
  // numbers that are not inside a revealed block still count when they come on screen
  const numIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { countUp(e.target); numIO.unobserve(e.target); } });
  }, { threshold: .6 });
  document.querySelectorAll(NUM).forEach((el) => numIO.observe(el));

  // ---- 3. depth: [data-parallax] blocks get --p (-1 → 1) as they travel through the screen ----
  document.querySelectorAll('.hero, .cs-hero, .b35-hero, .card, .golden, .night, .part, .posters, .roll').forEach((el) => el.setAttribute('data-parallax', ''));
  const layers = [...document.querySelectorAll('[data-parallax]')];
  if (layers.length) {
    const visible = new Set();
    const pIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      schedule();
    });
    layers.forEach((el) => pIO.observe(el));
    let ticking = false;
    function update() {
      ticking = false;
      const vh = window.innerHeight;
      visible.forEach((el) => {
        const r = el.getBoundingClientRect();
        const p = ((r.top + r.height / 2) - vh / 2) / vh;
        el.style.setProperty('--p', Math.max(-1, Math.min(1, p)).toFixed(3));
      });
    }
    function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
  }
})();
