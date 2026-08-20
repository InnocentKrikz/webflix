import 'server-only'

import { prisma } from './prisma'
import { tmdb } from './tmdb'
import type { CastMember, Episode, MediaType, Maturity, Row, Season, Title } from './types'

const POSTER_SIZE = 'w500'
const BACKDROP_SIZE = 'w1280'
const PROFILE_SIZE = 'w185'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'
const MAX_LIST_ITEMS = 14
const MAX_DETAIL_ITEMS = 8
const MAX_SEASONS_WITH_EPISODES = 2
const TITLE_SYNC_CONCURRENCY = 2

type TmdbGenre = {
  id: number
  name: string
}

type TmdbVideo = {
  id: string
  key: string
  name: string
  site: string
  type: string
}

type TmdbCast = {
  id: number
  name: string
  character?: string
  profile_path?: string | null
}

type TmdbMovie = {
  id: number
  title: string
  original_title?: string
  overview?: string
  tagline?: string
  poster_path?: string | null
  backdrop_path?: string | null
  release_date?: string
  runtime?: number | null
  vote_average?: number
  vote_count?: number
  popularity?: number
  status?: string
  original_language?: string
  adult?: boolean
  genre_ids?: number[]
  genres?: TmdbGenre[]
  media_type?: string
  credits?: { cast?: TmdbCast[] }
  videos?: { results?: TmdbVideo[] }
}

type TmdbTvShow = {
  id: number
  name: string
  original_name?: string
  overview?: string
  tagline?: string
  poster_path?: string | null
  backdrop_path?: string | null
  first_air_date?: string
  last_air_date?: string
  number_of_seasons?: number
  number_of_episodes?: number
  vote_average?: number
  vote_count?: number
  popularity?: number
  status?: string
  original_language?: string
  genre_ids?: number[]
  genres?: TmdbGenre[]
  seasons?: TmdbSeason[]
  media_type?: string
  credits?: { cast?: TmdbCast[] }
  videos?: { results?: TmdbVideo[] }
}

type TmdbSeason = {
  id: number
  season_number: number
  name?: string
  overview?: string
  poster_path?: string | null
  air_date?: string
  episode_count?: number
  episodes?: TmdbEpisode[]
}

type TmdbEpisode = {
  id: number
  episode_number: number
  name?: string
  overview?: string
  still_path?: string | null
  air_date?: string
  runtime?: number | null
  vote_average?: number
  vote_count?: number
}

type TmdbListResponse<T> = {
  results?: T[]
}

type MovieRecord = Awaited<ReturnType<typeof prisma.movie.findFirst>>
type TvRecord = Awaited<ReturnType<typeof prisma.tVShow.findFirst>>

type TitleFilters = {
  type?: MediaType | 'all'
  genre?: string
  query?: string
  sort?: 'trending' | 'rating' | 'year' | 'az'
  ids?: string[]
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
) {
  const results: R[] = []

  for (let index = 0; index < items.length; index += limit) {
    const batch = items.slice(index, index + limit)
    const batchResults = await Promise.all(
      batch.map((item, batchIndex) => mapper(item, index + batchIndex)),
    )
    results.push(...batchResults)
  }

  return results
}

const genreUpserts = new Map<number, Promise<{ id: number; tmdbId: number; name: string }>>()

const includeMovie = {
  genres: {
    include: {
      genre: true,
    },
  },
} as const

const includeTvShow = {
  genres: {
    include: {
      genre: true,
    },
  },
  seasons: {
    orderBy: {
      seasonNumber: 'asc' as const,
    },
    include: {
      episodes: {
        orderBy: {
          episodeNumber: 'asc' as const,
        },
      },
    },
  },
} as const

function imageUrl(path: string | null | undefined, size: string) {
  return path ? `${IMAGE_BASE_URL}/${size}${path}` : '/placeholder.svg'
}

function parseDate(value: string | null | undefined) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function titleId(type: MediaType, tmdbId: number) {
  return `${type}-${tmdbId}`
}

function titleSlug(type: MediaType, tmdbId: number, name: string) {
  return `${type}-${tmdbId}-${slugify(name)}`
}

