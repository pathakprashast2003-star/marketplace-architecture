/* ── LEAN MODAL ROUTING & FOUNDING CARD FLIPPER ── */
(function initBookmarksAndModals() {
  'use strict';

  function toggleSaveCreator(btn, name) {
    if (!btn) return;
    const isSaved = btn.classList.toggle('is-saved');
    const bookmarkSvg = btn.querySelector('svg');
    if (isSaved) {
      btn.setAttribute('aria-label', `Remove ${name || 'talent'} from shortlist`);
      if (bookmarkSvg) bookmarkSvg.setAttribute('fill', 'currentColor');
    } else {
      btn.setAttribute('aria-label', `Save ${name || 'talent'} to shortlist`);
      if (bookmarkSvg) bookmarkSvg.setAttribute('fill', 'none');
    }
  }

  // Keep Join fully built while it scrolls into view, so it never shows up half-empty.
  function revealJoinWhileArriving() {
    const sec = document.getElementById('join');
    if (!sec || typeof window.__nxSectionReveal !== 'function') return;
    let frames = 0;
    (function tick() {
      const r = sec.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0 && frames % 6 === 0) window.__nxSectionReveal('join');
      if (++frames < 60) requestAnimationFrame(tick);
    })();
  }

  // Switch Join to a side and bring it on screen.
  // Phones: scroll straight to that side's form card (the blue panel may sit above it).
  function goToJoin(side) {
    const tab = document.querySelector('.jn-tab[data-side=' + side + ']');
    if (tab) tab.click();
    if (typeof window.__nxSectionReveal === 'function') window.__nxSectionReveal('join');   // measure the finished layout
    revealJoinWhileArriving();

    const phone = window.matchMedia('(max-width: 820px)').matches;
    const card = phone ? document.querySelector(side === 'be' ? '.jn-creator' : '.jn-client') : null;
    if (!card) {
      if (typeof window.executeSectionSlide === 'function') window.executeSectionSlide('join');
      else { const j = document.getElementById('join'); if (j) j.scrollIntoView({ behavior: 'smooth' }); }
      return phone;
    }
    const top = Math.max(0, card.getBoundingClientRect().top + scrollY - 84);
    const A = window.anime;
    if (A && typeof A.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const o = { y: scrollY };
      A.animate(o, { y: top, duration: 520, ease: 'out(3)', onUpdate: () => window.scrollTo({ top: o.y, behavior: 'instant' }) });   // 'instant': the page's smooth-scroll setting would otherwise stall this
    } else {
      window.scrollTo({ top: top, behavior: 'smooth' });
    }
    return phone;
  }

  function openFoundingModal() {
    goToJoin('be');
  }

  function openInquiryModal(name, craft) {
    const phone = goToJoin('hire');
    const input = document.getElementById('jnNeed');
    if (input) {
      if (name && !input.value) input.value = `Inquiry for ${name}${craft ? ' (' + craft + ')' : ''}: `;
      if (!phone) input.focus({ preventScroll: true });   // on phones, don't pop the keyboard up uninvited
    }
  }

  function openRosterFilterModal() {
    if (typeof window.executeSectionSlide === 'function') {
      window.executeSectionSlide('showcase');
    } else {
      const sec = document.getElementById('showcase');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function flipFoundingCard(flipToBack) {
    const banner = document.getElementById('foundingBanner');
    const flipper = document.getElementById('foundingFlipper');
    const front = document.querySelector('#founding .nx-found-front');
    const back = document.querySelector('#founding .nx-found-back');
    if (!banner || !flipper || !front || !back) return;
    if (flipToBack) {
      banner.classList.add('is-flipped');
      const backH = back.scrollHeight;
      const frontH = front.scrollHeight;
      if (backH > frontH) {
        flipper.style.minHeight = (backH + 4) + 'px';
      }
    } else {
      banner.classList.remove('is-flipped');
      flipper.style.minHeight = '';
    }
  }

  // "Send a request like this" in the profile pop-up: close it and open the request form
  document.addEventListener('click', e => {
    if (!e.target.closest('#fxBookBtn')) return;
    const x = document.getElementById('fxClose');
    if (x) x.click();
    openInquiryModal();
  });

  // Safe global exports
  window.toggleSaveCreator = toggleSaveCreator;
  window.openFoundingModal = openFoundingModal;
  window.closeFoundingModal = () => {};
  window.openInquiryModal = openInquiryModal;
  window.closeInquiryModal = () => {};
  window.openRosterFilterModal = openRosterFilterModal;
  window.flipFoundingCard = flipFoundingCard;
})();
