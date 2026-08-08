import { useCallback, useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { OddsCalculator } from '@/components/learn/OddsCalculator';
import { GlossaryList } from '@/components/learn/GlossaryList';
import { StrategyLibrary } from '@/components/learn/StrategyLibrary';
import { PlayerTells } from '@/components/learn/PlayerTells';
import { PositionSelector } from '@/components/trainer/PositionSelector';
import { TableSizeSelector } from '@/components/trainer/TableSizeSelector';
import { RangeGrid } from '@/components/trainer/RangeGrid';
import { positionsForSize, type Position, type TableSize } from '@/lib/poker/ranges';

export function LearnHubPage() {
  const [tableSize, setTableSize] = useState<TableSize>(6);
  const [position, setPosition] = useState<Position>('BTN');
  const positions = useMemo(() => positionsForSize(tableSize), [tableSize]);

  const handleTableSize = useCallback(
    (size: TableSize) => {
      setTableSize(size);
      const next = positionsForSize(size);
      if (!next.includes(position)) setPosition('BTN');
    },
    [position],
  );

  return (
    <PageShell>
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Learn Hub</h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          Free reference material — no login required. Calculate odds, study the strategy behind the
          trainers, look up terms, or print a range chart to keep next to your monitor.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <StrategyLibrary />
        <PlayerTells />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <OddsCalculator />
        <GlossaryList />
      </div>

      <div className="mt-10 print:mt-0" id="printable-chart">
        <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
          <h2 className="font-display text-xl font-semibold text-ink">Printable preflop chart</h2>
          <div className="flex flex-wrap items-center gap-3">
            <TableSizeSelector value={tableSize} onChange={handleTableSize} />
            <PositionSelector value={position} onChange={setPosition} positions={positions} />
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
