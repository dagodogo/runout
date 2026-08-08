import { useCallback, useMemo, useState } from 'react';
import { HAND_GRID, type HandCell } from '@/lib/poker/hands';
import { getMix, type Position, type RfiPosition } from '@/lib/poker/ranges';
import { RangeCell } from './RangeCell';
import { Card } from '@/components/ui/Card';

interface RangeGridProps {
  position: Position;
  openerPosition?: RfiPosition;
  onCellClick?: (hand: HandCell) => void;
  highlightHand?: string;
}

export function RangeGrid({ position, openerPosition, onCellClick, highlightHand }: RangeGridProps) {
  const [hovered, setHovered] = useState<HandCell | null>(null);

  const mixes = useMemo(() => {
    return HAND_GRID.map((row) => row.map((hand) => getMix(position, hand, openerPosition)));
  }, [position, openerPosition]);

  const handleHover = useCallback((hand: HandCell | null) => setHovered(hand), []);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <Card className="grid aspect-square w-full max-w-[560px] grid-cols-[repeat(13,minmax(0,1fr))] gap-[3px] p-3">
        {HAND_GRID.map((row, r) =>
          row.map((hand, c) => (
            <RangeCell
              key={hand.label}
              hand={hand}
              mix={mixes[r][c]}
              selected={hand.label === highlightHand}
              onHover={handleHover}
              onClick={onCellClick}
            />
          )),
        )}
      </Card>

      <Card className="w-full p-5 lg:w-64 lg:shrink-0">
        {hovered ? (
          <HandDetail hand={hovered} mix={getMix(position, hovered, openerPosition)} />
        ) : (
          <p className="text-sm text-ink-muted">
            Hover any hand to see its exact action mix at this position. Solid colors are
            100% frequency plays; split cells are the solver's mixed strategies.
          </p>
        )}
      </Card>
    </div>
  );
}

function HandDetail({ hand, mix }: { hand: HandCell; mix: ReturnType<typeof getMix> }) {
  return (
    <div>
      <div className="font-mono text-2xl font-semibold text-ink">{hand.label}</div>
      <div className="mt-4 space-y-2">
        <MixRow label="Raise" value={mix.raise} color="var(--color-raise)" />
        {mix.call > 0.005 && <MixRow label="Call" value={mix.call} color="var(--color-call)" />}
        <MixRow label="Fold" value={mix.fold} color="var(--color-fold)" />
      </div>
    </div>
  );
}

function MixRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ink-muted">
        <span>{label}</span>
        <span className="font-mono">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}
