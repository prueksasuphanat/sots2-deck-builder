import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem('sots2-theme') as 'dark' | 'light' | null
  const theme = ref<'dark' | 'light'>(saved ?? 'dark')

  function applyTheme(t: 'dark' | 'light') {
    document.documentElement.className = t
    localStorage.setItem('sots2-theme', t)
  }

  watch(theme, applyTheme, { immediate: true })

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, toggle }
})
