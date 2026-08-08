import type { PostflopAttempt, PreflopAttempt } from '@/lib/store/profile';

export interface TrendPoint {
  label: string;
  accuracy: number;
  reps: number;
}

interface Timestamped {
  timestamp: number;
  correct: boolean;
}

/** Buckets attempts into rolling windows of `bucketSize` (chronological order)
 * so the trend line reflects improvement over practice reps, not wall-clock time
 * (which would be mostly empty for a single practice session). */
export function accuracyTrend(
  preflop: PreflopAttempt[],
  postflop: PostflopAttempt[],
  bucketSize = 10,
): TrendPoint[] {
  const all: Timestamped[] = [...preflop, ...postflop].sort((a, b) => a.timestamp - b.timestamp);
  const points: TrendPoint[] = [];
  for (let i = 0; i < all.length; i += bucketSize) {
    const bucket = all.slice(i, i + bucketSize);
    const correct = bucket.filter((a) => a.correct).length;
    points.push({
      label: `${i + 1}-${i + bucket.length}`,
      accuracy: Math.round((correct / bucket.length) * 100),
      reps: bucket.length,
    });
  }
  return points;
}

export function positionAccuracy(preflop: PreflopAttempt[]) {
  const buckets = new Map<string, { correct: number; total: number }>();
  for (const a of preflop) {
    const b = buckets.get(a.position) ?? { correct: 0, total: 0 };
    b.total += 1;
    if (a.correct) b.correct += 1;
    buckets.set(a.position, b);
  }
  return [...buckets.entries()].map(([position, b]) => ({
    position,
    accuracy: Math.round((b.correct / b.total) * 100),
    reps: b.total,
  }));
}
