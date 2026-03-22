<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/useThemeStore'
import NavBar from '@/components/NavBar.vue'

useThemeStore()

let emberInterval: ReturnType<typeof setInterval>
onMounted(() => {
  emberInterval = setInterval(() => {
    if (document.documentElement.classList.contains('light')) return
    const el = document.createElement('div')
    el.className = 'ember'
    el.style.cssText = `
      left: ${Math.random() * 100}vw;
      bottom: 0;
      width: ${1 + Math.random() * 2}px;
      height: ${1 + Math.random() * 2}px;
      animation: ember ${6 + Math.random() * 6}s linear;
      animation-delay: ${Math.random() * 1}s;
      animation-fill-mode: forwards;
      --dx: ${(Math.random() - 0.5) * 60}px;
      pointer-events: none;
      position: fixed;
      z-index: 0;
    `
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 14000)
  }, 1200)
})
onUnmounted(() => clearInterval(emberInterval))
</script>

<template>
  <div class="min-h-screen" style="background: var(--bg-base);">
    <div class="dark:block hidden fixed inset-0 pointer-events-none z-0">
      <div class="absolute inset-0" style="background: radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.04) 0%, transparent 60%);" />
      <div class="absolute inset-0" style="background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%);" />
    </div>

    <NavBar />

    <main class="relative z-10 pt-16">
      <div class="max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <router-view v-slot="{ Component, route }">
          <transition name="page" mode="out-in">
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style>
.page-enter-active, .page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.page-enter-from { opacity: 0; transform: translateY(6px); }
.page-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>
