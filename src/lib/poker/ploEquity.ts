import { freshDeck, removeCards, shuffled, type Card } from './cards';
import { compareHandScore } from './evaluator';
import { evaluatePLOBest } from './ploEvaluator';

export interface PloEquityResult {
  win: number;
  tie: number;
  lose: number;
  equity: number;
  iterations: number;
}

interface PloEquityOptions {
  heroCards: Card[];
  board: Card[];
  iterations?: number;
}

/** Monte Carlo equity vs. a uniform-random PLO hand — PLO ranges are too
 * combinatorially large to model as labeled classes the way hold'em does, so
 * villain is sampled as a random 4-card holding from the remaining deck. */
export function estimatePloEquity({ heroCards, board, iterations = 300 }: PloEquityOptions): PloEquityResult {
  const dead = [...heroCards, ...board];
  const baseUnused = removeCards(freshDeck(), dead);

  let win = 0;
  let tie = 0;
  let lose = 0;
  let ran = 0;

  for (let i = 0; i < iterations; i++) {
    const shuffledUnused = shuffled(baseUnused);
    const villainHand = shuffledUnused.slice(0, 4);
    const remaining = shuffledUnused.slice(4);

    const cardsNeeded = 5 - board.length;
    const runout = shuffled(remaining).slice(0, cardsNeeded);
    const fullBoard = [...board, ...runout];

    const heroScore = evaluatePLOBest(heroCards, fullBoard);
    const villainScore = evaluatePLOBest(villainHand, fullBoard);
    const cmp = compareHandScore(heroScore, villainScore);
    if (cmp > 0) win++;
    else if (cmp < 0) lose++;
    else tie++;
    ran++;
  }

  return { win, tie, lose, equity: (win + tie / 2) / ran, iterations: ran };
}
