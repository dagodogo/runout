import type { Card } from './cards';

export interface HandScore {
  category: number; // 0 = high card ... 8 = straight flush
  tiebreak: number[];
}

export const CATEGORY_NAME = [
  'High card',
  'Pair',
  'Two pair',
  'Three of a kind',
  'Straight',
  'Flush',
  'Full house',
  'Four of a kind',
  'Straight flush',
];

function straightHighFrom(ranksDesc: number[]): number | null {
  const uniq = [...new Set(ranksDesc)].sort((a, b) => b - a);
  for (let i = 0; i <= uniq.length - 5; i++) {
    if (uniq[i] - uniq[i + 4] === 4) return uniq[i];
  }
  const set = new Set(uniq);
  if (set.has(14) && [5, 4, 3, 2].every((r) => set.has(r))) return 5; // wheel: A-2-3-4-5
  return null;
}

/** Standard 5-card hand evaluation. */
export function evaluate5(cards: Card[]): HandScore {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const isFlush = cards.every((c) => c.suit === cards[0].suit);
  const straightHigh = straightHighFrom(ranks);

  if (isFlush && straightHigh) return { category: 8, tiebreak: [straightHigh] };

  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  if (groups[0][1] === 4) {
    const kicker = groups.find((g) => g[1] === 1)![0];
    return { category: 7, tiebreak: [groups[0][0], kicker] };
  }
  if (groups[0][1] === 3 && groups[1]?.[1] === 2) {
    return { category: 6, tiebreak: [groups[0][0], groups[1][0]] };
  }
  if (isFlush) return { category: 5, tiebreak: ranks };
  if (straightHigh) return { category: 4, tiebreak: [straightHigh] };
  if (groups[0][1] === 3) {
    const kickers = groups.filter((g) => g[1] === 1).map((g) => g[0]).sort((a, b) => b - a);
    return { category: 3, tiebreak: [groups[0][0], ...kickers] };
  }
  if (groups[0][1] === 2 && groups[1]?.[1] === 2) {
    const pairRanks = [groups[0][0], groups[1][0]].sort((a, b) => b - a);
    const kicker = groups.find((g) => g[1] === 1)![0];
    return { category: 2, tiebreak: [...pairRanks, kicker] };
  }
  if (groups[0][1] === 2) {
    const kickers = groups.filter((g) => g[1] === 1).map((g) => g[0]).sort((a, b) => b - a);
    return { category: 1, tiebreak: [groups[0][0], ...kickers] };
  }
  return { category: 0, tiebreak: ranks };
}

function combinations5(indices: number[]): number[][] {
  const result: number[][] = [];
  const n = indices.length;
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++)
            result.push([indices[a], indices[b], indices[c], indices[d], indices[e]]);
  return result;
}

export function compareHandScore(a: HandScore, b: HandScore): number {
  if (a.category !== b.category) return a.category - b.category;
  for (let i = 0; i < Math.max(a.tiebreak.length, b.tiebreak.length); i++) {
    const diff = (a.tiebreak[i] ?? 0) - (b.tiebreak[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Best 5-card hand out of any 5-7 cards. */
export function evaluateBest(cards: Card[]): HandScore {
  if (cards.length === 5) return evaluate5(cards);
  const idx = cards.map((_, i) => i);
  let best: HandScore | null = null;
  for (const combo of combinations5(idx)) {
    const score = evaluate5(combo.map((i) => cards[i]));
    if (!best || compareHandScore(score, best) > 0) best = score;
  }
  return best!;
}
