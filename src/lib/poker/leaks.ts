import type { PostflopAttempt, PreflopAttempt } from '@/lib/store/profile';
import { LEAK_CATEGORY_LABEL, type LeakCategory } from './scenarios';
import { positionLabel, type Position } from './ranges';

export interface LeakEntry {
  key: string;
  label: string;
  attempts: number;
  correct: number;
  accuracy: number;
  tip: string;
}

const MIN_SAMPLE = 3;

function toEntries<T extends string>(
  attempts: { key: T; correct: boolean }[],
  labelFor: (key: T) => string,
  tipFor: (key: T) => string,
): LeakEntry[] {
  const buckets = new Map<T, { attempts: number; correct: number }>();
  for (const a of attempts) {
    const b = buckets.get(a.key) ?? { attempts: 0, correct: 0 };
    b.attempts += 1;
    if (a.correct) b.correct += 1;
    buckets.set(a.key, b);
  }
  return [...buckets.entries()]
    .map(([key, b]) => ({
      key,
      label: labelFor(key),
      attempts: b.attempts,
      correct: b.correct,
      accuracy: b.correct / b.attempts,
      tip: tipFor(key),
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

const POSTFLOP_LEAK_TIP: Record<LeakCategory, string> = {
  'c-bet': 'On dry boards your continuation range should be wide; on wet boards, bet the hands that want protection or have equity to improve.',
  'bluff-catch': "Compare the price you're getting to how often the bet needs to be a bluff — don't call based on hand strength alone.",
  'draw-equity': 'Raising a draw for fold equity is often stronger than calling — you win the pot immediately or improve to the best hand.',
  'value-sizing': "Size up against opponents who call too much, and size down when only strong hands continue against you.",
  'check-raise': 'Reserve check-raises for hands strong enough to get value or with enough equity to profitably represent strength.',
  blockers: 'Bluff with hands that block the combos your opponent needs to call — it makes folding more likely.',
  'river-bluff': 'A polarized river bet should be made with your worst showdown-value hands, not medium ones that can still win at showdown.',
};

function preflopPositionTip(position: Position): string {
  if (position === 'BB') return 'BB is closing the action with the best price in the hand — defend wider than it feels natural to.';
  if (position === 'SB') return "SB acts first postflop out of position, so tighten up compared to the button even though you're last to act preflop.";
  if (position === 'BTN') return "You're guaranteed position for the rest of the hand — this is where your widest opening range belongs.";
  if (position === 'CO') return 'Cutoff can open wide too, but expect the button to squeeze more than the blinds will.';
  return 'Early seats have the most players left to act behind them — keep the opening range tight and mostly linear.';
}

export function postflopLeaks(attempts: PostflopAttempt[]): LeakEntry[] {
  return toEntries(
    attempts.map((a) => ({ key: a.category as LeakCategory, correct: a.correct })),
    (key) => LEAK_CATEGORY_LABEL[key],
    (key) => POSTFLOP_LEAK_TIP[key],
  ).filter((e) => e.attempts >= MIN_SAMPLE);
}

export function preflopLeaks(attempts: PreflopAttempt[]): LeakEntry[] {
  return toEntries(
    attempts.map((a) => ({ key: a.position as Position, correct: a.correct })),
    (key) => positionLabel(key),
    (key) => preflopPositionTip(key),
  ).filter((e) => e.attempts >= MIN_SAMPLE);
}

/** A category only counts as a "leak" if accuracy is meaningfully below competent
 * play — otherwise a small, well-played sample (e.g. 3/3) would get flagged just
 * for being the lowest of a short list. */
const LEAK_THRESHOLD = 0.75;

export function topLeaks(preflop: PreflopAttempt[], postflop: PostflopAttempt[], count = 3): LeakEntry[] {
  return [...preflopLeaks(preflop), ...postflopLeaks(postflop)]
    .filter((e) => e.accuracy < LEAK_THRESHOLD)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, count);
}

export function overallAccuracy(preflop: PreflopAttempt[], postflop: PostflopAttempt[]): number {
  const total = preflop.length + postflop.length;
  if (total === 0) return 0;
  const correct = preflop.filter((a) => a.correct).length + postflop.filter((a) => a.correct).length;
  return correct / total;
}
