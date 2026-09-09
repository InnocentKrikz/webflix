import type { Title } from '@/lib/types'

export const VIDUKI_ORIGIN = 'https://www.viduki.net'

export const PLAYER_PROVIDERS = [
  {
    id: 'viduki-api-1',
    label: 'Viduki · API 1',
    description: 'Multi-server embed',
    kind: 'viduki',
    origin: VIDUKI_ORIGIN,
    api: 1,
  },
  {
    id: 'viduki-api-2',
    label: 'Viduki · API 2',
    description: 'Multi-language fallback',
    kind: 'viduki',
    origin: VIDUKI_ORIGIN,
    api: 2,
  },
  {
    id: 'viduki-api-3',
    label: 'Viduki · API 3',
    description: 'Multi-embed fallback',
    kind: 'viduki',
    origin: VIDUKI_ORIGIN,
    api: 3,
  },
  {
    id: 'viduki-api-4',
    label: 'Viduki · API 4',
    description: 'Premium embed fallback',
    kind: 'viduki',
    origin: VIDUKI_ORIGIN,
    api: 4,
  },
  {
    id: 'vidsrc-sbs',
    label: 'VidSrc · SBS',
    description: 'Movie and TV embed',
    kind: 'vidsrc',
    origin: 'https://vidsrc.sbs',
  },
  {
    id: 'vidsrcme-ru',
    label: 'VidSrc · ME',
    description: 'Movie and TV embed',
    kind: 'vidsrc',
    origin: 'https://vidsrcme.ru',
  },
] as const

export type PlayerProvider = (typeof PLAYER_PROVIDERS)[number]
export type PlayerProviderId = PlayerProvider['id']
export type VidukiProvider = Extract<PlayerProvider, { kind: 'viduki' }>

export const VIDUKI_PROVIDERS = PLAYER_PROVIDERS.filter(
  (provider): provider is VidukiProvider => provider.kind === 'viduki',
)

export function getPlayerProvider(id: PlayerProviderId): PlayerProvider {
  return PLAYER_PROVIDERS.find((provider) => provider.id === id) ?? PLAYER_PROVIDERS[0]
}

export function buildProviderUrl(
  provider: PlayerProvider,
  title: Title,
  tmdbId: number,
  seasonNumber?: number,
  episodeNumber?: number,
) {
  if (provider.kind === 'viduki') {
    const kind = title.type === 'tv' ? 'tv' : 'movie'
    const path = kind === 'tv' && seasonNumber !== undefined && episodeNumber !== undefined
      ? `${provider.api}/${kind}/${tmdbId}/${seasonNumber}/${episodeNumber}`
      : `${provider.api}/${kind}/${tmdbId}`

    return `${provider.origin}/${path}?color=e01621`
  }

  const kind = title.type === 'tv' ? 'tv' : 'movie'
  const path = kind === 'tv' && seasonNumber !== undefined && episodeNumber !== undefined
    ? `embed/${kind}/${tmdbId}/${seasonNumber}/${episodeNumber}`
    : `embed/${kind}/${tmdbId}`

  return `${provider.origin}/${path}?autoplay=1&color=e50914`
}
