import type { PostflopAttempt, PreflopAttempt } from '@/lib/store/profile';
import { LEAK_CATEGORY_LABEL, type LeakCategory } from './scenarios';
import { positionLabel, type Position } from './ranges';

export interface LeakEntry {
  key: string;
  label: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

const MIN_SAMPLE = 3;

function toEntries<T extends string>(
  attempts: { key: T; correct: boolean }[],
  labelFor: (key: T) => string,
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
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function postflopLeaks(attempts: PostflopAttempt[]): LeakEntry[] {
  return toEntries(
    attempts.map((a) => ({ key: a.category as LeakCategory, correct: a.correct })),
    (key) => LEAK_CATEGORY_LABEL[key],
  ).filter((e) => e.attempts >= MIN_SAMPLE);
}

export function preflopLeaks(attempts: PreflopAttempt[]): LeakEntry[] {
  return toEntries(
    attempts.map((a) => ({ key: a.position as Position, correct: a.correct })),
    (key) => positionLabel(key),
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
