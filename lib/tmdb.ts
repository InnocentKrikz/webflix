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
    return tmdbFetch(`/movie/${id}?append_to_response=credits`);
  },

  tv(id: number) {
    return tmdbFetch(`/tv/${id}`);
  },

  trending(mediaType = "all", timeWindow = "day") {
    return tmdbFetch(
      `/trending/${mediaType}/${timeWindow}`
    );
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
};