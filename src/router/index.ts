import { createRouter, createWebHistory } from "vue-router";
import CardsView       from "@/views/CardsView.vue";
import DeckBuilderView from "@/views/DeckBuilderView.vue";
import DeckGalleryView from "@/views/DeckGalleryView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/",               redirect: "/cards" },
    { path: "/cards",          name: "cards",        component: CardsView       },
    { path: "/deck-builder",   name: "deck-builder", component: DeckBuilderView },
    { path: "/deck-gallery",   name: "deck-gallery", component: DeckGalleryView },
    { path: "/:pathMatch(.*)*", redirect: "/cards"  },
  ],
});

export default router;
