<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter }   from 'vue-router'
import { useGalleryStore }       from '@/stores/useGalleryStore'
import { useDecksStore }         from '@/stores/useDecksStore'
import { useCardUtils }          from '@/composables/useCardUtils'
import DeckPreviewModal          from '@/components/DeckPreviewModal.vue'
import type { GalleryDeck, CardColor } from '@/types'

const route  = useRoute()
const router = useRouter()
const galleryStore = useGalleryStore()
const decksStore   = useDecksStore()
const { getColor, colorOrder, colorConfig } = useCardUtils()

const filterColor    = ref<CardColor | ''>('')
const sortBy         = ref<'newest' | 'oldest' | 'name' | 'cards'>('newest')
const previewDeck    = ref<GalleryDeck | null>(null)
const showPreview    = ref(false)
const importedId     = ref<string | null>(null)
const urlImportDeck  = ref<GalleryDeck | null>(null)
const importDismissed = ref(false)

onMounted(() => {
  const param = route.query.import as string | undefined
  if (param) urlImportDeck.value = galleryStore.decodeImport(param)
})

const displayed = computed<GalleryDeck[]>(() => {
  let list = [...galleryStore.publishedDecks]
  if (filterColor.value) list = list.filter((d) => d.color === filterColor.value)
  list.sort((a, b) => {
    switch (sortBy.value) {
      case 'newest': return b.publishedAt - a.publishedAt
      case 'oldest': return a.publishedAt - b.publishedAt
      case 'name':   return a.name.localeCompare(b.name)
      case 'cards':  return b.totalCards - a.totalCards
    }
  })
  return list
})

