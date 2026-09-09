export type MediaType = 'movie' | 'tv'

export type Maturity = 'G' | 'PG' | 'PG-13' | 'R' | 'TV-14' | 'TV-MA'

export type Quality = 'HD' | '4K'

export type TitleBadge = 'Recently Added' | 'New Season' | 'Top 10'

export interface CastMember {
  id?: number
  name: string
  character: string
  photo: string
}

export interface ProductionCompany {
  id: number
  name: string
  logo: string
  originCountry?: string
  order?: number
}

export interface ProductionCompanySummary {
  id: number
  name: string
  logo: string
  originCountry?: string
  titleCount: number
}

export interface Episode {
  id: string
  number: number
  title: string
  description: string
  duration: string
  still: string
  releaseDate?: string
}

export interface Season {
  number: number
  name: string
  maturity: Maturity
  contentTags: string[]
  episodes: Episode[]
  releaseDate?: string
  episodesLoaded?: boolean
}

export interface Trailer {
  id: string
  videoKey?: string
  title: string
  kind: 'Trailer' | 'Clip'
  thumbnail: string
  timeline: TrailerColorSample[]
}

export interface TrailerColorSample {
  timestamp: number
  average: string
  left: string
  center: string
  right: string
  top: string
  bottom: string
}

export interface Title {
  id: string
  slug: string
  title: string
  type: MediaType
  year: number
  releaseDate?: string
  rating: number
  maturity: Maturity
  quality: Quality
  runtime?: string
  genres: string[]
  language: string
  tagline: string
  description: string
  poster: string
  logo?: string
  backdrop: string
  dominantColor1?: string | null
  dominantColor2?: string | null
  dominantColor3?: string | null
  upcoming?: boolean
  creator: string
  status: string
  keywords: string[]
  cast: CastMember[]
  productionCompanies?: ProductionCompany[]
  seasons?: Season[]
  similar: string[]
  trailers: Trailer[]
  /** True when this title came from a backend detail-shaped record. */
  detailsLoaded?: boolean
  badges?: TitleBadge[]
  badge?: TitleBadge
  featured?: boolean
  mediaListCategory?: string
  viewCount?: number
  watchProgress?: {
    progressPercent: number
    progressSeconds: number
    durationSeconds: number
    seasonNumber?: number | null
    episodeNumber?: number | null
  }
}

export interface ProgressItem {
  id: string
  mediaType: 'MOVIE' | 'TV'
  tmdbId: number
  seasonNumber?: number | null
  episodeNumber?: number | null
  progressSeconds: number
  durationSeconds: number
  progressPercent: number
}

export interface Personalization {
  continueWatching: ProgressItem[]
  becauseWatched: { title: string; ids: { tmdbId: number; mediaType: 'MOVIE' | 'TV' }[] } | null
  becauseActors: { actors: { id: number; name: string }[]; ids: { tmdbId: number; mediaType: 'MOVIE' | 'TV' }[] } | null
  becauseLiked: { title: string; ids: { tmdbId: number; mediaType: 'MOVIE' | 'TV' }[] } | null
  genres: { id: number; name: string; movieIds: number[]; tvIds: number[] }[]
  titles: Title[]
}

export interface Row {
  id: string
  title: string
  kind: 'landscape' | 'top10' | 'ranked' | 'billboard' | 'showcase'
  titles: Title[]
  addLogo?: boolean
  addText?: boolean
  filterable?: boolean
  variants?: Partial<Record<MediaType, Pick<Row, 'title' | 'kind' | 'titles' | 'addLogo' | 'addText'>>>
}

export interface PersonCredit {
  title: Title
  character?: string
  order?: number
}

export interface PersonPage {
  id: number
  name: string
  biography: string
  photo: string
  knownForDepartment?: string
  birthday?: string
  deathday?: string
  placeOfBirth?: string
  movieCredits: PersonCredit[]
  tvCredits: PersonCredit[]
}

export interface ProductionCompanyPage {
  id: number
  name: string
  logo: string
  originCountry?: string
  movies: Title[]
  tvShows: Title[]
}
