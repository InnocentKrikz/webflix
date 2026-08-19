import { prisma } from "../prisma";
import { tmdb } from "../tmdb";

export async function syncMovie(tmdbId: number) {
  const movie: any = await tmdb.movie(tmdbId);

  await prisma.movie.upsert({
    where: {
      tmdbId,
    },

    create: {
      tmdbId: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      tagline: movie.tagline,

      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,

      releaseDate: movie.release_date
        ? new Date(movie.release_date)
        : null,

      runtime: movie.runtime,

      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      popularity: movie.popularity,

      status: movie.status,
      originalLanguage: movie.original_language,

      adult: movie.adult,

      lastSyncedAt: new Date(),
    },

    update: {
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      tagline: movie.tagline,

      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,

      releaseDate: movie.release_date
        ? new Date(movie.release_date)
        : null,

      runtime: movie.runtime,

      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      popularity: movie.popularity,

      status: movie.status,
      originalLanguage: movie.original_language,

      adult: movie.adult,

      lastSyncedAt: new Date(),
    },
  });
}