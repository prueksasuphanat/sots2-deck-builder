# ⚔️ SotS2 Deck Forge

A dark gothic deck builder companion for **Slay the Spire 2**.

## Stack

| Tool | Purpose |
|------|---------|
| **Vue 3** + Composition API | Core framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Pinia** | State management |
| **Vue Router 4** | Client-side routing |
| **VueUse** (`useLocalStorage`) | Persistent deck storage |
| **Tailwind CSS v3** | Utility-first styling |
| **Cinzel / Crimson Pro** | Gothic display fonts |

## Features

### 📜 Cards Page
- Browse all cards (40+ cards across 4 classes + colorless + curses)
- Filter by **class** (Berserker, Phantom, Conduit, Herald), **type**, **rarity**
- Sort by name, cost, type, or rarity (asc/desc toggle)
- Full-text search (name, description, tags)
- **Grid** and **List** view modes
- Click any card to open a detail panel with upgrade info & keywords

### 🗂 Deck Builder Page
- Create unlimited named decks (with optional description & class color)
- Click cards to add them; adjust counts with +/- controls
- Rename decks inline (click the deck name)
- Duplicate or delete decks
- **Cost curve** mini-bar visualization
- Deck stats: total cards, avg cost, type breakdown
- All decks **auto-saved** to `localStorage` via VueUse

## Setup

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── assets/         # Global CSS (Tailwind + custom)
├── composables/    # useCardUtils (color/type/rarity config)
├── components/
│   ├── CardItem.vue     # Card component (grid + compact list)
│   ├── FilterBar.vue    # Filter sidebar
│   ├── DeckPanel.vue    # Deck manager sidebar
│   └── NavBar.vue       # Top navigation
├── data/
│   └── cards.ts         # All card definitions
├── router/          # Vue Router config
├── stores/
│   ├── useCardsStore.ts  # Filter + sort state
│   └── useDecksStore.ts  # Deck CRUD + localStorage
├── types/           # TypeScript interfaces
└── views/
    ├── CardsView.vue       # /cards route
    └── DeckBuilderView.vue # /deck-builder route
```

## Extending

To add more cards, edit `src/data/cards.ts` following the `Card` interface in `src/types/index.ts`.

To add a new class color, extend the `CardColor` union type and add an entry in `useCardUtils.ts`.
