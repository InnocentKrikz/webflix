import "server-only";

import { tmdb } from "./tmdb";
import type {
  CastMember,
  Episode,
  MediaType,
  Maturity,
  Quality,
  Row,
  Season,
  Title,
  TitleBadge,
  Trailer,
} from "./types";

const POSTER_SIZE = "w500";
const BACKDROP_SIZE = "w1280";
const PROFILE_SIZE = "w185";
const STILL_SIZE = "w300";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

const MAX_GRID_TITLES = 42;
const MAX_ROW_TITLES = 14;
const MAX_FEATURED_TITLES = 5;
const MAX_CAST = 12;
const MAX_TRAILERS = 6;
const MAX_SEASONS = 3;
const MAX_EPISODES = 10;
const RECENT_BADGE_WINDOW_DAYS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type SortOption = "trending" | "rating" | "year" | "az";
type BrowserType = MediaType | "all";

type ApiStatusResponse = {
  status?: string;
  results?: unknown;
};

type ApiGenre = {
  id?: number;
  tmdbId?: number;
  name?: string;
};

type ApiGenreJoin = {
  genre?: ApiGenre;
};

type ApiPerson = {
  id?: number;
  tmdbId?: number;
  name?: string;
  original_name?: string;
  profilePath?: string | null;
  profile_path?: string | null;
};

type ApiCast = {
  id?: number | string;
  character?: string | null;
  castOrder?: number | null;
  order?: number | null;
  person?: ApiPerson;
  name?: string;
  original_name?: string;
  profilePath?: string | null;
  profile_path?: string | null;
};

type ApiVideo = {
  id?: number | string;
  videoType?: string;
  type?: string;
  key?: string;
  name?: string;
  site?: string;
  official?: boolean;
  publishedAt?: string | null;
  published_at?: string | null;
};

type ApiContentRating = {
  countryCode?: string;
  iso_3166_1?: string;
  rating?: string;
  results?: { rating?: string }[];
  release_dates?: { certification?: string }[];
};

type ApiEpisode = {
  id?: number;
  tmdbId?: number;
  episodeNumber?: number;
  episode_number?: number;
  name?: string | null;
  title?: string | null;
  overview?: string | null;
  stillPath?: string | null;
  still_path?: string | null;
  airDate?: string | null;
  air_date?: string | null;
  runtime?: number | null;
};

type ApiSeason = {
  id?: number;
  tmdbId?: number;
  seasonNumber?: number;
  season_number?: number;
  name?: string | null;
  overview?: string | null;
  posterPath?: string | null;
  poster_path?: string | null;
  airDate?: string | null;
  air_date?: string | null;
  episodeCount?: number | null;
  episode_count?: number | null;
  episodes?: ApiEpisode[];
};

type ApiMovie = {
  id?: number;
  tmdbId?: number;
  title?: string;
  originalTitle?: string | null;
  original_title?: string | null;
  overview?: string | null;
  tagline?: string | null;
  posterPath?: string | null;
  poster_path?: string | null;
  backdropPath?: string | null;
  backdrop_path?: string | null;
  releaseDate?: string | null;
  release_date?: string | null;
  runtime?: number | null;
  voteAverage?: number | null;
  vote_average?: number | null;
  voteCount?: number | null;
  vote_count?: number | null;
  popularity?: number | null;
  status?: string | null;
  originalLanguage?: string | null;
  original_language?: string | null;
  adult?: boolean;
  genres?: (ApiGenreJoin | ApiGenre)[];
  cast?: ApiCast[];
  videos?: ApiVideo[] | { results?: ApiVideo[] };
  contentRatings?: ApiContentRating[];
  release_dates?: { results?: ApiContentRating[] };
  credits?: { cast?: ApiCast[]; crew?: { name?: string; job?: string }[] };
  spoken_languages?: { english_name?: string; name?: string }[];
};

