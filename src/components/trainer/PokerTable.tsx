import { useMemo } from 'react';
import { PlayingCard } from './PlayingCard';
import { ChipStack } from './ChipStack';
import { positionsForSize, positionLabel, type Position, type TableSize } from '@/lib/poker/ranges';
import { cn } from '@/lib/cn';

const CX = 50;
const CY = 47;
const RX = 44;
const RY = 36;
const POT_TOP = 43;

/** Seats placed around an ellipse by angle, t=0 at bottom-center (hero).
 * Action moves clockwise around a real table, which — viewed from outside
 * with hero at the bottom — visually goes bottom -> bottom-LEFT -> left ->
 * top, not bottom-right. (Sit at 6 o'clock facing the felt: your left hand
 * points toward 9 o'clock, so the next player to act sits at 7-8 o'clock.) */
function seatStyle(index: number, count: number): { left: number; top: number } {
  const t = (index / count) * Math.PI * 2;
  const left = CX - RX * Math.sin(t);
  const top = CY + RY * Math.cos(t);
  return { left, top };
}

function lerpPoint(a: { left: number; top: number }, b: { left: number; top: number }, t: number) {
  return { left: a.left + (b.left - a.left) * t, top: a.top + (b.top - a.top) * t };
}

interface PokerTableProps {
  heroPosition: Position;
  heroCards: string[];
  tableSize?: TableSize;
  villainPosition?: Position;
  board?: string[];
  potBb?: number;
  /** Chips currently in front of a seat (an open, a call, a blind) — shown
   * as a small stack drifting from that seat toward the pot. */
  betBySeat?: Partial<Record<Position, number>>;
  /** Seats that have folded this hand — dimmed and cardless. */
  foldedPositions?: Position[];
  /** Non-hero seats to reveal face-up (e.g. at showdown). */
  revealCards?: Partial<Record<Position, string[]>>;
  className?: string;
}

export function PokerTable({
  heroPosition,
  heroCards,
  tableSize = 6,
  villainPosition,
  board,
  potBb,
  betBySeat,
  foldedPositions,
  revealCards,
  className,
}: PokerTableProps) {
  const seatPositions = useMemo(() => {
    const order = positionsForSize(tableSize);
    const heroIdx = order.indexOf(heroPosition);
    const start = heroIdx === -1 ? 0 : heroIdx;
    return Array.from({ length: order.length }, (_, i) => order[(start + i) % order.length]);
  }, [heroPosition, tableSize]);

  const center = { left: CX, top: POT_TOP };

  return (
    <div className={cn('relative mx-auto aspect-[16/16] w-full max-w-xl pb-14 pt-4', className)}>
      {/* rail */}
      <div className="absolute inset-[6%] rounded-[50%] border-[10px] border-surface-3 shadow-2xl" />
      {/* felt */}
      <div
        className="absolute inset-[8%] rounded-[50%] border border-gold/25"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #1a1a1a 0%, #101010 65%, #060606 100%)',
        }}
      />

      {/* center: pot + board */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
        style={{ left: `${center.left}%`, top: `${center.top}%` }}
      >
        {potBb !== undefined && potBb > 0 && (
          <div className="flex flex-col items-center gap-1">
            <ChipStack amountBb={potBb} size="md" />
            <div className="rounded-full border border-gold/30 bg-base/70 px-2.5 py-0.5 font-mono text-[10px] text-gold">
              Pot {potBb}bb
            </div>
          </div>
        )}
        {board && board.length > 0 && (
          <div className="mt-1 flex gap-1.5">
            {board.map((c, i) => (
              <PlayingCard key={`${c}-${i}`} card={c} size="sm" />
            ))}
          </div>
        )}
      </div>

      {seatPositions.map((pos, seatIdx) => {
        const isHero = pos === heroPosition;
        const isVillain = pos === villainPosition;
        const isFolded = foldedPositions?.includes(pos) ?? false;
        const revealed = revealCards?.[pos];
        const style = seatStyle(seatIdx, seatPositions.length);
        const bet = betBySeat?.[pos];
        const betPoint = bet ? lerpPoint(style, center, 0.42) : null;
        return (
          <div key={pos}>
            <div
              className={cn(
                'absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 transition-opacity duration-300',
                isFolded && 'opacity-30',
              )}
              style={{ left: `${style.left}%`, top: `${style.top}%` }}
            >
              {isHero ? (
                <div className="flex gap-1">
                  {heroCards.map((c, i) => (
                    <PlayingCard key={`${c}-${i}`} card={c} size="lg" />
                  ))}
                </div>
              ) : isFolded ? (
                <div className="flex gap-0.5 opacity-0">
                  <PlayingCard card="" size="xs" faceDown />
                </div>
              ) : revealed ? (
                <div className="flex gap-0.5">
                  {revealed.map((c, i) => (
                    <PlayingCard key={`${c}-${i}`} card={c} size="sm" />
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
                {isFolded ? ' · folded' : ''}
                {pos === 'BTN' && (
                  <span className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-ink text-[8px] font-bold text-base">
                    D
                  </span>
                )}
              </span>
            </div>
            {betPoint && bet !== undefined && (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${betPoint.left}%`, top: `${betPoint.top}%` }}
              >
                <ChipStack amountBb={bet} size="sm" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
