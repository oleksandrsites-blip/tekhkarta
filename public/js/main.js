// Меню
const burger = document.querySelector('.burger');
const nav = document.getElementById('nav');
const setMenu = open => {
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
  nav.classList.toggle('is-open', open);
};
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// Лінія під хедером після скролу
const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 8);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Sticky CTA на мобілці — після того, як hero-кнопки зникли з екрана
const sticky = document.querySelector('.sticky-cta');
const heroActions = document.querySelector('.hero__actions');
if (sticky && heroActions && 'IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => {
    const show = !e.isIntersecting && e.boundingClientRect.top < 0;
    sticky.classList.toggle('is-visible', show);
    sticky.setAttribute('aria-hidden', !show);
    sticky.querySelectorAll('a').forEach(a => a.tabIndex = show ? 0 : -1);
  }).observe(heroActions);
}

// ===== Hero: знімаємо плівку зі скролом =====
(() => {
  const stage = document.getElementById('stage');
  const peel = document.getElementById('peel');
  if (!stage || !peel) return;
  const svg = peel.querySelector('.peel__svg');
  const film = peel.querySelector('.peel__film');
  const sheen = peel.querySelector('.peel__sheen');
  const flap = peel.querySelector('.peel__flap');
  const after = peel.querySelector('.peel__after');
  const before = peel.querySelector('.peel__before');
  const flapGrad = document.getElementById('flapGrad');
  const crease = peel.querySelector('.peel__crease');
  const filmGrad = document.getElementById('filmGrad');
  const hint = document.querySelector('.hero__hint');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let W = 0, H = 0, target = 0, cur = 0, raf = 0, teaser = 0;

  // Частина прямокутника по один бік лінії x + y = c
  const clip = (c, keepBig) => {
    const pts = [[0, 0], [W, 0], [W, H], [0, H]], out = [];
    const f = p => (p[0] + p[1] - c) * (keepBig ? 1 : -1);
    for (let i = 0; i < 4; i++) {
      const a = pts[i], b = pts[(i + 1) % 4], fa = f(a), fb = f(b);
      if (fa >= 0) out.push(a);
      if ((fa >= 0) !== (fb >= 0)) {
        const t = fa / (fa - fb);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  };
  const str = pts => pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');

  const draw = p => {
    // p: 0 — плівка ціла, 1 — знята повністю (+ запас, щоб клапан пішов за край)
    const c = (W + H) * (1 - p * 1.12);
    const open = clip(c, true);
    const rest = clip(c, false);
    film.setAttribute('points', str(rest));
    sheen.setAttribute('points', str(rest));
    after.style.clipPath = open.length ? 'polygon(' + open.map(q => q[0] + 'px ' + q[1] + 'px').join(',') + ')' : 'polygon(0 0,0 0,0 0)';
    // клапан = відкрита частина, віддзеркалена відносно лінії згину
    const fl = open.map(([x, y]) => [c - y, c - x]);
    flap.setAttribute('points', str(fl));
    const onFold = open.filter(([x, y]) => Math.abs(x + y - c) < .5);
    if (onFold.length === 2) {
      crease.setAttribute('x1', onFold[0][0]); crease.setAttribute('y1', onFold[0][1]);
      crease.setAttribute('x2', onFold[1][0]); crease.setAttribute('y2', onFold[1][1]);
      crease.style.opacity = 1;
    } else crease.style.opacity = 0;
    // градієнт клапана: від лінії згину до кінчика
    const k = Math.max(c, 0) / 2;
    flapGrad.setAttribute('x1', k); flapGrad.setAttribute('y1', k);
    flapGrad.setAttribute('x2', c - H); flapGrad.setAttribute('y2', c - W);
    before.style.filter = `saturate(${.55 + p * .45}) brightness(${.98 - p * .1})`;
    peel.style.setProperty('--p', Math.min(1, p).toFixed(3));
    peel.classList.toggle('is-open', p > .18);
    peel.classList.toggle('is-done', p > .72);
    if (hint) hint.style.opacity = p > .04 ? 0 : 1;
  };

  const measure = () => {
    const r = peel.getBoundingClientRect();
    W = r.width; H = r.height;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    filmGrad.setAttribute('x2', W); filmGrad.setAttribute('y2', H);
  };

  const progress = () => {
    if (reduce.matches) return .5;
    const r = stage.getBoundingClientRect();
    const run = r.height - (innerHeight - 72);
    const p = run > 0 ? -r.top / run : 0;
    // невелика пауза на старті й наприкінці
    return Math.min(1, Math.max(0, (p - .06) / .8));
  };

  const tick = () => {
    cur += (target - cur) * .16;
    if (Math.abs(target - cur) < .001) cur = target;
    draw(Math.max(cur, teaser));
    raf = cur !== target ? requestAnimationFrame(tick) : 0;
  };
  const onScroll = () => { target = progress(); if (!raf) raf = requestAnimationFrame(tick); };

  // блиск по плівці при завантаженні — щоб було зрозуміло, що це плівка
  const shine = () => {
    if (reduce.matches) return;
    const g = document.getElementById('sheenGrad'), t0 = performance.now(), d = 1400, span = W + H;
    sheen.style.opacity = 1;
    (function f(t) {
      const k = Math.min(1, (t - t0) / d), x = -300 + (span + 600) * k;
      g.setAttribute('x1', x); g.setAttribute('y1', 0); g.setAttribute('x2', x + 260); g.setAttribute('y2', 260);
      if (k < 1) requestAnimationFrame(f); else { sheen.style.opacity = 0; lift(); }
    })(t0);
  };

  // кут плівки трохи відгинається сам — підказка, що її можна зняти
  const lift = () => {
    const t0 = performance.now(), d = 900;
    (function f(t) {
      const k = Math.min(1, (t - t0) / d);
      teaser = .07 * (1 - Math.pow(1 - k, 3));
      if (cur < teaser) draw(teaser);
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  };

  measure(); target = cur = progress(); draw(cur);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); draw(Math.max(cur, teaser)); onScroll(); });
  setTimeout(shine, 700);
})();

// ===== Поява блоків при скролі =====
(() => {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach(e => e.classList.add('is-in')); return;
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  els.forEach((e, i) => { e.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(e); });
})();

// ===== Технологія: вертикальний скрол → горизонтальний рух кроків =====
(() => {
  const sec = document.querySelector('.tech');
  if (!sec) return;
  const pin = sec.querySelector('.tech__pin');
  const track = sec.querySelector('.tech__track');
  const vp = sec.querySelector('.tech__viewport');
  const wide = matchMedia('(min-width: 1024px)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let dist = 0;

  const setup = () => {
    if (wide.matches && !reduce.matches) {
      const pad = parseFloat(getComputedStyle(document.querySelector('.container')).paddingLeft);
      const box = document.querySelector('.tech__head').getBoundingClientRect();
      track.style.paddingLeft = box.left + pad + 'px';
      track.style.paddingRight = box.left + pad + 'px';
      dist = Math.max(0, track.scrollWidth - innerWidth);
      sec.style.height = pin.offsetHeight + dist + 'px';
    } else {
      sec.style.height = ''; track.style.transform = ''; track.style.paddingLeft = track.style.paddingRight = '';
      dist = 0;
    }
    update();
  };
  const update = () => {
    let p;
    if (dist) {
      const r = sec.getBoundingClientRect();
      p = Math.min(1, Math.max(0, (72 - r.top) / dist));
      track.style.transform = `translate3d(${-p * dist}px,0,0)`;
    } else {
      p = vp.scrollWidth > vp.clientWidth ? vp.scrollLeft / (vp.scrollWidth - vp.clientWidth) : 0;
    }
    sec.style.setProperty('--tp', p.toFixed(3));
  };
  addEventListener('scroll', update, { passive: true });
  vp.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', setup);
  addEventListener('load', setup);
  setup();
})();

// ===== Вартість: кухонні ваги =====
(() => {
  const chips = document.querySelectorAll('.cost .chip');
  if (!chips.length) return;
  const scale = document.querySelector('.scale');
  const sv = document.getElementById('sv'), iv = document.getElementById('iv'), tv = document.getElementById('tv');
  const fmt = n => n.toLocaleString('uk-UA').replace(/\s/g, ' ');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cur = { s: 3300, a: 15000, b: 25000 };

  const render = v => {
    sv.textContent = '$' + fmt(Math.round(v.s));
    iv.textContent = '$' + fmt(Math.round(v.a / 100) * 100) + '–' + fmt(Math.round(v.b / 100) * 100);
    tv.textContent = '$' + fmt(Math.round((v.s + v.a) / 100) * 100) + '–' + fmt(Math.round((v.s + v.b) / 100) * 100);
  };
  const go = to => {
    if (reduce) { cur = to; render(cur); return; }
    const from = { ...cur }, t0 = performance.now(), d = 650;
    scale.classList.add('is-weighing');
    setTimeout(() => scale.classList.remove('is-weighing'), 260);
    (function f(t) {
      const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
      cur = { s: from.s + (to.s - from.s) * e, a: from.a + (to.a - from.a) * e, b: from.b + (to.b - from.b) * e };
      render(cur);
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  };
  const pick = btn => {
    chips.forEach(c => { c.setAttribute('aria-checked', c === btn); c.tabIndex = c === btn ? 0 : -1; });
    const [a, b] = btn.dataset.i.split('-').map(Number);
    go({ s: +btn.dataset.s, a, b });
    try { sessionStorage.setItem('area', btn.dataset.area); } catch (e) {}
  };
  chips.forEach((c, i) => {
    c.tabIndex = c.getAttribute('aria-checked') === 'true' ? 0 : -1;
    c.addEventListener('click', () => pick(c));
    c.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      const n = chips[(i + d + chips.length) % chips.length]; n.focus(); pick(n);
    });
  });
  render(cur);
})();

// ===== 20+: фото повільно рухається всередині цифр =====
(() => {
  const n = document.querySelector('.venues__num');
  if (!n || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const f = () => {
    const r = n.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = (innerHeight - r.top) / (innerHeight + r.height);
    n.style.backgroundPosition = `${20 + p * 60}% ${25 + p * 40}%`;
  };
  addEventListener('scroll', f, { passive: true }); f();
})();

// ===== Форма прорахунку =====
(() => {
  const form = document.getElementById('leadForm');
  if (!form) return;
  const area = form.querySelector('#f-area');
  const status = form.querySelector('.form__status');
  const btn = form.querySelector('.form__btn');

  // площа з калькулятора
  const applyArea = () => {
    let a; try { a = sessionStorage.getItem('area'); } catch (e) {}
    if (a) [...area.options].forEach(o => { o.selected = o.text === a; });
  };
  document.querySelectorAll('[data-pick-area], a[href="#rozrakhunok"]').forEach(l => l.addEventListener('click', applyArea));

  const name = form.querySelector('#f-name'), contact = form.querySelector('#f-contact');
  const okName = () => /\p{L}{2}/u.test(name.value.trim());
  const okContact = () => {
    const v = contact.value.trim();
    return /^@?[a-zA-Z][\w]{4,31}$/.test(v) || v.replace(/\D/g, '').length >= 10;
  };
  const mark = (input, ok) => {
    input.closest('.field').classList.toggle('is-error', !ok);
    input.setAttribute('aria-invalid', !ok);
  };
  [[name, okName], [contact, okContact]].forEach(([el, fn]) =>
    el.addEventListener('blur', () => { if (el.value) mark(el, fn()); }));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const a = okName(), b = okContact();
    mark(name, a); mark(contact, b);
    if (!a) { name.focus(); return; }
    if (!b) { contact.focus(); return; }

    const data = Object.fromEntries(new FormData(form));
    btn.disabled = true;
    status.className = 'form__status'; status.textContent = 'Надсилаємо…';
    try {
      const r = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(r.status);
      form.reset(); applyArea();
      status.className = 'form__status is-ok';
      status.textContent = 'Заявку прийнято. Шеф напише вам у Telegram або зателефонує.';
    } catch (err) {
      status.className = 'form__status is-err';
      status.innerHTML = 'Не вдалося надіслати. Напишіть шефу напряму: <a href="https://t.me/Dima_Brss" target="_blank" rel="noopener">@Dima_Brss</a>';
    } finally { btn.disabled = false; }
  });
})();
