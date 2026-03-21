<script setup lang="ts">
import { computed, ref } from "vue";
import type { ApiCard } from "@/types";
import { useCardUtils } from "@/composables/useCardUtils";
import { getCardImageUrl } from "@/services/api";

const props = defineProps<{
  card: ApiCard;
  count?: number;
  compact?: boolean;
  selectable?: boolean;
  selected?: boolean;
  inDeck?: boolean;
}>();

const emit = defineEmits<{
  add: [card: ApiCard];
  remove: [card: ApiCard];
  click: [card: ApiCard];
}>();

const { getColor, getType, getRarity } = useCardUtils();

const cc = computed(() => getColor(props.card.color));
const tc = computed(() => getType(props.card.type));
const rc = computed(() => getRarity(props.card.rarity));

const costLabel = computed(() => {
  if (props.card.is_x_cost) return "X";
  if (props.card.is_x_star_cost) return "X*";
  if (props.card.cost === null) return "—";
  return String(props.card.cost);
});

const imageUrl = computed(() => getCardImageUrl(props.card));
const imgLoaded = ref(false);
const imgError = ref(false);

// Tooltip state
const showTooltip = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);

function onImgLoad() {
  imgLoaded.value = true;
}
function onImgError() {
  imgError.value = true;
}

function descHtml(raw: string): string {
  return raw
    .replace(/\[gold\](.*?)\[\/gold\]/g, '<span class="highlight">$1</span>')
    .replace(/\[.*?\]/g, "")
    .replace(/\n/g, "<br>");
}

function onDescMouseEnter(e: MouseEvent) {
  showTooltip.value = true;
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  tooltipX.value = rect.left + rect.width / 2;
  tooltipY.value = rect.top - 10;
}

function onDescMouseLeave() {
  showTooltip.value = false;
}
</script>

