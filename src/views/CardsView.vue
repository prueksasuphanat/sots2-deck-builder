<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useCardsStore } from "@/stores/useCardsStore";
import FilterBar from "@/components/FilterBar.vue";
import CardItem from "@/components/CardItem.vue";
import CardSkeleton from "@/components/CardSkeleton.vue";
import type { ApiCard } from "@/types";

const store = useCardsStore();
const selected = ref<ApiCard | null>(null);
const showFiltersMobile = ref(false);

const currentPage = ref(1);
const itemsPerPage = 20;

const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return store.sortedCards.slice(start, end);
});
const totalPages = computed(() => Math.ceil(store.sortedCards.length / itemsPerPage));
const pageRange = computed(() => {
  const range: (number | string)[] = [];
  const delta = 2;
  if (totalPages.value <= 7) {
    for (let i = 1; i <= totalPages.value; i++) range.push(i);
  } else {
    range.push(1);
    if (currentPage.value > delta + 2) range.push("...");
    const start = Math.max(2, currentPage.value - delta);
    const end = Math.min(totalPages.value - 1, currentPage.value + delta);
    for (let i = start; i <= end; i++) range.push(i);
    if (currentPage.value < totalPages.value - delta - 1) range.push("...");
    range.push(totalPages.value);
  }
  return range;
});
const paginationInfo = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage.value * itemsPerPage, store.sortedCards.length);
  return { start, end, total: store.sortedCards.length };
});
function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
watch(() => store.sortedCards.length, () => {
  if (currentPage.value > totalPages.value) currentPage.value = 1;
});

