<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useThemeStore } from '@/stores/useThemeStore'

const route   = useRoute()
const themeStore = useThemeStore()

const mobileOpen = ref(false)
const isCards = computed(() => route.name === 'cards')
const isDeck  = computed(() => route.name === 'deck-builder' || route.name === 'deck-edit')

function closeMenu() { mobileOpen.value = false }
</script>

<template>
  <header
    class="fixed top-0 inset-x-0 z-50 border-b transition-colors"
    style="background: var(--bg-overlay); border-color: var(--border-strong);"
  >
    <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-4">
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-2 flex-shrink-0" @click="closeMenu">
        <span class="text-lg">⚔️</span>
        <div class="hidden sm:block">
          <p class="font-display text-sm font-semibold leading-none" style="color: var(--accent);">Deck Forge</p>
          <p class="text-xs leading-none mt-0.5" style="color: var(--text-muted); letter-spacing: 0.08em;">SLAY THE SPIRE II</p>
        </div>
        <p class="font-display text-sm font-semibold sm:hidden" style="color: var(--accent);">Deck Forge</p>
      </router-link>

      <!-- Desktop nav -->
      <nav class="hidden sm:flex items-center gap-1 ml-4">
        <router-link
          to="/cards"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-all"
          :style="isCards
            ? 'color: var(--accent); background: var(--accent-dim); outline: 1px solid var(--accent);'
            : 'color: var(--text-secondary);'"
        >
          <span>📜</span> Cards
        </router-link>
        <router-link
          to="/deck-builder"
          class="flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-all"
          :style="isDeck
            ? 'color: var(--accent); background: var(--accent-dim); outline: 1px solid var(--accent);'
            : 'color: var(--text-secondary);'"
        >
          <span>🗂</span> Deck Builder
        </router-link>
      </nav>

      <!-- Spacer -->
      <div class="flex-1" />

      <!-- Theme toggle -->
      <button
        class="btn !px-2.5 !py-1.5 flex-shrink-0 text-base"
        :title="themeStore.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="themeStore.toggle()"
      >
        {{ themeStore.theme === 'dark' ? '☀️' : '🌙' }}
      </button>

      <!-- Mobile hamburger -->
      <button
        class="sm:hidden btn !px-2.5 !py-1.5 text-sm"
        @click="mobileOpen = !mobileOpen"
        :aria-label="mobileOpen ? 'Close menu' : 'Open menu'"
      >
        {{ mobileOpen ? '✕' : '☰' }}
      </button>
    </div>

    <!-- Mobile nav drawer -->
    <transition name="drawer">
      <div
        v-if="mobileOpen"
        class="sm:hidden border-t px-4 py-3 space-y-1"
        style="background: var(--bg-surface); border-color: var(--border);"
      >
        <router-link
          to="/cards"
          class="flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium transition-all"
          :style="isCards ? 'color: var(--accent); background: var(--accent-dim);' : 'color: var(--text-secondary);'"
          @click="closeMenu"
        >
          <span>📜</span> Cards
        </router-link>
        <router-link
          to="/deck-builder"
          class="flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium transition-all"
          :style="isDeck ? 'color: var(--accent); background: var(--accent-dim);' : 'color: var(--text-secondary);'"
          @click="closeMenu"
        >
          <span>🗂</span> Deck Builder
        </router-link>
      </div>
    </transition>
  </header>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: all 0.2s ease; overflow: hidden; }
.drawer-enter-from, .drawer-leave-to       { opacity: 0; max-height: 0; }
.drawer-enter-to, .drawer-leave-from       { opacity: 1; max-height: 200px; }
</style>
