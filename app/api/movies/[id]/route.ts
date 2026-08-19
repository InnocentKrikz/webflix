import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tmdb } from "@/lib/tmdb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const movie = await prisma.movie.findUnique({
    where: {
      tmdbId: Number(resolvedParams.id),
    },
  });

  if (!movie) {
    const tmdbMovie = await tmdb.movie(Number(resolvedParams.id));

    if (!tmdbMovie) {
      
    return NextResponse.json(
      {
        error: "Movie not found",
      },
      {
        status: 404,
      }
    );
  } else {
      const newMovie = await prisma.movie.create({
        data: {
          tmdbId: tmdbMovie.id,
          title: tmdbMovie.title,
          overview: tmdbMovie.overview,
          releaseDate: tmdbMovie.release_date ? new Date(tmdbMovie.release_date) : null,
          posterPath: tmdbMovie.poster_path,
          backdropPath: tmdbMovie.backdrop_path,
          voteAverage: tmdbMovie.vote_average,
          voteCount: tmdbMovie.vote_count,
        },
      });
      
      return NextResponse.json(newMovie);
    }
  }

  return NextResponse.json(movie);
}