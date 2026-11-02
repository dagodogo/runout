// Grades a hero action against the solver (design.md, Grading). Chips; bb = chips / 10.
import { CHIPS_PER_BB } from './spots.ts';

export type Grade = 'best' | 'fine' | 'mistake' | 'blunder';

export interface GradeResult {
  grade: Grade;
  /** best || fine */
  correct: boolean;
  chosen: number;
  bestAction: number;
  freqChosen: number;
  lossChips: number;
  evLossBb: number;
  /** loss as a fraction of the pot (eqrBase of the hero) */
  lossPot: number;
}

/**
 * freq[a], ev[a]: the hero hand's strategy and action EVs (chips) at the node. `pot` = eqrBase[hero].
 * Loss is measured against the best EV, so it is never negative.
 */
export function gradeAction(freq: ArrayLike<number>, ev: ArrayLike<number>, chosen: number, pot: number): GradeResult {
  let bestAction = 0;
  for (let a = 1; a < ev.length; a++) if (ev[a] > ev[bestAction]) bestAction = a;
  const lossChips = Math.max(0, ev[bestAction] - ev[chosen]);
  const lossPot = lossChips / pot;
  const f = freq[chosen];
  const grade: Grade =
    f >= 0.2 || lossPot <= 0.015 ? 'best' : f >= 0.05 || lossPot <= 0.05 ? 'fine' : lossPot <= 0.15 ? 'mistake' : 'blunder';
  return { grade, correct: grade === 'best' || grade === 'fine', chosen, bestAction, freqChosen: f, lossChips, evLossBb: lossChips / CHIPS_PER_BB, lossPot };
}
