(function () {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Cards are drawn ~320px wide, so they load the smaller copies in assets/card/. The pop-up keeps full size.
  // Any image not in this list (e.g. one added later) just uses its original file.
  const CARD_COPIES = new Set(["assets/cinema_posters/pictura_amber_silhouette.webp", "assets/cinema_posters/pictura_blue_profile.webp", "assets/cinema_posters/pictura_cyan_director.webp", "assets/cinema_posters/pictura_cyan_sunglasses.webp", "assets/cinema_posters/pictura_emerald_bust.webp", "assets/cinema_posters/pictura_fashion_model.webp", "assets/cinema_posters/poster_0_director.webp", "assets/cinema_posters/poster_1_drone.webp", "assets/cinema_posters/poster_2_design.webp", "assets/cinema_posters/poster_4_cgi.webp", "assets/cinema_posters/roster_axel_cablecam.webp", "assets/cinema_posters/roster_clara_venice.webp", "assets/cinema_posters/roster_david_focus_rig.webp", "assets/cinema_posters/roster_maya_aerial.webp", "assets/cinema_posters/roster_nova_pursuit.webp", "assets/cinema_posters/roster_sofia_gaffer.webp", "assets/cinema_posters/roster_valerie_couture.webp", "assets/cinema_still_crop.webp", "assets/editorial_cinema_still.webp"]);
  const cardSize = src => CARD_COPIES.has(src) ? 'assets/card/' + src.slice(7) : src;
  /* ── 2. CURATED CREATOR DATA (sample profiles for the preview) ── */
  const P = 'assets/cinema_posters/';
  const CREATORS = [
    { creator: 'Marcus Vance', craft: 'Commercial DP', city: 'Austin, TX', rate: '$650/day', cat: 'film', src: P + 'pictura_cyan_director.webp', hqSrc: P + 'pictura_cyan_director.webp', reel: 'assets/reels/reel_0_director.mp4', bio: 'ARRI Alexa 35 owner-operator with 12 years commercial DP experience across automotive and narrative.', tags: ['ARRI Alexa 35', 'Cooke 2x', 'Commercial'] },
    { creator: 'Elena Rostova', craft: 'Lookdev & Direction', city: 'Milan, IT', rate: '$520/day', cat: 'art', src: P + 'pictura_emerald_bust.webp', hqSrc: P + 'poster_2_design.webp', bio: 'High-fashion lookdev, lighting architecture, and creative direction for editorial campaigns.', tags: ['Lookdev', 'High Fashion', 'Art Direction'] },
    { creator: 'David Kim', craft: 'Anamorphic Cinema', city: 'Seoul, KR', rate: '$600/day', cat: 'film', src: P + 'pictura_amber_silhouette.webp', hqSrc: 'assets/editorial_cinema_still.webp', bio: 'Anamorphic lens specialist and narrative DP focusing on high-contrast architectural cinema.', tags: ['Cooke 2x', 'Anamorphic', 'Narrative'] },
    { creator: 'Kai Tanaka', craft: 'Virtual Production Artist', city: 'Tokyo, JP', rate: '$720/day', cat: 'd3', src: P + 'poster_4_cgi.webp', hqSrc: P + 'poster_4_cgi.webp', bio: 'LED volume supervisor and real-time environment artist specializing in Unreal 5.4 VP stages.', tags: ['Unreal 5.4', 'Chrome Spatial', 'Virtual Prod'] },
    { creator: 'Maya Lin', craft: 'FPV & Drone Cinema', city: 'Denver, CO', rate: '$580/day', cat: 'aerial', src: P + 'poster_1_drone.webp', hqSrc: P + 'poster_1_drone.webp', reel: 'assets/reels/reel_1_drone.mp4', bio: 'Dual-op Inspire 3 and heavy-lift custom FPV cinema pilot for feature films and commercials.', tags: ['DJI Inspire 3', 'Azure Coast', 'FPV Cinema'] },
    { creator: 'Clara Moreau', craft: 'Commercial DP', city: 'London, UK', rate: '$780/day', cat: 'film', src: P + 'roster_clara_venice.webp', hqSrc: P + 'roster_clara_venice.webp', bio: '8K full-frame cinema specialist for global commercial brands and streaming originals.', tags: ['Sony VENICE 2', 'Master Primes', 'Fashion'] },
    { creator: 'Sora Takahashi', craft: 'FPV Pilot', city: 'Osaka, JP', rate: '$540/day', cat: 'aerial', src: P + 'pictura_cyan_sunglasses.webp', hqSrc: P + 'roster_maya_aerial.webp', bio: 'Cinematic FPV pilot specializing in extreme mountain terrain and urban pursuit sequences.', tags: ['RED Komodo FPV', 'Alpine Dusk', 'Action'] },
    { creator: 'Nova Mercer', craft: 'Pursuit Arm & Rig', city: 'Los Angeles, CA', rate: '$850/day', cat: 'action', src: P + 'pictura_fashion_model.webp', hqSrc: P + 'roster_nova_pursuit.webp', bio: 'Precision tracking vehicle operator and Black Arm technician for high-speed action cinema.', tags: ['Pursuit Arm', 'Black Arm', 'High Speed'] },
    { creator: 'Lucas Meyer', craft: '1st AC & Optical Rig', city: 'Berlin, DE', rate: '$480/day', cat: 'film', src: P + 'pictura_blue_profile.webp', hqSrc: P + 'roster_david_focus_rig.webp', bio: 'Preston FIZ master and optical alignment technician with 80+ feature credits.', tags: ['Preston FIZ', 'ARRI Hi-5', '1st AC'] },
    { creator: 'Aisha Al-Mansoor', craft: 'Architectural Visualization', city: 'Dubai, AE', rate: '$620/day', cat: 'art', src: 'assets/cinema_still_crop.webp', hqSrc: 'assets/cinema_still_crop.webp', bio: 'Ultra-luxury architectural visualization, dawn-to-dusk lighting, and cinematic spatial flythroughs.', tags: ['Golden Glow', 'Editorial', 'Art Direction'] },
    { creator: 'Amara Nwosu', craft: 'Wildlife Cinematographer', city: 'Cape Town, ZA', rate: '$700/day', cat: 'film', src: 'assets/editorial_cinema_still.webp', hqSrc: 'assets/editorial_cinema_still.webp', bio: 'High-speed 8K 120fps wildlife and commercial cinematographer with global broadcast credits.', tags: ['RED V-Raptor XL', '8K 120fps', 'Commercial'] },
    { creator: 'Leo Hartley', craft: 'Heavy-Lift Cinema Drone', city: 'Calgary, AB', rate: '$590/day', cat: 'aerial', src: P + 'roster_maya_aerial.webp', hqSrc: P + 'roster_maya_aerial.webp', reel: 'assets/reels/reel_1_drone.mp4', bio: 'Sub-zero high-altitude drone operations with thermal monitoring and dual transmission.', tags: ['Freefly Alta X', 'Dual Op', 'Mountain Drone'] },
    { creator: 'Kenji Sato', craft: 'Gimbal Pursuit Tracking', city: 'Seattle, WA', rate: '$620/day', cat: 'action', src: P + 'roster_nova_pursuit.webp', hqSrc: 'assets/cinema_still_crop.webp', bio: 'Ronin 2 / MōVI Pro chase specialist with custom motorcycle tracking rigs.', tags: ['Ronin 2', 'Moto Rig', 'Chase Cam'] },
    { creator: 'Jaxson Reed', craft: 'Cinema Drone Systems', city: 'Vancouver, BC', rate: '$680/day', cat: 'aerial', src: P + 'poster_0_director.webp', hqSrc: P + 'poster_1_drone.webp', reel: 'assets/reels/reel_1_drone.mp4', bio: 'FAA Part 107 and Transport Canada certified heavy-lift pilot flying Alexa Mini LF rigs.', tags: ['Alexa Mini LF', 'Heavy-Lift', 'Aerial'] },
    { creator: 'Felix Adler', craft: 'Tabletop & Macro Optics', city: 'Zurich, CH', rate: '$600/day', cat: 'd3', src: P + 'poster_4_cgi.webp', hqSrc: P + 'roster_david_focus_rig.webp', bio: 'Sub-millimeter motion control shots for luxury optics, watches, and hardware.', tags: ['Motion Control', 'Tabletop', 'Macro'] },
    { creator: 'Julian Okafor', craft: 'Narrative DP', city: 'New York, NY', rate: '$890/day', cat: 'film', src: 'assets/editorial_cinema_still.webp', bio: 'Award-winning cinematographer with Panavision Primo glass and Kodak 35mm film workflows.', tags: ['Panavision Primo', '35mm Film', 'Narrative'] },
    { creator: 'Priya Patel', craft: 'Sub-D 3D Lookdev', city: 'Mumbai, IN', rate: '$450/day', cat: 'd3', src: P + 'poster_4_cgi.webp', bio: 'Precision hard-surface modeling, Marvelous Designer cloth simulations, and Octane rendering.', tags: ['Sub-D', 'Marvelous Designer', 'Octane'] },
    { creator: 'Soren Lind', craft: 'Houdini Fluid & FX', city: 'Copenhagen, DK', rate: '$640/day', cat: 'd3', src: P + 'poster_2_design.webp', bio: 'Photorealistic fluid simulations, pyro dynamics, and procedural environments.', tags: ['Houdini FX', 'Fluid Dynamics', 'Procedural'] },
    { creator: 'Tomas Varga', craft: 'Underwater & Marine DP', city: 'Sydney, AU', rate: '$750/day', cat: 'film', src: P + 'poster_0_director.webp', bio: 'Nauticam housing specialist shooting Alexa 35 offshore, reef, and big-wave surf projects.', tags: ['Nauticam', 'Marine Cinema', 'Water DP'] },
    { creator: 'Chloe Dupuis', craft: 'Commercial Colorist', city: 'Paris, FR', rate: '$560/day', cat: 'art', src: P + 'poster_2_design.webp', bio: 'DaVinci Resolve Advanced Panel colorist handling high-end beauty, luxury, and car commercials.', tags: ['DaVinci Resolve', 'ACES Workflow', 'Colorist'] },
    { creator: 'Liam Brooks', craft: 'Steadicam Gold Operator', city: 'Toronto, ON', rate: '$700/day', cat: 'action', src: P + 'roster_nova_pursuit.webp', bio: 'Steadicam M2 with Volt horizon stabilization for uninterrupted long-take sequences.', tags: ['Steadicam M2', 'Volt Horizon', 'Long Take'] },
    { creator: 'Oliver Scott', craft: 'Macro Natural History', city: 'Bristol, UK', rate: '$580/day', cat: 'film', src: 'assets/editorial_cinema_still.webp', bio: 'Laowa 24mm probe lens specialist with motorized slider and high-speed Phantom Flex rigs.', tags: ['Laowa Probe', 'Phantom Flex', 'High Speed'] },
    { creator: 'Mei-Ling Zhou', craft: 'Micro-FPV Indoor Racing', city: 'Hong Kong, HK', rate: '$510/day', cat: 'aerial', src: P + 'roster_maya_aerial.webp', reel: 'assets/reels/reel_1_drone.mp4', bio: 'Sub-250g naked GoPro cinewhoop pilot flying tight interior architectural walkthroughs.', tags: ['Cinewhoop', 'Naked GoPro', 'Indoor FPV'] },
    { creator: 'Santiago Morales', craft: 'Virtual Production Lead', city: 'Madrid, ES', rate: '$690/day', cat: 'd3', src: P + 'poster_4_cgi.webp', bio: 'In-camera VFX technical director, tracking sync, and real-time color grading.', tags: ['ICVFX', 'Stype Tracking', 'Virtual Studio'] },
    { creator: 'Zara Eklund', craft: 'Editorial Film Photographer', city: 'Stockholm, SE', rate: '$490/day', cat: 'art', src: P + 'poster_2_design.webp', bio: 'Medium format Hasselblad H6D and 35mm Leica M6 editorial portraiture for global magazines.', tags: ['Hasselblad', 'Leica M6', 'Medium Format'] },
    { creator: 'Dante Rossi', craft: 'Remote Head Crane Tech', city: 'Rome, IT', rate: '$650/day', cat: 'action', src: P + 'roster_nova_pursuit.webp', bio: 'Technocrane 30 and Scorpio head operator for fluid multi-axis stadium and concert sweeps.', tags: ['Technocrane', 'Scorpio Head', 'Jib & Crane'] },
    { creator: 'Hana Becker', craft: 'Optical Lens Tech & DIT', city: 'Frankfurt, DE', rate: '$520/day', cat: 'film', src: P + 'roster_david_focus_rig.webp', bio: 'On-set DIT and live color grading technician with dual Pomfort Livegrade carts.', tags: ['Livegrade', 'DIT Cart', 'Color Science'] },
    { creator: 'Tariq Hassan', craft: 'Heavy-Gimbal Tracking Car', city: 'Abu Dhabi, AE', rate: '$810/day', cat: 'action', src: 'assets/cinema_still_crop.webp', bio: 'Modified electric tracking buggy pilot with gyro-stabilized carbon fiber cranes.', tags: ['Electric Tracking', 'Gyro Stabilized', 'Desert High Speed'] },
    { creator: 'Ingrid Holm', craft: 'Stylized 3D Character Art', city: 'Oslo, NO', rate: '$540/day', cat: 'd3', src: P + 'poster_4_cgi.webp', bio: 'Character lookdev, procedural hair grooming in XGen, and Arnold subsurface shaders.', tags: ['XGen Grooming', 'Subsurface Shading', 'Arnold 3D'] },
    { creator: 'Nina Kowalski', craft: 'Stop-Motion Armature DP', city: 'Prague, CZ', rate: '$530/day', cat: 'art', src: 'assets/editorial_cinema_still.webp', bio: 'Precision frame-by-frame motion control with Dragonframe and custom miniature rigs.', tags: ['Dragonframe', 'Stop Motion', 'Miniature Rig'] },
    { creator: 'Emil Lindqvist', craft: 'Motion Design & Typography', city: 'Helsinki, FI', rate: '$570/day', cat: 'd3', src: P + 'poster_4_cgi.webp', bio: 'Kinetic 3D typography, title sequence direction, and brand motion systems.', tags: ['Cinema 4D', 'Redshift', 'Kinetic Type'] },
    { creator: 'Sofia Reyes', craft: 'Gaffer & Master Rigger', city: 'Mexico City, MX', rate: '$480/day', cat: 'film', src: P + 'roster_sofia_gaffer.webp', hqSrc: P + 'roster_sofia_gaffer.webp', bio: 'Complex truss rigging, helium balloon lights, and generator truck distribution.', tags: ['Truss Rigging', 'Helium Balloon', 'Master Electrician'] },
    { creator: 'Axel Berg', craft: 'Extreme Sports Cable Cam', city: 'Innsbruck, AT', rate: '$660/day', cat: 'action', src: P + 'roster_axel_cablecam.webp', hqSrc: P + 'roster_axel_cablecam.webp', bio: 'Automated 1000m high-speed winch cable-cam systems for alpine and freeride sports.', tags: ['Cable Cam', 'High-Speed Winch', 'Alpine Cinema'] },
    { creator: 'Valerie Laurent', craft: 'Luxury Editorial Director', city: 'Geneva, CH', rate: '$670/day', cat: 'art', src: P + 'roster_valerie_couture.webp', hqSrc: P + 'roster_valerie_couture.webp', bio: 'Luxury jewelry and haute-couture cinema still direction for international luxury houses.', tags: ['Haute Couture', 'Jewelry Macro', 'Luxury Film'] }
  ];
  /* ── 3. CREATOR SPOTLIGHT MODAL & SHORTLIST ENGINE ── */
  const fxModal = document.getElementById('fxModal');
  const fxShortlistToggle = document.getElementById('fxShortlistToggle');
  const fxShortlistBtn = document.getElementById('fxShortlistBtn');
  const fxRailToast = document.getElementById('fxRailToast');
  const shortlistedCreators = new Set();
  let activeSpotlightIndex = 0;
  let activeSpotlightItem = CREATORS[0];
  const WS_SVGS = {
    check: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    star: '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2l2.92 6.26 6.88.85-5.08 4.74 1.32 6.8L12 17.52l-6.04 3.33 1.32-6.8L2.2 9.31l6.88-.85L12 2.2z"/></svg>',
    arrow: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    save: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
  };
  function getStudioMeta(item) {
    return ['Sample', item.city || 'Example profile', 'Preview only'];
  }
  function createStudioCardEl(item, idx, opts) {
    const isCarousel = Boolean(opts && opts.carousel);
    const card = document.createElement('article');
    card.className = isCarousel ? 'lz-card' : 'dir-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', item.creator + ' — ' + item.craft + ' (' + item.rate + ')');
    const hasReel = Boolean(item.reel);
    const rateParts = String(item.rate || '').match(/^(\$?[\d,]+)(.*)$/);
    const rateHtml = rateParts
      ? esc(rateParts[1]) + '<small>' + esc(rateParts[2]) + '</small>'
      : esc(item.rate);
    const firstName = (item.creator || 'Talent').split(' ')[0];
    const meta = getStudioMeta(item, idx);
    const isSaved = shortlistedCreators.has(item.creator);
    card.innerHTML =
      '<div class="ws-stage">' +
        '<img src="' + esc(cardSize(item.hqSrc || item.src)) + '" alt="' + esc(item.creator) + ' work still" loading="' + (isCarousel ? 'eager' : 'lazy') + '" decoding="async" draggable="false">' +
        (hasReel ? '<video muted playsinline loop preload="none" src="' + esc(item.reel) + '"></video>' : '') +
        '<span class="ws-hud' + (hasReel ? '' : ' is-still') + '" aria-hidden="true"><span class="ws-hud-dot"></span><span>' + (hasReel ? 'Reel' : 'Photo') + '</span></span>' +
        '<span class="ws-price">' + rateHtml + '</span>' +
      '</div>' +
      '<div class="ws-body">' +
        '<div class="ws-kicker-row">' +
          '<span class="ws-kicker">' + esc(item.craft) + ' · ' + esc(item.city) + '</span>' +
          '<span class="ws-verified" aria-label="Verified">' + WS_SVGS.check + '</span>' +
        '</div>' +
        '<h3 class="ws-name">' + esc(item.creator) + '</h3>' +
        '<p class="ws-blurb">' + esc(item.bio) + '</p>' +
        '<div class="ws-foot">' +
          '<div class="ws-meta">' +
            '<div class="ws-meta-line">' +
              '<span class="ws-star" aria-hidden="true">' + WS_SVGS.star + '</span>' +
              '<span class="ws-score">' + esc(meta[0]) + '</span>' +
              '<span class="ws-sep">·</span>' +
              '<span class="ws-track">' + esc(meta[1]) + '</span>' +
            '</div>' +
            '<div class="ws-sla"><span class="ws-dot" aria-hidden="true"></span><span>' + esc(meta[2]) + '</span></div>' +
          '</div>' +
          '<div class="ws-actions">' +
            '<button type="button" class="ws-book"><span>View profile</span>' + WS_SVGS.arrow + '</button>' +
            '<button type="button" class="ws-save' + (isSaved ? ' is-saved' : '') + '" data-creator="' + esc(item.creator) + '" aria-pressed="' + (isSaved ? 'true' : 'false') + '" aria-label="Save ' + esc(item.creator) + ' to Shortlist">' + WS_SVGS.save + '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    const bookBtn = card.querySelector('.ws-book');
    if (bookBtn) {
      bookBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (isCarousel && (window.__lzMovedPx || 0) > 8) return;
        // the full profile page: /c/<slug>
        window.location.href = '/c/' + item.creator.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      });
    }
    const saveBtn = card.querySelector('.ws-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (isCarousel && (window.__lzMovedPx || 0) > 8) return;
        if (shortlistedCreators.has(item.creator)) {
          shortlistedCreators.delete(item.creator);
          showRailToast('Removed ' + item.creator + ' from shortlist');
        } else {
          shortlistedCreators.add(item.creator);
          showRailToast('✓ Saved ' + item.creator + ' to shortlist');
        }
        updateShortlistUI();
        if (typeof window.__onShortlistToggled === 'function') {
          window.__onShortlistToggled();
        }
      });
    }
    card.addEventListener('dragstart', e => e.preventDefault());
    card.addEventListener('keydown', e => {
      if (e.target !== card) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
    return card;
  }
  function updateShortlistUI() {
    if (fxShortlistToggle && activeSpotlightItem) {
      const saved = shortlistedCreators.has(activeSpotlightItem.creator);
      fxShortlistToggle.classList.toggle('is-saved', saved);
      fxShortlistToggle.setAttribute('aria-pressed', saved ? 'true' : 'false');
      fxShortlistToggle.textContent = saved ? '✓ Shortlisted' : '+ Save to Shortlist';
    }
    if (fxShortlistBtn) {
      const count = shortlistedCreators.size;
      fxShortlistBtn.hidden = count === 0;
      fxShortlistBtn.textContent = 'Shortlist · ' + count;
    }
    document.querySelectorAll('.ws-save[data-creator]').forEach(btn => {
      const saved = shortlistedCreators.has(btn.dataset.creator);
      btn.classList.toggle('is-saved', saved);
      btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
    });
  }
  function showRailToast(msg) {
    if (!fxRailToast) return;
    fxRailToast.textContent = msg;
    fxRailToast.classList.add('is-show');
    clearTimeout(fxRailToast._timer);
    fxRailToast._timer = setTimeout(() => {
      fxRailToast.classList.remove('is-show');
    }, 1800);
  }
  function openCreatorSpotlight(item, index, originEl) {
    if (!fxModal || !item) return;
    activeSpotlightItem = item;
    if (typeof index === 'number' && index >= 0) {
      activeSpotlightIndex = index;
    } else {
      const foundIdx = CREATORS.findIndex(c => c.creator === item.creator && c.craft === item.craft);
      activeSpotlightIndex = foundIdx >= 0 ? foundIdx : 0;
    }
    const img = document.getElementById('fxMImg');
    const vid = document.getElementById('fxMVideo');
    if (img) {
      img.src = item.hqSrc || item.src;
      img.alt = item.creator + ' — ' + item.craft;
    }
    if (vid) {
      if (item.reel) {
        vid.src = item.reel;
        vid.style.display = 'block';
        vid.play().catch(() => {});
      } else {
        vid.style.display = 'none';
        vid.pause();
      }
    }
    const mk = document.getElementById('fxMK');
    const mt = document.getElementById('fxMT');
    const mmeta = document.getElementById('fxMMeta');
    const md = document.getElementById('fxMD');
    const tags = document.getElementById('fxMTags');
    if (mk) mk.textContent = item.craft + ' · Sample profile';
    if (mt) mt.textContent = item.creator;
    if (mmeta) mmeta.textContent = item.city + ' · ' + item.rate;
    if (md) md.textContent = item.bio;
    if (tags) tags.innerHTML = item.tags.map(t => '<span>' + esc(t) + '</span>').join('');
    updateShortlistUI();
    const poster = document.getElementById('fxPoster');
    fxModal.hidden = false;
    if (poster && originEl) {
      const originRect = originEl.getBoundingClientRect();
      const targetRect = poster.getBoundingClientRect();
      const dx = (originRect.left + originRect.width / 2) - (targetRect.left + targetRect.width / 2);
      const dy = (originRect.top + originRect.height / 2) - (targetRect.top + targetRect.height / 2);
      const scale = originRect.width / Math.max(1, targetRect.width);
      poster.style.transition = 'none';
      poster.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) scale(' + scale.toFixed(3) + ')';
      poster.style.borderRadius = '16px';
      fxModal.style.opacity = '0';
      requestAnimationFrame(() => {
        poster.style.transition = 'transform 0.44s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.44s ease';
        fxModal.style.transition = 'opacity 0.36s ease';
        poster.style.transform = 'translate3d(0,0,0) scale(1)';
        poster.style.borderRadius = '28px';
        fxModal.style.opacity = '1';
      });
    }
    const closeBtn = document.getElementById('fxClose');
    if (closeBtn) closeBtn.focus();
  }
  if (fxModal) {
    let lastFocus = null;
    const origOpen = openCreatorSpotlight;
    window.__openCreatorSpotlight = (item, index, el) => {
      lastFocus = document.activeElement;
      origOpen(item, index, el);
    };
    const closeSpot = () => {
      const poster = document.getElementById('fxPoster');
      const vid = document.getElementById('fxMVideo');
      if (vid) vid.pause();
      if (poster) {
        poster.style.transition = 'transform 0.28s ease, opacity 0.28s ease';
        poster.style.transform = 'scale(0.92) translateY(12px)';
        poster.style.opacity = '0';
      }
      fxModal.style.opacity = '0';
      setTimeout(() => {
        fxModal.hidden = true;
        if (poster) {
          poster.style.transform = 'none';
          poster.style.opacity = '1';
        }
        fxModal.style.opacity = '1';
        if (lastFocus && typeof lastFocus.focus === 'function') {
          lastFocus.focus({ preventScroll: true });
        }
      }, 260);
    };
    const closeBtn = document.getElementById('fxClose');
    if (closeBtn) closeBtn.addEventListener('click', closeSpot);
    fxModal.addEventListener('click', e => { if (e.target === fxModal) closeSpot(); });
    window.addEventListener('keydown', e => {
      if (fxModal.hidden) return;
      if (e.key === 'Escape') {
        closeSpot();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIdx = (activeSpotlightIndex - 1 + CREATORS.length) % CREATORS.length;
        openCreatorSpotlight(CREATORS[prevIdx], prevIdx);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIdx = (activeSpotlightIndex + 1) % CREATORS.length;
        openCreatorSpotlight(CREATORS[nextIdx], nextIdx);
      }
    });
    if (fxShortlistToggle) {
      fxShortlistToggle.addEventListener('click', () => {
        if (!activeSpotlightItem) return;
        const name = activeSpotlightItem.creator;
        if (shortlistedCreators.has(name)) {
          shortlistedCreators.delete(name);
          showRailToast('Removed from shortlist');
        } else {
          shortlistedCreators.add(name);
          showRailToast('✓ Added to shortlist');
        }
        updateShortlistUI();
      });
    }
    const prevBtn = document.getElementById('fxPrevBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const prevIdx = (activeSpotlightIndex - 1 + CREATORS.length) % CREATORS.length;
        openCreatorSpotlight(CREATORS[prevIdx], prevIdx);
      });
    }
    const nextBtn = document.getElementById('fxNextBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const nextIdx = (activeSpotlightIndex + 1) % CREATORS.length;
        openCreatorSpotlight(CREATORS[nextIdx], nextIdx);
      });
    }
    const copyBtn = document.getElementById('fxCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (!activeSpotlightItem) return;
        const url = window.location.origin + window.location.pathname + '#creator=' + encodeURIComponent(activeSpotlightItem.creator);
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(url);
          }
          showRailToast('✓ Profile link copied');
        } catch (err) {
          showRailToast('✓ Profile link ready');
        }
      });
    }
    const craftFilterBtn = document.getElementById('fxCraftFilterBtn');
    if (craftFilterBtn) {
      craftFilterBtn.addEventListener('click', () => {
        if (!activeSpotlightItem) return;
        const targetCat = activeSpotlightItem.cat;
        closeSpot();
        const matchingTab = document.querySelector('#dirTabs .dir-tab[data-dir-cat="' + targetCat + '"]');
        if (matchingTab) {
          matchingTab.click();
          const sec = document.getElementById('showcase');
          if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          showRailToast('Filtered to ' + activeSpotlightItem.craft);
        }
      });
    }
  }
  /* ── 4. LAZAREV DEPTH CAROUSEL + STRUCTURED WORK DIRECTORY ENGINE (#showcase) ── */
  const dirGrid = document.getElementById('dirGrid');
  const lzStage = document.getElementById('lzStage');
  const lzWrap = document.getElementById('lzWrap');
  const dirGridPanel = document.getElementById('dirGridPanel');
  const lzGridToggle = document.getElementById('lzGridToggle');
  if (lzStage || dirGrid) {
    const dirTabs = document.querySelectorAll('#dirTabs .dir-tab');
    const dirCountBadge = document.getElementById('dirCountBadge');
    const dirMoreBtn = document.getElementById('dirMoreBtn');
    const dirMoreWrap = document.getElementById('dirMoreWrap');
    const fxInputRef = document.getElementById('fxQ');
    const lzPrevBtn = document.getElementById('lzPrevBtn');
    const lzNextBtn = document.getElementById('lzNextBtn');
    const lzAutoBtn = document.getElementById('lzAutoBtn');
    const lzStatusPill = document.getElementById('lzStatusPill');
    let dirCat = 'all';
    let shortlistOnly = false;
    let showAll = false;
    let filteredItems = CREATORS.slice();
    const fxSearchForm = document.getElementById('fxSearch');
    let lzRing = [];      // Virtual slots (padded >= 9 so outer wings never teleport on small filters)
    let lzCards = [];
    let lzCurrent = 0;    // Current continuous index
    let lzFrom = 0;
    let lzTarget = 0;
    let lzTweenStart = 0;
    let lzTweenDur = 860;
    let lzTweenEaseFn = null;
    let lzIsTweening = false;
    let lzAutoPlay = !reduce;
    let lzHovered = false;
    let lzInView = true;
    let lzLastStepTime = performance.now();
    let lzStageW = (lzStage && lzStage.clientWidth) || window.innerWidth;
    let lzRO = null;
    let lzDragging = false;
    let lzCaptured = false;
    let lzDragStartX = 0;
    let lzDragStartY = 0;
    let lzDragStartVal = 0;
    let lzMovedPx = 0;
    let lzVelocity = 0;        // Cards per second for inertia after drag
    let lzLastDragX = 0;
    let lzLastDragTime = 0;
    let lzLastCenterKey = '';
    let lzPillAnim = null;
    let lzRafId = 0;
    function createCubicBezier(p1x, p1y, p2x, p2y) {
      const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
      const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
      const sampleX = t => ((ax * t + bx) * t + cx) * t;
      const sampleY = t => ((ay * t + by) * t + cy) * t;
      const sampleDX = t => (3 * ax * t + 2 * bx) * t + cx;
      return x => {
        if (x <= 0) return 0;
        if (x >= 1) return 1;
        let t = x;
        for (let i = 0; i < 6; i++) {
          const err = sampleX(t) - x;
          if (Math.abs(err) < 1e-4) break;
          const d = sampleDX(t);
          if (Math.abs(d) < 1e-5) break;
          t -= err / d;
        }
        return Math.min(1, Math.max(0, sampleY(Math.min(1, Math.max(0, t)))));
      };
    }
    const easeWhip = createCubicBezier(0.70, 0, 0.33, 1);
    const easeOutCubic = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
    function mod(n, m) {
      return ((n % m) + m) % m;
    }
    function shortestOffset(idx, center, len) {
      let d = idx - mod(center, len);
      if (d > len / 2) d -= len;
      if (d < -len / 2) d += len;
      return d;
    }
    const LZ_SCALE_STOPS = [1.0, 0.85, 0.72, 0.61, 0.54];
    function sampleScaleAt(absD) {
      const idx = Math.floor(absD);
      const last = LZ_SCALE_STOPS.length - 1;
      if (idx >= last) return LZ_SCALE_STOPS[last];
      return LZ_SCALE_STOPS[idx] + (LZ_SCALE_STOPS[idx + 1] - LZ_SCALE_STOPS[idx]) * (absD - idx);
    }
    function sampleDepthCurve(absD, stageW) {
      const isMobile = stageW <= 640;
      const isTablet = stageW > 640 && stageW < 960;
      const B = isMobile ? 148 : 172;
      const gap = isMobile ? 16 : (isTablet ? 20 : 24);
      const s = sampleScaleAt(absD);
      const k = Math.floor(absD);
      const frac = absD - k;
      let x = (B * (LZ_SCALE_STOPS[0] + LZ_SCALE_STOPS[1]) + gap) * frac;
      for (let step = 1; step <= k; step++) {
        const dHere = step + frac;
        x += gap + B * (sampleScaleAt(dHere - 1) + sampleScaleAt(dHere));
      }
      return {
        x,
        s,
        z: absD < 0.5 ? 30 : Math.max(10, 26 - k * 4)
      };
    }
    function goToStep(nextTarget, dur, easeFn) {
      if (!lzRing.length) return;
      lzFrom = lzCurrent;
      lzTarget = nextTarget;
      lzTweenStart = performance.now();
      lzTweenDur = dur || 960;
      lzTweenEaseFn = easeFn || easeWhip;
      lzIsTweening = true;
      lzLastStepTime = performance.now();
      startLzLoop();
    }
    function buildLazarevCarousel() {
      if (!lzStage) return;
      const halo = lzStage.querySelector('.lz-halo');
      lzStage.innerHTML = '';
      if (halo) lzStage.appendChild(halo);
      if (!filteredItems.length) {
        lzRing = [];
        lzCards = [];
        if (lzStatusPill) lzStatusPill.textContent = '0 matches';
        return;
      }
      lzRing = filteredItems.slice();
      while (lzRing.length < 11) {
        lzRing = lzRing.concat(filteredItems);
      }
      lzCurrent = 0;
      lzTarget = 0;
      lzFrom = 0;
      lzIsTweening = false;
      lzLastCenterKey = '';
      lzLastStepTime = performance.now();
      lzCards = lzRing.map((item, slotIdx) => {
        const globalIdx = CREATORS.indexOf(item);
        const card = createStudioCardEl(item, globalIdx, { carousel: true });
        card.addEventListener('click', () => {
          if (lzMovedPx > 8) return;
          const d = shortestOffset(slotIdx, lzCurrent, lzRing.length);
          if (Math.abs(d) < 0.28) {
            (window.__openCreatorSpotlight || openCreatorSpotlight)(item, globalIdx, card);
          } else {
            goToStep(Math.round(lzCurrent) + Math.round(d), 900, easeWhip);
          }
        });
        lzStage.appendChild(card);
        return {
          el: card,
          item,
          vid: card.querySelector('video'),
          parked: false,
          isCenter: false,
          playing: false,
          lastZ: -1
        };
      });
      lzStageW = lzStage.clientWidth || window.innerWidth;
      if (!lzRO) {
        if ('ResizeObserver' in window) {
          lzRO = new ResizeObserver(entries => {
            const w = entries[0] && entries[0].contentRect && entries[0].contentRect.width;
            if (w && Math.abs(w - lzStageW) > 0.5) {
              lzStageW = w;
              layoutLazarevCards();
            }
          });
          lzRO.observe(lzStage);
        } else {
          window.addEventListener('resize', () => {
            lzStageW = (lzStage && lzStage.clientWidth) || window.innerWidth;
            layoutLazarevCards();
          });
        }
      }
      layoutLazarevCards();
      startLzLoop();
    }
    const LZ_DWELL_MS = 1800;
    const LZ_GLIDE_MS = 950;
    const LZ_VIDEO_DELAY_MS = 220;
    const LZ_INERTIA_DECAY = 0.91;
    let lzLastLaidCurrent = NaN;
    let lzLastVideoReady = false;
    function layoutLazarevCards() {
      const n = lzCards.length;
      if (!n) return;
      lzLastLaidCurrent = lzCurrent;
      const nowMs = performance.now();
      const videoWindowOpen = !lzIsTweening && !lzDragging && lzInView && (nowMs - lzLastStepTime >= LZ_VIDEO_DELAY_MS);
      lzLastVideoReady = videoWindowOpen;
      const stageW = lzStageW || window.innerWidth;
      const isMobile = stageW <= 640;
      const isTablet = stageW > 640 && stageW < 960;
      const B = isMobile ? 148 : 172;
      const gap = isMobile ? 16 : (isTablet ? 20 : 24);
      const minWingPitch = 1.08 * B + gap;
      const maxVisibleD = Math.min((n - 1) * 0.49, 1.5 + Math.ceil((stageW * 0.5 + 172) / minWingPitch));
      const centerIdx = mod(Math.round(lzCurrent), n);
      for (let i = 0; i < n; i++) {
        const c = lzCards[i];
        const d = shortestOffset(i, lzCurrent, n);
        const absD = Math.abs(d);
        if (absD > maxVisibleD) {
          if (!c.parked) {
            c.parked = true;
            c.el.style.visibility = 'hidden';
            c.el.style.opacity = '0';
            c.el.style.pointerEvents = 'none';
            if (c.isCenter) {
              c.isCenter = false;
              c.el.classList.remove('is-center');
            }
            if (c.playing) {
              c.playing = false;
              c.el.classList.remove('is-playing');
              if (c.vid && !c.vid.paused) c.vid.pause();
            }
          }
          continue;
        }
        if (c.parked) {
          c.parked = false;
          c.el.style.visibility = 'visible';
          c.el.style.opacity = '1';
          c.el.style.pointerEvents = 'auto';
        }
        const curve = sampleDepthCurve(absD, stageW);
        const x = (d >= 0 ? curve.x : -curve.x);
        const isCenter = absD < 0.35;
        c.el.style.transform = 'translate3d(' + x.toFixed(2) + 'px, 0, 0) scale(' + curve.s.toFixed(5) + ')';
        if (c.lastZ !== curve.z) {
          c.lastZ = curve.z;
          c.el.style.zIndex = String(curve.z);
        }
        if (c.isCenter !== isCenter) {
          c.isCenter = isCenter;
          c.el.classList.toggle('is-center', isCenter);
        }
        const settledEnough = isCenter && videoWindowOpen && c.vid && absD < 0.03;
        if (settledEnough) {
          if (!c.playing) {
            c.playing = true;
            c.el.classList.add('is-playing');
            c.vid.play().catch(() => {});
          }
        } else if (c.playing && c.vid) {
          c.playing = false;
          c.el.classList.remove('is-playing');
          if (!c.vid.paused) c.vid.pause();
        }
      }
      const activeItem = lzCards[centerIdx] && lzCards[centerIdx].item;
      if (activeItem) {
        const realIdx = filteredItems.indexOf(activeItem);
        const key = realIdx + '|' + filteredItems.length;
        if (key !== lzLastCenterKey && lzStatusPill) {
          lzLastCenterKey = key;
          const numStr = String(realIdx + 1).padStart(2, '0');
          const totStr = String(filteredItems.length).padStart(2, '0');
          lzStatusPill.textContent = numStr + ' / ' + totStr + ' · ' + activeItem.creator;
        }
      }
    }
    let lzLastFrameTime = 0;
    function tickLz(now) {
      if (!lzInView || !lzCards.length) {
        lzRafId = 0;
        return;
      }
      const dt = lzLastFrameTime ? Math.min((now - lzLastFrameTime) / 1000, 0.05) : 0;
      lzLastFrameTime = now;
      if (lzIsTweening) {
        const elapsed = now - lzTweenStart;
        const t = Math.min(1, elapsed / lzTweenDur);
        const ease = lzTweenEaseFn || easeWhip;
        lzCurrent = lzFrom + (lzTarget - lzFrom) * ease(t);
        if (t >= 1) {
          lzCurrent = lzTarget;
          lzIsTweening = false;
          lzVelocity = 0;
          lzLastStepTime = now;
        }
      } else if (!lzDragging) {
        if (Math.abs(lzVelocity) >= 0.35) {
          lzCurrent += lzVelocity * dt;
          lzVelocity *= Math.pow(LZ_INERTIA_DECAY, dt * 60);
          lzLastStepTime = now;
        } else if (Math.abs(lzVelocity) > 0.001) {
          const snapTarget = Math.round(lzCurrent + lzVelocity * 0.18);
          lzVelocity = 0;
          goToStep(snapTarget, 580, easeOutCubic);
        } else if (lzAutoPlay && !lzHovered && (!fxModal || fxModal.hidden)) {
          if (now - lzLastStepTime >= LZ_DWELL_MS) {
            goToStep(Math.round(lzCurrent) + 1, LZ_GLIDE_MS, easeWhip);
          }
        } else {
          const nearest = Math.round(lzCurrent);
          const diff = nearest - lzCurrent;
          if (Math.abs(diff) > 0.002) {
            lzCurrent += diff * Math.min(1, dt * 8);
          }
          lzLastStepTime = now;
        }
      }
      const shouldVideoOpen = !lzIsTweening && !lzDragging && lzInView && (now - lzLastStepTime >= LZ_VIDEO_DELAY_MS);
      if (lzCurrent !== lzLastLaidCurrent || shouldVideoOpen !== lzLastVideoReady) {
        layoutLazarevCards();
      }
      lzRafId = requestAnimationFrame(tickLz);
    }
    function startLzLoop() {
      if (!lzRafId && lzInView && lzCards.length) {
        lzLastFrameTime = 0;
        lzRafId = requestAnimationFrame(tickLz);
      }
    }
    if (lzStage) {
      lzStage.addEventListener('mouseenter', () => { lzHovered = true; });
      lzStage.addEventListener('mouseleave', () => {
        lzHovered = false;
        lzLastStepTime = performance.now();
      });
      lzStage.addEventListener('pointerdown', e => {
        if (e.button && e.button !== 0) return;
        lzDragging = true;
        lzCaptured = false;
        lzIsTweening = false;
        lzDragStartX = e.clientX;
        lzDragStartY = e.clientY;
        lzDragStartVal = lzCurrent;
        lzMovedPx = 0;
        window.__lzMovedPx = 0;
        lzVelocity = 0;
        lzLastDragX = e.clientX;
        lzLastDragTime = performance.now();
        startLzLoop();
      });
      lzStage.addEventListener('pointermove', e => {
        if (!lzDragging) return;
        const dx = e.clientX - lzDragStartX;
        const dy = e.clientY - lzDragStartY;
        lzMovedPx = Math.max(lzMovedPx, Math.abs(dx));
        window.__lzMovedPx = lzMovedPx;
        if (!lzCaptured) {
          if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
            lzDragging = false;
            return;
          }
          if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
            lzCaptured = true;
            lzStage.classList.add('is-dragging');
            try { lzStage.setPointerCapture(e.pointerId); } catch (err) {}
          } else {
            return;
          }
        }
        const nowT = performance.now();
        const dtV = (nowT - lzLastDragTime) / 1000;
        if (dtV > 0.005) {
          const pxPerStep = window.innerWidth <= 640 ? 220 : 310;
          lzVelocity = -((e.clientX - lzLastDragX) / pxPerStep) / dtV;
          lzLastDragX = e.clientX;
          lzLastDragTime = nowT;
        }
        const pxPerStep = window.innerWidth <= 640 ? 220 : 310;
        lzCurrent = lzDragStartVal - (dx / pxPerStep);
      });
      const stopDrag = e => {
        if (!lzDragging) return;
        lzDragging = false;
        lzStage.classList.remove('is-dragging');
        if (lzCaptured) {
          lzCaptured = false;
          try { lzStage.releasePointerCapture(e.pointerId); } catch (err) {}
        }
        if (lzMovedPx > 6) {
          lzVelocity = Math.max(-6, Math.min(6, lzVelocity));
          lzLastStepTime = performance.now();
        } else {
          lzVelocity = 0;
          lzLastStepTime = performance.now();
        }
        startLzLoop();
      };
      lzStage.addEventListener('pointerup', stopDrag);
      lzStage.addEventListener('pointercancel', stopDrag);
      if ('IntersectionObserver' in window) {
        const lzIO = new IntersectionObserver(entries => {
          lzInView = entries[0].isIntersecting;
          if (lzInView) {
            lzLastStepTime = performance.now();
            startLzLoop();
          } else if (lzRafId) {
            cancelAnimationFrame(lzRafId);
            lzRafId = 0;
          }
        }, { threshold: 0.05 });
        lzIO.observe(lzStage);
      }
    }
    if (lzPrevBtn) {
      lzPrevBtn.addEventListener('click', () => {
        const baseStep = lzIsTweening ? lzTarget : Math.round(lzCurrent);
        goToStep(baseStep - 1, 900, easeWhip);
      });
    }
    if (lzNextBtn) {
      lzNextBtn.addEventListener('click', () => {
        const baseStep = lzIsTweening ? lzTarget : Math.round(lzCurrent);
        goToStep(baseStep + 1, 900, easeWhip);
      });
    }
    if (lzAutoBtn) {
      lzAutoBtn.addEventListener('click', () => {
        lzAutoPlay = !lzAutoPlay;
        lzAutoBtn.textContent = lzAutoPlay ? 'Pause' : 'Play';
        lzAutoBtn.setAttribute('aria-pressed', String(lzAutoPlay));
        lzLastStepTime = performance.now();
      });
    }
    if (lzGridToggle && dirGridPanel) {
      lzGridToggle.addEventListener('click', () => {
        const willOpen = dirGridPanel.hidden;
        dirGridPanel.hidden = !willOpen;
        lzGridToggle.classList.toggle('is-active', willOpen);
        lzGridToggle.setAttribute('aria-expanded', String(willOpen));
        lzGridToggle.textContent = willOpen ? 'Hide ↑' : 'See all ↓';
      });
    }
    function renderDirectory() {
      if (shortlistOnly && shortlistedCreators.size === 0) {
        shortlistOnly = false;
        if (fxShortlistBtn) fxShortlistBtn.classList.remove('is-active');
      }
      const q = (fxInputRef ? fxInputRef.value : '').trim().toLowerCase();
      filteredItems = CREATORS.filter(item => {
        const catOk = dirCat === 'all' || item.cat === dirCat;
        const shortlistOk = !shortlistOnly || shortlistedCreators.has(item.creator);
        const textOk = !q ||
          item.creator.toLowerCase().includes(q) ||
          item.craft.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          item.tags.some(t => t.toLowerCase().includes(q));
        return catOk && shortlistOk && textOk;
      });
      if (dirCountBadge) {
        dirCountBadge.textContent = filteredItems.length === 0
          ? 'No matching creators'
          : filteredItems.length + ' sample profiles · real ones at launch';
      }
      if (lzGridToggle && dirGridPanel) {
        const isOpen = !dirGridPanel.hidden;
        lzGridToggle.textContent = isOpen
          ? 'Hide ↑'
          : 'See all ↓';
      }
      buildLazarevCarousel();
      if (!dirGrid) return;
      const visibleCount = showAll ? filteredItems.length : Math.min(9, filteredItems.length);
      const list = filteredItems.slice(0, visibleCount);
      if (dirMoreWrap && dirMoreBtn) {
        if (filteredItems.length > 9) {
          dirMoreWrap.hidden = false;
          dirMoreBtn.textContent = showAll ? 'Show Featured 9 ↑' : 'Explore Full Roster (' + filteredItems.length + ') ↓';
        } else {
          dirMoreWrap.hidden = true;
        }
      }
      dirGrid.innerHTML = '';
      list.forEach(item => {
        const globalIdx = CREATORS.indexOf(item);
        const card = createStudioCardEl(item, globalIdx, { carousel: false });
        const hasReel = Boolean(item.reel);
        if (hasReel) {
          const vid = card.querySelector('video');
          card.addEventListener('mouseenter', () => {
            if (vid) {
              card.classList.add('is-playing');
              vid.play().catch(() => {});
            }
          });
          card.addEventListener('mouseleave', () => {
            if (vid) {
              card.classList.remove('is-playing');
              vid.pause();
            }
          });
        }
        card.addEventListener('click', () => {
          (window.__openCreatorSpotlight || openCreatorSpotlight)(item, globalIdx, card);
        });
        dirGrid.appendChild(card);
      });
    }
    window.__renderDirectory = renderDirectory;
    window.__onShortlistToggled = () => { if (shortlistOnly) renderDirectory(); };
    dirTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        dirTabs.forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        dirCat = tab.getAttribute('data-dir-cat') || 'all';
        showAll = false;
        renderDirectory();
      });
    });
    if (dirMoreBtn) {
      dirMoreBtn.addEventListener('click', () => {
        showAll = !showAll;
        renderDirectory();
      });
    }
    if (fxInputRef) {
      fxInputRef.addEventListener('input', () => renderDirectory());
    }
    if (fxSearchForm) {
      fxSearchForm.addEventListener('submit', e => {
        e.preventDefault();
        renderDirectory();
        if (filteredItems.length > 0 && ((fxInputRef && fxInputRef.value.trim().length > 0) || dirCat !== 'all')) {
          const first = filteredItems[0];
          (window.__openCreatorSpotlight || openCreatorSpotlight)(first, CREATORS.indexOf(first));
        }
      });
    }
    if (fxShortlistBtn) {
      fxShortlistBtn.addEventListener('click', () => {
        shortlistOnly = !shortlistOnly;
        fxShortlistBtn.classList.toggle('is-active', shortlistOnly);
        fxShortlistBtn.setAttribute('aria-pressed', String(shortlistOnly));
        renderDirectory();
      });
    }
    window.addEventListener('resize', () => { layoutLazarevCards(); }, { passive: true });
    renderDirectory();
  }
})();
