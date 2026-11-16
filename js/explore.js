/**
 * Nexus Directory & Talent Explorer Engine (/explore)
 * High-performance faceted filtering, video reel hover preview,
 * localStorage shortlist drawer, and direct lead inquiry modal.
 */
(function () {
  'use strict';

  const esc = (t) => String(t || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

  /* ── 1. CURATED 34-CREATOR DATASET ── */
  const P = 'assets/cinema_posters/';
  const RAW_CREATORS = window.NEXUS_CREATORS || [];   // shared list: js/creators-data.js

  // Some sample stills are tiny (400×480) and look blurry on a card: swap them for sharp photos of the same craft.
  const SHARP = {
    film: ['assets/editorial_cinema_still.webp', P + 'roster_david_focus_rig.webp', P + 'poster_0_director.webp', 'assets/cinema_still_crop.webp'],
    art: [P + 'roster_valerie_couture.webp', P + 'poster_2_design.webp', P + 'roster_clara_venice.webp', P + 'roster_sofia_gaffer.webp'],
    d3: [P + 'poster_4_cgi.webp', P + 'poster_2_design.webp'],
    aerial: [P + 'poster_1_drone.webp', P + 'roster_maya_aerial.webp'],
    action: [P + 'roster_nova_pursuit.webp', P + 'roster_axel_cablecam.webp']
  };
  const sharpTurn = {};
  const CARD_COPIES = new Set(['assets/cinema_still_crop.webp', 'assets/editorial_cinema_still.webp', P + 'poster_0_director.webp', P + 'poster_1_drone.webp', P + 'poster_2_design.webp', P + 'poster_4_cgi.webp', P + 'roster_axel_cablecam.webp', P + 'roster_clara_venice.webp', P + 'roster_david_focus_rig.webp', P + 'roster_maya_aerial.webp', P + 'roster_nova_pursuit.webp', P + 'roster_sofia_gaffer.webp', P + 'roster_valerie_couture.webp', P + 'pictura_cyan_director.webp']);
  function pickImage(c) {
    let src = c.src;
    if (/pictura_(?!cyan_director)/.test(src) && SHARP[c.cat]) {
      const pool = SHARP[c.cat];
      const i = (sharpTurn[c.cat] = (sharpTurn[c.cat] || 0) + 1);
      src = pool[(i - 1) % pool.length];
    }
    return CARD_COPIES.has(src) ? 'assets/card/' + src.slice(7) : src;
  }

  // Process data with IDs and numerical rate
  const CREATORS = RAW_CREATORS.map((c, idx) => {
    const numRate = parseInt(c.rate.replace(/[^0-9]/g, ''), 10) || 500;
    const id = c.creator.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return {
      ...c,
      src: pickImage(c),
      id,
      index: idx,
      numericRate: numRate
    };
  });

  // Spread out repeated photos so the same one never sits next to itself (or right above itself)
  (function spreadPhotos(list) {
    for (let i = 1; i < list.length; i++) {
      const clash = (k) => [1, 2, 3].some((d) => k - d >= 0 && list[k - d].src === list[k].src);
      if (!clash(i)) continue;
      for (let j = i + 1; j < list.length; j++) {
        [list[i], list[j]] = [list[j], list[i]];
        if (!clash(i)) break;
        [list[i], list[j]] = [list[j], list[i]];
      }
    }
    list.forEach((c, k) => { c.index = k; });
  })(CREATORS);

  /* ── 2. STATE ── */
  const state = {
    craft: 'all',
    search: '',
    city: 'all',
    rate: 'all',
    sort: 'recommended',
    selectedGear: new Set(),
    shortlist: new Set()
  };

  // Load shortlist from localStorage
  const SHORTLIST_STORAGE_KEY = 'nexus_shortlist_v1';
  try {
    const saved = localStorage.getItem(SHORTLIST_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => state.shortlist.add(id));
      }
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }

  function saveShortlist() {
    try {
      localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(Array.from(state.shortlist)));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  /* ── 3. DOM ELEMENTS ── */
  const gridEl = document.getElementById('exploreGrid');
  const searchInput = document.getElementById('exploreSearchInput');
  const searchClearBtn = document.getElementById('exploreSearchClear');
  const craftTabs = document.getElementById('craftTabs');
  const cityFilter = document.getElementById('cityFilter');
  const rateFilter = document.getElementById('rateFilter');
  const sortFilter = document.getElementById('sortFilter');
  const gearChips = document.getElementById('gearChips');
  const filterSummary = document.getElementById('filterSummary');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const shortlistBadgeCount = document.getElementById('shortlistBadgeCount');
  const shortlistDrawerCount = document.getElementById('shortlistDrawerCount');
  const shortlistToggleBtn = document.getElementById('shortlistToggleBtn');
  const shortlistBackdrop = document.getElementById('shortlistBackdrop');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const shortlistList = document.getElementById('shortlistList');
  const inquireShortlistBtn = document.getElementById('inquireShortlistBtn');
  const inquiryModal = document.getElementById('inquiryModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const inquiryForm = document.getElementById('inquiryForm');
  const inquiryCreatorName = document.getElementById('inquiryCreatorName');
  const inquiryModalTitle = document.getElementById('inquiryModalTitle');
  const inquiryModalSub = document.getElementById('inquiryModalSub');
  const toastEl = document.getElementById('exploreToast');

  /* ── 4. INITIALIZE FILTERS & DROPDOWNS ── */
  function initFilters() {
    // Populate city options alphabetically
    const cities = Array.from(new Set(CREATORS.map((c) => c.city))).sort();
    cities.forEach((city) => {
      const opt = document.createElement('option');
      opt.value = city;
      opt.textContent = city;
      cityFilter.appendChild(opt);
    });

    // Populate category counts
    const counts = { all: CREATORS.length, film: 0, aerial: 0, d3: 0, art: 0, action: 0 };
    CREATORS.forEach((c) => {
      if (counts[c.cat] !== undefined) counts[c.cat]++;
    });

    Object.keys(counts).forEach((cat) => {
      const el = document.getElementById('count-' + cat);
      if (el) el.textContent = counts[cat];
    });

    const statTotal = document.getElementById('statTotalCreators');
    if (statTotal) statTotal.textContent = CREATORS.length;

    updateShortlistBadges();
  }

  /* ── 5. FILTERING & SORTING LOGIC ── */
  function getFilteredCreators() {
    return CREATORS.filter((item) => {
      // Craft tab filter
      if (state.craft !== 'all' && item.cat !== state.craft) return false;

      // City filter
      if (state.city !== 'all' && item.city !== state.city) return false;

      // Rate bracket filter
      if (state.rate === 'under-550' && item.numericRate >= 550) return false;
      if (state.rate === '550-700' && (item.numericRate < 550 || item.numericRate > 700)) return false;
      if (state.rate === 'over-700' && item.numericRate <= 700) return false;

      // Gear chips filter (if any gear chips are toggled, creator must have at least one)
      if (state.selectedGear.size > 0) {
        const matchesGear = Array.from(state.selectedGear).some((g) =>
          item.tags.some((tag) => tag.toLowerCase().includes(g.toLowerCase()))
        );
        if (!matchesGear) return false;
      }

      // Search query (debounced omnibox)
      if (state.search.trim()) {
        const q = state.search.toLowerCase().trim();
        const inName = item.creator.toLowerCase().includes(q);
        const inCraft = item.craft.toLowerCase().includes(q);
        const inCity = item.city.toLowerCase().includes(q);
        const inBio = item.bio.toLowerCase().includes(q);
        const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!inName && !inCraft && !inCity && !inBio && !inTags) return false;
      }

      return true;
    }).sort((a, b) => {
      if (state.sort === 'rate-asc') return a.numericRate - b.numericRate;
      if (state.sort === 'rate-desc') return b.numericRate - a.numericRate;
      if (state.sort === 'name-asc') return a.creator.localeCompare(b.creator);
      return a.index - b.index; // 'recommended' preserves curated sequence
    });
  }

  const WS_SVGS = {
      check: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      star: '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2l2.92 6.26 6.88.85-5.08 4.74 1.32 6.8L12 17.52l-6.04 3.33 1.32-6.8L2.2 9.31l6.88-.85L12 2.2z"/></svg>',
      arrow: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
      save: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
    };

  /* ── 6. RENDER DIRECTORY CARDS ── */
  function renderGrid() {
    const list = getFilteredCreators();

    // Update filter summary text
    if (filterSummary) {
      filterSummary.innerHTML = `Showing <b>${list.length}</b> ${list.length === 1 ? 'creator' : 'creators'}`;
    }

    // Toggle reset filters button visibility
    const isFiltered = state.craft !== 'all' ||
      state.city !== 'all' ||
      state.rate !== 'all' ||
      state.search.trim() !== '' ||
      state.selectedGear.size > 0;
    if (resetFiltersBtn) {
      resetFiltersBtn.style.display = isFiltered ? 'inline-block' : 'none';
    }

    // Empty state
    if (list.length === 0) {
      gridEl.innerHTML = `
        <div class="nx-empty-state" style="grid-column: 1 / -1;">
          <h2 class="nx-empty-title">No one matches that yet</h2>
          <p class="nx-empty-desc">Try another craft, a wider rate, or a different search.</p>
          <button type="button" class="nx-btn-inquire-all" style="max-width: 220px; margin: 0 auto;" id="emptyResetBtn">Reset filters</button>
        </div>
      `;
      const btn = document.getElementById('emptyResetBtn');
      if (btn) btn.addEventListener('click', resetAllFilters);
      return;
    }

    // Build cards HTML
    const checkSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;
    const bookmarkSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;

    gridEl.innerHTML = list.map((item, idx) => {
      const isSaved = state.shortlist.has(item.id);
      const hasReel = Boolean(item.reel);
      const rateParts = String(item.rate || '').match(/^(\$?[\d,]+)(.*)$/);
      const rateHtml = rateParts
        ? esc(rateParts[1]) + '<small>' + esc(rateParts[2]) + '</small>'
        : esc(item.rate);
      const firstName = (item.creator || 'Talent').split(' ')[0];

      return `
        <article class="dir-card" data-creator-id="${esc(item.id)}" role="button" tabindex="0" aria-label="${esc(item.creator)} — ${esc(item.craft)} (${esc(item.rate)})">
          <div class="ws-stage">
            <img src="${esc(item.src)}" alt="${esc(item.creator)} work still" loading="lazy" decoding="async" draggable="false">
            ${hasReel ? `<video muted playsinline loop preload="none" src="${esc(item.reel)}"></video>` : ''}
            <span class="ws-hud ${hasReel ? '' : 'is-still'}" aria-hidden="true">
              <span class="ws-hud-dot"></span>
              <span>${hasReel ? 'Reel' : 'Photo'}</span>
            </span>
            <span class="ws-price">${rateHtml}</span>
          </div>
          <div class="ws-body">
            <div class="ws-kicker-row">
              <span class="ws-kicker">${esc(item.craft)} · ${esc(item.city)}</span>
              <span class="ws-sample">Sample</span>
            </div>
            <h3 class="ws-name"><a class="ws-name-link" href="/c/${esc(item.slug || item.id)}">${esc(item.creator)}</a></h3>
            <p class="ws-blurb">${esc(item.bio)}</p>
            <div class="ws-foot">
              <div class="ws-meta">
                <div class="ws-rate">${rateHtml}</div>
              </div>
              <div class="ws-actions">
                <button type="button" class="ws-book nx-btn-brief" data-creator-name="${esc(item.creator)}" aria-label="Send a request like ${esc(item.creator)}">
                  <span>Send request</span>
                  ${WS_SVGS.arrow}
                </button>
                <button type="button" class="ws-save nx-btn-save ${isSaved ? 'is-saved' : ''}" data-creator-id="${esc(item.id)}" aria-pressed="${isSaved ? 'true' : 'false'}" aria-label="Save ${esc(item.creator)}">
                  ${WS_SVGS.save}
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    bindCardHoverReels();
  }

  /* ── 7. HOVER VIDEO REEL PREVIEWS ── */
  function bindCardHoverReels() {
    const cards = gridEl.querySelectorAll('.dir-card');
    cards.forEach((card) => {
      const video = card.querySelector('video');
      if (!video) return;

      card.addEventListener('mouseenter', () => {
        try {
          video.play().then(() => card.classList.add('is-playing')).catch(() => {});
        } catch (e) {}
      });

      card.addEventListener('mouseleave', () => {
        card.classList.remove('is-playing');
        try {
          video.pause();
          video.currentTime = 0;
        } catch (e) {}
      });
    });
  }

  /* ── 8. SHORTLIST MANAGEMENT & DRAWER ── */
  function updateShortlistBadges() {
    const count = state.shortlist.size;
    if (shortlistBadgeCount) shortlistBadgeCount.textContent = count;
    if (shortlistDrawerCount) shortlistDrawerCount.textContent = count;
  }

  function toggleSaveCreator(id) {
    if (state.shortlist.has(id)) {
      state.shortlist.delete(id);
      showToast('Removed from saved');
    } else {
      state.shortlist.add(id);
      const creator = CREATORS.find((c) => c.id === id);
      showToast(`Saved ${creator ? creator.creator : 'creator'}`);
    }

    saveShortlist();
    updateShortlistBadges();

    // Update save button states in grid without full re-render
    const saveBtns = gridEl.querySelectorAll(`.nx-btn-save[data-creator-id="${id}"]`);
    saveBtns.forEach((btn) => {
      const isSaved = state.shortlist.has(id);
      btn.classList.toggle('is-saved', isSaved);
      const span = btn.querySelector('span');
      if (span) span.textContent = isSaved ? 'Saved' : 'Save';
    });

    renderShortlistDrawer();
  }

  function renderShortlistDrawer() {
    if (!shortlistList) return;
    const items = CREATORS.filter((c) => state.shortlist.has(c.id));

    if (items.length === 0) {
      shortlistList.innerHTML = `
        <div style="text-align: center; padding: 48px 16px; color: var(--color-muted);">
          <p style="font-size: 14.5px; margin-bottom: 8px; font-weight: 600; color: var(--color-ink);">Your shortlist is empty</p>
          <p style="font-size: 13px;">Click "Save" on any talent card to curate your ideal production team.</p>
        </div>
      `;
      if (inquireShortlistBtn) {
        inquireShortlistBtn.disabled = true;
        inquireShortlistBtn.style.opacity = '0.5';
      }
      return;
    }

    if (inquireShortlistBtn) {
      inquireShortlistBtn.disabled = false;
      inquireShortlistBtn.style.opacity = '1';
    }

    shortlistList.innerHTML = items.map((c) => `
      <div class="nx-shortlist-item">
        <img src="${esc(c.src)}" alt="${esc(c.creator)}" class="nx-shortlist-thumb">
        <div class="nx-shortlist-info">
          <div class="nx-shortlist-name">${esc(c.creator)}</div>
          <div class="nx-shortlist-craft">${esc(c.craft)} · ${esc(c.rate)}</div>
        </div>
        <button type="button" class="nx-shortlist-remove" data-remove-id="${esc(c.id)}" aria-label="Remove ${esc(c.creator)} from shortlist">&times;</button>
      </div>
    `).join('');
  }

  function openShortlistDrawer() {
    renderShortlistDrawer();
    shortlistBackdrop.classList.add('is-open');
    shortlistBackdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeShortlistDrawer() {
    shortlistBackdrop.classList.remove('is-open');
    shortlistBackdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ── 9. DIRECT INQUIRY MODAL ── */
  function openInquiryModal(targetName) {
    if (targetName === '__general') {
      inquiryCreatorName.value = '';
      inquiryModalTitle.textContent = 'Tell us who you need';
      inquiryModalSub.textContent = "We'll match you with reviewed creators as they go live.";
    } else if (targetName) {
      inquiryCreatorName.value = targetName;
      const c = CREATORS.find((x) => x.creator === targetName);
      inquiryModalTitle.textContent = 'Find someone like ' + targetName.split(' ')[0];
      inquiryModalSub.textContent = c ? c.craft + ' · ' + c.city + ' · around ' + c.rate : '';
      const need = document.getElementById('inqScope');
      if (need && !need.value && c) need.value = c.craft + ' ';
    } else {
      const count = state.shortlist.size;
      inquiryCreatorName.value = 'Saved (' + count + ')';
      inquiryModalTitle.textContent = 'One request for your saved creators';
      inquiryModalSub.textContent = count + ' saved · we\'ll match you with people like them';
    }

    inquiryModal.classList.add('is-open');
    inquiryModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const firstInput = document.getElementById('inqScope');
    if (firstInput) setTimeout(() => firstInput.focus(), 80);
  }

  function closeInquiryModal() {
    inquiryModal.classList.remove('is-open');
    inquiryModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  /* ── 10. TOAST NOTIFICATION ── */
  let toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 2800);
  }

  /* ── 11. RESET ALL FILTERS ── */
  function resetAllFilters() {
    state.craft = 'all';
    state.search = '';
    state.city = 'all';
    state.rate = 'all';
    state.sort = 'recommended';
    state.selectedGear.clear();

    if (searchInput) searchInput.value = '';
    if (searchClearBtn) searchClearBtn.classList.remove('is-visible');
    if (cityFilter) cityFilter.value = 'all';
    if (rateFilter) rateFilter.value = 'all';
    if (sortFilter) sortFilter.value = 'recommended';

    craftTabs.querySelectorAll('.nx-disc-tab').forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.craft === 'all');
      tab.setAttribute('aria-selected', tab.dataset.craft === 'all' ? 'true' : 'false');
    });

    if (gearChips) gearChips.querySelectorAll('.nx-gear-chip').forEach((chip) => {
      chip.classList.remove('is-active');
    });

    renderGrid();
  }

  /* ── 12. EVENT LISTENERS SETUP ── */
  function initEvents() {
    // Search input (debounced)
    let searchDebounce = null;
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      searchClearBtn.classList.toggle('is-visible', val.length > 0);
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        state.search = val;
        renderGrid();
      }, 140);
    });

    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchClearBtn.classList.remove('is-visible');
      state.search = '';
      renderGrid();
      searchInput.focus();
    });

    // Craft filter tabs
    craftTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.nx-disc-tab');
      if (!tab) return;
      craftTabs.querySelectorAll('.nx-disc-tab').forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      state.craft = tab.dataset.craft || 'all';
      renderGrid();
    });

    // City dropdown
    cityFilter.addEventListener('change', (e) => {
      state.city = e.target.value;
      renderGrid();
    });

    // Rate dropdown
    rateFilter.addEventListener('change', (e) => {
      state.rate = e.target.value;
      renderGrid();
    });

    // Sort dropdown
    sortFilter.addEventListener('change', (e) => {
      state.sort = e.target.value;
      renderGrid();
    });

    // Gear quick chips
    if (gearChips) gearChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.nx-gear-chip');
      if (!chip) return;
      const gear = chip.dataset.gear;
      if (state.selectedGear.has(gear)) {
        state.selectedGear.delete(gear);
        chip.classList.remove('is-active');
      } else {
        state.selectedGear.add(gear);
        chip.classList.add('is-active');
      }
      renderGrid();
    });

    // Reset filters button
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetAllFilters);

    // Card delegation (Save & Send Brief)
    gridEl.addEventListener('click', (e) => {
      const saveBtn = e.target.closest('.nx-btn-save');
      if (saveBtn) {
        e.preventDefault();
        const id = saveBtn.dataset.creatorId;
        toggleSaveCreator(id);
        return;
      }

      const briefBtn = e.target.closest('.nx-btn-brief');
      if (briefBtn) {
        e.preventDefault();
        const name = briefBtn.dataset.creatorName;
        openInquiryModal(name);
      }

      // tapping the photo opens the full profile
      const media = e.target.closest('.ws-stage');
      if (media) {
        const card = media.closest('.dir-card');
        if (card) window.location.href = '/c/' + card.dataset.creatorId;
      }
    });

    // Shortlist Drawer triggers
    shortlistToggleBtn.addEventListener('click', openShortlistDrawer);
    closeDrawerBtn.addEventListener('click', closeShortlistDrawer);
    shortlistBackdrop.addEventListener('click', (e) => {
      if (e.target === shortlistBackdrop) closeShortlistDrawer();
    });

    shortlistList.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.nx-shortlist-remove');
      if (removeBtn) {
        const id = removeBtn.dataset.removeId;
        toggleSaveCreator(id);
      }
    });

    if (inquireShortlistBtn) {
      inquireShortlistBtn.addEventListener('click', () => {
        closeShortlistDrawer();
        openInquiryModal();
      });
    }

    const generalBtn = document.getElementById('generalRequestBtn');
    if (generalBtn) generalBtn.addEventListener('click', () => openInquiryModal('__general'));

    // Modal triggers
    closeModalBtn.addEventListener('click', closeInquiryModal);
    inquiryModal.addEventListener('click', (e) => {
      if (e.target === inquiryModal) closeInquiryModal();
    });

    // Keyboard ESC listener
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (inquiryModal.classList.contains('is-open')) closeInquiryModal();
        if (shortlistBackdrop.classList.contains('is-open')) closeShortlistDrawer();
      }
    });

    // Inquiry Form Submission
    inquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('inquirySubmitBtn');
      const errEl = document.getElementById('inquiryError');
      const origText = submitBtn.textContent;
      if (errEl) errEl.hidden = true;
      if (!inquiryForm.reportValidity()) return;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';

      const target = CREATORS.find((x) => x.creator === inquiryCreatorName.value);
      const payload = {
        role: 'client',
        email: document.getElementById('inqClientEmail').value.trim(),
        need: document.getElementById('inqScope').value.trim(),
        craft: target ? target.craft : undefined,
        city: document.getElementById('inqCity').value.trim(),
        ref: target ? target.id : 'saved',
        landing: '/explore'
      };
      const date = document.getElementById('inqDates').value.trim();
      const budget = document.getElementById('inqBudget').value;

      try {
        // Same backend route as the homepage request form (waitlist until real profiles are live)
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('status ' + res.status);
        const data = await res.json().catch(() => ({}));
        if ((date || budget) && data.edit_token) {
          fetch('/api/waitlist', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ edit_token: data.edit_token, date: date || undefined, budget: budget || undefined })
          }).catch(() => {});
        }
        closeInquiryModal();
        inquiryForm.reset();
        showToast("Got it. We'll email you when matching creators are live.");
      } catch (err) {
        if (errEl) { errEl.textContent = "Couldn't send that. Check your connection and try again."; errEl.hidden = false; }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
      }
    });
  }

  /* ── 13. BOOTSTRAP ── */
  document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initEvents();
    renderGrid();

    // links from profile pages: /explore?craft=film, /explore?saved=1
    const q = new URLSearchParams(location.search);
    const tab = q.get('craft') && document.querySelector('.nx-disc-tab[data-craft="' + q.get('craft') + '"]');
    if (tab) tab.click();
    if (q.get('saved') === '1' && typeof openShortlistDrawer === 'function') openShortlistDrawer();
  });
})();
