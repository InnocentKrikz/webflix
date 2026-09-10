import type { ImageLoaderProps } from 'next/image'

/** Let TMDB's existing CDN resize images; no second image proxy or origin encoding. */
export default function tmdbImageLoader({ src, width }: ImageLoaderProps): string {
  const match = /^https:\/\/image\.tmdb\.org\/t\/p\/(w\d+|original)(\/.*)$/.exec(src)
  if (!match) return src
  const original = match[1]
  const widths = original === 'w1280' ? [300, 780, 1280]
    : original === 'w185' ? [45, 185, 632]
      : original === 'w300' ? [92, 185, 300]
        : [185, 500, 780]
  const selected = widths.find((size) => size >= width) ?? widths[widths.length - 1]
  return `https://image.tmdb.org/t/p/w${selected}${match[2]}`
}
