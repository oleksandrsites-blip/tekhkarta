const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = v => Math.min(1, Math.max(0, v));

// ===== Меню =====
(() => {
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  const set = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    nav.classList.toggle('is-open', open);
  };
  burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
})();

// ===== Хедер: фон після скролу =====
(() => {
  const h = document.querySelector('.header');
  const f = () => h.classList.toggle('is-scrolled', scrollY > 24);
  addEventListener('scroll', f, { passive: true }); f();
})();

// ===== Sticky CTA на мобілці =====
(() => {
  const sticky = document.querySelector('.sticky-cta');
  const anchor = document.querySelector('.hero__right');
  if (!sticky || !anchor || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([e]) => {
    const show = !e.isIntersecting && e.boundingClientRect.top < 0;
    sticky.classList.toggle('is-visible', show);
    sticky.setAttribute('aria-hidden', !show);
    sticky.querySelectorAll('a').forEach(a => a.tabIndex = show ? 0 : -1);
  }).observe(anchor);
})();

// ===== Поява при скролі =====
(() => {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduce) { els.forEach(e => e.classList.add('is-in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  els.forEach(e => io.observe(e));
})();

// ===== Hero: дим =====
(() => {
  const c = document.querySelector('.hero__smoke');
  if (!c || reduce) return;
  const ctx = c.getContext('2d');
  let W, H, dpr, parts = [], run = true;
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 256;
  const s = sprite.getContext('2d');
  const g = s.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(225,220,210,.16)');
  g.addColorStop(.5, 'rgba(225,220,210,.06)');
  g.addColorStop(1, 'rgba(225,220,210,0)');
  s.fillStyle = g; s.fillRect(0, 0, 256, 256);

  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = c.clientWidth; H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const spawn = (init) => ({
    x: W * (.25 + Math.random() * .5),
    y: init ? H * (.3 + Math.random() * .7) : H + 120,
    r: 160 + Math.random() * 260,
    vx: (Math.random() - .5) * .25,
    vy: -(.25 + Math.random() * .45),
    a: 0, life: 0, max: 900 + Math.random() * 700, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .002
  });
  size();
  for (let i = 0; i < 16; i++) parts.push(spawn(true));
  const tick = () => {
    if (!run) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.life++; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      const t = p.life / p.max;
      p.a = t < .2 ? t / .2 : t > .75 ? (1 - t) / .25 : 1;
      ctx.globalAlpha = Math.max(0, p.a);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.drawImage(sprite, -p.r, -p.r * .7, p.r * 2, p.r * 1.4);
      ctx.restore();
      if (p.life >= p.max) Object.assign(p, spawn(false));
    }
    requestAnimationFrame(tick);
  };
  addEventListener('resize', size);
  new IntersectionObserver(([e]) => { const was = run; run = e.isIntersecting; if (run && !was) tick(); }).observe(c);
  tick();
})();

// ===== Hero: глибина при скролі =====
(() => {
  const hero = document.querySelector('.hero');
  const word = document.querySelector('.hero__word');
  const chef = document.querySelector('.hero__chef');
  if (!hero || reduce) return;
  const f = () => {
    const p = clamp01(scrollY / hero.offsetHeight);
    if (p >= 1) return;
    word.style.transform = `translateY(${p * 22}vh)`;
    chef.style.transform = `translate(-50%, ${p * 8}vh) scale(${1 + p * .06})`;
  };
  addEventListener('scroll', f, { passive: true });
})();

// ===== Маніфест: слова проявляються при скролі =====
(() => {
  const el = document.querySelector('.intro__text');
  if (!el || reduce) return;
  const wrap = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (/^\s+$/.test(part) || !part) frag.appendChild(document.createTextNode(part));
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrap(n);
    });
  };
  wrap(el);
  const words = el.querySelectorAll('.w');
  const f = () => {
    const r = el.getBoundingClientRect();
    const p = clamp01((innerHeight * .85 - r.top) / (r.height + innerHeight * .35));
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('is-on', i < n));
  };
  addEventListener('scroll', f, { passive: true }); f();
})();

