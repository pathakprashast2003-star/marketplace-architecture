/* ── MOBILE "BUTTER" GESTURES & THUMB-ZONE DECK ENGINE ── */
(function initMobileButterGestures() {
  'use strict';

  const THEMES = ['sage', 'cobalt', 'lilac', 'amber', 'coral'];

  // Update mobile bottom nav active pill
  function updateMobileBottomNav(activeId) {
    const nav = document.getElementById('nxMobileBottomNav');
    if (!nav) return;
    const links = nav.querySelectorAll('a');
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      const target = href.replace('#', '');
      if (target === activeId || (target === 'showcase' && activeId === 'hero')) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      } else {
        a.classList.remove('is-active');
        a.removeAttribute('aria-current');
      }
    });
  }

  // 1. Mobile Section Navigation
  function triggerSlideTransition(targetId) {
    updateMobileBottomNav(targetId);

    if (typeof window.executeSectionSlide === 'function') {
      window.executeSectionSlide(targetId);
    } else {
      const el = targetId === 'hero' ? document.querySelector('.hero-viewport') : document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 2. Hero Character Horizontal Swipe
  const heroViewport = document.querySelector('.hero-viewport');
  if (heroViewport) {
    let heroStartX = 0;
    let heroStartY = 0;

    heroViewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        heroStartX = e.touches[0].clientX;
        heroStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    heroViewport.addEventListener('touchend', (e) => {
      if (e.changedTouches.length !== 1) return;
      const hEndX = e.changedTouches[0].clientX;
      const hEndY = e.changedTouches[0].clientY;
      const hDx = hEndX - heroStartX;
      const hDy = hEndY - heroStartY;

      // Horizontal swipe dominant
      if (Math.abs(hDx) > 45 && Math.abs(hDx) > Math.abs(hDy) * 1.2) {
        const currentTheme = document.body.getAttribute('data-theme') || 'sage';
        const curIdx = THEMES.indexOf(currentTheme);
        if (curIdx !== -1) {
          let nextIdx;
          if (hDx < 0) {
            // Swipe LEFT -> next theme
            nextIdx = (curIdx + 1) % THEMES.length;
          } else {
            // Swipe RIGHT -> prev theme
            nextIdx = (curIdx - 1 + THEMES.length) % THEMES.length;
          }
          const nextTheme = THEMES[nextIdx];
          const pill = document.querySelector(`.theme-capsule-btn[data-theme="${nextTheme}"]`);
          if (pill) {
            pill.click();
          } else {
            document.body.setAttribute('data-theme', nextTheme);
          }
        }
      }
    }, { passive: true });
  }

  // 3. Mobile Bottom Nav Click Handlers
  function initBottomNav() {
    const bottomNav = document.getElementById('nxMobileBottomNav');
    if (!bottomNav) return;

    bottomNav.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        triggerSlideTransition(targetId);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBottomNav);
  } else {
    initBottomNav();
  }

  // Export helper
  window.triggerSlideTransition = triggerSlideTransition;
  window.updateMobileBottomNav = updateMobileBottomNav;
})();