function relativeDate(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function openPreview(deck: GalleryDeck) {
  previewDeck.value = deck; showPreview.value = true
}

function importDeck(deck: GalleryDeck) {
  const deckCards = galleryStore.toDeckCards(deck)
  const newDeck = decksStore.createDeck(
    deck.name,
    deck.description ?? `Imported from ${deck.authorNickname}`,
    deck.color,
  )
  deckCards.forEach((dc) => {
    for (let i = 0; i < dc.count; i++) decksStore.addCardToDeck(newDeck.id, dc.cardId)
  })
  importedId.value = deck.id
  showPreview.value = false
  setTimeout(() => importedId.value = null, 3000)
}

function importFromUrl() {
  if (!urlImportDeck.value) return
  importDeck(urlImportDeck.value)
  importDismissed.value = true
  router.replace('/deck-gallery')
}
function dismissUrlImport() { importDismissed.value = true; router.replace('/deck-gallery') }
function deletePublished(id: string) {
  if (confirm('Remove this deck from the gallery?')) galleryStore.unpublishDeck(id)
}
const maxBinOf = (curve: number[]) => Math.max(1, ...curve)
</script>

<template>
  <div class="space-y-5">

    <!-- URL Import Banner -->
    <transition name="banner">
      <div v-if="urlImportDeck && !importDismissed"
           class="rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
           style="background:var(--accent-dim);border:1px solid var(--accent);">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm" style="color:var(--accent);">📥 Deck Shared With You</p>
          <p class="text-sm mt-0.5" style="color:var(--text-secondary);">
            <strong>{{ urlImportDeck.name }}</strong> by {{ urlImportDeck.authorNickname }}
            · {{ urlImportDeck.totalCards }} cards
          </p>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <button class="btn text-sm" @click="openPreview(urlImportDeck!)">👁 Preview</button>
          <button class="btn-accent text-sm" @click="importFromUrl">📥 Import</button>
          <button class="btn text-xs !px-2" @click="dismissUrlImport">✕</button>
        </div>
      </div>
    </transition>

    <!-- Toast -->
    <transition name="toast">
      <div v-if="importedId"
           class="fixed bottom-6 right-6 z-50 rounded-xl px-5 py-3 shadow-xl flex items-center gap-3"
           style="background:var(--bg-elevated);border:1px solid var(--accent);color:var(--text-primary);">
        <span class="text-xl">✅</span>
        <div>
          <p class="font-medium text-sm">Deck Imported!</p>
          <p class="text-xs" style="color:var(--text-muted);">Go to Deck Builder to edit it.</p>
        </div>
      </div>
    </transition>

    <!-- Header -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl font-bold" style="color:var(--text-primary);">Deck Gallery</h1>
        <p class="text-sm mt-1" style="color:var(--text-muted);">
          <span style="color:var(--accent);">{{ displayed.length }}</span> / {{ galleryStore.publishedDecks.length }} decks
        </p>
      </div>
      <select v-model="sortBy" class="input text-sm !py-1.5 !w-auto">
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="name">A–Z</option>
        <option value="cards">Most cards</option>
      </select>
    </div>

    <!-- Loading / Error state -->
    <div v-if="galleryStore.loading" class="flex flex-wrap gap-4">
      <div v-for="n in 6" :key="n" class="rounded-xl overflow-hidden flex flex-col" style="background:var(--bg-surface);border:1px solid var(--border);width:100%">
        <div class="h-1 skeleton" />
        <div class="p-4 space-y-3">
          <div class="skeleton h-4 rounded w-1/2" />
          <div class="skeleton h-3 rounded w-1/3" />
          <div class="skeleton h-8 rounded w-full" />
        </div>
      </div>
    </div>

    <div v-else-if="galleryStore.error && !galleryStore.publishedDecks.length"
         class="flex flex-col items-center py-20 text-center">
      <p class="text-4xl mb-4">⚠️</p>
      <p class="font-medium mb-2" style="color:var(--text-primary);">{{ galleryStore.error }}</p>
      <button class="btn-accent mt-3" @click="galleryStore.fetchDecks()">Try Again</button>
    </div>

    <!-- Class filter pills -->
    <div class="flex flex-wrap gap-2">
      <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
        :style="filterColor==='' ? 'border-color:var(--accent);color:var(--accent);background:var(--accent-dim);' : 'border-color:var(--border-strong);color:var(--text-secondary);'"
        @click="filterColor=''">All Classes</button>
      <button v-for="color in colorOrder.slice(0,5)" :key="color"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
        :style="filterColor===color ? 'border-color:var(--accent);color:var(--accent);background:var(--accent-dim);' : 'border-color:var(--border-strong);color:var(--text-secondary);'"
        @click="filterColor = filterColor===color ? '' : color">
        <span class="w-2 h-2 rounded-full" :class="colorConfig[color].dot" />
        {{ colorConfig[color].label.replace('The ','') }}
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="!galleryStore.publishedDecks.length" class="flex flex-col items-center py-24 text-center">
      <p class="text-5xl mb-5">🏛️</p>
      <p class="font-display text-xl font-semibold mb-2" style="color:var(--text-primary);">Gallery is Empty</p>
      <p class="text-sm max-w-sm" style="color:var(--text-muted);">
        ยังไม่มี deck ใน gallery สร้าง deck ใน
        <router-link to="/deck-builder" class="underline" style="color:var(--accent);">Deck Builder</router-link>
        แล้วกด 🔗 Share → Publish to Gallery
      </p>
    </div>

    <!-- No filter results -->
    <div v-else-if="!displayed.length" class="flex flex-col items-center py-20 text-center">
      <p class="text-4xl mb-4">🔮</p>
      <p class="font-medium mb-2" style="color:var(--text-secondary);">No decks match this filter</p>
      <button class="btn" @click="filterColor=''">Clear Filter</button>
    </div>

    <!-- Deck grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="deck in displayed" :key="deck.id"
           class="rounded-xl flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg group"
           style="background:var(--bg-surface);border:1px solid var(--border);">

        <div class="h-1 w-full" :class="deck.color ? getColor(deck.color).dot : 'bg-slate-600'" />

        <div class="p-4 flex-1 space-y-3">
          <div class="flex items-start gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5 mb-0.5">
                <span v-if="deck.color" class="w-2 h-2 rounded-full flex-shrink-0" :class="getColor(deck.color).dot" />
                <p class="font-display text-sm font-semibold truncate" style="color:var(--text-primary);">{{ deck.name }}</p>
              </div>
              <p class="text-xs" style="color:var(--text-muted);">
                by <span style="color:var(--text-secondary);">{{ deck.authorNickname }}</span>
                · {{ relativeDate(deck.publishedAt) }}
              </p>
            </div>
            <button class="btn-danger !px-1.5 !py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    title="Remove from gallery" @click.stop="deletePublished(deck.id)">🗑</button>
          </div>

          <p v-if="deck.description" class="text-xs leading-relaxed" style="color:var(--text-muted);">{{ deck.description }}</p>

          <div class="flex gap-3 text-xs" style="color:var(--text-muted);">
            <span v-if="deck.typeStats.Attack">⚔️ <span style="color:var(--text-primary);">{{ deck.typeStats.Attack }}</span></span>
            <span v-if="deck.typeStats.Skill">✦ <span style="color:var(--text-primary);">{{ deck.typeStats.Skill }}</span></span>
            <span v-if="deck.typeStats.Power">⚡ <span style="color:var(--text-primary);">{{ deck.typeStats.Power }}</span></span>
            <span class="ml-auto">
              <span style="color:var(--text-primary);">{{ deck.totalCards }}</span> cards
              · avg <span style="color:var(--text-primary);">{{ deck.avgCost }}</span>
            </span>
          </div>

          <!-- Mini cost curve -->
          <div class="flex items-end gap-1 h-8">
            <div v-for="(count, i) in deck.costCurve" :key="i" class="flex flex-col items-center gap-0.5 flex-1">
              <div class="w-full rounded-sm transition-all"
                   :style="`height:${count ? Math.max(2,(count/maxBinOf(deck.costCurve))*24) : 1}px;background:${count?'var(--accent)':'var(--border)'};`" />
              <span style="color:var(--text-muted);font-size:9px;">{{ i === 5 ? '5+' : i }}</span>
            </div>
          </div>

          <!-- Card name preview -->
          <div class="flex flex-wrap gap-1">
            <span v-for="card in deck.cards.slice(0,5)" :key="card.cardId"
                  class="text-xs px-2 py-0.5 rounded-full truncate max-w-[120px]"
                  :class="getColor(card.cardColor).accent"
                  style="background:var(--bg-elevated);border:1px solid var(--border);">
              {{ card.cardName }}
            </span>
            <span v-if="deck.cards.length > 5" class="text-xs px-2 py-0.5 rounded-full"
                  style="background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-muted);">
              +{{ deck.cards.length - 5 }} more
            </span>
          </div>
        </div>

        <div class="flex gap-2 px-4 py-3" style="border-top:1px solid var(--border);background:var(--bg-elevated);">
          <button class="btn flex-1 text-xs" @click="openPreview(deck)">👁 Preview</button>
          <button class="btn-accent flex-1 text-xs" @click="importDeck(deck)">📥 Import</button>
        </div>
      </div>
    </div>

    <DeckPreviewModal :deck="previewDeck" :show="showPreview"
                      @close="showPreview = false" @import="importDeck" />
  </div>
</template>

<style scoped>
.banner-enter-active, .banner-leave-active { transition: all 0.25s ease; }
.banner-enter-from,   .banner-leave-to     { opacity: 0; transform: translateY(-8px); }
.toast-enter-active,  .toast-leave-active  { transition: all 0.3s ease; }
.toast-enter-from,    .toast-leave-to      { opacity: 0; transform: translateX(20px); }
</style>