// ===== Техкарта бургера: зібраний бургер плавно розлітається на шари =====
(() => {
  const sec0 = document.querySelector('.burger-tk');
  if (!sec0) return;
  const sec = sec0.querySelector('.burger-tk__track');
  const layers = [...sec0.querySelectorAll('.bt__l')];
  const bt = sec0.querySelector('.bt');
  const C = layers.map(l => parseFloat(l.style.getPropertyValue('--c')));
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const draw = p => {
    const H = bt.offsetHeight;
    const e = ease(p);
    const k = -.34 + e * .42;              // від зібраного (-0.34) до розлетілого (+0.08)
    layers.forEach((l, i) => {
      const rot = (i % 2 ? -1 : 1) * 2.2 * e * (i === 0 || i === layers.length - 1 ? .5 : 1);
      l.style.transform = `translateY(${C[i] / 100 * H * k}px) rotate(${rot}deg) scale(${1 + e * .03})`;
    });
  };
  if (reduce) { draw(1); return; }
  let target = 0, cur = 0, raf = 0;
  const tick = () => { cur += (target - cur) * .14; if (Math.abs(target - cur) < .0005) cur = target; draw(cur); raf = cur !== target ? requestAnimationFrame(tick) : 0; };
  const f = () => {
    const r = sec.getBoundingClientRect();
    // старт ще до закріплення: поки секція заїжджає на екран, бургер уже починає рух
    target = clamp01((innerHeight * .6 - r.top) / (sec.offsetHeight - innerHeight * .4));
    if (!raf) raf = requestAnimationFrame(tick);
  };
  addEventListener('scroll', f, { passive: true }); addEventListener('resize', f); f(); cur = target; draw(cur);
})();

// ===== Як працюємо: активний крок і фото поруч =====
(() => {
  const steps = [...document.querySelectorAll('.flow__step')];
  const imgs = [...document.querySelectorAll('.flow__frame img')];
  if (!steps.length) return;
  const f = () => {
    const mid = innerHeight * .5;
    let act = 0;
    steps.forEach((s, i) => { if (s.getBoundingClientRect().top < mid) act = i; });
    steps.forEach((s, i) => s.classList.toggle('is-on', i === act));
    imgs.forEach((im, i) => im.classList.toggle('is-on', i === act));
  };
  addEventListener('scroll', f, { passive: true }); f();
})();

// ===== Кадр-пауза: легкий паралакс =====
(() => {
  const img = document.querySelector('.frame__img');
  if (!img || reduce) return;
  const f = () => {
    const r = img.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = (innerHeight - r.top) / (innerHeight + r.height);
    img.style.transform = `translateY(${(p - .5) * -10}%)`;
  };
  addEventListener('scroll', f, { passive: true }); f();
})();

// ===== Вартість: кухонні ваги =====
(() => {
  const chips = document.querySelectorAll('.cost .chip');
  if (!chips.length) return;
  const scale = document.querySelector('.scale');
  const sv = document.getElementById('sv'), iv = document.getElementById('iv'), tv = document.getElementById('tv');
  const fmt = n => n.toLocaleString('uk-UA').replace(/\s/g, ' ');
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

// ===== Заклади: фото з'являється біля курсора =====
(() => {
  const peek = document.querySelector('.vpeek');
  if (!peek || !matchMedia('(hover: hover) and (min-width: 1024px)').matches) return;
  const pi = peek.querySelector('img');
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
  const loop = () => { x += (tx - x) * .18; y += (ty - y) * .18; peek.style.left = x + 'px'; peek.style.top = y + 'px'; raf = Math.abs(tx - x) + Math.abs(ty - y) > .5 ? requestAnimationFrame(loop) : 0; };
  document.querySelectorAll('.vrow').forEach(r => {
    r.addEventListener('mouseenter', e => { pi.src = r.querySelector('img').src; x = tx = e.clientX; y = ty = e.clientY; peek.classList.add('is-on'); });
    r.addEventListener('mousemove', e => { tx = e.clientX + 120; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
    r.addEventListener('mouseleave', () => peek.classList.remove('is-on'));
  });
})();

// ===== Форма прорахунку =====
(() => {
  const form = document.getElementById('leadForm');
  if (!form) return;
  const area = form.querySelector('#f-area');
  const status = form.querySelector('.form__status');
  const btn = form.querySelector('.form__btn');
  const applyArea = () => {
    let a; try { a = sessionStorage.getItem('area'); } catch (e) {}
    if (a) area.value = a;
  };
  document.querySelectorAll('a[href="#rozrakhunok"]').forEach(l => l.addEventListener('click', applyArea));

  const name = form.querySelector('#f-name'), contact = form.querySelector('#f-contact');
  const okName = () => /\p{L}{2}/u.test(name.value.trim());
  const okContact = () => { const v = contact.value.trim(); return /^@?[a-zA-Z][\w]{4,31}$/.test(v) || v.replace(/\D/g, '').length >= 10; };
  const mark = (input, ok) => { input.closest('.field').classList.toggle('is-error', !ok); input.setAttribute('aria-invalid', !ok); };
  [[name, okName], [contact, okContact]].forEach(([el, fn]) => el.addEventListener('blur', () => { if (el.value) mark(el, fn()); }));

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
