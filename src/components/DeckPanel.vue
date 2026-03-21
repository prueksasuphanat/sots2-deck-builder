<script setup lang="ts">
import { ref, computed } from "vue";
import { useDecksStore } from "@/stores/useDecksStore";
import { useCardsStore } from "@/stores/useCardsStore";
import { useCardUtils } from "@/composables/useCardUtils";
import { getCardImageUrl } from "@/services/api";
import CardItem from "./CardItem.vue";
import type { ApiCard, CardColor } from "@/types";

const decksStore = useDecksStore();
const cardsStore = useCardsStore();
const { colorConfig, colorOrder } = useCardUtils();

// ── Form ──
const showForm = ref(false);
const newName = ref("");
const newDesc = ref("");
const newColor = ref<CardColor | "">("");

// ── Rename ──
const editingName = ref(false);
const editVal = ref("");

// ── Drag reorder ──
const dragOverIdx = ref<number | null>(null);
const dragSrcIdx = ref<number | null>(null);

// ── Drop zone highlight ──
const isDragOver = ref(false);

const activeDeck = computed(() => decksStore.activeDeck);

// Resolve full ApiCard objects from deck card IDs
const deckCards = computed(() => {
  if (!activeDeck.value) return [];
  return activeDeck.value.cards
    .map((dc) => {
      const card = cardsStore.cards.find((c) => c.id === dc.cardId);
      return card ? { card, count: dc.count } : null;
    })
    .filter((x): x is { card: ApiCard; count: number } => x !== null);
});

// Sorted: cost asc → name
const sortedDeckCards = computed(() =>
  [...deckCards.value].sort((a, b) => {
    const ca = a.card.is_x_cost ? 99 : (a.card.cost ?? 0);
    const cb = b.card.is_x_cost ? 99 : (b.card.cost ?? 0);
    return ca - cb || a.card.name.localeCompare(b.card.name);
  }),
);

const totalCards = computed(() =>
  activeDeck.value ? decksStore.totalCards(activeDeck.value) : 0,
);

const avgCost = computed(() => {
  let total = 0,
    cnt = 0;
  for (const { card, count } of deckCards.value) {
    if (!card.is_x_cost && card.cost !== null) {
      total += card.cost * count;
      cnt += count;
    }
  }
  return cnt ? (total / cnt).toFixed(1) : "—";
});

const statsByType = computed(() => {
  const m: Record<string, number> = {};
  for (const { card, count } of deckCards.value)
    m[card.type] = (m[card.type] ?? 0) + count;
  return m;
});

// Cost curve 0–5+
const costCurve = computed(() =>
  [0, 1, 2, 3, 4, 5].map((n) => ({
    label: n === 5 ? "5+" : String(n),
    count: deckCards.value
      .filter(
        ({ card }) =>
          !card.is_x_cost &&
          card.cost !== null &&
          (n === 5 ? card.cost! >= 5 : card.cost === n),
      )
      .reduce((s, { count }) => s + count, 0),
  })),
);

const maxBin = computed(() =>
  Math.max(1, ...costCurve.value.map((b) => b.count)),
);

// ── Actions ──
function createDeck() {
  if (!newName.value.trim()) return;
  decksStore.createDeck(
    newName.value.trim(),
    newDesc.value.trim() || undefined,
    (newColor.value as CardColor) || undefined,
  );
  newName.value = "";
  newDesc.value = "";
  newColor.value = "";
  showForm.value = false;
}
function startRename() {
  if (!activeDeck.value) return;
  editVal.value = activeDeck.value.name;
  editingName.value = true;
}
function saveRename() {
  if (activeDeck.value && editVal.value.trim())
    decksStore.updateDeckMeta(activeDeck.value.id, {
      name: editVal.value.trim(),
    });
  editingName.value = false;
}
function adjust(card: ApiCard, delta: number) {
  if (!activeDeck.value) return;
  if (delta > 0) decksStore.addCardToDeck(activeDeck.value.id, card.id);
  else decksStore.removeCardFromDeck(activeDeck.value.id, card.id);
}
function confirmDelete() {
  if (activeDeck.value && confirm(`Delete deck "${activeDeck.value.name}"?`))
    decksStore.deleteDeck(activeDeck.value.id);
}

