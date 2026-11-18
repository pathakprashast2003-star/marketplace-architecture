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
        <p class="cpx-eyebrow">Nothing here</p>
        <h1 class="cpx-title">We couldn't find that creator.</h1>
        <p class="cpx-sub">The link may be old, or the profile isn't live yet.</p>
        <a class="cpx-btn" href="/explore">Browse all creators</a>
      </section>`;
    return;
  }

  /* ── Data ── */
  const p = c.profile || {};
  const first = c.creator.split(' ')[0];
  const rate = c.numericRate;
  const gear = c.gear || [];
  const gallery = (c.gallery && c.gallery.length ? c.gallery : [{ src: c.src, caption: c.craft }]);
  // Work grid: no repeats, and nothing that is already showing as the reel or cover
  const SAME_PHOTO = { 'assets/cinema_still_crop.webp': 'assets/editorial_cinema_still.webp' };   // one photo saved under two names
  const key = (src) => SAME_PHOTO[src] || src;
  const reelStill = c.reel ? c.reel.replace(/^.*\/reel_/, '').replace(/\.\w+$/, '') : '';       // reel_0_director -> 0_director
  const shown = (src) => src === c.src || (reelStill && src.indexOf('poster_' + reelStill) !== -1);
  const pool = (list) => list.map((x) => ({ src: x.src, caption: x.craft }));
  const work = gallery
    .concat(pool(ALL.filter((x) => x.cat === c.cat && x.slug !== c.slug)))
    .concat(pool(ALL.filter((x) => x.cat !== c.cat)))                      // top up so the grid is always full
    .filter((g) => !shown(g.src))
    .filter((g, i, arr) => arr.findIndex((y) => key(y.src) === key(g.src)) === i)
    .slice(0, 5);   // 1 wide + 4 = a full grid
  const more = ALL.filter((x) => x.slug !== c.slug && x.cat === c.cat).concat(ALL.filter((x) => x.slug !== c.slug && x.cat !== c.cat)).slice(0, 3);
  const isSaved = () => loadSaved().has(c.slug);

  document.title = c.creator + ' · ' + c.craft + ' · Nexus';
  const md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', c.creator + ', ' + c.craft + ' in ' + c.city + '. ' + (p.headline || c.bio) + '. Sample profile on Nexus. 0% commission.');

  const ic = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>',
    plane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M10 13 3 10l1-2 8 1 4-5h2l-2 6 5 2v2l-6-1-3 5h-2l1-5z"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>',
    save: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
  };

  const facts = [
    [ic.pin, 'Based in ' + c.city],
    p.years ? [ic.clock, p.years + ' years doing this'] : null,
    p.languages && p.languages.length ? [ic.globe, p.languages.join(', ')] : null,
    p.travel ? [ic.plane, p.travel] : null,
    p.remote ? [ic.wifi, 'Works remotely too'] : null
  ].filter(Boolean);

  const sec = (id, title, body, note) => body ? `
    <section class="cpx-sec" id="${id}" data-reveal>
      <div class="cpx-sec-head"><h2 class="cpx-h">${title}</h2>${note ? `<span class="cpx-note">${note}</span>` : ''}</div>
      ${body}
    </section>` : '';

  const sampleNote = p.sample ? 'Sample' : '';

  main.innerHTML = `
    <nav class="cpx-crumbs" aria-label="Breadcrumb">
      <a href="/explore">Explore</a><span>›</span>
      <a href="/explore?craft=${esc(c.cat)}">${esc(CAT[c.cat] || 'Creators')}</a><span>›</span>
      <b>${esc(c.creator)}</b>
    </nav>

    <div class="cpx-layout">
      <div class="cpx-col">
        <header class="cpx-intro">
      <div class="cpx-intro-text" data-reveal>
        <div class="cpx-who">
          <span class="cpx-avatar"><img src="${esc(abs(c.src))}" alt=""></span>
          <div>
            <p class="cpx-eyebrow">${esc(c.craft)}</p>
            <p class="cpx-where">${esc(c.city)}${p.sample ? ' · <span class="cpx-sample">Sample profile</span>' : ''}</p>
          </div>
        </div>
        <h1 class="cpx-title">${esc(c.creator)}</h1>
        <p class="cpx-headline">${esc(p.headline || c.bio)}</p>
        <ul class="cpx-facts cpx-facts-grid">${facts.map((f, i) => `<li class="cpx-fact-cell" style="--i: ${i}">${f[0]}<span>${esc(f[1])}</span></li>`).join('')}</ul>
        <div class="cpx-hero-cta">
          <p class="cpx-hero-rate"><b>${esc(money(rate))}</b><span>/ day</span></p>
          <button type="button" class="cpx-btn" data-request>Send request</button>
          <button type="button" class="cpx-icon-btn" data-save aria-label="Save" aria-pressed="${isSaved()}">${ic.save}</button>
        </div>
      </div>
        </header>
        ${sec('about', 'About', (() => {
          const parts = p.about || [c.bio];
          const WORKS_WITH = {
            film: ['Brands', 'Musicians', 'Agencies', 'Indie filmmakers'],
            aerial: ['Brands', 'Tourism', 'Real estate', 'Events'],
            d3: ['Studios', 'Brands', 'Game teams', 'Agencies'],
            art: ['Fashion labels', 'Magazines', 'Beauty brands', 'Agencies'],
            action: ['Car brands', 'Sports', 'Productions', 'Agencies']
          }[c.cat] || [];
          return `
          <div class="cpx-about">
            <blockquote class="cpx-pull">${esc(parts[0])}</blockquote>
            ${parts.slice(1).map((t) => `<p>${esc(t)}</p>`).join('')}
            <div class="cpx-about-grid">
              ${(c.tags || []).length ? `<div><p class="cpx-about-k">Specialties</p><div class="cpx-about-tags">${c.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div></div>` : ''}
              ${WORKS_WITH.length ? `<div><p class="cpx-about-k">Usually works with</p><div class="cpx-about-tags">${WORKS_WITH.map((t) => `<span>${esc(t)}</span>`).join('')}</div></div>` : ''}
            </div>
          </div>`;
        })())}

        ${sec('work', 'Work', `
          <div class="cpx-grid">${work.map((g, i) => `
            <button type="button" class="cpx-thumb${i === 0 ? ' is-wide' : ''}" data-shot="${i}" aria-label="Open image ${i + 1}">
              <img src="${esc(abs(g.src))}" alt="${esc(g.caption || '')}" loading="lazy" decoding="async">
            </button>`).join('')}
          </div>`, 'Sample images')}

        ${sec('services', 'Services', (p.services || []).length ? `
          <div class="cpx-table-wrap">
            <table class="cpx-table cpx-svc-table">
              <thead><tr><th scope="col">Service</th><th scope="col">Includes</th><th scope="col" class="is-num">Price</th><th scope="col"><span class="cpx-sr">Ask</span></th></tr></thead>
              <tbody>${p.services.map((s) => `
                <tr class="cpx-svc-row">
                  <th scope="row"><span class="cpx-svc-t">${esc(s.title)}</span><span class="cpx-svc-d">${esc(s.desc)}</span></th>
                  <td class="cpx-svc-inc">${s.includes ? esc(s.includes) : '—'}</td>
                  <td class="is-num"><span class="cpx-svc-p">${esc(money(s.price))}</span><span class="cpx-svc-u">${esc(s.unit)}</span></td>
                  <td class="is-act"><button type="button" class="cpx-mini-btn" data-request data-service="${esc(s.title)}">Ask</button></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>` : '', p.sample ? 'Example prices' : '')}

        ${sec('experience', 'Experience', (p.experience || []).length ? `
          <div class="cpx-table-wrap">
            <table class="cpx-table cpx-exp-table">
              <thead><tr><th scope="col">Year</th><th scope="col">Role</th><th scope="col">Project</th></tr></thead>
              <tbody>${p.experience.map((e) => `
                <tr><td class="cpx-exp-y">${esc(e.year)}</td><th scope="row">${esc(e.role)}</th><td>${esc(e.project)}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>` : '', 'Self-reported')}

        ${sec('credentials', 'Licences & insurance', (p.credentials || []).length ? `
          <ul class="cpx-creds">${p.credentials.map((x) => `
            <li><span class="cpx-cred-n">${esc(x.name)}</span><span class="cpx-cred-b ${x.checked ? 'is-ok' : ''}">${x.checked ? ic.check + 'Checked by Nexus' : 'Self-reported'}</span></li>`).join('')}
          </ul>` : '', sampleNote)}

        ${sec('kit', 'Kit', gear.length ? `<div class="cpx-kit cpx-kit-grid">${gear.map((g) => `<span class="cpx-kit-cell">${esc(g)}</span>`).join('')}</div>` : '', 'Self-reported')}

        ${sec('how', 'How ' + esc(first) + ' works', p.how ? `
          <dl class="cpx-how">
            <div><dt>Payment</dt><dd>${esc((p.how.payments || []).join(', '))}. You pay ${esc(first)} directly.</dd></div>
            <div><dt>Deposit</dt><dd>${esc(p.how.deposit)}</dd></div>
            <div><dt>Cancellation</dt><dd>${esc(p.how.cancel)}</dd></div>
            <div><dt>Book ahead</dt><dd>At least ${esc(p.how.notice)}</dd></div>
            <div><dt>Usually available</dt><dd>${esc(p.how.availability)}</dd></div>
          </dl>` : '', sampleNote)}

        ${sec('faq', 'Questions', (p.faq || []).length ? `
          <div class="cpx-faq">${p.faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>` : '')}

        ${sec('reviews', 'Reviews', `
          <div class="cpx-empty"><p class="cpx-empty-t">No reviews yet</p><p>Reviews appear after clients work with ${esc(first)} through Nexus. Only people who sent a request can leave one.</p></div>`)}

        <p class="cpx-report"><button type="button" class="cpx-textbtn" id="cpxReport">Report this profile</button></p>
      </div>

      <aside class="cpx-side">
      <div class="cpx-cover" data-reveal>
        <img src="${esc(abs(c.src))}" alt="${esc(c.creator)}, ${esc(c.craft)}" fetchpriority="high" decoding="async">
        ${c.reel && !reduce ? `<video src="${esc(abs(c.reel))}" muted loop playsinline autoplay preload="metadata"></video>
        <button type="button" class="cpx-play" id="cpxPlay" aria-label="Pause reel"><span class="cpx-play-ic is-pause"></span></button>` : ''}
        <span class="cpx-cover-tag">${c.reel ? 'Reel' : 'Photo'}</span>
      </div>
        <div class="cpx-card-wrap">
        <div class="cpx-card">
          <p class="cpx-card-rate"><b>${esc(money(rate))}</b><span> / day</span></p>
          <p class="cpx-card-from">Starting price. Services below.</p>
          <button type="button" class="cpx-btn cpx-btn-full" data-request>Send request</button>
          <button type="button" class="cpx-btn-ghost" id="cpxSave" data-save aria-pressed="${isSaved()}">${ic.save}<span>${isSaved() ? 'Saved' : 'Save'}</span></button>
          <ul class="cpx-card-list">
            <li>${ic.check}<span>0% commission. Pay ${esc(first)} directly.</span></li>
            <li>${ic.check}<span>Free to ask. No account needed.</span></li>
            ${p.how ? `<li>${ic.check}<span>Book at least ${esc(p.how.notice)} ahead</span></li>` : ''}
          </ul>
        </div>
        </div>
      </aside>
    </div>

    <!-- MORE -->
    <section class="cpx-more-sec" data-reveal>
      <div class="cpx-sec-head"><h2 class="cpx-h">More like ${esc(first)}</h2><a class="cpx-textlink" href="/explore">See all ›</a></div>
      <div class="cpx-more">${more.map((x) => `
        <a class="cpx-mcard" href="/c/${esc(x.slug)}">
          <span class="cpx-mcard-img"><img src="${esc(abs(x.src))}" alt="" loading="lazy" decoding="async"></span>
          <span class="cpx-mcard-k">${esc(x.craft)}</span>
          <span class="cpx-mcard-n">${esc(x.creator)}</span>
          <span class="cpx-mcard-r">${esc(x.city)} · ${esc(money(x.numericRate))}/day</span>
        </a>`).join('')}
      </div>
    </section>

    <!-- phone: rate + request in reach -->
    <div class="cpx-dock">
      <p><b>${esc(money(rate))}</b><span>/day</span></p>
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
  const saveBtns = main.querySelectorAll('[data-save]');
  function paintSave() {
    saveBtns.forEach((b) => {
      b.setAttribute('aria-pressed', String(isSaved()));
      const t = b.querySelector('span');
      if (t) t.textContent = isSaved() ? 'Saved' : 'Save';
    });
  }
  saveBtns.forEach((b) => b.addEventListener('click', () => {
    const st = loadSaved();
    if (st.has(c.slug)) { st.delete(c.slug); toast('Removed ' + c.creator); } else { st.add(c.slug); toast('Saved ' + c.creator); }
    storeSaved(st);
    paintSave();
    badge();
  }));

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
