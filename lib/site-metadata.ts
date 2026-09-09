import type { Metadata } from 'next'
import type { PersonPage, ProductionCompanyPage, Title } from '@/lib/types'

export const SITE_NAME = 'Sceneflix'
export const SITE_DESCRIPTION =
  'Sceneflix. Watch movies, TV shows, anime and live TV in one red-hot streaming home.'
export const SITE_SOCIAL_IMAGE = '/sceneflix/sceneflix-icon-logo.png'

function trimText(value: string | undefined | null) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

function truncate(value: string, maxLength = 240) {
  const text = trimText(value)
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, '')}…`
}

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

function episodeCount(title: Title) {
  return title.seasons?.reduce((total, season) => {
    const loadedEpisodes = season.episodes.length
    if (loadedEpisodes > 0) return total + loadedEpisodes
    const tagCount = season.contentTags
      .map((tag) => /^(\d+) episodes?$/i.exec(tag)?.[1])
      .find(Boolean)
    return total + (tagCount ? Number(tagCount) : 0)
  }, 0) ?? 0
}

function titleFacts(title: Title) {
  const facts = [
    String(title.year),
    title.type === 'tv' ? 'TV show' : 'Movie',
    title.maturity,
    title.quality,
  ]

  if (title.rating > 0) facts.push(`${title.rating.toFixed(1)}/10`)
  if (title.runtime) facts.push(title.runtime)
  if (title.language && title.language !== 'Unknown') facts.push(title.language)
  if (title.type === 'tv' && title.seasons?.length) {
    facts.push(plural(title.seasons.length, 'season'))
    const episodes = episodeCount(title)
    if (episodes > 0) facts.push(plural(episodes, 'episode'))
  }
  if (title.status) facts.push(title.status)
  if (title.mediaListCategory) facts.push(title.mediaListCategory.replaceAll('_', ' '))
  if (typeof title.viewCount === 'number' && title.viewCount >= 0) {
    facts.push(plural(title.viewCount, 'view'))
  }

  return facts
}

function titleKeywords(title: Title) {
  return Array.from(
    new Set([
      title.title,
      title.type === 'tv' ? 'TV show' : 'movie',
      ...title.genres,
      ...title.keywords,
      ...(title.productionCompanies?.map((company) => company.name) ?? []),
    ].map(trimText).filter(Boolean)),
  )
}

export function sectionMetadata(title: string, description: string): Metadata {
  const pageTitle = `${title} | ${SITE_NAME}`
  return {
    title: pageTitle,
    description,
    openGraph: {
      type: 'website',
      title: pageTitle,
      description,
      siteName: SITE_NAME,
      images: [{ url: SITE_SOCIAL_IMAGE, alt: `${SITE_NAME} logo` }],
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description,
      images: [SITE_SOCIAL_IMAGE],
    },
  }
}

export function titleMetadata(title: Title): Metadata {
  const typeLabel = title.type === 'tv' ? 'TV show' : 'movie'
  const pageTitle = `${title.title} (${title.year}) | ${SITE_NAME}`
  const facts = titleFacts(title)
  const description = truncate(
    `${title.title} is a ${title.year} ${typeLabel} on ${SITE_NAME}. ${title.description} ${facts.join(' • ')}.`,
  )
  const image = title.backdrop || title.poster || SITE_SOCIAL_IMAGE
  const other: Record<string, string> = {
    'sceneflix:media-type': typeLabel,
    'sceneflix:year': String(title.year),
    'sceneflix:rating': title.rating > 0 ? title.rating.toFixed(1) : '',
    'sceneflix:maturity': title.maturity,
    'sceneflix:quality': title.quality,
    'sceneflix:language': title.language,
    'sceneflix:status': title.status,
    'sceneflix:genres': title.genres.join(', '),
  }

  if (title.runtime) other['sceneflix:runtime'] = title.runtime
  if (title.productionCompanies?.length) {
    other['sceneflix:production-companies'] = title.productionCompanies.map((company) => company.name).join(', ')
  }

  if (title.mediaListCategory) other['sceneflix:media-list-category'] = title.mediaListCategory
  if (title.type === 'tv' && title.seasons?.length) {
    other['sceneflix:seasons'] = String(title.seasons.length)
    const episodes = episodeCount(title)
    if (episodes > 0) other['sceneflix:episodes'] = String(episodes)
  }
  if (typeof title.viewCount === 'number' && title.viewCount >= 0) {
    other['sceneflix:view-count'] = String(title.viewCount)
  }

  return {
    title: pageTitle,
    description,
    keywords: titleKeywords(title),
    openGraph: {
      type: 'website',
      title: pageTitle,
      description,
      siteName: SITE_NAME,
      images: [{ url: image, alt: `${title.title} backdrop` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [image],
    },
    other,
  }
}

export function personMetadata(person: PersonPage): Metadata {
  const pageTitle = `${person.name} | ${SITE_NAME}`
  const creditCount = person.movieCredits.length + person.tvCredits.length
  const details = [
    person.knownForDepartment,
    creditCount > 0 ? `${plural(creditCount, 'title')} in the catalog` : undefined,
    person.placeOfBirth,
  ].filter(Boolean).join(' • ')
  const description = truncate(
    `${person.name}${person.knownForDepartment ? ` is known for ${person.knownForDepartment.toLowerCase()}` : ''} on ${SITE_NAME}. ${person.biography || details || `Explore ${person.name}'s movie and TV credits.`}`,
  )
  const image = person.photo || SITE_SOCIAL_IMAGE

  return {
    title: pageTitle,
    description,
    keywords: [person.name, person.knownForDepartment, 'Sceneflix cast and crew'].filter(Boolean) as string[],
    openGraph: {
      type: 'website',
      title: pageTitle,
      description,
      siteName: SITE_NAME,
      images: [{ url: image, alt: person.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [image],
    },
    other: {
      'sceneflix:page-type': 'person',
      'sceneflix:movie-credits': String(person.movieCredits.length),
      'sceneflix:tv-credits': String(person.tvCredits.length),
    },
  }
}

export function productionCompanyMetadata(company: ProductionCompanyPage): Metadata {
  const pageTitle = `${company.name} | ${SITE_NAME}`
  const totalTitles = company.movies.length + company.tvShows.length
  const description = truncate(
    `${company.name} has ${plural(totalTitles, 'movie or TV title')} in the ${SITE_NAME} catalog${company.originCountry ? ` and is based in ${company.originCountry}` : ''}. Explore its movies and TV shows.`,
  )
  const image = company.logo || SITE_SOCIAL_IMAGE

  return {
    title: pageTitle,
    description,
    keywords: [company.name, company.originCountry, 'production company', 'Sceneflix catalog'].filter(Boolean) as string[],
    openGraph: {
      type: 'website',
      title: pageTitle,
      description,
      siteName: SITE_NAME,
      images: [{ url: image, alt: `${company.name} logo` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [image],
    },
    other: {
      'sceneflix:page-type': 'production-company',
      'sceneflix:movies': String(company.movies.length),
      'sceneflix:tv-shows': String(company.tvShows.length),
    },
  }
}

export function searchMetadata(query?: string): Metadata {
  const cleanQuery = trimText(query)
  const description = cleanQuery
    ? `Explore ${SITE_NAME} search results for “${cleanQuery}” across movies, TV shows, people and genres.`
    : `Search the ${SITE_NAME} catalog for movies, TV shows, people and genres.`

  return sectionMetadata(cleanQuery ? `Search results for “${cleanQuery}”` : 'Search', description)
}