function parseTitleRef(ref: string): { type: MediaType; tmdbId: number } | null {
  const match = ref.match(/^(movie|tv)-(\d+)/)
  if (!match) return null
  return { type: match[1] as MediaType, tmdbId: Number(match[2]) }
}

function yearFromDate(date: Date | null | undefined) {
  return date ? date.getUTCFullYear() : new Date().getUTCFullYear()
}

function runtimeLabel(minutes: number | null | undefined, fallback = '1h 40m') {
  if (!minutes) return fallback
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (!hours) return `${mins}m`
  return `${hours}h ${mins}m`
}

function maturityFor(type: MediaType, adult?: boolean | null): Maturity {
  if (adult) return type === 'tv' ? 'TV-MA' : 'R'
  return type === 'tv' ? 'TV-14' : 'PG-13'
}

function compact<T>(values: (T | null | undefined | false)[]) {
  return values.filter(Boolean) as T[]
}

function uniqueTitles(titles: Title[]) {
  const seen = new Set<string>()
  return titles.filter((title) => {
    if (seen.has(title.id)) return false
    seen.add(title.id)
    return true
  })
}

function sortTitles(titles: Title[], sort: TitleFilters['sort']) {
  const sorted = [...titles]
  switch (sort) {
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating)
      break
    case 'year':
      sorted.sort((a, b) => b.year - a.year)
      break
    case 'az':
      sorted.sort((a, b) => a.title.localeCompare(b.title))
      break
    default:
      break
  }
  return sorted
}

async function genreMap(type: MediaType) {
  const response = (type === 'movie'
    ? await tmdb.genres.movies()
    : await tmdb.genres.tv()) as { genres?: TmdbGenre[] }

  await upsertGenreRelations(response.genres ?? [])

  return new Map((response.genres ?? []).map((genre) => [genre.id, genre.name]))
}

async function genresFromTmdb(type: MediaType, item: TmdbMovie | TmdbTvShow) {
  if (item.genres?.length) return item.genres
  if (!item.genre_ids?.length) return []
  const names = await genreMap(type)
  return item.genre_ids.map((id) => ({ id, name: names.get(id) ?? String(id) }))
}

async function upsertGenreRelations(genres: TmdbGenre[]) {
  const uniqueGenres = [...new Map(genres.map((genre) => [genre.id, genre])).values()]

  return mapWithConcurrency(uniqueGenres, 1, async (genre) => {
    const cached = genreUpserts.get(genre.id)
    if (cached) return cached

    const upsert = prisma.genre
      .upsert({
        where: { tmdbId: genre.id },
        create: { tmdbId: genre.id, name: genre.name },
        update: { name: genre.name },
      })
      .catch((error) => {
        genreUpserts.delete(genre.id)
        throw error
      })

    genreUpserts.set(genre.id, upsert)
    return upsert
  })
}

async function syncMovie(item: TmdbMovie) {
  const genres = await upsertGenreRelations(await genresFromTmdb('movie', item))
  const data = {
    tmdbId: item.id,
    title: item.title,
    originalTitle: item.original_title,
    overview: item.overview,
    tagline: item.tagline,
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    releaseDate: parseDate(item.release_date),
    runtime: item.runtime,
    voteAverage: item.vote_average,
    voteCount: item.vote_count,
    popularity: item.popularity,
    status: item.status,
    originalLanguage: item.original_language,
    adult: item.adult ?? false,
    lastSyncedAt: new Date(),
  }

  return data
  
  const findMovie = await prisma.movie.findFirst({
    where: { tmdbId: item.id, lastSyncedAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } },
    include: includeMovie,
  })

  if (findMovie) {
    return findMovie
  }

  return prisma.movie.upsert({
    where: { tmdbId: item.id },
    create: {
      ...data,
      genres: {
        create: genres.map((genre) => ({ genre: { connect: { id: genre.id } } })),
      },
    },
    update: {
      ...data,
      genres: {
        deleteMany: {},
        create: genres.map((genre) => ({ genre: { connect: { id: genre.id } } })),
      },
    },
    include: includeMovie,
  })
}