type ApiTvShow = {
  id?: number;
  tmdbId?: number;
  name?: string;
  originalName?: string | null;
  original_name?: string | null;
  overview?: string | null;
  tagline?: string | null;
  posterPath?: string | null;
  poster_path?: string | null;
  backdropPath?: string | null;
  backdrop_path?: string | null;
  firstAirDate?: string | null;
  first_air_date?: string | null;
  lastAirDate?: string | null;
  last_air_date?: string | null;
  runtime?: number | null;
  episode_run_time?: number[];
  voteAverage?: number | null;
  vote_average?: number | null;
  voteCount?: number | null;
  vote_count?: number | null;
  popularity?: number | null;
  status?: string | null;
  originalLanguage?: string | null;
  original_language?: string | null;
  adult?: boolean;
  numberOfSeasons?: number | null;
  number_of_seasons?: number | null;
  numberOfEpisodes?: number | null;
  number_of_episodes?: number | null;
  genres?: (ApiGenreJoin | ApiGenre)[];
  cast?: ApiCast[];
  videos?: ApiVideo[] | { results?: ApiVideo[] };
  contentRatings?: ApiContentRating[];
  content_ratings?: { results?: ApiContentRating[] };
  credits?: { cast?: ApiCast[]; crew?: { name?: string; job?: string }[] };
  created_by?: { name?: string }[];
  seasons?: ApiSeason[];
  spoken_languages?: { english_name?: string; name?: string }[];
};

type ApiMediaListItem = {
  id?: number;
  tmdbId?: number;
  index?: number;
  mediaType?: "MOVIE" | "TV" | "movie" | "tv";
  category?: string | null;
  movie?: ApiMovie | null;
  tvShow?: ApiTvShow | null;
};

type ApiMedia = ApiMovie | ApiTvShow;

function isStatusResponse(value: unknown): value is ApiStatusResponse {
  return Boolean(value && typeof value === "object" && "results" in value);
}

function unwrapResults<T>(value: unknown): T {
  return (isStatusResponse(value) ? value.results : value) as T;
}

async function readList(request: Promise<unknown>): Promise<ApiMediaListItem[]> {
  try {
    const results = unwrapResults<unknown>(await request);
    return Array.isArray(results) ? (results as ApiMediaListItem[]) : [];
  } catch {
    return [];
  }
}

async function readMedia<T extends ApiMedia>(request: Promise<unknown>): Promise<T | null> {
  try {
    const result = unwrapResults<unknown>(await request);
    return result && typeof result === "object" ? (result as T) : null;
  } catch {
    return null;
  }
}

function imageUrl(path: string | null | undefined, size: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

function yearFrom(value: string | null | undefined): number {
  if (!value) return new Date().getUTCFullYear();
  const year = new Date(value).getUTCFullYear();
  return Number.isFinite(year) ? year : new Date().getUTCFullYear();
}

function isWithinPastDays(value: string | null | undefined, days: number): boolean {
  if (!value) return false;

  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return false;

  const diff = Date.now() - time;
  return diff >= 0 && diff <= days * DAY_IN_MS;
}

function formatRuntime(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return "1h 40m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

function slugify(title: string, type: MediaType, tmdbId: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${base || type}-${type}-${tmdbId}`;
}

function maturityFromRating(value: string | null | undefined, type: MediaType): Maturity {
  if (!value) return type === "tv" ? "TV-14" : "PG-13";

  const normalized = value.toUpperCase();
  if (["G", "PG", "PG-13", "R", "TV-14", "TV-MA"].includes(normalized)) {
    return normalized as Maturity;
  }

  if (normalized === "NC-17") return "R";
  if (normalized === "18" || normalized === "15") return type === "tv" ? "TV-MA" : "R";
  if (normalized === "12" || normalized === "12A") return "PG-13";
  if (normalized === "U") return "G";

  return type === "tv" ? "TV-14" : "PG-13";
}

function movieRating(movie: ApiMovie): string | undefined {
  const countries = movie.release_dates?.results ?? movie.contentRatings ?? [];
  const preferred = countries.find((item) => item.iso_3166_1 === "US") ?? countries.find((item) => item.iso_3166_1 === "GB");
  const releaseRating = preferred?.release_dates?.find((date) => date.certification)?.certification;
  return releaseRating ?? preferred?.rating;
}

function tvRating(tv: ApiTvShow): string | undefined {
  const ratings = tv.content_ratings?.results ?? tv.contentRatings ?? [];
  const preferred = ratings.find((item) => item.iso_3166_1 === "US" || item.countryCode === "US")
    ?? ratings.find((item) => item.iso_3166_1 === "GB" || item.countryCode === "GB");
  return preferred?.rating ?? preferred?.results?.find((item) => item.rating)?.rating;
}

function mapGenres(genres: (ApiGenreJoin | ApiGenre)[] = []): string[] {
  return genres
    .map((item) => {
      if ("genre" in item && item.genre) return item.genre;
      return item as ApiGenre;
    })
    .map((genre) => genre?.name)
    .filter((name): name is string => Boolean(name));
}

function mapCast(cast: ApiCast[] = []): CastMember[] {
  return [...cast]
    .sort((a, b) => (a.castOrder ?? a.order ?? 999) - (b.castOrder ?? b.order ?? 999))
    .slice(0, MAX_CAST)
    .map((item) => {
      const person = item.person ?? item;

      return {
        name: person.name ?? person.original_name ?? "Unknown",
        character: item.character ?? "",
        photo: imageUrl(person.profilePath ?? person.profile_path, PROFILE_SIZE),
      };
    });
}

function videoList(videos: ApiMovie["videos"] | ApiTvShow["videos"]): ApiVideo[] {
  if (Array.isArray(videos)) return videos;
  return videos?.results ?? [];
}

function mapTrailers(videos: ApiMovie["videos"] | ApiTvShow["videos"]): Trailer[] {
  return videoList(videos)
    .filter((video) => video.key && video.site === "YouTube")
    .slice(0, MAX_TRAILERS)
    .map((video, index) => {
      const type = video.videoType ?? video.type ?? "Clip";
      const kind: Trailer["kind"] = type === "Trailer" ? "Trailer" : "Clip";
      const key = video.key ?? "";

      return {
        id: String(video.id ?? key ?? index),
        title: video.name ?? kind,
        kind,
        thumbnail: key ? `https://img.youtube.com/vi/${key}/hqdefault.jpg` : "",
      };
    });
}

