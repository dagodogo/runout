import type { Card, Suit } from './cards';

/** Heuristic PLO starting-hand strength on a 0-100 scale. PLO has no simple
 * closed-form formula like hold'em's Chen score — the interactions between
 * the four cards (which pairs synergize, which suits double up, whether all
 * four ranks stay connected) matter more than any single card's value, since
 * only 2 of the 4 hole cards can be used in the final hand. */
export function ploHandScore(cards: Card[]): number {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);

  let score = 0;

  // Raw rank value: high cards are worth more, but PLO cares less about this
  // than hold'em since a big card alone can't win without support.
  for (const r of ranks) score += (r - 7) * 1.1;

  // Pairs: a pair you can flop a set with is real equity; two pairs (double
  // pair, e.g. AAKK) is a premium PLO shape because either pair can turn
  // into trips and the other kicker stays live.
  const rankCounts = new Map<number, number>();
  for (const r of ranks) rankCounts.set(r, (rankCounts.get(r) ?? 0) + 1);
  const pairRanks = [...rankCounts.entries()].filter(([, c]) => c === 2).map(([r]) => r);
  const quadRank = [...rankCounts.entries()].find(([, c]) => c === 4);
  for (const pr of pairRanks) score += pr >= 10 ? 9 : pr >= 7 ? 5 : 2;
  if (pairRanks.length === 2) score += 6; // double pair synergy
  if (quadRank) score -= 20; // four of a kind — only two ranks in play, terrible in PLO

  // Suitedness: count suit pairs among the four cards. Double-suited hands
  // (two different flush draws live) are the strongest shape in PLO;
  // single-suited beats rainbow; ace-high suits count extra for nut potential.
  const suitCounts = new Map<Suit, number>();
  for (const s of suits) suitCounts.set(s, (suitCounts.get(s) ?? 0) + 1);
  const suitedPairCount = [...suitCounts.values()].filter((c) => c >= 2).length;
  score += suitedPairCount >= 2 ? 14 : suitedPairCount === 1 ? 6 : 0;
  for (const [suit, count] of suitCounts) {
    if (count >= 2 && cards.some((c) => c.suit === suit && c.rank === 14)) score += 5;
  }

  // Connectivity: PLO hands want all four ranks bunched together so every
  // card contributes to straight potential — a "rundown" like 9-8-7-6 is
  // premium. A card isolated far from the rest (a "dangler") contributes
  // almost nothing since it's rarely the best 2-card combo.
  const uniqueRanks = [...new Set(ranks)];
  const spread = uniqueRanks[0] - uniqueRanks[uniqueRanks.length - 1];
  if (uniqueRanks.length >= 3) {
    if (spread <= 3) score += 12;
    else if (spread <= 5) score += 6;
  }
  if (uniqueRanks.length === 4) {
    const gaps = [uniqueRanks[0] - uniqueRanks[1], uniqueRanks[1] - uniqueRanks[2], uniqueRanks[2] - uniqueRanks[3]];
    const danglerGap = Math.max(...gaps);
    if (danglerGap >= 6) score -= 8; // one card is disconnected from the other three
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function ploHandDescription(cards: Card[]): string {
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const suitCounts = new Map<Suit, number>();
  for (const s of suits) suitCounts.set(s, (suitCounts.get(s) ?? 0) + 1);
  const doubleSuited = [...suitCounts.values()].filter((c) => c >= 2).length >= 2;
  const singleSuited = !doubleSuited && [...suitCounts.values()].some((c) => c >= 2);

  const rankCounts = new Map<number, number>();
  for (const r of ranks) rankCounts.set(r, (rankCounts.get(r) ?? 0) + 1);
  const pairRanks = [...rankCounts.entries()].filter(([, c]) => c === 2).map(([r]) => r);

  const uniqueRanks = [...new Set(ranks)];
  const spread = uniqueRanks[0] - uniqueRanks[uniqueRanks.length - 1];
  const connected = uniqueRanks.length >= 3 && spread <= 4;

  const parts: string[] = [];
  if (pairRanks.length === 2) parts.push('double-paired');
  else if (pairRanks.length === 1) parts.push('single-paired');
  if (doubleSuited) parts.push('double-suited');
  else if (singleSuited) parts.push('single-suited');
  else parts.push('rainbow');
  if (connected) parts.push('connected');

  return parts.join(', ');
}
