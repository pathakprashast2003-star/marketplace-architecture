/* ── Creator profile: /c/<slug>  (creator.html) ─────────────────────────────
   Layout: compact intro + cover, then main column (About, Work, Services,
   Experience, Credentials, Kit, How they work, FAQ, Reviews, Links) beside a
   sticky request card. Each section only shows when it has content, so a
   teacher never sees "Kit". Data: js/creators-data.js (sample profiles). */
(function () {
  'use strict';

  const ALL = window.NEXUS_CREATORS || [];
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const abs = (p) => (/^(https?:)?\//.test(p) ? p : '/' + p);
  const cardSrc = (p) => (!p ? '' : p.startsWith('assets/') ? 'assets/card/' + p.slice(7) : p);
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const CAT = { film: 'Film & Video', aerial: 'Drone', d3: '3D & Virtual', art: 'Art & Photo', action: 'Action & Rigs' };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fromPath = (location.pathname.match(/^\/c\/([^/?#]+)/) || [])[1];
  const slug = decodeURIComponent(fromPath || new URLSearchParams(location.search).get('slug') || '').toLowerCase();
  const c = ALL.find((x) => x.slug === slug);

  const main = document.getElementById('cpx');
  const toastEl = document.getElementById('exploreToast');

  /* ── Saved (shared with Explore) ── */
  const KEY = 'nexus_shortlist_v1';
  const loadSaved = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch (e) { return new Set(); } };
  const storeSaved = (s) => { try { localStorage.setItem(KEY, JSON.stringify(Array.from(s))); } catch (e) {} };
  const badge = () => { const b = document.getElementById('shortlistBadgeCount'); if (b) b.textContent = loadSaved().size; };
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
  }
  const savedNav = document.getElementById('shortlistToggleBtn');
  if (savedNav) savedNav.addEventListener('click', () => { location.href = '/explore?saved=1'; });
  badge();

  if (!c) {
    document.title = 'Creator not found · Nexus';
    main.innerHTML = `
      <section class="cpx-missing">
        <p class="cpx-eyebrow">404 // NOT FOUND</p>
        <h1 class="cpx-title">We couldn't find that creator.</h1>
        <p class="cpx-sub">The profile link may be outdated or the creator is pending verification.</p>
        <a class="cpx-btn" href="/explore">Browse Directory Index</a>
      </section>`;
    return;
  }

  /* ── Data ── */
  const p = c.profile || {};
  const first = c.creator.split(' ')[0];
  const rate = c.numericRate;
  const gear = c.gear || [];
  const gallery = (c.gallery && c.gallery.length ? c.gallery : [{ src: c.src, caption: c.craft }]);
  const work = gallery.concat(ALL.filter((x) => x.cat === c.cat && x.slug !== c.slug).map((x) => ({ src: x.src, caption: x.craft })))
    .filter((g, i, arr) => arr.findIndex((y) => y.src === g.src) === i).slice(0, 5);   // 1 wide + 4 = full grid
  const more = ALL.filter((x) => x.slug !== c.slug && x.cat === c.cat).concat(ALL.filter((x) => x.slug !== c.slug && x.cat !== c.cat)).slice(0, 3);
  const isSaved = () => loadSaved().has(c.slug);

  document.title = c.creator + ' · ' + c.craft + ' · Nexus';
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', c.creator + ', ' + c.craft + ' in ' + c.city + '. ' + (p.headline || c.bio) + '. Sample profile on Nexus. 0% commission.');

  const ic = {
    save: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
  };

  const specFacts = [
    { label: 'LOCATION', val: c.city },
    p.years ? { label: 'TENURE', val: p.years + ' Years Active' } : null,
    p.languages && p.languages.length ? { label: 'LANGUAGES', val: p.languages.join(', ') } : null,
    p.travel ? { label: 'MOBILITY', val: p.travel } : null,
    p.remote ? { label: 'REMOTE WORK', val: 'Available Worldwide' } : null
  ].filter(Boolean);

  const sec = (id, idx, title, body, note) => body ? `
    <section class="cpx-sec" id="${id}" data-reveal>
      <div class="cpx-sec-head">
        <div class="cpx-sec-head-left">
          <span class="cpx-sec-idx">${idx}</span>
          <h2 class="cpx-h">${title}</h2>
        </div>
        ${note ? `<span class="cpx-note">${note}</span>` : ''}
      </div>
      <div class="cpx-sec-body">
        ${body}
      </div>
    </section>` : '';

  const sampleNote = p.sample ? 'SAMPLE PROFILE' : 'VERIFIED';

  main.innerHTML = `
    <nav class="cpx-crumbs" aria-label="Breadcrumb">
      <a href="/explore">Directory</a><span class="cpx-crumb-sep">/</span>
      <a href="/explore?craft=${esc(c.cat)}">${esc(CAT[c.cat] || 'Creators')}</a><span class="cpx-crumb-sep">/</span>
      <b>${esc(c.creator)}</b>
    </nav>

    <!-- TOP DOSSIER LEDGER BAR -->
    <div class="cpx-ledger-bar" data-reveal>
      <div class="cpx-ledger-cell"><span class="cpx-ledger-k">DOSSIER REF</span><span class="cpx-ledger-v">CR-${esc(c.slug.toUpperCase())}</span></div>
      <div class="cpx-ledger-cell"><span class="cpx-ledger-k">DISCIPLINE</span><span class="cpx-ledger-v">${esc(c.craft)}</span></div>
      <div class="cpx-ledger-cell"><span class="cpx-ledger-k">LOCATION</span><span class="cpx-ledger-v">${esc(c.city)}</span></div>
      <div class="cpx-ledger-cell"><span class="cpx-ledger-k">COMMISSION</span><span class="cpx-ledger-v">0.00% DIRECT</span></div>
      <div class="cpx-ledger-cell"><span class="cpx-ledger-k">BASE RATE</span><span class="cpx-ledger-v">${esc(money(rate))}/DAY</span></div>
      <div class="cpx-ledger-cell"><span class="cpx-ledger-k">RECORD STATUS</span><span class="cpx-ledger-v is-status">● VERIFIED</span></div>
    </div>

    <!-- INTRO DOSSIER -->
    <header class="cpx-intro">
      <div class="cpx-intro-text" data-reveal>
        <div class="cpx-who">
          <span class="cpx-avatar"><img src="${esc(abs(cardSrc(c.src)))}" alt=""></span>
          <div>
            <p class="cpx-eyebrow">${esc(c.craft)}</p>
            <p class="cpx-where">${esc(c.city)}${p.sample ? ' · <span class="cpx-sample">Sample Dossier</span>' : ''}</p>
          </div>
        </div>
        <h1 class="cpx-title">${esc(c.creator)}</h1>
        <p class="cpx-headline">${esc(p.headline || c.bio)}</p>
        <div class="cpx-facts-grid">
          ${specFacts.map((f) => `
            <div class="cpx-fact-cell">
              <span class="cpx-fact-lbl">${esc(f.label)}</span>
              <span class="cpx-fact-val">${esc(f.val)}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="cpx-cover-wrap" data-reveal>
        <div class="cpx-cover-meta">
          <span>FIG 01 // PRINCIPAL REEL</span>
          <span>4K RESOLUTION</span>
        </div>
        <div class="cpx-cover">
          <img src="${esc(abs(c.src))}" alt="${esc(c.creator)}, ${esc(c.craft)}" fetchpriority="high" decoding="async">
          ${c.reel && !reduce ? `<video src="${esc(abs(c.reel))}" muted loop playsinline autoplay preload="metadata"></video>
          <button type="button" class="cpx-play" id="cpxPlay" aria-label="Pause reel"><span class="cpx-play-ic is-pause"></span></button>` : ''}
          <span class="cpx-cover-tag">${c.reel ? '4K REEL' : 'STILL'}</span>
        </div>
        <div class="cpx-cover-footer">
          <span>ARCHIVE REF: ${esc(c.slug.toUpperCase())}</span>
          <span>ASPECT: 4 / 3</span>
        </div>
      </div>
    </header>

    <div class="cpx-layout">
      <div class="cpx-col">
        ${sec('about', '01.0', 'Artistic Profile & Biography', `<div class="cpx-about"><div class="cpx-about-box">${(p.about || [c.bio]).map((t) => `<p>${esc(t)}</p>`).join('')}</div></div>`, 'DOSSIER ARCHIVE')}

        ${sec('work', '02.0', 'Selected Repertoire', `
          <div class="cpx-grid">${work.map((g, i) => `
            <button type="button" class="cpx-thumb${i === 0 ? ' is-wide' : ''}" data-shot="${i}" aria-label="Open exhibit ${i + 1}">
              <span class="cpx-thumb-tag">EXHIBIT ${String(i + 1).padStart(2, '0')}</span>
              <img src="${esc(abs(g.src))}" alt="${esc(g.caption || '')}" loading="lazy" decoding="async">
              <span class="cpx-thumb-caption">${esc(g.caption || '')}</span>
            </button>`).join('')}
          </div>`, '5 EXHIBITS')}

        ${sec('services', '03.0', 'Services & Rate Matrix', (p.services || []).length ? `
          <div class="cpx-svc-table">
            <div class="cpx-svc-thead">
              <span class="cpx-th-idx">NO.</span>
              <span class="cpx-th-service">SERVICE SPECIFICATION & SCOPE</span>
              <span class="cpx-th-rate">RATE</span>
              <span class="cpx-th-action">REQUISITION</span>
            </div>
            ${p.services.map((s, idx) => `
              <div class="cpx-svc-row">
                <span class="cpx-svc-idx">${String(idx + 1).padStart(2, '0')}</span>
                <div class="cpx-svc-main">
                  <p class="cpx-svc-t">${esc(s.title)}</p>
                  <p class="cpx-svc-d">${esc(s.desc)}</p>
                  ${s.includes ? `<p class="cpx-svc-i">${ic.check}<span>${esc(s.includes)}</span></p>` : ''}
                </div>
                <div class="cpx-svc-price-col">
                  <span class="cpx-svc-p">${esc(money(s.price))}</span>
                  <small class="cpx-svc-unit">${esc(s.unit)}</small>
                </div>
                <div class="cpx-svc-action-col">
                  <button type="button" class="cpx-mini-btn" data-request data-service="${esc(s.title)}">Request</button>
                </div>
              </div>`).join('')}
          </div>` : '', p.sample ? 'ESTIMATED RATES' : 'FIXED SCHEDULE')}

        ${sec('experience', '04.0', 'Production Chronology', (p.experience || []).length ? `
          <div class="cpx-exp-table">
            <div class="cpx-exp-thead">
              <span class="cpx-exp-th-year">PERIOD</span>
              <span class="cpx-exp-th-role">ROLE / DISCIPLINE</span>
              <span class="cpx-exp-th-proj">PRODUCTION / ENGAGEMENT</span>
            </div>
            <ol class="cpx-exp">
              ${p.experience.map((e) => `
                <li class="cpx-exp-row">
                  <span class="cpx-exp-y">${esc(e.year)}</span>
                  <span class="cpx-exp-r">${esc(e.role)}</span>
                  <span class="cpx-exp-p">${esc(e.project)}</span>
                </li>`).join('')}
            </ol>
          </div>` : '', 'VERIFIED CREDITS')}

        ${sec('credentials', '05.0', 'Licences & Verification', (p.credentials || []).length ? `
          <div class="cpx-cred-table">
            <div class="cpx-cred-thead">
              <span>CREDENTIAL / POLICY</span>
              <span>VERIFICATION STATUS</span>
            </div>
            <ul class="cpx-creds">
              ${p.credentials.map((x) => `
                <li class="cpx-cred-row">
                  <span class="cpx-cred-n">${esc(x.name)}</span>
                  <span class="cpx-cred-b ${x.checked ? 'is-ok' : ''}">${x.checked ? ic.check + 'Checked by Nexus' : 'Self-reported'}</span>
                </li>`).join('')}
            </ul>
          </div>` : '', sampleNote)}

        ${sec('kit', '06.0', 'Hardware Manifest', gear.length ? `
          <div class="cpx-kit-grid">
            ${gear.map((g, i) => `
              <div class="cpx-kit-cell">
                <span class="cpx-kit-idx">ITEM ${String(i + 1).padStart(2, '0')}</span>
                <span class="cpx-kit-name">${esc(g)}</span>
              </div>`).join('')}
          </div>` : '', 'OWNER-OPERATOR')}

        ${sec('how', '07.0', 'Operating Terms & Conditions', p.how ? `
          <dl class="cpx-how-table">
            <div class="cpx-how-row"><dt>01 // PAYMENT TERMS</dt><dd>${esc((p.how.payments || []).join(', '))}. Direct billing to creator (0% Nexus commission).</dd></div>
            <div class="cpx-how-row"><dt>02 // DEPOSIT SCHEDULE</dt><dd>${esc(p.how.deposit)}</dd></div>
            <div class="cpx-how-row"><dt>03 // CANCELLATION POLICY</dt><dd>${esc(p.how.cancel)}</dd></div>
            <div class="cpx-how-row"><dt>04 // ADVANCE NOTICE</dt><dd>At least ${esc(p.how.notice)} required before shoot date</dd></div>
            <div class="cpx-how-row"><dt>05 // TYPICAL AVAILABILITY</dt><dd>${esc(p.how.availability)}</dd></div>
          </dl>` : '', sampleNote)}

        ${sec('faq', '08.0', 'Policies & FAQ', (p.faq || []).length ? `
          <div class="cpx-faq">${p.faq.map((f, i) => `
            <details>
              <summary><span class="cpx-faq-num">${String(i + 1).padStart(2, '0')}</span>${esc(f.q)}</summary>
              <p>${esc(f.a)}</p>
            </details>`).join('')}</div>` : '')}

        ${sec('reviews', '09.0', 'Client Reviews', `
          <div class="cpx-empty">
            <p class="cpx-empty-t">No Client Reviews Recorded</p>
            <p>Verified reviews appear after client engagements conclude through Nexus. Only clients who completed a booking request may submit an evaluation.</p>
          </div>`)}

        <p class="cpx-report"><button type="button" class="cpx-textbtn" id="cpxReport">Report profile irregularity</button></p>
      </div>

      <!-- STICKY REQUISITION DOCKET -->
      <aside class="cpx-card-wrap">
        <div class="cpx-card">
          <div class="cpx-card-head">
            <span class="cpx-card-docket-tag">DOCKET // DIRECT INQUIRY</span>
            <span class="cpx-card-docket-status">ID: ${esc(c.slug.toUpperCase())}</span>
          </div>
          <div class="cpx-card-table">
            <div class="cpx-card-row">
              <span class="cpx-card-lbl">ENGAGEMENT SPEC</span>
              <span class="cpx-card-val">${esc(c.craft)}</span>
            </div>
            <div class="cpx-card-row">
              <span class="cpx-card-lbl">BASE DAY RATE</span>
              <span class="cpx-card-val is-rate"><b>${esc(money(rate))}</b><small> / day</small></span>
            </div>
            <div class="cpx-card-row">
              <span class="cpx-card-lbl">PLATFORM FEE</span>
              <span class="cpx-card-val is-fee">0.00% (DIRECT BILLING)</span>
            </div>
            ${p.how ? `
            <div class="cpx-card-row">
              <span class="cpx-card-lbl">NOTICE REQUIRED</span>
              <span class="cpx-card-val">≥ ${esc(p.how.notice)}</span>
            </div>` : ''}
          </div>
          <button type="button" class="cpx-btn cpx-btn-full" data-request>Send Booking Request</button>
          <button type="button" class="cpx-btn-ghost" id="cpxSave" aria-pressed="${isSaved()}">
            ${ic.save}<span>${isSaved() ? 'Saved to Shortlist' : 'Save to Shortlist'}</span>
          </button>
          <ul class="cpx-card-list">
            <li><span class="cpx-chk-num">01</span><span>0% commission · Direct creator billing</span></li>
            <li><span class="cpx-chk-num">02</span><span>Free direct inquiry · No account needed</span></li>
            ${p.how ? `<li><span class="cpx-chk-num">03</span><span>Lead notice: At least ${esc(p.how.notice)} ahead</span></li>` : ''}
          </ul>
        </div>
      </aside>
    </div>

    <!-- MORE -->
    <section class="cpx-more-sec" data-reveal>
      <div class="cpx-sec-head">
        <div class="cpx-sec-head-left">
          <span class="cpx-sec-idx">INDEX</span>
          <h2 class="cpx-h">Similar Repertoire</h2>
        </div>
        <a class="cpx-textlink" href="/explore">Directory Index ›</a>
      </div>
      <div class="cpx-more">${more.map((x) => `
        <a class="cpx-mcard" href="/c/${esc(x.slug)}">
          <span class="cpx-mcard-img"><img src="${esc(abs(cardSrc(x.src)))}" alt="" loading="lazy" decoding="async"></span>
          <span class="cpx-mcard-k">${esc(x.craft)}</span>
          <span class="cpx-mcard-n">${esc(x.creator)}</span>
          <span class="cpx-mcard-r">${esc(x.city)} · ${esc(money(x.numericRate))}/day</span>
        </a>`).join('')}
      </div>
    </section>

    <!-- phone: rate + request in reach -->
    <div class="cpx-dock">
      <div class="cpx-dock-price">
        <span class="cpx-dock-lbl">BASE RATE</span>
        <p><b>${esc(money(rate))}</b><span> / day</span></p>
      </div>
      <button type="button" class="cpx-btn" data-request>Send request</button>
    </div>

    <!-- lightbox -->
    <div class="cpx-lb" id="cpxLb" hidden>
      <button type="button" class="cpx-lb-x" aria-label="Close">×</button>
      <button type="button" class="cpx-lb-nav" data-d="-1" aria-label="Previous">‹</button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button type="button" class="cpx-lb-nav" data-d="1" aria-label="Next">›</button>
    </div>
  `;

  /* ── Reveal ── */
  const els = main.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
    els.forEach((el) => io.observe(el));
  } else els.forEach((el) => el.classList.add('is-in'));

  /* ── Reel ── */
  const vid = main.querySelector('.cpx-cover video');
  const play = document.getElementById('cpxPlay');
  if (vid) {
    vid.addEventListener('playing', () => vid.classList.add('is-on'));
    vid.addEventListener('error', () => { vid.remove(); if (play) play.remove(); });
    if (play) play.addEventListener('click', () => {
      const i = play.querySelector('.cpx-play-ic');
      if (vid.paused) { vid.play(); i.classList.add('is-pause'); play.setAttribute('aria-label', 'Pause reel'); }
      else { vid.pause(); i.classList.remove('is-pause'); play.setAttribute('aria-label', 'Play reel'); }
    });
  }

  /* ── Lightbox for Work ── */
  const lb = document.getElementById('cpxLb');
  const lbImg = lb.querySelector('img');
  const lbCap = lb.querySelector('figcaption');
  let at = 0;
  function show(i) {
    at = (i + work.length) % work.length;
    lbImg.src = abs(work[at].src);
    lbCap.textContent = (work[at].caption || '') + ' · ' + (at + 1) + ' of ' + work.length;
  }
  main.querySelectorAll('[data-shot]').forEach((b) => b.addEventListener('click', () => { show(+b.dataset.shot); lb.hidden = false; document.body.style.overflow = 'hidden'; }));
  const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; };
  lb.querySelector('.cpx-lb-x').addEventListener('click', closeLb);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  lb.querySelectorAll('.cpx-lb-nav').forEach((b) => b.addEventListener('click', () => show(at + Number(b.dataset.d))));
  addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowRight') show(at + 1);
    if (e.key === 'ArrowLeft') show(at - 1);
  });

  /* ── Save ── */
  const saveBtn = document.getElementById('cpxSave');
  saveBtn.addEventListener('click', () => {
    const s = loadSaved();
    if (s.has(c.slug)) { s.delete(c.slug); toast('Removed ' + c.creator); } else { s.add(c.slug); toast('Saved ' + c.creator); }
    storeSaved(s);
    saveBtn.querySelector('span').textContent = isSaved() ? 'Saved' : 'Save';
    saveBtn.setAttribute('aria-pressed', String(isSaved()));
    badge();
  });

  /* ── Report (placeholder until the reports API is wired) ── */
  document.getElementById('cpxReport').addEventListener('click', () => toast('Thanks. Reporting opens when real profiles go live.'));

  /* ── Request form (same fields + backend route as Explore) ── */
  const modal = document.getElementById('inquiryModal');
  const form = document.getElementById('inquiryForm');
  const need = document.getElementById('inqScope');
  const errEl = document.getElementById('inquiryError');
  function openRequest(service) {
    document.getElementById('inquiryModalTitle').textContent = 'Find someone like ' + first;
    document.getElementById('inquiryModalSub').textContent = c.craft + ' · ' + c.city + ' · from ' + money(rate) + '/day';
    if (need) need.value = service ? service + ': ' : (need.value || c.craft + ' ');
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
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeRequest(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const btn = document.getElementById('inquirySubmitBtn');
    const orig = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…';
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
        fetch('/api/waitlist', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ edit_token: data.edit_token, date: date || undefined, budget: budget || undefined }) }).catch(() => {});
      }
      closeRequest(); form.reset();
      toast("Got it. We'll email you when matching creators are live.");
    } catch (err) {
      if (errEl) { errEl.textContent = "Couldn't send that. Check your connection and try again."; errEl.hidden = false; }
    } finally {
      btn.disabled = false; btn.textContent = orig;
    }
  });
})();
