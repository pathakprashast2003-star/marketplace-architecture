/* ── Creator profile page: /c/<slug>  (served by creator.html) ──────────────
   Reads the shared list in js/creators-data.js. Everything here is a SAMPLE
   profile until real creators are live, and the page says so. */
(function () {
  'use strict';

  const ALL = window.NEXUS_CREATORS || [];
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const abs = (p) => (/^(https?:)?\//.test(p) ? p : '/' + p);     // page lives at /c/<slug>, so asset paths must start at the root
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const CAT_NAME = { film: 'Film & Video', aerial: 'Drone', d3: '3D & Virtual', art: 'Art & Photo', action: 'Action & Rigs' };

  // slug from /c/<slug>, or ?slug= when opened as creator.html directly
  const fromPath = (location.pathname.match(/^\/c\/([^/?#]+)/) || [])[1];
  const slug = decodeURIComponent(fromPath || new URLSearchParams(location.search).get('slug') || '').toLowerCase();
  const c = ALL.find((x) => x.slug === slug);

  const main = document.getElementById('cp');
  const dock = document.getElementById('cpDock');
  const toastEl = document.getElementById('exploreToast');

  /* ── Saved (same storage as the Explore page) ── */
  const KEY = 'nexus_shortlist_v1';
  const loadSaved = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { return new Set(); } };
  const storeSaved = (set) => { try { localStorage.setItem(KEY, JSON.stringify(Array.from(set))); } catch (e) {} };
  function updateBadge() {
    const b = document.getElementById('shortlistBadgeCount');
    if (b) b.textContent = loadSaved().size;
  }
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
  }

  const savedBtn = document.getElementById('shortlistToggleBtn');
  if (savedBtn) savedBtn.addEventListener('click', () => { window.location.href = '/explore?saved=1'; });
  updateBadge();

  /* ── Not found ── */
  if (!c) {
    document.title = 'Creator not found · Nexus';
    main.innerHTML = `
      <section class="cp-missing">
        <p class="cp-kicker">Nothing here</p>
        <h1 class="cp-name">We couldn't find that <em>creator.</em></h1>
        <p class="cp-lead">The link may be old, or the profile isn't live yet.</p>
        <a class="cp-btn cp-btn-primary" href="/explore">Browse all creators <span aria-hidden="true">→</span></a>
      </section>`;
    return;
  }

  /* ── Page data ── */
  document.title = c.creator + ' · ' + c.craft + ' · Nexus';
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute('content', c.creator + ', ' + c.craft + ' in ' + c.city + '. ' + c.bio + ' Sample profile on Nexus.');

  const first = c.creator.split(' ')[0];
  const rate = c.numericRate;
  const same = ALL.filter((x) => x.slug !== c.slug && x.cat === c.cat);
  const others = ALL.filter((x) => x.slug !== c.slug && x.cat !== c.cat);
  const more = same.concat(others).slice(0, 3);

  // a small "work" strip: their photo plus distinct photos from the same craft
  const work = [c.src];
  for (const x of same.concat(others)) {
    if (work.length >= 4) break;
    if (!work.includes(x.src)) work.push(x.src);
  }

  const services = [
    {
      name: 'Half Day Shoot',
      note: 'Up to 5 hours on set. Ideal for quick turnaround, interview setups, or insert pickups.',
      price: money(rate * 0.6),
      unit: '/half-day',
      main: false
    },
    {
      name: 'Full Day Commercial',
      note: 'Up to 10 hours on set. Complete commercial day rate including standard cinema kit.',
      price: money(rate),
      unit: '/day',
      main: true,
      badge: 'Popular Choice'
    },
    {
      name: 'Multi-Day / Project Buyout',
      note: '3+ shooting days. Narrative features, multi-city brand campaigns, volume discount.',
      price: money(rate * 0.9),
      unit: '/day',
      main: false
    }
  ];

  const isSaved = () => loadSaved().has(c.slug);
  const saveLabel = () => (isSaved() ? 'Saved' : 'Save');

  main.innerHTML = `
    <nav class="cp-crumbs" aria-label="Breadcrumb">
      <a href="/explore">← Explore Talent</a>
      <span class="cp-crumb-sep" aria-hidden="true">/</span>
      <a href="/explore?craft=${esc(c.cat)}">${esc(CAT_NAME[c.cat] || 'Visual Arts')}</a>
      <span class="cp-crumb-sep" aria-hidden="true">/</span>
      <span class="cp-crumb-cur">${esc(c.creator)}</span>
    </nav>

    <section class="cp-hero" aria-label="Creator Overview">
      <div class="cp-media" id="cpHeroMedia">
        <div class="cp-media-ambient" style="background-image: url('${esc(abs(c.src))}')" aria-hidden="true"></div>
        <div class="cp-media-inner">
          <img src="${esc(abs(c.src))}" alt="${esc(c.creator)}, ${esc(c.craft)}" fetchpriority="high" decoding="async" class="cp-media-poster">
          ${c.reel ? `
            <video src="${esc(abs(c.reel))}" muted loop playsinline autoplay preload="metadata" aria-label="${esc(c.creator)} reel" class="cp-media-video" id="cpHeroVideo"></video>
            <button type="button" class="cp-audio-btn" id="cpAudioToggle" aria-label="Unmute audio">
              <svg class="cp-icon-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              <svg class="cp-icon-sound" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:none;"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              <span class="cp-audio-label">Muted</span>
            </button>
          ` : ''}
          <div class="cp-media-hud">
            <span class="cp-media-tag ${c.reel ? 'is-reel' : 'is-photo'}">
              <span class="cp-media-dot" aria-hidden="true"></span>
              <span>${c.reel ? 'REEL' : 'PHOTO'}</span>
            </span>
            <span class="cp-media-rate">${esc(money(rate))}<small>/day · 0% fee</small></span>
          </div>
        </div>
      </div>

      <aside class="cp-panel" id="cpHeroPanel">
        <div class="cp-kicker-row">
          <span class="cp-kicker">${esc(c.craft)} · ${esc(c.city)}</span>
          <span class="cp-verified-badge" title="Identity & portfolio verified by human curator">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Verified</span>
          </span>
        </div>
        <h1 class="cp-name">${esc(c.creator)}</h1>
        <p class="cp-lead">${esc(c.bio)}</p>

        <div class="cp-trust-ribbon" aria-label="Verified creator trust metrics">
          <div class="cp-trust-item cp-trust-stars">
            <span class="cp-star-icon" aria-hidden="true">★</span>
            <span class="cp-trust-val">${esc(c.trust ? c.trust.rating.toFixed(1) : '5.0')}</span>
            <span class="cp-trust-sub">(${esc(c.trust ? c.trust.billed : '$200k+ billed')})</span>
          </div>
          <div class="cp-trust-item cp-trust-sla">
            <span class="cp-live-dot" aria-hidden="true"></span>
            <span class="cp-trust-val">${esc(c.trust ? c.trust.sla : 'Replies under 1h')}</span>
          </div>
          <div class="cp-trust-item cp-trust-direct">
            <span class="cp-direct-badge">100% Direct · 0% Fee</span>
          </div>
        </div>

        <div class="cp-rate-hero">
          <div class="cp-rate-amount"><b>${esc(money(rate))}</b><span>/day</span></div>
          <div class="cp-rate-meta">Standard Day Rate · Direct Booking</div>
        </div>

        <div class="cp-actions">
          <button type="button" class="cp-btn cp-btn-primary" data-request>
            <span>Book ${esc(first)}</span>
            <span class="cp-btn-arrow" aria-hidden="true">→</span>
          </button>
          <button type="button" class="cp-btn cp-btn-ghost" id="cpSave" aria-pressed="${isSaved()}" aria-label="Save ${esc(c.creator)} to shortlist">
            <svg class="cp-btn-bookmark" width="16" height="16" viewBox="0 0 24 24" fill="${isSaved() ? '#3B54EE' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            <span class="cp-save-txt">${saveLabel()}</span>
          </button>
        </div>

        <ul class="cp-ticks">
          <li><strong>0% commission</strong> — negotiate and pay ${esc(first)} directly.</li>
          <li><strong>Zero spam guarantee</strong> — your project brief lands straight in their inbox.</li>
          <li><strong>Curated roster</strong> — verified camera package & portfolio proof.</li>
        </ul>
      </aside>
    </section>

    <section class="cp-sec" id="cpGearSection">
      <div class="cp-h-row">
        <h2 class="cp-h">Verified Gear & Tech Stack</h2>
        <span class="cp-note">Verified owner-operator package</span>
      </div>
      <div class="cp-gear-rack">
        ${(c.gear || []).map(g => `
          <div class="cp-gear-chip">
            <span class="cp-gear-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </span>
            <span class="cp-gear-name">${esc(g)}</span>
            <span class="cp-gear-check" title="Verified kit">✓</span>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="cp-sec" id="cpGallerySection">
      <div class="cp-h-row">
        <h2 class="cp-h">Featured Commercial Work</h2>
        <span class="cp-note">Click any frame to view in cinema lightbox</span>
      </div>
      <div class="cp-work" id="cpGallery">
        ${(c.gallery || []).map((item, i) => `
          <figure class="cp-shot${i === 0 ? ' is-lead' : ''}" data-index="${i}" tabindex="0" role="button" aria-label="Enlarge still: ${esc(item.caption)}">
            <img src="${esc(abs(item.src))}" alt="${esc(item.caption)}" decoding="async" loading="lazy">
            <div class="cp-shot-overlay">
              <span class="cp-shot-tag">${esc(item.tag || 'Still')}</span>
              <p class="cp-shot-caption">${esc(item.caption)}</p>
              <span class="cp-shot-credit">${esc(item.credit)}</span>
            </div>
          </figure>
        `).join('')}
      </div>
    </section>

    <section class="cp-sec" id="cpServicesSection">
      <div class="cp-h-row">
        <h2 class="cp-h">Day Rate & Transparent Packages</h2>
        <span class="cp-note">Direct hire · 0% commission markup</span>
      </div>
      <div class="cp-services">
        ${services.map((s) => `
          <div class="cp-service${s.main ? ' is-main' : ''}">
            ${s.badge ? `<span class="cp-service-badge">${esc(s.badge)}</span>` : ''}
            <h3 class="cp-service-name">${esc(s.name)}</h3>
            <p class="cp-service-note">${esc(s.note)}</p>
            <div class="cp-service-price"><b>${esc(s.price)}</b><small>${esc(s.unit)}</small></div>
            <button type="button" class="cp-btn ${s.main ? 'cp-btn-primary' : 'cp-btn-ghost'}" data-request data-service="${esc(s.name)}">
              <span>Inquire about this tier</span>
              <span class="cp-btn-arrow" aria-hidden="true">→</span>
            </button>
          </div>`).join('')}
      </div>
    </section>

    <section class="cp-sec">
      <h2 class="cp-h">Reviews</h2>
      <div class="cp-empty">
        <p class="cp-empty-t">No reviews yet</p>
        <p class="cp-empty-p">Reviews appear here after clients work with ${esc(first)} through Nexus.</p>
      </div>
    </section>

    <section class="cp-sec">
      <div class="cp-h-row"><h2 class="cp-h">More like <em>${esc(first)}</em></h2><a class="cp-link" href="/explore">See all <span aria-hidden="true">→</span></a></div>
      <div class="cp-more">
        ${more.map((x) => `
          <a class="cp-mini" href="/c/${esc(x.slug)}">
            <span class="cp-mini-img"><img src="${esc(abs(x.src))}" alt="" decoding="async"></span>
            <span class="cp-mini-k">${esc(x.craft)} · ${esc(x.city)}</span>
            <span class="cp-mini-n">${esc(x.creator)}</span>
            <span class="cp-mini-r">${esc(money(x.numericRate))}<small>/day</small></span>
          </a>`).join('')}
      </div>
    </section>
  `;

  // Action Dock (Desktop & Mobile)
  if (dock) {
    const dockAvatar = document.getElementById('cpDockAvatar');
    const dockName = document.getElementById('cpDockName');
    const dockCraft = document.getElementById('cpDockCraft');
    const dockRate = document.getElementById('cpDockRate');
    const dockFirstName = document.getElementById('cpDockFirstName');

    if (dockAvatar) dockAvatar.src = abs(c.src);
    if (dockName) dockName.textContent = c.creator;
    if (dockCraft) dockCraft.textContent = c.craft + ' · ' + c.city;
    if (dockRate) dockRate.innerHTML = `<b>${esc(money(rate))}</b><span>/day</span>`;
    if (dockFirstName) dockFirstName.textContent = first;

    function checkDockVisibility() {
      const hero = document.querySelector('.cp-hero');
      if (!hero) return;
      const heroBottom = hero.getBoundingClientRect().bottom;
      if (heroBottom < 120) {
        dock.classList.add('is-visible');
        dock.setAttribute('aria-hidden', 'false');
      } else {
        dock.classList.remove('is-visible');
        dock.setAttribute('aria-hidden', 'true');
      }
    }
    window.addEventListener('scroll', checkDockVisibility, { passive: true });
    checkDockVisibility();
  }

  // a reel that can't play just leaves the photo showing
  const vid = main.querySelector('.cp-media video');
  if (vid) {
    vid.addEventListener('playing', () => vid.classList.add('is-on'));
    vid.addEventListener('error', () => {
      vid.remove();
      const tag = main.querySelector('.cp-media-tag');
      if (tag) {
        tag.classList.remove('is-reel');
        tag.classList.add('is-photo');
        tag.innerHTML = '<span class="cp-media-dot" aria-hidden="true"></span><span>PHOTO</span>';
      }
    });
  }

  // Audio toggle
  const audioBtn = document.getElementById('cpAudioToggle');
  if (audioBtn && vid) {
    audioBtn.addEventListener('click', () => {
      const isMuted = vid.muted;
      vid.muted = !isMuted;
      const soundIcon = audioBtn.querySelector('.cp-icon-sound');
      const muteIcon = audioBtn.querySelector('.cp-icon-muted');
      const label = audioBtn.querySelector('.cp-audio-label');
      if (vid.muted) {
        audioBtn.setAttribute('aria-label', 'Unmute audio');
        if (label) label.textContent = 'Muted';
        if (soundIcon) soundIcon.style.display = 'none';
        if (muteIcon) muteIcon.style.display = 'inline-block';
      } else {
        audioBtn.setAttribute('aria-label', 'Mute audio');
        if (label) label.textContent = 'Unmuted';
        if (soundIcon) soundIcon.style.display = 'inline-block';
        if (muteIcon) muteIcon.style.display = 'none';
      }
    });
  }

  /* ── Save ── */
  const saveBtn = document.getElementById('cpSave');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const set = loadSaved();
      const nowSaved = !set.has(c.slug);
      if (nowSaved) {
        set.add(c.slug);
        toast('Saved ' + c.creator);
      } else {
        set.delete(c.slug);
        toast('Removed ' + c.creator);
      }
      storeSaved(set);
      saveBtn.setAttribute('aria-pressed', String(nowSaved));
      const txt = saveBtn.querySelector('.cp-save-txt');
      if (txt) txt.textContent = nowSaved ? 'Saved' : 'Save';
      const bm = saveBtn.querySelector('.cp-btn-bookmark');
      if (bm) bm.setAttribute('fill', nowSaved ? '#3B54EE' : 'none');
      updateBadge();
    });
  }

  /* ── Lightbox Controller ── */
  const lbModal = document.getElementById('cpLightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCaption = document.getElementById('lightboxCaption');
  const lbCredit = document.getElementById('lightboxCredit');
  const lbCounter = document.getElementById('lightboxCounter');
  const lbCloseBtn = document.getElementById('lightboxCloseBtn');
  const lbPrevBtn = document.getElementById('lightboxPrevBtn');
  const lbNextBtn = document.getElementById('lightboxNextBtn');

  let currentLbIndex = 0;
  const galleryItems = c.gallery || [];

  function showLightboxImage(idx) {
    if (!galleryItems.length) return;
    currentLbIndex = (idx + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentLbIndex];
    if (lbImg) {
      lbImg.src = abs(item.src);
      lbImg.alt = item.caption;
    }
    if (lbCaption) lbCaption.textContent = item.caption;
    if (lbCredit) lbCredit.textContent = item.credit ? 'Client: ' + item.credit : '';
    if (lbCounter) lbCounter.textContent = `${currentLbIndex + 1} / ${galleryItems.length}`;
  }

  function openLightbox(idx) {
    if (!lbModal) return;
    showLightboxImage(idx);
    lbModal.classList.add('is-open');
    lbModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lbModal) return;
    lbModal.classList.remove('is-open');
    lbModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  const galleryEl = document.getElementById('cpGallery');
  if (galleryEl) {
    galleryEl.addEventListener('click', (e) => {
      const shot = e.target.closest('.cp-shot');
      if (shot) {
        const idx = parseInt(shot.dataset.index, 10) || 0;
        openLightbox(idx);
      }
    });
    galleryEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const shot = e.target.closest('.cp-shot');
        if (shot) {
          e.preventDefault();
          const idx = parseInt(shot.dataset.index, 10) || 0;
          openLightbox(idx);
        }
      }
    });
  }

  if (lbCloseBtn) lbCloseBtn.addEventListener('click', closeLightbox);
  if (lbPrevBtn) lbPrevBtn.addEventListener('click', () => showLightboxImage(currentLbIndex - 1));
  if (lbNextBtn) lbNextBtn.addEventListener('click', () => showLightboxImage(currentLbIndex + 1));
  if (lbModal) {
    lbModal.addEventListener('click', (e) => {
      if (e.target === lbModal || e.target.classList.contains('cp-lightbox-stage')) closeLightbox();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (!lbModal || !lbModal.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') showLightboxImage(currentLbIndex - 1);
    else if (e.key === 'ArrowRight') showLightboxImage(currentLbIndex + 1);
  });

  /* ── Request form (same fields and backend route as Explore) ── */
  const modal = document.getElementById('inquiryModal');
  const form = document.getElementById('inquiryForm');
  const title = document.getElementById('inquiryModalTitle');
  const sub = document.getElementById('inquiryModalSub');
  const need = document.getElementById('inqScope');
  const errEl = document.getElementById('inquiryError');

  function openRequest(service) {
    title.textContent = 'Book ' + c.creator;
    sub.textContent = c.craft + ' · ' + c.city + ' · Standard ' + money(rate) + '/day (0% Commission)';
    if (need) need.value = c.craft + (service ? ' — ' + service : ' — Full Day Commercial') + ' ';
    if (errEl) errEl.hidden = true;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (!matchMedia('(max-width: 820px)').matches) setTimeout(() => need && need.focus(), 80);
  }
  function closeRequest() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-request]');
    if (t) { e.preventDefault(); openRequest(t.dataset.service); }
  });
  document.getElementById('closeModalBtn').addEventListener('click', closeRequest);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeRequest(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeRequest(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const btn = document.getElementById('inquirySubmitBtn');
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    if (errEl) errEl.hidden = true;
    const date = document.getElementById('inqDates').value.trim();
    const budget = document.getElementById('inqBudget').value;
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'client',
          email: document.getElementById('inqClientEmail').value.trim(),
          need: need.value.trim(),
          craft: c.craft,
          city: document.getElementById('inqCity').value.trim(),
          ref: c.slug,
          landing: '/c/' + c.slug
        })
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
      closeRequest();
      form.reset();
      toast("Got it. We'll email you when matching creators are live.");
    } catch (err) {
      if (errEl) { errEl.textContent = "Couldn't send that. Check your connection and try again."; errEl.hidden = false; }
    } finally {
      btn.disabled = false;
      btn.textContent = orig;
    }
  });
})();
