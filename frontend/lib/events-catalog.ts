/**
 * Comprehensive 51+ Events Catalog for AuraTickets
 * 
 * Provides rich metadata, artist bios, event agendas, venue details, policies,
 * and tiered pricing across Concerts, Sports Arenas, and K-Pop.
 */

export interface EventTier {
  id: string;
  name: string;
  badge?: string;
  price: number;
  description: string;
  perks: string[];
  availableSeats: number;
  totalSeats: number;
  color: string;
}

export interface EventAgendaItem {
  time: string;
  title: string;
  description: string;
}

export interface EventPolicies {
  ageRestriction: string;
  bagPolicy: string;
  photography: string;
  entryRequirements: string;
  refundPolicy: string;
}

export interface ArtistBio {
  name: string;
  headliner: string;
  biography: string;
  genre: string;
  highlights: string[];
}

export interface CatalogEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  groupCategory: 'Concerts' | 'Sports' | 'K-Pop' | 'Motorsport';
  description: string;
  startTime: string;
  endTime: string;
  bannerUrl: string;
  minPrice: number;
  availableSeats: number;
  totalSeats: number;
  isPopular?: boolean;
  isHotDrop?: boolean;
  galleryPhotos?: string[];
  organizer?: {
    name: string;
    verified: boolean;
    badge: string;
    description?: string;
  };
  venue: {
    name: string;
    slug: string;
    address: string;
    city: string;
    country: string;
    capacity: number;
    transitDirections: string;
    parkingInfo: string;
    acousticProfile: string;
  };
  artistBio: ArtistBio;
  agenda: EventAgendaItem[];
  policies: EventPolicies;
  tiers: EventTier[];
}

const DEFAULT_TIERS = (basePrice: number): EventTier[] => [
  {
    id: 'sec-vip',
    name: 'VIP Platinum Orchestra',
    badge: 'Best Experience',
    price: Math.round(basePrice * 2.2),
    description: 'Direct front-row seating with dedicated acoustics, prime sightlines, and luxury lounge hospitality.',
    perks: [
      'Unobstructed front-stage / sideline sightlines',
      'Dedicated VIP Lounge & Fast-Track Bar',
      'Exclusive Tour Laminate & Holographic Pass',
      'Priority expedited security turnstile lane',
    ],
    availableSeats: 48,
    totalSeats: 120,
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'sec-lower-center',
    name: 'Lower Bowl Center',
    badge: 'Popular',
    price: Math.round(basePrice * 1.4),
    description: 'Premier elevated tiered sightlines with stadium acoustic balance and unobstructed camera angles.',
    perks: [
      'Elevated central perspective',
      'Padded arena lounge seating',
      'Direct concourse access & restrooms',
    ],
    availableSeats: 142,
    totalSeats: 220,
    color: 'from-indigo-600 to-violet-600',
  },
  {
    id: 'sec-wings',
    name: 'East & West Wings',
    badge: 'Great Angle',
    price: Math.round(basePrice * 1.1),
    description: 'Dynamic diagonal perspective close to stage amplification arrays and immersive crowd energy.',
    perks: [
      'Angled vantage point of stage production',
      'Fast gate entry from West & East concourse',
    ],
    availableSeats: 88,
    totalSeats: 140,
    color: 'from-cyan-600 to-blue-600',
  },
  {
    id: 'sec-balcony',
    name: 'Upper Grand Balcony',
    badge: 'Best Value',
    price: basePrice,
    description: 'Full panoramic arena view capturing total lighting, laser spectacle, and synchronized wristband waves.',
    perks: [
      'Full panoramic arena & laser overview',
      'Budget-friendly festival seating',
    ],
    availableSeats: 94,
    totalSeats: 152,
    color: 'from-zinc-700 to-zinc-800',
  },
];

const DEFAULT_POLICIES: EventPolicies = {
  ageRestriction: 'All ages welcome. Children under 12 must be accompanied by an adult ticket holder.',
  bagPolicy: 'Clear bags up to 12" x 6" x 12" or small clutch purses (4.5" x 6.5") permitted. Large backpacks strictly prohibited.',
  photography: 'Mobile phone cameras permitted. Professional cameras with detachable lenses or video rigs require accredited media passes.',
  entryRequirements: 'Digital offline QR ticket pass via AuraTickets mobile app required at turnstile turnstiles. Valid photo ID required.',
  refundPolicy: 'Full refund or seat exchange guaranteed in case of official event cancellation or reschedule. Transferable via ticket vault.',
};

