<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCardsStore }  from '@/stores/useCardsStore'
import { useGalleryStore } from '@/stores/useGalleryStore'
import type { Deck } from '@/types'

const props = defineProps<{ deck: Deck | null; show: boolean }>()
const emit  = defineEmits<{ close: [] }>()

const cardsStore   = useCardsStore()
const galleryStore = useGalleryStore()

const tab       = ref<'link' | 'publish'>('link')
const nickname  = ref(localStorage.getItem('sots2-nickname') ?? '')
const copied    = ref(false)
const published = ref(false)
const busy         = ref(false)
const publishError = ref<string | null>(null)

watch(() => props.show, (v) => {
  if (v) { tab.value = 'link'; copied.value = false; published.value = false }
})

const shareUrl = computed(() => {
  if (!props.deck) return ''
  return galleryStore.encodeShareUrl(props.deck, cardsStore.cards)
})

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
  } catch {
    const el = document.createElement('textarea')
    el.value = shareUrl.value
    document.body.appendChild(el); el.select(); document.execCommand('copy'); el.remove()
  }
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

async function publish() {
  if (!nickname.value.trim() || !props.deck) return
  busy.value = true
  publishError.value = null
  try {
    localStorage.setItem('sots2-nickname', nickname.value.trim())
    await galleryStore.publishDeck(props.deck, cardsStore.cards, nickname.value.trim())
    published.value = true
    setTimeout(() => { published.value = false; emit('close') }, 1800)
  } catch (e: any) {
    publishError.value = e?.message ?? 'Failed to publish'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="show"
           class="fixed inset-0 z-50 flex items-center justify-center p-4"
           style="background: rgba(0,0,0,0.6);"
           @click.self="$emit('close')">
        <div class="w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-slide-up"
             style="background: var(--bg-surface); border: 1px solid var(--border-strong);">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4" style="border-bottom: 1px solid var(--border);">
            <div>
              <p class="font-display text-sm font-semibold" style="color: var(--text-primary);">Share Deck</p>
              <p class="text-xs mt-0.5" style="color: var(--text-muted);">{{ deck?.name }}</p>
            </div>
            <button class="btn !px-2 !py-1 text-xs" @click="$emit('close')">✕</button>
          </div>

          <!-- Tabs -->
          <div class="flex" style="border-bottom: 1px solid var(--border);">
            <button class="flex-1 py-2.5 text-sm font-medium transition-all"
              :style="tab==='link' ? 'color:var(--accent);border-bottom:2px solid var(--accent);background:var(--accent-dim);' : 'color:var(--text-muted);'"
              @click="tab='link'">🔗 Copy Link</button>
            <button class="flex-1 py-2.5 text-sm font-medium transition-all"
              :style="tab==='publish' ? 'color:var(--accent);border-bottom:2px solid var(--accent);background:var(--accent-dim);' : 'color:var(--text-muted);'"
              @click="tab='publish'">🌐 Publish to Gallery</button>
          </div>

          <!-- Copy Link -->
          <div v-if="tab==='link'" class="p-5 space-y-4">
            <p class="text-sm" style="color: var(--text-secondary);">
              ส่ง link นี้ให้คนอื่น — เปิดแล้ว import deck ได้เลยโดยไม่ต้อง sign up
            </p>
            <div class="rounded-lg p-3 flex items-center gap-2 text-xs font-mono break-all"
                 style="background:var(--bg-elevated);border:1px solid var(--border);color:var(--text-muted);">
              <span class="flex-1 min-w-0 truncate">{{ shareUrl }}</span>
            </div>
            <button class="btn-accent w-full py-2.5 text-sm font-medium"
                    :class="{ 'opacity-80': copied }" @click="copyLink">
              <span v-if="copied">✅ Copied!</span>
              <span v-else>📋 Copy Link</span>
            </button>
          </div>

          <!-- Publish -->
          <div v-if="tab==='publish'" class="p-5 space-y-4">
            <div v-if="published" class="text-center py-6 space-y-2">
              <p class="text-3xl">🎉</p>
              <p class="font-medium" style="color: var(--text-primary);">Published to Gallery!</p>
              <p class="text-sm" style="color: var(--text-muted);">คนอื่นสามารถดูและ import deck ของคุณได้แล้ว</p>
            </div>
            <template v-else>
              <p class="text-sm" style="color: var(--text-secondary);">
                โชว์ deck ของคุณใน Deck Gallery ให้คนอื่น browse และ import ได้
              </p>
              <div class="rounded-lg p-3 space-y-1" style="background:var(--bg-elevated);border:1px solid var(--border);">
                <p class="text-xs font-semibold" style="color: var(--text-primary);">{{ deck?.name }}</p>
                <p class="text-xs" style="color: var(--text-muted);">
                  {{ deck?.cards.reduce((s,c) => s+c.count, 0) ?? 0 }} cards
                  <span v-if="deck?.description" class="ml-2">· {{ deck.description }}</span>
                </p>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted);">Your Nickname</label>
                <input v-model="nickname" type="text" placeholder="e.g. SpiralKnight" maxlength="30"
                       class="input text-sm" @keydown.enter="publish" />
                <p class="text-xs" style="color: var(--text-muted);">จะแสดงใน gallery ว่าใครเป็นคนสร้าง deck</p>
              </div>
              <button class="btn-accent w-full py-2.5 text-sm font-medium"
                      :disabled="!nickname.trim() || busy" @click="publish">
                <span v-if="busy">Publishing…</span>
                <span v-else>🌐 Publish to Gallery</span>
              </button>
              <p v-if="publishError" class="text-xs text-red-400 text-center">{{ publishError }}</p>
            </template>
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
