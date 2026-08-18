import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Parses strings like "2h 12m" or "54m" into total seconds. */
export function parseDurationToSeconds(value?: string): number {
  if (!value) return 24 * 60
  const hMatch = value.match(/(\d+)\s*h/)
  const mMatch = value.match(/(\d+)\s*m/)
  const hours = hMatch ? Number(hMatch[1]) : 0
  const minutes = mMatch ? Number(mMatch[1]) : 0
  const total = hours * 3600 + minutes * 60
  return total > 0 ? total : 24 * 60
}

/** Formats seconds into H:MM:SS or M:SS. */
export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}
