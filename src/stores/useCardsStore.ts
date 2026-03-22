import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { fetchCards } from '@/services/api'
import type { ApiCard, ApiFilters, SortOption, SortDir, ViewMode, CardRarity } from '@/types'

const defaultFilters = (): ApiFilters => ({
  color:   '',
  type:    '',
  rarity:  '',
  keyword: '',
  tag:     '',
  search:  '',
})

export const useCardsStore = defineStore('cards', () => {
  const cards   = ref<ApiCard[]>([])
  const loading = ref(false)
  const error   = ref<string | null>(null)
  const filters = ref<ApiFilters>(defaultFilters())
  const sort    = ref<SortOption>('compendium')
  const sortDir = ref<SortDir>('asc')
  const viewMode = ref<ViewMode>('grid')
  const initialized = ref(false)

  const sortedCards = computed<ApiCard[]>(() => {
    const list = [...cards.value]
    const dir = sortDir.value === 'asc' ? 1 : -1
    list.sort((a, b) => {
      switch (sort.value) {
        case 'name':
          return dir * a.name.localeCompare(b.name)
        case 'cost': {
          const ca = a.is_x_cost ? 99 : (a.cost ?? 0)
          const cb = b.is_x_cost ? 99 : (b.cost ?? 0)
          return dir * (ca - cb)
        }
        case 'type':
          return dir * (a.type ?? '').localeCompare(b.type ?? '')
        case 'rarity': {
          const order: CardRarity[] = ['Basic', 'Common', 'Uncommon', 'Rare', 'Ancient']
          const ai = order.indexOf(a.rarity as CardRarity)
          const bi = order.indexOf(b.rarity as CardRarity)
          return dir * (ai - bi)
        }
        case 'compendium':
        default:
          return dir * ((a.compendium_order ?? 9999) - (b.compendium_order ?? 9999))
      }
    })
    return list
  })

  async function load() {
    loading.value = true
    error.value   = null
    try {
      cards.value = await fetchCards(filters.value)
      initialized.value = true
    } catch (e: any) {
      error.value = e?.message ?? 'Failed to load cards'
      cards.value = []
    } finally {
      loading.value = false
    }
  }

  const debouncedLoad = useDebounceFn(load, 350)
  watch(filters, () => debouncedLoad(), { deep: true })

  function setSearch(v: string)  { filters.value.search  = v }
  function setColor(v: string)   { filters.value.color   = v as any }
  function setType(v: string)    { filters.value.type    = v as any }
  function setRarity(v: string)  { filters.value.rarity  = v as any }
  function setKeyword(v: string) { filters.value.keyword = v as any }
  function setTag(v: string)     { filters.value.tag     = v }

  function toggleColor(v: string)   { filters.value.color   = filters.value.color   === v ? '' : v as any }
  function toggleType(v: string)    { filters.value.type    = filters.value.type    === v ? '' : v as any }
  function toggleRarity(v: string)  { filters.value.rarity  = filters.value.rarity  === v ? '' : v as any }
  function toggleKeyword(v: string) { filters.value.keyword = filters.value.keyword === v ? '' : v as any }

  function resetFilters() { filters.value = defaultFilters() }

  function setSort(s: SortOption) {
    if (sort.value === s) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    else { sort.value = s; sortDir.value = 'asc' }
  }
  function setViewMode(m: ViewMode) { viewMode.value = m }

  load()

  return {
    cards, sortedCards, loading, error, filters, sort, sortDir, viewMode, initialized,
    load, setSearch, setColor, setType, setRarity, setKeyword, setTag,
    toggleColor, toggleType, toggleRarity, toggleKeyword, resetFilters, setSort, setViewMode,
  }
})
