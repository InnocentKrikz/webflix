import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

// Execute the real server-side normalization with a fixture backend response.
// Only the network and server-only marker are replaced for the Node test runner.
async function loadHome(bundle) {
  const source = await readFile(new URL('../lib/data.ts', import.meta.url), 'utf8')
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  const tmdb = 'data:text/javascript,' + encodeURIComponent(`export const tmdb = { home: async () => (${JSON.stringify(bundle)}), featured: { all: async () => [] } };`)
  outputText = outputText.replace('import "server-only";', '')
    .replace('from "./tmdb"', `from ${JSON.stringify(tmdb)}`)
    .replace('from "react"', `from ${JSON.stringify(import.meta.resolve('react'))}`)
  for (const name of ['availability', 'title-colors', 'title-trailers']) {
    outputText = outputText.replace(`from "./${name}"`, `from ${JSON.stringify(new URL(`../lib/${name}.ts`, import.meta.url).href)}`)
  }
  const { getHomeData } = await import('data:text/javascript,' + encodeURIComponent(outputText))
  return getHomeData('secondary')
}

const sample = (timestamp) => ({ timestamp, averageColor: '#123456', leftColor: '#234567', centerColor: '#345678', rightColor: '#456789', topColor: '#56789a', bottomColor: '#6789ab' })
const trailer = (key, samples) => ({ key, site: 'YouTube', videoType: 'Trailer', official: true, name: 'Official Trailer', publishedAt: '2025-01-01', trailerAnalysis: samples ? { samples } : null })
const movie = (videos) => ({ mediaType: 'MOVIE', movie: { tmdbId: 1, title: 'Fixture movie', releaseDate: '2099-01-01', videos } })

test('home showcase retains upcoming timeline when the title first appears in a compact popular row', async () => {
  const { rows } = await loadHome({
    popularMovieItems: [movie([trailer('abcdefghijk')])],
    movieUpcomingItems: [movie([trailer('abcdefghijk', [sample(0), sample(4)])])],
  })
  const titles = rows.find((row) => row.id === 'trailers').titles
  assert.equal(titles.length, 1)
  assert.deepEqual(titles[0].trailers[0].timeline.map((item) => [item.timestamp, item.average]), [[0, '#123456'], [4, '#123456']])
})

test('home preserves an analyzed trailer outside the six newest previews and keeps pending titles', async () => {
  const promos = Array.from({ length: 8 }, (_, i) => ({ ...trailer(`promo${i}`), publishedAt: '2026-01-01' }))
  const { rows } = await loadHome({ movieUpcomingItems: [movie([
    ...promos, trailer('abcdefghijk', [sample(0), sample(4)]),
  ]), { mediaType: 'TV', tvShow: { tmdbId: 2, name: 'Pending show', videos: [trailer('pending1234')] } }] })
  const titles = rows.find((row) => row.id === 'trailers').titles
  assert.equal(titles.length, 2)
  assert.equal(titles[0].trailers.find((item) => item.videoKey === 'abcdefghijk').timeline.length, 2)
})
