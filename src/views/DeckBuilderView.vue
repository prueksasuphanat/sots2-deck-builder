<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useCardsStore } from "@/stores/useCardsStore";
import { useDecksStore } from "@/stores/useDecksStore";
import FilterBar from "@/components/FilterBar.vue";
import CardItem from "@/components/CardItem.vue";
import CardSkeleton from "@/components/CardSkeleton.vue";
import DeckPanel from "@/components/DeckPanel.vue";
import type { ApiCard } from "@/types";

const cardsStore = useCardsStore();
const decksStore = useDecksStore();

const showFilters = ref(false);
const showDeckMobile = ref(false);
const isDragging = ref(false);
const draggedCard = ref<ApiCard | null>(null);

// Pagination
const currentPage = ref(1);
const itemsPerPage = 20;

const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return cardsStore.sortedCards.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(cardsStore.sortedCards.length / itemsPerPage);
});

const pageRange = computed(() => {
  const range: (number | string)[] = [];
  const delta = 2;

  if (totalPages.value <= 7) {
    for (let i = 1; i <= totalPages.value; i++) {
      range.push(i);
    }
  } else {
    range.push(1);

    if (currentPage.value > delta + 2) {
      range.push("...");
    }

    const start = Math.max(2, currentPage.value - delta);
    const end = Math.min(totalPages.value - 1, currentPage.value + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (currentPage.value < totalPages.value - delta - 1) {
      range.push("...");
    }

    range.push(totalPages.value);
  }

  return range;
});

const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage + 1;
  const end = Math.min(
    currentPage.value * itemsPerPage,
    cardsStore.sortedCards.length,
  );
  return { start, end, total: cardsStore.sortedCards.length };
});

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Reset to page 1 when filters change
watch(
  () => cardsStore.sortedCards.length,
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = 1;
    }
  },
);

function addCard(card: ApiCard) {
  if (!decksStore.activeDeckId) return;
  decksStore.addCardToDeck(decksStore.activeDeckId, card.id);
}

function getCount(card: ApiCard): number {
  if (!decksStore.activeDeckId) return 0;
  return decksStore.getCardCount(decksStore.activeDeckId, card.id);
}

function onCardDragStart(e: DragEvent, card: ApiCard) {
  if (!e.dataTransfer) return;

  isDragging.value = true;
  draggedCard.value = card;

  e.dataTransfer.effectAllowed = "copy";
  e.dataTransfer.setData("cardId", card.id);
  e.dataTransfer.setData("source", "pool");

  // Create a fully visible drag ghost
  const target = e.target as HTMLElement;
  const cardEl = target.closest(".drag-card-wrapper") as HTMLElement;

  if (cardEl) {
    // Clone the entire card element
    const clone = cardEl.cloneNode(true) as HTMLElement;

    // Style the clone to be fully visible
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    clone.style.width = cardEl.offsetWidth + "px";
    clone.style.height = cardEl.offsetHeight + "px";
    clone.style.opacity = "1"; // Full opacity
    clone.style.transform = "rotate(-5deg) scale(1.15)";
    clone.style.pointerEvents = "none";
    clone.style.zIndex = "9999";
    clone.style.filter = "drop-shadow(0 15px 35px rgba(0,0,0,0.6))"; // Use filter instead of box-shadow
    clone.style.transition = "none";
    clone.style.backgroundColor = "var(--bg-surface)"; // Ensure background is visible

    // Force all child elements to be fully opaque
    const allElements = clone.querySelectorAll("*");
    allElements.forEach((el) => {
      (el as HTMLElement).style.opacity = "1";
    });

    document.body.appendChild(clone);

    // Set the drag image centered on cursor
    const rect = cardEl.getBoundingClientRect();
    const offsetX = rect.width / 2;
    const offsetY = rect.height / 2;

    e.dataTransfer.setDragImage(clone, offsetX, offsetY);

    // Clean up after drag starts
    setTimeout(() => {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }, 0);
  }
}

function onCardDragEnd() {
  isDragging.value = false;
  draggedCard.value = null;
}
</script>

