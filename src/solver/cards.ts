import type { Card, Suit } from '../lib/poker/cards.ts';

// Solver card id = 4*rank + suit, rank 0=2..12=A, suit c,d,h,s = 0..3.
const RANKS = '23456789TJQKA';
const SOLVER_SUITS = 'cdhs';

export function cardToId(card: Card): number {
  return 4 * (card.rank - 2) + SOLVER_SUITS.indexOf(card.suit);
}

export function idToCard(id: number): Card {
  return { rank: (id >> 2) + 2, suit: SOLVER_SUITS[id & 3] as Suit };
}

/** "Ks" -> id. */
export function strToId(s: string): number {
  return 4 * RANKS.indexOf(s[0]) + SOLVER_SUITS.indexOf(s[1]);
}

export function idToStr(id: number): string {
  return RANKS[id >> 2] + SOLVER_SUITS[id & 3];
}

/** Index of the combo (c1 < c2) in the 1326-length range array. */
export function pairIndex(c1: number, c2: number): number {
  const [a, b] = c1 < c2 ? [c1, c2] : [c2, c1];
  return (a * (101 - a)) / 2 + b - 1;
}
