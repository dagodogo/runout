import type { Card } from './cards';
import { evaluate5, compareHandScore, type HandScore } from './evaluator';

function pairs2(cards: Card[]): Card[][] {
  const result: Card[][] = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) result.push([cards[i], cards[j]]);
  }
  return result;
}

function triples3(cards: Card[]): Card[][] {
  const result: Card[][] = [];
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) result.push([cards[i], cards[j], cards[k]]);
    }
  }
  return result;
}

/** PLO hands must use exactly 2 hole cards and exactly 3 board cards — unlike
 * hold'em, a player can't just play the board or use only one hole card. */
export function evaluatePLOBest(hole: Card[], board: Card[]): HandScore {
  let best: HandScore | null = null;
  for (const holePair of pairs2(hole)) {
    for (const boardTriple of triples3(board)) {
      const score = evaluate5([...holePair, ...boardTriple]);
      if (!best || compareHandScore(score, best) > 0) best = score;
    }
  }
  return best!;
}
