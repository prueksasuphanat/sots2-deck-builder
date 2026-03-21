import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useLocalStorage } from "@vueuse/core";
import type { Deck, CardColor } from "@/types";

export const useDecksStore = defineStore("decks", () => {
  const decks = useLocalStorage<Deck[]>("sots2-decks-v2", []);
  const activeDeckId = ref<string | null>(null);

  const activeDeck = computed(() =>
    activeDeckId.value
      ? (decks.value.find((d) => d.id === activeDeckId.value) ?? null)
      : null,
  );

  const totalCards = (deck: Deck) =>
    deck.cards.reduce((s, c) => s + c.count, 0);

  function createDeck(
    name: string,
    description?: string,
    color?: CardColor,
  ): Deck {
    const deck: Deck = {
      id: crypto.randomUUID(),
      name,
      description,
      color,
      cards: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    decks.value = [...decks.value, deck];
    activeDeckId.value = deck.id;
    return deck;
  }

  function updateDeckMeta(
    deckId: string,
    patch: Partial<Pick<Deck, "name" | "description" | "color">>,
  ) {
    decks.value = decks.value.map((d) =>
      d.id === deckId ? { ...d, ...patch, updatedAt: Date.now() } : d,
    );
  }

  function deleteDeck(deckId: string) {
    decks.value = decks.value.filter((d) => d.id !== deckId);
    if (activeDeckId.value === deckId)
      activeDeckId.value = decks.value[0]?.id ?? null;
  }

  function addCardToDeck(deckId: string, cardId: string) {
    decks.value = decks.value.map((deck) => {
      if (deck.id !== deckId) return deck;
      const existing = deck.cards.find((dc) => dc.cardId === cardId);
      if (existing) {
        return {
          ...deck,
          updatedAt: Date.now(),
          cards: deck.cards.map((dc) =>
            dc.cardId === cardId ? { ...dc, count: dc.count + 1 } : dc,
          ),
        };
      }
      return {
        ...deck,
        updatedAt: Date.now(),
        cards: [...deck.cards, { cardId, count: 1 }],
      };
    });
  }

  function removeCardFromDeck(deckId: string, cardId: string) {
    decks.value = decks.value.map((deck) => {
      if (deck.id !== deckId) return deck;
      const existing = deck.cards.find((dc) => dc.cardId === cardId);
      if (!existing) return deck;
      const newCards =
        existing.count <= 1
          ? deck.cards.filter((dc) => dc.cardId !== cardId)
          : deck.cards.map((dc) =>
              dc.cardId === cardId ? { ...dc, count: dc.count - 1 } : dc,
            );
      return { ...deck, updatedAt: Date.now(), cards: newCards };
    });
  }

  function removeCardCompletely(deckId: string, cardId: string) {
    decks.value = decks.value.map((deck) =>
      deck.id !== deckId
        ? deck
        : {
            ...deck,
            updatedAt: Date.now(),
            cards: deck.cards.filter((dc) => dc.cardId !== cardId),
          },
    );
  }

  function duplicateDeck(deckId: string) {
    const src = decks.value.find((d) => d.id === deckId);
    if (!src) return;
    const copy: Deck = {
      ...src,
      id: crypto.randomUUID(),
      name: `${src.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      cards: src.cards.map((dc) => ({ ...dc })),
    };
    decks.value = [...decks.value, copy];
    activeDeckId.value = copy.id;
  }

  function setActiveDeck(id: string | null) {
    activeDeckId.value = id;
  }
  function getCardCount(deckId: string, cardId: string): number {
    return (
      decks.value
        .find((d) => d.id === deckId)
        ?.cards.find((dc) => dc.cardId === cardId)?.count ?? 0
    );
  }

  return {
    decks,
    activeDeckId,
    activeDeck,
    totalCards,
    createDeck,
    updateDeckMeta,
    deleteDeck,
    addCardToDeck,
    removeCardFromDeck,
    removeCardCompletely,
    duplicateDeck,
    setActiveDeck,
    getCardCount,
  };
});
