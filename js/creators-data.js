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
      { src: 'assets/editorial_cinema_still.webp', caption: 'Midnight pursuit anamorphic sequence', tag: 'Anamorphic 2.39:1' },
      { src: P + 'roster_david_focus_rig.webp', caption: 'Tactical camera build & 1st AC pull setup', tag: 'Behind the Lens' },
      { src: P + 'poster_0_director.webp', caption: 'High-contrast tungsten key lighting in studio', tag: 'Commercial Frame' },
      { src: 'assets/cinema_still_crop.webp', caption: 'Wide angle architectural interior still', tag: 'Architectural' }
    ],
    aerial: [
      { src: P + 'poster_1_drone.webp', caption: 'Coastal horizon sweep at golden hour', tag: 'Inspire 3 8K' },
      { src: P + 'roster_maya_aerial.webp', caption: 'Heavy-lift dual operator alpine pursuit', tag: 'FPV Cinema' },
      { src: 'assets/editorial_cinema_still.webp', caption: 'Dynamic highway tracking shot at twilight', tag: 'High-Speed Tracking' },
      { src: P + 'poster_0_director.webp', caption: 'Low-altitude proximity flythrough', tag: 'Proximity Flight' }
    ],
    d3: [
      { src: P + 'poster_4_cgi.webp', caption: 'Real-time metallic fluid & volumetric simulation', tag: 'Unreal Engine 5.4' },
      { src: P + 'poster_2_design.webp', caption: 'Futuristic spatial lighting & geometric abstraction', tag: 'Houdini Karma' },
      { src: P + 'pictura_cyan_director.webp', caption: 'Virtual production LED volume parallax alignment', tag: 'In-Camera VFX' },
      { src: 'assets/editorial_cinema_still.webp', caption: 'Photoreal digital environment asset integration', tag: 'Real-time VP' }
    ],
    art: [
      { src: P + 'roster_valerie_couture.webp', caption: 'Haute couture macro jewelry lighting study', tag: '100MP Medium Format' },
      { src: P + 'poster_2_design.webp', caption: 'Sculptural lighting architecture & gradient play', tag: 'Studio Editorial' },
      { src: P + 'roster_clara_venice.webp', caption: 'Location portraiture with custom diffusion', tag: 'Commercial Fashion' },
      { src: P + 'roster_sofia_gaffer.webp', caption: 'Negative fill & soft rim lighting breakdown', tag: 'Lighting Direction' }
    ],
    action: [
      { src: P + 'roster_nova_pursuit.webp', caption: 'Off-road tracking vehicle pursuit camera setup', tag: 'Chase Vehicle Rig' },
      { src: P + 'roster_axel_cablecam.webp', caption: 'Alpine freeride 70km/h high-speed cable flight', tag: '1000m Winch' },
      { src: P + 'poster_3_action.webp', caption: 'Low-slung pursuit arm frame on race track', tag: 'Pursuit Arm' },
      { src: 'assets/cinema_still_crop.webp', caption: 'Extreme weather water & shock housing build', tag: 'Rugged Cinema Rig' }
    ]
  };


  function getGearForCreator(c, index) {
    const list = CRAFT_GEAR[c.cat] || CRAFT_GEAR.film;
    return list[index % list.length];
  }

  function getGalleryForCreator(c, heroSrc) {
    const pool = CRAFT_GALLERY_POOLS[c.cat] || CRAFT_GALLERY_POOLS.film;
    const items = [
      {
        src: heroSrc,
        caption: `${c.craft}, ${c.city}`,
        credit: 'Production Still',
        tag: 'Lead Showcase'
      }
    ];
    for (const item of pool) {
      if (items.length >= 4) break;
      if (item.src !== heroSrc && !items.some(x => x.src === item.src)) {
        items.push(Object.assign({ credit: 'Studio Archive' }, item));
      }
    }
    // Fallback if duplicates exist
    while (items.length < 4) {
      items.push(Object.assign({ credit: 'Studio Archive' }, pool[items.length % pool.length]));
    }
    return items;
  }

  /* ── Sample profile details (honest placeholders, clearly marked as samples on the page).
     Real creators fill these in themselves; see the profile field plan. ── */
  const PROFILE = {
    film: {
      headline: (c) => `${c.craft} for brand, music and narrative films`,
      about: (c) => `I light and shoot moving pictures for brands, musicians and independent filmmakers, mostly around ${c.city.split(',')[0]}. I care about a calm set, a clear shot list and images that still hold up on a big screen. I usually work with a small crew and can bring a full camera package, or slot into yours.`,
      experience: [['Director of photography', 'Regional car commercial'], ['Camera operator', 'Independent feature film'], ['DP', 'Music video series'], ['Second unit DP', 'Documentary series']],
      credentials: [['General liability insurance', true], ['Union eligible (self-reported)', false]],
      services: [['Half day shoot', 'Up to 5 hours on set with my camera package.', 0.6, 'per half day', 'Camera, lenses, monitor'], ['Full day shoot', 'Up to 10 hours on set. The usual choice for commercials and music videos.', 1, 'per day', 'Camera package, 1st AC on request'], ['Color grade', 'Grading for a finished edit up to 3 minutes.', 1.2, 'per project', '2 rounds of changes']],
      faq: [['Do you bring your own camera?', 'Yes. My camera package is included in the day rate. Extra lenses or lighting can be added.'], ['Can you travel?', 'Yes. Travel and accommodation are added at cost for shoots outside my city.'], ['How far ahead should I book?', 'Two weeks is ideal. I can sometimes take shoots on shorter notice.']]
    },
    aerial: {
      headline: (c) => `${c.craft}: aerial and FPV shots for film and brands`,
      about: (c) => `I fly cinema drones and FPV rigs for car films, tourism, real estate and events. Every flight starts with an airspace check and a safety plan. I work as a pilot with a camera operator, or fly and shoot on my own for smaller jobs.`,
      experience: [['Drone pilot', 'Tourism board campaign'], ['FPV pilot', 'Car commercial chase sequence'], ['Aerial camera operator', 'Outdoor music festival'], ['Pilot', 'Luxury real estate series']],
      credentials: [['FAA Part 107 remote pilot', false], ['Drone liability insurance', true]],
      services: [['Aerial shoot day', 'Cinema drone, pilot and camera operator for up to 8 hours.', 1, 'per day', 'Drone, batteries, airspace check'], ['FPV chase day', 'Fast, close FPV shots for cars, sports and action.', 1.15, 'per day', 'FPV rig, spotter'], ['Location scout flight', 'A short flight to plan shots and check airspace.', 0.35, 'per visit', 'Test footage']],
      faq: [['Do you handle permits?', 'I check airspace and apply for any approvals needed. Some locations need extra time.'], ['What if the weather is bad?', 'We move the flight to the next good day at no extra charge.'], ['Can you fly indoors?', 'Yes, with smaller FPV drones and a safety brief.']]
    },
    d3: {
      headline: (c) => `${c.craft}: 3D worlds, renders and virtual production`,
      about: (c) => `I build 3D environments, product renders and real-time scenes for brands, studios and virtual production stages. I like working early in a project, turning a rough idea into frames everyone can react to before anything is shot.`,
      experience: [['Real-time artist', 'Virtual production music video'], ['3D lead', 'Product launch film'], ['Environment artist', 'Indie game trailer'], ['Lookdev artist', 'Streaming series pilot']],
      credentials: [['Bachelor of Fine Arts, 3D animation', false]],
      services: [['Concept frames', 'Three still frames to set the look before production.', 0.9, 'per project', '2 rounds of changes'], ['Environment build', 'A finished real-time environment ready for camera.', 4, 'per project', 'Source files on request'], ['Stage day', 'On-set support for a virtual production day.', 1, 'per day', 'Scene tweaks on the day']],
      faq: [['Which software do you use?', 'Mostly Unreal Engine and Houdini. I can match your studio pipeline.'], ['Do I get the source files?', 'Yes, if agreed up front. It is listed in the quote.'], ['Can you work remotely?', 'Yes. Most of my 3D work is remote with regular check-ins.']]
    },
    art: {
      headline: (c) => `${c.craft} for fashion, beauty and editorial`,
      about: (c) => `I shoot and direct fashion, beauty and product stories with a strong sense of light and shape. I plan every set with a mood board and a shot list, and I am happy to work with your stylist or bring a team I trust.`,
      experience: [['Photographer', 'Fashion label lookbook'], ['Creative director', 'Jewellery campaign'], ['Photographer', 'Magazine editorial story'], ['Lighting director', 'Beauty product launch']],
      credentials: [['Professional indemnity insurance', true]],
      services: [['Editorial shoot day', 'A full day in the studio or on location.', 1, 'per day', 'Lighting, 20 retouched images'], ['Lookbook', 'Up to 25 looks shot on a clean backdrop.', 1.6, 'per project', 'Retouching included'], ['Retouching', 'High-end retouching for your existing images.', 0.08, 'per image', 'Skin, color, clean-up']],
      faq: [['Do you provide a stylist?', 'I can bring a stylist and hair and makeup team, priced separately.'], ['How soon do I get the images?', 'Edited images arrive within 7 to 10 working days.'], ['Can I use the images for ads?', 'Usage is agreed in the quote. Advertising use may cost more.']]
    },
    action: {
      headline: (c) => `${c.craft}: moving camera rigs for action and cars`,
      about: (c) => `I run moving camera rigs for car films, sports and action scenes. Safety comes first on every shot, with a briefing before we roll. I bring a tested rig and a small team that has worked together for years.`,
      experience: [['Rig operator', 'Car commercial on closed roads'], ['Tracking vehicle driver', 'Sports documentary'], ['Cable cam operator', 'Mountain bike event film'], ['Rig technician', 'Action feature second unit']],
      credentials: [['Advanced driving course (self-reported)', false], ['Equipment liability insurance', true]],
      services: [['Rig day', 'Rig, operator and tech for up to 10 hours.', 1, 'per day', 'Rig, safety brief'], ['Prep and test day', 'Build and test the rig before the shoot.', 0.5, 'per day', 'Test footage'], ['Rig consult', 'A call to plan shots and pick the right rig.', 0.2, 'per call', 'Written shot plan']],
      faq: [['Is the rig road-legal?', 'Yes, for closed or permitted roads. We plan the route together first.'], ['Do you bring a driver?', 'Yes, a trained driver is included on tracking vehicle days.'], ['What size crew do you need?', 'Usually two or three people for the rig, depending on the shot.']]
    }
  };
  const LANGS = [['English'], ['English', 'Spanish'], ['English', 'French'], ['English', 'Japanese'], ['English', 'German'], ['English', 'Italian']];
  const TRAVEL = ['Travels nationwide', 'Up to 100 miles', 'Travels worldwide', 'Local only'];
  const AVAIL = ['Weekdays and some weekends', 'Most days, book ahead', 'Weekends and evenings', 'Weekdays'];
  const NOTICE = ['1 week', '2 weeks', '3 days', '1 month'];
  const PAY = [['Bank transfer', 'Card'], ['Bank transfer', 'PayPal'], ['Card', 'Bank transfer', 'Cash'], ['Bank transfer']];

  function sampleProfile(c, i) {
    const t = PROFILE[c.cat] || PROFILE.film;
    const rate = parseInt(String(c.rate).replace(/[^0-9]/g, ''), 10) || 500;
    const years = 4 + ((i * 3) % 10);
    const nowYear = 2026;
    return {
      sample: true,
      headline: t.headline(c),
      about: [c.bio, t.about(c)],
      years,
      languages: LANGS[i % LANGS.length],
      travel: TRAVEL[i % TRAVEL.length],
      remote: c.cat === 'd3' || i % 3 === 0,
      experience: t.experience.map((e, k) => ({ role: e[0], project: e[1], year: nowYear - 1 - k * 2 - (i % 2) })),
      credentials: t.credentials.map((x) => ({ name: x[0], checked: x[1] })),
      services: t.services.map((x) => ({ title: x[0], desc: x[1], price: Math.round(rate * x[2] / 5) * 5, unit: x[3], includes: x[4] })),
      how: { payments: PAY[i % PAY.length], deposit: i % 2 ? '30% to confirm the date' : '50% to confirm the date', cancel: i % 2 ? 'Free up to 7 days before' : 'Free up to 14 days before', notice: NOTICE[i % NOTICE.length], availability: AVAIL[i % AVAIL.length] },
      faq: t.faq.map((x) => ({ q: x[0], a: x[1] }))
    };
  }

  const TRUST_STATS = [
    { completedProjects: 38, responseTime: '< 1 hr', rating: 4.98, reviewCount: 26, onTimeRate: 100 },
    { completedProjects: 45, responseTime: '< 30 min', rating: 5.0, reviewCount: 31, onTimeRate: 100 },
    { completedProjects: 29, responseTime: '< 2 hrs', rating: 4.95, reviewCount: 19, onTimeRate: 98 },
    { completedProjects: 52, responseTime: '< 45 min', rating: 4.99, reviewCount: 42, onTimeRate: 100 },
    { completedProjects: 34, responseTime: '< 1 hr', rating: 4.97, reviewCount: 24, onTimeRate: 100 }
  ];

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
      gallery: getGalleryForCreator(c, heroImage),
      profile: sampleProfile(c, i)
    });
  });
  window.NEXUS_CREATOR_URL = (nameOrSlug) => '/c/' + (nameOrSlug.includes(' ') || /[A-Z]/.test(nameOrSlug) ? slug(nameOrSlug) : nameOrSlug);
})();
