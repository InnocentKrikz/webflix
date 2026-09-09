import type { TrailerColorSample } from '@/lib/types'

export function trailerSampleIndexAt(
  timeline: readonly TrailerColorSample[],
  currentTime: number,
  currentIndex = -1,
) {
  if (timeline.length === 0) return -1
  const time = Math.max(0, currentTime)
  const current = timeline[currentIndex]
  const next = timeline[currentIndex + 1]
  if (current && current.timestamp <= time && (!next || next.timestamp > time)) {
    return currentIndex
  }

  let low = 0
  let high = timeline.length - 1
  let result = 0
  while (low <= high) {
    const middle = Math.floor((low + high) / 2)
    if (timeline[middle]!.timestamp <= time) {
      result = middle
      low = middle + 1
    } else {
      high = middle - 1
    }
  }
  return result
}
