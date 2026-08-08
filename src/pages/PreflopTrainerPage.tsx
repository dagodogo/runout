import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { PositionSelector } from '@/components/trainer/PositionSelector';
import { RangeGrid } from '@/components/trainer/RangeGrid';
import { PreflopQuiz } from '@/components/trainer/PreflopQuiz';
import { Tabs } from '@/components/ui/Tabs';
import type { Position } from '@/lib/poker/ranges';

type Mode = 'chart' | 'quiz';

export function PreflopTrainerPage() {
  const [position, setPosition] = useState<Position>('BTN');
  const [mode, setMode] = useState<Mode>('quiz');

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Preflop Range Trainer</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Solver-flavored opening ranges for every position. Drill hands until the right action is
            instinct, or browse the full chart to study the shape of each range.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <PositionSelector value={position} onChange={setPosition} />
          <Tabs
            value={mode}
            onChange={setMode}
            options={[
              { value: 'quiz', label: 'Quiz me' },
              { value: 'chart', label: 'Browse chart' },
            ]}
          />
        </div>

        {mode === 'quiz' ? (
          <PreflopQuiz key={position} position={position} />
        ) : (
          <RangeGrid position={position} />
        )}
      </div>
    </PageShell>
  );
}
