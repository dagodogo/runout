import { memo } from 'react';
import { cn } from '@/lib/cn';

const RED_SUITS = new Set(['♥', '♦']);
const RANK_NAME: Record<string, string> = {
  A: 'Ace', K: 'King', Q: 'Queen', J: 'Jack', T: 'Ten', '9': 'Nine', '8': 'Eight', '7': 'Seven',
  '6': 'Six', '5': 'Five', '4': 'Four', '3': 'Three', '2': 'Two',
};
const SUIT_NAME: Record<string, string> = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };

type Size = 'xs' | 'sm' | 'md' | 'row' | 'lg' | 'lg-quad';

const DIMS: Record<Size, string> = {
  xs: 'h-8 w-6 text-[10px] rounded-[4px]',
  sm: 'h-11 w-8 text-sm rounded-card',
  md: 'h-16 w-11 text-lg rounded-card',
  // seat rows: five board cards plus a label column fit 390 px
  row: 'h-12 w-9 text-base rounded-card sm:h-16 sm:w-11 sm:text-lg',
  // Mobile-first: fixed-pixel cards would overflow a fluid table container at
  // narrow widths, so the hero's cards scale up at each breakpoint instead.
  lg: 'h-14 w-10 text-base rounded-card sm:h-20 sm:w-14 sm:text-xl md:h-24 md:w-16 md:text-2xl',
  // Four hole cards (PLO) need to fit in roughly the same footprint as two —
  // scaled down from `lg` at every breakpoint so the row doesn't bleed into
  // neighboring seat labels on narrow viewports.
  'lg-quad': 'h-11 w-8 text-sm rounded-[4px] sm:h-16 sm:w-11 sm:text-lg sm:rounded-card md:h-18 md:w-13 md:text-xl',
};

const PIP_OFFSET: Record<Size, string> = {
  xs: 'top-0.5 left-0.5',
  sm: 'top-1 left-1',
  md: 'top-1.5 left-1.5',
  row: 'top-1 left-1 sm:top-1.5 sm:left-1.5',
  'lg-quad': 'top-1 left-1',
  lg: 'top-2 left-2.5',
};

interface PlayingCardProps {
  card: string; // e.g. "A♠"
  size?: Size;
  faceDown?: boolean;
  /** an empty board slot (a card still to come) */
  empty?: boolean;
  className?: string;
}

function PlayingCardImpl({ card, size = 'md', faceDown = false, empty = false, className }: PlayingCardProps) {
  if (empty) return <div aria-hidden="true" className={cn(DIMS[size], 'shrink-0 border border-dashed border-rule', className)} />;
  if (faceDown) {
    return <div role="img" aria-label="Hidden card" className={cn(DIMS[size], 'border border-rule-strong bg-raised', className)} />;
  }

  const suit = card.slice(-1);
  const rank = card.slice(0, -1);

  return (
    <div
      role="img"
      aria-label={`${RANK_NAME[rank] ?? rank} of ${SUIT_NAME[suit] ?? suit}`}
      className={cn(
        DIMS[size],
        'relative flex shrink-0 flex-col items-center justify-center bg-bone font-display font-semibold',
        RED_SUITS.has(suit) ? 'text-card-red' : 'text-card-black',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('absolute flex flex-col items-center leading-none', PIP_OFFSET[size])}>
        <span>{rank}</span>
        <span className="-mt-0.5">{suit}</span>
      </span>
      <span aria-hidden="true" className="text-[1.6em]">
        {suit}
      </span>
    </div>
  );
}

export const PlayingCard = memo(PlayingCardImpl);
