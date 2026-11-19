const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp01 = v => Math.min(1, Math.max(0, v));

// ===== Прелоадер: чекаємо шрифти й фото шефа, потім м'яко відкриваємо сторінку =====
(() => {
  const root = document.documentElement;
  const chef = document.querySelector('.hero__chef');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const img = chef ? (chef.decode ? chef.decode().catch(() => {}) : new Promise(r => chef.complete ? r() : chef.addEventListener('load', r))) : Promise.resolve();
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const go = () => {
    if (root.classList.contains('is-ready')) return;
    window.dispatchEvent(new Event('tk:fit'));
    setTimeout(() => {
      root.classList.add('is-ready');
      setTimeout(() => root.classList.add('is-gone'), 1000);
    }, 30);
  };
  Promise.race([Promise.all([img, fonts, wait(reduce ? 0 : 900)]), wait(3000)]).then(go);
})();

// ===== Без «сиріт»: останні два слова в заголовках і коротких рядках не розриваються =====
(() => {
  document.querySelectorAll('h1, h2, h3, summary, .qa__item p, .burger-tk__list li, .vcard__name, .vnext__t, .flow__step p, .lead__sub, .venues__cta p, .frame__text').forEach(el => {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let last = null, n;
    while ((n = walk.nextNode())) if (n.data.trim()) last = n;
    if (!last) return;
    const m = last.data.match(/^(.*\S)\s+(\S{1,12})(\s*)$/s);
    if (m) last.data = m[1] + '\u00a0' + m[2] + m[3];
  });
})();

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