// ── Drop from card pool ──
function onDropPool(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = false;
  const cardId = e.dataTransfer?.getData("cardId");
  const source = e.dataTransfer?.getData("source");
  if (cardId && activeDeck.value && source === "pool") {
    decksStore.addCardToDeck(activeDeck.value.id, cardId);
  }
}

function onDragOverPool(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = true;
}

function onDragLeavePool() {
  isDragOver.value = false;
}

// ── Reorder within deck ──
function onItemDragStart(e: DragEvent, idx: number) {
  dragSrcIdx.value = idx;
  e.dataTransfer!.effectAllowed = "move";
  e.dataTransfer!.setData("deckReorder", String(idx));

  // Create fully visible drag image for deck cards
  const target = e.target as HTMLElement;
  const cardEl = target.closest(".deck-card-item") as HTMLElement;

  if (cardEl) {
    const clone = cardEl.cloneNode(true) as HTMLElement;

    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.width = cardEl.offsetWidth + "px";
    clone.style.height = cardEl.offsetHeight + "px";
    clone.style.opacity = "1"; // Full opacity
    clone.style.transform = "scale(1.08)";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "9999";
    clone.style.filter = "drop-shadow(0 10px 25px rgba(0,0,0,0.5))";
    clone.style.transition = "none";
    clone.style.backgroundColor = "var(--bg-surface)";

    // Force all child elements to be fully opaque
    const allElements = clone.querySelectorAll("*");
    allElements.forEach((el) => {
      (el as HTMLElement).style.opacity = "1";
    });

    document.body.appendChild(clone);

    const rect = cardEl.getBoundingClientRect();
    const offsetX = rect.width / 2;
    const offsetY = rect.height / 2;

    e.dataTransfer!.setDragImage(clone, offsetX, offsetY);

    setTimeout(() => {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }, 0);
  }
}
function onItemDragOver(e: DragEvent, idx: number) {
  e.preventDefault();
  dragOverIdx.value = idx;
}
function onItemDrop(e: DragEvent, tgtIdx: number) {
  e.preventDefault();
  const srcIdx = dragSrcIdx.value;
  if (srcIdx === null || srcIdx === tgtIdx || !activeDeck.value) {
    dragOverIdx.value = null;
    return;
  }
  const cards = [...activeDeck.value.cards];
  const sId = sortedDeckCards.value[srcIdx].card.id;
  const tId = sortedDeckCards.value[tgtIdx].card.id;
  const si = cards.findIndex((c) => c.cardId === sId);
  const ti = cards.findIndex((c) => c.cardId === tId);
  if (si !== -1 && ti !== -1) {
    [cards[si], cards[ti]] = [cards[ti], cards[si]];
    decksStore.decks = decksStore.decks.map((d) =>
      d.id === activeDeck.value!.id
        ? { ...d, cards, updatedAt: Date.now() }
        : d,
    );
  }
  dragOverIdx.value = null;
  dragSrcIdx.value = null;
}
function onItemDragEnd() {
  dragOverIdx.value = null;
  dragSrcIdx.value = null;
}
</script>