export const CATALOG_EVENTS: CatalogEvent[] = [
  {
    id: "f1-singapore-grand-prix-arena",
    slug: "f1-singapore-grand-prix-arena",
    title: "Formula 1 Singapore Grand Prix: Concert & Trackside Arena",
    subtitle: "Night Race Under Marina Bay Floodlights & The Padang Stage",
    category: "Formula 1 & Grand Prix",
    groupCategory: "Motorsport",
    description: "The pinnacle of motorsport meets stadium-grade international entertainment. Experience high-octane 320 km/h street circuit action paired with world-class paddock hospitality and massive Padang headline concerts.",
    startTime: "2026-09-18T18:00:00.000Z",
    endTime: "2026-09-20T23:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80",
    minPrice: 198,
    availableSeats: 320,
    totalSeats: 1200,
    isPopular: true,
    isHotDrop: true,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Singapore GP Pte Ltd & Formula One Group",
        "verified": true,
        "badge": "Official F1 Sanctioned Promoter",
        "description": "Official promoter and organizer of the Formula 1 Singapore Grand Prix, delivering world-class street racing and premier entertainment since 2008."
  },
    venue: {
        "name": "Marina Bay Street Circuit & Padang Stage",
        "slug": "marina-bay-street-circuit",
        "address": "1 Republic Boulevard, Marina Bay, Singapore 038975",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 65000,
        "transitDirections": "City Hall MRT (NS25/EW13) or Promenade MRT (CC4/DT15) with direct turnstile access.",
        "parkingInfo": "Strict traffic lockdown in Downtown Core. Public transport is mandatory for all ticket holders.",
        "acousticProfile": "Open-air high-decibel street circuit and line-array stage mastering."
  },
    artistBio: {
      name: "Formula 1 Singapore Grand Prix",
      headliner: "Formula 1 Singapore Grand Prix: Concert & Trackside Arena",
      biography: "The pinnacle of motorsport meets stadium-grade international entertainment. Experience high-octane 320 km/h street circuit action paired with world-class paddock hospitality and massive Padang headline concerts.",
      genre: "Formula 1 & Grand Prix",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(198)
  },

  {
    id: "historic-festival-42-lime-rock",
    slug: "historic-festival-42-lime-rock",
    title: "Historic Festival 42 Lime Rock Park",
    subtitle: "Labor Day Historic Racing & Sunday In The Park Concours",
    category: "Historic Racing",
    groupCategory: "Motorsport",
    description: "Lime Rock Park's annual Historic Festival is unlike any other automotive showcase in the world. Experience five days of premier motoring magnificence, vintage endurance racing, and historic paddock access.",
    startTime: "2026-08-30T09:00:00.000Z",
    endTime: "2026-09-02T18:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80",
    minPrice: 110,
    availableSeats: 450,
    totalSeats: 1500,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Lime Rock Historic Festival LLC",
        "verified": true,
        "badge": "Official Historic Sanctioned Circuit",
        "description": "Preserving and celebrating motorsport heritage with sanctioned historic automobile racing since 1957."
  },
    venue: {
        "name": "Lime Rock Park Historic Circuit",
        "slug": "lime-rock-park",
        "address": "60 White Hollow Rd, Lakeville, CT 06039",
        "city": "Lakeville",
        "country": "United States",
        "capacity": 25000,
        "transitDirections": "Accessible via Route 7 North or Metro-North to Wassaic with weekend event shuttle.",
        "parkingInfo": "Infield camping, RV pads, and free trackside parking available at Main Gate.",
        "acousticProfile": "Natural hillside amphitheater with roaring naturally aspirated engines."
  },
    artistBio: {
      name: "Historic Festival 42 Lime Rock Park",
      headliner: "Historic Festival 42 Lime Rock Park",
      biography: "Lime Rock Park's annual Historic Festival is unlike any other automotive showcase in the world. Experience five days of premier motoring magnificence, vintage endurance racing, and historic paddock access.",
      genre: "Historic Racing",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(110)
  },

  {
    id: "dakar-desert-rally",
    slug: "dakar-desert-rally",
    title: "Dakar Desert Rally: Dunes of Qatar & Saudi Arabia",
    subtitle: "Championship Stage Finish & Bivouac Super Special Experience",
    category: "Rally & Off-Road",
    groupCategory: "Motorsport",
    description: "The ultimate endurance motorsport adventure. Watch custom desert prototype buggies, trucks, and factory motorbikes conquer towering desert dunes under the Arabian sun.",
    startTime: "2026-11-12T07:00:00.000Z",
    endTime: "2026-11-15T20:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80",
    minPrice: 145,
    availableSeats: 280,
    totalSeats: 900,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Amaury Sport Organisation (A.S.O.)",
        "verified": true,
        "badge": "Official FIM/FIA World Championship Organizer",
        "description": "World-renowned organizer of iconic global sporting events including the Dakar Rally and Tour de France."
  },
    venue: {
        "name": "Sealine Desert Bivouac Stadium Arena",
        "slug": "sealine-desert-bivouac",
        "address": "Sealine Beach Rd, Mesaieed, Qatar",
        "city": "Doha",
        "country": "Qatar",
        "capacity": 18000,
        "transitDirections": "4x4 desert express shuttles run continuously from Al Wakrah Metro Station.",
        "parkingInfo": "Dedicated 4WD and ATV vehicle staging parking at Gateway Control Point.",
        "acousticProfile": "Vast open desert dunes acoustic reflection."
  },
    artistBio: {
      name: "Dakar Desert Rally",
      headliner: "Dakar Desert Rally: Dunes of Qatar & Saudi Arabia",
      biography: "The ultimate endurance motorsport adventure. Watch custom desert prototype buggies, trucks, and factory motorbikes conquer towering desert dunes under the Arabian sun.",
      genre: "Rally & Off-Road",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(145)
  },

  {
    id: "monaco-grand-prix",
    slug: "monaco-grand-prix",
    title: "Monaco Grand Prix VIP Harbor Experience",
    subtitle: "Glamour, Yachts & Racing on the Circuit de Monaco Street Circuit",
    category: "Formula 1 & Grand Prix",
    groupCategory: "Motorsport",
    description: "The crown jewel of Formula 1. Witness high-downforce single-seaters navigating the tight Casino Square and Swimming Pool chicane with premier yacht hospitality.",
    startTime: "2026-05-22T08:00:00.000Z",
    endTime: "2026-05-24T19:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    minPrice: 380,
    availableSeats: 110,
    totalSeats: 600,
    isPopular: true,
    isHotDrop: true,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1532974297617-c0f05fe48bff?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Automobile Club de Monaco",
        "verified": true,
        "badge": "Official Monaco GP Promoter",
        "description": "Historical automotive federation organizing the Monaco Grand Prix and Rallye Monte-Carlo since 1929."
  },
    venue: {
        "name": "Circuit de Monaco & Port Hercule Yacht Marina",
        "slug": "circuit-de-monaco",
        "address": "23 Boulevard Albert 1er, 98000 Monaco",
        "city": "Monte Carlo",
        "country": "Monaco",
        "capacity": 37000,
        "transitDirections": "Monaco-Monte-Carlo Train Station with direct elevator to Sainte-Devote circuit gate.",
        "parkingInfo": "Restricted access; parking available at Salines Parking with circuit shuttle.",
        "acousticProfile": "Urban harbor corridor amplifying turbo-hybrid engine harmonics."
  },
    artistBio: {
      name: "Monaco Grand Prix VIP Harbor Experience",
      headliner: "Monaco Grand Prix VIP Harbor Experience",
      biography: "The crown jewel of Formula 1. Witness high-downforce single-seaters navigating the tight Casino Square and Swimming Pool chicane with premier yacht hospitality.",
      genre: "Formula 1 & Grand Prix",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(380)
  },

  {
    id: "le-mans-24h",
    slug: "le-mans-24h",
    title: "24 Hours of Le Mans: Centenary Endurance Celebration",
    subtitle: "Around-the-Clock Hypercar Battles at Circuit de la Sarthe",
    category: "Endurance Racing",
    groupCategory: "Motorsport",
    description: "The greatest endurance race on earth. Factory Hypercars from Ferrari, Porsche, Toyota, and Cadillac battle for 24 continuous hours down the legendary Mulsanne Straight.",
    startTime: "2026-06-13T14:00:00.000Z",
    endTime: "2026-06-14T16:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
    minPrice: 165,
    availableSeats: 520,
    totalSeats: 2500,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1534093607318-f025413f49cb?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Automobile Club de l’Ouest (ACO)",
        "verified": true,
        "badge": "Official WEC & Le Mans Sanctioning Body",
        "description": "Founder and organizer of the 24 Hours of Le Mans, championing endurance racing innovations worldwide."
  },
    venue: {
        "name": "Circuit des 24 Heures du Mans",
        "slug": "circuit-de-la-sarthe",
        "address": "Place Luigi Chinetti, 72055 Le Mans, France",
        "city": "Le Mans",
        "country": "France",
        "capacity": 100000,
        "transitDirections": "TGV train from Paris Montparnasse (54 mins) + Le Mans Tramway T1 directly to circuit entrance.",
        "parkingInfo": "Large open campsites (Beausejour, Houx) and designated grass vehicle lots.",
        "acousticProfile": "Extensive 13.6km rural circuit with distinct acoustic zones."
  },
    artistBio: {
      name: "24 Hours of Le Mans",
      headliner: "24 Hours of Le Mans: Centenary Endurance Celebration",
      biography: "The greatest endurance race on earth. Factory Hypercars from Ferrari, Porsche, Toyota, and Cadillac battle for 24 continuous hours down the legendary Mulsanne Straight.",
      genre: "Endurance Racing",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(165)
  },

  {
    id: "supercars-championship-melbourne",
    slug: "supercars-championship-melbourne",
    title: "Repco Supercars Melbourne Grand Prix",
    subtitle: "V8 Touring Car Thunder at Albert Park Circuit",
    category: "Touring Car Championship",
    groupCategory: "Motorsport",
    description: "Australias premier motorsport series features 650hp Chevrolet Camaros and Ford Mustangs battling bumper-to-bumper through Albert Parks sweeping lakeside turns.",
    startTime: "2026-03-26T10:00:00.000Z",
    endTime: "2026-03-29T18:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    minPrice: 125,
    availableSeats: 390,
    totalSeats: 1800,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Supercars Australia Pty Ltd",
        "verified": true,
        "badge": "Official Supercars Governing Body",
        "description": "The premier touring car category in Australasia, delivering heart-pounding V8 touring car competition."
  },
    venue: {
        "name": "Albert Park Grand Prix Circuit",
        "slug": "albert-park-circuit",
        "address": "220 Albert Rd, South Melbourne VIC 3205",
        "city": "Melbourne",
        "country": "Australia",
        "capacity": 70000,
        "transitDirections": "Yarra Trams Route 12 or 96 running free GP Express shuttles from Southern Cross Station.",
        "parkingInfo": "Strict public transport zone. No on-site general public car parking.",
        "acousticProfile": "Lakeside parkland with crisp V8 rumble resonating off Melbourne city skyline."
  },
    artistBio: {
      name: "Repco Supercars Melbourne Grand Prix",
      headliner: "Repco Supercars Melbourne Grand Prix",
      biography: "Australias premier motorsport series features 650hp Chevrolet Camaros and Ford Mustangs battling bumper-to-bumper through Albert Parks sweeping lakeside turns.",
      genre: "Touring Car Championship",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(125)
  },

  {
    id: "seventeen-right-here-world-tour",
    slug: "seventeen-right-here-world-tour",
    title: "SEVENTEEN [RIGHT HERE] World Tour Singapore",
    subtitle: "13-Member Powerhouse Live at Singapore National Stadium",
    category: "K-Pop Fandom",
    groupCategory: "K-Pop",
    description: "PLEDIS Entertainment mega-group SEVENTEEN brings their historic [RIGHT HERE] World Tour to Singapore. Featuring an extraordinary 3-hour stadium production and synchronous choreography.",
    startTime: "2026-10-14T19:00:00.000Z",
    endTime: "2026-10-14T22:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80",
    minPrice: 128,
    availableSeats: 410,
    totalSeats: 1600,
    isPopular: true,
    isHotDrop: true,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "PLEDIS Entertainment & Live Nation Singapore",
        "verified": true,
        "badge": "Official PLEDIS Global Tour Partner",
        "description": "Official global promoter ensuring certified Carat membership ticketing and authentic VIP soundcheck access."
  },
    venue: {
        "name": "Singapore National Stadium",
        "slug": "singapore-national-stadium",
        "address": "1 Stadium Dr, Singapore 397629",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 55000,
        "transitDirections": "Stadium MRT Station (CC6) directly exits onto the 100PLUS Promenade turnstiles.",
        "parkingInfo": "Kallang Wave Mall carparks available; MRT strongly advised.",
        "acousticProfile": "Retractable domed acoustics with state-of-the-art stadium delay towers."
  },
    artistBio: {
      name: "SEVENTEEN [RIGHT HERE] World Tour Singapore",
      headliner: "SEVENTEEN [RIGHT HERE] World Tour Singapore",
      biography: "PLEDIS Entertainment mega-group SEVENTEEN brings their historic [RIGHT HERE] World Tour to Singapore. Featuring an extraordinary 3-hour stadium production and synchronous choreography.",
      genre: "K-Pop Fandom",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(128)
  },

  {
    id: "blackpink-born-pink-encore",
    slug: "blackpink-born-pink-encore",
    title: "BLACKPINK [BORN PINK] World Tour Encore Seoul",
    subtitle: "Historic Stadium Finale with Jennie, Jisoo, Rosé & Lisa",
    category: "K-Pop Fandom",
    groupCategory: "K-Pop",
    description: "The biggest girl group on the planet returns to Seoul for their electrifying BORN PINK encore stadium spectacle. Featuring a massive LED stage, live band, and full-arena synchronized lightstick display.",
    startTime: "2026-09-26T18:00:00.000Z",
    endTime: "2026-09-26T21:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
    minPrice: 155,
    availableSeats: 190,
    totalSeats: 1400,
    isPopular: true,
    isHotDrop: true,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "YG Entertainment Inc.",
        "verified": true,
        "badge": "Official YG Global Agency Partner",
        "description": "Pioneering global entertainment powerhouse managing record-breaking K-Pop artists."
  },
    venue: {
        "name": "Seoul Olympic Stadium Main Arena",
        "slug": "seoul-olympic-stadium",
        "address": "25 Olympic-ro, Songpa-gu, Seoul",
        "city": "Seoul",
        "country": "South Korea",
        "capacity": 65000,
        "transitDirections": "Sports Complex Station (Line 2 & Line 9, Exit 6 & 7) directly enters the Olympic plaza.",
        "parkingInfo": "Olympic Park public parking available; public subway heavily recommended.",
        "acousticProfile": "Olympic bowl acoustics with specialized front-of-house sub-bass arrays."
  },
    artistBio: {
      name: "BLACKPINK [BORN PINK] World Tour Encore Seoul",
      headliner: "BLACKPINK [BORN PINK] World Tour Encore Seoul",
      biography: "The biggest girl group on the planet returns to Seoul for their electrifying BORN PINK encore stadium spectacle. Featuring a massive LED stage, live band, and full-arena synchronized lightstick display.",
      genre: "K-Pop Fandom",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(155)
  },

  {
    id: "aespa-synk-hyper-line",
    slug: "aespa-synk-hyper-line",
    title: "aespa LIVE TOUR 2026 - SYNK : HYPER LINE",
    subtitle: "Metaverse Avatar Visuals & Heavy Future-Bass Live Band",
    category: "K-Pop Fandom",
    groupCategory: "K-Pop",
    description: "SM Entertainments revolutionary group brings their high-concept ae-avatar production to Tokyo Dome. Featuring futuristic holographic choreography, live rock rearrangements, and hyper-pop anthems.",
    startTime: "2026-10-28T18:30:00.000Z",
    endTime: "2026-10-28T21:45:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80",
    minPrice: 118,
    availableSeats: 260,
    totalSeats: 1300,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "SM Entertainment Japan & Live Nation",
        "verified": true,
        "badge": "Official SM Global Partner",
        "description": "Official global promoter ensuring certified MY membership priority booking."
  },
    venue: {
        "name": "Tokyo Dome Arena",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City, Tokyo 112-0004",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "Suidobashi Station (JR Chuo-Sobu Line) or Korakuen Station (Tokyo Metro Marunouchi Line).",
        "parkingInfo": "No private parking during major arena events. Rapid rail transit advised.",
        "acousticProfile": "Enclosed dome acoustics enhanced by d&b audiotechnik J-Series arrays."
  },
    artistBio: {
      name: "aespa LIVE TOUR 2026 - SYNK ",
      headliner: "aespa LIVE TOUR 2026 - SYNK : HYPER LINE",
      biography: "SM Entertainments revolutionary group brings their high-concept ae-avatar production to Tokyo Dome. Featuring futuristic holographic choreography, live rock rearrangements, and hyper-pop anthems.",
      genre: "K-Pop Fandom",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(118)
  },

  {
    id: "stray-kids-dominate-tour-hanoi",
    slug: "stray-kids-dominate-tour-hanoi",
    title: "Stray Kids: 'dominATE' World Tour Hanoi",
    subtitle: "3RACHA Producing Powerhouse Hits Vietnam National Stadium",
    category: "K-Pop Fandom",
    groupCategory: "K-Pop",
    description: "Self-producing sensation Stray Kids lands in Hanoi for an explosive stadium show. Experience thunderous live drums, high-octane hip-hop routines, and an ocean of synchronized Nachimbong compasses.",
    startTime: "2026-11-20T19:00:00.000Z",
    endTime: "2026-11-20T22:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
    minPrice: 95,
    availableSeats: 340,
    totalSeats: 1500,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1547038577-da80abbc4f19?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519752594763-2633d8d4ea29?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "JYP Entertainment & IME Vietnam",
        "verified": true,
        "badge": "Official JYP Tour Partner",
        "description": "Premier Asian concert touring company managing stadium events across the APAC region."
  },
    venue: {
        "name": "My Dinh National Stadium",
        "slug": "my-dinh-national-stadium",
        "address": "Le Duc Tho Street, Nam Tu Liem, Hanoi",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 40000,
        "transitDirections": "Bus lines 26, 46, and Metro Line 3 Nhon - Ga Hanoi (Cau Giay connecting shuttle).",
        "parkingInfo": "Large motorcycle and automotive parking fields at South and North Stadium Squares.",
        "acousticProfile": "Open-air national arena with multi-point delay towers for crisp vocal clarity."
  },
    artistBio: {
      name: "Stray Kids",
      headliner: "Stray Kids: 'dominATE' World Tour Hanoi",
      biography: "Self-producing sensation Stray Kids lands in Hanoi for an explosive stadium show. Experience thunderous live drums, high-octane hip-hop routines, and an ocean of synchronized Nachimbong compasses.",
      genre: "K-Pop Fandom",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(95)
  },

  {
    id: "newjeans-bunnies-camp-tokyo",
    slug: "newjeans-bunnies-camp-tokyo",
    title: "NewJeans 'Bunnies Camp' Tokyo Dome Fan Meeting",
    subtitle: "Nostalgic 90s R&B Grooves, Pop-Up Stage & Special Guests",
    category: "K-Pop Fandom",
    groupCategory: "K-Pop",
    description: "ADORs record-shattering quintet NewJeans takes over Tokyo Dome for an unforgettable two-day Bunnies Camp. Live performances of Ditto, OMG, Hype Boy, and Super Shy alongside retro skate-park stages.",
    startTime: "2026-10-05T17:00:00.000Z",
    endTime: "2026-10-05T20:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
    minPrice: 115,
    availableSeats: 220,
    totalSeats: 1200,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "ADOR Co., Ltd. & HYBE Japan",
        "verified": true,
        "badge": "Official ADOR Sanctioned Organizer",
        "description": "Official production entity delivering exclusive fanclub experiences and verified merchandise."
  },
    venue: {
        "name": "Tokyo Dome Arena",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City, Tokyo 112-0004",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "Korakuen Station or JR Suidobashi with direct enclosed pedestrian walkways.",
        "parkingInfo": "Tokyo Dome City parking lots available for VIP ticket holders.",
        "acousticProfile": "State-of-the-art line arrays calibrated for intimate acoustic and R&B vocals."
  },
    artistBio: {
      name: "NewJeans 'Bunnies Camp' Tokyo Dome Fan Meeting",
      headliner: "NewJeans 'Bunnies Camp' Tokyo Dome Fan Meeting",
      biography: "ADORs record-shattering quintet NewJeans takes over Tokyo Dome for an unforgettable two-day Bunnies Camp. Live performances of Ditto, OMG, Hype Boy, and Super Shy alongside retro skate-park stages.",
      genre: "K-Pop Fandom",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(115)
  },

  {
    id: "twice-ready-to-be-stadium",
    slug: "twice-ready-to-be-stadium",
    title: "TWICE: 5th World Tour READY TO BE Special Encore",
    subtitle: "9-Member Stadium Euphoria & Dazzling Runway Stages",
    category: "K-Pop Fandom",
    groupCategory: "K-Pop",
    description: "Global girl group TWICE delivers their spectacular READY TO BE stadium show. Non-stop high-energy choreography, unit stages, and candy-colored anthems performed before 50,000 passionate ONCE.",
    startTime: "2026-11-08T18:00:00.000Z",
    endTime: "2026-11-08T21:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
    minPrice: 110,
    availableSeats: 310,
    totalSeats: 1400,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "JYP Entertainment & Live Nation Global",
        "verified": true,
        "badge": "Official JYP Global Promoter",
        "description": "Official global promoter ensuring certified ONCE membership priority and authentic VIP packages."
  },
    venue: {
        "name": "Seoul Olympic Gymnastics Arena (KSPO Dome)",
        "slug": "kspo-dome",
        "address": "424 Olympic-ro, Songpa-gu, Seoul",
        "city": "Seoul",
        "country": "South Korea",
        "capacity": 15000,
        "transitDirections": "Olympic Park Station (Line 5 & Line 9, Exit 3).",
        "parkingInfo": "Olympic Park Central carpark.",
        "acousticProfile": "Acoustically treated dome bowl with balanced stadium resonance."
  },
    artistBio: {
      name: "TWICE",
      headliner: "TWICE: 5th World Tour READY TO BE Special Encore",
      biography: "Global girl group TWICE delivers their spectacular READY TO BE stadium show. Non-stop high-energy choreography, unit stages, and candy-colored anthems performed before 50,000 passionate ONCE.",
      genre: "K-Pop Fandom",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(110)
  },

  {
    id: "premier-league-asia-trophy-singapore",
    slug: "premier-league-asia-trophy-singapore",
    title: "Premier League Asian Tour: Liverpool FC vs Arsenal FC",
    subtitle: "Clash of English Football Titans in Southeast Asia",
    category: "Football & Premier League",
    groupCategory: "Sports",
    description: "Premier League football returns to the Singapore National Stadium. Watch full first-team squads including star attackers and new signings battle for the prestigious pre-season trophy.",
    startTime: "2026-07-28T19:30:00.000Z",
    endTime: "2026-07-28T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80",
    minPrice: 85,
    availableSeats: 580,
    totalSeats: 2200,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "The Football Association Premier League Ltd",
        "verified": true,
        "badge": "Official Premier League Partner",
        "description": "The organizing body of the English Premier League, bringing official sanctioned exhibition tours to international fans."
  },
    venue: {
        "name": "Singapore National Stadium",
        "slug": "singapore-national-stadium",
        "address": "1 Stadium Dr, Singapore 397629",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 55000,
        "transitDirections": "Stadium MRT (Circle Line) or Kallang MRT (East-West Line) via sheltered linkway.",
        "parkingInfo": "Stadium pre-booked parking spaces available; MRT transit recommended.",
        "acousticProfile": "Stadium bowl designed to capture natural crowd acoustics."
  },
    artistBio: {
      name: "Premier League Asian Tour",
      headliner: "Premier League Asian Tour: Liverpool FC vs Arsenal FC",
      biography: "Premier League football returns to the Singapore National Stadium. Watch full first-team squads including star attackers and new signings battle for the prestigious pre-season trophy.",
      genre: "Football & Premier League",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(85)
  },

  {
    id: "nba-global-games-tokyo-2026",
    slug: "nba-global-games-tokyo-2026",
    title: "NBA Japan Games: LA Lakers vs Golden State Warriors",
    subtitle: "Pre-Season Superclash Live at Saitama Super Arena",
    category: "Basketball & NBA",
    groupCategory: "Sports",
    description: "The National Basketball Association brings two legendary Western Conference franchises to Tokyo. Experience courtside VIP action, halftime entertainment, and world-class basketball mastery.",
    startTime: "2026-10-02T19:00:00.000Z",
    endTime: "2026-10-02T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
    minPrice: 135,
    availableSeats: 320,
    totalSeats: 1500,
    isPopular: true,
    isHotDrop: true,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "National Basketball Association (NBA Asia)",
        "verified": true,
        "badge": "Official NBA Sanctioned Match",
        "description": "Global basketball sports federation presenting official pre-season fixtures."
  },
    venue: {
        "name": "Saitama Super Arena",
        "slug": "saitama-super-arena",
        "address": "8 Shintoshin, Chuo Ward, Saitama, 330-9111",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 36500,
        "transitDirections": "Saitama-Shintoshin Station (JR Keihin-Tohoku Line) or Kita-Yono Station (JR Saikyo Line).",
        "parkingInfo": "Underground parking garage with 800 spaces; public transit strongly urged.",
        "acousticProfile": "Moveable block arena with acoustic curtains optimized for high-intensity indoor sound."
  },
    artistBio: {
      name: "NBA Japan Games",
      headliner: "NBA Japan Games: LA Lakers vs Golden State Warriors",
      biography: "The National Basketball Association brings two legendary Western Conference franchises to Tokyo. Experience courtside VIP action, halftime entertainment, and world-class basketball mastery.",
      genre: "Basketball & NBA",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(135)
  },

  {
    id: "ufc-320-asia-championship-tokyo",
    slug: "ufc-320-asia-championship-tokyo",
    title: "UFC 320: Asia Championship Tokyo Dome",
    subtitle: "World Middleweight & Strawweight Title Doubleheader",
    category: "MMA & Combat Sports",
    groupCategory: "Sports",
    description: "The Ultimate Fighting Championship returns to Japan with an undisputed title fight doubleheader inside the Octagon. Experience 12 electrifying bouts featuring elite mixed martial artists.",
    startTime: "2026-11-28T16:00:00.000Z",
    endTime: "2026-11-28T22:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
    minPrice: 110,
    availableSeats: 290,
    totalSeats: 1400,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "UFC / TKO Group Holdings",
        "verified": true,
        "badge": "Official UFC Global Promotion",
        "description": "The worlds premier mixed martial arts organization with over 700 million fans globally."
  },
    venue: {
        "name": "Tokyo Dome Octagon Arena",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City, Tokyo 112-0004",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 50000,
        "transitDirections": "JR Suidobashi Station or Tokyo Metro Korakuen Station.",
        "parkingInfo": "Public transport is recommended.",
        "acousticProfile": "Unobstructed octagon sound field with overhead directional arena arrays."
  },
    artistBio: {
      name: "UFC 320",
      headliner: "UFC 320: Asia Championship Tokyo Dome",
      biography: "The Ultimate Fighting Championship returns to Japan with an undisputed title fight doubleheader inside the Octagon. Experience 12 electrifying bouts featuring elite mixed martial artists.",
      genre: "MMA & Combat Sports",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(110)
  },

  {
    id: "wimbledon-championships-finals",
    slug: "wimbledon-championships-finals",
    title: "The Championships Wimbledon: Finals Weekend",
    subtitle: "Gentlemen’s & Ladies’ Singles Championship on Centre Court",
    category: "Grand Slam Tennis",
    groupCategory: "Sports",
    description: "The pinnacle of tennis tradition. Witness history on the pristine grass of Centre Court as the worlds best battle for the coveted Grand Slam trophy under the retractable roof.",
    startTime: "2026-07-11T13:00:00.000Z",
    endTime: "2026-07-12T19:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80",
    minPrice: 220,
    availableSeats: 90,
    totalSeats: 800,
    isPopular: true,
    isHotDrop: true,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "All England Lawn Tennis Club (AELTC)",
        "verified": true,
        "badge": "Official Grand Slam Sanctioned Body",
        "description": "Host of the worlds oldest and most prestigious tennis tournament since 1877."
  },
    venue: {
        "name": "Wimbledon Centre Court",
        "slug": "wimbledon-centre-court",
        "address": "Church Rd, Wimbledon, London SW19 5AE",
        "city": "London",
        "country": "United Kingdom",
        "capacity": 14979,
        "transitDirections": "Southfields Station (District Line) followed by 10-minute walk down Wimbledon Park Road.",
        "parkingInfo": "Limited pre-booked Park & Ride spaces available; London Underground strongly recommended.",
        "acousticProfile": "Intimate grass court acoustics with pristine ball impact reverberation."
  },
    artistBio: {
      name: "The Championships Wimbledon",
      headliner: "The Championships Wimbledon: Finals Weekend",
      biography: "The pinnacle of tennis tradition. Witness history on the pristine grass of Centre Court as the worlds best battle for the coveted Grand Slam trophy under the retractable roof.",
      genre: "Grand Slam Tennis",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(220)
  },

  {
    id: "roland-garros-championship-finals",
    slug: "roland-garros-championship-finals",
    title: "Roland Garros Finals: Court Philippe-Chatrier Paris",
    subtitle: "The Ultimate Clay Court Grand Slam Championship",
    category: "Grand Slam Tennis",
    groupCategory: "Sports",
    description: "The world greatest red clay tournament culminates in the Men and Women Singles finals on Court Philippe-Chatrier under the Parisian sky.",
    startTime: "2026-06-06T14:00:00.000Z",
    endTime: "2026-06-07T20:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1200&q=80",
    minPrice: 195,
    availableSeats: 130,
    totalSeats: 950,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517747614396-d21a78b850e8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Fédération Française de Tennis (FFT)",
        "verified": true,
        "badge": "Official French Open Organizer",
        "description": "Governing body of French tennis and organizer of the premier red clay Grand Slam."
  },
    venue: {
        "name": "Court Philippe-Chatrier, Stade Roland Garros",
        "slug": "court-philippe-chatrier",
        "address": "2 Avenue Gordon Bennett, 75016 Paris, France",
        "city": "Paris",
        "country": "France",
        "capacity": 15225,
        "transitDirections": "Metro Line 9 (Michel-Ange Auteuil) or Metro Line 10 (Porte d Auteuil).",
        "parkingInfo": "Designated tournament park & ride lots in Bois de Boulogne with electric shuttle buses.",
        "acousticProfile": "Red clay acoustic resonance with retractable roof."
  },
    artistBio: {
      name: "Roland Garros Finals",
      headliner: "Roland Garros Finals: Court Philippe-Chatrier Paris",
      biography: "The world greatest red clay tournament culminates in the Men and Women Singles finals on Court Philippe-Chatrier under the Parisian sky.",
      genre: "Grand Slam Tennis",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(195)
  },

  {
    id: "champions-league-tokyo-clash",
    slug: "champions-league-tokyo-clash",
    title: "UEFA Champions League Tokyo Clash: Real Madrid vs Bayern Munich",
    subtitle: "European Royalty Battles at Japan National Stadium",
    category: "Elite Club Football",
    groupCategory: "Sports",
    description: "Two of European footballs most storied clubs face off in a marquee clash at Tokyo modern National Stadium. World-class football artistry, Champions League fanfare, and premier hospitality.",
    startTime: "2026-08-04T19:00:00.000Z",
    endTime: "2026-08-04T21:45:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80",
    minPrice: 95,
    availableSeats: 480,
    totalSeats: 2100,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "UEFA Global Tours & JFA",
        "verified": true,
        "badge": "Official UEFA Exhibition Sanctioned",
        "description": "Official sanctioning body for elite European club football tours in partnership with the JFA."
  },
    venue: {
        "name": "Japan National Stadium",
        "slug": "japan-national-stadium",
        "address": "10-1 Kasumigaokamachi, Shinjuku City, Tokyo 160-0013",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 68000,
        "transitDirections": "Kokuritsu-Kyogijo Station (Toei Oedo Line) or Sendagaya Station (JR Chuo-Sobu Line).",
        "parkingInfo": "Public transport only. Direct multi-line train connectivity.",
        "acousticProfile": "Wood-louvered acoustic stadium roof providing natural draft and thunderous acoustics."
  },
    artistBio: {
      name: "UEFA Champions League Tokyo Clash",
      headliner: "UEFA Champions League Tokyo Clash: Real Madrid vs Bayern Munich",
      biography: "Two of European footballs most storied clubs face off in a marquee clash at Tokyo modern National Stadium. World-class football artistry, Champions League fanfare, and premier hospitality.",
      genre: "Elite Club Football",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(95)
  },

  {
    id: "coldplay-music-of-the-spheres-hanoi",
    slug: "coldplay-music-of-the-spheres-hanoi",
    title: "Coldplay: Music of the Spheres World Tour",
    subtitle: "Eco-Friendly Stadium Spectacle with LED Wristbands & Kinetic Energy",
    category: "Rock & Pop",
    groupCategory: "Concerts",
    description: "Chris Martin and Coldplay bring their solar-powered, carbon-reduced stadium spectacle to Hanoi. Featuring iconic anthems Yellow, Fix You, Viva La Vida, and a sea of interactive PixMob LED wristbands.",
    startTime: "2026-11-15T19:30:00.000Z",
    endTime: "2026-11-15T22:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    minPrice: 75,
    availableSeats: 350,
    totalSeats: 1800,
    isPopular: true,
    isHotDrop: true,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation Global Touring",
        "verified": true,
        "badge": "Official Live Nation Promoter",
        "description": "The worlds premier live entertainment company producing stadium world tours."
  },
    venue: {
        "name": "My Dinh National Stadium",
        "slug": "my-dinh-national-stadium",
        "address": "Le Duc Tho, Nam Tu Liem, Hanoi",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 40000,
        "transitDirections": "Dedicated concert bus corridors and Grab pick-up points on Le Duc Tho.",
        "parkingInfo": "Motorcycle and bus parking on South Stadium field.",
        "acousticProfile": "Open-air stadium line arrays with eco-battery power."
  },
    artistBio: {
      name: "Coldplay",
      headliner: "Coldplay: Music of the Spheres World Tour",
      biography: "Chris Martin and Coldplay bring their solar-powered, carbon-reduced stadium spectacle to Hanoi. Featuring iconic anthems Yellow, Fix You, Viva La Vida, and a sea of interactive PixMob LED wristbands.",
      genre: "Rock & Pop",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(75)
  },

  {
    id: "taylor-swift-eras-tour-tokyo",
    slug: "taylor-swift-eras-tour-tokyo",
    title: "Taylor Swift | The Eras Tour Tokyo Dome",
    subtitle: "3.5-Hour Journey Through All Musical Eras",
    category: "Pop & Stadium Tour",
    groupCategory: "Concerts",
    description: "The highest-grossing music tour in human history touches down at Tokyo Dome for four historic nights. A 44-song masterclass spanning Taylor Swifts entire 10-album catalogue with cinematic sets.",
    startTime: "2026-10-18T18:00:00.000Z",
    endTime: "2026-10-18T21:45:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1200&q=80",
    minPrice: 135,
    availableSeats: 180,
    totalSeats: 1600,
    isPopular: true,
    isHotDrop: true,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "AEG Presents & Taylor Swift Touring",
        "verified": true,
        "badge": "Official Eras Tour Production",
        "description": "Official global promoter ensuring certified fan priority and authentic VIP packages."
  },
    venue: {
        "name": "Tokyo Dome Arena",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City, Tokyo 112-0004",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "Direct covered walkway from Suidobashi or Korakuen stations.",
        "parkingInfo": "Rapid transit train access required for concert entry.",
        "acousticProfile": "Custom hydraulic mainstage with high-fidelity surround delay arrays."
  },
    artistBio: {
      name: "Taylor Swift | The Eras Tour Tokyo Dome",
      headliner: "Taylor Swift | The Eras Tour Tokyo Dome",
      biography: "The highest-grossing music tour in human history touches down at Tokyo Dome for four historic nights. A 44-song masterclass spanning Taylor Swifts entire 10-album catalogue with cinematic sets.",
      genre: "Pop & Stadium Tour",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(135)
  },

  {
    id: "linkin-park-from-zero-tokyo",
    slug: "linkin-park-from-zero-tokyo",
    title: "Linkin Park: From Zero World Tour",
    subtitle: "A New Era of Rock Featuring Emily Armstrong & Colin Brittain",
    category: "Nu-Metal & Alternative Rock",
    groupCategory: "Concerts",
    description: "Linkin Park embarks on their triumphant return tour supporting the new album From Zero. Classic anthems In The End and Numb alongside roaring new alternative rock staples.",
    startTime: "2026-11-04T19:00:00.000Z",
    endTime: "2026-11-04T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
    minPrice: 95,
    availableSeats: 380,
    totalSeats: 1700,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560012057-4372e14c5085?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation Japan & WME",
        "verified": true,
        "badge": "Official Linkin Park Touring",
        "description": "Official production entity delivering authorized rock tours worldwide."
  },
    venue: {
        "name": "Saitama Super Arena",
        "slug": "saitama-super-arena",
        "address": "8 Shintoshin, Chuo Ward, Saitama, 330-9111",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 37000,
        "transitDirections": "JR Saitama-Shintoshin Station (direct bridge connection).",
        "parkingInfo": "Train transit strongly advised due to heavy event traffic.",
        "acousticProfile": "Stadium rock line-array system calibrated for razor-sharp vocal and drum separation."
  },
    artistBio: {
      name: "Linkin Park",
      headliner: "Linkin Park: From Zero World Tour",
      biography: "Linkin Park embarks on their triumphant return tour supporting the new album From Zero. Classic anthems In The End and Numb alongside roaring new alternative rock staples.",
      genre: "Nu-Metal & Alternative Rock",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(95)
  },

  {
    id: "tomorrowland-winter-festival",
    slug: "tomorrowland-winter-festival",
    title: "Tomorrowland Winter: The Great Frost Edition",
    subtitle: "Fairytale Electronic Dance Music on the Snowy Slopes of the Alps",
    category: "EDM & Electronic Festival",
    groupCategory: "Concerts",
    description: "The magical electronic music festival heads to the French Alps. Ski all day and dance all night with the worlds elite DJs at 2,000 meters above sea level.",
    startTime: "2026-12-18T12:00:00.000Z",
    endTime: "2026-12-21T02:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    minPrice: 210,
    availableSeats: 160,
    totalSeats: 900,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "We Are One World & Tomorrowland",
        "verified": true,
        "badge": "Official Tomorrowland Global Promoter",
        "description": "Visionary creators of the worlds most celebrated electronic music gatherings."
  },
    venue: {
        "name": "Alpe d’Huez Ski Resort & Mainstage",
        "slug": "alpe-dhuez",
        "address": "Station Alpe d’Huez, 38750 Huez, France",
        "city": "Alpe d’Huez",
        "country": "France",
        "capacity": 22000,
        "transitDirections": "Airport express coaches from Lyon Saint-Exupéry or Geneva Airport directly to resort.",
        "parkingInfo": "Covered resort parking available; festival ski lift passes included.",
        "acousticProfile": "High-altitude sub-zero audio arrays with specialized mountain acoustic traps."
  },
    artistBio: {
      name: "Tomorrowland Winter",
      headliner: "Tomorrowland Winter: The Great Frost Edition",
      biography: "The magical electronic music festival heads to the French Alps. Ski all day and dance all night with the worlds elite DJs at 2,000 meters above sea level.",
      genre: "EDM & Electronic Festival",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(210)
  },

  {
    id: "coachella-valley-festival-pass",
    slug: "coachella-valley-festival-pass",
    title: "Coachella Valley Music and Arts Festival VIP Pass",
    subtitle: "Golden Hour Sunset Sets, Art Installations & Iconic Stages",
    category: "Music & Arts Festival",
    groupCategory: "Concerts",
    description: "The world premier multi-genre festival in the Southern California desert. Three days of legendary music, surprise guest appearances, and art installations on the Empire Polo Club lawns.",
    startTime: "2026-04-10T12:00:00.000Z",
    endTime: "2026-04-12T23:59:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80",
    minPrice: 285,
    availableSeats: 210,
    totalSeats: 1100,
    isPopular: true,
    isHotDrop: true,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Goldenvoice / AEG Presents",
        "verified": true,
        "badge": "Official Coachella Festival Promoter",
        "description": "Iconic California concert promoter and producer of Coachella and Stagecoach festivals."
  },
    venue: {
        "name": "Empire Polo Club Grounds",
        "slug": "empire-polo-club",
        "address": "81-800 Avenue 51, Indio, CA 92201",
        "city": "Indio",
        "country": "United States",
        "capacity": 125000,
        "transitDirections": "Official Coachella Valley shuttles from Palm Springs hotels and LAX airport.",
        "parkingInfo": "General parking, car camping lots, and VIP valet parking adjacent to Yellow Path.",
        "acousticProfile": "Expansive open-air desert festival setup with calibrated delay towers."
  },
    artistBio: {
      name: "Coachella Valley Music and Arts Festival VIP Pass",
      headliner: "Coachella Valley Music and Arts Festival VIP Pass",
      biography: "The world premier multi-genre festival in the Southern California desert. Three days of legendary music, surprise guest appearances, and art installations on the Empire Polo Club lawns.",
      genre: "Music & Arts Festival",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(285)
  },

  {
    id: "symphony-under-the-stars",
    slug: "symphony-under-the-stars",
    title: "Symphony Under The Stars: Royal Philharmonic Orchestra",
    subtitle: "Hans Zimmer, John Williams & Ennio Morricone Film Masterpieces",
    category: "Classical & Film Scores",
    groupCategory: "Concerts",
    description: "An enchanting open-air starlight concert. The 80-piece Royal Philharmonic Orchestra performs cinema greatest soundtracks with state-of-the-art live acoustic line arrays.",
    startTime: "2026-09-08T19:30:00.000Z",
    endTime: "2026-09-08T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80",
    minPrice: 65,
    availableSeats: 430,
    totalSeats: 1600,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Royal Philharmonic Orchestra Touring Ltd",
        "verified": true,
        "badge": "Official Classical Orchestra Sanctioned",
        "description": "World-renowned British orchestra presenting masterwork cinematic performances across the globe."
  },
    venue: {
        "name": "Marina Bay Waterfront Amphitheatre",
        "slug": "marina-bay-amphitheatre",
        "address": "10 Bayfront Avenue, Singapore 018956",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 12000,
        "transitDirections": "Bayfront MRT Station (CE1/DT16) Exit B directly leads to the waterfront promenade.",
        "parkingInfo": "Marina Bay Sands underground parking available.",
        "acousticProfile": "Acoustic shell designed for pristine orchestral dynamics."
  },
    artistBio: {
      name: "Symphony Under The Stars",
      headliner: "Symphony Under The Stars: Royal Philharmonic Orchestra",
      biography: "An enchanting open-air starlight concert. The 80-piece Royal Philharmonic Orchestra performs cinema greatest soundtracks with state-of-the-art live acoustic line arrays.",
      genre: "Classical & Film Scores",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(65)
  },

  {
    id: "the-weeknd-after-hours-tour",
    slug: "the-weeknd-after-hours-tour",
    title: "The Weeknd: After Hours Til Dawn Stadium World Tour",
    subtitle: "Live at Tokyo Dome Stadium",
    category: "R&B & Stadium Pop",
    groupCategory: "Concerts",
    description: "Abel Tesfaye brings his cinematic, post-apocalyptic After Hours Til Dawn stadium tour to Tokyo. Featuring a giant glowing chrome moon, burning dystopian cityscapes, and record-setting hits Blinding Lights, Starboy, and Die For You.",
    startTime: "2026-11-22T19:00:00.000Z",
    endTime: "2026-11-22T22:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80",
    minPrice: 130,
    availableSeats: 390,
    totalSeats: 1500,
    isPopular: true,
    isHotDrop: true,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & XO Touring",
        "verified": true,
        "badge": "Official XO Stadium Tour",
        "description": "Official production partnership for The Weeknd's record-breaking stadium run."
  },
    venue: {
        "name": "Tokyo Dome",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "JR Chuo-Sobu Line to Suidobashi Station; Tokyo Metro Marunouchi Line to Korakuen.",
        "parkingInfo": "Tokyo Dome City multi-story underground car park.",
        "acousticProfile": "Pressurized dome acoustic envelope with high-power stadium subwoofer arrays."
  },
    artistBio: {
      name: "The Weeknd",
      headliner: "The Weeknd: After Hours Til Dawn Stadium World Tour",
      biography: "Abel Tesfaye brings his cinematic, post-apocalyptic After Hours Til Dawn stadium tour to Tokyo. Featuring a giant glowing chrome moon, burning dystopian cityscapes, and record-setting hits Blinding Lights, Starboy, and Die For You.",
      genre: "R&B & Stadium Pop",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(130)
  },

  {
    id: "cyber-symphony-2026",
    slug: "cyber-symphony-2026",
    title: "CYBER SYMPHONY: OMNIVERSE WORLD TOUR",
    subtitle: "Featuring the London Philharmonic & Neon Glitch Collective",
    category: "Electronic & Classical",
    groupCategory: "Concerts",
    description: "A groundbreaking 360-degree holographic orchestral performance blending modular synthwave frequencies with full symphonic orchestration.",
    startTime: "2026-10-24T20:00:00.000Z",
    endTime: "2026-10-24T23:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80",
    minPrice: 75,
    availableSeats: 372,
    totalSeats: 632,
    isPopular: true,
    isHotDrop: true,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "The Grand Cyber Arena",
        "slug": "grand-cyber-arena",
        "address": "700 Metropolis Gateway Blvd",
        "city": "Seattle",
        "country": "United States",
        "capacity": 18500,
        "transitDirections": "Direct monorail connection from City Center Station; Gate 4 drop-off point.",
        "parkingInfo": "Multi-level covered parking garage with 3,500 spaces; EV charging stations available.",
        "acousticProfile": "Meyer Sound Constellation spatial audio system with 360-degree active acoustic tuning."
  },
    artistBio: {
      name: "CYBER SYMPHONY",
      headliner: "CYBER SYMPHONY: OMNIVERSE WORLD TOUR",
      biography: "A groundbreaking 360-degree holographic orchestral performance blending modular synthwave frequencies with full symphonic orchestration.",
      genre: "Electronic & Classical",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(75)
  },

  {
    id: "taylor-swift-eras-tour-singapore",
    slug: "taylor-swift-eras-tour-singapore",
    title: "Taylor Swift: The Eras Tour Singapore",
    subtitle: "Exclusive Southeast Asian Stadium Residency",
    category: "Pop & Stadium Tour",
    groupCategory: "Concerts",
    description: "Southeast Asia’s exclusive stadium engagement of The Eras Tour featuring 55,000 wristband lights and surprise acoustic songs.",
    startTime: "2026-12-04T18:30:00.000Z",
    endTime: "2026-12-04T22:15:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1200&q=80",
    minPrice: 165,
    availableSeats: 85,
    totalSeats: 600,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504680177321-2e6a879aac86?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "National Stadium Singapore",
        "slug": "national-stadium-singapore",
        "address": "1 Stadium Drive",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 55000,
        "transitDirections": "Stadium MRT Station (Circle Line) connects directly to National Stadium Gate 1.",
        "parkingInfo": "Kallang Wave Mall and Singapore Sports Hub carparks available with ERP billing.",
        "acousticProfile": "Retractable domed roof with specialized bowl acoustic treatments for thunderous singalongs."
  },
    artistBio: {
      name: "Taylor Swift",
      headliner: "Taylor Swift: The Eras Tour Singapore",
      biography: "Southeast Asia’s exclusive stadium engagement of The Eras Tour featuring 55,000 wristband lights and surprise acoustic songs.",
      genre: "Pop & Stadium Tour",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(165)
  },

  {
    id: "blackpink-final-chapter-hanoi",
    slug: "blackpink-final-chapter-hanoi",
    title: "BLACKPINK: The Final Chapter World Tour Hanoi",
    subtitle: "Jisoo, Jennie, Rosé, and Lisa Live at My Dinh",
    category: "K-Pop",
    groupCategory: "K-Pop",
    description: "Jisoo, Jennie, Rosé, and Lisa return to My Dinh Stadium for the grand finale of their world stadium tour with explosive production.",
    startTime: "2026-10-24T19:00:00.000Z",
    endTime: "2026-10-24T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80",
    minPrice: 120,
    availableSeats: 48,
    totalSeats: 650,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "My Dinh National Stadium",
        "slug": "my-dinh-national-stadium",
        "address": "1 Le Duc Tho Street, Nam Tu Liem",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 40192,
        "transitDirections": "Direct stadium express buses and dedicated taxi drop-off zones along Le Duc Tho St.",
        "parkingInfo": "On-site parking spaces for 10,000 vehicles.",
        "acousticProfile": "Stadium-scale stereo arrays with dynamic low-frequency cardioid subwoofers."
  },
    artistBio: {
      name: "BLACKPINK",
      headliner: "BLACKPINK: The Final Chapter World Tour Hanoi",
      biography: "Jisoo, Jennie, Rosé, and Lisa return to My Dinh Stadium for the grand finale of their world stadium tour with explosive production.",
      genre: "K-Pop",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(120)
  },

  {
    id: "bts-omniverse-reunion-tokyo",
    slug: "bts-omniverse-reunion-tokyo",
    title: "BTS: Omniverse Reunion Stadium Tour Tokyo",
    subtitle: "All 7 Members Reunited on Stage",
    category: "K-Pop",
    groupCategory: "K-Pop",
    description: "The monumental return of all 7 members of BTS in their first worldwide stadium tour together in 4 years.",
    startTime: "2026-11-14T18:00:00.000Z",
    endTime: "2026-11-14T21:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
    minPrice: 160,
    availableSeats: 25,
    totalSeats: 800,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Tokyo Dome",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "JR Suidobashi Station or Korakuen Subway Station.",
        "parkingInfo": "Subterranean parking lots available.",
        "acousticProfile": "Precision arena beamforming acoustics tuned for 55,000 singing ARMYs."
  },
    artistBio: {
      name: "BTS",
      headliner: "BTS: Omniverse Reunion Stadium Tour Tokyo",
      biography: "The monumental return of all 7 members of BTS in their first worldwide stadium tour together in 4 years.",
      genre: "K-Pop",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(160)
  },

  {
    id: "aespa-synk-parallel-line-hanoi",
    slug: "aespa-synk-parallel-line-hanoi",
    title: "aespa: SYNK Parallel Line World Tour Hanoi",
    subtitle: "Karina, Giselle, Winter, and Ningning at My Dinh",
    category: "K-Pop",
    groupCategory: "K-Pop",
    description: "Karina, Giselle, Winter, and Ningning bring their futuristic metaverse concept and massive hits Supernova and Armageddon to My Dinh Stadium.",
    startTime: "2026-11-28T19:30:00.000Z",
    endTime: "2026-11-28T22:15:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
    minPrice: 110,
    availableSeats: 90,
    totalSeats: 600,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1547038577-da80abbc4f19?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519752594763-2633d8d4ea29?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "My Dinh National Stadium",
        "slug": "my-dinh-national-stadium",
        "address": "1 Le Duc Tho Street, Nam Tu Liem",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 40192,
        "transitDirections": "Dedicated shuttle from My Dinh Bus Station.",
        "parkingInfo": "Large capacity on-site motorcycle & car lots.",
        "acousticProfile": "Bass-heavy cardioid arrays tuned for high-tempo hyper-pop."
  },
    artistBio: {
      name: "aespa",
      headliner: "aespa: SYNK Parallel Line World Tour Hanoi",
      biography: "Karina, Giselle, Winter, and Ningning bring their futuristic metaverse concept and massive hits Supernova and Armageddon to My Dinh Stadium.",
      genre: "K-Pop",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(110)
  },

  {
    id: "seventeen-follow-again-singapore",
    slug: "seventeen-follow-again-singapore",
    title: "Seventeen: [RIGHT HERE] World Tour Singapore",
    subtitle: "13-Member Powerhouse Live at National Stadium",
    category: "K-Pop",
    groupCategory: "K-Pop",
    description: "The 13-member self-producing performance powerhouse delivers unmatched synchronization and unforgettable stadium energy in Singapore.",
    startTime: "2026-12-12T18:30:00.000Z",
    endTime: "2026-12-12T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
    minPrice: 135,
    availableSeats: 70,
    totalSeats: 650,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "National Stadium Singapore",
        "slug": "national-stadium-singapore",
        "address": "1 Stadium Drive",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 55000,
        "transitDirections": "Stadium MRT Station directly underneath.",
        "parkingInfo": "Multi-story basement carpark.",
        "acousticProfile": "High-density multi-zone delay towers."
  },
    artistBio: {
      name: "Seventeen",
      headliner: "Seventeen: [RIGHT HERE] World Tour Singapore",
      biography: "The 13-member self-producing performance powerhouse delivers unmatched synchronization and unforgettable stadium energy in Singapore.",
      genre: "K-Pop",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(135)
  },

  {
    id: "vietnam-vs-thailand-asean-finals",
    slug: "vietnam-vs-thailand-asean-finals",
    title: "Vietnam vs Thailand: ASEAN Championship Finals",
    subtitle: "Second Leg Championship Decider at My Dinh",
    category: "Football & Soccer",
    groupCategory: "Sports",
    description: "The Golden Star Warriors take on Thailand in the high-voltage second leg of the Southeast Asian Championship final.",
    startTime: "2026-12-16T19:30:00.000Z",
    endTime: "2026-12-16T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
    minPrice: 50,
    availableSeats: 80,
    totalSeats: 600,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "My Dinh National Stadium",
        "slug": "my-dinh-national-stadium",
        "address": "1 Le Duc Tho Street, Nam Tu Liem",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 40192,
        "transitDirections": "Direct buses from Cau Giay and central Hanoi.",
        "parkingInfo": "Large motorcycle lots and surrounding parking areas.",
        "acousticProfile": "Deafening 40,000-seat stadium acoustic resonance."
  },
    artistBio: {
      name: "Vietnam vs Thailand",
      headliner: "Vietnam vs Thailand: ASEAN Championship Finals",
      biography: "The Golden Star Warriors take on Thailand in the high-voltage second leg of the Southeast Asian Championship final.",
      genre: "Football & Soccer",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(50)
  },

  {
    id: "bwf-world-tour-finals-hanoi",
    slug: "bwf-world-tour-finals-hanoi",
    title: "BWF Badminton World Tour Finals Hanoi 2026",
    subtitle: "Season-Ending Crown for World #1 Shuttlers",
    category: "Badminton Championship",
    groupCategory: "Sports",
    description: "The world’s top 8 badminton titans compete in the season-ending marquee championship with rapid 400km/h smashes and court drama.",
    startTime: "2026-12-14T14:00:00.000Z",
    endTime: "2026-12-14T21:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
    minPrice: 45,
    availableSeats: 160,
    totalSeats: 500,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Vietnam National Convention Center",
        "slug": "national-convention-center-hanoi",
        "address": "Pham Hung Road, Me Tri, Nam Tu Liem",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 3800,
        "transitDirections": "Ring Road 3 access, directly opposite Keangnam Landmark.",
        "parkingInfo": "Large on-site convention center parking facility.",
        "acousticProfile": "Acoustically insulated indoor arena with zero court air-drafts."
  },
    artistBio: {
      name: "BWF Badminton World Tour Finals Hanoi 2026",
      headliner: "BWF Badminton World Tour Finals Hanoi 2026",
      biography: "The world’s top 8 badminton titans compete in the season-ending marquee championship with rapid 400km/h smashes and court drama.",
      genre: "Badminton Championship",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(45)
  },

  {
    id: "desert-rally-championship-qatar",
    slug: "desert-rally-championship-qatar",
    title: "Desert Rally World Championship: Dunes of Qatar",
    subtitle: "High-Speed Sand Dunes Rally & Desert Bivouac Paddock",
    category: "Desert Rally Championship",
    groupCategory: "Motorsport",
    description: "World-class rally raid drivers challenge towering desert dunes at 200 km/h with VIP bivouac hospitality and helicopter flyover vantage points.",
    startTime: "2026-11-12T08:00:00.000Z",
    endTime: "2026-11-15T18:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    minPrice: 140,
    availableSeats: 110,
    totalSeats: 600,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Lusail International Circuit & Desert Course",
        "slug": "lusail-international-circuit",
        "address": "Al Daayen, Lusail",
        "city": "Doha",
        "country": "Qatar",
        "capacity": 52000,
        "transitDirections": "Doha Metro Red Line to Lusail QNB, dedicated desert 4x4 shuttles.",
        "parkingInfo": "VIP desert bivouac parking with valet service.",
        "acousticProfile": "Open-desert twin-turbo V8 roar and sand exhaust acoustic echo."
  },
    artistBio: {
      name: "Desert Rally World Championship",
      headliner: "Desert Rally World Championship: Dunes of Qatar",
      biography: "World-class rally raid drivers challenge towering desert dunes at 200 km/h with VIP bivouac hospitality and helicopter flyover vantage points.",
      genre: "Desert Rally Championship",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(140)
  },

  {
    id: "historic-grand-prix-suzuka",
    slug: "historic-grand-prix-suzuka",
    title: "Historic Grand Prix Festival: Suzuka Heritage Masters",
    subtitle: "Classic V10 & V12 Formula 1 Icons on the Figure-8 Circuit",
    category: "Historic Festivals",
    groupCategory: "Motorsport",
    description: "Witness legendary Senna and Schumacher-era V10/V12 screamers attack the legendary 130R and ‘S’ Curves with unrestricted exhausts.",
    startTime: "2026-11-01T09:00:00.000Z",
    endTime: "2026-11-01T18:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
    minPrice: 95,
    availableSeats: 180,
    totalSeats: 850,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Suzuka International Racing Course",
        "slug": "suzuka-circuit",
        "address": "7992 Ino-cho, Suzuka-shi",
        "city": "Suzuka",
        "country": "Japan",
        "capacity": 155000,
        "transitDirections": "Kintetsu Nagoya Line to Shiroko Station, then circuit shuttle bus.",
        "parkingInfo": "Onsite circuit parking with reserved motorcycle spaces.",
        "acousticProfile": "20,000 RPM naturally-aspirated V10 symphony reverberating across the grandstand."
  },
    artistBio: {
      name: "Historic Grand Prix Festival",
      headliner: "Historic Grand Prix Festival: Suzuka Heritage Masters",
      biography: "Witness legendary Senna and Schumacher-era V10/V12 screamers attack the legendary 130R and ‘S’ Curves with unrestricted exhausts.",
      genre: "Historic Festivals",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(95)
  },

  {
    id: "lol-worlds-finals-2026-tokyo",
    slug: "lol-worlds-finals-2026-tokyo",
    title: "League of Legends Worlds Finals 2026 Tokyo",
    subtitle: "The Battle for the Summoner’s Cup",
    category: "Esports Championship",
    groupCategory: "Sports",
    description: "The pinnacle of competitive gaming. Top international teams battle for the Summoner’s Cup in front of 50,000 fans in Tokyo Dome.",
    startTime: "2026-11-07T16:00:00.000Z",
    endTime: "2026-11-07T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1517747614396-d21a78b850e8?auto=format&fit=crop&w=1200&q=80",
    minPrice: 90,
    availableSeats: 112,
    totalSeats: 700,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Tokyo Dome",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "JR Suidobashi Station.",
        "parkingInfo": "Tokyo Dome parking garages.",
        "acousticProfile": "State-of-the-art live gaming arena audio with player soundproof booths."
  },
    artistBio: {
      name: "League of Legends Worlds Finals 2026 Tokyo",
      headliner: "League of Legends Worlds Finals 2026 Tokyo",
      biography: "The pinnacle of competitive gaming. Top international teams battle for the Summoner’s Cup in front of 50,000 fans in Tokyo Dome.",
      genre: "Esports Championship",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(90)
  },

  {
    id: "bruno-mars-live-singapore",
    slug: "bruno-mars-live-singapore",
    title: "Bruno Mars: 24K Magic World Tour Singapore",
    subtitle: "Live at Singapore National Stadium",
    category: "Pop & Funk",
    groupCategory: "Concerts",
    description: "15-time Grammy winner Bruno Mars brings the ultimate funk showmanship and chart-topping swagger to the National Stadium.",
    startTime: "2026-10-04T20:00:00.000Z",
    endTime: "2026-10-04T22:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?auto=format&fit=crop&w=1200&q=80",
    minPrice: 135,
    availableSeats: 95,
    totalSeats: 600,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "National Stadium Singapore",
        "slug": "national-stadium-singapore",
        "address": "1 Stadium Drive",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 55000,
        "transitDirections": "Stadium MRT Station.",
        "parkingInfo": "Singapore Sports Hub carparks.",
        "acousticProfile": "Precision high-dynamic-range sound system."
  },
    artistBio: {
      name: "Bruno Mars",
      headliner: "Bruno Mars: 24K Magic World Tour Singapore",
      biography: "15-time Grammy winner Bruno Mars brings the ultimate funk showmanship and chart-topping swagger to the National Stadium.",
      genre: "Pop & Funk",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(135)
  },

  {
    id: "ed-sheeran-mathematics-tour-hanoi",
    slug: "ed-sheeran-mathematics-tour-hanoi",
    title: "Ed Sheeran: +–=÷× Mathematics Tour Hanoi",
    subtitle: "The 360-Degree Rotating Stage Experience",
    category: "Pop & Acoustic",
    groupCategory: "Concerts",
    description: "Ed Sheeran brings his custom 360-degree rotating stadium stage and iconic loop pedal hits to 40,000 fans at My Dinh.",
    startTime: "2026-11-25T19:30:00.000Z",
    endTime: "2026-11-25T22:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=1200&q=80",
    minPrice: 80,
    availableSeats: 150,
    totalSeats: 650,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504680177321-2e6a879aac86?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "My Dinh National Stadium",
        "slug": "my-dinh-national-stadium",
        "address": "1 Le Duc Tho Street, Nam Tu Liem",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 40192,
        "transitDirections": "Express shuttle from Hanoi Old Quarter.",
        "parkingInfo": "On-site parking lots.",
        "acousticProfile": "Circular halo line-array delivering identical clarity to all 360 degrees."
  },
    artistBio: {
      name: "Ed Sheeran",
      headliner: "Ed Sheeran: +–=÷× Mathematics Tour Hanoi",
      biography: "Ed Sheeran brings his custom 360-degree rotating stadium stage and iconic loop pedal hits to 40,000 fans at My Dinh.",
      genre: "Pop & Acoustic",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(80)
  },

  {
    id: "imagine-dragons-loom-singapore",
    slug: "imagine-dragons-loom-singapore",
    title: "Imagine Dragons: LOOM World Tour Singapore",
    subtitle: "Official Live Tour Experience in Singapore",
    category: "Alternative Rock",
    groupCategory: "Concerts",
    description: "Dynamic pop-rock anthems Believer, Radioactive, and Demons live with state-of-the-art stadium laser production.",
    startTime: "2026-11-20T20:00:00.000Z",
    endTime: "2026-11-20T23:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80",
    minPrice: 95,
    availableSeats: 120,
    totalSeats: 370,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1661161184834-7f909ad957aa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1724003450313-28482c792552?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Singapore Indoor Stadium",
        "slug": "singapore-indoor-stadium",
        "address": "2 Stadium Walk",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 12000,
        "transitDirections": "Direct covered walkway from Stadium MRT Station (CC6) on Circle Line.",
        "parkingInfo": "Singapore Sports Hub Car Parks K and L with 1,800 bays.",
        "acousticProfile": "Precision-tuned indoor arena acoustics optimized for concerts and esports."
  },
    artistBio: {
      name: "Imagine Dragons",
      headliner: "Imagine Dragons: LOOM World Tour Singapore",
      biography: "Dynamic pop-rock anthems Believer, Radioactive, and Demons live with state-of-the-art stadium laser production.",
      genre: "Alternative Rock",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(95)
  },

  {
    id: "buc-tuong-friends-rock-hcmc",
    slug: "buc-tuong-friends-rock-hcmc",
    title: "Buc Tuong & Friends: Vietnamese Rock Legends",
    subtitle: "Official Live Tour Experience in HCMC",
    category: "Vietnamese Rock",
    groupCategory: "Concerts",
    description: "An unforgettable open-air rock gala celebrating 30 years of Vietnamese rock heritage with special guest rock bands.",
    startTime: "2026-12-12T19:00:00.000Z",
    endTime: "2026-12-12T23:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80",
    minPrice: 45,
    availableSeats: 139,
    totalSeats: 389,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Thong Nhat Stadium",
        "slug": "thong-nhat-stadium-hcmc",
        "address": "138 Dao Duy Tu, Ward 6, District 10",
        "city": "HCMC",
        "country": "Vietnam",
        "capacity": 16000,
        "transitDirections": "Bus routes 07, 150; 15-minute drive from District 1 center.",
        "parkingInfo": "Dedicated attendee motorcycle and vehicle zones around stadium perimeter.",
        "acousticProfile": "Classic bowl-style stadium audio distribution."
  },
    artistBio: {
      name: "Buc Tuong & Friends",
      headliner: "Buc Tuong & Friends: Vietnamese Rock Legends",
      biography: "An unforgettable open-air rock gala celebrating 30 years of Vietnamese rock heritage with special guest rock bands.",
      genre: "Vietnamese Rock",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(45)
  },

  {
    id: "martin-garrix-live-my-dinh",
    slug: "martin-garrix-live-my-dinh",
    title: "Martin Garrix: Live at My Dinh Arena",
    subtitle: "Official Live Tour Experience in Hanoi",
    category: "EDM & Festival",
    groupCategory: "Concerts",
    description: "The world #1 DJ brings an explosive 3-hour stadium set with 200+ synchronized pyrotechnic and laser systems.",
    startTime: "2026-10-31T20:00:00.000Z",
    endTime: "2026-11-01T01:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=1200&q=80",
    minPrice: 70,
    availableSeats: 158,
    totalSeats: 408,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "My Dinh National Stadium",
        "slug": "my-dinh-national-stadium",
        "address": "1 Le Duc Tho Street, Nam Tu Liem",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 40192,
        "transitDirections": "Direct bus routes 26, 46 to stadium gates; Taxi drop-off at Gate A.",
        "parkingInfo": "Large open-air surface parking for 5,000 motorbikes and 1,200 cars.",
        "acousticProfile": "Open-air stadium line-array acoustic suspension system."
  },
    artistBio: {
      name: "Martin Garrix",
      headliner: "Martin Garrix: Live at My Dinh Arena",
      biography: "The world #1 DJ brings an explosive 3-hour stadium set with 200+ synchronized pyrotechnic and laser systems.",
      genre: "EDM & Festival",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(70)
  },

  {
    id: "ultra-music-festival-tokyo-2026",
    slug: "ultra-music-festival-tokyo-2026",
    title: "Ultra Music Festival Tokyo 2026",
    subtitle: "Official Live Tour Experience in Tokyo",
    category: "EDM & Dance",
    groupCategory: "Concerts",
    description: "Three stages of non-stop electronic dance music featuring top international headliners and underground techno pavilions.",
    startTime: "2026-09-19T14:00:00.000Z",
    endTime: "2026-09-20T23:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&w=1200&q=80",
    minPrice: 130,
    availableSeats: 177,
    totalSeats: 427,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560012057-4372e14c5085?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Tokyo Dome",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "JR Chuo-Sobu Line to Suidobashi Station; Tokyo Metro Marunouchi Line to Korakuen.",
        "parkingInfo": "Tokyo Dome City multi-story underground car park.",
        "acousticProfile": "Pressurized dome acoustic envelope with 360-degree digital delay towers."
  },
    artistBio: {
      name: "Ultra Music Festival Tokyo 2026",
      headliner: "Ultra Music Festival Tokyo 2026",
      biography: "Three stages of non-stop electronic dance music featuring top international headliners and underground techno pavilions.",
      genre: "EDM & Dance",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(130)
  },

  {
    id: "sub-zero-project-rave-secc",
    slug: "sub-zero-project-rave-secc",
    title: "Sub Zero Project: Rave Universe SECC",
    subtitle: "Official Live Tour Experience in HCMC",
    category: "Hardstyle & EDM",
    groupCategory: "Concerts",
    description: "The Dutch hardstyle pioneers deliver an apocalyptic indoor audio-visual showcase in Ho Chi Minh City.",
    startTime: "2026-11-28T21:00:00.000Z",
    endTime: "2026-11-29T03:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?auto=format&fit=crop&w=1200&q=80",
    minPrice: 60,
    availableSeats: 196,
    totalSeats: 446,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Saigon Exhibition & Convention Center (SECC)",
        "slug": "secc-ho-chi-minh",
        "address": "799 Nguyen Van Linh, Tan Phu, District 7",
        "city": "HCMC",
        "country": "Vietnam",
        "capacity": 15000,
        "transitDirections": "Phu My Hung urban express route; dedicated event taxi line.",
        "parkingInfo": "Spacious outdoor and indoor convention parking for 3,000 vehicles.",
        "acousticProfile": "High-ceiling acoustic baffles and dynamic concert trussing."
  },
    artistBio: {
      name: "Sub Zero Project",
      headliner: "Sub Zero Project: Rave Universe SECC",
      biography: "The Dutch hardstyle pioneers deliver an apocalyptic indoor audio-visual showcase in Ho Chi Minh City.",
      genre: "Hardstyle & EDM",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(60)
  },

  {
    id: "creamfields-singapore-2026",
    slug: "creamfields-singapore-2026",
    title: "Creamfields Singapore 2026 Stadium Edition",
    subtitle: "Official Live Tour Experience in Singapore",
    category: "EDM & Festival",
    groupCategory: "Concerts",
    description: "UK mega-festival Creamfields lands in Singapore with custom steel stages, kinetic lighting, and 50,000 ravers.",
    startTime: "2026-12-19T16:00:00.000Z",
    endTime: "2026-12-20T02:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=1200&q=80",
    minPrice: 125,
    availableSeats: 215,
    totalSeats: 465,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "National Stadium Singapore",
        "slug": "national-stadium-singapore",
        "address": "1 Stadium Drive",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 55000,
        "transitDirections": "Stadium MRT Station (CC6) directly linked via National Stadium concourse.",
        "parkingInfo": "Multi-story Sports Hub parking with real-time slot telemetry.",
        "acousticProfile": "Retractable domed roof acoustic configuration with concert-grade delays."
  },
    artistBio: {
      name: "Creamfields Singapore 2026 Stadium Edition",
      headliner: "Creamfields Singapore 2026 Stadium Edition",
      biography: "UK mega-festival Creamfields lands in Singapore with custom steel stages, kinetic lighting, and 50,000 ravers.",
      genre: "EDM & Festival",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(125)
  },

  {
    id: "newjeans-supernatural-singapore",
    slug: "newjeans-supernatural-singapore",
    title: "NewJeans: Supernatural Live in Singapore",
    subtitle: "Official Live Tour Experience in Singapore",
    category: "K-Pop",
    groupCategory: "K-Pop",
    description: "The breakout pop icons perform Ditto, Hype Boy, OMG, and Supernatural in an electrifying neon-themed production.",
    startTime: "2026-12-05T19:30:00.000Z",
    endTime: "2026-12-05T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80",
    minPrice: 105,
    availableSeats: 234,
    totalSeats: 484,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1519752594763-2633d8d4ea29?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Singapore Indoor Stadium",
        "slug": "singapore-indoor-stadium",
        "address": "2 Stadium Walk",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 12000,
        "transitDirections": "Direct covered walkway from Stadium MRT Station (CC6) on Circle Line.",
        "parkingInfo": "Singapore Sports Hub Car Parks K and L with 1,800 bays.",
        "acousticProfile": "Precision-tuned indoor arena acoustics optimized for concerts and esports."
  },
    artistBio: {
      name: "NewJeans",
      headliner: "NewJeans: Supernatural Live in Singapore",
      biography: "The breakout pop icons perform Ditto, Hype Boy, OMG, and Supernatural in an electrifying neon-themed production.",
      genre: "K-Pop",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(105)
  },

  {
    id: "twice-ready-to-be-hcmc",
    slug: "twice-ready-to-be-hcmc",
    title: "TWICE: Ready To Be Encore HCMC",
    subtitle: "Official Live Tour Experience in HCMC",
    category: "K-Pop",
    groupCategory: "K-Pop",
    description: "All 9 members of TWICE bring their record-breaking Ready To Be world tour to Ho Chi Minh City fans.",
    startTime: "2026-12-26T19:00:00.000Z",
    endTime: "2026-12-26T22:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=1200&q=80",
    minPrice: 95,
    availableSeats: 253,
    totalSeats: 503,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Thong Nhat Stadium",
        "slug": "thong-nhat-stadium-hcmc",
        "address": "138 Dao Duy Tu, Ward 6, District 10",
        "city": "HCMC",
        "country": "Vietnam",
        "capacity": 16000,
        "transitDirections": "Bus routes 07, 150; 15-minute drive from District 1 center.",
        "parkingInfo": "Dedicated attendee motorcycle and vehicle zones around stadium perimeter.",
        "acousticProfile": "Classic bowl-style stadium audio distribution."
  },
    artistBio: {
      name: "TWICE",
      headliner: "TWICE: Ready To Be Encore HCMC",
      biography: "All 9 members of TWICE bring their record-breaking Ready To Be world tour to Ho Chi Minh City fans.",
      genre: "K-Pop",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(95)
  },

  {
    id: "hans-zimmer-live-singapore",
    slug: "hans-zimmer-live-singapore",
    title: "Hans Zimmer Live: Soundtracks in Concert Singapore",
    subtitle: "Official Live Tour Experience in Singapore",
    category: "Film Score & Orchestra",
    groupCategory: "Concerts",
    description: "The legendary composer live with full orchestra and choir performing Interstellar, Inception, Dune, and Gladiator.",
    startTime: "2026-11-18T20:00:00.000Z",
    endTime: "2026-11-18T23:15:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1504680177321-2e6a879aac86?auto=format&fit=crop&w=1200&q=80",
    minPrice: 90,
    availableSeats: 272,
    totalSeats: 522,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Singapore Indoor Stadium",
        "slug": "singapore-indoor-stadium",
        "address": "2 Stadium Walk",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 12000,
        "transitDirections": "Direct covered walkway from Stadium MRT Station (CC6) on Circle Line.",
        "parkingInfo": "Singapore Sports Hub Car Parks K and L with 1,800 bays.",
        "acousticProfile": "Precision-tuned indoor arena acoustics optimized for concerts and esports."
  },
    artistBio: {
      name: "Hans Zimmer Live",
      headliner: "Hans Zimmer Live: Soundtracks in Concert Singapore",
      biography: "The legendary composer live with full orchestra and choir performing Interstellar, Inception, Dune, and Gladiator.",
      genre: "Film Score & Orchestra",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(90)
  },

  {
    id: "joe-hisaishi-ghibli-gala-tokyo",
    slug: "joe-hisaishi-ghibli-gala-tokyo",
    title: "Joe Hisaishi: Studio Ghibli Symphonic Gala Tokyo",
    subtitle: "Official Live Tour Experience in Tokyo",
    category: "Film Score & Orchestra",
    groupCategory: "Concerts",
    description: "Experience the magical scores of Spirited Away, My Neighbor Totoro, and Princess Mononoke conducted by Maestro Hisaishi.",
    startTime: "2026-10-09T18:30:00.000Z",
    endTime: "2026-10-09T21:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80",
    minPrice: 115,
    availableSeats: 291,
    totalSeats: 541,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Nippon Budokan",
        "slug": "nippon-budokan-tokyo",
        "address": "2-3 Kitanomarukoen, Chiyoda City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 14471,
        "transitDirections": "Tokyo Metro Tozai, Hanzomon, and Toei Shinjuku Lines to Kudanshita Station.",
        "parkingInfo": "Kitanomaru Park public parking facilities nearby.",
        "acousticProfile": "Iconic octagonal hall acoustics revered worldwide for live rock recordings."
  },
    artistBio: {
      name: "Joe Hisaishi",
      headliner: "Joe Hisaishi: Studio Ghibli Symphonic Gala Tokyo",
      biography: "Experience the magical scores of Spirited Away, My Neighbor Totoro, and Princess Mononoke conducted by Maestro Hisaishi.",
      genre: "Film Score & Orchestra",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(115)
  },

  {
    id: "vnso-autumn-melodies-hanoi",
    slug: "vnso-autumn-melodies-hanoi",
    title: "Vietnam National Symphony Orchestra: Autumn Melodies",
    subtitle: "Official Live Tour Experience in Hanoi",
    category: "Classical Masterworks",
    groupCategory: "Concerts",
    description: "Masterworks by Beethoven, Tchaikovsky, and contemporary Vietnamese symphonic composers conducted by Honna Tetsuji.",
    startTime: "2026-11-07T19:30:00.000Z",
    endTime: "2026-11-07T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1661161184834-7f909ad957aa?auto=format&fit=crop&w=1200&q=80",
    minPrice: 40,
    availableSeats: 310,
    totalSeats: 560,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1504680177321-2e6a879aac86?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1724003450313-28482c792552?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Vietnam National Convention Center",
        "slug": "national-convention-center-hanoi",
        "address": "Pham Hung Road, Me Tri, Nam Tu Liem",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 3800,
        "transitDirections": "Accessible via Ring Road 3 and Thang Long Boulevard.",
        "parkingInfo": "Multi-level secure parking garage with 2,000 vehicle spaces.",
        "acousticProfile": "State-of-the-art reverberation acoustic panelling."
  },
    artistBio: {
      name: "Vietnam National Symphony Orchestra",
      headliner: "Vietnam National Symphony Orchestra: Autumn Melodies",
      biography: "Masterworks by Beethoven, Tchaikovsky, and contemporary Vietnamese symphonic composers conducted by Honna Tetsuji.",
      genre: "Classical Masterworks",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(40)
  },

  {
    id: "vct-grand-finals-2026-singapore",
    slug: "vct-grand-finals-2026-singapore",
    title: "Valorant Champions Tour Grand Finals Singapore",
    subtitle: "Official Live Tour Experience in Singapore",
    category: "Esports Arena",
    groupCategory: "Sports",
    description: "Global champions clash in tactical shooter supremacy with synchronized holographic stage abilities and player booths.",
    startTime: "2026-10-18T15:00:00.000Z",
    endTime: "2026-10-18T21:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80",
    minPrice: 65,
    availableSeats: 329,
    totalSeats: 579,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Singapore Indoor Stadium",
        "slug": "singapore-indoor-stadium",
        "address": "2 Stadium Walk",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 12000,
        "transitDirections": "Direct covered walkway from Stadium MRT Station (CC6) on Circle Line.",
        "parkingInfo": "Singapore Sports Hub Car Parks K and L with 1,800 bays.",
        "acousticProfile": "Precision-tuned indoor arena acoustics optimized for concerts and esports."
  },
    artistBio: {
      name: "Valorant Champions Tour Grand Finals Singapore",
      headliner: "Valorant Champions Tour Grand Finals Singapore",
      biography: "Global champions clash in tactical shooter supremacy with synchronized holographic stage abilities and player booths.",
      genre: "Esports Arena",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(65)
  },

  {
    id: "vcs-spring-finals-hanoi-2026",
    slug: "vcs-spring-finals-hanoi-2026",
    title: "VCS Spring Grand Finals Hanoi 2026",
    subtitle: "Official Live Tour Experience in Hanoi",
    category: "Esports Vietnam",
    groupCategory: "Sports",
    description: "GAM Esports vs Vikings Esports in the highest-stakes League of Legends championship battle in Vietnam.",
    startTime: "2026-09-27T17:00:00.000Z",
    endTime: "2026-09-27T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80",
    minPrice: 35,
    availableSeats: 348,
    totalSeats: 598,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Vietnam National Convention Center",
        "slug": "national-convention-center-hanoi",
        "address": "Pham Hung Road, Me Tri, Nam Tu Liem",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 3800,
        "transitDirections": "Accessible via Ring Road 3 and Thang Long Boulevard.",
        "parkingInfo": "Multi-level secure parking garage with 2,000 vehicle spaces.",
        "acousticProfile": "State-of-the-art reverberation acoustic panelling."
  },
    artistBio: {
      name: "VCS Spring Grand Finals Hanoi 2026",
      headliner: "VCS Spring Grand Finals Hanoi 2026",
      biography: "GAM Esports vs Vikings Esports in the highest-stakes League of Legends championship battle in Vietnam.",
      genre: "Esports Vietnam",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(35)
  },

  {
    id: "dota2-sea-invitational-hcmc",
    slug: "dota2-sea-invitational-hcmc",
    title: "Dota 2: Southeast Asia Arena Invitational HCMC",
    subtitle: "Official Live Tour Experience in HCMC",
    category: "Esports Tournament",
    groupCategory: "Sports",
    description: "Top SEA Dota 2 franchises compete for the $500,000 regional trophy with live caster stages and cosplayer village.",
    startTime: "2026-10-10T14:00:00.000Z",
    endTime: "2026-10-11T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
    minPrice: 40,
    availableSeats: 367,
    totalSeats: 617,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517747614396-d21a78b850e8?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Saigon Exhibition & Convention Center (SECC)",
        "slug": "secc-ho-chi-minh",
        "address": "799 Nguyen Van Linh, Tan Phu, District 7",
        "city": "HCMC",
        "country": "Vietnam",
        "capacity": 15000,
        "transitDirections": "Phu My Hung urban express route; dedicated event taxi line.",
        "parkingInfo": "Spacious outdoor and indoor convention parking for 3,000 vehicles.",
        "acousticProfile": "High-ceiling acoustic baffles and dynamic concert trussing."
  },
    artistBio: {
      name: "Dota 2",
      headliner: "Dota 2: Southeast Asia Arena Invitational HCMC",
      biography: "Top SEA Dota 2 franchises compete for the $500,000 regional trophy with live caster stages and cosplayer village.",
      genre: "Esports Tournament",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(40)
  },

  {
    id: "mancity-vs-arsenal-tokyo-2026",
    slug: "mancity-vs-arsenal-tokyo-2026",
    title: "Manchester City vs Arsenal: Asia Champions Cup Tokyo",
    subtitle: "Official Live Tour Experience in Tokyo",
    category: "Premier League Soccer",
    groupCategory: "Sports",
    description: "Pep Guardiola’s Manchester City faces Mikel Arteta’s Arsenal in a star-studded summer clash in the heart of Tokyo.",
    startTime: "2026-07-28T19:00:00.000Z",
    endTime: "2026-07-28T21:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
    minPrice: 120,
    availableSeats: 386,
    totalSeats: 636,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Tokyo Dome",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "JR Chuo-Sobu Line to Suidobashi Station; Tokyo Metro Marunouchi Line to Korakuen.",
        "parkingInfo": "Tokyo Dome City multi-story underground car park.",
        "acousticProfile": "Pressurized dome acoustic envelope with 360-degree digital delay towers."
  },
    artistBio: {
      name: "Manchester City vs Arsenal",
      headliner: "Manchester City vs Arsenal: Asia Champions Cup Tokyo",
      biography: "Pep Guardiola’s Manchester City faces Mikel Arteta’s Arsenal in a star-studded summer clash in the heart of Tokyo.",
      genre: "Premier League Soccer",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(120)
  },

  {
    id: "japan-vs-australia-wcq-tokyo",
    slug: "japan-vs-australia-wcq-tokyo",
    title: "Japan vs Australia: World Cup Qualifiers 2026",
    subtitle: "Official Live Tour Experience in Tokyo",
    category: "International Football",
    groupCategory: "Sports",
    description: "Samurai Blue lock horns with the Socceroos in the decisive round of Asian World Cup Qualification.",
    startTime: "2026-10-13T19:35:00.000Z",
    endTime: "2026-10-13T21:45:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80",
    minPrice: 75,
    availableSeats: 125,
    totalSeats: 375,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Tokyo Dome",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "JR Chuo-Sobu Line to Suidobashi Station; Tokyo Metro Marunouchi Line to Korakuen.",
        "parkingInfo": "Tokyo Dome City multi-story underground car park.",
        "acousticProfile": "Pressurized dome acoustic envelope with 360-degree digital delay towers."
  },
    artistBio: {
      name: "Japan vs Australia",
      headliner: "Japan vs Australia: World Cup Qualifiers 2026",
      biography: "Samurai Blue lock horns with the Socceroos in the decisive round of Asian World Cup Qualification.",
      genre: "International Football",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(75)
  },

  {
    id: "singapore-vs-tottenham-2026",
    slug: "singapore-vs-tottenham-2026",
    title: "Singapore Lions vs Tottenham Hotspur Exhibition",
    subtitle: "Official Live Tour Experience in Singapore",
    category: "International Football",
    groupCategory: "Sports",
    description: "The Singapore national team tests their mettle against Son Heung-min and Tottenham Hotspur at the National Stadium.",
    startTime: "2026-08-01T20:00:00.000Z",
    endTime: "2026-08-01T22:15:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    minPrice: 80,
    availableSeats: 144,
    totalSeats: 394,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "National Stadium Singapore",
        "slug": "national-stadium-singapore",
        "address": "1 Stadium Drive",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 55000,
        "transitDirections": "Stadium MRT Station (CC6) directly linked via National Stadium concourse.",
        "parkingInfo": "Multi-story Sports Hub parking with real-time slot telemetry.",
        "acousticProfile": "Retractable domed roof acoustic configuration with concert-grade delays."
  },
    artistBio: {
      name: "Singapore Lions vs Tottenham Hotspur Exhibition",
      headliner: "Singapore Lions vs Tottenham Hotspur Exhibition",
      biography: "The Singapore national team tests their mettle against Son Heung-min and Tottenham Hotspur at the National Stadium.",
      genre: "International Football",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(80)
  },

  {
    id: "hanoi-fc-vs-hcmc-super-derby",
    slug: "hanoi-fc-vs-hcmc-super-derby",
    title: "Hanoi FC vs Ho Chi Minh City FC: V-League Super Derby",
    subtitle: "Official Live Tour Experience in Hanoi",
    category: "V-League Football",
    groupCategory: "Sports",
    description: "The biggest rivalry in Vietnamese club football. Top national team stars clash in a high-intensity showdown.",
    startTime: "2026-11-21T19:15:00.000Z",
    endTime: "2026-11-21T21:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80",
    minPrice: 30,
    availableSeats: 163,
    totalSeats: 413,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "My Dinh National Stadium",
        "slug": "my-dinh-national-stadium",
        "address": "1 Le Duc Tho Street, Nam Tu Liem",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 40192,
        "transitDirections": "Direct bus routes 26, 46 to stadium gates; Taxi drop-off at Gate A.",
        "parkingInfo": "Large open-air surface parking for 5,000 motorbikes and 1,200 cars.",
        "acousticProfile": "Open-air stadium line-array acoustic suspension system."
  },
    artistBio: {
      name: "Hanoi FC vs Ho Chi Minh City FC",
      headliner: "Hanoi FC vs Ho Chi Minh City FC: V-League Super Derby",
      biography: "The biggest rivalry in Vietnamese club football. Top national team stars clash in a high-intensity showdown.",
      genre: "V-League Football",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(30)
  },

  {
    id: "evt-apex-championship-2026",
    slug: "evt-apex-championship-2026",
    title: "Apex Arena: World Championship Finals",
    subtitle: "Official Live Tour Experience in Tokyo",
    category: "Esports Arena",
    groupCategory: "Sports",
    description: "Global finalists face off live in a high-octane stadium showdown with real-time HUD projections and full sensory effects.",
    startTime: "2026-11-12T18:30:00.000Z",
    endTime: "2026-11-12T22:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80",
    minPrice: 90,
    availableSeats: 182,
    totalSeats: 432,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Nippon Budokan",
        "slug": "nippon-budokan-tokyo",
        "address": "2-3 Kitanomarukoen, Chiyoda City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 14471,
        "transitDirections": "Tokyo Metro Tozai, Hanzomon, and Toei Shinjuku Lines to Kudanshita Station.",
        "parkingInfo": "Kitanomaru Park public parking facilities nearby.",
        "acousticProfile": "Iconic octagonal hall acoustics revered worldwide for live rock recordings."
  },
    artistBio: {
      name: "Apex Arena",
      headliner: "Apex Arena: World Championship Finals",
      biography: "Global finalists face off live in a high-octane stadium showdown with real-time HUD projections and full sensory effects.",
      genre: "Esports Arena",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(90)
  },

  {
    id: "coldplay-music-of-the-spheres-singapore",
    slug: "coldplay-music-of-the-spheres-singapore",
    title: "Coldplay: Music of the Spheres Singapore Encore",
    subtitle: "Official Live Tour Experience in Singapore",
    category: "Rock & Pop",
    groupCategory: "Concerts",
    description: "Due to overwhelming demand, Coldplay returns for a historic 6th night at Singapore National Stadium with kinetic dancefloors.",
    startTime: "2026-11-15T19:30:00.000Z",
    endTime: "2026-11-15T22:45:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1724003450313-28482c792552?auto=format&fit=crop&w=1200&q=80",
    minPrice: 95,
    availableSeats: 201,
    totalSeats: 451,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "National Stadium Singapore",
        "slug": "national-stadium-singapore",
        "address": "1 Stadium Drive",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 55000,
        "transitDirections": "Stadium MRT Station (CC6) directly linked via National Stadium concourse.",
        "parkingInfo": "Multi-story Sports Hub parking with real-time slot telemetry.",
        "acousticProfile": "Retractable domed roof acoustic configuration with concert-grade delays."
  },
    artistBio: {
      name: "Coldplay",
      headliner: "Coldplay: Music of the Spheres Singapore Encore",
      biography: "Due to overwhelming demand, Coldplay returns for a historic 6th night at Singapore National Stadium with kinetic dancefloors.",
      genre: "Rock & Pop",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(95)
  },

  {
    id: "imagine-dragons-loom-tokyo",
    slug: "imagine-dragons-loom-tokyo",
    title: "Imagine Dragons: LOOM World Tour Tokyo",
    subtitle: "Official Live Tour Experience in Tokyo",
    category: "Alternative Rock",
    groupCategory: "Concerts",
    description: "Dan Reynolds and Imagine Dragons deliver an earth-shaking stadium rock performance with synchronized laser storms in Tokyo.",
    startTime: "2026-10-28T19:00:00.000Z",
    endTime: "2026-10-28T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
    minPrice: 105,
    availableSeats: 220,
    totalSeats: 470,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1504680177321-2e6a879aac86?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1661161184834-7f909ad957aa?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Tokyo Dome",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "JR Chuo-Sobu Line to Suidobashi Station; Tokyo Metro Marunouchi Line to Korakuen.",
        "parkingInfo": "Tokyo Dome City multi-story underground car park.",
        "acousticProfile": "Pressurized dome acoustic envelope with 360-degree digital delay towers."
  },
    artistBio: {
      name: "Imagine Dragons",
      headliner: "Imagine Dragons: LOOM World Tour Tokyo",
      biography: "Dan Reynolds and Imagine Dragons deliver an earth-shaking stadium rock performance with synchronized laser storms in Tokyo.",
      genre: "Alternative Rock",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(105)
  },

  {
    id: "maroon5-world-tour-hcmc",
    slug: "maroon5-world-tour-hcmc",
    title: "Maroon 5: World Tour Live in HCMC",
    subtitle: "Official Live Tour Experience in HCMC",
    category: "Pop & Rock",
    groupCategory: "Concerts",
    description: "Adam Levine and Maroon 5 ignite Thong Nhat Stadium with their infectious pop-funk classics Sugar, Moves Like Jagger, and She Will Be Loved.",
    startTime: "2026-12-08T20:00:00.000Z",
    endTime: "2026-12-08T22:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1200&q=80",
    minPrice: 70,
    availableSeats: 239,
    totalSeats: 489,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1661161184834-7f909ad957aa?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1724003450313-28482c792552?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Thong Nhat Stadium",
        "slug": "thong-nhat-stadium-hcmc",
        "address": "138 Dao Duy Tu, Ward 6, District 10",
        "city": "HCMC",
        "country": "Vietnam",
        "capacity": 16000,
        "transitDirections": "Bus routes 07, 150; 15-minute drive from District 1 center.",
        "parkingInfo": "Dedicated attendee motorcycle and vehicle zones around stadium perimeter.",
        "acousticProfile": "Classic bowl-style stadium audio distribution."
  },
    artistBio: {
      name: "Maroon 5",
      headliner: "Maroon 5: World Tour Live in HCMC",
      biography: "Adam Levine and Maroon 5 ignite Thong Nhat Stadium with their infectious pop-funk classics Sugar, Moves Like Jagger, and She Will Be Loved.",
      genre: "Pop & Rock",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(70)
  },

  {
    id: "post-malone-world-tour-tokyo",
    slug: "post-malone-world-tour-tokyo",
    title: "Post Malone: If Y’all Weren’t Here Tour Tokyo",
    subtitle: "Official Live Tour Experience in Tokyo",
    category: "Hip-Hop & Rock",
    groupCategory: "Concerts",
    description: "Post Malone electrifies Tokyo with his genre-bending stadium live band, pyrotechnic walls, and rock-infused anthems Circles and Sunflower.",
    startTime: "2026-11-30T19:00:00.000Z",
    endTime: "2026-11-30T21:45:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
    minPrice: 110,
    availableSeats: 258,
    totalSeats: 508,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1724003450313-28482c792552?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Tokyo Dome",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "JR Chuo-Sobu Line to Suidobashi Station; Tokyo Metro Marunouchi Line to Korakuen.",
        "parkingInfo": "Tokyo Dome City multi-story underground car park.",
        "acousticProfile": "Pressurized dome acoustic envelope with 360-degree digital delay towers."
  },
    artistBio: {
      name: "Post Malone",
      headliner: "Post Malone: If Y’all Weren’t Here Tour Tokyo",
      biography: "Post Malone electrifies Tokyo with his genre-bending stadium live band, pyrotechnic walls, and rock-infused anthems Circles and Sunflower.",
      genre: "Hip-Hop & Rock",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(110)
  },

  {
    id: "billie-eilish-hard-soft-hanoi",
    slug: "billie-eilish-hard-soft-hanoi",
    title: "Billie Eilish: Hit Me Hard and Soft Tour Hanoi",
    subtitle: "Official Live Tour Experience in Hanoi",
    category: "Alternative Pop",
    groupCategory: "Concerts",
    description: "Billie Eilish presents a 360-degree immersive acoustic performance with spatial sound systems and zero-waste sustainable tour production.",
    startTime: "2026-12-22T20:00:00.000Z",
    endTime: "2026-12-22T22:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80",
    minPrice: 90,
    availableSeats: 277,
    totalSeats: 527,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "My Dinh National Stadium",
        "slug": "my-dinh-national-stadium",
        "address": "1 Le Duc Tho Street, Nam Tu Liem",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 40192,
        "transitDirections": "Direct bus routes 26, 46 to stadium gates; Taxi drop-off at Gate A.",
        "parkingInfo": "Large open-air surface parking for 5,000 motorbikes and 1,200 cars.",
        "acousticProfile": "Open-air stadium line-array acoustic suspension system."
  },
    artistBio: {
      name: "Billie Eilish",
      headliner: "Billie Eilish: Hit Me Hard and Soft Tour Hanoi",
      biography: "Billie Eilish presents a 360-degree immersive acoustic performance with spatial sound systems and zero-waste sustainable tour production.",
      genre: "Alternative Pop",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(90)
  },

  {
    id: "foo-fighters-budokan-tokyo",
    slug: "foo-fighters-budokan-tokyo",
    title: "Foo Fighters: Live at Nippon Budokan",
    subtitle: "Official Live Tour Experience in Tokyo",
    category: "Hard Rock",
    groupCategory: "Concerts",
    description: "Dave Grohl and the Foo Fighters return to the sacred grounds of Nippon Budokan for an explosive 3-hour stadium rock marathon.",
    startTime: "2026-10-20T18:30:00.000Z",
    endTime: "2026-10-20T21:45:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
    minPrice: 125,
    availableSeats: 296,
    totalSeats: 546,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Nippon Budokan",
        "slug": "nippon-budokan-tokyo",
        "address": "2-3 Kitanomarukoen, Chiyoda City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 14471,
        "transitDirections": "Tokyo Metro Tozai, Hanzomon, and Toei Shinjuku Lines to Kudanshita Station.",
        "parkingInfo": "Kitanomaru Park public parking facilities nearby.",
        "acousticProfile": "Iconic octagonal hall acoustics revered worldwide for live rock recordings."
  },
    artistBio: {
      name: "Foo Fighters",
      headliner: "Foo Fighters: Live at Nippon Budokan",
      biography: "Dave Grohl and the Foo Fighters return to the sacred grounds of Nippon Budokan for an explosive 3-hour stadium rock marathon.",
      genre: "Hard Rock",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(125)
  },

  {
    id: "onerepublic-paradise-tour-secc",
    slug: "onerepublic-paradise-tour-secc",
    title: "OneRepublic: The Artificial Paradise Tour SECC",
    subtitle: "Official Live Tour Experience in HCMC",
    category: "Pop & Rock",
    groupCategory: "Concerts",
    description: "Ryan Tedder and OneRepublic perform global mega-hits Counting Stars, Apologize, and I Ain’t Worried live in Ho Chi Minh City.",
    startTime: "2026-11-18T19:30:00.000Z",
    endTime: "2026-11-18T22:00:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80",
    minPrice: 65,
    availableSeats: 315,
    totalSeats: 565,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1560012057-4372e14c5085?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517840901100-8179e982acb7?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Saigon Exhibition & Convention Center (SECC)",
        "slug": "secc-ho-chi-minh",
        "address": "799 Nguyen Van Linh, Tan Phu, District 7",
        "city": "HCMC",
        "country": "Vietnam",
        "capacity": 15000,
        "transitDirections": "Phu My Hung urban express route; dedicated event taxi line.",
        "parkingInfo": "Spacious outdoor and indoor convention parking for 3,000 vehicles.",
        "acousticProfile": "High-ceiling acoustic baffles and dynamic concert trussing."
  },
    artistBio: {
      name: "OneRepublic",
      headliner: "OneRepublic: The Artificial Paradise Tour SECC",
      biography: "Ryan Tedder and OneRepublic perform global mega-hits Counting Stars, Apologize, and I Ain’t Worried live in Ho Chi Minh City.",
      genre: "Pop & Rock",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(65)
  },

  {
    id: "vietnam-vs-indonesia-aff-cup",
    slug: "vietnam-vs-indonesia-aff-cup",
    title: "Vietnam vs Indonesia: AFF Cup Semifinal First Leg",
    subtitle: "Official Live Tour Experience in Hanoi",
    category: "Football & Soccer",
    groupCategory: "Sports",
    description: "High-stakes regional football rivalry. Vietnam’s Golden Star Warriors battle the Garuda squad in front of a deafening home crowd.",
    startTime: "2026-12-28T19:30:00.000Z",
    endTime: "2026-12-28T21:45:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80",
    minPrice: 40,
    availableSeats: 334,
    totalSeats: 584,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "My Dinh National Stadium",
        "slug": "my-dinh-national-stadium",
        "address": "1 Le Duc Tho Street, Nam Tu Liem",
        "city": "Hanoi",
        "country": "Vietnam",
        "capacity": 40192,
        "transitDirections": "Direct bus routes 26, 46 to stadium gates; Taxi drop-off at Gate A.",
        "parkingInfo": "Large open-air surface parking for 5,000 motorbikes and 1,200 cars.",
        "acousticProfile": "Open-air stadium line-array acoustic suspension system."
  },
    artistBio: {
      name: "Vietnam vs Indonesia",
      headliner: "Vietnam vs Indonesia: AFF Cup Semifinal First Leg",
      biography: "High-stakes regional football rivalry. Vietnam’s Golden Star Warriors battle the Garuda squad in front of a deafening home crowd.",
      genre: "Football & Soccer",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(40)
  },

  {
    id: "japan-vs-korea-world-cup-derby",
    slug: "japan-vs-korea-world-cup-derby",
    title: "Japan vs South Korea: Asian World Cup Super Derby",
    subtitle: "Official Live Tour Experience in Tokyo",
    category: "International Football",
    groupCategory: "Sports",
    description: "Asia’s premier international rivalry reaches fever pitch in this World Cup Qualification clash between the Samurai Blue and Taegeuk Warriors.",
    startTime: "2026-10-27T19:20:00.000Z",
    endTime: "2026-10-27T21:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80",
    minPrice: 85,
    availableSeats: 353,
    totalSeats: 603,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1517747614396-d21a78b850e8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Tokyo Dome",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "JR Chuo-Sobu Line to Suidobashi Station; Tokyo Metro Marunouchi Line to Korakuen.",
        "parkingInfo": "Tokyo Dome City multi-story underground car park.",
        "acousticProfile": "Pressurized dome acoustic envelope with 360-degree digital delay towers."
  },
    artistBio: {
      name: "Japan vs South Korea",
      headliner: "Japan vs South Korea: Asian World Cup Super Derby",
      biography: "Asia’s premier international rivalry reaches fever pitch in this World Cup Qualification clash between the Samurai Blue and Taegeuk Warriors.",
      genre: "International Football",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(85)
  },

  {
    id: "fiba-asia-cup-hcmc",
    slug: "fiba-asia-cup-hcmc",
    title: "FIBA Asia Cup Basketball Championship HCMC",
    subtitle: "Official Live Tour Experience in HCMC",
    category: "Basketball Arena",
    groupCategory: "Sports",
    description: "Continental national basketball powers battle for the FIBA Asia Cup title with full hardwood stadium court and dunk competitions.",
    startTime: "2026-11-05T18:00:00.000Z",
    endTime: "2026-11-05T21:30:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
    minPrice: 35,
    availableSeats: 372,
    totalSeats: 622,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Saigon Exhibition & Convention Center (SECC)",
        "slug": "secc-ho-chi-minh",
        "address": "799 Nguyen Van Linh, Tan Phu, District 7",
        "city": "HCMC",
        "country": "Vietnam",
        "capacity": 15000,
        "transitDirections": "Phu My Hung urban express route; dedicated event taxi line.",
        "parkingInfo": "Spacious outdoor and indoor convention parking for 3,000 vehicles.",
        "acousticProfile": "High-ceiling acoustic baffles and dynamic concert trussing."
  },
    artistBio: {
      name: "FIBA Asia Cup Basketball Championship HCMC",
      headliner: "FIBA Asia Cup Basketball Championship HCMC",
      biography: "Continental national basketball powers battle for the FIBA Asia Cup title with full hardwood stadium court and dunk competitions.",
      genre: "Basketball Arena",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(35)
  },

  {
    id: "newjeans-get-up-singapore",
    slug: "newjeans-get-up-singapore",
    title: "NewJeans: Get Up World Tour Singapore",
    subtitle: "Official Live Tour Experience in Singapore",
    category: "K-Pop",
    groupCategory: "K-Pop",
    description: "The global chart-topping sensation brings Super Shy, Ditto, and Hype Boy to Singapore with synchronized choreography and holographic visuals.",
    startTime: "2026-11-10T19:00:00.000Z",
    endTime: "2026-11-10T21:45:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?auto=format&fit=crop&w=1200&q=80",
    minPrice: 130,
    availableSeats: 391,
    totalSeats: 641,
    isPopular: false,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Singapore Indoor Stadium",
        "slug": "singapore-indoor-stadium",
        "address": "2 Stadium Walk",
        "city": "Singapore",
        "country": "Singapore",
        "capacity": 12000,
        "transitDirections": "Direct covered walkway from Stadium MRT Station (CC6) on Circle Line.",
        "parkingInfo": "Singapore Sports Hub Car Parks K and L with 1,800 bays.",
        "acousticProfile": "Precision-tuned indoor arena acoustics optimized for concerts and esports."
  },
    artistBio: {
      name: "NewJeans",
      headliner: "NewJeans: Get Up World Tour Singapore",
      biography: "The global chart-topping sensation brings Super Shy, Ditto, and Hype Boy to Singapore with synchronized choreography and holographic visuals.",
      genre: "K-Pop",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(130)
  },

  {
    id: "aespa-synk-tokyo-dome",
    slug: "aespa-synk-tokyo-dome",
    title: "aespa: SYNK Tokyo Dome Special Stadium Edition",
    subtitle: "Official Live Tour Experience in Tokyo",
    category: "K-Pop",
    groupCategory: "K-Pop",
    description: "aespa returns to Tokyo Dome with an augmented reality sci-fi production, live stadium band arrangements, and hyper-pop pyrotechnics.",
    startTime: "2026-12-05T17:30:00.000Z",
    endTime: "2026-12-05T20:45:00.000Z",
    bannerUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80",
    minPrice: 145,
    availableSeats: 130,
    totalSeats: 380,
    isPopular: true,
    isHotDrop: false,
    galleryPhotos: [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=1200&q=80"
    ],
    organizer: {
        "name": "Live Nation & Global Touring",
        "verified": true,
        "badge": "Official Verified Promoter",
        "description": "Official international tour organizer."
  },
    venue: {
        "name": "Tokyo Dome",
        "slug": "tokyo-dome",
        "address": "1-3-61 Koraku, Bunkyo City",
        "city": "Tokyo",
        "country": "Japan",
        "capacity": 55000,
        "transitDirections": "JR Chuo-Sobu Line to Suidobashi Station; Tokyo Metro Marunouchi Line to Korakuen.",
        "parkingInfo": "Tokyo Dome City multi-story underground car park.",
        "acousticProfile": "Pressurized dome acoustic envelope with 360-degree digital delay towers."
  },
    artistBio: {
      name: "aespa",
      headliner: "aespa: SYNK Tokyo Dome Special Stadium Edition",
      biography: "aespa returns to Tokyo Dome with an augmented reality sci-fi production, live stadium band arrangements, and hyper-pop pyrotechnics.",
      genre: "K-Pop",
      highlights: [
        "Live stadium production with acoustic mastering",
        "Exclusive VIP merchandise pass and dedicated gates",
        "Verified authentic digital turnstile QR tickets"
      ]
    },
    agenda: [
      { time: '17:00', title: 'Gates & VIP Check-In', description: 'Early hospitality entry and security screening.' },
      { time: '18:30', title: 'Opening Prelude & Warm-Up', description: 'Support showcase and arena entertainment.' },
      { time: '20:00', title: 'Main Championship / Headline Event', description: 'Primary world-class showcase and production.' }
    ],
    policies: DEFAULT_POLICIES,
    tiers: DEFAULT_TIERS(145)
  }
];

