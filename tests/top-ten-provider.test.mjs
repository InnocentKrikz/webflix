import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const source = await readFile(new URL('../components/top-ten-provider.tsx', import.meta.url), 'utf8')
let { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
})
for (const specifier of ['react', 'react/jsx-runtime']) {
  outputText = outputText.replace(`from '${specifier}'`, `from ${JSON.stringify(import.meta.resolve(specifier))}`)
    .replace(`from "${specifier}"`, `from ${JSON.stringify(import.meta.resolve(specifier))}`)
}
const { TopTenProvider, useTopTenBadge } = await import('data:text/javascript,' + encodeURIComponent(outputText))

function Card({ title }) {
  return createElement('span', { 'data-top10': useTopTenBadge(title) }, title.id)
}

function render(ids, titles) {
  return renderToStaticMarkup(createElement(TopTenProvider, { ids },
    createElement('section', null, titles.map((title) => createElement(Card, { key: title.id, title }))),
  ))
}

test('cards use the displayed Top 10 IDs even when their separate payload omits badges', () => {
  const html = render(['movie-969681'], [
    { id: 'movie-969681', badges: ['Recently Added'] },
    { id: 'tv-969681' },
  ])
  assert.match(html, /data-top10="true">movie-969681/)
  assert.match(html, /data-top10="false">tv-969681/)
})

test('a replacement or empty Top 10 list overrides stale title metadata', () => {
  const title = { id: 'movie-969681', badges: ['Top 10'] }
  assert.match(render(['movie-969681'], [title]), /data-top10="true"/)
  assert.match(render(['movie-1'], [title]), /data-top10="false"/)
  assert.match(render([], [title]), /data-top10="false"/)
})

test('cards outside the homepage retain their server-provided badge metadata', () => {
  for (const title of [{ id: 'movie-1', badges: ['Top 10'] }, { id: 'movie-1', badge: 'Top 10' }]) {
    assert.match(renderToStaticMarkup(createElement(Card, { title })), /data-top10="true"/)
  }
})