<template>
  <!-- ──────────── COMPACT / LIST ROW ──────────── -->
  <div
    v-if="compact"
    class="group flex items-center gap-2.5 px-3 py-2 rounded cursor-pointer transition-all duration-150 select-none"
    :style="
      [
        'border: 1px solid var(--border);',
        'background: var(--bg-surface);',
        selected
          ? 'border-color: var(--accent); background: var(--accent-dim);'
          : '',
      ].join('')
    "
    @click="$emit('click', card)"
    @mouseenter="
      (e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.borderColor =
            'var(--border-strong)';
      }
    "
    @mouseleave="
      (e) => {
        if (!selected)
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
      }
    "
  >
    <!-- Cost badge -->
    <span
      class="w-7 h-7 flex-shrink-0 flex items-center justify-center text-xs font-display font-bold rounded border"
      :class="[cc.border, cc.accent]"
      style="background: var(--bg-base)"
      >{{ costLabel }}</span
    >

    <!-- Thumbnail (compact) -->
    <div
      class="w-8 h-8 flex-shrink-0 rounded overflow-hidden flex items-center justify-center"
      style="background: var(--bg-elevated)"
    >
      <img
        v-if="imageUrl && !imgError"
        :src="imageUrl"
        :alt="card.name"
        class="w-full h-full object-cover"
        @error="onImgError"
      />
      <span v-else class="text-base">{{ tc.icon }}</span>
    </div>

    <!-- Name + class -->
    <div class="flex-1 min-w-0">
      <p
        class="text-sm font-medium leading-tight truncate"
        style="color: var(--text-primary)"
      >
        {{ card.name }}
      </p>
      <p class="text-xs truncate" :class="cc.accent">{{ cc.label }}</p>
    </div>

    <!-- Type -->
    <span class="text-sm flex-shrink-0" :title="tc.label">{{ tc.icon }}</span>

    <!-- Rarity dot -->
    <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="cc.dot" />

    <!-- Count controls (pool mode) -->
    <div
      v-if="count !== undefined && !inDeck"
      class="flex items-center gap-0.5 flex-shrink-0"
    >
      <button
        class="w-5 h-5 rounded text-xs flex items-center justify-center transition-colors hover:text-red-400"
        style="border: 1px solid var(--border-strong); color: var(--text-muted)"
        @click.stop="$emit('remove', card)"
      >
        −
      </button>
      <span
        class="w-5 text-center text-xs font-mono"
        style="color: var(--accent)"
        >{{ count }}</span
      >
      <button
        class="w-5 h-5 rounded text-xs flex items-center justify-center transition-colors hover:text-emerald-400"
        style="border: 1px solid var(--border-strong); color: var(--text-muted)"
        @click.stop="$emit('add', card)"
      >
        +
      </button>
    </div>

    <!-- In-deck controls -->
    <div v-if="inDeck" class="flex items-center gap-0.5 flex-shrink-0">
      <button
        class="w-5 h-5 rounded text-xs flex items-center justify-center transition-colors hover:text-red-400"
        style="border: 1px solid var(--border-strong); color: var(--text-muted)"
        @click.stop="$emit('remove', card)"
      >
        −
      </button>
      <span
        class="w-5 text-center text-xs font-mono"
        style="color: var(--accent)"
        >{{ count }}</span
      >
      <button
        class="w-5 h-5 rounded text-xs flex items-center justify-center transition-colors hover:text-emerald-400"
        style="border: 1px solid var(--border-strong); color: var(--text-muted)"
        @click.stop="$emit('add', card)"
      >
        +
      </button>
    </div>
  </div>

  <!-- ──────────── FULL CARD ──────────── -->
  <div
    v-else
    class="relative rounded-lg card-hover cursor-pointer group animate-fade-in flex flex-col overflow-hidden"
    :class="[cc.bg, selected ? cc.glow : '']"
    style="width: 164px; height: 260px; border: 1px solid var(--border-strong)"
    @click="$emit('click', card)"
  >
    <!-- Rarity bar -->
    <div
      class="h-0.5 w-full flex-shrink-0"
      :class="{
        'bg-slate-500': ['Basic', 'Common'].includes(card.rarity),
        'bg-sky-500': card.rarity === 'Uncommon',
        'bg-amber-400': card.rarity === 'Rare',
        'bg-purple-500': card.rarity === 'Ancient',
      }"
    />

    <!-- Header row -->
    <div class="flex items-center gap-1.5 px-2.5 pt-2.5 pb-1.5">
      <span
        class="w-7 h-7 flex-shrink-0 flex items-center justify-center text-xs font-display font-bold rounded border"
        :class="[cc.border, cc.accent]"
        style="background: var(--bg-base)"
        >{{ costLabel }}</span
      >
      <p
        class="text-xs font-semibold leading-tight flex-1 min-w-0 truncate"
        style="color: var(--text-primary)"
      >
        {{ card.name }}
      </p>
    </div>

    <!-- Card image -->
    <div
      class="mx-2.5 rounded overflow-hidden flex items-center justify-center relative"
      style="
        height: 96px;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
      "
    >
      <!-- Skeleton while loading -->
      <div
        v-if="imageUrl && !imgLoaded && !imgError"
        class="absolute inset-0 skeleton"
      />

      <!-- Real image -->
      <img
        v-if="imageUrl && !imgError"
        :src="imageUrl"
        :alt="card.name"
        class="w-full h-full object-cover transition-opacity duration-300"
        :style="imgLoaded ? 'opacity:1' : 'opacity:0'"
        @load="onImgLoad"
        @error="onImgError"
      />

      <!-- Fallback emoji -->
      <span v-if="!imageUrl || imgError" class="text-3xl">{{ tc.icon }}</span>
    </div>

    <!-- Type + Rarity tags -->
    <div class="flex items-center gap-1 px-2.5 pt-1.5">
      <span class="badge text-xs" :class="tc.color">{{ tc.label }}</span>
      <span class="badge text-xs" :class="rc.color">{{ rc.label }}</span>
    </div>

    <!-- Description (with markup parsing) -->
    <div class="px-2.5 pt-1.5 pb-1 flex-1">
      <p
        class="card-desc text-xs leading-relaxed"
        style="color: var(--text-secondary)"
        v-html="descHtml(card.description)"
        @mouseenter="onDescMouseEnter"
        @mouseleave="onDescMouseLeave"
      />
    </div>

    <!-- Keywords badges -->
    <div
      v-if="card.keywords?.length"
      class="flex flex-wrap gap-1 px-2.5 pb-1.5"
    >
      <span
        v-for="kw in card.keywords"
        :key="kw"
        class="text-xs px-1.5 py-0.5 rounded-full font-medium"
        style="
          background: var(--accent-dim);
          color: var(--accent);
          border: 1px solid var(--accent);
        "
        >{{ kw }}</span
      >
    </div>

    <!-- Class label -->
    <span
      class="absolute top-2 right-2 text-xs font-medium"
      :class="cc.accent"
      style="z-index: 10"
    >
      {{ cc.label.split(" ")[1] ?? cc.label }}
    </span>

    <!-- Hover overlay: Add to deck -->
    <div
      v-if="selectable"
      class="absolute inset-0 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      style="background: var(--bg-overlay)"
    >
      <button
        class="btn-accent text-xs px-4 py-2"
        @click.stop="$emit('add', card)"
      >
        + Add to Deck
      </button>
    </div>

    <!-- Count badge -->
    <div
      v-if="count && count > 0"
      class="text-center font-bold relative z-20"
      style="background: var(--accent); color: var(--bg-base)"
    >
      {{ count }}
    </div>
  </div>

  <!-- Tooltip (teleported to body) -->
  <Teleport to="body">
    <transition name="tooltip-fade">
      <div
        v-if="showTooltip"
        class="tooltip-popup"
        :style="{
          left: tooltipX + 'px',
          top: tooltipY + 'px',
        }"
      >
        <div class="tooltip-content" v-html="descHtml(card.description)" />
        <div class="tooltip-arrow" />
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.tooltip-popup {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  max-width: 280px;
  min-width: 200px;
  transform: translate(-50%, -100%);
}

.tooltip-content {
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tooltip-arrow {
  position: absolute;
  bottom: -5px;
  left: 50%;
  width: 10px;
  height: 10px;
  background: var(--bg-elevated);
  border-right: 1px solid var(--border-strong);
  border-bottom: 1px solid var(--border-strong);
  transform: translateX(-50%) rotate(45deg);
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}
</style>