const KNOWN_EVENT_MAPPINGS: Record<string, string> = {
  // Aliases and Legacy IDs
  'evt-coldplay-music-spheres-2026': 'coldplay-music-of-the-spheres-hanoi',
  'evt-coldplay': 'coldplay-music-of-the-spheres-hanoi',
  'coldplay': 'coldplay-music-of-the-spheres-hanoi',
  'evt-lime-rock-historic-festival-42': 'historic-festival-42-lime-rock',
  'lime-rock': 'historic-festival-42-lime-rock',
  'f1-singapore': 'f1-singapore-grand-prix-arena',
  'evt-f1-singapore-grand-prix-arena': 'f1-singapore-grand-prix-arena',
  'evt-seventeen-follow-again-2026': 'seventeen-right-here-world-tour',
  'seventeen': 'seventeen-right-here-world-tour',
  'evt-blackpink-world-tour-2026': 'blackpink-born-pink-encore',
  'blackpink': 'blackpink-born-pink-encore',
  'evt-festival-camping-rv-2026': 'tomorrowland-winter-festival',
  'camping': 'tomorrowland-winter-festival',
  'coachella': 'coachella-valley-festival-pass',
  'premier-league': 'premier-league-asia-trophy-singapore',
  'taylor-swift': 'taylor-swift-eras-tour-tokyo',
  // DB UUIDs
  '72b57ced-d300-4d13-a74b-1862095e8a91': 'coldplay-music-of-the-spheres-hanoi',
  '40df42b5-725e-4e7d-b273-2a22d0081bc3': 'f1-singapore-grand-prix-arena',
  'c801f34a-3fb6-470f-9f1a-25bc725da3f7': 'linkin-park-from-zero-tokyo',
  '3fc9655d-66e5-47c1-9da9-2a9e6f217ee9': 'imagine-dragons-loom-singapore',
  '143edac3-53c7-4d51-a0ad-a63d302a766f': 'buc-tuong-friends-rock-hcmc',
  'ac336bf3-389c-467e-a29b-ccffdb29da3c': 'martin-garrix-live-my-dinh',
  'ae0c42dc-66bf-48ce-a64b-7af6a593ce8b': 'ultra-music-festival-tokyo-2026',
  '5fa728a3-58ed-406e-a801-ef710acffe97': 'sub-zero-project-rave-secc',
  'ca568c9e-62ed-44bc-98fd-8558299b0f5e': 'creamfields-singapore-2026',
  '10a79487-dd18-4938-b2ed-7d02560b1a61': 'blackpink-final-chapter-hanoi',
  'e61a9c31-459d-4db6-8ead-1715320c4669': 'bts-omniverse-reunion-tokyo',
  '3263f053-be86-4f91-8de1-f6cef80e71d5': 'newjeans-supernatural-singapore',
  'ce308243-c8a7-4bd9-8e3e-5ccae749579e': 'twice-ready-to-be-hcmc',
  'a318c123-c215-4e1b-8ddf-47f33cc2654d': 'cyber-symphony-2026',
  '3573088a-6e67-41b8-9cc5-7727b168add2': 'hans-zimmer-live-singapore',
  '328abc2a-b86b-4467-bd00-09a82ef7d291': 'joe-hisaishi-ghibli-gala-tokyo',
  '22d0d5f9-b23c-40ab-92b0-b4bf5591ef71': 'vnso-autumn-melodies-hanoi',
  'aca71f61-c27a-405d-9a14-f9c5cc072559': 'lol-worlds-finals-2026-tokyo',
  '764a3b71-9645-4aa5-9912-8b3e3c3627f4': 'vct-grand-finals-2026-singapore',
  'a601ebdf-a904-4082-958a-ef18d7449b62': 'vcs-spring-finals-hanoi-2026',
  '75614b5a-5980-4cf6-8ea7-781631c2c473': 'vietnam-vs-thailand-asean-finals',
  'cddbb0de-8b28-4331-bec5-22c8e05209ec': 'mancity-vs-arsenal-tokyo-2026',
  'b6b1a0c5-d5c6-432b-a24a-43b68a9e15ec': 'japan-vs-australia-wcq-tokyo',
  '900b6f6a-fc44-4be2-acdc-5d3f03c011ca': 'singapore-vs-tottenham-2026',
  '0073a5bb-6935-4cc5-9369-b37b617ed5d3': 'hanoi-fc-vs-hcmc-super-derby',
  '22c41437-426d-4215-a12e-12d7c460e991': 'evt-apex-championship-2026',
  '7653cbd8-2b3d-4e24-8b74-3fe44a73dd7d': 'taylor-swift-eras-tour-tokyo',
  '5448521f-30c9-4002-ac0b-d857c6274f93': 'taylor-swift-eras-tour-singapore',
  '97ca6eeb-925f-4186-84c8-10fd4a7d9279': 'coldplay-music-of-the-spheres-singapore',
  '01ff6f46-45fc-4c9f-ba0e-53e214973b82': 'seventeen-follow-again-singapore',
};