async function syncTvShow(item: TmdbTvShow, includeEpisodes = false) {
  const genres = await upsertGenreRelations(await genresFromTmdb('tv', item))
  const data = {
    tmdbId: item.id,
    name: item.name,
    originalName: item.original_name,
    overview: item.overview,
    tagline: item.tagline,
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    firstAirDate: parseDate(item.first_air_date),
    lastAirDate: parseDate(item.last_air_date),
    numberOfSeasons: item.number_of_seasons,
    numberOfEpisodes: item.number_of_episodes,
    voteAverage: item.vote_average,
    voteCount: item.vote_count,
    popularity: item.popularity,
    status: item.status,
    originalLanguage: item.original_language,
    lastSyncedAt: new Date(),
  }

  return data

  const findTvShow = await prisma.tVShow.findFirst({
    where: { tmdbId: item.id, lastSyncedAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } },
    include: includeTvShow,
  })

  if (findTvShow) {
    console.log(`TV Show ${item.name} (TMDB ID: ${item.id}) is already synced within the last 6 hours.`)
    return findTvShow
  }

  const tvShow = await prisma.tVShow.upsert({
    where: { tmdbId: item.id },
    create: {
      ...data,
      genres: {
        create: genres.map((genre) => ({ genre: { connect: { id: genre.id } } })),
      },
    },
    update: {
      ...data,
      genres: {
        deleteMany: {},
        create: genres.map((genre) => ({ genre: { connect: { id: genre.id } } })),
      },
    },
  })

  const seasons = item.seasons?.filter((season) => season.season_number > 0) ?? []
  for (const season of seasons) {
    const seasonDetails =
      includeEpisodes && season.season_number <= MAX_SEASONS_WITH_EPISODES
        ? ((await tmdb.tv.seasonDetails(item.id, season.season_number)) as TmdbSeason)
        : season

    const savedSeason = await prisma.season.upsert({
      where: {
        tvShowId_seasonNumber: {
          tvShowId: tvShow.id,
          seasonNumber: season.season_number,
        },
      },
      create: {
        tmdbId: seasonDetails.id,
        seasonNumber: seasonDetails.season_number,
        name: seasonDetails.name,
        overview: seasonDetails.overview,
        posterPath: seasonDetails.poster_path,
        airDate: parseDate(seasonDetails.air_date),
        episodeCount: seasonDetails.episode_count ?? seasonDetails.episodes?.length,
        tvShowId: tvShow.id,
      },
      update: {
        tmdbId: seasonDetails.id,
        name: seasonDetails.name,
        overview: seasonDetails.overview,
        posterPath: seasonDetails.poster_path,
        airDate: parseDate(seasonDetails.air_date),
        episodeCount: seasonDetails.episode_count ?? seasonDetails.episodes?.length,
      },
    })

    if (includeEpisodes && seasonDetails.episodes?.length) {
      for (const episode of seasonDetails.episodes) {
        await prisma.episode.upsert({
          where: {
            seasonId_episodeNumber: {
              seasonId: savedSeason.id,
              episodeNumber: episode.episode_number,
            },
          },
          create: {
            tmdbId: episode.id,
            episodeNumber: episode.episode_number,
            name: episode.name,
            overview: episode.overview,
            stillPath: episode.still_path,
            airDate: parseDate(episode.air_date),
            runtime: episode.runtime,
            voteAverage: episode.vote_average,
            voteCount: episode.vote_count,
            seasonId: savedSeason.id,
          },
          update: {
            tmdbId: episode.id,
            name: episode.name,
            overview: episode.overview,
            stillPath: episode.still_path,
            airDate: parseDate(episode.air_date),
            runtime: episode.runtime,
            voteAverage: episode.vote_average,
            voteCount: episode.vote_count,
          },
        })
      }
    }
  }

  return prisma.tVShow.findUniqueOrThrow({
    where: { id: tvShow.id },
    include: includeTvShow,
  })
}

