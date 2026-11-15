/* ── LEAN HIGH-PERFORMANCE SCROLL CHOREOGRAPHY & EYE-LEVEL COUNTERS ── */
(function initScrollChoreography() {
  'use strict';
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progressBarEl = document.querySelector('.nx-scroll-progress');
  const stickyNavEl = document.getElementById('nxStickyNav');

  /* 1. Eye-level counter animation via Anime.js v4 (BrainwaveBoard rolling odometers) */
  function animateCounter(el) {
    if (!el || el.dataset.counted) return;
    el.dataset.counted = '1';
    const from = parseFloat(el.dataset.countFrom);
    const to = parseFloat(el.dataset.countTo);
    if (Number.isNaN(from) || Number.isNaN(to)) {
      if (!Number.isNaN(to)) el.textContent = to.toFixed(0) + (el.dataset.countSuffix || '');
      return;
    }
    const decimals = parseInt(el.dataset.countDecimals || '0', 10);
    const suffix = el.dataset.countSuffix || '';
    if (reduceMotion || !window.anime || typeof window.anime.animate !== 'function') {
      el.textContent = to.toFixed(decimals) + suffix;
      return;
    }
    el.classList.add('is-rolling');

    const cObj = { val: from };
    window.anime.animate(cObj, {
      val: to,
      duration: 1250,
      ease: 'out(1.675)',
      onUpdate: () => {
        el.textContent = cObj.val.toFixed(decimals) + suffix;
      },
      onComplete: () => {
        el.textContent = to.toFixed(decimals) + suffix;
        el.classList.remove('is-rolling');
      }
    });
  }

  // Pre-seed initial from-values so odometer roll is visible upon arrival
  document.querySelectorAll('.nx-count:not([data-counted])').forEach(el => {
    const from = parseFloat(el.dataset.countFrom);
    if (!Number.isNaN(from)) {
      const decimals = parseInt(el.dataset.countDecimals || '0', 10);
      const suffix = el.dataset.countSuffix || '';
      el.textContent = from.toFixed(decimals) + suffix;
    }
  });

  // Observe counters with IntersectionObserver
  if ('IntersectionObserver' in window) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    document.querySelectorAll('.nx-count').forEach(c => counterIO.observe(c));
  } else {
    document.querySelectorAll('.nx-count').forEach(animateCounter);
  }

  window.__nxAnimateCounter = animateCounter;
  window.__nxObserveReveals = () => {
    document.querySelectorAll('.nx-count:not([data-counted])').forEach(animateCounter);
  };

  /* Pause continuous ticker/background keyframes when section is offscreen */
  if ('IntersectionObserver' in window) {
    const animPauseIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.classList.toggle('nx-offscreen', !entry.isIntersecting);
      });
    }, { rootMargin: '180px 0px' });
    document.querySelectorAll('.nx-ticker-strip, #showcase, #join, #fees, #how, #founding').forEach(sec => {
      animPauseIO.observe(sec);
    });
  }

  /* Pre-decode below-hero imagery during idle time */
  const warmDecodeImages = () => {
    document.querySelectorAll('.nx-page img').forEach(img => {
      if (typeof img.decode === 'function') img.decode().catch(() => {});
    });
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(warmDecodeImages, { timeout: 1800 });
  } else {
    setTimeout(warmDecodeImages, 600);
  }

  /* 2. Scroll Progress & Sticky Nav visibility (RAF-batched, zero forced reflows) */
  let rafId = 0;
  function updateScrollState() {
    rafId = 0;
    const vh = window.innerHeight || 900;
    const y = window.scrollY || window.pageYOffset || 0;
    const maxScroll = Math.max(1, root.scrollHeight - vh);
    const scrollP = Math.max(0, Math.min(1, y / maxScroll));

    if (progressBarEl) {
      progressBarEl.style.setProperty('--scroll-p', scrollP.toFixed(3));
    }
    if (stickyNavEl) {
      const isEditing = body.classList.contains('is-editing');
      const navVis = !isEditing && y >= vh * 0.65;
      if (stickyNavEl.classList.contains('is-visible') !== navVis) {
        stickyNavEl.classList.toggle('is-visible', navVis);
      }
    }
  }

  function onScroll() {
    if (!rafId) {
      rafId = requestAnimationFrame(updateScrollState);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateScrollState();

  window.__nxAnimateCounter = animateCounter;
  window.__nxObserveReveals = () => {
    document.querySelectorAll('.nx-count:not([data-counted])').forEach(animateCounter);
  };
})();
