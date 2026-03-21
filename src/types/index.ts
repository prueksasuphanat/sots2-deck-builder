// ── API color names (match spire-codex API exactly) ──
export type CardColor =
  | "ironclad"
  | "silent"
  | "defect"
  | "necrobinder"
  | "regent"
  | "colorless";
export type CardType = "Attack" | "Skill" | "Power" | "Status" | "Curse";
export type CardRarity = "Basic" | "Common" | "Uncommon" | "Rare" | "Ancient";
export type CardKeyword =
  | "Exhaust"
  | "Innate"
  | "Ethereal"
  | "Retain"
  | "Unplayable"
  | "Sly"
  | "Eternal";

// ── Local card data structure (for static cards) ──
export interface Card {
  id: string;
  name: string;
  color: string;
  type: string;
  rarity: string;
  cost: number | string;
  description: string;
  upgradedDescription?: string;
  flavorText?: string;
  tags: string[];
}

// ── Raw API response shape ──
export interface ApiCard {
  id: string;
  name: string;
  description: string;
  description_raw: string;
  cost: number | null;
  is_x_cost: boolean | null;
  is_x_star_cost: boolean | null;
  star_cost: number | null;
  type: string;
  rarity: string;
  target: string | null;
  color: string;
  damage: number | null;
  block: number | null;
  hit_count: number | null;
  powers_applied: { power: string; amount: number }[] | null;
  cards_draw: number | null;
  energy_gain: number | null;
  hp_loss: number | null;
  keywords: string[] | null;
  tags: string[] | null;
  spawns_cards: string[] | null;
  vars: Record<string, number | string> | null;
  upgrade: Record<string, string> | null;
  image_url: string | null;
  beta_image_url: string | null;
  compendium_order: number | null;
}

// ── Filter / query params ──
export interface ApiFilters {
  color: CardColor | "";
  type: CardType | "";
  rarity: CardRarity | "";
  keyword: CardKeyword | "";
  tag: string;
  search: string;
}

// ── Deck storage (uses API card id) ──
export interface DeckCard {
  cardId: string;
  count: number;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  color?: CardColor;
  cards: DeckCard[];
  createdAt: number;
  updatedAt: number;
}

export type SortOption = "name" | "cost" | "type" | "rarity" | "compendium";
export type SortDir = "asc" | "desc";
export type ViewMode = "grid" | "list";