<template>
  <div class="space-y-3">
    <!-- Header -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="flex-1 min-w-0">
        <h1
          class="font-display text-xl font-semibold"
          style="color: var(--text-primary)"
        >
          Deck Builder
        </h1>
        <p class="text-sm" style="color: var(--text-muted)">
          <template v-if="cardsStore.loading">
            <span class="animate-pulse-soft">Loading cards…</span>
          </template>
          <template v-else>
            <span style="color: var(--accent)">{{
              cardsStore.sortedCards.length
            }}</span>
            cards available
            <span
              v-if="!decksStore.activeDeckId"
              class="ml-2 text-red-400 text-xs"
              >← create or select a deck first</span
            >
          </template>
        </p>
      </div>
      <div class="flex gap-2">
        <button class="btn text-sm" @click="showFilters = !showFilters">
          🔧 {{ showFilters ? "Hide" : "Filters" }}
        </button>
        <button
          class="btn-accent text-sm lg:hidden relative"
          @click="showDeckMobile = !showDeckMobile"
        >
          🗂 Deck
          <span
            v-if="decksStore.activeDeck"
            class="ml-1.5 text-xs rounded-full px-1.5 py-0.5 font-bold"
            style="background: var(--accent); color: var(--bg-base)"
          >
            {{ decksStore.totalCards(decksStore.activeDeck) }}
          </span>
        </button>
      </div>
    </div>

    <!-- Inline search -->
    <div class="relative">
      <span
        class="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
        style="color: var(--text-muted)"
        >🔍</span
      >
      <input
        :value="cardsStore.filters.search"
        type="text"
        placeholder="Search cards…"
        class="input pl-9 text-sm"
        @input="cardsStore.setSearch(($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Expandable filter panel -->
    <transition name="expand">
      <div v-if="showFilters"><FilterBar /></div>
    </transition>

    <!-- Layout -->
    <div class="flex gap-4 lg:gap-6">
      <!-- Card pool -->
      <div class="flex-1 min-w-0">
        <!-- Loading -->
        <div v-if="cardsStore.loading" class="flex flex-wrap gap-3">
          <CardSkeleton v-for="n in 12" :key="n" />
        </div>

        <!-- Error -->
        <div
          v-else-if="cardsStore.error"
          class="flex flex-col items-center py-16 text-center"
        >
          <p class="text-4xl mb-3">⚠️</p>
          <p class="font-medium mb-1" style="color: var(--text-primary)">
            Failed to load cards
          </p>
          <p class="text-sm mb-4" style="color: var(--text-muted)">
            {{ cardsStore.error }}
          </p>
          <button class="btn-accent" @click="cardsStore.load()">
            Try Again
          </button>
        </div>

        <!-- Empty -->
        <div
          v-else-if="!cardsStore.sortedCards.length"
          class="flex flex-col items-center py-16 text-center"
        >
          <p class="text-4xl mb-3">🔮</p>
          <p class="font-medium mb-1" style="color: var(--text-secondary)">
            No cards match
          </p>
          <button class="btn mt-3" @click="cardsStore.resetFilters()">
            Reset Filters
          </button>
        </div>

        <!-- Grid -->
        <div
          v-else-if="cardsStore.viewMode === 'grid'"
          class="flex flex-wrap gap-3"
        >
          <div
            v-for="card in paginatedCards"
            :key="card.id"
            class="drag-card-wrapper transition-all duration-150"
            :class="{
              'opacity-50 scale-95': isDragging && draggedCard?.id === card.id,
            }"
            :draggable="!!decksStore.activeDeckId"
            @dragstart="(e) => onCardDragStart(e, card)"
            @dragend="onCardDragEnd"
          >
            <CardItem
              :card="card"
              :count="getCount(card)"
              :selectable="!!decksStore.activeDeckId"
              @add="addCard"
              @click="addCard"
            />
          </div>
        </div>

        <!-- List -->
        <div v-else class="space-y-1.5">
          <div
            v-for="card in paginatedCards"
            :key="card.id"
            class="drag-card-wrapper transition-all duration-150"
            :class="{
              'opacity-50 scale-95': isDragging && draggedCard?.id === card.id,
            }"
            :draggable="!!decksStore.activeDeckId"
            @dragstart="(e) => onCardDragStart(e, card)"
            @dragend="onCardDragEnd"
          >
            <CardItem
              :card="card"
              :count="getCount(card)"
              compact
              @add="addCard"
              @click="addCard"
            />
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-8 space-y-3">
          <div class="text-center text-sm" style="color: var(--text-muted)">
            Showing {{ paginationInfo.start }}-{{ paginationInfo.end }} of
            {{ paginationInfo.total }} cards
          </div>
          <div class="flex items-center justify-center gap-2 flex-wrap">
            <button
              class="btn !px-3 !py-1.5 text-sm"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              ← Prev
            </button>
            <div class="flex gap-1">
              <template v-for="(page, idx) in pageRange" :key="idx">
                <span
                  v-if="page === '...'"
                  class="px-2 py-1.5 text-sm"
                  style="color: var(--text-muted)"
                >
                  ...
                </span>
                <button
                  v-else
                  class="btn !px-3 !py-1.5 text-sm min-w-[2.5rem]"
                  :class="{ 'btn-accent': page === currentPage }"
                  @click="goToPage(page as number)"
                >
                  {{ page }}
                </button>
              </template>
            </div>
            <button
              class="btn !px-3 !py-1.5 text-sm"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <!-- Desktop deck panel -->
      <aside
        class="hidden lg:flex flex-col flex-shrink-0 w-72 xl:w-80"
        style="min-height: calc(100vh - 120px)"
      >
        <DeckPanel />
      </aside>
    </div>

    <!-- Mobile deck sheet -->
    <transition name="slide-up-sheet">
      <div
        v-if="showDeckMobile"
        class="lg:hidden fixed inset-x-0 bottom-0 z-40 rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto flex flex-col"
        style="
          background: var(--bg-surface);
          border-top: 1px solid var(--border-strong);
        "
      >
        <div class="flex items-center justify-between mb-3">
          <p class="font-semibold" style="color: var(--text-primary)">
            Your Deck
          </p>
          <button
            class="btn !px-2 !py-1 text-xs"
            @click="showDeckMobile = false"
          >
            ✕ Close
          </button>
        </div>
        <div class="flex-1 overflow-y-auto"><DeckPanel /></div>
      </div>
    </transition>
    <div
      v-if="showDeckMobile"
      class="lg:hidden fixed inset-0 z-30"
      style="background: rgba(0, 0, 0, 0.5)"
      @click="showDeckMobile = false"
    />
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.22s ease;
  overflow: hidden;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.slide-up-sheet-enter-active,
.slide-up-sheet-leave-active {
  transition: transform 0.25s ease;
}
.slide-up-sheet-enter-from,
.slide-up-sheet-leave-to {
  transform: translateY(100%);
}

.drag-card-wrapper {
  cursor: grab;
}

.drag-card-wrapper:active {
  cursor: grabbing;
}
</style>
