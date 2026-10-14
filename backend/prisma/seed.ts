import { PrismaClient, SeatStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// HELPER: Deterministic 1536-dim Embedding Generator (Normalized Unit Vector)
// ---------------------------------------------------------------------------
function generateMockEmbedding(seedText: string, dim = 1536): number[] {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  const vector: number[] = new Array(dim);
  let sumSq = 0;

  for (let i = 0; i < dim; i++) {
    // Linear congruential generator for deterministic pseudo-random floats
    hash = Math.imul(hash ^ (hash >>> 15), 0x5a5a5a5a + i);
    const val = ((hash & 0xffff) / 0xffff) * 2 - 1; // Range [-1, 1]
    vector[i] = val;
    sumSq += val * val;
  }

  // Normalize to unit vector for cosine distance
  const norm = Math.sqrt(sumSq) || 1;
  return vector.map((v) => Number((v / norm).toFixed(6)));
}

// ---------------------------------------------------------------------------
// VENUE AND EVENT DEFINITIONS (26 REALISTIC EVENTS)
// ---------------------------------------------------------------------------
interface SeedVenue {
  name: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  capacity: number;
}

const VENUES: SeedVenue[] = [
  {
    name: 'My Dinh National Stadium',
    slug: 'my-dinh-national-stadium',
    address: '1 Le Duc Tho Street, Nam Tu Liem',
    city: 'Hanoi',
    country: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh',
    capacity: 40192,
  },
  {
    name: 'Vietnam National Convention Center',
    slug: 'national-convention-center-hanoi',
    address: 'Pham Hung Road, Me Tri, Nam Tu Liem',
    city: 'Hanoi',
    country: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh',
    capacity: 3800,
  },
  {
    name: 'Saigon Exhibition & Convention Center (SECC)',
    slug: 'secc-ho-chi-minh',
    address: '799 Nguyen Van Linh, Tan Phu, District 7',
    city: 'HCMC',
    country: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh',
    capacity: 15000,
  },
  {
    name: 'Thong Nhat Stadium',
    slug: 'thong-nhat-stadium-hcmc',
    address: '138 Dao Duy Tu, Ward 6, District 10',
    city: 'HCMC',
    country: 'Vietnam',
    timezone: 'Asia/Ho_Chi_Minh',
    capacity: 16000,
  },
  {
    name: 'Tokyo Dome',
    slug: 'tokyo-dome',
    address: '1-3-61 Koraku, Bunkyo City',
    city: 'Tokyo',
    country: 'Japan',
    timezone: 'Asia/Tokyo',
    capacity: 55000,
  },
  {
    name: 'Nippon Budokan',
    slug: 'nippon-budokan-tokyo',
    address: '2-3 Kitanomarukoen, Chiyoda City',
    city: 'Tokyo',
    country: 'Japan',
    timezone: 'Asia/Tokyo',
    capacity: 14471,
  },
  {
    name: 'Singapore Indoor Stadium',
    slug: 'singapore-indoor-stadium',
    address: '2 Stadium Walk',
    city: 'Singapore',
    country: 'Singapore',
    timezone: 'Asia/Singapore',
    capacity: 12000,
  },
  {
    name: 'National Stadium Singapore',
    slug: 'national-stadium-singapore',
    address: '1 Stadium Drive',
    city: 'Singapore',
    country: 'Singapore',
    timezone: 'Asia/Singapore',
    capacity: 55000,
  },
];

interface SeedEvent {
  title: string;
  slug: string;
  venueSlug: string;
  category: string;
  description: string;
  startTime: string;
  endTime: string;
  bannerUrl: string;
  minPrice: number;
}

const EVENTS: SeedEvent[] = [
  // ROCK
  {
    title: 'Coldplay: Music of the Spheres World Tour',
    slug: 'coldplay-music-of-the-spheres-hanoi',
    venueSlug: 'my-dinh-national-stadium',
    category: 'Rock & Pop',
    description: 'The record-breaking stadium spectacle featuring synchronized LED wristbands, kinetic dance floors, and anthemic singalongs.',
    startTime: '2026-10-15T19:30:00.000Z',
    endTime: '2026-10-15T23:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
    minPrice: 85,
  },
  {
    title: 'Linkin Park: From Zero World Tour Tokyo',
    slug: 'linkin-park-from-zero-tokyo',
    venueSlug: 'tokyo-dome',
    category: 'Rock & Metal',
    description: 'Linkin Park returns to Tokyo with Emily Armstrong, performing new album hits alongside legendary anthems In The End and Numb.',
    startTime: '2026-11-04T18:00:00.000Z',
    endTime: '2026-11-04T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop',
    minPrice: 110,
  },
  {
    title: 'Imagine Dragons: LOOM World Tour Singapore',
    slug: 'imagine-dragons-loom-singapore',
    venueSlug: 'singapore-indoor-stadium',
    category: 'Alternative Rock',
    description: 'Dynamic pop-rock anthems Believer, Radioactive, and Demons live with state-of-the-art stadium laser production.',
    startTime: '2026-11-20T20:00:00.000Z',
    endTime: '2026-11-20T23:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop',
    minPrice: 95,
  },
  {
    title: 'Buc Tuong & Friends: Vietnamese Rock Legends',
    slug: 'buc-tuong-friends-rock-hcmc',
    venueSlug: 'thong-nhat-stadium-hcmc',
    category: 'Vietnamese Rock',
    description: 'An unforgettable open-air rock gala celebrating 30 years of Vietnamese rock heritage with special guest rock bands.',
    startTime: '2026-12-12T19:00:00.000Z',
    endTime: '2026-12-12T23:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1200&auto=format&fit=crop',
    minPrice: 45,
  },

  // EDM
  {
    title: 'Martin Garrix: Live at My Dinh Arena',
    slug: 'martin-garrix-live-my-dinh',
    venueSlug: 'my-dinh-national-stadium',
    category: 'EDM & Festival',
    description: 'The world #1 DJ brings an explosive 3-hour stadium set with 200+ synchronized pyrotechnic and laser systems.',
    startTime: '2026-10-31T20:00:00.000Z',
    endTime: '2026-11-01T01:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
    minPrice: 70,
  },
  {
    title: 'Ultra Music Festival Tokyo 2026',
    slug: 'ultra-music-festival-tokyo-2026',
    venueSlug: 'tokyo-dome',
    category: 'EDM & Dance',
    description: 'Three stages of non-stop electronic dance music featuring top international headliners and underground techno pavilions.',
    startTime: '2026-09-19T14:00:00.000Z',
    endTime: '2026-09-20T23:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1200&auto=format&fit=crop',
    minPrice: 130,
  },
  {
    title: 'Sub Zero Project: Rave Universe SECC',
    slug: 'sub-zero-project-rave-secc',
    venueSlug: 'secc-ho-chi-minh',
    category: 'Hardstyle & EDM',
    description: 'The Dutch hardstyle pioneers deliver an apocalyptic indoor audio-visual showcase in Ho Chi Minh City.',
    startTime: '2026-11-28T21:00:00.000Z',
    endTime: '2026-11-29T03:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop',
    minPrice: 60,
  },
  {
    title: 'Creamfields Singapore 2026 Stadium Edition',
    slug: 'creamfields-singapore-2026',
    venueSlug: 'national-stadium-singapore',
    category: 'EDM & Festival',
    description: 'UK mega-festival Creamfields lands in Singapore with custom steel stages, kinetic lighting, and 50,000 ravers.',
    startTime: '2026-12-19T16:00:00.000Z',
    endTime: '2026-12-20T02:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=1200&auto=format&fit=crop',
    minPrice: 125,
  },

  // K-POP
  {
    title: 'BLACKPINK: The Final Chapter World Tour',
    slug: 'blackpink-final-chapter-hanoi',
    venueSlug: 'my-dinh-national-stadium',
    category: 'K-Pop',
    description: 'Jisoo, Jennie, Rose, and Lisa return to My Dinh for the grand finale of their historic world stadium tour.',
    startTime: '2026-10-24T19:00:00.000Z',
    endTime: '2026-10-24T22:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1520523839898-507125cd53c1?q=80&w=1200&auto=format&fit=crop',
    minPrice: 120,
  },
  {
    title: 'BTS: Omniverse Reunion Stadium Tour Tokyo',
    slug: 'bts-omniverse-reunion-tokyo',
    venueSlug: 'tokyo-dome',
    category: 'K-Pop',
    description: 'The monumental return of all 7 members of BTS in their first worldwide stadium tour together in 4 years.',
    startTime: '2026-11-14T18:00:00.000Z',
    endTime: '2026-11-14T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1200&auto=format&fit=crop',
    minPrice: 160,
  },
  {
    title: 'NewJeans: Supernatural Live in Singapore',
    slug: 'newjeans-supernatural-singapore',
    venueSlug: 'singapore-indoor-stadium',
    category: 'K-Pop',
    description: 'The breakout pop icons perform Ditto, Hype Boy, OMG, and Supernatural in an electrifying neon-themed production.',
    startTime: '2026-12-05T19:30:00.000Z',
    endTime: '2026-12-05T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    minPrice: 105,
  },
  {
    title: 'TWICE: Ready To Be Encore HCMC',
    slug: 'twice-ready-to-be-hcmc',
    venueSlug: 'thong-nhat-stadium-hcmc',
    category: 'K-Pop',
    description: 'All 9 members of TWICE bring their record-breaking Ready To Be world tour to Ho Chi Minh City fans.',
    startTime: '2026-12-26T19:00:00.000Z',
    endTime: '2026-12-26T22:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1200&auto=format&fit=crop',
    minPrice: 95,
  },

  // ORCHESTRA & CLASSICAL
  {
    title: 'Cyber Symphony: Omniverse World Tour',
    slug: 'cyber-symphony-2026',
    venueSlug: 'national-convention-center-hanoi',
    category: 'Orchestral & Electronic',
    description: '360-degree acoustic performance featuring the London Philharmonic & Neon Glitch Collective with spatial laser mapping.',
    startTime: '2026-10-24T20:00:00.000Z',
    endTime: '2026-10-24T23:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=1200&auto=format&fit=crop',
    minPrice: 75,
  },
  {
    title: 'Hans Zimmer Live: Soundtracks in Concert Singapore',
    slug: 'hans-zimmer-live-singapore',
    venueSlug: 'singapore-indoor-stadium',
    category: 'Film Score & Orchestra',
    description: 'The legendary composer live with full orchestra and choir performing Interstellar, Inception, Dune, and Gladiator.',
    startTime: '2026-11-18T20:00:00.000Z',
    endTime: '2026-11-18T23:15:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1200&auto=format&fit=crop',
    minPrice: 90,
  },
  {
    title: 'Joe Hisaishi: Studio Ghibli Symphonic Gala Tokyo',
    slug: 'joe-hisaishi-ghibli-gala-tokyo',
    venueSlug: 'nippon-budokan-tokyo',
    category: 'Film Score & Orchestra',
    description: 'Experience the magical scores of Spirited Away, My Neighbor Totoro, and Princess Mononoke conducted by Maestro Hisaishi.',
    startTime: '2026-10-09T18:30:00.000Z',
    endTime: '2026-10-09T21:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1200&auto=format&fit=crop',
    minPrice: 115,
  },
  {
    title: 'Vietnam National Symphony Orchestra: Autumn Melodies',
    slug: 'vnso-autumn-melodies-hanoi',
    venueSlug: 'national-convention-center-hanoi',
    category: 'Classical Masterworks',
    description: 'Masterworks by Beethoven, Tchaikovsky, and contemporary Vietnamese symphonic composers conducted by Honna Tetsuji.',
    startTime: '2026-11-07T19:30:00.000Z',
    endTime: '2026-11-07T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1519744346361-8982367d3056?q=80&w=1200&auto=format&fit=crop',
    minPrice: 40,
  },

  // ESPORTS
  {
    title: 'League of Legends Worlds Finals 2026 Tokyo',
    slug: 'lol-worlds-finals-2026-tokyo',
    venueSlug: 'tokyo-dome',
    category: 'Esports Championship',
    description: 'The pinnacle of competitive gaming. Top international teams battle for the Summoner’s Cup in front of 50,000 fans.',
    startTime: '2026-11-07T16:00:00.000Z',
    endTime: '2026-11-07T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
    minPrice: 90,
  },
  {
    title: 'Valorant Champions Tour Grand Finals Singapore',
    slug: 'vct-grand-finals-2026-singapore',
    venueSlug: 'singapore-indoor-stadium',
    category: 'Esports Arena',
    description: 'Global champions clash in tactical shooter supremacy with synchronized holographic stage abilities and player booths.',
    startTime: '2026-10-18T15:00:00.000Z',
    endTime: '2026-10-18T21:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop',
    minPrice: 65,
  },
  {
    title: 'VCS Spring Grand Finals Hanoi 2026',
    slug: 'vcs-spring-finals-hanoi-2026',
    venueSlug: 'national-convention-center-hanoi',
    category: 'Esports Vietnam',
    description: 'GAM Esports vs Vikings Esports in the highest-stakes League of Legends championship battle in Vietnam.',
    startTime: '2026-09-27T17:00:00.000Z',
    endTime: '2026-09-27T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop',
    minPrice: 35,
  },
  {
    title: 'Dota 2: Southeast Asia Arena Invitational HCMC',
    slug: 'dota2-sea-invitational-hcmc',
    venueSlug: 'secc-ho-chi-minh',
    category: 'Esports Tournament',
    description: 'Top SEA Dota 2 franchises compete for the $500,000 regional trophy with live caster stages and cosplayer village.',
    startTime: '2026-10-10T14:00:00.000Z',
    endTime: '2026-10-11T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=1200&auto=format&fit=crop',
    minPrice: 40,
  },

  // FOOTBALL & SPORTS
  {
    title: 'Vietnam vs Thailand: ASEAN Championship Finals',
    slug: 'vietnam-vs-thailand-asean-finals',
    venueSlug: 'my-dinh-national-stadium',
    category: 'Football & Soccer',
    description: 'The Golden Star Warriors take on Thailand in the high-voltage second leg of the Southeast Asian Championship final.',
    startTime: '2026-12-16T19:30:00.000Z',
    endTime: '2026-12-16T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
    minPrice: 50,
  },
  {
    title: 'Manchester City vs Arsenal: Asia Champions Cup Tokyo',
    slug: 'mancity-vs-arsenal-tokyo-2026',
    venueSlug: 'tokyo-dome',
    category: 'Premier League Soccer',
    description: 'Pep Guardiola’s Manchester City faces Mikel Arteta’s Arsenal in a star-studded summer clash in the heart of Tokyo.',
    startTime: '2026-07-28T19:00:00.000Z',
    endTime: '2026-07-28T21:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1200&auto=format&fit=crop',
    minPrice: 120,
  },
  {
    title: 'Japan vs Australia: World Cup Qualifiers 2026',
    slug: 'japan-vs-australia-wcq-tokyo',
    venueSlug: 'tokyo-dome',
    category: 'International Football',
    description: 'Samurai Blue lock horns with the Socceroos in the decisive round of Asian World Cup Qualification.',
    startTime: '2026-10-13T19:35:00.000Z',
    endTime: '2026-10-13T21:45:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=1200&auto=format&fit=crop',
    minPrice: 75,
  },
  {
    title: 'Singapore Lions vs Tottenham Hotspur Exhibition',
    slug: 'singapore-vs-tottenham-2026',
    venueSlug: 'national-stadium-singapore',
    category: 'International Football',
    description: 'The Singapore national team tests their mettle against Son Heung-min and Tottenham Hotspur at the National Stadium.',
    startTime: '2026-08-01T20:00:00.000Z',
    endTime: '2026-08-01T22:15:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop',
    minPrice: 80,
  },
  {
    title: 'Hanoi FC vs Ho Chi Minh City FC: V-League Super Derby',
    slug: 'hanoi-fc-vs-hcmc-super-derby',
    venueSlug: 'my-dinh-national-stadium',
    category: 'V-League Football',
    description: 'The biggest rivalry in Vietnamese club football. Top national team stars clash in a high-intensity showdown.',
    startTime: '2026-11-21T19:15:00.000Z',
    endTime: '2026-11-21T21:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1200&auto=format&fit=crop',
    minPrice: 30,
  },
  {
    title: 'Apex Arena: World Championship Finals',
    slug: 'evt-apex-championship-2026',
    venueSlug: 'nippon-budokan-tokyo',
    category: 'Esports Arena',
    description: 'Global finalists face off live in a high-octane stadium showdown with real-time HUD projections and full sensory effects.',
    startTime: '2026-11-12T18:30:00.000Z',
    endTime: '2026-11-12T22:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
    minPrice: 90,
  },

  // ---------------------------------------------------------------------------
  // ADDITIONAL 25 REALISTIC EVENTS (EXPANDED TO 50+ EVENTS)
  // ---------------------------------------------------------------------------

  // ADDITIONAL CONCERTS
  {
    title: 'Taylor Swift: The Eras Tour Tokyo Dome',
    slug: 'taylor-swift-eras-tour-tokyo',
    venueSlug: 'tokyo-dome',
    category: 'Pop & Stadium Tour',
    description: 'The monumental worldwide cultural phenomenon covering all 11 musical eras with three-and-a-half hours of non-stop iconic anthems.',
    startTime: '2026-11-20T18:00:00.000Z',
    endTime: '2026-11-20T21:45:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=1200&auto=format&fit=crop',
    minPrice: 150,
  },
  {
    title: 'Taylor Swift: The Eras Tour Singapore',
    slug: 'taylor-swift-eras-tour-singapore',
    venueSlug: 'national-stadium-singapore',
    category: 'Pop & Stadium Tour',
    description: 'Southeast Asia’s exclusive stadium engagement of The Eras Tour featuring 55,000 wristband lights and surprise acoustic acoustic songs.',
    startTime: '2026-12-04T18:30:00.000Z',
    endTime: '2026-12-04T22:15:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1200&auto=format&fit=crop',
    minPrice: 165,
  },
  {
    title: 'Coldplay: Music of the Spheres Singapore Encore',
    slug: 'coldplay-music-of-the-spheres-singapore',
    venueSlug: 'national-stadium-singapore',
    category: 'Rock & Pop',
    description: 'Due to overwhelming demand, Coldplay returns for a historic 6th night at Singapore National Stadium with kinetic dancefloors.',
    startTime: '2026-11-15T19:30:00.000Z',
    endTime: '2026-11-15T22:45:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?q=80&w=1200&auto=format&fit=crop',
    minPrice: 95,
  },
  {
    title: 'Imagine Dragons: LOOM World Tour Tokyo',
    slug: 'imagine-dragons-loom-tokyo',
    venueSlug: 'tokyo-dome',
    category: 'Alternative Rock',
    description: 'Dan Reynolds and Imagine Dragons deliver an earth-shaking stadium rock performance with synchronized laser storms in Tokyo.',
    startTime: '2026-10-28T19:00:00.000Z',
    endTime: '2026-10-28T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1200&auto=format&fit=crop',
    minPrice: 105,
  },
  {
    title: 'Ed Sheeran: +–=÷× Mathematics Tour Hanoi',
    slug: 'ed-sheeran-mathematics-tour-hanoi',
    venueSlug: 'my-dinh-national-stadium',
    category: 'Pop & Acoustic',
    description: 'Ed Sheeran brings his custom 360-degree rotating stadium stage and iconic loop pedal hits to 40,000 fans at My Dinh.',
    startTime: '2026-11-25T19:30:00.000Z',
    endTime: '2026-11-25T22:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=1200&auto=format&fit=crop',
    minPrice: 80,
  },
  {
    title: 'Maroon 5: World Tour Live in HCMC',
    slug: 'maroon5-world-tour-hcmc',
    venueSlug: 'thong-nhat-stadium-hcmc',
    category: 'Pop & Rock',
    description: 'Adam Levine and Maroon 5 ignite Thong Nhat Stadium with their infectious pop-funk classics Sugar, Moves Like Jagger, and She Will Be Loved.',
    startTime: '2026-12-08T20:00:00.000Z',
    endTime: '2026-12-08T22:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=1200&auto=format&fit=crop',
    minPrice: 70,
  },
  {
    title: 'Bruno Mars: 24K Magic World Tour Singapore',
    slug: 'bruno-mars-live-singapore',
    venueSlug: 'national-stadium-singapore',
    category: 'Pop & Funk',
    description: '15-time Grammy winner Bruno Mars brings the ultimate funk showmanship and chart-topping swagger to the National Stadium.',
    startTime: '2026-10-04T20:00:00.000Z',
    endTime: '2026-10-04T22:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1200&auto=format&fit=crop',
    minPrice: 135,
  },
  {
    title: 'Post Malone: If Y’all Weren’t Here Tour Tokyo',
    slug: 'post-malone-world-tour-tokyo',
    venueSlug: 'tokyo-dome',
    category: 'Hip-Hop & Rock',
    description: 'Post Malone electrifies Tokyo with his genre-bending stadium live band, pyrotechnic walls, and rock-infused anthems Circles and Sunflower.',
    startTime: '2026-11-30T19:00:00.000Z',
    endTime: '2026-11-30T21:45:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?q=80&w=1200&auto=format&fit=crop',
    minPrice: 110,
  },
  {
    title: 'Billie Eilish: Hit Me Hard and Soft Tour Hanoi',
    slug: 'billie-eilish-hard-soft-hanoi',
    venueSlug: 'my-dinh-national-stadium',
    category: 'Alternative Pop',
    description: 'Billie Eilish presents a 360-degree immersive acoustic performance with spatial sound systems and zero-waste sustainable tour production.',
    startTime: '2026-12-22T20:00:00.000Z',
    endTime: '2026-12-22T22:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?q=80&w=1200&auto=format&fit=crop',
    minPrice: 90,
  },
  {
    title: 'Foo Fighters: Live at Nippon Budokan',
    slug: 'foo-fighters-budokan-tokyo',
    venueSlug: 'nippon-budokan-tokyo',
    category: 'Hard Rock',
    description: 'Dave Grohl and the Foo Fighters return to the sacred grounds of Nippon Budokan for an explosive 3-hour stadium rock marathon.',
    startTime: '2026-10-20T18:30:00.000Z',
    endTime: '2026-10-20T21:45:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?q=80&w=1200&auto=format&fit=crop',
    minPrice: 125,
  },
  {
    title: 'OneRepublic: The Artificial Paradise Tour SECC',
    slug: 'onerepublic-paradise-tour-secc',
    venueSlug: 'secc-ho-chi-minh',
    category: 'Pop & Rock',
    description: 'Ryan Tedder and OneRepublic perform global mega-hits Counting Stars, Apologize, and I Ain’t Worried live in Ho Chi Minh City.',
    startTime: '2026-11-18T19:30:00.000Z',
    endTime: '2026-11-18T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1501612722273-046665c79745?q=80&w=1200&auto=format&fit=crop',
    minPrice: 65,
  },

  // ADDITIONAL SPORTS ARENAS
  {
    title: 'NBA Global Games Tokyo: LA Lakers vs Golden State Warriors',
    slug: 'nba-global-games-tokyo-2026',
    venueSlug: 'tokyo-dome',
    category: 'Basketball & NBA',
    description: 'Superstars clash as the Los Angeles Lakers take on Stephen Curry and the Golden State Warriors in an official NBA regular-season Tokyo spectacle.',
    startTime: '2026-10-08T19:00:00.000Z',
    endTime: '2026-10-08T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop',
    minPrice: 160,
  },
  {
    title: 'Premier League Asian Tour: Liverpool FC vs Arsenal FC Singapore',
    slug: 'premier-league-asia-trophy-singapore',
    venueSlug: 'national-stadium-singapore',
    category: 'Premier League Soccer',
    description: 'Two of England’s most celebrated football titans face off before 55,000 passionate supporters in the Singapore Trophy showdown.',
    startTime: '2026-07-25T19:30:00.000Z',
    endTime: '2026-07-25T21:45:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1517747614396-d21a78b850e8?q=80&w=1200&auto=format&fit=crop',
    minPrice: 125,
  },
  {
    title: 'BWF Badminton World Tour Finals Hanoi 2026',
    slug: 'bwf-world-tour-finals-hanoi',
    venueSlug: 'national-convention-center-hanoi',
    category: 'Badminton Championship',
    description: 'The world’s top 8 badminton titans compete in the season-ending marquee championship with rapid 400km/h smashes and court drama.',
    startTime: '2026-12-14T14:00:00.000Z',
    endTime: '2026-12-14T21:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200&auto=format&fit=crop',
    minPrice: 45,
  },
  {
    title: 'Formula 1 Singapore Grand Prix: Concert & Trackside Arena',
    slug: 'f1-singapore-grand-prix-arena',
    venueSlug: 'national-stadium-singapore',
    category: 'Motorsport & F1',
    description: 'Night racing under the Marina Bay lights paired with prime stadium grandstand sightlines and after-race superstar performances.',
    startTime: '2026-09-20T18:00:00.000Z',
    endTime: '2026-09-20T23:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1200&auto=format&fit=crop',
    minPrice: 180,
  },
  {
    title: 'UFC 320: Asia Championship Tokyo Dome',
    slug: 'ufc-320-asia-championship-tokyo',
    venueSlug: 'tokyo-dome',
    category: 'Mixed Martial Arts',
    description: 'Two undisputed world championship title fights headline the Octagon’s return to Japan with world-class striking and grappling.',
    startTime: '2026-11-21T17:00:00.000Z',
    endTime: '2026-11-21T23:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?q=80&w=1200&auto=format&fit=crop',
    minPrice: 110,
  },
  {
    title: 'Vietnam vs Indonesia: AFF Cup Semifinal First Leg',
    slug: 'vietnam-vs-indonesia-aff-cup',
    venueSlug: 'my-dinh-national-stadium',
    category: 'Football & Soccer',
    description: 'High-stakes regional football rivalry. Vietnam’s Golden Star Warriors battle the Garuda squad in front of a deafening home crowd.',
    startTime: '2026-12-28T19:30:00.000Z',
    endTime: '2026-12-28T21:45:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1200&auto=format&fit=crop',
    minPrice: 40,
  },
  {
    title: 'Japan vs South Korea: Asian World Cup Super Derby',
    slug: 'japan-vs-korea-world-cup-derby',
    venueSlug: 'tokyo-dome',
    category: 'International Football',
    description: 'Asia’s premier international rivalry reaches fever pitch in this World Cup Qualification clash between the Samurai Blue and Taegeuk Warriors.',
    startTime: '2026-10-27T19:20:00.000Z',
    endTime: '2026-10-27T21:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=1200&auto=format&fit=crop',
    minPrice: 85,
  },
  {
    title: 'FIBA Asia Cup Basketball Championship HCMC',
    slug: 'fiba-asia-cup-hcmc',
    venueSlug: 'secc-ho-chi-minh',
    category: 'Basketball Arena',
    description: 'Continental national basketball powers battle for the FIBA Asia Cup title with full hardwood stadium court and dunk competitions.',
    startTime: '2026-11-05T18:00:00.000Z',
    endTime: '2026-11-05T21:30:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?q=80&w=1200&auto=format&fit=crop',
    minPrice: 35,
  },

  // ADDITIONAL K-POP
  {
    title: 'NewJeans: Bunnies Camp Tokyo Dome Stadium',
    slug: 'newjeans-bunnies-camp-tokyo',
    venueSlug: 'tokyo-dome',
    category: 'K-Pop',
    description: 'Minji, Hanni, Danielle, Haerin, and Hyein sell out Tokyo Dome with their infectious Y2K pop sound and record-breaking fan engagement.',
    startTime: '2026-10-17T18:00:00.000Z',
    endTime: '2026-10-17T21:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1200&auto=format&fit=crop',
    minPrice: 140,
  },
  {
    title: 'NewJeans: Get Up World Tour Singapore',
    slug: 'newjeans-get-up-singapore',
    venueSlug: 'singapore-indoor-stadium',
    category: 'K-Pop',
    description: 'The global chart-topping sensation brings Super Shy, Ditto, and Hype Boy to Singapore with synchronized choreography and holographic visuals.',
    startTime: '2026-11-10T19:00:00.000Z',
    endTime: '2026-11-10T21:45:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1516450137517-162bfbeb7dba?q=80&w=1200&auto=format&fit=crop',
    minPrice: 130,
  },
  {
    title: 'aespa: SYNK Parallel Line World Tour Hanoi',
    slug: 'aespa-synk-parallel-line-hanoi',
    venueSlug: 'my-dinh-national-stadium',
    category: 'K-Pop',
    description: 'Karina, Giselle, Winter, and Ningning bring their futuristic metaverse concept and massive hits Supernova and Armageddon to My Dinh Stadium.',
    startTime: '2026-11-28T19:30:00.000Z',
    endTime: '2026-11-28T22:15:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1496337589254-7e19d01cec44?q=80&w=1200&auto=format&fit=crop',
    minPrice: 110,
  },
  {
    title: 'aespa: SYNK Tokyo Dome Special Stadium Edition',
    slug: 'aespa-synk-tokyo-dome',
    venueSlug: 'tokyo-dome',
    category: 'K-Pop',
    description: 'aespa returns to Tokyo Dome with an augmented reality sci-fi production, live stadium band arrangements, and hyper-pop pyrotechnics.',
    startTime: '2026-12-05T17:30:00.000Z',
    endTime: '2026-12-05T20:45:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?q=80&w=1200&auto=format&fit=crop',
    minPrice: 145,
  },
  {
    title: 'Seventeen: [RIGHT HERE] World Tour Singapore',
    slug: 'seventeen-follow-again-singapore',
    venueSlug: 'national-stadium-singapore',
    category: 'K-Pop',
    description: 'The 13-member self-producing performance powerhouse delivers unmatched synchronization and unforgettable stadium energy.',
    startTime: '2026-12-12T18:30:00.000Z',
    endTime: '2026-12-12T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=1200&auto=format&fit=crop',
    minPrice: 135,
  },
  {
    title: 'Stray Kids: dominATE World Tour Hanoi',
    slug: 'stray-kids-dominate-tour-hanoi',
    venueSlug: 'my-dinh-national-stadium',
    category: 'K-Pop',
    description: 'Bang Chan and Stray Kids shake My Dinh Stadium with their thunderous self-produced hits God’s Menu, MANIAC, and Chk Chk Boom.',
    startTime: '2026-10-30T19:00:00.000Z',
    endTime: '2026-10-30T22:00:00.000Z',
    bannerUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=1200&auto=format&fit=crop',
    minPrice: 120,
  },
];

// ---------------------------------------------------------------------------
// MAIN SEED SCRIPT
// ---------------------------------------------------------------------------
async function main() {
  console.log('🚀 Starting Database Seeding...');

  // 1. Seed Demo Users
  console.log('👤 Seeding default and demo users...');
  const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);

  const demoUsers = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'alex.vance@example.com',
      passwordHash: defaultPasswordHash,
      firstName: 'Alex',
      lastName: 'Vance',
      role: UserRole.CUSTOMER,
      balance: 1500.0,
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'demo@auratickets.com',
      passwordHash: defaultPasswordHash,
      firstName: 'Demo',
      lastName: 'Customer',
      role: UserRole.CUSTOMER,
      balance: 1500.0,
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'admin@auratickets.com',
      passwordHash: defaultPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      balance: 1500.0,
    },
  ];

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        passwordHash: user.passwordHash,
        balance: user.balance,
      },
      create: user,
    });
  }
  console.log(`✅ Seeded ${demoUsers.length} users.`);

  // 2. Seed Venues & Standard Sections
  console.log('🏟️  Seeding venues and stadium seating tiers...');
  const venueMap = new Map<string, string>(); // slug -> venueId
  const sectionMap = new Map<string, { [secName: string]: string }>(); // venueId -> { sectionName: sectionId }

  for (const v of VENUES) {
    const venue = await prisma.venue.upsert({
      where: { slug: v.slug },
      update: {
        name: v.name,
        address: v.address,
        city: v.city,
        country: v.country,
        capacity: v.capacity,
      },
      create: v,
    });

    venueMap.set(v.slug, venue.id);

    // Create 4 standard tier sections per venue
    const sectionNames = [
      { name: 'VIP Platinum Orchestra', capacity: 120 },
      { name: 'Lower Bowl Center', capacity: 220 },
      { name: 'East & West Wings', capacity: 160 },
      { name: 'Upper Grand Balcony', capacity: 180 },
    ];

    const secIds: { [name: string]: string } = {};

    for (const sec of sectionNames) {
      const section = await prisma.section.upsert({
        where: {
          unique_section_per_venue: {
            venueId: venue.id,
            name: sec.name,
          },
        },
        update: { capacity: sec.capacity },
        create: {
          venueId: venue.id,
          name: sec.name,
          capacity: sec.capacity,
        },
      });
      secIds[sec.name] = section.id;
    }

    sectionMap.set(venue.id, secIds);
  }
  console.log(`✅ Seeded ${VENUES.length} venues with 4 tier sections each.`);

  // 3. Seed Events & Vector Embeddings
  console.log(`🎟️  Seeding ${EVENTS.length} events across 6 genres...`);
  let totalSeatsSeeded = 0;

  for (const evData of EVENTS) {
    const venueId = venueMap.get(evData.venueSlug);
    if (!venueId) continue;

    const sections = sectionMap.get(venueId) || {};

    const event = await prisma.event.upsert({
      where: { slug: evData.slug },
      update: {
        title: evData.title,
        description: evData.description,
        startTime: new Date(evData.startTime),
        endTime: new Date(evData.endTime),
        bannerUrl: evData.bannerUrl,
        isPublished: true,
      },
      create: {
        venueId,
        title: evData.title,
        slug: evData.slug,
        description: evData.description,
        startTime: new Date(evData.startTime),
        endTime: new Date(evData.endTime),
        bannerUrl: evData.bannerUrl,
        isPublished: true,
      },
    });

    // 4. Update 1536-dim Mock Vector Embedding for pgvector Semantic Search
    try {
      const embedding = generateMockEmbedding(`${evData.title} ${evData.category} ${evData.description}`);
      const vectorString = `[${embedding.join(',')}]`;
      await prisma.$executeRawUnsafe(
        'UPDATE "Event" SET embedding = $1::vector WHERE id = $2::uuid',
        vectorString,
        event.id
      );
    } catch (vectorErr) {
      // Graceful fallback if pgvector extension isn't active on current DB
      console.warn(`[WARN] Could not update pgvector embedding for ${event.slug}: ${(vectorErr as Error).message}`);
    }

    // 5. Seed 140 Seats with Tier Pricing per Event
    // Check if seats already seeded for this event
    const existingSeats = await prisma.seat.count({ where: { eventId: event.id } });
    if (existingSeats === 0) {
      const seatsToCreate: any[] = [];

      // Section 1: VIP Platinum Orchestra (Rows A-C, 12 seats per row = 36 seats)
      const vipSecId = sections['VIP Platinum Orchestra'];
      if (vipSecId) {
        ['A', 'B', 'C'].forEach((row) => {
          for (let s = 1; s <= 12; s++) {
            seatsToCreate.push({
              eventId: event.id,
              sectionId: vipSecId,
              row,
              seatNumber: String(s),
              price: evData.minPrice * 2.8,
              status: SeatStatus.AVAILABLE,
            });
          }
        });
      }

      // Section 2: Lower Bowl Center (Rows D-G, 14 seats per row = 56 seats)
      const lowerSecId = sections['Lower Bowl Center'];
      if (lowerSecId) {
        ['D', 'E', 'F', 'G'].forEach((row) => {
          for (let s = 1; s <= 14; s++) {
            seatsToCreate.push({
              eventId: event.id,
              sectionId: lowerSecId,
              row,
              seatNumber: String(s),
              price: evData.minPrice * 1.8,
              status: SeatStatus.AVAILABLE,
            });
          }
        });
      }

      // Section 3: East & West Wings (Rows W1-W3, 10 seats per row = 30 seats)
      const wingSecId = sections['East & West Wings'];
      if (wingSecId) {
        ['W1', 'W2', 'W3'].forEach((row) => {
          for (let s = 1; s <= 10; s++) {
            seatsToCreate.push({
              eventId: event.id,
              sectionId: wingSecId,
              row,
              seatNumber: String(s),
              price: evData.minPrice * 1.3,
              status: SeatStatus.AVAILABLE,
            });
          }
        });
      }

      // Section 4: Upper Grand Balcony (Rows U1-U2, 14 seats per row = 28 seats)
      const balconySecId = sections['Upper Grand Balcony'];
      if (balconySecId) {
        ['U1', 'U2'].forEach((row) => {
          for (let s = 1; s <= 14; s++) {
            seatsToCreate.push({
              eventId: event.id,
              sectionId: balconySecId,
              row,
              seatNumber: String(s),
              price: evData.minPrice * 1.0,
              status: SeatStatus.AVAILABLE,
            });
          }
        });
      }

      await prisma.seat.createMany({
        data: seatsToCreate,
        skipDuplicates: true,
      });

      totalSeatsSeeded += seatsToCreate.length;
    }
  }

  console.log(`✅ Seeded total ${totalSeatsSeeded} stadium seats across events.`);
  console.log('🎉 Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
