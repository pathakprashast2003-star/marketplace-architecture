/* ── JOIN on phones: animate the switch between For clients / For creators / Log in ──
   Desktop has its sliding blue panel; on phones that panel is hidden and cards just swapped.
   Here the new card slides in from the side you're moving towards, and its pieces arrive
   from different directions (same feel as the section animations). Phones only. */
(function () {
  var sw = document.getElementById('jnSw');
  if (!sw || !sw.animate) return;
  var mq = window.matchMedia('(max-width: 820px)');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ORDER = { hire: 0, be: 1, login: 2 };
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var BACK = 'cubic-bezier(0.34, 1.4, 0.64, 1)';

  function mode() { return sw.dataset.login === 'open' ? 'login' : (sw.dataset.side || 'hire'); }
  function visibleCard(m) {
    if (m === 'login') return sw.querySelector('.jn-login-sheet');
    return sw.querySelector(m === 'be' ? '.jn-creator' : '.jn-client');
  }
  function play(el, frames, opts) {
    return el.animate(frames, Object.assign({ fill: 'backwards', easing: EASE }, opts));
  }

  var panel = sw.querySelector('.jn-panel');
  var lastTop = panel ? panel.offsetTop : 0;   // position inside the card (not affected by scrolling)
  window.addEventListener('resize', function () { if (panel) lastTop = panel.offsetTop; });

  var last = mode();
  new MutationObserver(function () {
    var now = mode();
    if (now === last) return;
    var dir = ORDER[now] > ORDER[last] ? 1 : -1;   // 1 = moving right along the tabs
    last = now;
    if (!mq.matches || still.matches) { if (panel) lastTop = panel.offsetTop; return; }
    var card = visibleCard(now);
    if (!card) return;

    // 0. the blue panel glides from where it was to its new place (above or below the form)
    if (panel && panel.offsetParent) {
      var newTop = panel.offsetTop, dy = lastTop - newTop;
      if (Math.abs(dy) > 4) {
        panel.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'translateY(0)' }],
          { duration: 620, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
      }
      var face = panel.querySelector(now === 'be' ? '.jn-face-hire' : '.jn-face-be');
      if (face) face.animate([{ opacity: 0, transform: 'translateY(' + (dy > 0 ? 12 : -12) + 'px)' }, { opacity: 1, transform: 'none' }],
        { duration: 520, delay: 160, easing: EASE, fill: 'backwards' });
      lastTop = newTop;
    }

    // 1. the card itself slides in from the side you're heading to
    play(card, [
      { opacity: 0, transform: 'translateX(' + (dir * 34) + 'px) scale(0.98)', filter: 'blur(3px)' },
      { opacity: 1, transform: 'none', filter: 'blur(0)' }
    ], { duration: 480 });

    var t = 90;
    // 2. small label from the left, heading from the right
    card.querySelectorAll('.jn-k').forEach(function (el) {
      play(el, [{ opacity: 0, transform: 'translateX(-18px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: t });
    });
    card.querySelectorAll('h3').forEach(function (el) {
      play(el, [{ opacity: 0, transform: 'translateX(22px)', filter: 'blur(2px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { duration: 520, delay: t + 50 });
    });
    t += 160;
    // 3. chips pop in one after another
    card.querySelectorAll('.jn-chips label').forEach(function (el, i) {
      play(el, [{ opacity: 0, transform: 'scale(0.82) translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: t + i * 40, easing: BACK });
    });
    t += 120;
    // 4. text, fields and lists rise from below
    card.querySelectorAll('.jn-p, .jn-count, .jn-track, .jn-l, .jn-row > div, form > input, .jn-live-line, .jn-ticks li, .jn-path li').forEach(function (el, i) {
      play(el, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 440, delay: t + i * 35 });
    });
    // 5. buttons last, with a little bounce
    card.querySelectorAll('.jn-btn').forEach(function (el, i) {
      play(el, [{ opacity: 0, transform: 'translateY(16px) scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 460, delay: t + 200 + i * 60, easing: BACK });
    });
  }).observe(sw, { attributes: true, attributeFilter: ['data-side', 'data-login'] });
})();
