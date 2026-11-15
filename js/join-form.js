(function(){
  const sec=document.getElementById('join'); if(!sec || !sec.classList.contains('jn')) return;
  const okEmail=v=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
  const bad=el=>{ el.classList.remove('is-bad'); void el.offsetWidth; el.classList.add('is-bad'); el.focus(); };
  /* source + referral tracking: kept with every submission */
  const qs=new URLSearchParams(location.search);
  const SRC={ utm_source:qs.get('utm_source')||'', ref:qs.get('ref')||'', landing:location.pathname };
  /* in-app browsers (TikTok, Instagram, Facebook) block Google sign-in */
  const iab=/(Instagram|FBAN|FBAV|TikTok|musical_ly|Bytedance)/i.test(navigator.userAgent);
  if(iab){ document.getElementById('jnIab').hidden=false; const g=document.getElementById('jnGoogle'); if(g) g.hidden=true; }
  /* founding counter: at launch this reads the real number from the database */
  const SPOTS_OPEN=100; document.getElementById('jnSpots').textContent=SPOTS_OPEN;
  /* chips start the sentence */
  sec.querySelectorAll('input[name=jnCraft]').forEach(r=>r.addEventListener('change',()=>{ const n=document.getElementById('jnNeed'); n.value=r.value+' for '; n.focus(); }));
  /* client request: no account. At launch this inserts into the waitlist table. */
  const f=document.getElementById('jnClientForm'), msg=f.querySelector('.jn-msg');
  f.addEventListener('submit',e=>{ e.preventDefault(); msg.className='jn-msg'; msg.textContent='';
    const need=document.getElementById('jnNeed'), city=document.getElementById('jnCity'), em=document.getElementById('jnCE');
    if(need.value.trim().length<3){ msg.className='jn-msg is-err'; msg.textContent='Tell us what you need.'; return bad(need); }
    if(!city.value.trim()){ msg.className='jn-msg is-err'; msg.textContent='Add your city, or Online.'; return bad(city); }
    if(!okEmail(em.value)){ msg.className='jn-msg is-err'; msg.textContent='Enter a valid email.'; return bad(em); }
    const payload={ role:'client', need:need.value.trim(), city:city.value.trim(), email:em.value.trim().toLowerCase(), ...SRC };
    window.__lastLead=payload;
    try {
      fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json()).then(d => { if (d && d.edit_token) window.__lastEditToken = d.edit_token; }).catch(() => {});
    } catch (_) {}
    document.getElementById('jnCityOut').textContent=payload.city;
    const s1=document.getElementById('jnClientStep1'), s2=document.getElementById('jnClientStep2'); s1.hidden=true; s2.hidden=false; s2.classList.add('is-in'); });
  document.getElementById('jnClientMore').addEventListener('submit',e=>{ e.preventDefault(); const b=e.target.querySelector('button'); b.textContent='Saved'; b.classList.add('is-done'); b.disabled=true; });
  document.getElementById('jnShare').addEventListener('click',async e=>{ const url=location.origin+location.pathname+'?ref=friend#join';
    try{ await navigator.clipboard.writeText(url); e.target.textContent='Link copied'; }catch(_){ e.target.textContent=url; } });
  /* sliding switch + top member login */
  const swEl = document.getElementById('jnSw');
  const setMode = mode => {
    if (mode === 'login') {
      swEl.dataset.login = 'open';
    } else {
      swEl.dataset.login = 'closed';
      swEl.dataset.side = mode;
    }
    sec.querySelectorAll('.jn-tab').forEach(t => {
      const on = t.dataset.side === mode;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
    });

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion && window.anime && typeof window.anime.animate === 'function') {
      const activeCard = swEl.querySelector(mode === 'login' ? '.jn-login-card' : (mode === 'hire' ? '.jn-client' : '.jn-creator'));
      if (activeCard) {
        window.anime.animate(activeCard, {
          opacity: [0.75, 1],
          translateY: [6, 0],
          duration: 220,
          ease: 'out(1.675)',
          onComplete: (a) => {
            if (window.anime && typeof window.anime.cleanInlineStyles === 'function') {
              try { window.anime.cleanInlineStyles(a); } catch (_) {}
            }
            activeCard.style.transform = '';
            activeCard.style.opacity = '';
          }
        });
      }
    }
  };
  sec.querySelectorAll('.jn-tab').forEach(t => t.addEventListener('click', () => setMode(t.dataset.side)));
  sec.querySelector('.jn-panel').addEventListener('click', () => setMode(swEl.dataset.side === 'hire' ? 'be' : 'hire'));
  const openLoginBtn = document.getElementById('jnOpenLoginBtn');
  if (openLoginBtn) openLoginBtn.addEventListener('click', () => setMode('login'));
  const loginBackBtn = document.getElementById('jnLoginBack');
  if (loginBackBtn) loginBackBtn.addEventListener('click', () => setMode(swEl.dataset.side || 'hire'));
  const loginForm = document.getElementById('jnLoginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const lm = loginForm.querySelector('.jn-msg');
      const em = document.getElementById('jnLoginEm');
      const pw = document.getElementById('jnLoginCode');
      lm.className = 'jn-msg'; lm.textContent = '';
      if (!okEmail(em.value)) { lm.className = 'jn-msg is-err'; lm.textContent = 'Enter your registered email.'; return bad(em); }
      if (pw.value.trim().length < 6) { lm.className = 'jn-msg is-err'; lm.textContent = 'Enter your password or 6-digit code.'; return bad(pw); }
      const bt = loginForm.querySelector('button[type="submit"]');
      bt.textContent = 'Signed in'; bt.classList.add('is-done'); bt.disabled = true;
      lm.className = 'jn-msg is-ok'; lm.textContent = 'Verified. Redirecting to your Nexus workspace...';
    });
  }
  if (qs.get('role') === 'creator') setMode('be');
  if (qs.get('role') === 'creator') { setTimeout(() => document.getElementById('jnKT').scrollIntoView({ block: 'center' }), 400); }
})();