function mapEpisodes(episodes: ApiEpisode[] = [], seasonPoster = ""): Episode[] {
  return [...episodes]
    .sort((a, b) => (a.episodeNumber ?? a.episode_number ?? 0) - (b.episodeNumber ?? b.episode_number ?? 0))
    .slice(0, MAX_EPISODES)
    .map((episode, index) => ({
      id: String(episode.id ?? episode.tmdbId ?? index),
      number: episode.episodeNumber ?? episode.episode_number ?? index + 1,
      title: episode.name ?? episode.title ?? `Episode ${index + 1}`,
      description: episode.overview || "Episode details are coming soon.",
      duration: formatRuntime(episode.runtime),
      still: imageUrl(episode.stillPath ?? episode.still_path, STILL_SIZE) || seasonPoster,
    }));
}

function mapSeasons(seasons: ApiSeason[] = [], maturity: Maturity, fallbackPoster = ""): Season[] {
  return seasons
    .filter((season) => (season.seasonNumber ?? season.season_number ?? 0) > 0)
    .sort((a, b) => (a.seasonNumber ?? a.season_number ?? 0) - (b.seasonNumber ?? b.season_number ?? 0))
    .slice(0, MAX_SEASONS)
    .map((season, index) => {
      const number = season.seasonNumber ?? season.season_number ?? index + 1;
      const poster = imageUrl(season.posterPath ?? season.poster_path, POSTER_SIZE) || fallbackPoster;
      const episodes = mapEpisodes(season.episodes, poster);
      const episodeCount = season.episodeCount ?? season.episode_count ?? episodes.length;

      return {
        number,
        name: season.name ?? `Season ${number}`,
        maturity,
        contentTags: episodeCount ? [`${episodeCount} Episodes`] : ["Episodes"],
        episodes: episodes.length > 0 ? episodes : createPlaceholderEpisodes(episodeCount || 6, poster),
      };
    });
}

function createPlaceholderEpisodes(count: number, still: string): Episode[] {
  return Array.from({ length: Math.min(count, MAX_EPISODES) }, (_, index) => ({
    id: `episode-${index + 1}`,
    number: index + 1,
    title: `Episode ${index + 1}`,
    description: "Episode details are coming soon.",
    duration: "45m",
    still,
  }));
}

function qualityFrom(title: { voteAverage?: number | null; vote_average?: number | null; popularity?: number | null }): Quality {
  const rating = title.voteAverage ?? title.vote_average ?? 0;
  return rating >= 7.5 || (title.popularity ?? 0) >= 250 ? "4K" : "HD";
}

