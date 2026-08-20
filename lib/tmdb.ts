const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function tmdbFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${TMDB_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `TMDB request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

export const tmdb = {
  movie(id: number) {
    return tmdbFetch(`/movie/${id}?append_to_response=credits,videos`);
  },

  movies: {
    details(id: number) {
      return tmdbFetch(`/movie/${id}?append_to_response=credits,videos`);
    },
    popular() {
      return tmdbFetch(`/movie/popular`);
    },
    nowPlaying() {
      return tmdbFetch(`/movie/now_playing`);
    },
    topRated() {
      return tmdbFetch(`/movie/top_rated`);
    },
    trending(timeWindow = "day") {
      return tmdbFetch(`/trending/movie/${timeWindow}`);
    },
  },

  tv: {
    details(id: number) {
      return tmdbFetch(`/tv/${id}?append_to_response=credits,videos`);
    },
    seasonDetails(id: number, seasonNumber: number) {
      return tmdbFetch(`/tv/${id}/season/${seasonNumber}`);
    },
    popular() {
      return tmdbFetch(`/tv/popular`);
    },
    nowPlaying() {
      return tmdbFetch(`/tv/on_the_air`);
    },
    topRated() {
      return tmdbFetch(`/tv/top_rated`);
    },
    trending(timeWindow = "day") {
      return tmdbFetch(`/trending/tv/${timeWindow}`);
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
      return tmdbFetch(`/trending/all/day`);
    },
    movies() {
      return tmdbFetch(`/trending/movie/day`);
    },
    tv() {
      return tmdbFetch(`/trending/tv/day`);
    },
  },

  searchMovie(query: string) {
    return tmdbFetch(
      `/search/movie?query=${encodeURIComponent(query)}`
    );
  },

  searchTV(query: string) {
    return tmdbFetch(
      `/search/tv?query=${encodeURIComponent(query)}`
    );
  },

  genres: {
    movies() {
      return tmdbFetch(`/genre/movie/list`);
    },
    tv() {
      return tmdbFetch(`/genre/tv/list`);
    },
  },
};
