import { useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { StatTile } from '@/components/ui/StatTile';
import { TierProgress } from '@/components/dashboard/TierProgress';
import { LeakFinderCard } from '@/components/dashboard/LeakFinderCard';
import { AccuracyTrendChart } from '@/components/dashboard/AccuracyTrendChart';
import { PositionAccuracyChart } from '@/components/dashboard/PositionAccuracyChart';
import { HistoryList } from '@/components/dashboard/HistoryList';
import { useProfileStore } from '@/lib/store/profile';
import { topLeaks, overallAccuracy } from '@/lib/poker/leaks';
import { accuracyTrend, positionAccuracy, bestStreak, recentHistory } from '@/lib/poker/stats';

export function DashboardPage() {
  const xp = useProfileStore((s) => s.xp);
  const preflopAttempts = useProfileStore((s) => s.preflopAttempts);
  const postflopAttempts = useProfileStore((s) => s.postflopAttempts);
  const resetProgress = useProfileStore((s) => s.resetProgress);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const totalReps = preflopAttempts.length + postflopAttempts.length;
  const accuracy = useMemo(() => overallAccuracy(preflopAttempts, postflopAttempts), [preflopAttempts, postflopAttempts]);
  const leaks = useMemo(() => topLeaks(preflopAttempts, postflopAttempts), [preflopAttempts, postflopAttempts]);
  const trend = useMemo(() => accuracyTrend(preflopAttempts, postflopAttempts), [preflopAttempts, postflopAttempts]);
  const posAccuracy = useMemo(() => positionAccuracy(preflopAttempts), [preflopAttempts]);
  const streak = useMemo(() => bestStreak(preflopAttempts, postflopAttempts), [preflopAttempts, postflopAttempts]);
  const history = useMemo(() => recentHistory(preflopAttempts, postflopAttempts), [preflopAttempts, postflopAttempts]);

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Dashboard</h1>
          <p className="mt-2 text-ink-muted">Your training history, tracked locally on this device.</p>
        </div>
        {totalReps > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirmingReset) {
                resetProgress();
                setConfirmingReset(false);
              } else {
                setConfirmingReset(true);
                setTimeout(() => setConfirmingReset(false), 4000);
              }
            }}
            className="cursor-pointer rounded-lg border border-border-strong px-3 py-2 text-xs font-medium text-ink-muted transition-colors duration-150 hover:border-error hover:text-error"
          >
            {confirmingReset ? 'Click again to confirm reset' : 'Reset progress'}
          </button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Total XP" value={xp.toLocaleString()} tone="gold" />
        <StatTile label="Overall accuracy" value={`${Math.round(accuracy * 100)}%`} tone={accuracy >= 0.6 ? 'success' : 'error'} />
        <StatTile label="Hands drilled" value={totalReps.toLocaleString()} />
        <StatTile label="Postflop reps" value={postflopAttempts.length.toLocaleString()} />
        <StatTile label="Best streak" value={streak.toLocaleString()} tone="violet" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TierProgress xp={xp} />
        <LeakFinderCard leaks={leaks} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AccuracyTrendChart data={trend} />
        <PositionAccuracyChart data={posAccuracy} />
      </div>

      <div className="mt-6">
        <HistoryList entries={history} />
      </div>
    </PageShell>
  );
}
