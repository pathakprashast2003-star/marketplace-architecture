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
    { name: 'Half day', note: 'Up to 5 hours on set', price: money(rate * 0.6) },
    { name: 'Full day', note: 'Up to 10 hours on set', price: money(rate), main: true },
    { name: 'Three days or more', note: 'Price per day', price: money(rate * 0.9) }
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

    <section class="cp-sec">
      <h2 class="cp-h">Specialties</h2>
      <div class="cp-tags">${(c.tags || []).map((t) => `<span class="cp-tag">${esc(t)}</span>`).join('')}<span class="cp-tag is-soft">${esc(CAT_NAME[c.cat] || '')}</span></div>
    </section>

    <section class="cp-sec">
      <div class="cp-h-row"><h2 class="cp-h">Work</h2><span class="cp-note">Sample images</span></div>
      <div class="cp-work">${work.map((src, i) => `<figure class="cp-shot${i === 0 ? ' is-lead' : ''}"><img src="${esc(abs(src))}" alt="" decoding="async"></figure>`).join('')}</div>
    </section>

    <section class="cp-sec">
      <div class="cp-h-row"><h2 class="cp-h">Services</h2><span class="cp-note">Example prices. Each creator sets their own.</span></div>
      <div class="cp-services">
        ${services.map((s) => `
          <div class="cp-service${s.main ? ' is-main' : ''}">
            <p class="cp-service-name">${esc(s.name)}</p>
            <p class="cp-service-note">${esc(s.note)}</p>
            <p class="cp-service-price">${esc(s.price)}</p>
            <button type="button" class="cp-link" data-request data-service="${esc(s.name)}">Ask about this <span aria-hidden="true">→</span></button>
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

  // phone dock
  if (dock) {
    document.getElementById('cpDockRate').innerHTML = `<b>${esc(money(rate))}</b><span>/day</span>`;
    dock.hidden = false;
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

  /* ── Request form (same fields and backend route as Explore) ── */
  const modal = document.getElementById('inquiryModal');
  const form = document.getElementById('inquiryForm');
  const title = document.getElementById('inquiryModalTitle');
  const sub = document.getElementById('inquiryModalSub');
  const need = document.getElementById('inqScope');
  const errEl = document.getElementById('inquiryError');

  function openRequest(service) {
    title.textContent = 'Find someone like ' + first;
    sub.textContent = c.craft + ' · ' + c.city + ' · around ' + money(rate) + '/day';
    if (need && !need.value) need.value = c.craft + (service ? ' · ' + service : '') + ' ';
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
