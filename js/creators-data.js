/* ── Nexus sample creators: ONE shared list ─────────────────────────────────
   Used by the Explore page, the creator profile page (/c/<slug>) and anywhere
   else that needs creator data. Edit creators here only.
   Every path is relative to the site root ("assets/..."). */
(function () {
  const P = 'assets/cinema_posters/';
  const RAW = [
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

  const SHARP = {
    film: ['assets/editorial_cinema_still.webp', P + 'roster_david_focus_rig.webp', P + 'poster_0_director.webp', 'assets/cinema_still_crop.webp'],
    art: [P + 'roster_valerie_couture.webp', P + 'poster_2_design.webp', P + 'roster_clara_venice.webp', P + 'roster_sofia_gaffer.webp'],
    d3: [P + 'poster_4_cgi.webp', P + 'poster_2_design.webp'],
    aerial: [P + 'poster_1_drone.webp', P + 'roster_maya_aerial.webp'],
    action: [P + 'roster_nova_pursuit.webp', P + 'roster_axel_cablecam.webp']
  };
  const sharpTurn = {};
  const CARD_COPIES = new Set(['assets/cinema_still_crop.webp', 'assets/editorial_cinema_still.webp', P + 'poster_0_director.webp', P + 'poster_1_drone.webp', P + 'poster_2_design.webp', P + 'poster_4_cgi.webp', P + 'roster_axel_cablecam.webp', P + 'roster_clara_venice.webp', P + 'roster_david_focus_rig.webp', P + 'roster_maya_aerial.webp', P + 'roster_nova_pursuit.webp', P + 'roster_sofia_gaffer.webp', P + 'roster_valerie_couture.webp', P + 'pictura_cyan_director.webp']);
  const turn = {};
  // A few sample stills are tiny (400×480) and look blurry: swap them for a sharp photo of the same craft.
  function sharpSrc(c) {
    if (/pictura_(?!cyan_director)/.test(c.src) && SHARP[c.cat]) {
      const pool = SHARP[c.cat];
      const i = (turn[c.cat] = (turn[c.cat] || 0) + 1);
      return pool[(i - 1) % pool.length];
    }
    return c.src;
  }
  const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const CRAFT_GEAR = {
    film: [
      ['ARRI Alexa 35', 'Cooke 2x Anamorphic', 'Steadicam M2 Rig', 'Preston FIZ III'],
      ['Sony VENICE 2 8K', 'Master Primes 18-65mm', 'SmallHD Cine 7', 'Teradek Bolt 4K'],
      ['RED V-Raptor XL', 'Atlas Orion 2x Anamorphic', 'Tilta Float', 'OConnor 2575D'],
      ['ARRI Alexa Mini LF', 'Angenieux Optimo Ultra', 'Ronin 2 3-Axis', 'ARRI Hi-5']
    ],
    aerial: [
      ['DJI Inspire 3 (8K X9-Air)', 'DL 18/24/35/50mm F2.8', 'DJI Master Wheels', 'Custom 8S Heavy Lift FPV'],
      ['Custom Siccario FPV Rig', 'RED Komodo 6K Mount', 'Crossfire Low-Latency Link', 'DJI Goggles 3 High-Gain'],
      ['Freefly Alta X Heavy Lift', 'MōVI Pro Gimbal', 'Sony FX6 Cinema Air', 'Connex HD Wireless']
    ],
    d3: [
      ['Unreal Engine 5.4 VP Stage', 'AOTO 1.5mm Fine-Pitch LED', 'Mo-Sys StarTracker', 'Disguise vx 4+ Media Server'],
      ['Houdini 20 Solaris/Karma', 'NVIDIA RTX 6000 Ada (Dual)', 'DaVinci Resolve Studio 19', 'ACES 1.3 Color Pipeline'],
      ['Unreal Engine 5.4 nDisplay', 'OptiTrack PrimeX 41', 'Brompton SX40 Processors', 'Sony Crystal LED Stage']
    ],
    art: [
      ['Hasselblad H6D-100c', 'HC 2,2/100mm & Macro 120mm', 'Profoto Pro-11 2400 AirX', 'Broncolor Para 222 FB'],
      ['Phase One IQ4 150MP Achromatic', 'Rodenstock HR Digaron 40mm', 'Briese Focus 180 Studio', 'Capture One Pro 24'],
      ['Leica S3 Medium Format', 'Summarit-S 70mm f/2.5 ASPH', 'K5600 Joker-Bug 1600W', 'Matthews C-Stand Grid']
    ],
    action: [
      ['Defy Dactylcam Pro Winch', 'RED Komodo-X High-Speed', 'Flowcine Black Arm Complete', 'Ronin 4D 8K Flex Rig'],
      ['MotoCrane Ultra Pursuit Arm', 'ARRI Alexa Mini LF Cage', 'Preston Single Channel', 'Shotover F1 6-Axis Stabilizer'],
      ['Cable Cam 1000m Dual-Motor', 'Sony FX9 High-Speed', 'DJI Ronin 2 Remote', 'Vaxis Storm 3000']
    ]
  };

  const CRAFT_GALLERY_POOLS = {
    film: [
      { src: 'assets/editorial_cinema_still.webp', caption: 'Midnight pursuit anamorphic sequence', credit: 'Porsche Motorsport North America', tag: 'Anamorphic 2.39:1' },
      { src: P + 'roster_david_focus_rig.webp', caption: 'Tactical camera build & 1st AC pull setup', credit: 'A24 Narrative Feature', tag: 'Behind the Lens' },
      { src: P + 'poster_0_director.webp', caption: 'High-contrast tungsten key lighting in studio', credit: 'Sony Music Commercial', tag: 'Commercial Frame' },
      { src: 'assets/cinema_still_crop.webp', caption: 'Wide angle architectural interior still', credit: 'B&O Global Campaign', tag: 'Architectural' }
    ],
    aerial: [
      { src: P + 'poster_1_drone.webp', caption: 'Coastal horizon sweep at golden hour', credit: 'National Geographic Expeditions', tag: 'Inspire 3 8K' },
      { src: P + 'roster_maya_aerial.webp', caption: 'Heavy-lift dual operator alpine pursuit', credit: 'Red Bull Media House', tag: 'FPV Cinema' },
      { src: 'assets/editorial_cinema_still.webp', caption: 'Dynamic highway tracking shot at twilight', credit: 'Audi Quattro Film', tag: 'High-Speed Tracking' },
      { src: P + 'poster_0_director.webp', caption: 'Low-altitude proximity flythrough', credit: 'Discovery Channel', tag: 'Proximity Flight' }
    ],
    d3: [
      { src: P + 'poster_4_cgi.webp', caption: 'Real-time metallic fluid & volumetric simulation', credit: 'Apple Keynote Lookdev', tag: 'Unreal Engine 5.4' },
      { src: P + 'poster_2_design.webp', caption: 'Futuristic spatial lighting & geometric abstraction', credit: 'Nike Innovation Lab', tag: 'Houdini Karma' },
      { src: P + 'pictura_cyan_director.webp', caption: 'Virtual production LED volume parallax alignment', credit: 'Paramount+ Sci-Fi Series', tag: 'In-Camera VFX' },
      { src: 'assets/editorial_cinema_still.webp', caption: 'Photoreal digital environment asset integration', credit: 'Epic Games Showcase', tag: 'Real-time VP' }
    ],
    art: [
      { src: P + 'roster_valerie_couture.webp', caption: 'Haute couture macro jewelry lighting study', credit: 'Cartier International', tag: '100MP Medium Format' },
      { src: P + 'poster_2_design.webp', caption: 'Sculptural lighting architecture & gradient play', credit: 'Vogue Italia Editorial', tag: 'Studio Editorial' },
      { src: P + 'roster_clara_venice.webp', caption: 'Location portraiture with custom diffusion', credit: 'Hermès Paris Campaign', tag: 'Commercial Fashion' },
      { src: P + 'roster_sofia_gaffer.webp', caption: 'Negative fill & soft rim lighting breakdown', credit: 'Vanity Fair Cover', tag: 'Lighting Direction' }
    ],
    action: [
      { src: P + 'roster_nova_pursuit.webp', caption: 'Off-road tracking vehicle pursuit camera setup', credit: 'Ford Performance Films', tag: 'Chase Vehicle Rig' },
      { src: P + 'roster_axel_cablecam.webp', caption: 'Alpine freeride 70km/h high-speed cable flight', credit: 'Freeride World Tour', tag: '1000m Winch' },
      { src: P + 'poster_3_action.webp', caption: 'Low-slung pursuit arm frame on race track', credit: 'Formula 1 Paddock Club', tag: 'Pursuit Arm' },
      { src: 'assets/cinema_still_crop.webp', caption: 'Extreme weather water & shock housing build', credit: 'Patagonia Outdoor Docs', tag: 'Rugged Cinema Rig' }
    ]
  };

  const TRUST_STATS = [
    { rating: 5.0, reviewsCount: 28, billed: '$240k+ billed', sla: 'Replies under 1h', direct: true },
    { rating: 4.9, reviewsCount: 34, billed: '$195k+ billed', sla: 'Replies under 1h', direct: true },
    { rating: 5.0, reviewsCount: 22, billed: '$310k+ billed', sla: 'Replies under 2h', direct: true },
    { rating: 4.9, reviewsCount: 19, billed: '$145k+ billed', sla: 'Replies under 1h', direct: true },
    { rating: 4.8, reviewsCount: 16, billed: '$92k+ billed',  sla: 'Replies under 3h', direct: true }
  ];

  function getGearForCreator(c, index) {
    const list = CRAFT_GEAR[c.cat] || CRAFT_GEAR.film;
    return list[index % list.length];
  }

  function getGalleryForCreator(c, heroSrc) {
    const pool = CRAFT_GALLERY_POOLS[c.cat] || CRAFT_GALLERY_POOLS.film;
    const items = [
      {
        src: heroSrc,
        caption: `${c.creator} — ${c.craft} signature visual campaign frame.`,
        credit: `${c.city} Production`,
        tag: 'Lead Showcase'
      }
    ];
    for (const item of pool) {
      if (items.length >= 4) break;
      if (item.src !== heroSrc && !items.some(x => x.src === item.src)) {
        items.push(item);
      }
    }
    // Fallback if duplicates exist
    while (items.length < 4) {
      items.push(pool[items.length % pool.length]);
    }
    return items;
  }

  window.NEXUS_CREATORS = RAW.map((c, i) => {
    const heroImage = sharpSrc(c);
    const trustStat = TRUST_STATS[i % TRUST_STATS.length];
    return Object.assign({}, c, {
      src: heroImage,
      slug: slug(c.creator),
      order: i,
      numericRate: parseInt(String(c.rate).replace(/[^0-9]/g, ''), 10) || 500,
      gear: getGearForCreator(c, i),
      trust: trustStat,
      gallery: getGalleryForCreator(c, heroImage)
    });
  });
  window.NEXUS_CREATOR_URL = (nameOrSlug) => '/c/' + (nameOrSlug.includes(' ') || /[A-Z]/.test(nameOrSlug) ? slug(nameOrSlug) : nameOrSlug);
})();
