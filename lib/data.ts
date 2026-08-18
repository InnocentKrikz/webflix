import type { CastMember, Episode, Row, Season, Title } from './types'

const CASTS: CastMember[] = [
  { name: 'Marcus Vane', character: 'Jack Cutter', photo: '/images/cast-1.png' },
  { name: 'Elena Ross', character: 'Dr. Mara Quinn', photo: '/images/cast-2.png' },
  { name: 'Darius Cole', character: 'Chief Reyes', photo: '/images/cast-3.png' },
  { name: 'Vivian Marsh', character: 'Eleanor Vale', photo: '/images/cast-4.png' },
  { name: 'Kenji Tan', character: 'Detective Sato', photo: '/images/cast-5.png' },
  { name: 'Sofia Delgado', character: 'Lucia Marin', photo: '/images/cast-6.png' },
]

// rotate the shared cast so every title has a plausible-looking lineup
function castFor(offset: number, roles: string[]): CastMember[] {
  return roles.map((character, i) => {
    const base = CASTS[(offset + i) % CASTS.length]
    return { ...base, character }
  })
}

const EPISODE_STILLS = [
  '/images/episode-1.png',
  '/images/episode-2.png',
  '/images/episode-3.png',
  '/images/episode-4.png',
]

const EP_TITLES = [
  'Cold Open',
  'The Long Way Down',
  'Smoke & Mirrors',
  'No Clean Exit',
  'Ghosts of the Line',
  'Terminal Velocity',
  'The Reckoning',
  'Last Light',
  'Fault Lines',
  'Endgame',
]

const EP_DESCRIPTIONS = [
  'A routine assignment turns deadly when an old face resurfaces with a warning nobody wants to hear.',
  'Cornered and out of options, the team gambles everything on a plan that should never have worked.',
  'Buried secrets claw their way to the surface as loyalties are tested to the breaking point.',
  'A quiet night explodes into chaos, and the only way out runs straight through the enemy.',
  'The past refuses to stay dead, forcing a confrontation that has been years in the making.',
  'With time running out, one impossible choice will decide who walks away — and who does not.',
]

function makeSeason(
  seasonNumber: number,
  episodeCount: number,
  maturity: Season['maturity'],
): Season {
  const episodes: Episode[] = Array.from({ length: episodeCount }, (_, i) => {
    const n = i + 1
    return {
      id: `s${seasonNumber}e${n}`,
      number: n,
      title: EP_TITLES[(seasonNumber + i) % EP_TITLES.length],
      description: EP_DESCRIPTIONS[(seasonNumber + i) % EP_DESCRIPTIONS.length],
      duration: `${42 + ((seasonNumber * 3 + i) % 18)}m`,
      still: EPISODE_STILLS[i % EPISODE_STILLS.length],
    }
  })
  return {
    number: seasonNumber,
    name: `Season ${seasonNumber}`,
    maturity,
    contentTags: ['violence', 'language', 'mature themes'],
    episodes,
  }
}

function makeSeasons(count: number, perSeason: number, maturity: Season['maturity']): Season[] {
  return Array.from({ length: count }, (_, i) => makeSeason(i + 1, perSeason, maturity))
}

