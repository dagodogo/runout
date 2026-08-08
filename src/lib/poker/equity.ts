import { freshDeck, removeCards, shuffled, type Card } from './cards';
import { compareHandScore, evaluateBest } from './evaluator';
import { ALL_HANDS, RANKS, type HandCell } from './hands';

/** Turns an abstract hand label (e.g. "AKs", "QQ", "T9o") into every concrete,
 * unused card-pair combo it represents — so Monte Carlo sampling can draw a real
 * villain hand from a range built out of labels. */
export function combosForHand(hand: HandCell, unused: Card[]): [Card, Card][] {
  const byRank = new Map<number, Card[]>();
  for (const c of unused) {
    if (!byRank.has(c.rank)) byRank.set(c.rank, []);
    byRank.get(c.rank)!.push(c);
  }
  const highRank = 14 - RANKS.indexOf(hand.high);
  const lowRank = 14 - RANKS.indexOf(hand.low);
  const highCards = byRank.get(highRank) ?? [];
  const lowCards = byRank.get(lowRank) ?? [];
  const combos: [Card, Card][] = [];

  if (hand.kind === 'pair') {
    for (let i = 0; i < highCards.length; i++) {
      for (let j = i + 1; j < highCards.length; j++) combos.push([highCards[i], highCards[j]]);
    }
    return combos;
  }
  for (const h of highCards) {
    for (const l of lowCards) {
      const suited = h.suit === l.suit;
      if (suited === (hand.kind === 'suited')) combos.push([h, l]);
    }
  }
  return combos;
}

/** Builds a weighted pool of concrete 2-card combos for every hand label in
 * `rangeLabels`, respecting cards already dealt elsewhere in the scenario. */
function buildRangePool(rangeLabels: Set<string>, unused: Card[]): [Card, Card][] {
  const pool: [Card, Card][] = [];
  for (const hand of ALL_HANDS) {
    if (!rangeLabels.has(hand.label)) continue;
    pool.push(...combosForHand(hand, unused));
  }
  return pool;
}

export interface EquityResult {
  win: number;
  tie: number;
  lose: number;
  equity: number; // win + tie/2, as a fraction 0-1
  iterations: number;
}

interface EquityOptions {
  heroCards: [Card, Card];
  board: Card[];
  /** Hand labels (e.g. "AKs") villain is assumed to hold — omit for a uniform random hand. */
  villainRangeLabels?: Set<string>;
  iterations?: number;
}

/** Monte Carlo equity of hero's hand vs. either a uniform random hand or a
 * weighted villain range, run out over the remaining board cards. */
export function estimateEquity({ heroCards, board, villainRangeLabels, iterations = 400 }: EquityOptions): EquityResult {
  const dead = [...heroCards, ...board];
  const baseUnused = removeCards(freshDeck(), dead);
  const rangePool = villainRangeLabels ? buildRangePool(villainRangeLabels, baseUnused) : null;

  let win = 0;
  let tie = 0;
  let lose = 0;
  let ran = 0;

  for (let i = 0; i < iterations; i++) {
    let villainHand: [Card, Card] | null = null;
    let remaining = baseUnused;

    if (rangePool && rangePool.length > 0) {
      const [a, b] = rangePool[Math.floor(Math.random() * rangePool.length)];
      // Skip combos that collide with cards already used by an earlier failed draw (rare) — just resample.
      villainHand = [a, b];
      remaining = baseUnused.filter((c) => c !== a && c !== b);
    } else {
      const shuffledUnused = shuffled(baseUnused);
      villainHand = [shuffledUnused[0], shuffledUnused[1]];
      remaining = shuffledUnused.slice(2);
    }

    const cardsNeeded = 5 - board.length;
    const runout = shuffled(remaining).slice(0, cardsNeeded);
    const fullBoard = [...board, ...runout];

    const heroScore = evaluateBest([...heroCards, ...fullBoard]);
    const villainScore = evaluateBest([...villainHand, ...fullBoard]);
    const cmp = compareHandScore(heroScore, villainScore);
    if (cmp > 0) win++;
    else if (cmp < 0) lose++;
    else tie++;
    ran++;
  }

  return { win, tie, lose, equity: (win + tie / 2) / ran, iterations: ran };
}
