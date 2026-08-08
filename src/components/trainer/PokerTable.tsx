import { useMemo } from 'react';
import { PlayingCard } from './PlayingCard';
import { positionsForSize, positionLabel, type Position, type TableSize } from '@/lib/poker/ranges';
import { cn } from '@/lib/cn';

const CX = 50;
const CY = 47;
const RX = 44;
const RY = 36;

/** Seats placed around an ellipse by angle, t=0 at bottom-center (hero) and
 * increasing clockwise on screen — works for any table size. */
function seatStyle(index: number, count: number): { left: string; top: string } {
  const t = (index / count) * Math.PI * 2;
  const left = CX + RX * Math.sin(t);
  const top = CY + RY * Math.cos(t);
  return { left: `${left}%`, top: `${top}%` };
}

interface PokerTableProps {
  heroPosition: Position;
  heroCards: string[];
  tableSize?: TableSize;
  villainPosition?: Position;
  board?: string[];
  potBb?: number;
  className?: string;
}

export function PokerTable({
  heroPosition,
  heroCards,
  tableSize = 6,
  villainPosition,
  board,
  potBb,
  className,
}: PokerTableProps) {
  const seatPositions = useMemo(() => {
    const order = positionsForSize(tableSize);
    const heroIdx = order.indexOf(heroPosition);
    const start = heroIdx === -1 ? 0 : heroIdx;
    return Array.from({ length: order.length }, (_, i) => order[(start + i) % order.length]);
  }, [heroPosition, tableSize]);

  return (
    <div className={cn('relative mx-auto aspect-[16/13] w-full max-w-xl pb-14 pt-4', className)}>
      {/* rail */}
      <div className="absolute inset-[6%] rounded-[50%] border-[10px] border-surface-3 shadow-2xl" />
      {/* felt */}
      <div
        className="absolute inset-[8%] rounded-[50%] border border-gold/20"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #16261f 0%, #0d1712 65%, #0a120d 100%)',
        }}
      />

      {/* center: pot + board */}
      <div className="absolute left-1/2 top-[38%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
        {potBb !== undefined && (
          <div className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-base/70 px-3 py-1 font-mono text-xs text-gold">
            <span className="h-2 w-2 rounded-full bg-gold" />
            Pot {potBb}bb
          </div>
        )}
        {board && board.length > 0 && (
          <div className="flex gap-1.5">
            {board.map((c, i) => (
              <PlayingCard key={`${c}-${i}`} card={c} size="sm" />
            ))}
          </div>
        )}
      </div>

      {seatPositions.map((pos, seatIdx) => {
        const isHero = pos === heroPosition;
        const isVillain = pos === villainPosition;
        const style = seatStyle(seatIdx, seatPositions.length);
        return (
          <div
            key={pos}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
            style={{ left: style.left, top: style.top }}
          >
            {isHero ? (
              <div className="flex gap-1">
                {heroCards.map((c, i) => (
                  <PlayingCard key={`${c}-${i}`} card={c} size="lg" />
                ))}
              </div>
            ) : (
              <div className="flex gap-0.5">
                <PlayingCard card="" size="xs" faceDown />
                <PlayingCard card="" size="xs" faceDown />
              </div>
            )}
            <span
              className={cn(
                'whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold',
                isHero
                  ? 'border-gold bg-gold/15 text-gold'
                  : isVillain
                    ? 'border-violet bg-violet/15 text-violet-soft'
                    : 'border-border-strong bg-surface text-ink-faint',
              )}
            >
              {positionLabel(pos)}
              {isHero ? ' · YOU' : ''}
              {pos === 'BTN' && (
                <span className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ink text-[8px] font-bold text-base">
                  D
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
