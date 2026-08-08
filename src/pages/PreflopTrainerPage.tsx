import { useCallback, useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { PositionSelector } from '@/components/trainer/PositionSelector';
import { TableSizeSelector } from '@/components/trainer/TableSizeSelector';
import { RangeGrid } from '@/components/trainer/RangeGrid';
import { PreflopQuiz } from '@/components/trainer/PreflopQuiz';
import { Tabs } from '@/components/ui/Tabs';
import { positionsForSize, positionLabel, type Position, type RfiPosition, type TableSize } from '@/lib/poker/ranges';

type Mode = 'chart' | 'quiz';

export function PreflopTrainerPage() {
  const [tableSize, setTableSize] = useState<TableSize>(6);
  const [position, setPosition] = useState<Position>('BTN');
  const [openerPosition, setOpenerPosition] = useState<RfiPosition>('BTN');
  const [mode, setMode] = useState<Mode>('quiz');

  const positions = useMemo(() => positionsForSize(tableSize), [tableSize]);

  const handleTableSize = useCallback(
    (size: TableSize) => {
      setTableSize(size);
      const nextPositions = positionsForSize(size);
      if (!nextPositions.includes(position)) setPosition('BTN');
      setOpenerPosition('BTN');
    },
    [position],
  );

  const openerOptions = useMemo(
    () => positionsForSize(tableSize).filter((p): p is RfiPosition => p !== 'BB'),
    [tableSize],
  );

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Preflop Range Trainer</h1>
          <p className="mt-2 max-w-2xl text-ink-muted">
            Solver-flavored ranges for every seat at a 6-max or full-ring table. Drill hands until the
            right action is instinct, or browse the full chart to study the shape of each range.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <TableSizeSelector value={tableSize} onChange={handleTableSize} />
            <PositionSelector value={position} onChange={setPosition} positions={positions} />
          </div>
          <Tabs
            value={mode}
            onChange={setMode}
            options={[
              { value: 'quiz', label: 'Quiz me' },
              { value: 'chart', label: 'Browse chart' },
            ]}
          />
        </div>

        {position === 'BB' && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-ink-muted">Defending against an open from</span>
            <Tabs
              value={openerPosition}
              onChange={setOpenerPosition}
              options={openerOptions.map((p) => ({ value: p, label: positionLabel(p) }))}
            />
          </div>
        )}

        {mode === 'quiz' ? (
          <PreflopQuiz key={`${tableSize}-${position}-${openerPosition}`} position={position} tableSize={tableSize} openerPosition={openerPosition} />
        ) : (
          <RangeGrid position={position} openerPosition={openerPosition} />
        )}
      </div>
    </PageShell>
  );
}
