import { useMemo, useState } from 'react';
import { PageShell, PageHeader } from '@/components/layout/PageShell';
import { StatTile } from '@/components/ui/StatTile';
import { TierProgress } from '@/components/dashboard/TierProgress';
import { LeakFinderCard } from '@/components/dashboard/LeakFinderCard';
import { AccuracyTrendChart } from '@/components/dashboard/AccuracyTrendChart';
import { PositionAccuracyChart } from '@/components/dashboard/PositionAccuracyChart';
import { HistoryList } from '@/components/dashboard/HistoryList';
import { EvLostTile } from '@/components/dashboard/EvLostTile';
import { useProfileStore } from '@/lib/store/profile';
import { topLeaks, overallAccuracy, solverEvLostPer100 } from '@/lib/poker/leaks';
import { accuracyTrend, positionAccuracy, bestStreak, recentHistory } from '@/lib/poker/stats';

export function DashboardPage() {
  const xp = useProfileStore((s) => s.xp);
  const preflopAttempts = useProfileStore((s) => s.preflopAttempts);
  const postflopAttempts = useProfileStore((s) => s.decisions);
  const resetProgress = useProfileStore((s) => s.resetProgress);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const totalReps = preflopAttempts.length + postflopAttempts.length;
  const accuracy = useMemo(() => overallAccuracy(preflopAttempts, postflopAttempts), [preflopAttempts, postflopAttempts]);
  const leaks = useMemo(() => topLeaks(preflopAttempts, postflopAttempts), [preflopAttempts, postflopAttempts]);
  const trend = useMemo(() => accuracyTrend(preflopAttempts, postflopAttempts), [preflopAttempts, postflopAttempts]);
  const posAccuracy = useMemo(() => positionAccuracy(preflopAttempts), [preflopAttempts]);
  const streak = useMemo(() => bestStreak(preflopAttempts, postflopAttempts), [preflopAttempts, postflopAttempts]);
  const history = useMemo(() => recentHistory(preflopAttempts, postflopAttempts), [preflopAttempts, postflopAttempts]);
  const solverEv = useMemo(() => solverEvLostPer100(postflopAttempts), [postflopAttempts]);

  return (
    <PageShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Progress">Your training history, kept in this browser only.</PageHeader>
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
            className="min-h-11 cursor-pointer rounded-control border border-rule-strong px-4 text-sm font-medium text-graphite transition-colors duration-150 hover:border-bad hover:text-bad"
          >
            {confirmingReset ? 'Click again to confirm reset' : 'Reset progress'}
          </button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Total XP" value={xp.toLocaleString()} />
        <StatTile label="Overall accuracy" value={`${Math.round(accuracy * 100)}%`} />
        <StatTile label="Hands drilled" value={totalReps.toLocaleString()} />
        <StatTile label="Postflop reps" value={postflopAttempts.length.toLocaleString()} />
        <StatTile label="Best streak" value={streak.toLocaleString()} />
      </div>

      <div className="mt-4 max-w-md">
        <EvLostTile ev={solverEv} />
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
