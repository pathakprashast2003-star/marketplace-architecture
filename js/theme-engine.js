function setCharacterImage(src) {
  const slot = document.getElementById('heroCharacterSlot');
  if (slot && src) {
    slot.src = src;
    slot.style.display = 'block';
  }
}
/* ── DYNAMIC MULTI-CHARACTER & THEME ENGINE (SLIDESHOW) ── */
const THEME_KEYS = ['sage', 'cobalt', 'lilac', 'amber', 'coral'];
const THEME_PRESETS = {
  sage: {
    themeKey: 'sage',
    name: '3D Art',
    imgSrc: 'assets/creator_desk_designer.webp',
    imgAlt: 'Digital Creator at Modern Workstation',
    creativeWord: 'CREATIVE',
    edgeWord: 'EDGE',
    leadDesktop: 'WE FIND THE',
    subText: '3D modelers and digital artists, reviewed by a person. Contact them directly. 0% commission.'
  },
  cobalt: {
    themeKey: 'cobalt',
    name: 'Drone',
    imgSrc: 'assets/upward_flight_pilot_drone.webp',
    imgAlt: 'Upward Flight: Pilot and Drone',
    creativeWord: 'CREATIVE',
    edgeWord: 'EDGE',
    leadDesktop: 'WE FIND THE',
    subText: 'Licensed drone pilots and FPV cinematographers, reviewed by a person. Contact them directly.'
  },
  lilac: {
    themeKey: 'lilac',
    name: 'Illustration',
    imgSrc: 'assets/purple_haired_illustrator.webp',
    imgAlt: 'Purple-Haired Illustrator Drawing on a Pouf',
    creativeWord: 'CREATIVE',
    edgeWord: 'EDGE',
    leadDesktop: 'WE FIND THE',
    subText: 'Illustrators, character designers and concept artists. Book them directly, 0% commission.'
  },
  amber: {
    themeKey: 'amber',
    name: 'Film',
    imgSrc: 'assets/smiling_videographer_cinema.webp',
    imgAlt: 'Smiling Videographer with Cinema Camera',
    creativeWord: 'CREATIVE',
    edgeWord: 'EDGE',
    leadDesktop: 'WE FIND THE',
    subText: 'Directors, DPs and camera operators for brand and film shoots. Contact them directly.'
  },
  coral: {
    themeKey: 'coral',
    name: 'VR & Unreal',
    imgSrc: 'assets/vr_adventure_flight_case.webp',
    imgAlt: 'VR Adventure on a Flight Case',
    creativeWord: 'CREATIVE',
    edgeWord: 'EDGE',
    leadDesktop: 'WE FIND THE',
    subText: 'Unreal Engine, VR and motion artists, reviewed by a person. 0% commission.'
  }
};
let currentThemeKey = 'sage';
let autoRotateTimer = null;
const ROTATION_INTERVAL_MS = 3000;
function resetProgressBar() {
  document.querySelectorAll('.theme-timer-progress').forEach(p => {
    p.style.transition = 'none';
    p.style.transform = 'scaleX(0)';
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const activeBtn = document.querySelector(`.theme-capsule-btn[data-theme="${currentThemeKey}"]`);
      if (activeBtn) {
        const p = activeBtn.querySelector('.theme-timer-progress');
        if (p) {
          p.style.transition = `transform ${ROTATION_INTERVAL_MS}ms linear`;
          p.style.transform = 'scaleX(1)';
        }
      }
    });
  });
}
const decodedImages = {};
// Warm the other hero images only after the page has loaded, so the first one gets the bandwidth.
function nxWarmHeroImages() { Object.values(THEME_PRESETS).forEach(d => { const i = new Image(); i.src = d.imgSrc; if (!decodedImages[i.src]) decodedImages[i.src] = i.decode().catch(() => { }); }); }
if (document.readyState === 'complete') setTimeout(nxWarmHeroImages, 200); else window.addEventListener('load', () => setTimeout(nxWarmHeroImages, 200));
function switchTheme(themeKey, isManual = false) {
  if (!THEME_PRESETS[themeKey]) return;
  if (!switchTheme.decoded) {
    switchTheme.latest = themeKey;
    const vpKey = window.innerWidth <= 900 ? 'mobile' : 'desktop';
    const src = localStorage.getItem('custom_img_' + themeKey + '_' + vpKey) || THEME_PRESETS[themeKey].imgSrc;
    const pre = new Image(); pre.src = src;
    decodedImages[pre.src] = decodedImages[pre.src] || pre.decode().catch(() => { });
    decodedImages[pre.src].then(() => requestAnimationFrame(() => {
      if (switchTheme.latest !== themeKey) return; // a newer click won
      switchTheme.decoded = true;
      try { switchTheme(themeKey, isManual); } finally { switchTheme.decoded = false; }
    }));
    return;
  }
  currentThemeKey = themeKey;
  const data = THEME_PRESETS[themeKey];
  const body = document.body;
  const faders = document.querySelectorAll('.theme-fader');
  const img = document.getElementById('heroCharacterSlot');
  const edgeDesktop = document.querySelector('.title-edge');
  const edgeMobile = document.querySelector('.mb-edge');
  const subText = document.querySelector('.hero-subheadline');
  const buttons = document.querySelectorAll('.theme-capsule-btn');
  buttons.forEach(btn => {
    const isActive = btn.getAttribute('data-theme') === themeKey;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  if (window.innerWidth <= 900) {
    const strip = document.querySelector('.character-theme-capsules');
    const activeBtn = strip && strip.querySelector(`.theme-capsule-btn[data-theme="${themeKey}"]`);
    if (strip && activeBtn) {
      const targetLeft = activeBtn.offsetLeft - (strip.clientWidth / 2) + (activeBtn.offsetWidth / 2);
      strip.scrollTo({ left: Math.max(0, targetLeft), behavior: isManual ? 'smooth' : 'auto' });
    }
  }
  resetProgressBar();
  const textBefore = new Map([...faders].map(el => [el, el.textContent]));
  // Theme switch is instant and static (zero animation)
  (() => {
    body.setAttribute('data-theme', themeKey);
    if (img) {
      img.getAnimations().forEach(a => a.cancel());
      img.style.transform = '';
      img.style.opacity = '1';
      const vpKey = window.innerWidth <= 900 ? 'mobile' : 'desktop';
      const customImg = localStorage.getItem('custom_img_' + themeKey + '_' + vpKey);
      img.src = customImg || data.imgSrc;
      img.alt = data.imgAlt;
    }
    const titleCreative = document.querySelector('.title-creative');
    if (titleCreative) titleCreative.textContent = data.creativeWord;
    if (edgeDesktop) edgeDesktop.textContent = data.edgeWord;
    const mbCreative = document.querySelector('.mb-creative');
    if (mbCreative) mbCreative.textContent = data.creativeWord;
    if (edgeMobile) edgeMobile.textContent = data.edgeWord;
    if (subText) subText.textContent = data.subText;
    if (window.restoreCharacterImageEdits) {
      window.restoreCharacterImageEdits(themeKey);
    }
    if (document.body.classList.contains('is-editing') && window.refreshHudForThemeSwitch) {
      window.refreshHudForThemeSwitch();
    }
    faders.forEach(el => {
      el.classList.remove('wheel-text');
    });
  })();
  if (!document.body.classList.contains('is-editing')) {
    startAutoRotation();
  }
}
const heroViewport = document.querySelector('.hero-viewport');
function rotateToNextTheme() {
  if (document.body.classList.contains('is-editing')) return;
  if (heroViewport && heroViewport.classList.contains('nx-offscreen')) return;
  if (window.scrollY >= (window.innerHeight || 900) * 0.92) return;
  const nextIdx = (THEME_KEYS.indexOf(currentThemeKey) + 1) % THEME_KEYS.length;
  switchTheme(THEME_KEYS[nextIdx], false);
}
function startAutoRotation() {
  if (document.body.classList.contains('is-editing')) return;
  if (autoRotateTimer) clearInterval(autoRotateTimer);
  autoRotateTimer = setInterval(rotateToNextTheme, ROTATION_INTERVAL_MS);
}
function stopAutoRotation() {
  if (autoRotateTimer) {
    clearInterval(autoRotateTimer);
    autoRotateTimer = null;
  }
}
document.querySelectorAll('.theme-capsule-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTheme = btn.getAttribute('data-theme');
    if (targetTheme && targetTheme !== currentThemeKey) {
      switchTheme(targetTheme, true);
    }
  });
});
if (heroViewport) {
  heroViewport.addEventListener('mouseleave', () => {
    if (!document.body.classList.contains('is-editing')) {
      startAutoRotation();
      resetProgressBar();
    }
  });
}
startAutoRotation();
resetProgressBar();
/* ── MOBILE QUICK SHARE CONTROL ── */
(function initMobileChrome() {
  const shareBtn = document.getElementById('mobileShareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'Nexus · Find the Creative Edge',
        text: '0% commission creative director & production marketplace.',
        url: window.location.href
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (_) { }
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(window.location.href);
        }
        const origBg = shareBtn.style.background;
        shareBtn.style.background = '#059669';
        setTimeout(() => { shareBtn.style.background = origBg; }, 1200);
      } catch (_) { }
    });
  }
})();
/* ── DRAG & EDIT STUDIO ENGINE (MOBILE & LAPTOP) ── */
(function initDragAndEdit() {
  const toggleBtn = document.getElementById('editorToggle') || document.getElementById('nxEditToggle');
  const hud = document.getElementById('editorHud');
  const hudModeBadge = hud ? hud.querySelector('.hud-mode-badge') : null;
  const hudTargetName = document.getElementById('hudTargetName');
  const hudCoords = document.getElementById('hudCoords');
  const hudClose = document.getElementById('hudClose');
  const hudReset = document.getElementById('hudReset');
  const hudCopyCss = document.getElementById('hudCopyCss');
  const hudFontMinus = document.getElementById('hudFontMinus');
  const hudFontPlus = document.getElementById('hudFontPlus');
  const hudZToggle = document.getElementById('hudZToggle');
  const hudColorCycle = document.getElementById('hudColorCycle');
  const hudImgMinus = document.getElementById('hudImgMinus');
  const hudImgPlus = document.getElementById('hudImgPlus');
  const hudImgRange = document.getElementById('hudImgRange');
  const hudImgScaleVal = document.getElementById('hudImgScaleVal');
  const hudDockUp = document.getElementById('hudDockUp');
  const hudDockDown = document.getElementById('hudDockDown');
  const hudSaveToast = document.getElementById('hudSaveToast');
  let isEditing = false;
  let activeTarget = null;
  let isDragging = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;
  let hasMoved = false;
  const STORAGE_PREFIX = 'dunes_custom_edits_v12_';
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('dunes_custom_edits_v11_') || k.startsWith('dunes_custom_edits_v10_') || k.startsWith('dunes_custom_edits_v9_') || k.startsWith('dunes_custom_edits_v8_') || k.startsWith('dunes_custom_edits_v7_')) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) { }
  function registerSectionImages() {
    document.querySelectorAll('#fees .ct-art-img').forEach((imgEl, idx) => {
      if (!imgEl.dataset.editKey) imgEl.dataset.editKey = `pricing-img-${idx}`;
      imgEl.dataset.editSectionImg = 'true';
    });
    document.querySelectorAll('#how .nx-card-step-img').forEach((imgEl, idx) => {
      if (!imgEl.dataset.editKey) imgEl.dataset.editKey = `step-img-${idx}`;
      imgEl.dataset.editSectionImg = 'true';
    });
    document.querySelectorAll('#roster .nx-talent-card').forEach((cardEl, cardIdx) => {
      const slug = (cardEl.dataset.name || `card-${cardIdx}`).replace(/[^a-z0-9]+/gi, '-');
      const fig = cardEl.querySelector('.pc-breakout-fig');
      if (fig) {
        if (!fig.dataset.editKey) fig.dataset.editKey = `roster-persona-${slug}`;
        fig.dataset.editSectionImg = 'true';
      }
      cardEl.querySelectorAll('.pc-media-wrap img').forEach((reelImg, rIdx) => {
        if (!reelImg.dataset.editKey) reelImg.dataset.editKey = `roster-reel-${slug}-${rIdx}`;
        reelImg.dataset.editSectionImg = 'true';
      });
    });
    document.querySelectorAll('#roster .nx-stage-img').forEach((imgEl, idx) => {
      if (!imgEl.dataset.editKey) imgEl.dataset.editKey = `roster-img-${idx}`;
      imgEl.dataset.editSectionImg = 'true';
    });
  }
  registerSectionImages();
  function isMobileViewport() {
    return window.innerWidth <= 900;
  }
  function getActiveViewport() {
    return isMobileViewport() ? 'mobile' : 'desktop';
  }
  function getStorageKey() {
    return STORAGE_PREFIX + getActiveViewport();
  }
  function getSectionStorageKey() {
    return STORAGE_PREFIX + getActiveViewport() + '_sections';
  }
  function showSavedToast() {
    if (!hudSaveToast) return;
    hudSaveToast.classList.add('show');
    clearTimeout(hudSaveToast._timer);
    hudSaveToast._timer = setTimeout(() => hudSaveToast.classList.remove('show'), 1200);
  }
  function getCharacterDisplayName() {
    if (currentThemeKey === 'sage') return 'Creator Image (Sage)';
    if (currentThemeKey === 'cobalt') return 'Pilot Image (Cobalt)';
    if (currentThemeKey === 'lilac') return 'Purple Illustrator';
    if (currentThemeKey === 'amber') return 'Cinema Videographer';
    if (currentThemeKey === 'coral') return 'Spatial 3D Gamer';
    return 'Character Image';
  }
  const targetMap = {
    'heroCharacterSlot': { el: () => document.getElementById('heroCharacterSlot'), name: 'Character Image', getDisplayName: getCharacterDisplayName, viewport: 'both' },
    'headline-stack': { el: () => document.querySelector('.headline-stack'), name: 'Headline Stack', viewport: 'both' },
    'title-wefind': { el: () => document.querySelector('.title-wefind'), name: 'Word: WE FIND', viewport: 'both' },
    'title-the': { el: () => document.querySelector('.title-the'), name: 'Word: THE', viewport: 'both' },
    'title-creative': { el: () => document.querySelector('.title-creative'), name: 'Word: CREATIVE', viewport: 'both' },
    'title-edge': { el: () => document.querySelector('.title-edge'), name: 'Word: EDGE', viewport: 'both' },
    'hero-subheadline': { el: () => document.querySelector('.hero-subheadline'), name: 'Subtitle Copy', viewport: 'both' },
    'action-row': { el: () => document.querySelector('.action-row'), name: 'CTA Buttons', viewport: 'both' },
    'btn-discover': { el: () => document.querySelector('.btn-discover'), name: 'Discover Talent Button', viewport: 'both' },
    'btn-join': { el: () => document.querySelector('.btn-join'), name: 'Join as Creator Button', viewport: 'both' }
  };
  const defaultTexts = {
    'title-wefind': 'WE FIND',
    'title-the': 'THE',
    'title-creative': 'CREATIVE',
    'title-edge': 'EDGE'
  };
  function updateHudModeBadge() {
    const isMob = isMobileViewport();
    if (hudModeBadge) {
      hudModeBadge.textContent = isMob ? 'Mobile' : 'Laptop';
      hudModeBadge.classList.toggle('is-desktop', !isMob);
      hudModeBadge.title = isMob ? 'Editing Mobile Layout (<= 900px)' : 'Editing Laptop / Desktop Layout (>= 901px)';
    }
    document.body.classList.remove('preview-as-mobile');
  }
  function updateHudChipsForMode() {
    const chipsContainer = document.querySelector('.hud-chips');
    if (!chipsContainer) return;
    chipsContainer.innerHTML = '';
    Object.keys(targetMap).forEach(key => {
      const item = targetMap[key];
      if (item.viewport === 'both' || (isMobileViewport() ? item.viewport === 'mobile' : item.viewport === 'desktop')) {
        const btn = document.createElement('button');
        const isActive = activeTarget && getTargetKey(activeTarget) === key;
        btn.className = 'hud-chip' + (isActive ? ' active' : '');
        btn.type = 'button';
        btn.setAttribute('data-hud-select', key);
        btn.textContent = typeof item.getDisplayName === 'function' ? item.getDisplayName() : item.name;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          selectTarget(key);
        });
        chipsContainer.appendChild(btn);
      }
    });
  }
  function resetElementInline(el) {
    if (!el || el.closest('.nx-film-sticker')) return;
    el.style.left = '';
    el.style.top = '';
    el.style.position = '';
    el.style.fontSize = '';
    el.style.zIndex = '';
    el.style.color = '';
    el.style.scale = '';
    el.style.transformOrigin = '';
    el.style.maxHeight = '';
    el.style.height = '';
    el.style.maxWidth = '';
    el.style.marginBottom = '';
    el.style.marginTop = '';
    el.style.right = '';
    el.style.bottom = '';
    el.removeAttribute('data-dragged');
  }
  function clearAllInlineStyles(includeSections = false) {
    document.querySelectorAll('[data-dragged="true"]').forEach(el => {
      if (el.closest('.nx-film-sticker')) return;
      if (!includeSections && el.dataset.editSectionImg === 'true') return;
      resetElementInline(el);
    });
    Object.keys(targetMap).forEach(key => {
      const el = targetMap[key].el ? targetMap[key].el() : null;
      if (!el) return;
      resetElementInline(el);
      el.querySelectorAll('*').forEach(child => {
        child.style.color = '';
      });
    });
    Object.keys(defaultTexts).forEach(k => {
      const el = targetMap[k] && targetMap[k].el ? targetMap[k].el() : null;
      if (el) el.innerText = defaultTexts[k];
    });
  }
  function getTargetKey(el) {
    if (!el) return null;
    if (el.id === 'heroCharacterSlot') return 'heroCharacterSlot';
    if (el.dataset && el.dataset.editKey) return el.dataset.editKey;
    for (const k of Object.keys(targetMap)) {
      if (targetMap[k].el && targetMap[k].el() === el) return k;
    }
    if (el.id) return el.id;
    const cls = Array.from(el.classList || []).filter(c => !['drag-selected', 'is-switching', 'theme-fader'].includes(c))[0];
    if (cls) return cls;
    return el.tagName.toLowerCase();
  }
  function getReadableName(el, key) {
    if (targetMap[key]) {
      return typeof targetMap[key].getDisplayName === 'function' ? targetMap[key].getDisplayName() : targetMap[key].name;
    }
    if (el.id === 'heroCharacterSlot') return getCharacterDisplayName();
    if (el.classList.contains('ct-art-img')) return el.alt || 'Pricing Illustration';
    if (el.classList.contains('btn-discover')) return 'Button: Discover Talent';
    if (el.classList.contains('btn-join')) return 'Button: Join as Creator';
    if (el.classList.contains('hero-subheadline')) return 'Subtitle Copy';
    return el.tagName.toLowerCase() + (key ? ` (${key})` : '');
  }
  function resolveImageTarget(el) {
    const sticker = el ? el.closest('.nx-film-sticker') : null;
    if (sticker) return sticker;
    if (el && (el.tagName === 'IMG' || el.id === 'heroCharacterSlot')) return el;
    return document.getElementById('heroCharacterSlot');
  }
  function getImageScalePct(el) {
    const imgTarget = resolveImageTarget(el);
    if (!imgTarget) return 100;
    if (imgTarget.classList && imgTarget.classList.contains('nx-film-sticker')) {
      return Math.round((parseFloat(imgTarget.dataset.scale || '1') || 1) * 100);
    }
    const s = parseFloat(imgTarget.style.scale || '1');
    if (!isNaN(s) && s > 0) return Math.round(s * 100);
    return 100;
  }
  function syncImgSizeUI(el) {
    const pct = Math.min(200, Math.max(40, getImageScalePct(el || activeTarget)));
    if (hudImgRange) hudImgRange.value = String(pct);
    if (hudImgScaleVal) hudImgScaleVal.textContent = pct + '%';
  }
  function selectTarget(keyOrEl) {
    let el = null;
    if (typeof keyOrEl === 'string') {
      el = targetMap[keyOrEl] ? targetMap[keyOrEl].el() : document.querySelector(`[data-edit-key="${keyOrEl}"]`) || document.getElementById(keyOrEl) || document.querySelector(`.${keyOrEl}`);
    } else {
      el = keyOrEl;
    }
    if (!el) return;
    document.querySelectorAll('.drag-selected').forEach(n => n.classList.remove('drag-selected'));
    activeTarget = el;
    activeTarget.classList.add('drag-selected');
    const key = getTargetKey(el);
    const displayName = getReadableName(el, key);
    if (hudTargetName) hudTargetName.textContent = displayName;
    document.querySelectorAll('.hud-chip').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-hud-select') === key);
    });
    if (hudZToggle) {
      const z = parseInt(window.getComputedStyle(el).zIndex, 10) || 6;
      hudZToggle.textContent = z >= 12 ? 'Layer: In Front' : 'Layer: Behind';
    }
    syncImgSizeUI(el);
    updateCoordsDisplay();
  }
  function updateCoordsDisplay() {
    if (!hudCoords || !activeTarget) return;
    const left = activeTarget.style.left || 'default';
    const top = activeTarget.style.top || 'default';
    const font = activeTarget.style.fontSize ? ` • ${activeTarget.style.fontSize}` : '';
    const isImg = activeTarget.tagName === 'IMG' || activeTarget.classList.contains('nx-film-sticker');
    const sizeNote = isImg ? ` • ${getImageScalePct(activeTarget)}%` : '';
    if (activeTarget.dataset && activeTarget.dataset.editSectionImg === 'true') {
      hudCoords.textContent = `Section Image • ${getImageScalePct(activeTarget)}%`;
    } else {
      hudCoords.textContent = `X: ${left} | Y: ${top}${font}${sizeNote}`;
    }
  }
  function updateContentEditable(enabled) {
    const allowEdit = Boolean(enabled);
    const textElements = document.querySelectorAll(
      '.hero-viewport h1, .hero-viewport h2, .hero-viewport p, .hero-viewport span, .hero-viewport a, .hero-viewport button, .title-row, .hero-subheadline'
    );
    textElements.forEach(el => {
      if (el.closest('#editorHud, #editorToggle, .character-theme-capsules, .preview-layout-switcher, .mobile-hero-header, #mobileShareBtn')) return;
      if (isMobileViewport() && el.closest('.desktop-only')) return;
      el.contentEditable = allowEdit ? 'true' : 'false';
      el.spellcheck = false;
    });
  }
  function setEditMode(state) {
    isEditing = Boolean(state);
    document.body.classList.toggle('is-editing', isEditing);
    if (toggleBtn) {
      toggleBtn.classList.toggle('active', isEditing);
      const lbl = toggleBtn.querySelector('.edit-label');
      if (lbl) lbl.textContent = isEditing ? 'Editing ON' : 'Edit';
    }
    updateHudModeBadge();
    updateContentEditable(isEditing);
    if (isEditing) {
      stopAutoRotation();
      updateHudChipsForMode();
      selectTarget('heroCharacterSlot');
    } else {
      document.querySelectorAll('.drag-selected').forEach(n => n.classList.remove('drag-selected'));
      activeTarget = null;
      startAutoRotation();
      resetProgressBar();
    }
  }
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setEditMode(!isEditing);
    });
  }
  if (hudClose) {
    hudClose.addEventListener('click', () => setEditMode(false));
  }
  document.addEventListener('click', (e) => {
    if (!isEditing) return;
    if (e.target.closest('#editorToggle, #editorHud, .character-theme-capsules, #mobileShareBtn, .nx-sticker-resizer, .pc-mode-btn, .pc-carousel-arrow')) return;
    if (e.target.closest('.hero-viewport a, .hero-viewport button, #how .nx-step-card, #roster .nx-talent-card, #fees a, #fees button')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
  document.addEventListener('click', (e) => {
    if (!isEditing) return;
    if (e.target.closest('.nx-sticker-resizer')) {
      const sticker = e.target.closest('.nx-film-sticker');
      if (sticker) {
        setTimeout(() => {
          selectTarget(sticker);
          showSavedToast();
        }, 0);
      }
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!isEditing) return;
    if (e.target.closest('#editorToggle, #editorHud, .preview-layout-switcher, .character-theme-capsules, .mobile-hero-header, #mobileNavDrawer, #mobileShareBtn, .nx-sticker-resizer, .pc-mode-btn, .pc-carousel-arrow')) return;
    const sectionImg = e.target.closest('#fees .ct-art-img');
    if (sectionImg) {
      registerSectionImages();
      selectTarget(sectionImg);
      return;
    }
    if (e.target.closest('#fees, #how, #founding')) return;
    const clickedTarget = e.target.closest(
      '#heroCharacterSlot, .title-row, .headline-stack, .hero-subheadline, .btn-discover, .btn-join, .action-row'
    ) || (e.target.closest('.hero-viewport') ? e.target : null);
    if (!clickedTarget || clickedTarget === document.body || clickedTarget === document.documentElement) return;
    selectTarget(clickedTarget);
    startX = e.clientX;
    startY = e.clientY;
    hasMoved = false;
    const parent = clickedTarget.offsetParent || document.body;
    const pRect = parent.getBoundingClientRect();
    const tRect = clickedTarget.getBoundingClientRect();
    const curPos = window.getComputedStyle(clickedTarget).position;
    if (curPos === 'static' || curPos === 'relative') {
      initialLeft = parseFloat(clickedTarget.style.left) || 0;
      initialTop = parseFloat(clickedTarget.style.top) || 0;
    } else {
      initialLeft = parseFloat(clickedTarget.style.left);
      initialTop = parseFloat(clickedTarget.style.top);
      if (isNaN(initialLeft)) initialLeft = tRect.left - pRect.left;
      if (isNaN(initialTop)) initialTop = tRect.top - pRect.top;
    }
    function onPointerMove(pe) {
      const dx = pe.clientX - startX;
      const dy = pe.clientY - startY;
      if (!hasMoved && Math.hypot(dx, dy) > 4) {
        hasMoved = true;
        isDragging = true;
        try { clickedTarget.setPointerCapture(pe.pointerId); } catch (err) { }
      }
      if (hasMoved) {
        pe.preventDefault();
        const pos = window.getComputedStyle(clickedTarget).position;
        if (pos === 'static') clickedTarget.style.position = 'relative';
        clickedTarget.style.left = Math.round(initialLeft + dx) + 'px';
        clickedTarget.style.top = Math.round(initialTop + dy) + 'px';
        clickedTarget.style.right = 'auto';
        clickedTarget.style.bottom = 'auto';
        clickedTarget.setAttribute('data-dragged', 'true');
        updateCoordsDisplay();
      }
    }
    function onPointerUp(pe) {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      try { clickedTarget.releasePointerCapture(pe.pointerId); } catch (err) { }
      if (hasMoved) {
        saveEdits();
      }
      setTimeout(() => { isDragging = false; }, 50);
    }
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
  });
  function adjustFontSize(factor) {
    if (!activeTarget || activeTarget.tagName === 'IMG' || activeTarget.classList.contains('nx-film-sticker')) return;
    const cur = parseFloat(window.getComputedStyle(activeTarget).fontSize);
    const next = Math.round(cur * factor);
    activeTarget.style.fontSize = next + 'px';
    activeTarget.setAttribute('data-dragged', 'true');
    updateCoordsDisplay();
    saveEdits();
  }
  function getImgTransformOrigin(el) {
    if (!el) return 'center center';
    if (el.id === 'heroCharacterSlot') return 'bottom center';
    if (el.classList && el.classList.contains('pc-breakout-fig')) return '50% 95%';
    return 'center center';
  }
  function setElementScalePct(targetEl, rawPct, shouldSave = true) {
    const imgTarget = resolveImageTarget(targetEl);
    if (!imgTarget) return;
    if (activeTarget !== imgTarget) {
      selectTarget(imgTarget);
    }
    if (imgTarget.classList && imgTarget.classList.contains('nx-film-sticker') && typeof imgTarget._setScale === 'function') {
      const clamped = Math.min(200, Math.max(40, Math.round(rawPct)));
      imgTarget._setScale(clamped / 100);
      syncImgSizeUI(imgTarget);
      updateCoordsDisplay();
      if (shouldSave) showSavedToast();
      return;
    }
    const pct = Math.min(200, Math.max(40, Math.round(rawPct)));
    const scaleVal = (pct / 100).toFixed(2);
    if (pct === 100) {
      imgTarget.style.scale = '';
      imgTarget.style.transformOrigin = '';
      if (!imgTarget.style.left && !imgTarget.style.top && !imgTarget.style.maxHeight && !imgTarget.style.zIndex) {
        imgTarget.removeAttribute('data-dragged');
      }
    } else {
      imgTarget.style.transformOrigin = getImgTransformOrigin(imgTarget);
      imgTarget.style.scale = scaleVal;
      imgTarget.setAttribute('data-dragged', 'true');
    }
    syncImgSizeUI(imgTarget);
    updateCoordsDisplay();
    if (shouldSave) {
      if (imgTarget.dataset && imgTarget.dataset.editSectionImg === 'true') {
        saveSectionImageEdits();
      } else {
        saveEdits();
      }
    }
  }
  function nudgeImgScale(deltaPct) {
    const imgTarget = resolveImageTarget(activeTarget);
    if (!imgTarget) return;
    const cur = getImageScalePct(imgTarget);
    setElementScalePct(imgTarget, cur + deltaPct, true);
  }
  function nudgeDock(deltaPx) {
    const actionRow = document.querySelector('.action-row');
    if (!actionRow) return;
    const curMargin = parseFloat(window.getComputedStyle(actionRow).marginBottom) || 0;
    const next = Math.max(0, Math.min(260, curMargin + deltaPx));
    actionRow.style.marginBottom = next + 'px';
    actionRow.setAttribute('data-dragged', 'true');
    saveEdits();
  }
  const hudPickImage = document.getElementById('hudPickImage');
  const hudFileInput = document.getElementById('hudFileInput');
  if (hudPickImage && hudFileInput) {
    hudPickImage.addEventListener('click', () => {
      hudFileInput.click();
    });
    hudFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        const slot = (activeTarget && activeTarget.tagName === 'IMG') ? activeTarget : document.getElementById('heroCharacterSlot');
        if (slot) slot.src = dataUrl;
        try {
          if (slot && slot.id === 'heroCharacterSlot') {
            localStorage.setItem('custom_img_' + currentThemeKey + '_' + getActiveViewport(), dataUrl);
          }
        } catch (e) { }
        showSavedToast();
      };
      reader.readAsDataURL(file);
    });
  }
  if (hudFontPlus) hudFontPlus.addEventListener('click', () => adjustFontSize(1.08));
  if (hudFontMinus) hudFontMinus.addEventListener('click', () => adjustFontSize(0.92));
  if (hudImgMinus) hudImgMinus.addEventListener('click', () => nudgeImgScale(-6));
  if (hudImgPlus) hudImgPlus.addEventListener('click', () => nudgeImgScale(6));
  if (hudImgRange) {
    hudImgRange.addEventListener('input', () => setElementScalePct(activeTarget, +hudImgRange.value, false));
    hudImgRange.addEventListener('change', () => setElementScalePct(activeTarget, +hudImgRange.value, true));
  }
  if (hudImgScaleVal) {
    hudImgScaleVal.addEventListener('click', () => setElementScalePct(activeTarget, 100, true));
  }
  if (hudDockUp) hudDockUp.addEventListener('click', () => nudgeDock(6));
  if (hudDockDown) hudDockDown.addEventListener('click', () => nudgeDock(-6));
  if (hudZToggle) {
    hudZToggle.addEventListener('click', () => {
      if (!activeTarget) return;
      const curZ = parseInt(window.getComputedStyle(activeTarget).zIndex, 10) || 6;
      const nextZ = curZ >= 12 ? 3 : 16;
      activeTarget.style.zIndex = nextZ;
      activeTarget.setAttribute('data-dragged', 'true');
      hudZToggle.textContent = nextZ >= 12 ? 'Layer: In Front' : 'Layer: Behind';
      saveEdits();
    });
  }
  if (hudColorCycle) {
    hudColorCycle.addEventListener('click', () => {
      if (!activeTarget) return;
      const colors = ['#0F172A', '#E9520D', '#FF384D', '#FFFFFF', '#0B132B'];
      const cur = activeTarget.style.color || window.getComputedStyle(activeTarget).color;
      const next = colors[(colors.indexOf(cur) + 1) % colors.length] || colors[0];
      activeTarget.style.color = next;
      activeTarget.querySelectorAll('*').forEach(n => n.style.color = next);
      activeTarget.setAttribute('data-dragged', 'true');
      hudColorCycle.textContent = next === '#0F172A' ? 'Color: Dark' : (next === '#FFFFFF' ? 'Color: White' : 'Color: Accent');
      saveEdits();
    });
  }
  if (hudCopyCss) {
    hudCopyCss.addEventListener('click', () => {
      if (!activeTarget) return;
      const key = getTargetKey(activeTarget);
      let sel = '.' + key;
      if (activeTarget.id) sel = '#' + activeTarget.id;
      else if (activeTarget.dataset && activeTarget.dataset.editKey) sel = `[data-edit-key="${key}"]`;
      const top = activeTarget.style.top || 'auto';
      const left = activeTarget.style.left || 'auto';
      const font = activeTarget.style.fontSize || '';
      const z = activeTarget.style.zIndex || '';
      const col = activeTarget.style.color || '';
      const mb = activeTarget.style.marginBottom || '';
      const mt = activeTarget.style.marginTop || '';
      const maxH = activeTarget.style.maxHeight || '';
      const sc = activeTarget.style.scale || (activeTarget.dataset && activeTarget.dataset.scale && activeTarget.dataset.scale !== '1' ? activeTarget.dataset.scale : '');
      let rules = '';
      if (activeTarget.style.top || activeTarget.style.left) rules += `  top: ${top};\n  left: ${left};\n`;
      if (sc) rules += `  scale: ${sc};\n`;
      if (font) rules += `  font-size: ${font};\n`;
      if (col) rules += `  color: ${col};\n`;
      if (mb) rules += `  margin-bottom: ${mb};\n`;
      if (mt) rules += `  margin-top: ${mt};\n`;
      if (maxH) rules += `  max-height: ${maxH};\n`;
      if (z) rules += `  z-index: ${z};\n`;
      if (!rules) rules = `  /* Default sizing (scale: 1) */\n`;
      const mediaRule = isMobileViewport() ? '@media (max-width: 900px)' : '@media (min-width: 901px)';
      const css = `/* ${isMobileViewport() ? 'Mobile' : 'Laptop'} Overrides (${currentThemeKey}) */\n${mediaRule} {\n  ${sel} {\n${rules}  }\n}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(css).then(showCopiedNotice);
      } else {
        const ta = document.createElement('textarea');
        ta.value = css;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showCopiedNotice();
      }
    });
  }
  function showCopiedNotice() {
    const label = hudCopyCss.querySelector('span');
    const orig = label ? label.textContent : hudCopyCss.textContent;
    if (label) label.textContent = '✓ Copied!';
    else hudCopyCss.textContent = '✓ Copied!';
    hudCopyCss.style.background = '#059669';
    setTimeout(() => {
      if (label) label.textContent = orig;
      else hudCopyCss.textContent = orig;
      hudCopyCss.style.background = '';
    }, 1500);
  }
  if (hudReset) {
    hudReset.addEventListener('click', () => {
      const vpName = isMobileViewport() ? 'Mobile (<= 900px)' : 'Laptop (>= 901px)';
      if (confirm(`Reset custom size & position adjustments for ${vpName} on this theme?`)) {
        try {
          localStorage.removeItem(getStorageKey() + '_' + currentThemeKey);
          localStorage.removeItem(getStorageKey() + '_' + currentThemeKey + '_texts');
          localStorage.removeItem(getSectionStorageKey());
          localStorage.removeItem('custom_img_' + currentThemeKey + '_' + getActiveViewport());
        } catch (e) { }
        const slot = document.getElementById('heroCharacterSlot');
        if (slot && THEME_PRESETS[currentThemeKey]) {
          slot.src = THEME_PRESETS[currentThemeKey].imgSrc;
        }
        const subEl = document.querySelector('.hero-subheadline');
        if (subEl && THEME_PRESETS[currentThemeKey]) {
          subEl.textContent = THEME_PRESETS[currentThemeKey].subText;
        }
        clearAllInlineStyles(true);
        restoreEdits(true);
        syncImgSizeUI(activeTarget);
        updateCoordsDisplay();
        showSavedToast();
      }
    });
  }
  function saveTextEdits(el) {
    const tKey = currentThemeKey;
    const key = getTargetKey(el);
    if (!key) return;
    let texts = {};
    try {
      const raw = localStorage.getItem(getStorageKey() + '_' + tKey + '_texts');
      if (raw) texts = JSON.parse(raw);
    } catch (e) { }
    texts[key] = el.innerHTML;
    try {
      localStorage.setItem(getStorageKey() + '_' + tKey + '_texts', JSON.stringify(texts));
    } catch (e) { }
    showSavedToast();
  }
  function restoreTextEdits() {
    const tKey = currentThemeKey;
    try {
      const raw = localStorage.getItem(getStorageKey() + '_' + tKey + '_texts');
      if (!raw) return;
      const texts = JSON.parse(raw);
      Object.keys(texts).forEach(key => {
        if (key.includes('roster') || key.includes('sticker')) return;
        let el = null;
        if (targetMap[key] && targetMap[key].el) el = targetMap[key].el();
        if (!el && document.getElementById(key)) el = document.getElementById(key);
        if (!el) el = document.querySelector(`[data-edit-key="${key}"], .${key}`);
        if (el && texts[key] && !el.closest('#roster')) {
          el.innerHTML = texts[key];
        }
      });
    } catch (e) { }
  }
  function saveSectionImageEdits() {
    const data = {};
    document.querySelectorAll('[data-edit-section-img="true"]').forEach(imgEl => {
      const k = imgEl.dataset.editKey;
      if (k && imgEl.style.scale) {
        data[k] = { scale: imgEl.style.scale, transformOrigin: imgEl.style.transformOrigin || getImgTransformOrigin(imgEl) };
      }
    });
    try {
      if (Object.keys(data).length > 0) {
        localStorage.setItem(getSectionStorageKey(), JSON.stringify(data));
      } else {
        localStorage.removeItem(getSectionStorageKey());
      }
    } catch (e) { }
    showSavedToast();
  }
  function restoreSectionImageEdits() {
    try {
      const raw = localStorage.getItem(getSectionStorageKey());
      if (!raw) return;
      const data = JSON.parse(raw);
      Object.keys(data).forEach(key => {
        const el = document.querySelector(`[data-edit-key="${key}"]`);
        if (el && data[key] && data[key].scale) {
          el.style.transformOrigin = data[key].transformOrigin || getImgTransformOrigin(el);
          el.style.scale = data[key].scale;
          el.setAttribute('data-dragged', 'true');
        }
      });
    } catch (e) { }
  }
  function saveEdits() {
    const tKey = currentThemeKey;
    let data = {};
    document.querySelectorAll('[data-dragged="true"]').forEach(el => {
      if (el.closest('.nx-film-sticker') || el.dataset.editSectionImg === 'true') return;
      const key = getTargetKey(el);
      if (key && !key.includes('roster') && !key.includes('sticker')) {
        data[key] = {
          left: el.style.left || '',
          top: el.style.top || '',
          fontSize: el.style.fontSize || '',
          zIndex: el.style.zIndex || '',
          color: el.style.color || '',
          scale: el.style.scale || '',
          transformOrigin: el.style.transformOrigin || '',
          maxHeight: el.style.maxHeight || '',
          maxWidth: el.style.maxWidth || '',
          marginBottom: el.style.marginBottom || '',
          marginTop: el.style.marginTop || ''
        };
      }
    });
    const charSlot = document.getElementById('heroCharacterSlot');
    if (charSlot && (charSlot.hasAttribute('data-dragged') || charSlot.style.left || charSlot.style.top || charSlot.style.scale || charSlot.style.maxHeight || charSlot.style.zIndex)) {
      data['heroCharacterSlot'] = {
        left: charSlot.style.left || '',
        top: charSlot.style.top || '',
        bottom: charSlot.style.bottom || '',
        scale: charSlot.style.scale || '',
        transformOrigin: charSlot.style.transformOrigin || '',
        maxHeight: charSlot.style.maxHeight || '',
        maxWidth: charSlot.style.maxWidth || '',
        zIndex: charSlot.style.zIndex || ''
      };
    }
    try {
      if (Object.keys(data).length > 0) {
        localStorage.setItem(getStorageKey() + '_' + tKey, JSON.stringify(data));
      } else {
        localStorage.removeItem(getStorageKey() + '_' + tKey);
      }
    } catch (e) { }
    showSavedToast();
  }
  function restoreEdits(includeSections = false) {
    clearAllInlineStyles(includeSections);
    const tKey = currentThemeKey;
    const charSlot = document.getElementById('heroCharacterSlot');
    try {
      let customImg = localStorage.getItem('custom_img_' + tKey + '_' + getActiveViewport());
      if (customImg && (customImg.includes('_bust.webp') || customImg.includes('character_drone_operator'))) customImg = null;
      if (charSlot) {
        charSlot.src = customImg || (THEME_PRESETS[tKey] ? THEME_PRESETS[tKey].imgSrc : charSlot.src);
      }
      restoreTextEdits();
      if (includeSections) {
        restoreSectionImageEdits();
      }
      const raw = localStorage.getItem(getStorageKey() + '_' + tKey);
      if (raw) {
        const data = JSON.parse(raw);
        Object.keys(data).forEach(key => {
          if (key.includes('roster') || key.includes('sticker')) return;
          let el = null;
          if (targetMap[key] && targetMap[key].el) el = targetMap[key].el();
          if (!el && document.getElementById(key)) el = document.getElementById(key);
          if (!el) el = document.querySelector(`[data-edit-key="${key}"], .${key}`);
          if (el && data[key] && !el.closest('#roster')) {
            const d = data[key];
            const hasCustom = Boolean(d.left || d.top || d.bottom || d.fontSize || d.zIndex || d.color || d.scale || d.maxHeight || d.maxWidth || d.marginBottom || d.marginTop);
            if (!hasCustom) return;
            if (d.left) el.style.left = d.left;
            if (d.top) el.style.top = d.top;
            if (d.bottom) el.style.bottom = d.bottom;
            if (d.fontSize) el.style.fontSize = d.fontSize;
            if (d.zIndex) el.style.zIndex = d.zIndex;
            if (d.color) {
              el.style.color = d.color;
              el.querySelectorAll('*').forEach(n => n.style.color = d.color);
            }
            if (d.scale) {
              el.style.transformOrigin = d.transformOrigin || getImgTransformOrigin(el);
              el.style.scale = d.scale;
            }
            if (d.maxHeight) el.style.maxHeight = d.maxHeight;
            if (d.maxWidth) el.style.maxWidth = d.maxWidth;
            if (d.marginBottom) el.style.marginBottom = d.marginBottom;
            if (d.marginTop) el.style.marginTop = d.marginTop;
            if (d.left || d.top) {
              const pos = window.getComputedStyle(el).position;
              if (pos === 'static') el.style.position = 'relative';
            }
            el.setAttribute('data-dragged', 'true');
          }
        });
      }
    } catch (err) {
      console.warn('Failed restoring edits', err);
    }
    if (isEditing) syncImgSizeUI(activeTarget);
  }
  window.restoreCharacterImageEdits = () => restoreEdits(false);
  window.refreshHudForThemeSwitch = function () {
    if (!isEditing) return;
    updateHudChipsForMode();
    if (activeTarget) selectTarget(activeTarget);
    else selectTarget('heroCharacterSlot');
  };
  document.addEventListener('input', (e) => {
    if (!isEditing) return;
    if (e.target.closest('#editorToggle, #editorHud, .preview-layout-switcher, .character-theme-capsules, .mobile-hero-header, #mobileShareBtn')) return;
    saveTextEdits(e.target);
  });
  let lastViewport = getActiveViewport();
  window.addEventListener('resize', () => {
    const currentViewport = getActiveViewport();
    if (currentViewport !== lastViewport) {
      lastViewport = currentViewport;
      updateHudModeBadge();
      restoreEdits(true);
      updateHudChipsForMode();
      if (isEditing) {
        updateContentEditable(true);
        selectTarget('heroCharacterSlot');
      }
    }
  });
  updateHudModeBadge();
  updateHudChipsForMode();
  restoreEdits(true);
  const syncDynamicRosterImages = () => {
    registerSectionImages();
    restoreSectionImageEdits();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncDynamicRosterImages);
  } else {
    setTimeout(syncDynamicRosterImages, 0);
  }
  const rosterGridEl = document.querySelector('#roster .nx-talent-grid');
  if (rosterGridEl) {
    new MutationObserver(syncDynamicRosterImages).observe(rosterGridEl, { childList: true });
  }
})();
// ── MASTER ANIME.JS SECTION SCROLL & NAVIGATION ENGINE (ANIME.JS V4) ──
(function initAnimeSectionTransitions() {
  const secOrder = ['hero', 'showcase', 'join', 'fees', 'how', 'founding'];
  let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
  let isTransitioning = false;
  let activeScrollAnim = null;
  const animatedSections = new Set();
  let lastNavTarget = '';

  function updateNav(targetId) {
    const isHero = targetId === 'hero';
    document.querySelectorAll('.nx-snav-links a').forEach(a => {
      const isActive = a.getAttribute('href') === '#' + targetId;
      a.classList.toggle('is-active', isActive);
      if (isActive && targetId !== lastNavTarget && window.anime && typeof window.anime.animate === 'function') {
        window.anime.animate(a, {
          scale: [0.94, 1],
          duration: 220,
          ease: 'out(1.675)',
          onComplete: () => { a.style.transform = ''; }
        });
      }
    });
    document.querySelectorAll('#nxMobileBottomNav a').forEach(a => {
      const href = a.getAttribute('href');
      const isMatch = href === '#' + targetId || (isHero && href === '#showcase');
      a.classList.toggle('is-active', isMatch);
      a.setAttribute('aria-current', isMatch ? 'page' : 'false');
    });
    if (history.replaceState && targetId !== lastNavTarget) {
      const newHash = isHero ? '' : '#' + targetId;
      if (window.location.hash !== newHash) {
        history.replaceState(null, '', newHash || window.location.pathname + window.location.search);
      }
    }
    lastNavTarget = targetId;
  }

  function getActiveSection() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollY < window.innerHeight * 0.35) {
      return document.getElementById('hero') || document.querySelector('.hero-viewport');
    }
    if ((window.innerHeight + scrollY) >= document.documentElement.scrollHeight - 50) {
      return document.getElementById(secOrder[secOrder.length - 1]);
    }
    const vpPoint = window.innerHeight * 0.42;
    for (let i = 1; i < secOrder.length; i++) {
      const el = document.getElementById(secOrder[i]);
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.top <= vpPoint && r.bottom > vpPoint) return el;
      }
    }
    return document.getElementById(secOrder[1]) || document.getElementById('hero');
  }

  function getSectionScrollTarget(el) {
    if (!el || el.id === 'hero' || el.classList.contains('hero-viewport')) return 0;
    let top = 0;
    let cur = el;
    while (cur) {
      top += cur.offsetTop;
      cur = cur.offsetParent;
    }
    const isMobile = window.innerWidth <= 900;
    const topOffset = isMobile ? 16 : 76;
    return Math.max(0, top - topOffset);
  }

  const getRevealItems = (secId) => {
    const el = document.getElementById(secId) || (secId === 'hero' ? document.querySelector('.hero-viewport') : null);
    if (!el) return [];
    if (secId === 'hero') {
      return Array.from(el.querySelectorAll('.headline-stack, .hero-subheadline, .action-row, #heroCharacterSlot'));
    } else if (secId === 'showcase') {
      return Array.from(el.querySelectorAll('.cr-head > *, .dir-bar, .lz-wrap'));
    } else if (secId === 'join') {
      // Strictly exclude .jn-tabs to protect its native centered flex layout
      return Array.from(el.querySelectorAll('.jn-head > *, .jn-card'));
    } else if (secId === 'fees') {
      return Array.from(el.querySelectorAll('.ct-deck-head > *, .ct-calc-bar, .ct-card'));
    } else if (secId === 'how') {
      return Array.from(el.querySelectorAll('.nx-how-head > *, .nx-pipe-conduit, .nx-how-card'));
    } else if (secId === 'founding') {
      return Array.from(el.querySelectorAll('.nx-found-banner, .nx-found-cta-col'));
    }
    return [];
  };

  function animateSectionStart(secId, isInstant = false) {
    const el = document.getElementById(secId) || (secId === 'hero' ? document.querySelector('.hero-viewport') : null);
    if (!el) return;
    if (animatedSections.has(secId)) return;
    animatedSections.add(secId);
    el.dataset.revealed = '1';

    // Trigger any child rolling odometers immediately at section start
    if (typeof window.__nxAnimateCounter === 'function') {
      try {
        el.querySelectorAll('.nx-count:not([data-counted])').forEach(c => window.__nxAnimateCounter(c));
      } catch (_) {}
    }

    // Section choreography (js/section-motion.js): if present, it plays this section's entrance.
    if (secId !== 'hero') {
      if (isInstant && typeof window.__nxSectionReveal === 'function') window.__nxSectionReveal(secId);
      if (!isInstant && typeof window.__nxSectionEntrance === 'function' && window.__nxSectionEntrance(secId)) return;
    }

    const items = getRevealItems(secId);

    if (isInstant) {
      items.forEach(it => {
        if (it && it.style) {
          it.style.transform = '';
          it.style.opacity = '';
        }
      });
      return;
    }

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !window.anime || typeof window.anime.animate !== 'function') {
      items.forEach(it => {
        if (it && it.style) {
          it.style.transform = '';
          it.style.opacity = '';
        }
      });
      return;
    }

    if (items && items.length) {
      window.anime.animate(items, {
        translateY: [28, 0],
        opacity: [0, 1],
        duration: 580,
        delay: window.anime.stagger(45),
        ease: 'out(1.675)',
        onComplete: (a) => {
          try {
            if (window.anime && typeof window.anime.cleanInlineStyles === 'function') {
              window.anime.cleanInlineStyles(a);
            }
          } catch (_) {}
        }
      });
    }
  }

  function executeSectionSlide(targetId) {
    const targetEl = document.getElementById(targetId) || (targetId === 'hero' ? document.querySelector('.hero-viewport') : null);
    if (!targetEl) return;
    const topPos = getSectionScrollTarget(targetEl);
    
    const curY = window.pageYOffset || document.documentElement.scrollTop;
    if (Math.abs(curY - topPos) < 10) return;

    updateNav(targetId);

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !window.anime || typeof window.anime.animate !== 'function') {
      window.scrollTo({ top: topPos, behavior: 'smooth' });
      return;
    }

    if (activeScrollAnim && activeScrollAnim.pause) {
      try { activeScrollAnim.pause(); } catch (e) {}
    }

    isTransitioning = true;
    const scrollObj = { y: curY };
    activeScrollAnim = window.anime.animate(scrollObj, {
      y: topPos,
      duration: 480,
      ease: 'out(1.675)',
      onUpdate: () => window.scrollTo({ top: scrollObj.y, behavior: 'instant' }),   // 'instant': page CSS has scroll-behavior:smooth, which would stall this animation
      onComplete: () => {
        isTransitioning = false;
        activeScrollAnim = null;
        updateNav(targetId);
        animateSectionStart(targetId);
      }
    });
  }

  function setupAnimeScrollReveals() {
    if (!('IntersectionObserver' in window)) return;

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const target = entry.target;
        const secId = target.id || (target.classList.contains('hero-viewport') ? 'hero' : '');
        if (!secId) return;

        animateSectionStart(secId);
        revealObserver.unobserve(target);
      });
    }, { threshold: 0.04, rootMargin: '0px 0px 40px 0px' });

    secOrder.forEach(id => {
      const el = document.getElementById(id) || (id === 'hero' ? document.querySelector('.hero-viewport') : null);
      if (el && !animatedSections.has(id)) {
        revealObserver.observe(el);
      }
    });
  }

  // Clear any lingering animation transforms from sections and their children
  secOrder.forEach(id => {
    const el = document.getElementById(id) || (id === 'hero' ? document.querySelector('.hero-viewport') : null);
    if (el) {
      el.style.transform = '';
      el.style.opacity = '';
    }
  });

  // Bind sticky nav links
  document.querySelectorAll('.nx-snav-links a[href^="#"], a.nx-snav-brand').forEach(link => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        executeSectionSlide(href.slice(1));
      }
    });
  });

  // Master Scroll Engine: RAF-throttled continuous focal tracking (zero drift, 60fps)
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    const y = window.pageYOffset || document.documentElement.scrollTop;
    window._nxScrollDir = y >= lastScrollY ? 'down' : 'up';
    lastScrollY = y;

    if (scrollTicking || isTransitioning) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      scrollTicking = false;
      if (isTransitioning) return;
      const active = getActiveSection();
      if (!active) return;
      const secId = active.id || (active.classList.contains('hero-viewport') ? 'hero' : '');
      if (secId && secId !== lastNavTarget) {
        updateNav(secId);
      }
    });
  }, { passive: true });

  let initialRunDone = false;
  function checkInitial() {
    setupAnimeScrollReveals();
    if (initialRunDone) return;
    initialRunDone = true;

    const curScroll = window.scrollY || window.pageYOffset || 0;
    if (curScroll < 120) {
      // Trigger Hero initial entrance
      animateSectionStart('hero');
    }

    const hashId = window.location.hash.slice(1);
    if (hashId && (document.getElementById(hashId) || hashId === 'hero')) {
      executeSectionSlide(hashId);
    } else {
      const syncActive = () => {
        const active = getActiveSection();
        if (active) {
          const id = active.id || (active.classList.contains('hero-viewport') ? 'hero' : '');
          if (id) updateNav(id);
        }
      };
      syncActive();
      requestAnimationFrame(syncActive);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkInitial);
  } else {
    setTimeout(checkInitial, 50);
  }
  window.addEventListener('load', checkInitial);

  window.executeSectionSlide = executeSectionSlide;
  window.animateSectionContent = () => {};
})();

// Explicit global bindings
window.setCharacterImage = setCharacterImage;
