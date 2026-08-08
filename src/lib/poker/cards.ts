export type Suit = 's' | 'h' | 'd' | 'c';
export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];

export const SUIT_SYMBOL: Record<Suit, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };

/** Numeric rank, 2-14 (Ace high). */
export interface Card {
  rank: number;
  suit: Suit;
}

const RANK_CHAR: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: 'T',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

export function cardKey(card: Card): string {
  return `${RANK_CHAR[card.rank]}${card.suit}`;
}

export function cardDisplay(card: Card): string {
  return `${RANK_CHAR[card.rank]}${SUIT_SYMBOL[card.suit]}`;
}

export function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (let rank = 2; rank <= 14; rank++) {
    for (const suit of SUITS) deck.push({ rank, suit });
  }
  return deck;
}

/** Fisher-Yates shuffle, returns a new array. */
export function shuffled<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function removeCards(deck: Card[], used: Card[]): Card[] {
  const usedKeys = new Set(used.map(cardKey));
  return deck.filter((c) => !usedKeys.has(cardKey(c)));
}
