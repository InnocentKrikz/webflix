import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

async function loadData(bundle, featured) {
  const source = await readFile(new URL('../lib/data.ts', import.meta.url), 'utf8')
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  const tmdb = 'data:text/javascript,' + encodeURIComponent(`export const tmdb = {
    home: async (section) => section === 'primary' ? ({ featuredItems: ${JSON.stringify(featured)} }) : (${JSON.stringify(bundle)}),
    homeGenres: async () => (${JSON.stringify(bundle)}),
    featured: { all: async () => { throw new Error('Badges must use the displayed home Top 10, not a separate discover snapshot') } },
  };`)
  outputText = outputText.replace('import "server-only";', '')
    .replace('from "./tmdb"', `from ${JSON.stringify(tmdb)}`)
    .replace('from "react"', `from ${JSON.stringify(import.meta.resolve('react'))}`)
  for (const name of ['availability', 'title-colors', 'title-trailers']) {
    outputText = outputText.replace(`from "./${name}"`, `from ${JSON.stringify(new URL(`../lib/${name}.ts`, import.meta.url).href)}`)
  }
  return import('data:text/javascript,' + encodeURIComponent(outputText))
}

const movie = (id) => ({ mediaType: 'MOVIE', movie: { tmdbId: id, title: `Movie ${id}`, releaseDate: new Date().toISOString() } })
const tv = (id) => ({ mediaType: 'TV', tvShow: { tmdbId: id, name: `Show ${id}` } })
const hasTop10 = (title) => title.badges?.includes('Top 10') ?? false

test('secondary rows retain global Top 10 badges without featured items in their bundle', async () => {
  const featured = [movie(1), tv(1), ...Array.from({ length: 9 }, (_, i) => movie(i + 2))]
  const { getHomeData } = await loadData({
    movieNowPlayingItems: [movie(1), movie(10)],
    tvNowPlayingItems: [tv(1), tv(10)],
    popularMovieItems: [movie(1), movie(10)],
  }, featured)
  const { rows } = await getHomeData('secondary')
  const nowPlaying = rows.find((row) => row.id === 'now-playing')
  const popular = rows.find((row) => row.id === 'popular-movies')
  for (const titles of [nowPlaying.titles, nowPlaying.variants.movie.titles, nowPlaying.variants.tv.titles, popular.titles]) {
    assert.deepEqual(titles.map(hasTop10), [true, false])
  }
  assert.ok(popular.titles[0].badges.includes('Recently Added'))
  assert.equal(rows.find((row) => row.id === 'top-10').titles.length, 0)
})

test('standalone and bundled trending genres badge matching movies and TV shows after hydration', async () => {
  const bundle = {
    featuredItems: [movie(1), tv(2)],
    trendingGenreRecommendations: {
      genres: [{ id: 28, name: 'Action', movieIds: [1, 2], tvIds: [1, 2] }],
      titles: [{ id: 'movie-1' }, { id: 'movie-2' }, { id: 'tv-1' }, { id: 'tv-2' }],
    },
    databaseTrendingGenreItems: [movie(1), movie(2), tv(1), tv(2)],
  }
  const { getHomeData, getHomeGenreData } = await loadData(bundle, bundle.featuredItems)
  const standalone = await getHomeGenreData()
  const bundled = (await getHomeData()).trendingGenreRecommendations
  for (const recommendations of [standalone, bundled]) {
    assert.deepEqual(recommendations.titles.map(hasTop10), [true, false, false, true])
    assert.ok(recommendations.titles[0].badges.includes('Recently Added'))
  }
})
