//Proxy to Backend URL  
const TMDB_BASE_URL = "https://a726-20-61-127-55.ngrok-free.app";

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
//console.log(`${TMDB_BASE_URL}${endpoint}`)
  if (!response.ok) {
    throw new Error(
      `TMDB request failed: ${response.status} ${response.statusText}`
    );
  }
const data= await (await response.json()).results
//console.log(data)
  return data
}

export const tmdb = {
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
      return tmdbFetch(`/trending/tv/${timeWindow} `);
    },
  },

  featured: {
    all() {
      return tmdbFetch(`/discover`);
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