// ===== Слово ТЕХКАРТА на всю ширину =====
(() => {
  const words = document.querySelectorAll('.hero__word, .footer__word');
  const fit = () => words.forEach(w => {
    w.style.fontSize = '100px';
    const cs = getComputedStyle(w), box = w.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    let width = 0; w.querySelectorAll('span').forEach(s => width += s.getBoundingClientRect().width);
    if (width) w.style.fontSize = (100 * box / width * .995) + 'px';
  });
  fit();
  if (document.fonts) document.fonts.ready.then(fit);
  addEventListener('resize', fit);
  addEventListener('tk:fit', fit);
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

// ===== Hero: глибина при скролі й русі мишки =====
(() => {
  const hero = document.querySelector('.hero');
  if (!hero || reduce) return;
  const lw = hero.querySelector('.hero__layer--word');
  const lc = hero.querySelector('.hero__layer--chef');
  const word = hero.querySelector('.hero__word');
  let mx = 0, my = 0, tx = 0, ty = 0, sp = 0, raf = 0;
  const draw = () => {
    mx += (tx - mx) * .08; my += (ty - my) * .08;
    const dist = Math.min(1, Math.hypot(mx, my));
    lw.style.transform = `translate3d(${-mx * 8}px, calc(${sp * 22}vh + ${-my * 4}px), 0)`;
    lc.style.transform = `translate3d(${mx * 6}px, ${sp * 8}vh, 0) scale(${1 + sp * .06})`;
    word.style.filter = dist > .02 ? `blur(${(dist * .9).toFixed(2)}px)` : '';
    hero.style.setProperty('--mx', (50 + mx * 18) + '%');
    hero.style.setProperty('--my', (42 + my * 14) + '%');
    raf = Math.abs(tx - mx) + Math.abs(ty - my) > .001 ? requestAnimationFrame(draw) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };
  addEventListener('scroll', () => { sp = clamp01(scrollY / hero.offsetHeight); kick(); }, { passive: true });
  if (matchMedia('(hover: hover)').matches) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width * 2 - 1;
      ty = (e.clientY - r.top) / r.height * 2 - 1;
      kick();
    });
    hero.addEventListener('pointerleave', () => { tx = ty = 0; kick(); });
  }
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

// ===== Вартість: калькулятор за площею =====
(() => {
  const chips = document.querySelectorAll('.cost .chip');
  if (!chips.length) return;
  const scale = document.querySelector('.calc');
  const group = chips[0].parentElement;
  const pill = document.createElement('span'); pill.className = 'chips__pill'; pill.setAttribute('aria-hidden', 'true'); group.prepend(pill);
  const sv = document.getElementById('sv'), iv = document.getElementById('iv'), tv = document.getElementById('tv');
  const av = document.getElementById('av'), bv = document.getElementById('bv'), pv = document.getElementById('pv');
  const fmt = n => n.toLocaleString('uk-UA').replace(/\s/g, '\u00a0');
  const r100 = n => fmt(Math.round(n / 100) * 100);
  let cur = { s: 3300, a: 15000, b: 25000 };
  const movePill = () => {
    const c = group.querySelector('[aria-checked="true"]'); if (!c) return;
    pill.style.width = c.offsetWidth + 'px'; pill.style.height = c.offsetHeight + 'px';
    pill.style.transform = `translate(${c.offsetLeft}px,${c.offsetTop}px)`;
  };
  const render = v => {
    sv.innerHTML = '<small>$</small>' + fmt(Math.round(v.s));
    iv.textContent = '$' + r100(v.a) + '–' + r100(v.b);
    tv.textContent = '$' + r100(v.s + v.a) + '–' + r100(v.s + v.b);
    const lo = v.s / (v.s + v.b) * 100, hi = v.s / (v.s + v.a) * 100;
    pv.textContent = Math.round(lo) + '–' + Math.round(hi) + '%';
    bv.style.width = ((lo + hi) / 2).toFixed(1) + '%';
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
    av.textContent = btn.dataset.area; movePill();
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
  pill.style.transition = 'none'; render(cur); movePill();
  setTimeout(() => { pill.style.transition = ''; }, 60);
  addEventListener('resize', movePill);
  document.fonts && document.fonts.ready.then(movePill);
})();

// ===== Заклади: горизонтальна стрічка на скролі (десктоп), свайп (мобілка) =====
(() => {
  const track = document.querySelector('.vtrack');
  if (!track) return;
  const rail = track.querySelector('.vrail');
  const cards = [...rail.children];
  const imgs = cards.map(c => c.querySelector('img'));
  const bar = track.querySelector('.vbar i');
  const num = track.querySelector('.vcount b');
  const mq = matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
  let dist = 0, cur = 0, target = 0, raf = 0;
  const setup = () => {
    document.documentElement.classList.toggle('js-rail', mq.matches);
    if (!mq.matches) { track.style.height = ''; rail.style.transform = ''; return; }
    const last = cards[cards.length - 1];
    dist = Math.max(0, last.offsetLeft + last.offsetWidth + parseFloat(getComputedStyle(rail).paddingLeft) - innerWidth);
    track.style.height = (innerHeight + dist) + 'px';
    measure(); cur = target; paint();
  };
  const measure = () => {
    const r = track.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    target = p * dist;
  };
  const paint = () => {
    rail.style.transform = `translate3d(${-cur}px,0,0)`;
    const p = dist ? cur / dist : 0;
    if (bar) bar.style.transform = `scaleX(${p})`;
    if (num) num.textContent = String(Math.min(cards.length, Math.round(p * (cards.length - 1)) + 1)).padStart(2, '0');
    cards.forEach((c, i) => {
      const img = imgs[i]; if (!img) return;
      const r = c.getBoundingClientRect();
      const k = (r.left + r.width / 2) / innerWidth - .5;      // -0.5..0.5 відносно центру екрана
      img.style.setProperty('--px', (-8 - k * 10).toFixed(2) + '%');
    });
  };
  const loop = () => {
    cur += (target - cur) * .12;
    paint();
    raf = Math.abs(target - cur) > .3 ? requestAnimationFrame(loop) : 0;
  };
  addEventListener('scroll', () => { if (!mq.matches) return; measure(); if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
  addEventListener('resize', setup);
  mq.addEventListener('change', setup);
  imgs.forEach(i => i && i.addEventListener('load', setup, { once: true }));
  setup();
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

  const name = form.querySelector('#f-name'), contact = form.querySelector('#f-phone');
  // справжня маска: шаблон видно одразу, вводяться лише 9 цифр після «+38 (0»
  const MASK = '+38 (0__) ___-__-__';
  let digits = '';
  const render = () => {
    let i = 0;
    contact.value = MASK.replace(/_/g, () => i < digits.length ? digits[i++] : '_');
    const pos = digits.length ? (() => { let k = 0, p = 0; for (; p < MASK.length; p++) if (MASK[p] === '_' && ++k === digits.length) break; return p + 1; })() : MASK.indexOf('_');
    requestAnimationFrame(() => contact.setSelectionRange(pos, pos));
  };
  const fromText = t => { let d = t.replace(/\D/g, ''); d = d.replace(/^380/, '').replace(/^38/, '').replace(/^0/, ''); return d.slice(0, 9); };
  contact.addEventListener('focus', () => render());
  contact.addEventListener('blur', () => { if (!digits) contact.value = ''; });
  contact.addEventListener('beforeinput', e => {
    e.preventDefault();
    if (e.inputType.startsWith('delete')) digits = digits.slice(0, -1);
    else if (e.inputType === 'insertFromPaste' || e.inputType === 'insertReplacementText') digits = fromText((e.data || (e.dataTransfer && e.dataTransfer.getData('text')) || ''));
    else if (e.data && /\d/.test(e.data)) digits = (digits + e.data.replace(/\D/g, '')).slice(0, 9);
    render();
  });
  contact.addEventListener('paste', e => { e.preventDefault(); digits = fromText(e.clipboardData.getData('text')); render(); });
  // запасний шлях для браузерів без beforeinput
  contact.addEventListener('input', () => { const d = fromText(contact.value.replace(/^\+38 \(0/, '')); if (d !== digits) { digits = d; render(); } });
  const okName = () => /\p{L}{2}/u.test(name.value.trim());
  const okContact = () => digits.length === 9;
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
      form.reset(); digits = ''; applyArea();
      status.className = 'form__status is-ok';
      status.textContent = 'Заявку прийнято. Шеф напише вам у Telegram або зателефонує.';
    } catch (err) {
      status.className = 'form__status is-err';
      status.innerHTML = 'Не вдалося надіслати. Напишіть шефу напряму: <a href="https://t.me/Dima_Brss" target="_blank" rel="noopener">@Dima_Brss</a>';
    } finally { btn.disabled = false; }
  });
})();