export const TITLES: Title[] = [
  {
    id: 'ironwood',
    slug: 'ironwood',
    title: 'Ironwood',
    type: 'tv',
    year: 2024,
    rating: 8.7,
    maturity: 'TV-MA',
    quality: '4K',
    genres: ['Action & Adventure', 'Crime', 'Drama'],
    language: 'English',
    tagline: 'Some men are built for the quiet. He was built for the storm.',
    description:
      'Jack Cutter, a decorated ex-military investigator, drifts from town to town carrying nothing but a toothbrush and a talent for trouble. When he steps off a bus into the town of Ironwood, a single murder pulls him into a conspiracy that reaches far beyond the county line.',
    poster: '/images/ironwood-portrait.png',
    backdrop: '/images/ironwood-landscape.png',
    creator: 'Nick Sorrell',
    status: 'Returning Series',
    keywords: ['drifter', 'based on novel', 'conspiracy', 'small town', 'ex-military'],
    cast: castFor(0, [
      'Jack Cutter',
      'Dr. Mara Quinn',
      'Chief Reyes',
      'Eleanor Vale',
      'Detective Sato',
      'Lucia Marin',
    ]),
    seasons: makeSeasons(4, 8, 'TV-MA'),
    similar: ['vanta', 'vega', 'coastline', 'hollow', 'crimson', 'neon'],
    trailers: [
      { id: 't1', title: 'Official Trailer', kind: 'Trailer', thumbnail: '/images/ironwood-landscape.png' },
      { id: 't2', title: 'Prison Brawl Clip', kind: 'Clip', thumbnail: '/images/episode-3.png' },
    ],
    badge: 'New Episode',
    featured: true,
  },
  {
    id: 'neon',
    slug: 'neon-requiem',
    title: 'Neon Requiem',
    type: 'movie',
    year: 2026,
    rating: 7.9,
    maturity: 'R',
    quality: '4K',
    runtime: '2h 12m',
    genres: ['Action & Adventure', 'Sci-Fi', 'Thriller'],
    language: 'English',
    tagline: 'In a city that never sleeps, memory is the only currency left.',
    description:
      'In the drowned megacity of New Halcyon, a burned-out memory-courier discovers the encrypted file in his own head could topple the corporation that owns the rain. Hunted through neon-soaked streets, he has one night to remember who he really is.',
    poster: '/images/neon-portrait.png',
    backdrop: '/images/neon-landscape.png',
    creator: 'Ava Lindqvist',
    status: 'Released',
    keywords: ['cyberpunk', 'dystopia', 'chase', 'neo-noir', 'hacker'],
    cast: castFor(1, [
      'Cassius Vale',
      'Nyx',
      'The Broker',
      'Governor Hale',
      'Ren',
      'Iris',
    ]),
    similar: ['starfall', 'vega', 'vanta', 'ironwood', 'ember', 'hollow'],
    trailers: [
      { id: 't1', title: 'Official Trailer', kind: 'Trailer', thumbnail: '/images/neon-landscape.png' },
      { id: 't2', title: 'Rooftop Chase', kind: 'Clip', thumbnail: '/images/vega-landscape.png' },
    ],
    badge: 'Recently added',
    featured: true,
  },
  {
    id: 'ember',
    slug: 'the-last-ember',
    title: 'The Last Ember',
    type: 'movie',
    year: 2025,
    rating: 8.3,
    maturity: 'PG-13',
    quality: '4K',
    runtime: '2h 28m',
    genres: ['Fantasy', 'Adventure', 'Action & Adventure'],
    language: 'English',
    tagline: 'When the world goes dark, one spark can change everything.',
    description:
      'Long after the Age of Fire faded, a reluctant shepherd inherits the last living ember — a flame prophesied to either rekindle a broken kingdom or burn it to ash. Pursued across frozen wastes by those who would smother the light, she must decide what is worth saving.',
    poster: '/images/ember-portrait.png',
    backdrop: '/images/ember-landscape.png',
    creator: 'Tomas Reyes',
    status: 'Released',
    keywords: ['epic fantasy', 'prophecy', 'quest', 'magic', 'chosen one'],
    cast: castFor(3, ['Aelith', 'Warden Kael', 'The Emberkeeper', 'Queen Solenne', 'Bram', 'Isolde']),
    similar: ['hollow', 'starfall', 'paper', 'neon', 'crimson', 'vanta'],
    trailers: [
      { id: 't1', title: 'Official Trailer', kind: 'Trailer', thumbnail: '/images/ember-landscape.png' },
    ],
    badge: 'Top 10',
    featured: true,
  },
  {
    id: 'vanta',
    slug: 'vanta',
    title: 'Vanta',
    type: 'tv',
    year: 2023,
    rating: 8.1,
    maturity: 'TV-14',
    quality: '4K',
    genres: ['Sci-Fi', 'Drama', 'Thriller'],
    language: 'English',
    tagline: 'The darkest experiments cast the longest shadows.',
    description:
      'When a research facility recovers an object that absorbs all light, the scientists studying it begin to lose their memories one by one. As the darkness spreads, the team must confront the possibility that they are no longer the ones doing the observing.',
    poster: '/images/vanta-portrait.png',
    backdrop: '/images/vanta-landscape.png',
    creator: 'Priya Anand',
    status: 'Returning Series',
    keywords: ['mystery box', 'science', 'psychological', 'anomaly', 'isolation'],
    cast: castFor(2, ['Dr. Mara Quinn', 'Chief Reyes', 'Eleanor Vale', 'Detective Sato', 'Lucia Marin', 'Jack Cutter']),
    seasons: makeSeasons(2, 8, 'TV-14'),
    similar: ['ironwood', 'starfall', 'neon', 'coastline', 'vega', 'hollow'],
    trailers: [
      { id: 't1', title: 'Official Trailer', kind: 'Trailer', thumbnail: '/images/vanta-landscape.png' },
      { id: 't2', title: 'The Anomaly', kind: 'Clip', thumbnail: '/images/starfall-landscape.png' },
    ],
    badge: 'Recently added',
    featured: true,
  },
  {
    id: 'crimson',
    slug: 'crimson-tide-rising',
    title: 'Crimson Tide Rising',
    type: 'movie',
    year: 2026,
    rating: 8.0,
    maturity: 'R',
    quality: '4K',
    runtime: '2h 41m',
    genres: ['Drama', 'Action & Adventure', 'War'],
    language: 'English',
    tagline: 'Every empire is built on the ashes of the last.',
    description:
      'On the eve of a siege that will decide a war, a battle-weary commander and the young conscripts under his command hold a crumbling fortress against impossible odds. A sweeping, intimate epic about the cost of loyalty and the price of glory.',
    poster: '/images/crimson-portrait.png',
    backdrop: '/images/crimson-landscape.png',
    creator: 'Helena Brandt',
    status: 'Released',
    keywords: ['war epic', 'siege', 'historical', 'brotherhood', 'sacrifice'],
    cast: castFor(0, ['General Aldric', 'Field Medic Quinn', 'Sergeant Cole', 'The Empress', 'Scout Sato', 'Lucia']),
    similar: ['ember', 'hollow', 'ironwood', 'neon', 'starfall', 'vega'],
    trailers: [
      { id: 't1', title: 'Official Trailer', kind: 'Trailer', thumbnail: '/images/crimson-landscape.png' },
    ],
    badge: 'Top 10',
    featured: true,
  },
  {
    id: 'starfall',
    slug: 'starfall',
    title: 'Starfall',
    type: 'movie',
    year: 2025,
    rating: 7.6,
    maturity: 'PG-13',
    quality: '4K',
    runtime: '2h 09m',
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    language: 'English',
    tagline: 'Humanity looked up. Something looked back.',
    description:
      'When a derelict colony ship drifts back into the solar system a century after it vanished, a salvage crew boards to claim the wreck — and finds a single survivor who has not aged a day. What they bring home could save humanity, or end it.',
    poster: '/images/starfall-portrait.png',
    backdrop: '/images/starfall-landscape.png',
    creator: 'Ivan Petrov',
    status: 'Released',
    keywords: ['space', 'first contact', 'survival', 'mystery', 'exploration'],
    cast: castFor(4, ['Captain Ryland', 'Nav Officer Quinn', 'Engineer Cole', 'Commander Vale', 'Pilot Sato', 'Lucia']),
    similar: ['neon', 'vanta', 'ember', 'crimson', 'ironwood', 'paper'],
    trailers: [
      { id: 't1', title: 'Official Trailer', kind: 'Trailer', thumbnail: '/images/starfall-landscape.png' },
    ],
    badge: 'Recently added',
  },
  {
    id: 'paper',
    slug: 'paper-kingdoms',
    title: 'Paper Kingdoms',
    type: 'movie',
    year: 2026,
    rating: 7.4,
    maturity: 'PG',
    quality: '4K',
    runtime: '1h 38m',
    genres: ['Animation', 'Comedy', 'Adventure'],
    language: 'English',
    tagline: 'Fold your fears. Unfold your dreams.',
    description:
      'In a world made entirely of folded paper, a clumsy little origami crane sets out to reunite the four torn kingdoms before the great Rainstorm arrives. A colorful, heartfelt animated adventure for the whole family.',
    poster: '/images/paper-portrait.png',
    backdrop: '/images/paper-landscape.png',
    creator: 'Studio Lumen',
    status: 'Released',
    keywords: ['family', 'animated', 'friendship', 'quest', 'heartwarming'],
    cast: castFor(5, ['Pip (voice)', 'Origa (voice)', 'King Fold (voice)', 'Nana Crease (voice)', 'Sketch (voice)', 'Lily (voice)']),
    similar: ['ember', 'starfall', 'understudy', 'hollow', 'neon', 'vanta'],
    trailers: [
      { id: 't1', title: 'Official Trailer', kind: 'Trailer', thumbnail: '/images/paper-landscape.png' },
    ],
    badge: 'Top 10',
  },
  {
    id: 'hollow',
    slug: 'hollow-crown',
    title: 'Hollow Crown',
    type: 'tv',
    year: 2024,
    rating: 8.9,
    maturity: 'TV-MA',
    quality: '4K',
    genres: ['Fantasy', 'Drama', 'Action & Adventure'],
    language: 'English',
    tagline: 'The throne is empty. The dragons are not.',
    description:
      'Two rival houses claw for control of a fractured realm while an ancient dragon stirs beneath the capital. Betrayal, prophecy and fire collide in a sweeping fantasy epic where the crown always costs more than it is worth.',
    poster: '/images/hollow-portrait.png',
    backdrop: '/images/hollow-landscape.png',
    creator: 'Gwen Ashford',
    status: 'Returning Series',
    keywords: ['dragons', 'political intrigue', 'epic fantasy', 'dynasty', 'war'],
    cast: castFor(3, ['Lord Aemon', 'Lady Sera', 'The Hand', 'Queen Regent', 'Ser Davos', 'Mira']),
    seasons: makeSeasons(3, 10, 'TV-MA'),
    similar: ['ember', 'crimson', 'ironwood', 'vanta', 'starfall', 'neon'],
    trailers: [
      { id: 't1', title: 'Season 3 Trailer', kind: 'Trailer', thumbnail: '/images/hollow-landscape.png' },
      { id: 't2', title: 'The Throne Room', kind: 'Clip', thumbnail: '/images/ember-landscape.png' },
    ],
    badge: 'Top 10',
    featured: true,
  },
  {
    id: 'vega',
    slug: 'midnight-in-vega',
    title: 'Midnight in Vega',
    type: 'movie',
    year: 2026,
    rating: 7.7,
    maturity: 'R',
    quality: '4K',
    runtime: '1h 54m',
    genres: ['Thriller', 'Crime', 'Drama'],
    language: 'English',
    tagline: 'The house always wins. Unless you own the house.',
    description:
      'A disgraced card counter is pulled back for one last job: rob the most secure casino in Vega during a single hand of high-stakes poker. But everyone at the table is running a con, and the biggest mark might be him.',
    poster: '/images/vega-portrait.png',
    backdrop: '/images/vega-landscape.png',
    creator: 'Leo Castellano',
    status: 'Released',
    keywords: ['heist', 'neo-noir', 'gambling', 'double cross', 'con'],
    cast: castFor(2, ['Nick Reyes', 'Delilah', 'The Pit Boss', 'Madame Vale', 'Detective Sato', 'Lucia']),
    similar: ['neon', 'ironwood', 'coastline', 'vanta', 'crimson', 'starfall'],
    trailers: [
      { id: 't1', title: 'Official Trailer', kind: 'Trailer', thumbnail: '/images/vega-landscape.png' },
    ],
    badge: 'Recently added',
  },
  {
    id: 'coastline',
    slug: 'coastline',
    title: 'Coastline',
    type: 'tv',
    year: 2023,
    rating: 8.2,
    maturity: 'TV-14',
    quality: 'HD',
    genres: ['Drama', 'Crime'],
    language: 'English',
    tagline: 'Small town. Deep water. Old secrets.',
    description:
      'When a body washes up on the shore of a sleepy fishing village, a returning detective must reconcile the town she left behind with the one hiding a killer. A slow-burn character drama about grief, community and the tide of the past.',
    poster: '/images/coastline-portrait.png',
    backdrop: '/images/coastline-landscape.png',
    creator: 'Fiona Meyer',
    status: 'Ended',
    keywords: ['whodunit', 'small town', 'grief', 'slow burn', 'coastal'],
    cast: castFor(1, ['DI Quinn', 'Chief Reyes', 'Eleanor Vale', 'Detective Sato', 'Lucia Marin', 'Jack Cutter']),
    seasons: makeSeasons(2, 6, 'TV-14'),
    similar: ['ironwood', 'vega', 'vanta', 'hollow', 'crimson', 'neon'],
    trailers: [
      { id: 't1', title: 'Official Trailer', kind: 'Trailer', thumbnail: '/images/coastline-landscape.png' },
    ],
  },
  {
    id: 'understudy',
    slug: 'the-understudy',
    title: 'The Understudy',
    type: 'tv',
    year: 2025,
    rating: 7.5,
    maturity: 'TV-14',
    quality: 'HD',
    genres: ['Comedy', 'Drama'],
    language: 'English',
    tagline: 'Break a leg. Preferably someone else\u2019s.',
    description:
      'A perpetually overlooked understudy finally gets her shot at Broadway stardom — one hilarious catastrophe at a time. A warm, sharp workplace comedy about ambition, friendship and the chaos backstage.',
    poster: '/images/understudy-portrait.png',
    backdrop: '/images/understudy-landscape.png',
    creator: 'Danielle Cho',
    status: 'Returning Series',
    keywords: ['workplace comedy', 'theatre', 'ensemble', 'feel-good', 'friendship'],
    cast: castFor(5, ['Robin', 'Marco', 'Director Cole', 'Diva Vale', 'Stagehand Sato', 'Lucia']),
    seasons: makeSeasons(3, 10, 'TV-14'),
    similar: ['paper', 'coastline', 'vega', 'ironwood', 'hollow', 'starfall'],
    trailers: [
      { id: 't1', title: 'Official Trailer', kind: 'Trailer', thumbnail: '/images/understudy-landscape.png' },
    ],
    badge: 'New Episode',
  },
]

