export type MediaType = 'movie' | 'tv'

export type Maturity = 'G' | 'PG' | 'PG-13' | 'R' | 'TV-14' | 'TV-MA'

export type Quality = 'HD' | '4K'

export type TitleBadge = 'Recently Added' | 'New Season' | 'Top 10'

export interface CastMember {
  name: string
  character: string
  photo: string
}

export interface Episode {
  id: string
  number: number
  title: string
  description: string
  duration: string
  still: string
}

export interface Season {
  number: number
  name: string
  maturity: Maturity
  contentTags: string[]
  episodes: Episode[]
}

export interface Trailer {
  id: string
  title: string
  kind: 'Trailer' | 'Clip'
  thumbnail: string
}

export interface Title {
  id: string
  slug: string
  title: string
  type: MediaType
  year: number
  rating: number
  maturity: Maturity
  quality: Quality
  runtime?: string
  genres: string[]
  language: string
  tagline: string
  description: string
  poster: string
  backdrop: string
  creator: string
  status: string
  keywords: string[]
  cast: CastMember[]
  seasons?: Season[]
  similar: string[]
  trailers: Trailer[]
  badges?: TitleBadge[]
  badge?: TitleBadge
  featured?: boolean
}

export interface Row {
  id: string
  title: string
  kind: 'landscape' | 'top10' | 'ranked' | 'billboard'
  titles: Title[]
  filterable?: boolean
  variants?: Partial<Record<MediaType, Pick<Row, 'title' | 'kind' | 'titles'>>>
}
