import type { Title } from '@/lib/types'

const COLOR_KEYS = [
  'dominantColor1',
  'dominantColor2',
  'dominantColor3',
] as const

/** Keep the preferred title payload while filling absent palette values from
 * another representation of the same database title. */
export function withFallbackDominantColors(
  preferred: Title,
  fallback: Title | undefined,
): Title {
  if (!fallback) return preferred

  const colors = Object.fromEntries(
    COLOR_KEYS.map((key) => [key, preferred[key] || fallback[key] || null]),
  ) as Pick<Title, (typeof COLOR_KEYS)[number]>

  if (COLOR_KEYS.every((key) => preferred[key] === colors[key])) return preferred
  return { ...preferred, ...colors }
}
