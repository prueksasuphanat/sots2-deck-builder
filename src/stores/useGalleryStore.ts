import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type { Deck, ApiCard, GalleryCard, GalleryDeck, DeckCard, CardColor } from '@/types'

function encode(data: object): string {
  const json = JSON.stringify(data)
  const bytes = new TextEncoder().encode(json)
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(binary)
}

function decode<T>(str: string): T {
  const binary = atob(str)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as T
}

function buildGalleryDeck(deck: Deck, apiCards: ApiCard[], nickname: string): GalleryDeck {
  const cards: GalleryCard[] = deck.cards
    .map((dc) => {
      const api = apiCards.find((c) => c.id === dc.cardId)
      if (!api) return null
      return { cardId: dc.cardId, cardName: api.name, cardColor: api.color, cardType: api.type,
               cardRarity: api.rarity, cardCost: api.cost, cardIsXCost: api.is_x_cost, count: dc.count }
    })
    .filter(Boolean) as GalleryCard[]

  const totalCards = cards.reduce((s, c) => s + c.count, 0)
  let totalCost = 0, costCount = 0
  for (const c of cards) {
    if (!c.cardIsXCost && c.cardCost !== null) { totalCost += c.cardCost * c.count; costCount += c.count }
  }
  const avgCost = costCount ? (totalCost / costCount).toFixed(1) : '—'

  const typeStats = { Attack: 0, Skill: 0, Power: 0, other: 0 }
  for (const c of cards) {
    if (c.cardType === 'Attack')     typeStats.Attack += c.count
    else if (c.cardType === 'Skill') typeStats.Skill  += c.count
    else if (c.cardType === 'Power') typeStats.Power  += c.count
    else                             typeStats.other  += c.count
  }

  const costCurve = [0, 1, 2, 3, 4, 5].map((n) =>
    cards.filter(({ cardIsXCost, cardCost }) =>
      !cardIsXCost && cardCost !== null && (n === 5 ? cardCost >= 5 : cardCost === n)
    ).reduce((s, c) => s + c.count, 0)
  )

  return {
    id: crypto.randomUUID(), name: deck.name, description: deck.description, color: deck.color,
    cards, authorNickname: nickname, publishedAt: Date.now(),
    totalCards, avgCost, typeStats, costCurve,
  }
}

export const useGalleryStore = defineStore('gallery', () => {
  const publishedDecks = useLocalStorage<GalleryDeck[]>('sots2-gallery-v1', [])

  function publishDeck(deck: Deck, apiCards: ApiCard[], nickname: string): GalleryDeck {
    const gd = buildGalleryDeck(deck, apiCards, nickname)
    publishedDecks.value = [gd, ...publishedDecks.value]
    return gd
  }

  function unpublishDeck(id: string) {
    publishedDecks.value = publishedDecks.value.filter((d) => d.id !== id)
  }

  function encodeShareUrl(deck: Deck, apiCards: ApiCard[]): string {
    const gd = buildGalleryDeck(deck, apiCards, '(via link)')
    const encoded = encode(gd)
    const origin = window.location.origin
    const base = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? ''
    return `${origin}${base}/deck-gallery?import=${encoded}`
  }

  function decodeImport(encoded: string): GalleryDeck | null {
    try { return decode<GalleryDeck>(encoded) }
    catch { return null }
  }

  function toDeckCards(gd: GalleryDeck): DeckCard[] {
    return gd.cards.map((c) => ({ cardId: c.cardId, count: c.count }))
  }

  return { publishedDecks, publishDeck, unpublishDeck, encodeShareUrl, decodeImport, toDeckCards }
})