function movieToTitle(movie: NonNullable<MovieRecord> & { genres?: { genre: TmdbGenre }[] }): Title {
  const title = movie.title
  const releaseYear = yearFromDate(movie.releaseDate)
  const genres = movie.genres?.map((entry) => entry.genre.name) ?? []

  return {
    id: titleId('movie', movie.tmdbId),
    slug: titleSlug('movie', movie.tmdbId, title),
    title,
    type: 'movie',
    year: releaseYear,
    rating: movie.voteAverage ?? 0,
    maturity: maturityFor('movie', movie.adult),
    quality: movie.backdropPath ? '4K' : 'HD',
    runtime: runtimeLabel(movie.runtime),
    genres,
    language: (movie.originalLanguage ?? 'en').toUpperCase(),
    tagline: movie.tagline ?? '',
    description: movie.overview ?? 'No overview is available from TMDB yet.',
    poster: imageUrl(movie.posterPath, POSTER_SIZE),
    backdrop: imageUrl(movie.backdropPath, BACKDROP_SIZE),
    creator: movie.originalTitle ?? title,
    status: movie.status ?? 'Released',
    keywords: genres,
    cast: [],
    similar: [],
    trailers: [],
    badge: movie.popularity && movie.popularity > 100 ? 'Top 10' : undefined,
  }
}

function tvToTitle(tvShow: NonNullable<TvRecord> & { genres?: { genre: TmdbGenre }[]; seasons?: any[] }): Title {
  const title = tvShow.name
  const firstYear = yearFromDate(tvShow.firstAirDate)
  const genres = tvShow.genres?.map((entry) => entry.genre.name) ?? []
  const seasons: Season[] = (tvShow.seasons ?? []).map((season) => ({
    number: season.seasonNumber,
    name: season.name ?? `Season ${season.seasonNumber}`,
    maturity: maturityFor('tv'),
    contentTags: genres,
    episodes: (season.episodes ?? []).map(
      (episode: any): Episode => ({
        id: `${season.id}-${episode.episodeNumber}`,
        number: episode.episodeNumber,
        title: episode.name ?? `Episode ${episode.episodeNumber}`,
        description: episode.overview ?? '',
        duration: runtimeLabel(episode.runtime, '45m'),
        still: imageUrl(episode.stillPath ?? tvShow.backdropPath, BACKDROP_SIZE),
      }),
    ),
  }))

  return {
    id: titleId('tv', tvShow.tmdbId),
    slug: titleSlug('tv', tvShow.tmdbId, title),
    title,
    type: 'tv',
    year: firstYear,
    rating: tvShow.voteAverage ?? 0,
    maturity: maturityFor('tv'),
    quality: tvShow.backdropPath ? '4K' : 'HD',
    genres,
    language: (tvShow.originalLanguage ?? 'en').toUpperCase(),
    tagline: tvShow.tagline ?? '',
    description: tvShow.overview ?? 'No overview is available from TMDB yet.',
    poster: imageUrl(tvShow.posterPath, POSTER_SIZE),
    backdrop: imageUrl(tvShow.backdropPath, BACKDROP_SIZE),
    creator: tvShow.originalName ?? title,
    status: tvShow.status ?? 'Released',
    keywords: genres,
    cast: [],
    seasons,
    similar: [],
    trailers: [],
    badge: tvShow.popularity && tvShow.popularity > 100 ? 'Top 10' : undefined,
  }
}

function addDetailFields(title: Title, item: TmdbMovie | TmdbTvShow): Title {
  const cast: CastMember[] =
    item.credits?.cast?.slice(0, 8).map((member) => ({
      name: member.name,
      character: member.character ?? member.name,
      photo: imageUrl(member.profile_path, PROFILE_SIZE),
    })) ?? []

  const trailers =
    item.videos?.results
      ?.filter((video) => video.site === 'YouTube' && ['Trailer', 'Teaser', 'Clip'].includes(video.type))
      .slice(0, 6)
      .map((video) => ({
        id: video.id,
        title: video.name,
        kind: video.type === 'Clip' ? ('Clip' as const) : ('Trailer' as const),
        thumbnail: title.backdrop,
      })) ?? []

  return {
    ...title,
    cast,
    trailers,
    keywords: compact([item.status, item.original_language?.toUpperCase(), ...title.genres]).slice(0, 6),
    featured: Boolean(title.backdrop && title.backdrop !== '/placeholder.svg'),
  }
}

