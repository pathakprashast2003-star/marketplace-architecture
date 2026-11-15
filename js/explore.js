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
  const RAW_CREATORS = [
    {
      creator: 'Marcus Vance',
      craft: 'Commercial DP',
      city: 'Austin, TX',
      rate: '$650/day',
      cat: 'film',
      src: P + 'pictura_cyan_director.webp',
      reel: 'assets/reels/reel_0_director.mp4',
      bio: 'ARRI Alexa 35 owner-operator with 12 years commercial DP experience across automotive and narrative.',
      tags: ['ARRI Alexa 35', 'Cooke 2x', 'Commercial']
    },
    {
      creator: 'Elena Rostova',
      craft: 'Lookdev & Direction',
      city: 'Milan, IT',
      rate: '$520/day',
      cat: 'art',
      src: P + 'pictura_emerald_bust.webp',
      bio: 'High-fashion lookdev, lighting architecture, and creative direction for editorial campaigns.',
      tags: ['Lookdev', 'High Fashion', 'Art Direction']
    },
    {
      creator: 'David Kim',
      craft: 'Anamorphic Cinema',
      city: 'Seoul, KR',
      rate: '$600/day',
      cat: 'film',
      src: P + 'pictura_amber_silhouette.webp',
      bio: 'Anamorphic lens specialist and narrative DP focusing on high-contrast architectural cinema.',
      tags: ['Cooke 2x', 'Anamorphic', 'Narrative']
    },
    {
      creator: 'Kai Tanaka',
      craft: 'Virtual Production Artist',
      city: 'Tokyo, JP',
      rate: '$720/day',
      cat: 'd3',
      src: P + 'poster_4_cgi.webp',
      bio: 'LED volume supervisor and real-time environment artist specializing in Unreal 5.4 VP stages.',
      tags: ['Unreal 5.4', 'Chrome Spatial', 'Virtual Prod']
    },
    {
      creator: 'Maya Lin',
      craft: 'FPV & Drone Cinema',
      city: 'Denver, CO',
      rate: '$580/day',
      cat: 'aerial',
      src: P + 'poster_1_drone.webp',
      reel: 'assets/reels/reel_1_drone.mp4',
      bio: 'Dual-op Inspire 3 and heavy-lift custom FPV cinema pilot for feature films and commercials.',
      tags: ['DJI Inspire 3', 'Azure Coast', 'FPV Cinema']
    },
    {
      creator: 'Clara Moreau',
      craft: 'Commercial DP',
      city: 'London, UK',
      rate: '$780/day',
      cat: 'film',
      src: P + 'roster_clara_venice.webp',
      bio: '8K full-frame cinema specialist for global commercial brands and streaming originals.',
      tags: ['Sony VENICE 2', 'Master Primes', 'Fashion']
    },
    {
      creator: 'Sora Takahashi',
      craft: 'FPV Pilot',
      city: 'Osaka, JP',
      rate: '$540/day',
      cat: 'aerial',
      src: P + 'pictura_cyan_sunglasses.webp',
      reel: 'assets/reels/reel_1_drone.mp4',
      bio: 'Cinematic FPV pilot specializing in extreme mountain terrain and urban pursuit sequences.',
      tags: ['RED Komodo FPV', 'Alpine Dusk', 'Action']
    },
    {
      creator: 'Nova Mercer',
      craft: 'Pursuit Arm & Rig',
      city: 'Los Angeles, CA',
      rate: '$850/day',
      cat: 'action',
      src: P + 'pictura_fashion_model.webp',
      bio: 'Precision tracking vehicle operator and Black Arm technician for high-speed action cinema.',
      tags: ['Pursuit Arm', 'Black Arm', 'High Speed']
    },
    {
      creator: 'Lucas Meyer',
      craft: '1st AC & Optical Rig',
      city: 'Berlin, DE',
      rate: '$480/day',
      cat: 'film',
      src: P + 'pictura_blue_profile.webp',
      bio: 'Preston FIZ master and optical alignment technician with 80+ feature credits.',
      tags: ['Preston FIZ', 'ARRI Hi-5', '1st AC']
    },
    {
      creator: 'Aisha Al-Mansoor',
      craft: 'Architectural Visualization',
      city: 'Dubai, AE',
      rate: '$620/day',
      cat: 'art',
      src: 'assets/cinema_still_crop.webp',
      bio: 'Ultra-luxury architectural visualization, dawn-to-dusk lighting, and cinematic spatial flythroughs.',
      tags: ['Golden Glow', 'Editorial', 'Art Direction']
    },
    {
      creator: 'Amara Nwosu',
      craft: 'Wildlife Cinematographer',
      city: 'Cape Town, ZA',
      rate: '$700/day',
      cat: 'film',
      src: 'assets/editorial_cinema_still.webp',
      bio: 'High-speed 8K 120fps wildlife and commercial cinematographer with global broadcast credits.',
      tags: ['RED V-Raptor XL', '8K 120fps', 'Commercial']
    },
    {
      creator: 'Leo Hartley',
      craft: 'Heavy-Lift Cinema Drone',
      city: 'Calgary, AB',
      rate: '$590/day',
      cat: 'aerial',
      src: P + 'roster_maya_aerial.webp',
      reel: 'assets/reels/reel_1_drone.mp4',
      bio: 'Sub-zero high-altitude drone operations with thermal monitoring and dual transmission.',
      tags: ['Freefly Alta X', 'Dual Op', 'Mountain Drone']
    },
    {
      creator: 'Kenji Sato',
      craft: 'Gimbal Pursuit Tracking',
      city: 'Seattle, WA',
      rate: '$620/day',
      cat: 'action',
      src: P + 'roster_nova_pursuit.webp',
      bio: 'Ronin 2 / MōVI Pro chase specialist with custom motorcycle tracking rigs.',
      tags: ['Ronin 2', 'Moto Rig', 'Chase Cam']
    },
    {
      creator: 'Jaxson Reed',
      craft: 'Cinema Drone Systems',
      city: 'Vancouver, BC',
      rate: '$680/day',
      cat: 'aerial',
      src: P + 'poster_0_director.webp',
      reel: 'assets/reels/reel_1_drone.mp4',
      bio: 'FAA Part 107 and Transport Canada certified heavy-lift pilot flying Alexa Mini LF rigs.',
      tags: ['Alexa Mini LF', 'Heavy-Lift', 'Aerial']
    },
    {
      creator: 'Felix Adler',
      craft: 'Tabletop & Macro Optics',
      city: 'Zurich, CH',
      rate: '$600/day',
      cat: 'd3',
      src: P + 'poster_4_cgi.webp',
      bio: 'Sub-millimeter motion control shots for luxury optics, watches, and hardware.',
      tags: ['Motion Control', 'Tabletop', 'Macro']
    },
    {
      creator: 'Julian Okafor',
      craft: 'Narrative DP',
      city: 'New York, NY',
      rate: '$890/day',
      cat: 'film',
      src: 'assets/editorial_cinema_still.webp',
      bio: 'Award-winning cinematographer with Panavision Primo glass and Kodak 35mm film workflows.',
      tags: ['Panavision Primo', '35mm Film', 'Narrative']
    },
    {
      creator: 'Priya Patel',
      craft: 'Sub-D 3D Lookdev',
      city: 'Mumbai, IN',
      rate: '$450/day',
      cat: 'd3',
      src: P + 'poster_4_cgi.webp',
      bio: 'Precision hard-surface modeling, Marvelous Designer cloth simulations, and Octane rendering.',
      tags: ['Sub-D', 'Marvelous Designer', 'Octane']
    },
    {
      creator: 'Soren Lind',
      craft: 'Houdini Fluid & FX',
      city: 'Copenhagen, DK',
      rate: '$640/day',
      cat: 'd3',
      src: P + 'poster_2_design.webp',
      bio: 'Photorealistic fluid simulations, pyro dynamics, and procedural environments.',
      tags: ['Houdini FX', 'Fluid Dynamics', 'Procedural']
    },
    {
      creator: 'Tomas Varga',
      craft: 'Underwater & Marine DP',
      city: 'Sydney, AU',
      rate: '$750/day',
      cat: 'film',
      src: P + 'poster_0_director.webp',
      bio: 'Nauticam housing specialist shooting Alexa 35 offshore, reef, and big-wave surf projects.',
      tags: ['Nauticam', 'Marine Cinema', 'Water DP']
    },
    {
      creator: 'Chloe Dupuis',
      craft: 'Commercial Colorist',
      city: 'Paris, FR',
      rate: '$560/day',
      cat: 'art',
      src: P + 'poster_2_design.webp',
      bio: 'DaVinci Resolve Advanced Panel colorist handling high-end beauty, luxury, and car commercials.',
      tags: ['DaVinci Resolve', 'ACES Workflow', 'Colorist']
    },
    {
      creator: 'Liam Brooks',
      craft: 'Steadicam Gold Operator',
      city: 'Toronto, ON',
      rate: '$700/day',
      cat: 'action',
      src: P + 'roster_nova_pursuit.webp',
      bio: 'Steadicam M2 with Volt horizon stabilization for uninterrupted long-take sequences.',
      tags: ['Steadicam M2', 'Volt Horizon', 'Long Take']
    },
    {
      creator: 'Oliver Scott',
      craft: 'Macro Natural History',
      city: 'Bristol, UK',
      rate: '$580/day',
      cat: 'film',
      src: 'assets/editorial_cinema_still.webp',
      bio: 'Laowa 24mm probe lens specialist with motorized slider and high-speed Phantom Flex rigs.',
      tags: ['Laowa Probe', 'Phantom Flex', 'High Speed']
    },
    {
      creator: 'Mei-Ling Zhou',
      craft: 'Micro-FPV Indoor Racing',
      city: 'Hong Kong, HK',
      rate: '$510/day',
      cat: 'aerial',
      src: P + 'roster_maya_aerial.webp',
      reel: 'assets/reels/reel_1_drone.mp4',
      bio: 'Sub-250g naked GoPro cinewhoop pilot flying tight interior architectural walkthroughs.',
      tags: ['Cinewhoop', 'Naked GoPro', 'Indoor FPV']
    },
    {
      creator: 'Santiago Morales',
      craft: 'Virtual Production Lead',
      city: 'Madrid, ES',
      rate: '$690/day',
      cat: 'd3',
      src: P + 'poster_4_cgi.webp',
      bio: 'In-camera VFX technical director, tracking sync, and real-time color grading.',
      tags: ['ICVFX', 'Stype Tracking', 'Virtual Studio']
    },
    {
      creator: 'Zara Eklund',
      craft: 'Editorial Film Photographer',
      city: 'Stockholm, SE',
      rate: '$490/day',
      cat: 'art',
      src: P + 'poster_2_design.webp',
      bio: 'Medium format Hasselblad H6D and 35mm Leica M6 editorial portraiture for global magazines.',
      tags: ['Hasselblad', 'Leica M6', 'Medium Format']
    },
    {
      creator: 'Dante Rossi',
      craft: 'Remote Head Crane Tech',
      city: 'Rome, IT',
      rate: '$650/day',
      cat: 'action',
      src: P + 'roster_nova_pursuit.webp',
      bio: 'Technocrane 30 and Scorpio head operator for fluid multi-axis stadium and concert sweeps.',
      tags: ['Technocrane', 'Scorpio Head', 'Jib & Crane']
    },
    {
      creator: 'Hana Becker',
      craft: 'Optical Lens Tech & DIT',
      city: 'Frankfurt, DE',
      rate: '$520/day',
      cat: 'film',
      src: P + 'roster_david_focus_rig.webp',
      bio: 'On-set DIT and live color grading technician with dual Pomfort Livegrade carts.',
      tags: ['Livegrade', 'DIT Cart', 'Color Science']
    },
    {
      creator: 'Tariq Hassan',
      craft: 'Heavy-Gimbal Tracking Car',
      city: 'Abu Dhabi, AE',
      rate: '$810/day',
      cat: 'action',
      src: 'assets/cinema_still_crop.webp',
      bio: 'Modified electric tracking buggy pilot with gyro-stabilized carbon fiber cranes.',
      tags: ['Electric Tracking', 'Gyro Stabilized', 'Desert High Speed']
    },
    {
      creator: 'Ingrid Holm',
      craft: 'Stylized 3D Character Art',
      city: 'Oslo, NO',
      rate: '$540/day',
      cat: 'd3',
      src: P + 'poster_4_cgi.webp',
      bio: 'Character lookdev, procedural hair grooming in XGen, and Arnold subsurface shaders.',
      tags: ['XGen Grooming', 'Subsurface Shading', 'Arnold 3D']
    },
    {
      creator: 'Nina Kowalski',
      craft: 'Stop-Motion Armature DP',
      city: 'Prague, CZ',
      rate: '$530/day',
      cat: 'art',
      src: 'assets/editorial_cinema_still.webp',
      bio: 'Precision frame-by-frame motion control with Dragonframe and custom miniature rigs.',
      tags: ['Dragonframe', 'Stop Motion', 'Miniature Rig']
    },
    {
      creator: 'Emil Lindqvist',
      craft: 'Motion Design & Typography',
      city: 'Helsinki, FI',
      rate: '$570/day',
      cat: 'd3',
      src: P + 'poster_4_cgi.webp',
      bio: 'Kinetic 3D typography, title sequence direction, and brand motion systems.',
      tags: ['Cinema 4D', 'Redshift', 'Kinetic Type']
    },
    {
      creator: 'Sofia Reyes',
      craft: 'Gaffer & Master Rigger',
      city: 'Mexico City, MX',
      rate: '$480/day',
      cat: 'film',
      src: P + 'roster_sofia_gaffer.webp',
      bio: 'Complex truss rigging, helium balloon lights, and generator truck distribution.',
      tags: ['Truss Rigging', 'Helium Balloon', 'Master Electrician']
    },
    {
      creator: 'Axel Berg',
      craft: 'Extreme Sports Cable Cam',
      city: 'Innsbruck, AT',
      rate: '$660/day',
      cat: 'action',
      src: P + 'roster_axel_cablecam.webp',
      bio: 'Automated 1000m high-speed winch cable-cam systems for alpine and freeride sports.',
      tags: ['Cable Cam', 'High-Speed Winch', 'Alpine Cinema']
    },
    {
      creator: 'Valerie Laurent',
      craft: 'Luxury Editorial Director',
      city: 'Geneva, CH',
      rate: '$670/day',
      cat: 'art',
      src: P + 'roster_valerie_couture.webp',
      bio: 'Luxury jewelry and haute-couture cinema still direction for international luxury houses.',
      tags: ['Haute Couture', 'Jewelry Macro', 'Luxury Film']
    }
  ];

  /* ── SVGS & STUDIO METADATA (MATCHING EARLIER NEXUS STANDARD) ── */
  const WS_SVGS = {
    check: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    star: '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2l2.92 6.26 6.88.85-5.08 4.74 1.32 6.8L12 17.52l-6.04 3.33 1.32-6.8L2.2 9.31l6.88-.85L12 2.2z"/></svg>',
    arrow: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    save: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
  };

  const WS_CREATOR_META = {
    'Marcus Vance': ['5.0', '$240k+ billed', 'Replies under 1h'],
    'Maya Lin': ['4.9', '$185k+ billed', 'Replies under 2h'],
    'Elena Rostova': ['4.8', '$92k+ billed', 'Replies under 3h'],
    'David Kim': ['5.0', 'ARRI certified', 'Replies under 1h'],
    'Kai Tanaka': ['5.0', '$195k+ billed', 'Replies under 1h'],
    'Nova Mercer': ['4.9', '19 shoots', 'Available today'],
    'Clara Moreau': ['5.0', '28 shoots', 'Replies under 1h'],
    'Sora Takahashi': ['4.9', '$160k+ billed', 'Replies under 2h'],
    'Valerie Laurent': ['5.0', '$175k+ billed', 'Replies under 1h'],
    'Amara Nwosu': ['5.0', '42 shoots', 'Replies under 1h'],
    'Julian Okafor': ['5.0', 'Panavision Primo', 'Replies under 2h'],
    'Tomas Varga': ['4.9', '31 shoots', 'Replies under 2h'],
    'Chloe Dupuis': ['5.0', 'ACES certified', 'Replies under 1h'],
    'Santiago Morales': ['4.9', '$210k+ billed', 'Replies under 2h'],
    'Zara Eklund': ['4.8', 'Hasselblad master', 'Replies under 2h']
  };

  function getStudioMeta(item, idx) {
    if (WS_CREATOR_META[item.creator]) return WS_CREATOR_META[item.creator];
    const h = idx >= 0 ? idx : item.creator.length;
    const scores = ['5.0', '4.9', '4.8'];
    const tracks = ['34 shoots', '$160k+ billed', '28 shoots', '$125k+ billed', '42 shoots', 'Top rated'];
    const slas = ['Replies under 1h', 'Replies under 2h', 'Available today'];
    return [scores[h % scores.length], tracks[h % tracks.length], slas[h % slas.length]];
  }

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
    let src = c.hqSrc || c.src;
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
      const meta = getStudioMeta(item, idx);
      const cardImg = item.src;

      return `
        <article class="dir-card nx-talent-card" data-creator-id="${esc(item.id)}" role="button" tabindex="0" aria-label="${esc(item.creator)} — ${esc(item.craft)} (${esc(item.rate)})">
          <div class="ws-stage">
            <img src="${esc(cardImg)}" alt="${esc(item.creator)} work still" loading="lazy" decoding="async">
            ${hasReel ? `<video muted playsinline loop preload="none" src="${esc(item.reel)}"></video>` : ''}
            <span class="ws-hud ${hasReel ? '' : 'is-still'}" aria-hidden="true">
              <span class="ws-hud-dot"></span>
              <span>${hasReel ? 'Live Reel' : 'Folio · 1 Still'}</span>
            </span>
            <span class="ws-price">${rateHtml}</span>
          </div>
          <div class="ws-body">
            <div class="ws-kicker-row">
              <span class="ws-kicker">${esc(item.craft)} · ${esc(item.city)}</span>
              <span class="ws-verified" aria-label="Verified">${WS_SVGS.check}</span>
            </div>
            <h3 class="ws-name nx-creator-name">${esc(item.creator)}</h3>
            <p class="ws-blurb">${esc(item.bio)}</p>
            <div class="ws-foot">
              <div class="ws-meta">
                <div class="ws-meta-line">
                  <span class="ws-star" aria-hidden="true">${WS_SVGS.star}</span>
                  <strong class="ws-score">${esc(meta[0])}</strong>
                  <span class="ws-sep">·</span>
                  <span class="ws-track">${esc(meta[1])}</span>
                </div>
                <div class="ws-sla"><span class="ws-dot" aria-hidden="true"></span><span>${esc(meta[2])}</span></div>
              </div>
              <div class="ws-actions">
                <button type="button" class="ws-book nx-btn-brief" data-creator-name="${esc(item.creator)}" aria-label="Book ${esc(firstName)}">
                  <span>Book ${esc(firstName)}</span>
                  ${WS_SVGS.arrow}
                </button>
                <button type="button" class="ws-save nx-btn-save ${isSaved ? 'is-saved' : ''}" data-creator-id="${esc(item.id)}" aria-pressed="${isSaved ? 'true' : 'false'}" aria-label="${isSaved ? 'Remove from shortlist' : 'Save ' + esc(item.creator) + ' to shortlist'}">
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
    const cards = gridEl.querySelectorAll('.dir-card, .nx-talent-card');
    cards.forEach((card) => {
      const video = card.querySelector('video');
      if (!video) return;

      card.addEventListener('mouseenter', () => {
        card.classList.add('is-playing');
        try {
          video.play().catch(() => {});
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
      showToast('Removed from shortlist');
    } else {
      state.shortlist.add(id);
      const creator = CREATORS.find((c) => c.id === id);
      showToast(`Saved ${creator ? creator.creator : 'creator'} to shortlist`);
    }

    saveShortlist();
    updateShortlistBadges();

    // Update save button states in grid without full re-render
    const saveBtns = gridEl.querySelectorAll(`.ws-save[data-creator-id="${id}"], .nx-btn-save[data-creator-id="${id}"]`);
    saveBtns.forEach((btn) => {
      const isSaved = state.shortlist.has(id);
      btn.classList.toggle('is-saved', isSaved);
      btn.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
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
    if (targetName) {
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
      const saveBtn = e.target.closest('.ws-save, .nx-btn-save');
      if (saveBtn) {
        e.preventDefault();
        e.stopPropagation();
        const id = saveBtn.dataset.creatorId;
        toggleSaveCreator(id);
        return;
      }

      const bookBtn = e.target.closest('.ws-book, .nx-btn-brief');
      if (bookBtn) {
        e.preventDefault();
        e.stopPropagation();
        const name = bookBtn.dataset.creatorName;
        openInquiryModal(name);
        return;
      }

      // tapping the card opens the brief modal
      const card = e.target.closest('.dir-card');
      if (card) {
        const id = card.dataset.creatorId;
        const item = CREATORS.find(c => c.id === id);
        if (item) openInquiryModal(item.creator);
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
  });
})();
