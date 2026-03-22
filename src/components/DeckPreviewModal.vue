<script setup lang="ts">
import { computed } from 'vue'
import { useCardUtils } from '@/composables/useCardUtils'
import type { GalleryDeck } from '@/types'

const props = defineProps<{ deck: GalleryDeck | null; show: boolean }>()
const emit  = defineEmits<{ close: []; import: [deck: GalleryDeck] }>()

const { getColor, getType, getRarity } = useCardUtils()

const sortedCards = computed(() => {
  if (!props.deck) return []
  return [...props.deck.cards].sort((a, b) => {
    const ca = a.cardIsXCost ? 99 : (a.cardCost ?? 0)
    const cb = b.cardIsXCost ? 99 : (b.cardCost ?? 0)
    return ca - cb || a.cardName.localeCompare(b.cardName)
  })
})

const maxBin = computed(() => Math.max(1, ...(props.deck?.costCurve ?? [0])))

function costLabel(card: { cardCost: number | null; cardIsXCost: boolean | null }) {
  if (card.cardIsXCost) return 'X'
  if (card.cardCost === null) return '—'
  return String(card.cardCost)
}

function relativeDate(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="show && deck"
           class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
           style="background: rgba(0,0,0,0.65);"
           @click.self="$emit('close')">
        <div class="w-full sm:max-w-xl rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col animate-slide-up"
             style="background:var(--bg-surface);border:1px solid var(--border-strong);max-height:90vh;">

          <div class="flex items-start gap-3 px-5 py-4 flex-shrink-0" style="border-bottom:1px solid var(--border);">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span v-if="deck.color" class="w-2.5 h-2.5 rounded-full flex-shrink-0" :class="getColor(deck.color).dot" />
                <p class="font-display text-base font-semibold truncate" style="color:var(--text-primary);">{{ deck.name }}</p>
              </div>
              <p class="text-xs mt-0.5" style="color:var(--text-muted);">
                by <span style="color:var(--text-secondary);">{{ deck.authorNickname }}</span>
                · {{ relativeDate(deck.publishedAt) }}
                · {{ deck.totalCards }} cards · avg {{ deck.avgCost }}
              </p>
            </div>
            <button class="btn !px-2 !py-1 text-xs flex-shrink-0" @click="$emit('close')">✕</button>
          </div>

          <div class="flex gap-4 px-5 py-2.5 flex-shrink-0 flex-wrap" style="border-bottom:1px solid var(--border);background:var(--bg-elevated);">
            <span class="text-xs" style="color:var(--text-muted);" v-if="deck.typeStats.Attack">⚔️ <span style="color:var(--text-primary);">{{ deck.typeStats.Attack }}</span> Attack</span>
            <span class="text-xs" style="color:var(--text-muted);" v-if="deck.typeStats.Skill">✦ <span style="color:var(--text-primary);">{{ deck.typeStats.Skill }}</span> Skill</span>
            <span class="text-xs" style="color:var(--text-muted);" v-if="deck.typeStats.Power">⚡ <span style="color:var(--text-primary);">{{ deck.typeStats.Power }}</span> Power</span>
            <span class="text-xs" style="color:var(--text-muted);" v-if="deck.typeStats.other">🃏 <span style="color:var(--text-primary);">{{ deck.typeStats.other }}</span> Other</span>
          </div>

          <div class="px-5 py-3 flex-shrink-0" style="border-bottom:1px solid var(--border);">
            <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:var(--text-muted);">Cost Curve</p>
            <div class="flex items-end gap-1.5 h-10">
              <div v-for="(count, i) in deck.costCurve" :key="i" class="flex flex-col items-center gap-0.5 flex-1">
                <div class="w-full rounded-sm transition-all"
                     :style="`height:${count ? Math.max(3,(count/maxBin)*32) : 2}px;background:${count?'var(--accent)':'var(--border-strong)'};`" />
                <span class="text-xs" style="color:var(--text-muted);">{{ i === 5 ? '5+' : i }}</span>
              </div>
              <div class="flex flex-col items-center gap-0.5 flex-1">
                <div class="w-full rounded-sm" style="height:2px;background:var(--border-strong);" />
                <span class="text-xs" style="color:var(--text-muted);">X</span>
              </div>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-3 space-y-1">
            <div v-for="card in sortedCards" :key="card.cardId"
                 class="flex items-center gap-2.5 px-3 py-2 rounded"
                 style="border:1px solid var(--border);background:var(--bg-elevated);">
              <span class="w-7 h-7 flex-shrink-0 flex items-center justify-center text-xs font-display font-bold rounded border"
                    :class="[getColor(card.cardColor).border, getColor(card.cardColor).accent]"
                    style="background:var(--bg-base);">{{ costLabel(card) }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate" style="color:var(--text-primary);">{{ card.cardName }}</p>
                <p class="text-xs truncate" :class="getColor(card.cardColor).accent">
                  {{ getColor(card.cardColor).label }} · {{ card.cardType }}
                </p>
              </div>
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="getColor(card.cardColor).dot" />
              <span class="text-xs font-mono font-bold flex-shrink-0" style="color:var(--accent);">×{{ card.count }}</span>
            </div>
          </div>

          <div class="flex gap-3 px-5 py-4 flex-shrink-0" style="border-top:1px solid var(--border);">
            <button class="btn text-sm flex-shrink-0" @click="$emit('close')">Cancel</button>
            <button class="btn-accent flex-1 py-2.5 text-sm font-medium" @click="$emit('import', deck)">
              📥 Import to My Decks
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,   .modal-fade-leave-to     { opacity: 0; }
</style>
