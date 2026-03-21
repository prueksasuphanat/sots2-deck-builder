<script setup lang="ts">
import { useCardsStore } from '@/stores/useCardsStore'
import { useCardUtils } from '@/composables/useCardUtils'

const store = useCardsStore()
const { colorConfig, typeConfig, rarityConfig, colorOrder, typeOrder, rarityOrder, keywordOrder } = useCardUtils()

// Active filter count for badge
function activeCount() {
  let n = 0
  if (store.filters.color)   n++
  if (store.filters.type)    n++
  if (store.filters.rarity)  n++
  if (store.filters.keyword) n++
  if (store.filters.tag)     n++
  if (store.filters.search)  n++
  return n
}
</script>

<template>
  <div class="rounded-lg p-4 space-y-4" style="background: var(--bg-surface); border: 1px solid var(--border);">

    <!-- Search -->
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style="color: var(--text-muted);">🔍</span>
      <input
        :value="store.filters.search"
        type="text"
        placeholder="Search cards…"
        class="input pl-9"
        @input="store.setSearch(($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Class -->
    <div>
      <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--text-muted);">Class</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="color in colorOrder"
          :key="color"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all border"
          :style="store.filters.color === color
            ? 'border-color: var(--accent); color: var(--accent); background: var(--accent-dim);'
            : 'border-color: var(--border-strong); color: var(--text-secondary);'"
          @click="store.toggleColor(color)"
        >
          <span class="w-2 h-2 rounded-full" :class="colorConfig[color].dot" />
          {{ colorConfig[color].label.replace('The ', '') }}
        </button>
      </div>
    </div>

    <!-- Type -->
    <div>
      <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--text-muted);">Type</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="type in typeOrder"
          :key="type"
          class="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all border"
          :style="store.filters.type === type
            ? 'border-color: var(--accent); color: var(--accent); background: var(--accent-dim);'
            : 'border-color: var(--border-strong); color: var(--text-secondary);'"
          @click="store.toggleType(type)"
        >
          {{ typeConfig[type].icon }} {{ typeConfig[type].label }}
        </button>
      </div>
    </div>

    <!-- Rarity -->
    <div>
      <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--text-muted);">Rarity</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="rarity in rarityOrder"
          :key="rarity"
          class="px-2.5 py-1 rounded text-xs font-medium transition-all border"
          :style="store.filters.rarity === rarity
            ? 'border-color: var(--accent); color: var(--accent); background: var(--accent-dim);'
            : 'border-color: var(--border-strong); color: var(--text-secondary);'"
          @click="store.toggleRarity(rarity)"
        >
          {{ rarityConfig[rarity]?.label ?? rarity }}
        </button>
      </div>
    </div>

    <!-- Keyword -->
    <div>
      <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--text-muted);">Keyword</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="kw in keywordOrder"
          :key="kw"
          class="px-2.5 py-1 rounded text-xs font-medium transition-all border"
          :style="store.filters.keyword === kw
            ? 'border-color: var(--accent); color: var(--accent); background: var(--accent-dim);'
            : 'border-color: var(--border-strong); color: var(--text-secondary);'"
          @click="store.toggleKeyword(kw)"
        >
          {{ kw }}
        </button>
      </div>
    </div>

    <!-- Sort -->
    <div>
      <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color: var(--text-muted);">Sort by</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="opt in (['compendium','name','cost','type','rarity'] as const)"
          :key="opt"
          class="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium capitalize transition-all border"
          :style="store.sort === opt
            ? 'border-color: var(--accent); color: var(--accent); background: var(--accent-dim);'
            : 'border-color: var(--border-strong); color: var(--text-secondary);'"
          @click="store.setSort(opt)"
        >
          {{ opt }}
          <span v-if="store.sort === opt">{{ store.sortDir === 'asc' ? '↑' : '↓' }}</span>
        </button>
      </div>
    </div>

    <!-- View mode + Reset -->
    <div class="flex items-center justify-between pt-2" style="border-top: 1px solid var(--border);">
      <div class="flex gap-1">
        <button
          class="btn !px-2 !py-1 text-base"
          :style="store.viewMode==='grid' ? 'color: var(--accent); border-color: var(--accent); background: var(--accent-dim);' : ''"
          title="Grid view" @click="store.setViewMode('grid')"
        >⊞</button>
        <button
          class="btn !px-2 !py-1 text-base"
          :style="store.viewMode==='list' ? 'color: var(--accent); border-color: var(--accent); background: var(--accent-dim);' : ''"
          title="List view" @click="store.setViewMode('list')"
        >☰</button>
      </div>
      <button class="btn text-xs" @click="store.resetFilters()">
        Reset
        <span v-if="activeCount() > 0" class="ml-1 px-1.5 rounded-full text-xs font-bold"
              style="background: var(--accent); color: var(--bg-base);">{{ activeCount() }}</span>
      </button>
    </div>
  </div>
</template>
