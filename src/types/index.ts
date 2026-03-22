export type CardColor = "ironclad" | "silent" | "defect" | "necrobinder" | "regent" | "colorless";
export type CardType = "Attack" | "Skill" | "Power" | "Status" | "Curse";
export type CardRarity = "Basic" | "Common" | "Uncommon" | "Rare" | "Ancient";
export type CardKeyword = "Exhaust" | "Innate" | "Ethereal" | "Retain" | "Unplayable" | "Sly" | "Eternal";

export interface ApiCard {
  id: string; name: string; description: string; description_raw: string;
  cost: number | null; is_x_cost: boolean | null; is_x_star_cost: boolean | null; star_cost: number | null;
  type: string; rarity: string; target: string | null; color: string;
  damage: number | null; block: number | null; hit_count: number | null;
  powers_applied: { power: string; amount: number }[] | null;
  cards_draw: number | null; energy_gain: number | null; hp_loss: number | null;
  keywords: string[] | null; tags: string[] | null; spawns_cards: string[] | null;
  vars: Record<string, number | string> | null; upgrade: Record<string, string> | null;
  image_url: string | null; beta_image_url: string | null; compendium_order: number | null;
}
export interface ApiFilters {
  color: CardColor | ""; type: CardType | ""; rarity: CardRarity | "";
  keyword: CardKeyword | ""; tag: string; search: string;
}
export interface DeckCard { cardId: string; count: number; }
export interface Deck {
  id: string; name: string; description?: string; color?: CardColor;
  cards: DeckCard[]; createdAt: number; updatedAt: number;
}
export type SortOption = "name" | "cost" | "type" | "rarity" | "compendium";
export type SortDir = "asc" | "desc";
export type ViewMode = "grid" | "list";

// Gallery types
export interface GalleryCard {
  cardId: string; cardName: string; cardColor: string; cardType: string;
  cardRarity: string; cardCost: number | null; cardIsXCost: boolean | null; count: number;
}
export interface GalleryDeck {
  id: string; name: string; description?: string; color?: CardColor;
  cards: GalleryCard[]; authorNickname: string; publishedAt: number;
  totalCards: number; avgCost: string;
  typeStats: { Attack: number; Skill: number; Power: number; other: number };
  costCurve: number[];
}