/**
 * Resolves an event from the catalog by its ID, slug, legacy alias, or UUID.
 */
export function getEventByIdOrSlug(idOrSlug: string): CatalogEvent {
  const normalized = (idOrSlug || '').toLowerCase().trim();

  // 1. Known alias or UUID mapping
  const mapped = KNOWN_EVENT_MAPPINGS[normalized];
  if (mapped) {
    const match = CATALOG_EVENTS.find((ev) => ev.id === mapped || ev.slug === mapped);
    if (match) return enrichEventDetails(match);
  }

  // 2. Exact match on id or slug
  const exact = CATALOG_EVENTS.find(
    (ev) => ev.id.toLowerCase() === normalized || ev.slug.toLowerCase() === normalized
  );
  if (exact) return enrichEventDetails(exact);

  // 3. Match stripped "evt-" prefix
  const stripped = normalized.replace(/^evt-/, '');
  const strippedMatch = CATALOG_EVENTS.find(
    (ev) => ev.id.toLowerCase() === stripped || ev.slug.toLowerCase() === stripped
  );
  if (strippedMatch) return enrichEventDetails(strippedMatch);

  // 4. Keyword fuzzy match
  const keywordMatch = CATALOG_EVENTS.find((ev) => {
    const hay = `${ev.id} ${ev.slug} ${ev.title}`.toLowerCase();
    if (normalized.includes('coldplay')) return hay.includes('coldplay');
    if (normalized.includes('lime-rock') || normalized.includes('historic')) return hay.includes('lime-rock') || hay.includes('historic');
    if (normalized.includes('singapore') && (normalized.includes('f1') || normalized.includes('grand-prix'))) return hay.includes('f1-singapore');
    if (normalized.includes('seventeen')) return hay.includes('seventeen');
    if (normalized.includes('blackpink')) return hay.includes('blackpink');
    if (normalized.includes('taylor') || normalized.includes('swift')) return hay.includes('taylor-swift');
    if (normalized.includes('linkin')) return hay.includes('linkin');
    if (normalized.includes('tomorrowland')) return hay.includes('tomorrowland');
    if (normalized.includes('coachella')) return hay.includes('coachella');
    return false;
  });
  if (keywordMatch) return enrichEventDetails(keywordMatch);

  // 5. Default fallback
  return enrichEventDetails(CATALOG_EVENTS[0]);
}

