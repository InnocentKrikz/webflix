import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.json(
      {
        error: "Movie not found",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json(movie);
}