function languageFrom(media: ApiMedia): string {
  return media.spoken_languages?.[0]?.english_name
    ?? media.spoken_languages?.[0]?.name
    ?? media.originalLanguage
    ?? media.original_language
    ?? "Unknown";
}

function keywordsFrom(genres: string[], type: MediaType, status?: string | null): string[] {
  const words = [...genres.slice(0, 3)];
  if (type === "tv") words.push("Binge-worthy");
  if (status) words.push(status);
  return Array.from(new Set(words)).slice(0, 4);
}

function addBadge(badges: TitleBadge[], badge: TitleBadge) {
  if (!badges.includes(badge)) badges.push(badge);
}

function withBadge(title: Title, badge: TitleBadge): Title {
  const badges = [...(title.badges ?? [])];
  addBadge(badges, badge);

  return {
    ...title,
    badges,
    badge: badges[0],
  };
}

function applyTopTenBadges(titles: Title[], topTenIds: Set<string>): Title[] {
  return titles.map((title) => (topTenIds.has(title.id) ? withBadge(title, "Top 10") : title));
}

function badgesForMovie(releaseDate: string | null | undefined): TitleBadge[] {
  const badges: TitleBadge[] = [];
  if (isWithinPastDays(releaseDate, RECENT_BADGE_WINDOW_DAYS)) addBadge(badges, "Recently Added");
  return badges;
}

function seasonDate(season: ApiSeason): string | null | undefined {
  return season.airDate ?? season.air_date;
}

function badgesForTv(firstAirDate: string | null | undefined, seasons: ApiSeason[] = []): TitleBadge[] {
  const badges: TitleBadge[] = [];
  if (isWithinPastDays(firstAirDate, RECENT_BADGE_WINDOW_DAYS)) addBadge(badges, "Recently Added");

  const latestSeason = seasons
    .filter((season) => (season.seasonNumber ?? season.season_number ?? 0) > 0)
    .filter((season) => seasonDate(season))
    .sort((a, b) => new Date(seasonDate(b) ?? 0).getTime() - new Date(seasonDate(a) ?? 0).getTime())[0];

  const latestSeasonDate = seasonDate(latestSeason ?? {});
  if (latestSeasonDate && firstAirDate !== latestSeasonDate && isWithinPastDays(latestSeasonDate, RECENT_BADGE_WINDOW_DAYS)) {
    addBadge(badges, "New Season");
  }

  return badges;
}

function creatorFromMovie(movie: ApiMovie): string {
  const director = movie.credits?.crew?.find((person) => person.job === "Director")?.name;
  return director ?? movie.originalTitle ?? movie.original_title ?? movie.title ?? "Webflix";
}

function creatorFromTv(tv: ApiTvShow): string {
  return tv.created_by?.map((creator) => creator.name).filter(Boolean).join(", ")
    || tv.originalName
    || tv.original_name
    || tv.name
    || "Webflix";
}

