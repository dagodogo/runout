export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const;
export type Rank = (typeof RANKS)[number];

const RANK_VALUE: Record<Rank, number> = Object.fromEntries(
  RANKS.map((r, i) => [r, 14 - i]),
) as Record<Rank, number>;

const HIGH_CARD_SCORE: Partial<Record<Rank, number>> = { A: 10, K: 8, Q: 7, J: 6, T: 5 };

export type HandKind = 'pair' | 'suited' | 'offsuit';

export interface HandCell {
  label: string;
  row: number;
  col: number;
  kind: HandKind;
  combos: number;
  high: Rank;
  low: Rank;
}

function highCardScore(r: Rank): number {
  return HIGH_CARD_SCORE[r] ?? RANK_VALUE[r] / 2;
}

/** Approximate hand-strength score using the Chen Formula (a well-known heuristic
 * for ranking starting hands). Used to build plausible, solver-flavored practice
 * ranges — not a real GTO solver output. */
export function chenScore(high: Rank, low: Rank, suited: boolean): number {
  if (high === low) {
    return Math.max(highCardScore(high) * 2, 5);
  }
  let score = highCardScore(high);
  if (suited) score += 2;
  const gap = RANK_VALUE[high] - RANK_VALUE[low] - 1;
  if (gap === 1) score -= 1;
  else if (gap === 2) score -= 2;
  else if (gap === 3) score -= 4;
  else if (gap >= 4) score -= 5;
  if (gap === 0 && RANK_VALUE[high] < RANK_VALUE['Q']) score += 1;
  return score;
}

/** 13x13 starting-hand grid: row/col 0 = A .. 12 = 2. Upper triangle is suited,
 * lower triangle is offsuit, diagonal is pocket pairs (standard chart convention). */
export function buildGrid(): HandCell[][] {
  const grid: HandCell[][] = [];
  for (let row = 0; row < 13; row++) {
    const line: HandCell[] = [];
    for (let col = 0; col < 13; col++) {
      const r1 = RANKS[row];
      const r2 = RANKS[col];
      if (row === col) {
        line.push({ label: `${r1}${r2}`, row, col, kind: 'pair', combos: 6, high: r1, low: r2 });
      } else if (row < col) {
        line.push({ label: `${r1}${r2}s`, row, col, kind: 'suited', combos: 4, high: r1, low: r2 });
      } else {
        line.push({ label: `${r2}${r1}o`, row, col, kind: 'offsuit', combos: 12, high: r2, low: r1 });
      }
    }
    grid.push(line);
  }
  return grid;
}

export const HAND_GRID = buildGrid();
export const ALL_HANDS = HAND_GRID.flat();

export function scoreOf(hand: HandCell): number {
  return chenScore(hand.high, hand.low, hand.kind === 'suited');
}

/** Weighted by real-world combo frequency (offsuit hands are 3x more common than
 * suited, 2x more common than pairs) so quiz reps mirror actual hand distribution. */
export function weightedRandomHand(exclude?: string): HandCell {
  const pool = exclude ? ALL_HANDS.filter((h) => h.label !== exclude) : ALL_HANDS;
  const totalWeight = pool.reduce((sum, h) => sum + h.combos, 0);
  let roll = Math.random() * totalWeight;
  for (const hand of pool) {
    roll -= hand.combos;
    if (roll <= 0) return hand;
  }
  return pool[pool.length - 1];
}
