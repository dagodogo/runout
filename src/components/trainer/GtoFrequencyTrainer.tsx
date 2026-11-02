import { useCallback, useMemo, useState } from 'react';
import { weightedRandomHand, type HandCell } from '@/lib/poker/hands';
import { RFI_CONFIG, getMix, positionsForSize, type RfiPosition, type TableSize } from '@/lib/poker/ranges';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { TableSizeSelector } from './TableSizeSelector';
import { ConceptCallout } from './ConceptCallout';
import { useProfileStore } from '@/lib/store/profile';
import { cn } from '@/lib/cn';

const GUESS_OPTIONS = [0, 20, 40, 60, 80, 100];

/** Only pull hands that actually sit in a mixed-frequency zone — that's the
 * whole point of this drill (pure 0% / 100% hands aren't interesting here). */
function drawMixedHand(position: RfiPosition, excludeLabel?: string): HandCell {
  for (let i = 0; i < 200; i++) {
    const hand = weightedRandomHand(excludeLabel);
    const mix = getMix(position, hand);
    if (mix.raise > 0.03 && mix.raise < 0.97) return hand;
  }
  return weightedRandomHand(excludeLabel);
}

export function GtoFrequencyTrainer() {
  const [tableSize, setTableSize] = useState<TableSize>(6);
  const [position, setPosition] = useState<RfiPosition>('CO');
  const [hand, setHand] = useState<HandCell>(() => drawMixedHand('CO'));
  const [guess, setGuess] = useState<number | null>(null);
  const [session, setSession] = useState({ points: 0, total: 0 });
  const recordPreflop = useProfileStore((s) => s.recordPreflop);

  const rfiPositions = useMemo(
    () => positionsForSize(tableSize).filter((p): p is RfiPosition => p !== 'BB'),
    [tableSize],
  );

  const mix = useMemo(() => getMix(position, hand), [position, hand]);
  const actualPct = Math.round(mix.raise * 100);
  const diff = guess === null ? null : Math.abs(guess - actualPct);
  const grade = diff === null ? null : diff <= 10 ? 'exact' : diff <= 25 ? 'close' : 'off';

  const changeTableSize = useCallback(
    (size: TableSize) => {
      setTableSize(size);
      const next = positionsForSize(size).filter((p): p is RfiPosition => p !== 'BB');
      const nextPosition = next.includes(position) ? position : 'CO';
      setPosition(nextPosition);
      setHand(drawMixedHand(nextPosition));
      setGuess(null);
    },
    [position],
  );

  const changePosition = useCallback((p: RfiPosition) => {
    setPosition(p);
    setHand(drawMixedHand(p));
    setGuess(null);
  }, []);

  const handleGuess = useCallback(
    (value: number) => {
      if (guess !== null) return;
      setGuess(value);
      const d = Math.abs(value - actualPct);
      const correct = d <= 25;
      setSession((s) => ({ points: s.points + (d <= 10 ? 2 : correct ? 1 : 0), total: s.total + 1 }));
      recordPreflop({ position, hand: hand.label, correct });
    },
    [guess, actualPct, position, hand.label, recordPreflop],
  );

  const nextHand = useCallback(() => {
    setHand(drawMixedHand(position, hand.label));
    setGuess(null);
  }, [position, hand.label]);

  return (
    <Card className="mx-auto w-full max-w-xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <TableSizeSelector value={tableSize} onChange={changeTableSize} />
          <Tabs
            value={position}
            onChange={changePosition}
            options={rfiPositions.map((p) => ({ value: p, label: RFI_CONFIG[p].label }))}
          />
        </div>
        <span className="tabular-nums text-xs text-ink-muted">
          {session.points} pts &middot; {session.total} hands
        </span>
      </div>

      <div className="mt-4 flex justify-center">
        <Badge>Heuristic approximation, not solver output</Badge>
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        What raise frequency does a solver-flavored strategy use with this hand from{' '}
        <span className="text-ink">{RFI_CONFIG[position].label}</span>?
      </p>
      <div className="mt-3 text-center tabular-nums text-6xl font-bold text-ink">{hand.label}</div>

      <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {GUESS_OPTIONS.map((v) => (
          <button
            key={v}
            type="button"
            disabled={guess !== null}
            onClick={() => handleGuess(v)}
            className={cn(
              'cursor-pointer rounded-control border py-3 tabular-nums text-sm font-semibold transition-colors duration-150 disabled:cursor-default',
              guess === v ? 'border-bone bg-raised text-bone' : 'border-border-strong text-ink hover:border-bone hover:text-bone',
              guess !== null && guess !== v && 'opacity-40',
            )}
          >
            {v}%
          </button>
        ))}
      </div>

      {guess !== null && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            {grade === 'exact' && <Badge tone="success">Nailed it</Badge>}
            {grade === 'close' && <Badge tone="success">Close</Badge>}
            {grade === 'off' && <Badge tone="error">Off</Badge>}
            <span className="text-xs text-ink-muted">
              Actual: raise {actualPct}% &middot; fold {100 - actualPct}%
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full border border-border">
            <div style={{ width: `${actualPct}%`, background: 'var(--color-raise)' }} />
            <div style={{ width: `${100 - actualPct}%`, background: 'var(--color-fold)' }} />
          </div>
          <ConceptCallout
            concept="Mixed strategies"
            title={`Actual raise frequency: ${actualPct}%`}
            tone={grade === 'off' ? 'error' : 'success'}
          >
            {`Hands near a position's threshold aren't played 100/0: mixing frequencies keeps opponents from exploiting the exact cutoff. This hand sits right in ${RFI_CONFIG[position].label}'s blend zone.`}
          </ConceptCallout>
          <button
            type="button"
            onClick={nextHand}
            className="w-full cursor-pointer rounded-control bg-accent py-3 text-sm font-semibold text-on-accent transition-colors duration-150 hover:bg-accent-hover"
          >
            Next hand
          </button>
        </div>
      )}
    </Card>
  );
}