async function titleFromMovie(item: TmdbMovie, detailed = false) {
  const source = detailed ? ((await tmdb.movies.details(item.id)) as TmdbMovie) : item
  const movie = await syncMovie({ ...item, ...source })
  const title = movieToTitle(movie)
  return detailed ? addDetailFields(title, source) : title
}

async function titleFromTvShow(item: TmdbTvShow, detailed = false) {
  const source = detailed ? ((await tmdb.tv.details(item.id)) as TmdbTvShow) : item
  const tvShow = await syncTvShow({ ...item, ...source }, detailed)
  const title = tvToTitle(tvShow)
  return detailed ? addDetailFields(title, source) : title
}

async function titlesFromList<T extends TmdbMovie | TmdbTvShow>(
  type: MediaType,
  response: TmdbListResponse<T>,
  detailed = false,
) {
  const items = (response.results ?? []).filter((item) => item.poster_path || item.backdrop_path)
  const limited = items.slice(0, detailed ? MAX_DETAIL_ITEMS : MAX_LIST_ITEMS)
  const titles = await mapWithConcurrency(
    limited,
    TITLE_SYNC_CONCURRENCY,
    (item) => (type === 'movie' ? titleFromMovie(item as TmdbMovie, detailed) : titleFromTvShow(item as TmdbTvShow, detailed)),
  )
  return titles
}