<template>
  <aside class="flex flex-col gap-3 h-full">
    <!-- Deck selector -->
    <div
      class="rounded-lg p-3"
      style="background: var(--bg-surface); border: 1px solid var(--border)"
    >
      <div class="flex items-center justify-between mb-2">
        <p
          class="text-xs font-semibold uppercase tracking-wider"
          style="color: var(--text-muted)"
        >
          Your Decks
        </p>
        <button
          class="btn-accent text-xs !px-2.5 !py-1"
          @click="showForm = !showForm"
        >
          {{ showForm ? "✕" : "+ New" }}
        </button>
      </div>

      <!-- New deck form -->
      <transition name="expand">
        <div v-if="showForm" class="space-y-2 mb-3">
          <input
            v-model="newName"
            type="text"
            placeholder="Deck name…"
            maxlength="40"
            class="input text-sm"
            @keydown.enter="createDeck"
          />
          <input
            v-model="newDesc"
            type="text"
            placeholder="Description (optional)…"
            class="input text-xs"
          />
          <div class="flex items-center gap-2">
            <div class="flex gap-1.5">
              <button
                v-for="color in colorOrder.slice(0, 5)"
                :key="color"
                class="w-5 h-5 rounded-full border-2 transition-all"
                :class="colorConfig[color].dot"
                :style="
                  newColor === color
                    ? 'border-color: white; transform: scale(1.25);'
                    : 'border-color: transparent; opacity: 0.65;'
                "
                :title="colorConfig[color].label"
                @click="newColor = newColor === color ? '' : color"
              />
            </div>
            <span class="text-xs" style="color: var(--text-muted)"
              >class color</span
            >
          </div>
          <div class="flex gap-2">
            <button class="btn-accent text-xs flex-1" @click="createDeck">
              Create
            </button>
            <button class="btn text-xs" @click="showForm = false">
              Cancel
            </button>
          </div>
        </div>
      </transition>

      <!-- Deck list -->
      <div
        v-if="decksStore.decks.length"
        class="space-y-1 max-h-48 overflow-y-auto"
      >
        <button
          v-for="deck in decksStore.decks"
          :key="deck.id"
          class="w-full text-left px-2.5 py-2 rounded text-sm flex items-center gap-2 transition-all"
          :style="
            deck.id === decksStore.activeDeckId
              ? 'background: var(--accent-dim); color: var(--accent); border: 1px solid var(--accent);'
              : 'color: var(--text-secondary); border: 1px solid var(--border);'
          "
          @click="decksStore.setActiveDeck(deck.id)"
        >
          <span
            v-if="deck.color"
            class="w-2 h-2 rounded-full flex-shrink-0"
            :class="colorConfig[deck.color]?.dot"
          />
          <span class="truncate flex-1 font-medium text-xs">{{
            deck.name
          }}</span>
          <span
            class="text-xs flex-shrink-0"
            style="color: var(--text-muted)"
            >{{ decksStore.totalCards(deck) }}</span
          >
        </button>
      </div>
      <p
        v-else
        class="text-xs text-center py-3"
        style="color: var(--text-muted)"
      >
        No decks yet.
      </p>
    </div>

    <!-- Active deck detail -->
    <div
      v-if="activeDeck"
      class="rounded-lg flex flex-col flex-1 overflow-hidden transition-all duration-200"
      :class="{ 'ring-2 ring-offset-2': isDragOver }"
      :style="
        [
          'background: var(--bg-surface); border: 1px solid var(--border); min-height: 300px;',
          isDragOver
            ? 'ring-color: var(--accent); border-color: var(--accent); transform: scale(1.01);'
            : '',
        ].join(' ')
      "
      @dragover="onDragOverPool"
      @dragleave="onDragLeavePool"
      @drop="onDropPool"
    >
      <!-- Header -->
      <div class="p-3" style="border-bottom: 1px solid var(--border)">
        <!-- Name row -->
        <div class="flex items-center gap-2 mb-1.5">
          <div class="flex-1 min-w-0">
            <div v-if="editingName" class="flex gap-1">
              <input
                v-model="editVal"
                autofocus
                class="input text-sm flex-1 min-w-0 !py-0.5"
                @keydown.enter="saveRename"
                @keydown.esc="editingName = false"
              />
              <button
                class="btn-accent text-xs !px-2 !py-0.5"
                @click="saveRename"
              >
                ✓
              </button>
            </div>
            <button
              v-else
              class="text-sm font-semibold truncate max-w-full text-left hover:opacity-75 transition-opacity block"
              style="color: var(--text-primary)"
              title="Click to rename"
              @click="startRename"
            >
              {{ activeDeck.name }}
              <span class="text-xs ml-1" style="color: var(--text-muted)"
                >✏️</span
              >
            </button>
          </div>
          <div class="flex gap-1 flex-shrink-0">
            <button
              class="btn text-xs !px-2 !py-1"
              title="Duplicate"
              @click="decksStore.duplicateDeck(activeDeck.id)"
            >
              ⧉
            </button>
            <button
              class="btn-danger text-xs !px-2 !py-1"
              @click="confirmDelete"
            >
              🗑
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div
          class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs"
          style="color: var(--text-muted)"
        >
          <span
            ><span style="color: var(--text-primary)">{{ totalCards }}</span>
            cards</span
          >
          <span
            >avg cost
            <span style="color: var(--text-primary)">{{ avgCost }}</span></span
          >
          <span v-if="statsByType.Attack">⚔️ {{ statsByType.Attack }}</span>
          <span v-if="statsByType.Skill">✦ {{ statsByType.Skill }}</span>
          <span v-if="statsByType.Power">⚡ {{ statsByType.Power }}</span>
        </div>
      </div>

      <!-- Drop zone (empty) -->
      <div
        v-if="!sortedDeckCards.length"
        class="flex-1 flex flex-col items-center justify-center p-6 text-center m-3 rounded-lg transition-all duration-200"
        :class="{ 'scale-105': isDragOver }"
        :style="
          isDragOver
            ? 'border: 2px dashed var(--accent); background: var(--accent-dim);'
            : 'border: 2px dashed var(--border-strong);'
        "
      >
        <p class="text-2xl mb-2" :class="{ 'animate-bounce': isDragOver }">
          🃏
        </p>
        <p
          class="text-sm font-medium"
          :style="
            isDragOver
              ? 'color: var(--accent);'
              : 'color: var(--text-secondary);'
          "
        >
          {{ isDragOver ? "Drop card here!" : "Drag cards here" }}
        </p>
        <p
          class="text-xs mt-1"
          style="color: var(--text-muted)"
          v-if="!isDragOver"
        >
          or click cards on the left
        </p>
      </div>

      <!-- Card list -->
      <div v-else class="flex-1 overflow-y-auto p-2 space-y-1">
        <div
          v-for="({ card, count }, idx) in sortedDeckCards"
          :key="card.id"
          draggable="true"
          class="deck-card-item transition-all duration-150 cursor-move"
          :class="{
            'opacity-40 scale-95': dragSrcIdx === idx,
            'ring-1 ring-accent': dragOverIdx === idx && dragSrcIdx !== idx,
          }"
          @dragstart="(e) => onItemDragStart(e, idx)"
          @dragover="(e) => onItemDragOver(e, idx)"
          @drop="(e) => onItemDrop(e, idx)"
          @dragend="onItemDragEnd"
        >
          <div
            v-if="dragOverIdx === idx && dragSrcIdx !== idx"
            class="h-1 rounded mb-1 animate-pulse"
            style="background: var(--accent)"
          />
          <CardItem
            :card="card"
            :count="count"
            compact
            in-deck
            @add="adjust(card, 1)"
            @remove="adjust(card, -1)"
            @click="() => {}"
          />
        </div>
      </div>

      <!-- Cost curve -->
      <div
        v-if="deckCards.length"
        class="p-3"
        style="border-top: 1px solid var(--border)"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wider mb-2"
          style="color: var(--text-muted)"
        >
          Cost Curve
        </p>
        <div class="flex items-end gap-1 h-10">
          <div
            v-for="bin in costCurve"
            :key="bin.label"
            class="flex flex-col items-center gap-0.5 flex-1"
          >
            <div
              class="w-full rounded-sm transition-all duration-300"
              :style="`height: ${bin.count ? Math.max(3, (bin.count / maxBin) * 32) : 2}px; background: ${bin.count ? 'var(--accent)' : 'var(--border-strong)'};`"
            />
            <span class="text-xs" style="color: var(--text-muted)">{{
              bin.label
            }}</span>
          </div>
          <div class="flex flex-col items-center gap-0.5 flex-1">
            <div
              class="w-full rounded-sm"
              style="height: 2px; background: var(--border-strong)"
            />
            <span class="text-xs" style="color: var(--text-muted)">X</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="flex-1 rounded-lg flex flex-col items-center justify-center p-6 text-center"
      style="background: var(--bg-surface); border: 1px solid var(--border)"
    >
      <p class="text-3xl mb-3">🗂</p>
      <p class="font-medium text-sm mb-1" style="color: var(--text-secondary)">
        No deck selected
      </p>
      <p class="text-xs" style="color: var(--text-muted)">
        Create or select a deck above.
      </p>
    </div>
  </aside>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 320px;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce {
  animation: bounce 0.6s ease-in-out infinite;
}
</style>

.deck-card-item { cursor: grab; } .deck-card-item:active { cursor: grabbing; }
