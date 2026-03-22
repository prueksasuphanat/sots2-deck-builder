import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Deck, ApiCard, GalleryCard, GalleryDeck, DeckCard } from '@/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL  as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string
const TABLE = 'gallery_decks'

const headers = () => ({
  'Content-Type':  'application/json',
  'apikey':        SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
})

const isConfigured = () =>
  !!(SUPABASE_URL && SUPABASE_KEY &&
     !SUPABASE_URL.includes('xxxx') &&
     SUPABASE_URL.startsWith('https'))

// ── UTF-8-safe base64 ──
function encode(data: object): string {
  const bytes  = new TextEncoder().encode(JSON.stringify(data))
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(binary)
}
function decode<T>(str: string): T {
  const binary = atob(str)
  const bytes  = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes)) as T
}

function buildGalleryDeck(deck: Deck, apiCards: ApiCard[], nickname: string): GalleryDeck {
  const cards: GalleryCard[] = deck.cards
    .map((dc) => {
      const api = apiCards.find((c) => c.id === dc.cardId)
      if (!api) return null
      return { cardId: dc.cardId, cardName: api.name, cardColor: api.color,
               cardType: api.type, cardRarity: api.rarity, cardCost: api.cost,
               cardIsXCost: api.is_x_cost, count: dc.count }
    })
    .filter(Boolean) as GalleryCard[]

  const totalCards = cards.reduce((s, c) => s + c.count, 0)
  let totalCost = 0, costCount = 0
  for (const c of cards) {
    if (!c.cardIsXCost && c.cardCost !== null) { totalCost += c.cardCost * c.count; costCount += c.count }
  }
  const typeStats = { Attack: 0, Skill: 0, Power: 0, other: 0 }
  for (const c of cards) {
    if (c.cardType === 'Attack')     typeStats.Attack += c.count
    else if (c.cardType === 'Skill') typeStats.Skill  += c.count
    else if (c.cardType === 'Power') typeStats.Power  += c.count
    else                             typeStats.other  += c.count
  }
  const costCurve = [0,1,2,3,4,5].map((n) =>
    cards.filter(({ cardIsXCost, cardCost }) =>
      !cardIsXCost && cardCost !== null && (n === 5 ? cardCost >= 5 : cardCost === n)
    ).reduce((s, c) => s + c.count, 0)
  )
  return {
    id: crypto.randomUUID(), name: deck.name, description: deck.description, color: deck.color,
    cards, authorNickname: nickname, publishedAt: Date.now(),
    totalCards, avgCost: costCount ? (totalCost/costCount).toFixed(1) : '—',
    typeStats, costCurve,
  }
}

interface DbRow {
  id: string; name: string; description?: string; color?: string; cards: GalleryCard[]
  author_nickname: string; published_at: number; total_cards: number; avg_cost: string
  type_stats: GalleryDeck['typeStats']; cost_curve: number[]
}

const toGallery = (r: DbRow): GalleryDeck => ({
  id: r.id, name: r.name, description: r.description, color: r.color as any,
  cards: r.cards, authorNickname: r.author_nickname, publishedAt: r.published_at,
  totalCards: r.total_cards, avgCost: r.avg_cost, typeStats: r.type_stats, costCurve: r.cost_curve,
})
const toRow = (gd: GalleryDeck): DbRow => ({
  id: gd.id, name: gd.name, description: gd.description, color: gd.color,
  cards: gd.cards, author_nickname: gd.authorNickname, published_at: gd.publishedAt,
  total_cards: gd.totalCards, avg_cost: gd.avgCost, type_stats: gd.typeStats, cost_curve: gd.costCurve,
})

export const useGalleryStore = defineStore('gallery', () => {
  const publishedDecks = ref<GalleryDeck[]>([])
  const loading        = ref(false)
  const error          = ref<string | null>(null)
  const configured     = ref(isConfigured())

  async function fetchDecks() {
    if (!isConfigured()) {
      error.value = 'Supabase ยังไม่ได้ตั้งค่า — ดู README สำหรับ setup'
      return
    }
    loading.value = true; error.value = null
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE}?order=published_at.desc`,
        { headers: headers() }
      )
      if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
      const rows: DbRow[] = await res.json()
      publishedDecks.value = rows.map(toGallery)
    } catch (e: any) {
      error.value = e?.message ?? 'Failed to load gallery'
    } finally {
      loading.value = false
    }
  }

  async function publishDeck(deck: Deck, apiCards: ApiCard[], nickname: string): Promise<GalleryDeck | null> {
    if (!isConfigured()) { error.value = 'Supabase ยังไม่ได้ตั้งค่า'; return null }
    const gd = buildGalleryDeck(deck, apiCards, nickname)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}`,
      { method: 'POST', headers: { ...headers(), Prefer: 'return=representation' }, body: JSON.stringify(toRow(gd)) }
    )
    if (!res.ok) throw new Error(`Publish failed: ${await res.text()}`)
    publishedDecks.value = [gd, ...publishedDecks.value]
    return gd
  }

  async function unpublishDeck(id: string) {
    publishedDecks.value = publishedDecks.value.filter((d) => d.id !== id)
    if (!isConfigured()) return
    await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?id=eq.${id}`, { method: 'DELETE', headers: headers() })
  }

  function encodeShareUrl(deck: Deck, apiCards: ApiCard[]): string {
    const gd  = buildGalleryDeck(deck, apiCards, '(via link)')
    const origin = window.location.origin
    const base   = import.meta.env.BASE_URL?.replace(/\/$/, '') ?? ''
    return `${origin}${base}/deck-gallery?import=${encode(gd)}`
  }

  function decodeImport(encoded: string): GalleryDeck | null {
    try { return decode<GalleryDeck>(encoded) } catch { return null }
  }

  function toDeckCards(gd: GalleryDeck): DeckCard[] {
    return gd.cards.map((c) => ({ cardId: c.cardId, count: c.count }))
  }

  fetchDecks()

  return { publishedDecks, loading, error, configured, fetchDecks, publishDeck, unpublishDeck, encodeShareUrl, decodeImport, toDeckCards }
})
