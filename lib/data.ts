```ts
import "server-only";

import { prisma } from "./prisma";

import type {
  CastMember,
  Episode,
  MediaType,
  Maturity,
  Row,
  Season,
  Title,
} from "./types";

const POSTER_SIZE = "w500";
const BACKDROP_SIZE = "w1280";
const PROFILE_SIZE = "w185";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

const MAX_LIST_ITEMS = 14;
const MAX_DETAIL_ITEMS = 8;
const MAX_SEASONS_WITH_EPISODES = 2;
const TITLE_SYNC_CONCURRENCY = 2;

type ApiGenre = {
  genre: {
    id: number;
    tmdbId: number;
    name: string;
  };
};

type ApiCast = {
  character: string | null;
  castOrder: number | null;
  person: {
    id: number;
    tmdbId: number;
    name: string;
    profilePath: string | null;
  };
};

type ApiVideo = {
  id: number;
  videoType: string;
  key: string;
  name: string;
  site: string;
  size: number | null;
  official: boolean;
  publishedAt: string | null;
};

type ApiProductionCompany = {
  productionCompany: {
    id: number;
    tmdbId: number;
    name: string;
    logoPath: string | null;
    originCountry: string | null;
  };
};

type ApiContentRating = {
  countryCode: string;
  rating: string;
};

type ApiMovie = {
  id: number;
  tmdbId: number;

  title: string;
  originalTitle: string | null;
  overview: string | null;
  tagline: string | null;

  posterPath: string | null;
  backdropPath: string | null;

  releaseDate: string | null;
  runtime: number | null;

  voteAverage: number | null;
  voteCount: number | null;
  popularity: number | null;

  status: string | null;
  originalLanguage: string | null;
  adult: boolean;

  genres: ApiGenre[];
  cast: ApiCast[];
  productionCompanies: ApiProductionCompany[];
  videos: ApiVideo[];
  contentRatings: ApiContentRating[];
};

type ApiTvShow = {
  id: number;
  tmdbId: number;

  name: string;
  originalName: string | null;
  overview: string | null;
  tagline: string | null;

  posterPath: string | null;
  backdropPath: string | null;

  firstAirDate: string | null;
  lastAirDate: string | null;

  voteAverage: number | null;
  voteCount: number | null;
  popularity: number | null;

  status: string | null;
  originalLanguage: string | null;
  adult: boolean;

  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;

  genres: ApiGenre[];
  cast: ApiCast[];
  productionCompanies: ApiProductionCompany[];
  videos: ApiVideo[];
  contentRatings: ApiContentRating[];
};

type ApiMediaListItem = {
  id: number;
  tmdbId: number;
  index: number;
  mediaType: "MOVIE" | "TV";
  category: string | null;

  movie: ApiMovie | null;
  tvShow: ApiTvShow | null;
};

type ApiMediaListResponse = {
  results: ApiMediaListItem[];
};

function imageUrl(
  path: string | null | undefined,
  size: string,
): string | null {
  if (!path) return null;

  return `${IMAGE_BASE_URL}/${size}${path}`;
}

function mapCast(cast: ApiCast[] = []): CastMember[] {
  return [...cast]
    .sort((a, b) => (a.castOrder ?? 999) - (b.castOrder ?? 999))
    .map((item) => ({
      id: item.person.id,
      tmdbId: item.person.tmdbId,
      name: item.person.name,
      character: item.character,
      profilePath: imageUrl(item.person.profilePath, PROFILE_SIZE),
    }));
}

function mapGenres(genres: ApiGenre[] = []) {
  return genres.map((item) => ({
    id: item.genre.id,
    tmdbId: item.genre.tmdbId,
    name: item.genre.name,
  }));
}

function mapVideos(videos: ApiVideo[] = []) {
  return videos.map((video) => ({
    id: video.id,
    type: video.videoType,
    key: video.key,
    name: video.name,
    site: video.site,
    official: video.official,
    publishedAt: video.publishedAt,
  }));
}

function getMaturity(
  ratings: ApiContentRating[] = [],
): Maturity | null {
  // Prefer UK rating when available.
  const rating = ratings.find(
    (item) => item.countryCode === "GB",
  );

  if (!rating) return null;

  return rating.rating as Maturity;
}

function mapMovie(movie: ApiMovie): Title {
  return {
    id: movie.id,
    tmdbId: movie.tmdbId,
    mediaType: "movie",

    title: movie.title,
    originalTitle: movie.originalTitle,

    overview: movie.overview,
    tagline: movie.tagline,

    posterPath: imageUrl(movie.posterPath, POSTER_SIZE),
    backdropPath: imageUrl(movie.backdropPath, BACKDROP_SIZE),

    releaseDate: movie.releaseDate,

    runtime: movie.runtime,

    voteAverage: movie.voteAverage,
    voteCount: movie.voteCount,
    popularity: movie.popularity,

    status: movie.status,
    originalLanguage: movie.originalLanguage,
    adult: movie.adult,

    genres: mapGenres(movie.genres),
    cast: mapCast(movie.cast),
    videos: mapVideos(movie.videos),

    maturity: getMaturity(movie.contentRatings),
  };
}

function mapTvShow(tv: ApiTvShow): Title {
  return {
    id: tv.id,
    tmdbId: tv.tmdbId,
    mediaType: "tv",

    title: tv.name,
    originalTitle: tv.originalName,

    overview: tv.overview,
    tagline: tv.tagline,

    posterPath: imageUrl(tv.posterPath, POSTER_SIZE),
    backdropPath: imageUrl(tv.backdropPath, BACKDROP_SIZE),

    releaseDate: tv.firstAirDate,

    runtime: null,

    voteAverage: tv.voteAverage,
    voteCount: tv.voteCount,
    popularity: tv.popularity,

    status: tv.status,
    originalLanguage: tv.originalLanguage,
    adult: tv.adult,

    genres: mapGenres(tv.genres),
    cast: mapCast(tv.cast),
    videos: mapVideos(tv.videos),

    maturity: getMaturity(tv.contentRatings),
  };
}

function mapMediaListItem(item: ApiMediaListItem): Title | null {
  if (item.mediaType === "MOVIE" && item.movie) {
    return mapMovie(item.movie);
  }

  if (item.mediaType === "TV" && item.tvShow) {
    return mapTvShow(item.tvShow);
  }

  return null;
}

function mapResponse(response: ApiMediaListResponse): Title[] {
  return response.results
    .map(mapMediaListItem)
    .filter((title): title is Title => title !== null);
}

function uniqueTitles(groups: Title[][]): Title[] {
  const seen = new Set<string>();
  const result: Title[] = [];

  for (const group of groups) {
    for (const title of group) {
      const key = `${title.mediaType}:${title.tmdbId}`;

      if (seen.has(key)) continue;

      seen.add(key);
      result.push(title);
    }
  }

  return result;
}
```
