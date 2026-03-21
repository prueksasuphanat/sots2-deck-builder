import type { ApiCard, ApiFilters } from '@/types'

const BASE_URL = 'https://spire-codex.com/api/cards'
const IMAGE_BASE = 'https://spire-codex.com'

export function getCardImageUrl(card: ApiCard): string | null {
  if (card.image_url) return `${IMAGE_BASE}${card.image_url}`
  if (card.beta_image_url) return `${IMAGE_BASE}${card.beta_image_url}`
  return null
}

/**
 * Parse description markup:
 *  [gold]text[/gold]  →  text (styled via class)
 *  \n                 →  actual newline
 */
export function parseDescription(raw: string): string {
  return raw
    .replace(/\[gold\](.*?)\[\/gold\]/g, '$1')
    .replace(/\[.*?\]/g, '')        // strip any other tags
    .replace(/\\n/g, '\n')
}

export async function fetchCards(filters: Partial<ApiFilters & { lang: string }>): Promise<ApiCard[]> {
  const params = new URLSearchParams()
  params.set('lang', filters.lang ?? 'eng')

  if (filters.color)   params.set('color',   filters.color)
  if (filters.type)    params.set('type',    filters.type)
  if (filters.rarity)  params.set('rarity',  filters.rarity)
  if (filters.keyword) params.set('keyword', filters.keyword)
  if (filters.tag)     params.set('tag',     filters.tag)
  if (filters.search)  params.set('search',  filters.search)

  const res = await fetch(`${BASE_URL}?${params.toString()}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
  return res.json() as Promise<ApiCard[]>
}
