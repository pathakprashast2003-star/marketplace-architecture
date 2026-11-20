/**
 * Nexus Apple-Grade Editorial Home Hero Engine
 * Handles interactive talent switching, video playback, search omnibox, and shortlist sync.
 */

(function () {
  'use strict';

  // 1. TALENT ROSTER DATA
  const TALENT_PRESETS = {
    marcus: {
      name: 'Marcus Vance',
      role: 'Commercial DP · Austin, TX',
      gear: 'ARRI Alexa 35 · Atlas Anamorphic',
      rate: '$650',
      rateSub: '0% commission direct',
      avatar: 'assets/marcus_bust.webp',
      videoSrc: 'assets/reels/reel_0_director.mp4',
      posterSrc: 'assets/reels/reel_0_director.jpg',
      profileSlug: '/c/marcus-vance',
      liveStatus: 'Taking bookings • Replies < 1h'
    },
    elena: {
      name: 'Elena Rostova',
      role: 'FPV Aerial Pilot · Los Angeles, CA',
      gear: 'DJI Inspire 3 · RED Komodo-X',
      rate: '$950',
      rateSub: 'Part 107 certified',
      avatar: 'assets/elena_bust.webp',
      videoSrc: 'assets/reels/reel_1_drone.mp4',
      posterSrc: 'assets/reels/reel_1_drone.jpg',
      profileSlug: '/c/elena-rostova',
      liveStatus: 'Nationwide travel • Available'
    },
    kai: {
      name: 'Kai Tanaka',
      role: '3D Lookdev & Virtual Prod · Tokyo / Remote',
      gear: 'Unreal Engine 5.4 · Disguise gx3',
      rate: '$800',
      rateSub: 'Real-time VP Specialist',
      avatar: 'assets/kai_bust.webp',
      videoSrc: 'assets/reels/reel_0_director.mp4',
      posterSrc: 'assets/reels/reel_0_director.jpg',
      profileSlug: '/c/kai-tanaka',
      liveStatus: 'Taking studio bookings'
    }
  };

  // 2. DOM REFERENCES
  const videoEl = document.getElementById('nxCinemaVideo');
  const playBtn = document.getElementById('nxCinemaPlayBtn');
  const playIcon = document.getElementById('nxCinemaPlayIcon');
  const soundBtn = document.getElementById('nxCinemaSoundBtn');
  const soundIcon = document.getElementById('nxCinemaSoundIcon');
  const talentTabs = document.querySelectorAll('.nx-cinema-tab');
  
  const avatarEl = document.getElementById('nxCinemaAvatar');
  const nameEl = document.getElementById('nxCinemaName');
  const roleEl = document.getElementById('nxCinemaRole');
  const gearEl = document.getElementById('nxCinemaGear');
  const rateValEl = document.getElementById('nxCinemaRateVal');
  const rateSubEl = document.getElementById('nxCinemaRateSub');
  const profileLinkEl = document.getElementById('nxCinemaProfileLink');
  const liveStatusEl = document.getElementById('nxCinemaLiveStatus');

  const omniboxForm = document.getElementById('nxHeroSearchForm');
  const omniboxInput = document.getElementById('nxHeroSearchInput');
  const shortlistBadge = document.getElementById('shortlistBadgeCount');

  // 3. TALENT SWITCHING
  function switchTalent(key) {
    const data = TALENT_PRESETS[key];
    if (!data) return;

    // Update Tabs
    talentTabs.forEach(tab => {
      const isCurrent = tab.dataset.talent === key;
      tab.classList.toggle('is-active', isCurrent);
      tab.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
    });

    // Update Video (with smooth transition)
    if (videoEl) {
      const wasPlaying = !videoEl.paused;
      videoEl.poster = data.posterSrc;
      if (videoEl.src !== window.location.origin + '/' + data.videoSrc && !videoEl.src.endsWith(data.videoSrc)) {
        videoEl.src = data.videoSrc;
        videoEl.load();
        if (wasPlaying) {
          videoEl.play().catch(() => {});
        }
      }
    }

    // Update Identity Details
    if (avatarEl) avatarEl.src = data.avatar;
    if (nameEl) nameEl.textContent = data.name;
    if (roleEl) roleEl.textContent = data.role;
    if (gearEl) gearEl.textContent = data.gear;
    if (rateValEl) rateValEl.textContent = data.rate;
    if (rateSubEl) rateSubEl.textContent = data.rateSub;
    if (profileLinkEl) profileLinkEl.href = data.profileSlug;
    if (liveStatusEl) liveStatusEl.textContent = data.liveStatus;
  }

  // 4. VIDEO PLAY / PAUSE & SOUND
  if (videoEl && playBtn) {
    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (videoEl.paused) {
        videoEl.play();
        updatePlayIcon(true);
      } else {
        videoEl.pause();
        updatePlayIcon(false);
      }
    });

    videoEl.addEventListener('click', function () {
      if (videoEl.paused) {
        videoEl.play();
        updatePlayIcon(true);
      } else {
        videoEl.pause();
        updatePlayIcon(false);
      }
    });

    videoEl.addEventListener('play', () => updatePlayIcon(true));
    videoEl.addEventListener('pause', () => updatePlayIcon(false));
  }

  function updatePlayIcon(isPlaying) {
    if (!playIcon) return;
    if (isPlaying) {
      playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
      if (playBtn) playBtn.setAttribute('aria-label', 'Pause showreel');
    } else {
      playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
      if (playBtn) playBtn.setAttribute('aria-label', 'Play showreel');
    }
  }

  if (videoEl && soundBtn) {
    soundBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      videoEl.muted = !videoEl.muted;
      updateSoundIcon(videoEl.muted);
    });
  }

  function updateSoundIcon(isMuted) {
    if (!soundIcon) return;
    if (isMuted) {
      soundIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
      if (soundBtn) soundBtn.setAttribute('aria-label', 'Unmute audio');
    } else {
      soundIcon.innerHTML = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
      if (soundBtn) soundBtn.setAttribute('aria-label', 'Mute audio');
    }
  }

  // Bind Tab Click Events
  talentTabs.forEach(tab => {
    tab.addEventListener('click', function () {
      const talentKey = this.dataset.talent;
      if (talentKey) switchTalent(talentKey);
    });
  });

  // 5. OMNIBOX SEARCH SUBMIT
  if (omniboxForm && omniboxInput) {
    omniboxForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const query = omniboxInput.value.trim();
      if (query) {
        window.location.href = '/explore?q=' + encodeURIComponent(query);
      } else {
        window.location.href = '/explore';
      }
    });
  }

  // 6. SHORTLIST BADGE SYNC
  function updateShortlistBadge() {
    if (!shortlistBadge) return;
    try {
      const raw = localStorage.getItem('nexus_shortlist_v1');
      const list = raw ? JSON.parse(raw) : [];
      shortlistBadge.textContent = String(Array.isArray(list) ? list.length : 0);
    } catch (_) {
      shortlistBadge.textContent = '0';
    }
  }

  window.addEventListener('storage', updateShortlistBadge);
  updateShortlistBadge();

  // Initialize with Marcus
  switchTalent('marcus');

})();
