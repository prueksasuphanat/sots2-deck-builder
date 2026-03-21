import { createRouter, createWebHistory } from "vue-router";
import CardsView from "@/views/CardsView.vue";
import DeckBuilderView from "@/views/DeckBuilderView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/cards" },
    { path: "/cards", name: "cards", component: CardsView },
    { path: "/deck-builder", name: "deck-builder", component: DeckBuilderView },
    {
      path: "/deck-builder/:deckId",
      name: "deck-edit",
      component: DeckBuilderView,
    },
  ],
});

export default router;
