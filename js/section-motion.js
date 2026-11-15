/* ── SECTION MOTION (anime.js v4) ──────────────────────────────────────────
   Modelled frame by frame on the BrainwaveBoard reference video:
     • headings: words go from pale grey to full ink, rising a little (no heavy blur)
     • each section's pieces arrive from their own direction
   Plays EVERY time you cross a piece: scrolling down into it builds it, scrolling
   on past it (out the top) or back up past it (out the bottom) un-builds it, and
   coming back from either side builds it again.
     Showcase   – tabs slide in from the left, carousel rises from below,
                  handwritten arrows draw themselves
     Join       – trust ticks rise, the two-sided card opens from its centre seam
     Economics  – calculator wipes in from the left; the three price cards are
                  dealt from a fanned stack in the middle, Nexus lands last
     How        – step lines draw left→right; cards arrive from four directions
                  (left, right, below-left, below-right); radar rings ripple,
                  avatars fly out from the centre
     Founding   – card rises out of a rounded window, title closes up from wide
                  spacing, buttons slide in from the right
   Safe by design: no anime.js or "reduce motion" = nothing is hidden. Inline
   styles are removed whenever a piece is fully built, so hover effects work.
   ───────────────────────────────────────────────────────────────────────── */
(function initSectionMotion() {
  'use strict';

  var A = window.anime;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!A || typeof A.createTimeline !== 'function' || reduce) return;

  var stagger = A.stagger;
  // Strict boundaries: a piece builds when it comes into view (from below OR above), and is
  // reset only once it is completely off screen, so you never see things vanish or empty gaps.
  // A piece builds as soon as it starts entering the screen (its top above 98% of the height).
  // Nothing resets while its SECTION is on screen; a whole section resets only after it has
  // completely left, so there are never blank areas inside the part you are looking at.
  var ENTER_AT = 0.98, BUILD_SPEED = 1.35;
  // Reverse: a section un-builds only while it is LEAVING through an edge, i.e. when just a
  // sliver of it is left on screen (top below 72% while you scroll up, or bottom above 28%
  // while you scroll down). What you are looking at is never emptied.
  var EDGE = 0.28, OUT_SPEED = 1.9;

  var STYLE_PROPS = ['opacity', 'transform', 'filter', 'clip-path', 'letter-spacing', 'stroke-dasharray',
    'stroke-dashoffset', 'transform-origin', 'will-change', 'translate', 'rotate', 'scale', 'color'];

  /* ── helpers ─────────────────────────────────────────────────────────── */
  function $all(root, sel) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var q = function (sel) { return document.querySelector(sel); };
  var qa = function (sel) { return $all(document, sel); };
  function uniq(list) { return list.filter(function (el, i) { return el && list.indexOf(el) === i; }); }
  function clean(els) {
    els.forEach(function (el) {
      if (!el || !el.style) return;
      STYLE_PROPS.forEach(function (p) { el.style.removeProperty(p); });
      el.classList.remove('sm-anim');
    });
  }
  function center(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  /* Wrap each word in a span; gradient-text spans stay whole (splitting breaks the gradient). */
  function splitWords(el) {
    if (!el) return [];
    if (el.dataset.smSplit) return $all(el, '.sm-w');
    el.dataset.smSplit = '1';
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    if (label && !el.getAttribute('aria-label')) el.setAttribute('aria-label', label);
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 1) {
          var cs = getComputedStyle(child);
          var gradientText = cs.webkitBackgroundClip === 'text' || cs.backgroundClip === 'text' ||
            cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)' || child.classList.contains('nx-deck-accent');
          if (gradientText) { child.classList.add('sm-w'); child.setAttribute('aria-hidden', 'true'); return; }
          walk(child);
        } else if (child.nodeType === 3 && child.nodeValue.trim()) {
          var frag = document.createDocumentFragment();
          child.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'sm-w'; s.setAttribute('aria-hidden', 'true'); s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        }
      });
    })(el);
    return $all(el, '.sm-w');
  }

  /* SVG strokes (the handwritten arrows) get a dash pattern so they can "draw". */
  function drawable(paths) {
    return paths.filter(function (p) { return typeof p.getTotalLength === 'function'; }).map(function (p) {
      var len = Math.ceil(p.getTotalLength()) + 2;
      p.style.strokeDasharray = len + ' ' + len;
      p.dataset.smLen = String(len);
      return p;
    });
  }

  /* ── beats ───────────────────────────────────────────────────────────────
     A beat = one timeline + the element whose position triggers it. */
  var beats = [];
  function beat(section, at, build) {
    if (!section || !at) return;
    var b = { section: section, at: at, dir: 0, targets: [] };
    b.tl = A.createTimeline({
      autoplay: false,
      defaults: { ease: 'out(4)', duration: 1000 },
    });
    try {
      b.targets = uniq(build(b.tl) || []);
    } catch (e) {
      clean(b.targets); return;                                        // never leave content hidden
    }
    b.targets.forEach(function (el) { el.classList.add('sm-anim'); });
    // Draw the "before" state now: a fresh timeline at 0 renders nothing on seek(0),
    // so step to the end and back to force both renders.
    b.tl.seek(b.tl.duration);
    b.tl.seek(0);
    b.pos = 0;
    beats.push(b);
  }
  /* Each timeline is driven by hand (seek frame by frame) in both directions. anime.js's own
     reverse() does not redraw once a finished beat has handed its styles back to the page. */
  function drive(b, to, speed, done) {
    if (b.driver) b.driver.pause();
    var from = b.pos || 0;
    if (from === to) { if (done) done(); return; }
    if (b.cleaned) { b.tl.seek(b.tl.duration); b.tl.seek(from); b.cleaned = false; }  // re-take control
    var proxy = { t: from };
    b.driver = A.animate(proxy, {
      t: to, duration: Math.max(60, Math.abs(to - from) / speed), ease: 'linear',
      onUpdate: function () { b.pos = proxy.t; b.tl.seek(b.pos); },
      onComplete: function () { b.pos = to; b.tl.seek(to); if (done) done(); }
    });
  }
  function playIn(b) {
    if (b.dir === 1) return;
    b.dir = 1;
    b.section.classList.add('sm-played');
    b.targets.forEach(function (el) { el.classList.add('sm-anim'); });
    drive(b, b.tl.duration, BUILD_SPEED, function () {
      if (b.dir === 1) { clean(b.targets); b.cleaned = true; }       // fully built: hand back to the page's CSS
    });
  }
  function playOut(b) {
    if (b.dir !== 1) return;
    b.dir = -1;
    b.targets.forEach(function (el) { el.classList.add('sm-anim'); });
    drive(b, 0, OUT_SPEED);
  }
  function reset(b) {                       // off screen: snap back to the "before" state, unseen
    if (b.dir === 0 && b.pos === 0) return;
    b.dir = 0;
    if (b.driver) b.driver.pause();
    b.targets.forEach(function (el) { el.classList.add('sm-anim'); });
    if (b.cleaned) { b.tl.seek(b.tl.duration); b.cleaned = false; }
    b.pos = 0; b.tl.seek(0);
  }

  /* ── reusable pieces ─────────────────────────────────────────────────── */
  // Words: pale → ink, rising a little, left to right. A trace of blur only.
  function wordsIn(tl, title, at) {
    var words = splitWords(title);
    if (!words.length) return [];
    tl.add(words, {
      opacity: [0.12, 1], y: ['0.28em', '0em'], filter: ['blur(2px)', 'blur(0px)'],
      duration: 900, delay: stagger(85), ease: 'out(3)'
    }, at || 0);
    return words;
  }
  function pillIn(tl, pill, at) {
    if (!pill) return [];
    tl.add(pill, { opacity: [0, 1], y: [-16, 0], scale: [0.9, 1], duration: 700, ease: 'outBack(1.5)' }, at || 0);
    return [pill];
  }
  function subIn(tl, sub, at) {
    if (!sub) return [];
    tl.add(sub, { opacity: [0, 1], y: [22, 0], duration: 800 }, at || 0);
    return [sub];
  }
  function notesIn(tl, notes, at) {
    var out = [];
    notes.forEach(function (n, i) {
      var side = i % 2 ? 1 : -1;
      tl.add(n, { opacity: [0, 1], x: [side * 30, 0], rotate: [side * 8, 0], duration: 800 }, at + i * 160);
      var paths = drawable($all(n, 'path'));
      paths.forEach(function (p) {
        tl.add(p, { strokeDashoffset: [Number(p.dataset.smLen), 0], duration: 900, ease: 'inOut(2)' }, at + 240 + i * 160);
      });
      out.push(n); out = out.concat(paths);
    });
    return out;
  }

  /* ════ SHOWCASE ═══════════════════════════════════════════════════════ */
  (function () {
    var s = q('#showcase'); if (!s) return;
    beat(s, q('#showcase .cr-title'), function (tl) {
      return [].concat(
        pillIn(tl, q('#showcase .cr-pill'), 0),
        wordsIn(tl, q('#showcase .cr-title'), 120),
        subIn(tl, q('#showcase .cr-sub'), 450),
        notesIn(tl, qa('#showcase .cr-note'), 550));
    });
    beat(s, q('#showcase .dir-bar') || q('#showcase .dir-shell'), function (tl) {
      // The carousel moves its own cards, so we animate the frame around them, never the cards.
      var tabs = uniq(qa('#showcase .dir-tab'));
      var others = uniq(qa('#showcase .dir-bar > *')).filter(function (el) { return tabs.indexOf(el) === -1 && !el.contains(tabs[0]); });
      var stage = q('#showcase .lz-wrap');
      var controls = q('#showcase .lz-controls');
      var out = [];
      if (tabs.length) { tl.add(tabs, { opacity: [0, 1], x: [-40, 0], duration: 750, delay: stagger(60) }, 0); out = out.concat(tabs); }
      if (others.length) { tl.add(others, { opacity: [0, 1], x: [40, 0], duration: 750, delay: stagger(80) }, 120); out = out.concat(others); }
      if (stage) { tl.add(stage, { opacity: [0, 1], y: [140, 0], scale: [0.96, 1], duration: 1200, ease: 'out(4)' }, 200); out.push(stage); }
      if (controls) { tl.add(controls, { opacity: [0, 1], y: [24, 0], duration: 700 }, 800); out.push(controls); }
      return out;
    });
  })();

  /* ════ JOIN ═══════════════════════════════════════════════════════════ */
  (function () {
    var s = q('#join'); if (!s) return;
    var head = q('#join .jn-head');
    beat(s, q('#join .jn-title'), function (tl) {
      var pill = head ? head.querySelector('[class*="pill"], [class*="kicker"], [class*="eyebrow"]') : null;
      return [].concat(
        pillIn(tl, pill, 0),
        wordsIn(tl, q('#join .jn-title'), 120),
        subIn(tl, q('#join .jn-sub'), 450),
        notesIn(tl, qa('#join .jn-note'), 550));
    });
    beat(s, q('#join .jn-grid'), function (tl) {
      var trust = head ? $all(head, 'ul > li, [class*="trust"] > *') : [];
      var tabs = q('#join .jn-tabs');
      var grid = q('#join .jn-grid');
      var out = [];
      if (trust.length) { tl.add(trust, { opacity: [0, 1], y: [16, 0], duration: 600, delay: stagger(80) }, 0); out = out.concat(trust); }
      if (tabs) { tl.add(tabs, { opacity: [0, 1], scale: [0.8, 1], duration: 700, ease: 'outBack(1.6)' }, 140); out.push(tabs); }
      tl.add(grid, {
        opacity: [0, 1], y: [60, 0],
        clipPath: ['inset(0% 50% 0% 50% round 30px)', 'inset(0% 0% 0% 0% round 30px)'],
        duration: 1200, ease: 'inOut(3)'
      }, 260);
      out.push(grid);
      return out;
    });
  })();

  /* ════ ECONOMICS ══════════════════════════════════════════════════════ */
  (function () {
    var s = q('#fees'); if (!s) return;
    beat(s, q('#fees .ct-title'), function (tl) {
      var out = [].concat(wordsIn(tl, q('#fees .ct-title'), 0), subIn(tl, q('#fees .ct-sub'), 380));
      var bar = q('#fees .ct-calc-bar');
      if (bar) {
        tl.add(bar, { opacity: [0, 1], x: [-60, 0], clipPath: ['inset(0% 100% 0% 0% round 999px)', 'inset(0% 0% 0% 0% round 999px)'], duration: 1000, ease: 'inOut(3)' }, 480);
        out.push(bar);
      }
      return out;
    });
    var grid = q('#fees .ct-matrix-grid') || q('#fees .ct-matrix-wrapper');
    var cards = [q('#fees .ct-card.is-freelance'), q('#fees .ct-card.is-agency'), q('#fees .ct-card.is-hero')].filter(Boolean);
    if (grid && cards.length) beat(s, grid, function (tl) {
      var c = center(grid);
      cards.forEach(function (card, i) {
        var m = center(card);
        var hero = card.classList.contains('is-hero');
        var tilt = hero ? 0 : (m.x < c.x ? -12 : 12);
        tl.add(card, {
          opacity: { from: 0, to: 1, duration: 350 },
          x: [c.x - m.x, 0], y: [90 + (hero ? 30 : 0), 0], rotate: [tilt * 1.5, 0], scale: [0.84, 1],
          duration: hero ? 1200 : 1100, ease: hero ? 'outBack(1.3)' : 'out(4)'
        }, hero ? 520 : 100 + i * 160);
      });
      var learn = q('#fees .ct-learn');
      if (learn) tl.add(learn, { opacity: [0, 1], y: [16, 0], duration: 700 }, 1100);
      return cards.concat(learn ? [learn] : []);
    });
  })();

  /* ════ HOW IT WORKS ═══════════════════════════════════════════════════ */
  (function () {
    var s = q('#how'); if (!s) return;
    beat(s, q('#how .nx-how-title'), function (tl) {
      var out = [].concat(wordsIn(tl, q('#how .nx-how-title'), 0), subIn(tl, q('#how .nx-how-sub'), 380));
      var steps = qa('#how .nx-pipe-step');
      var tracks = qa('#how .nx-pipe-track');
      if (steps.length) { tl.add(steps, { opacity: [0, 1], x: [-36, 0], duration: 800, delay: stagger(120) }, 380); out = out.concat(steps); }
      tracks.forEach(function (t) { t.style.transformOrigin = '0% 50%'; });
      if (tracks.length) { tl.add(tracks, { scaleX: [0, 1], duration: 900, delay: stagger(120), ease: 'inOut(3)' }, 520); out = out.concat(tracks); }
      return out;
    });
    var grid = q('#how .nx-how-grid');
    if (grid) beat(s, grid, function (tl) {
      // Each card arrives from its own side, like the reference's bento tiles.
      var from = [{ x: -110, y: 30 }, { x: 110, y: 30 }, { x: -60, y: 110 }, { x: 60, y: 110 }];
      var cards = qa('#how .nx-how-card');
      cards.forEach(function (card, i) {
        var f = from[i % from.length];
        tl.add(card, { opacity: [0, 1], x: [f.x, 0], y: [f.y, 0], scale: [0.95, 1], duration: 1100, ease: 'out(4)' }, i * 120);
      });
      var rings = qa('#how .nx-radar-ring');
      if (rings.length) tl.add(rings, { scale: [0, 1], opacity: [0, 1], duration: 1000, delay: stagger(140), ease: 'out(3)' }, 380);
      var dial = q('#how .nx-radar-center') || q('#how .nx-radar-dial');
      var blips = qa('#how .nx-radar-blip .nx-blip-avatar, #how .nx-radar-blip .nx-blip-pill');
      if (dial) {
        var c = center(dial);
        blips.forEach(function (el, i) {
          var r = center(el);
          tl.add(el, {
            opacity: [0, 1], x: [c.x - r.x, 0], y: [c.y - r.y, 0], scale: [0.3, 1], rotate: [i % 2 ? 12 : -12, 0],
            duration: 1100, ease: 'out(5)'
          }, 760 + i * 60);
        });
      }
      return cards.concat(rings, blips);
    });
  })();

  /* ════ FOUNDING ═══════════════════════════════════════════════════════ */
  (function () {
    var s = q('#founding'); if (!s) return;
    var banner = q('#founding .nx-found-banner');
    var title = q('#founding .nx-found-title');
    if (!banner) return;
    beat(s, banner, function (tl) {
      var out = [banner];
      tl.add(banner, {
        opacity: [0, 1], y: [90, 0], scale: [0.92, 1],
        clipPath: ['inset(8% 10% 8% 10% round 56px)', 'inset(0% 0% 0% 0% round 28px)'],
        duration: 1300, ease: 'out(4)'
      }, 0);
      out = out.concat(pillIn(tl, q('#founding .nx-cohort-pill'), 320));
      if (title) {
        var words = splitWords(title);
        var finalLs = getComputedStyle(title).letterSpacing; if (finalLs === 'normal') finalLs = '0px';
        var h0 = title.getBoundingClientRect().height, wide = null;
        ['0.3em', '0.2em', '0.12em', '0.06em'].some(function (ls) {
          title.style.letterSpacing = ls;
          if (title.getBoundingClientRect().height <= h0 + 1) { wide = ls; return true; }
          return false;
        });
        title.style.removeProperty('letter-spacing');
        if (wide) tl.add(title, { letterSpacing: [wide, finalLs], duration: 1300, ease: 'out(4)' }, 360);
        tl.add(words, { opacity: [0.12, 1], y: ['0.3em', '0em'], duration: 1000, delay: stagger(110), ease: 'out(3)' }, 420);
        out.push(title); out = out.concat(words);
      }
      var rest = qa('#founding .nx-found-sub, #founding .nx-seat-meter');
      if (rest.length) { tl.add(rest, { opacity: [0, 1], y: [22, 0], duration: 800, delay: stagger(110) }, 760); out = out.concat(rest); }
      var btns = qa('#founding .nx-found-actions > *, #founding .nx-found-note');
      if (btns.length) { tl.add(btns, { opacity: [0, 1], x: [70, 0], duration: 850, delay: stagger(110), ease: 'out(4)' }, 880); out = out.concat(btns); }
      return out;
    });
  })();

  /* ── triggering: build on the way in, un-build on the way out, both directions ── */
  var ticking = false;
  var lastY = window.pageYOffset || 0, goingUp = false;
  function sweep() {
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    if (Math.abs(y - lastY) > 2) { goingUp = y < lastY; lastY = y; }
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var secState = new Map();
    beats.forEach(function (b) {
      if (!secState.has(b.section)) {
        var sr = b.section.getBoundingClientRect();
        secState.set(b.section, {
          gone: sr.bottom <= 0 || sr.top >= vh,
          leaving: goingUp ? sr.top > vh * (1 - EDGE) : sr.bottom < vh * EDGE
        });
      }
      var st = secState.get(b.section);
      if (st.gone) { reset(b); return; }                                // whole section gone: reset unseen
      if (st.leaving) { playOut(b); return; }                           // sliding out an edge: un-build
      if (b.dir === 1) return;                                          // already built: nothing to measure
      // Build as soon as ANY part of this group is entering or on screen (from below or above).
      var top = Infinity, bottom = -Infinity;
      [b.at].concat(b.targets).forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.height === 0 && r.width === 0) return;
        if (r.top < top) top = r.top;
        if (r.bottom > bottom) bottom = r.bottom;
      });
      if (top < vh * ENTER_AT && bottom > 0) playIn(b);
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(sweep); } }   // read layout once per frame, before anything writes
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load', onScroll);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) onScroll(); });
  setInterval(onScroll, 500);   // also catches scrolling done by the page's own section slider
  setTimeout(sweep, 0);

  /* theme-engine.js hands its sections to us (see animateSectionStart). */
  window.__nxSectionEntrance = function (secId) {
    var el = document.getElementById(secId);
    var mine = beats.some(function (b) { return b.section === el; });
    if (mine) onScroll();
    return mine;
  };
  window.__nxSectionReveal = function (secId) {
    var el = document.getElementById(secId);
    beats.forEach(function (b) {
      if (b.section !== el) return;
      b.dir = 1; if (b.driver) b.driver.pause(); b.tl.seek(b.tl.duration); b.pos = b.tl.duration; clean(b.targets); b.cleaned = true;
    });
  };
  window.__nxRevealAll = function () { beats.forEach(function (b) { b.dir = 1; if (b.driver) b.driver.pause(); b.tl.seek(b.tl.duration); b.pos = b.tl.duration; clean(b.targets); b.cleaned = true; }); };
})();
