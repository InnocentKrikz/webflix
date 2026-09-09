'use client'

import { useMatch } from '@/components/match-provider'

export function MatchScore({ id }: { id: string }) {
  const { match, status } = useMatch(id)
  const label = status === 'error' ? 'Match unavailable'
    : match ? `${match.score}% Match` : 'Matching…'
  const explanation = match ? `${match.reasons.join('. ')}. ${match.confidence === 'low' ? 'An early estimate that improves as you watch and rate.' : 'Your estimated match.'}`
    : 'Your match is based on your viewing and ratings'
  return (
    <span className="font-semibold text-emerald-400" title={explanation} aria-label={`${label}. ${explanation}`}>
      {label}
    </span>
  )
}