function similarIds(source: Title, catalog: Title[]): string[] {
  return catalog
    .filter((title) => title.id !== source.id)
    .map((title) => ({
      id: title.id,
      score: title.genres.filter((genre) => source.genres.includes(genre)).length + (title.type === source.type ? 1 : 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((item) => item.id);
}

function mapMovie(movie: ApiMovie, catalog: Title[] = []): Title | null {
  const tmdbId = movie.tmdbId ?? movie.id;
  const title = movie.title;
  if (!tmdbId || !title) return null;

  const genres = mapGenres(movie.genres);
  const releaseDate = movie.releaseDate ?? movie.release_date;
  const maturity = maturityFromRating(movieRating(movie), "movie");
  const badges = badgesForMovie(releaseDate);
  const mapped: Title = {
    id: `movie-${tmdbId}`,
    slug: slugify(title, "movie", tmdbId),
    title,
    type: "movie",
    year: yearFrom(releaseDate),
    rating: Number((movie.voteAverage ?? movie.vote_average ?? 0).toFixed(1)),
    maturity,
    quality: qualityFrom(movie),
    runtime: formatRuntime(movie.runtime),
    genres,
    language: languageFrom(movie),
    tagline: movie.tagline || "",
    description: movie.overview || "No description available yet.",
    poster: imageUrl(movie.posterPath ?? movie.poster_path, POSTER_SIZE),
    backdrop: imageUrl(movie.backdropPath ?? movie.backdrop_path, BACKDROP_SIZE),
    creator: creatorFromMovie(movie),
    status: movie.status ?? "Released",
    keywords: keywordsFrom(genres, "movie", movie.status),
    cast: mapCast(movie.cast ?? movie.credits?.cast),
    similar: [],
    trailers: mapTrailers(movie.videos),
    badges,
    badge: badges[0],
  };

  mapped.similar = similarIds(mapped, catalog);
  return mapped;
}

function mapTvShow(tv: ApiTvShow, catalog: Title[] = []): Title | null {
  const tmdbId = tv.tmdbId ?? tv.id;
  const title = tv.name;
  if (!tmdbId || !title) return null;

  const genres = mapGenres(tv.genres);
  const releaseDate = tv.firstAirDate ?? tv.first_air_date;
  const maturity = maturityFromRating(tvRating(tv), "tv");
  const runtime = tv.runtime ?? tv.episode_run_time?.[0];
  const badges = badgesForTv(releaseDate, tv.seasons);
  const mapped: Title = {
    id: `tv-${tmdbId}`,
    slug: slugify(title, "tv", tmdbId),
    title,
    type: "tv",
    year: yearFrom(releaseDate),
    rating: Number((tv.voteAverage ?? tv.vote_average ?? 0).toFixed(1)),
    maturity,
    quality: qualityFrom(tv),
    runtime: formatRuntime(runtime),
    genres,
    language: languageFrom(tv),
    tagline: tv.tagline || "",
    description: tv.overview || "No description available yet.",
    poster: imageUrl(tv.posterPath ?? tv.poster_path, POSTER_SIZE),
    backdrop: imageUrl(tv.backdropPath ?? tv.backdrop_path, BACKDROP_SIZE),
    creator: creatorFromTv(tv),
    status: tv.status ?? "Returning Series",
    keywords: keywordsFrom(genres, "tv", tv.status),
    cast: mapCast(tv.cast ?? tv.credits?.cast),
    seasons: mapSeasons(tv.seasons, maturity, imageUrl(tv.backdropPath ?? tv.backdrop_path, BACKDROP_SIZE)),
    similar: [],
    trailers: mapTrailers(tv.videos),
    badges,
    badge: badges[0],
  };

  mapped.similar = similarIds(mapped, catalog);
  return mapped;
}

function mapListItem(item: ApiMediaListItem, catalog: Title[] = []): Title | null {
  if ((item.mediaType === "MOVIE" || item.mediaType === "movie") && item.movie) {
    return mapMovie(item.movie, catalog);
  }

  if ((item.mediaType === "TV" || item.mediaType === "tv") && item.tvShow) {
    return mapTvShow(item.tvShow, catalog);
  }

  if (item.movie) return mapMovie(item.movie, catalog);
  if (item.tvShow) return mapTvShow(item.tvShow, catalog);

  return null;
}

function mapList(items: ApiMediaListItem[], catalog: Title[] = []): Title[] {
  return items
    .map((item) => mapListItem(item, catalog))
    .filter((title): title is Title => Boolean(title));
}

function uniqueTitles(groups: Title[][]): Title[] {
  const seen = new Set<string>();
  const titles: Title[] = [];

  for (const group of groups) {
    for (const title of group) {
      if (seen.has(title.id)) continue;
      seen.add(title.id);
      titles.push(title);
    }
  }

  return titles;
}

async function catalog(): Promise<Title[]> {
  const groups = await Promise.all([
    readList(tmdb.featured.all() as Promise<unknown>),
    readList(tmdb.movies.trending() as Promise<unknown>),
    readList(tmdb.tv.trending() as Promise<unknown>),
    readList(tmdb.movies.popular() as Promise<unknown>),
    readList(tmdb.tv.popular() as Promise<unknown>),
    readList(tmdb.movies.topRated() as Promise<unknown>),
    readList(tmdb.tv.topRated() as Promise<unknown>),
    readList(tmdb.movies.upcoming() as Promise<unknown>),
    readList(tmdb.tv.nowPlaying() as Promise<unknown>),
  ]);

  const firstPass = uniqueTitles(groups.map((group) => mapList(group)));
  return firstPass.map((title) => ({
    ...title,
    similar: similarIds(title, firstPass),
  }));
}

async function titleGroupsFor(type: BrowserType, sort: SortOption): Promise<ApiMediaListItem[][]> {
  if (type === "movie") {
    const primary = sort === "rating" ? tmdb.movies.topRated() : sort === "year" ? tmdb.movies.upcoming() : tmdb.movies.trending();
    return [await readList(primary as Promise<unknown>), await readList(tmdb.movies.popular() as Promise<unknown>)];
  }

  if (type === "tv") {
    const primary = sort === "rating" ? tmdb.tv.topRated() : sort === "year" ? tmdb.tv.nowPlaying() : tmdb.tv.trending();
    return [await readList(primary as Promise<unknown>), await readList(tmdb.tv.popular() as Promise<unknown>)];
  }

  const [moviePrimary, tvPrimary, featured] = await Promise.all([
    readList((sort === "rating" ? tmdb.movies.topRated() : sort === "year" ? tmdb.movies.upcoming() : tmdb.movies.trending()) as Promise<unknown>),
    readList((sort === "rating" ? tmdb.tv.topRated() : sort === "year" ? tmdb.tv.nowPlaying() : tmdb.tv.trending()) as Promise<unknown>),
    readList(tmdb.featured.all() as Promise<unknown>),
  ]);

  return [featured, moviePrimary, tvPrimary];
}

function applyFilters(titles: Title[], options: { type?: BrowserType; genre?: string; query?: string; ids?: string[]; sort?: SortOption }): Title[] {
  let result = [...titles];

  if (options.ids?.length) {
    const wanted = new Set(options.ids);
    result = result.filter((title) => wanted.has(title.id));
  }

  if (options.type && options.type !== "all") {
    result = result.filter((title) => title.type === options.type);
  }

  if (options.genre && options.genre !== "All") {
    result = result.filter((title) => title.genres.includes(options.genre ?? ""));
  }

  if (options.query) {
    const query = options.query.toLowerCase();
    result = result.filter((title) => {
      const haystack = [
        title.title,
        title.description,
        title.creator,
        title.language,
        ...title.genres,
        ...title.keywords,
        ...title.cast.map((member) => member.name),
      ].join(" ").toLowerCase();

      return haystack.includes(query);
    });
  }

  if (options.sort) {
    switch (options.sort) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "year":
        result.sort((a, b) => b.year - a.year);
        break;
      case "az":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        result.sort((a, b) => b.rating * 10 + b.year - (a.rating * 10 + a.year));
        break;
    }
  }

  return result;
}

export async function getHomeData(): Promise<{ featuredTitles: Title[]; rows: Row[]; titles: Title[] }> {
  const [
    featuredItems,
    movieTrendingItems,
    tvTrendingItems,
    popularMovieItems,
    popularTvItems,
    topMovieItems,
    topTvItems,
  ] = await Promise.all([
    readList(tmdb.featured.all() as Promise<unknown>),
    readList(tmdb.movies.trending() as Promise<unknown>),
    readList(tmdb.tv.trending() as Promise<unknown>),
    readList(tmdb.movies.popular() as Promise<unknown>),
    readList(tmdb.tv.popular() as Promise<unknown>),
    readList(tmdb.movies.topRated() as Promise<unknown>),
    readList(tmdb.tv.topRated() as Promise<unknown>),
  ]);

  const featured = mapList(featuredItems);
  const movieTrending = mapList(movieTrendingItems);
  const tvTrending = mapList(tvTrendingItems);
  const popularMovies = mapList(popularMovieItems);
  const popularTv = mapList(popularTvItems);
  const topMovies = mapList(topMovieItems);
  const topTv = mapList(topTvItems);

  const titles = uniqueTitles([featured, movieTrending, tvTrending, popularMovies, popularTv, topMovies, topTv]);
  const withSimilar = titles.map((title) => ({ ...title, similar: similarIds(title, titles) }));
  const byId = new Map(withSimilar.map((title) => [title.id, title]));
  const hydrate = (items: Title[]) => items.map((title) => byId.get(title.id)).filter((title): title is Title => Boolean(title));

  const top10Titles = hydrate(uniqueTitles([featured])).slice(0, 10).map((title) => withBadge(title, "Top 10"));
  const top10Ids = new Set(top10Titles.map((title) => title.id));
  const badgeTopTen = (items: Title[]) => applyTopTenBadges(items, top10Ids);

  const trendingMovies = badgeTopTen(hydrate(movieTrending).slice(0, MAX_ROW_TITLES));
  const trendingTv = badgeTopTen(hydrate(tvTrending).slice(0, MAX_ROW_TITLES));

  const rows: Row[] = [
    {
      id: "trending",
      title: "Trending Movies",
      kind: "landscape",
      titles: trendingMovies,
      filterable: true,
      variants: {
        movie: {
          title: "Trending Movies",
          kind: "landscape",
          titles: trendingMovies,
        },
        tv: {
          title: "Trending TV Shows",
          kind: "landscape",
          titles: trendingTv,
        },
      },
    },
    {
      id: "top-10",
      title: "Top 10 Today",
      kind: "top10",
      titles: top10Titles,
    },
    {
      id: "popular-movies",
      title: "Popular Movies",
      kind: "ranked",
      titles: badgeTopTen(hydrate(popularMovies).slice(0, MAX_ROW_TITLES)),
    },
    {
      id: "popular-tv",
      title: "Popular Series",
      kind: "landscape",
      titles: badgeTopTen(hydrate(popularTv).slice(0, MAX_ROW_TITLES)),
    },
  ];

  return {
    featuredTitles: badgeTopTen(hydrate(featured).slice(0, MAX_FEATURED_TITLES)).map((title) => ({
      ...title,
      featured: true,
    })),
    rows,
    titles: badgeTopTen(withSimilar),
  };
}

export async function getTitles(options: {
  ids?: string[];
  query?: string;
  genre?: string;
  sort?: SortOption;
  type?: BrowserType;
} = {}): Promise<Title[]> {
  if (options.ids?.length) {
    const fullCatalog = await catalog();
    const titles = await Promise.all(options.ids.map((id) => titleFromId(id, fullCatalog)));
    return applyFilters(titles.filter((title): title is Title => Boolean(title)), {
      ...options,
      sort: undefined,
    }).slice(0, MAX_GRID_TITLES);
  }

  if (options.query) {
    return applyFilters(await catalog(), options).slice(0, MAX_GRID_TITLES);
  }

  const sort = options.sort ?? "trending";
  const groups = await titleGroupsFor(options.type ?? "all", sort);
  const titles = uniqueTitles(groups.map((group) => mapList(group)));
  const withSimilar = titles.map((title) => ({ ...title, similar: similarIds(title, titles) }));

  return applyFilters(withSimilar, { ...options, sort }).slice(0, MAX_GRID_TITLES);
}

export async function getTitle(id: string): Promise<Title | undefined> {
  return titleFromId(id, await catalog());
}

async function titleFromId(id: string, fullCatalog: Title[]): Promise<Title | undefined> {
  const [type, rawTmdbId] = id.split("-");
  const tmdbId = Number(rawTmdbId);
  if ((type !== "movie" && type !== "tv") || !Number.isFinite(tmdbId)) return undefined;

  const media = type === "movie"
    ? await readMedia<ApiMovie>(tmdb.movies.details(tmdbId) as Promise<unknown>)
    : await readMedia<ApiTvShow>(tmdb.tv.details(tmdbId) as Promise<unknown>);

  const mapped = media && (type === "movie" ? mapMovie(media as ApiMovie, fullCatalog) : mapTvShow(media as ApiTvShow, fullCatalog));
  if (mapped) return mapped;

  return fullCatalog.find((title) => title.id === id);
}

export async function getBySlug(slug: string): Promise<Title | undefined> {
  const match = slug.match(/-(movie|tv)-(\d+)$/);
  if (match) return getTitle(`${match[1]}-${match[2]}`);

  const titles = await catalog();
  return titles.find((title) => title.slug === slug);
}

export async function getGenres(type: BrowserType = "all"): Promise<string[]> {
  const titles = await getTitles({ type, sort: "trending" });
  const genres = new Set<string>(["All"]);

  for (const title of titles) {
    for (const genre of title.genres) genres.add(genre);
  }

  return [...genres];
}