async function mixedTitlesFromList(response: TmdbListResponse<TmdbMovie | TmdbTvShow>, detailed = false) {
  const items = (response.results ?? []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
  const limited = items.slice(0, detailed ? MAX_DETAIL_ITEMS : MAX_LIST_ITEMS)
  const titles = await mapWithConcurrency(
    limited,
    TITLE_SYNC_CONCURRENCY,
    (item) =>
      item.media_type === 'movie'
        ? titleFromMovie(item as TmdbMovie, detailed)
        : titleFromTvShow(item as TmdbTvShow, detailed),
  )
  return titles
}

async function baseCatalog() {
  const [
    trendingAll,
    trendingMovies,
    popularMovies,
    nowPlayingMovies,
    topRatedMovies,
    trendingTv,
    popularTv,
    onAirTv,
    topRatedTv,
  ] = await Promise.all([
    tmdb.trending.all('day') as Promise<TmdbListResponse<TmdbMovie | TmdbTvShow>>,
    tmdb.movies.trending('week') as Promise<TmdbListResponse<TmdbMovie>>,
    tmdb.movies.popular() as Promise<TmdbListResponse<TmdbMovie>>,
    tmdb.movies.nowPlaying() as Promise<TmdbListResponse<TmdbMovie>>,
    tmdb.movies.topRated() as Promise<TmdbListResponse<TmdbMovie>>,
    tmdb.tv.trending('week') as Promise<TmdbListResponse<TmdbTvShow>>,
    tmdb.tv.popular() as Promise<TmdbListResponse<TmdbTvShow>>,
    tmdb.tv.nowPlaying() as Promise<TmdbListResponse<TmdbTvShow>>,
    tmdb.tv.topRated() as Promise<TmdbListResponse<TmdbTvShow>>,
  ])

  const groups = await mapWithConcurrency(
    [
      () => mixedTitlesFromList(trendingAll),
      () => titlesFromList('movie', trendingMovies),
      () => titlesFromList('movie', popularMovies),
      () => titlesFromList('movie', nowPlayingMovies),
      () => titlesFromList('movie', topRatedMovies),
      () => titlesFromList('tv', trendingTv),
      () => titlesFromList('tv', popularTv),
      () => titlesFromList('tv', onAirTv),
      () => titlesFromList('tv', topRatedTv),
    ],
    1,
    (load) => load(),
  )

  return uniqueTitles(groups.flat())
}

export async function getHomeData() {
  console.log('Fetching home data from TMDB...')
  const [
    trendingAll,
    popularMovies,
    topRatedMovies,
    nowPlayingMovies,
    popularTv,
    topRatedTv,
    onAirTv,
  ] = await Promise.all([
    tmdb.trending.all('day') as Promise<TmdbListResponse<TmdbMovie | TmdbTvShow>>,
    tmdb.movies.popular() as Promise<TmdbListResponse<TmdbMovie>>,
    tmdb.movies.topRated() as Promise<TmdbListResponse<TmdbMovie>>,
    tmdb.movies.nowPlaying() as Promise<TmdbListResponse<TmdbMovie>>,
    tmdb.tv.popular() as Promise<TmdbListResponse<TmdbTvShow>>,
    tmdb.tv.topRated() as Promise<TmdbListResponse<TmdbTvShow>>,
    tmdb.tv.nowPlaying() as Promise<TmdbListResponse<TmdbTvShow>>,
  ])

  const [
    featuredTitles,
    popularMovieTitles,
    topMovieTitles,
    nowPlayingMovieTitles,
    popularTvTitles,
    topTvTitles,
    onAirTvTitles,
  ] = await mapWithConcurrency(
    [
      () => mixedTitlesFromList(trendingAll, true),
      () => titlesFromList('movie', popularMovies),
      () => titlesFromList('movie', topRatedMovies),
      () => titlesFromList('movie', nowPlayingMovies),
      () => titlesFromList('tv', popularTv),
      () => titlesFromList('tv', topRatedTv),
      () => titlesFromList('tv', onAirTv),
    ],
    1,
    (load) => load(),
  )

  const rows: Row[] = [
    { id: 'popular-movies', title: 'Popular Movies', kind: 'landscape', titles: popularMovieTitles },
    { id: 'top-movies', title: 'Top Rated Movies', kind: 'ranked', titles: topMovieTitles },
    { id: 'now-playing', title: 'Now Playing', kind: 'landscape', titles: nowPlayingMovieTitles },
    { id: 'popular-series', title: 'Popular Series', kind: 'landscape', titles: popularTvTitles },
    { id: 'top-series', title: 'Top Rated Series', kind: 'top10', titles: topTvTitles },
    { id: 'on-tv', title: 'On TV', kind: 'landscape', titles: onAirTvTitles },
  ]

  return {
    featuredTitles: featuredTitles.slice(0, 5),
    rows,
    titles: uniqueTitles([...featuredTitles, ...rows.flatMap((row) => row.titles)]),
  }
}

export async function getGenres(type: MediaType | 'all' = 'all') {
  if (type === 'all') {
    const [movieGenres, tvGenres] = await Promise.all([genreMap('movie'), genreMap('tv')])
    return [...new Set([...movieGenres.values(), ...tvGenres.values()])].sort()
  }

  return [...(await genreMap(type)).values()].sort()
}

export async function getTitles(filters: TitleFilters = {}) {
  if (filters.ids?.length) {
    const titles = await Promise.all(filters.ids.map((id) => getTitle(id)))
    return compact(titles)
  }

  let titles: Title[]
  if (filters.query?.trim()) {
    const query = filters.query.trim()
    const [movies, tvShows] = await Promise.all([
      tmdb.searchMovie(query) as Promise<TmdbListResponse<TmdbMovie>>,
      tmdb.searchTV(query) as Promise<TmdbListResponse<TmdbTvShow>>,
    ])
    titles = uniqueTitles([
      ...(filters.type !== 'tv' ? await titlesFromList('movie', movies) : []),
      ...(filters.type !== 'movie' ? await titlesFromList('tv', tvShows) : []),
    ])
  } else {
    titles = await baseCatalog()
  }

  if (filters.type && filters.type !== 'all') {
    titles = titles.filter((title) => title.type === filters.type)
  }

  if (filters.genre && filters.genre !== 'All') {
    titles = titles.filter((title) => title.genres.includes(filters.genre!))
  }

  return sortTitles(titles, filters.sort)
}

export async function getTitle(ref: string) {
  const parsed = parseTitleRef(ref)
  if (!parsed) return undefined

  if (parsed.type === 'movie') {
    const movie = (await tmdb.movies.details(parsed.tmdbId)) as TmdbMovie
    return titleFromMovie(movie, true)
  }

  const tvShow = (await tmdb.tv.details(parsed.tmdbId)) as TmdbTvShow
  return titleFromTvShow(tvShow, true)
}

export async function getBySlug(slug: string) {
  return getTitle(slug)
}