function openDetail(card: ApiCard) {
  selected.value = selected.value?.id === card.id ? null : card;
}
function descHtml(raw: string): string {
  return raw
    .replace(/\[gold\](.*?)\[\/gold\]/g, '<span class="highlight">$1</span>')
    .replace(/\[.*?\]/g, "")
    .replace(/\n/g, "<br>");
}
const upgradeItems = computed(() => {
  if (!selected.value?.upgrade) return [];
  return Object.entries(selected.value.upgrade).map(([k, v]) => ({ stat: k, change: v }));
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="font-display text-xl font-semibold" style="color: var(--text-primary)">Card Library</h1>
        <p class="text-sm mt-0.5" style="color: var(--text-muted)">
          <template v-if="store.loading"><span class="animate-pulse-soft">Loading…</span></template>
          <template v-else-if="store.error"><span class="text-red-400">{{ store.error }}</span></template>
          <template v-else><span style="color: var(--accent)">{{ store.sortedCards.length }}</span> cards</template>
        </p>
      </div>
      <div class="flex gap-2">
        <button class="btn sm:hidden text-sm" @click="showFiltersMobile = !showFiltersMobile">
          🔧 {{ showFiltersMobile ? "Hide" : "Filters" }}
        </button>
        <button v-if="store.error" class="btn-accent text-sm" @click="store.load()">Retry</button>
      </div>
    </div>

    <div class="flex gap-4 lg:gap-6">
      <aside class="flex-shrink-0"
             :class="showFiltersMobile ? 'block w-full sm:w-72' : 'hidden sm:block sm:w-64 lg:w-72'">
        <div class="sticky top-20"><FilterBar /></div>
      </aside>

      <div class="flex-1 min-w-0">
        <div v-if="store.loading" class="flex flex-wrap gap-3">
          <CardSkeleton v-for="n in 12" :key="n" />
        </div>
        <div v-else-if="store.error" class="flex flex-col items-center py-20 text-center">
          <p class="text-4xl mb-4">⚠️</p>
          <p class="font-medium mb-1" style="color: var(--text-primary)">Failed to load cards</p>
          <p class="text-sm mb-4" style="color: var(--text-muted)">{{ store.error }}</p>
          <button class="btn-accent" @click="store.load()">Try Again</button>
        </div>
        <div v-else-if="!store.sortedCards.length" class="flex flex-col items-center py-20 text-center">
          <p class="text-4xl mb-4">🔮</p>
          <p class="font-medium mb-1" style="color: var(--text-secondary)">No cards found</p>
          <button class="btn mt-3" @click="store.resetFilters()">Reset Filters</button>
        </div>
        <div v-else-if="store.viewMode === 'grid'" class="flex flex-wrap gap-3">
          <CardItem v-for="card in paginatedCards" :key="card.id" :card="card"
                    :selected="selected?.id === card.id" @click="openDetail" />
        </div>
        <div v-else class="space-y-1.5">
          <CardItem v-for="card in paginatedCards" :key="card.id" :card="card" compact
                    :selected="selected?.id === card.id" @click="openDetail" />
        </div>

        <div v-if="totalPages > 1" class="mt-8 space-y-3">
          <div class="text-center text-sm" style="color: var(--text-muted)">
            Showing {{ paginationInfo.start }}-{{ paginationInfo.end }} of {{ paginationInfo.total }} cards
          </div>
          <div class="flex items-center justify-center gap-2 flex-wrap">
            <button class="btn !px-3 !py-1.5 text-sm" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">← Prev</button>
            <div class="flex gap-1">
              <template v-for="(page, idx) in pageRange" :key="idx">
                <span v-if="page === '...'" class="px-2 py-1.5 text-sm" style="color: var(--text-muted)">...</span>
                <button v-else class="btn !px-3 !py-1.5 text-sm min-w-[2.5rem]"
                        :class="{ 'btn-accent': page === currentPage }"
                        @click="goToPage(page as number)">{{ page }}</button>
              </template>
            </div>
            <button class="btn !px-3 !py-1.5 text-sm" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Next →</button>
          </div>
        </div>
      </div>

      <transition name="detail">
        <aside v-if="selected" class="hidden lg:block flex-shrink-0 w-64 xl:w-72">
          <div class="sticky top-20 rounded-lg p-4 space-y-4"
               style="background: var(--bg-surface); border: 1px solid var(--border);">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--text-muted)">Card Detail</p>
              <button class="btn !px-1.5 !py-0.5 text-xs" @click="selected = null">✕</button>
            </div>
            <div class="flex justify-center"><CardItem :card="selected" /></div>
            <div class="rounded p-3 text-xs space-y-1.5" style="background:var(--bg-elevated);border:1px solid var(--border);">
              <div class="flex justify-between" v-if="selected.damage">
                <span style="color:var(--text-muted)">Damage</span>
                <span class="font-mono text-red-400">{{ selected.damage }}<span v-if="selected.hit_count && selected.hit_count > 1"> × {{ selected.hit_count }}</span></span>
              </div>
              <div class="flex justify-between" v-if="selected.block">
                <span style="color:var(--text-muted)">Block</span>
                <span class="font-mono text-sky-400">{{ selected.block }}</span>
              </div>
              <div class="flex justify-between" v-if="selected.cards_draw">
                <span style="color:var(--text-muted)">Draw</span>
                <span class="font-mono text-emerald-400">{{ selected.cards_draw }}</span>
              </div>
              <div class="flex justify-between" v-if="selected.energy_gain">
                <span style="color:var(--text-muted)">Energy</span>
                <span class="font-mono text-amber-400">+{{ selected.energy_gain }}</span>
              </div>
              <div class="flex justify-between" v-if="selected.hp_loss">
                <span style="color:var(--text-muted)">HP Loss</span>
                <span class="font-mono text-red-500">-{{ selected.hp_loss }}</span>
              </div>
            </div>
            <div v-if="selected.powers_applied?.length">
              <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:var(--text-muted)">Powers Applied</p>
              <div class="space-y-1">
                <div v-for="p in selected.powers_applied" :key="p.power" class="flex justify-between text-sm">
                  <span style="color:var(--text-secondary)">{{ p.power }}</span>
                  <span class="font-mono" style="color:var(--accent)">{{ p.amount }}</span>
                </div>
              </div>
            </div>
            <div v-if="upgradeItems.length">
              <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:var(--text-muted)">On Upgrade</p>
              <div class="space-y-1">
                <div v-for="item in upgradeItems" :key="item.stat" class="flex justify-between text-sm">
                  <span class="capitalize" style="color:var(--text-secondary)">{{ item.stat }}</span>
                  <span class="font-mono text-emerald-400">{{ item.change }}</span>
                </div>
              </div>
            </div>
            <div v-if="selected.tags?.length">
              <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:var(--text-muted)">Tags</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="tag in selected.tags" :key="tag" class="badge text-xs capitalize">{{ tag }}</span>
              </div>
            </div>
            <div v-if="selected.keywords?.length">
              <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:var(--text-muted)">Keywords</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="kw in selected.keywords" :key="kw" class="text-xs px-2 py-0.5 rounded-full font-medium"
                      style="background:var(--accent-dim);color:var(--accent);border:1px solid var(--accent);">{{ kw }}</span>
              </div>
            </div>
          </div>
        </aside>
      </transition>
    </div>

    <transition name="slide-up-sheet">
      <div v-if="selected"
           class="lg:hidden fixed inset-x-0 bottom-0 z-40 rounded-t-2xl p-4 max-h-[70vh] overflow-y-auto"
           style="background:var(--bg-surface);border-top:1px solid var(--border-strong);">
        <div class="flex items-start justify-between mb-3 gap-3">
          <div class="flex-1 min-w-0">
            <p class="font-semibold" style="color:var(--text-primary)">{{ selected.name }}</p>
            <p class="text-xs mt-0.5" style="color:var(--text-muted)">{{ selected.color }} · {{ selected.type }} · {{ selected.rarity }}</p>
          </div>
          <button class="btn !px-2 !py-1 text-xs flex-shrink-0" @click="selected = null">✕</button>
        </div>
        <p class="card-desc text-sm leading-relaxed" style="color:var(--text-secondary)" v-html="descHtml(selected.description)" />
        <div v-if="upgradeItems.length" class="mt-3 pt-3 space-y-1" style="border-top:1px solid var(--border)">
          <p class="text-xs font-semibold uppercase tracking-wider mb-2" style="color:var(--text-muted)">On Upgrade</p>
          <div v-for="item in upgradeItems" :key="item.stat" class="flex justify-between text-sm">
            <span class="capitalize" style="color:var(--text-secondary)">{{ item.stat }}</span>
            <span class="font-mono text-emerald-400">{{ item.change }}</span>
          </div>
        </div>
      </div>
    </transition>
    <div v-if="selected" class="lg:hidden fixed inset-0 z-30" style="background:rgba(0,0,0,0.4)" @click="selected = null" />
  </div>
</template>

<style scoped>
.detail-enter-active, .detail-leave-active { transition: all 0.2s ease; }
.detail-enter-from, .detail-leave-to       { opacity: 0; transform: translateX(14px); }
.slide-up-sheet-enter-active, .slide-up-sheet-leave-active { transition: transform 0.25s ease; }
.slide-up-sheet-enter-from, .slide-up-sheet-leave-to       { transform: translateY(100%); }
</style>