export const TITLE_MAP: Record<string, Title> = Object.fromEntries(
  TITLES.map((t) => [t.id, t]),
)

export function getTitle(id: string): Title | undefined {
  return TITLE_MAP[id]
}

export function getBySlug(slug: string): Title | undefined {
  return TITLES.find((t) => t.slug === slug)
}

export const GENRES = [
  'Action & Adventure',
  'Comedy',
  'Crime',
  'Drama',
  'Fantasy',
  'Sci-Fi',
  'Thriller',
  'Animation',
  'War',
] as const

export const featuredTitles = TITLES.filter((t) => t.featured)

export const HOME_ROWS: Row[] = [
  {
    id: 'trending',
    title: 'Trending Now',
    kind: 'landscape',
    titleIds: ['ironwood', 'neon', 'ember', 'hollow', 'crimson', 'vanta', 'starfall', 'vega'],
  },
  {
    id: 'top10',
    title: 'Top 10 in Webflix Today',
    kind: 'ranked',
    titleIds: ['paper', 'neon', 'ironwood', 'crimson', 'hollow', 'ember', 'vega', 'starfall', 'vanta', 'coastline'],
  },
  {
    id: 'onlyon',
    title: 'Only on Webflix',
    kind: 'landscape',
    titleIds: ['ironwood', 'vanta', 'hollow', 'coastline', 'understudy', 'starfall'],
  },
  {
    id: 'toprated',
    title: 'Top Rated',
    kind: 'landscape',
    filterable: true,
    titleIds: ['hollow', 'ironwood', 'ember', 'coastline', 'crimson', 'neon', 'vega', 'starfall', 'understudy', 'paper', 'vanta'],
  },
  {
    id: 'action',
    title: 'Action & Adventure',
    kind: 'top10',
    titleIds: ['neon', 'ember', 'crimson', 'ironwood', 'hollow', 'starfall'],
  },
  {
    id: 'scifi',
    title: 'Sci-Fi & Beyond',
    kind: 'landscape',
    titleIds: ['starfall', 'neon', 'vanta', 'ember'],
  },
  {
    id: 'comedy',
    title: 'Comedy',
    kind: 'landscape',
    filterable: true,
    titleIds: ['paper', 'understudy', 'vega', 'coastline'],
  },
]

export function filterTitles(opts: {
  type?: 'movie' | 'tv' | 'all'
  genre?: string
  query?: string
  sort?: 'trending' | 'rating' | 'year' | 'az'
}): Title[] {
  let list = [...TITLES]
  if (opts.type && opts.type !== 'all') list = list.filter((t) => t.type === opts.type)
  if (opts.genre && opts.genre !== 'All') list = list.filter((t) => t.genres.includes(opts.genre!))
  if (opts.query) {
    const q = opts.query.toLowerCase()
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.genres.some((g) => g.toLowerCase().includes(q)) ||
        t.keywords.some((k) => k.toLowerCase().includes(q)) ||
        t.cast.some((c) => c.name.toLowerCase().includes(q)),
    )
  }
  switch (opts.sort) {
    case 'rating':
      list.sort((a, b) => b.rating - a.rating)
      break
    case 'year':
      list.sort((a, b) => b.year - a.year)
      break
    case 'az':
      list.sort((a, b) => a.title.localeCompare(b.title))
      break
    default:
      break
  }
  return list
}
