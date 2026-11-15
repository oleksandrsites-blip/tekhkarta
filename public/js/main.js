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
