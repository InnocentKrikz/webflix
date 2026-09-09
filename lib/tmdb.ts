// All catalog requests go through the backend. The backend owns caching through
// Redis (with a memory fallback), so large catalog responses must not enter
// Next.js's 2 MB-per-entry Data Cache.
const TMDB_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3005";

async function tmdbFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${TMDB_BASE_URL}${endpoint}`,
    {
      ...options,
      cache: "no-store" as const,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    }
  );
//console.log(`${TMDB_BASE_URL}${endpoint}`)
  if (!response.ok) {
    throw new Error(
      `TMDB request failed: ${response.status} ${response.statusText}`
    );
  }
  const payload = await response.json()
  return (payload?.results ?? payload) as T
}

export const tmdb = {
  home(cookie?: string) {
    return tmdbFetch(`/home`, cookie ? { headers: { cookie } } : undefined);
  },

  movies: {
    details(id: number) {
      return tmdbFetch(`/movies/${id}`);
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
    details(id: number) {
      return tmdbFetch(`/tv/${id}`);
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

  trending: {
    all(timeWindow = "day") {
      return tmdbFetch(`/trending/all/${timeWindow}`);
    },
    movies(timeWindow = "day") {
      return tmdbFetch(`/trending/movie/${timeWindow}`);
    },
    tv(timeWindow = "day") {
      return tmdbFetch(`/trending/tv/${timeWindow}`);
    },
  },

  featured: {
    all() {
      return tmdbFetch(`/discover`);
    },
  },

  searchMovie(query: string) {
    return tmdbFetch(`/search?query=${encodeURIComponent(query)}`);
  },

  searchTV(query: string) {
    return tmdbFetch(`/search?query=${encodeURIComponent(query)}`);
  },

  search(query: string) {
    return tmdbFetch(`/search?query=${encodeURIComponent(query)}`);
  },

  genres: {
    movies() {
      return tmdbFetch(`/genre/movie/list`);
    },
    tv() {
      return tmdbFetch(`/genre/tv/list`);
    },
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
