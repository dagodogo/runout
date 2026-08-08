import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { OddsCalculator } from '@/components/learn/OddsCalculator';
import { GlossaryList } from '@/components/learn/GlossaryList';
import { PositionSelector } from '@/components/trainer/PositionSelector';
import { RangeGrid } from '@/components/trainer/RangeGrid';
import type { Position } from '@/lib/poker/ranges';

export function LearnHubPage() {
  const [position, setPosition] = useState<Position>('BTN');

  return (
    <PageShell>
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Learn Hub</h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Free reference material — no login required. Calculate odds, look up terms, or print a
          range chart to keep next to your monitor.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <OddsCalculator />
        <GlossaryList />
      </div>

      <div className="mt-10 print:mt-0" id="printable-chart">
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <h2 className="font-display text-xl font-semibold text-ink">Printable preflop chart</h2>
          <div className="flex items-center gap-3">
            <PositionSelector value={position} onChange={setPosition} />
            <button
              type="button"
              onClick={() => window.print()}
              className="cursor-pointer rounded-lg bg-gold px-3.5 py-2 text-sm font-semibold text-base transition-colors duration-150 hover:bg-gold-soft"
            >
              Print chart
            </button>
          </div>
        </div>
        <div className="mt-4">
          <RangeGrid position={position} />
        </div>
      </div>
    </PageShell>
  );
}
