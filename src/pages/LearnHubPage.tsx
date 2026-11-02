import { useCallback, useMemo, useState } from 'react';
import { PageShell, PageHeader } from '@/components/layout/PageShell';
import { buttonClass } from '@/components/ui/Button';
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
      <PageHeader title="Learn">
        Free reference material, no login required. Calculate odds, study the strategy behind the trainers, look up
        terms, or print a range chart to keep next to your monitor.
      </PageHeader>

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
              className={buttonClass('secondary')}
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