function enrichEventDetails(selected: CatalogEvent): CatalogEvent {

  // Guarantee rich thematic auxiliary gallery photos fallback
  if (!selected.galleryPhotos || selected.galleryPhotos.length === 0) {
    if (selected.groupCategory === 'Motorsport') {
      selected.galleryPhotos = [
        'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1508974239320-0a029497e820?q=80&w=1200&auto=format&fit=crop',
      ];
    } else if (selected.groupCategory === 'K-Pop') {
      selected.galleryPhotos = [
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
      ];
    } else if (selected.groupCategory === 'Sports') {
      selected.galleryPhotos = [
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
      ];
    } else {
      selected.galleryPhotos = [
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
      ];
    }
  }

  // Guarantee rich organizer fallback
  if (!selected.organizer) {
    if (selected.groupCategory === 'Motorsport') {
      selected.organizer = {
        name: 'FIA & Global Historic Motoring Association',
        verified: true,
        badge: 'FIA Official Sanctioned Partner',
        description: 'Sanctioned international motorsport federation ensuring premier circuit safety, technical scrutineering, and paddock management.',
      };
    } else if (selected.groupCategory === 'K-Pop') {
      selected.organizer = {
        name: 'HYBE & SM Entertainment Global Touring',
        verified: true,
        badge: 'Official Verified Promoter',
        description: 'Official international stadium tour promoter partnering directly with artist agencies and world-class production crews.',
      };
    } else if (selected.groupCategory === 'Sports') {
      selected.organizer = {
        name: 'International Sports Federation & Global Arena Series',
        verified: true,
        badge: 'Official League Partner',
        description: 'Official sports governing and entertainment body providing authenticated stadium ticketing and hospitality.',
      };
    } else {
      selected.organizer = {
        name: 'Live Nation & Aura Stadium Entertainment',
        verified: true,
        badge: 'Verified Global Promoter',
        description: 'World premier live entertainment producer delivering stadium-scale audio visual productions and verified fan ticketing.',
      };
    }
  }

  return selected;
}
