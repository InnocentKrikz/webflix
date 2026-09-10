import "server-only";
import { cache } from "react";

const TMDB_BASE_URL = (process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:3005").replace(/\/$/, "");

// Every call here is public catalog data. Authenticated requests use backend-proxy.
const tmdbFetch = cache(async <T>(endpoint: string, signal?: AbortSignal): Promise<T> => {
  const start = performance.now();
  const response = await fetch(`${TMDB_BASE_URL}${endpoint}`, {
    ...(signal ? { cache: "no-store" as const } : { next: { revalidate: 60 } }),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
  const payload = await response.json();
  if (process.env.PERF_DEBUG === "1") {
    console.info("catalog-fetch", { path: endpoint.split("?")[0], ms: Number((performance.now() - start).toFixed(1)) });
  }
  return (payload?.results ?? payload) as T;
});

export const tmdb = {
  home(section: "primary" | "secondary" | "all" = "all") {
    return tmdbFetch(`/home/public?section=${section}`);
  },
  titles(ids: string[]) { return tmdbFetch(`/catalog?ids=${encodeURIComponent(ids.join(","))}`); },
  homeGenres() { return tmdbFetch(`/home/genres`); },
  genreList(type = "all") { return tmdbFetch(`/genres?type=${type}`); },
  related(type: "movie" | "tv", id: number) { return tmdbFetch(`/${type === "movie" ? "movies" : "tv"}/${id}/related`); },

  movies: {
    details(id: number, view = "summary") {
      return tmdbFetch(`/movies/${id}?view=${view}`);
    },
    popular() {
      return tmdbFetch(`/movies/popular`);
    },
    nowPlaying() {
      return tmdbFetch(`/movies/now-playing`);
    },
    topRated() {
      return tmdbFetch(`/movies/top`);
    },
    trending(timeWindow = "day") {
      return tmdbFetch(`/movies/trending/${timeWindow}`);
    },
    upcoming() {
      return tmdbFetch(`/movies/upcoming`);
    },
  },

  tv: {
    details(id: number, view = "summary") {
      return tmdbFetch(`/tv/${id}?view=${view}`);
    },
    seasonDetails(id: number, seasonNumber: number) {
      return tmdbFetch(`/tv/${id}/season/${seasonNumber}`);
    },
    popular() {
      return tmdbFetch(`/tv/popular`);
    },
    nowPlaying() {
      return tmdbFetch(`/tv/airing-today`);
    },
    topRated() {
      return tmdbFetch(`/tv/top`);
    },
    trending(timeWindow = "day") {
      return tmdbFetch(`/tv/trending/${timeWindow}`);
    },
     upcoming() {
      return tmdbFetch(`/tv/upcoming`);
    },
  },

  featured: {
    all() {
      return tmdbFetch(`/discover`);
    },
  },

  search(query: string, signal?: AbortSignal) {
    return tmdbFetch(`/search?query=${encodeURIComponent(query)}`, signal);
  },

  people: {
    details(id: number) {
      return tmdbFetch(`/people/${id}`);
    },
  },

  productionCompanies: {
    details(id: number) {
      return tmdbFetch(`/production-companies/${id}`);
    },
  },
};
