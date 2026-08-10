import { memo } from 'react';
import { cn } from '@/lib/cn';

const RED_SUITS = new Set(['♥', '♦']);

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'lg-quad';

const DIMS: Record<Size, string> = {
  xs: 'h-8 w-6 text-[10px] rounded',
  sm: 'h-11 w-8 text-sm rounded-md',
  md: 'h-16 w-11 text-lg rounded-lg',
  // Mobile-first: fixed-pixel cards would overflow a fluid table container at
  // narrow widths, so the hero's cards scale up at each breakpoint instead.
  lg: 'h-14 w-10 text-base rounded-lg sm:h-20 sm:w-14 sm:text-xl sm:rounded-xl md:h-24 md:w-16 md:text-2xl',
  // Four hole cards (PLO) need to fit in roughly the same footprint as two —
  // scaled down from `lg` at every breakpoint so the row doesn't bleed into
  // neighboring seat labels on narrow viewports.
  'lg-quad': 'h-11 w-8 text-sm rounded sm:h-16 sm:w-11 sm:text-lg sm:rounded-lg md:h-18 md:w-13 md:text-xl',
};

const PIP_OFFSET: Record<Size, string> = {
  xs: 'top-0.5 left-0.5',
  sm: 'top-1 left-1',
  md: 'top-1.5 left-1.5',
  'lg-quad': 'top-1 left-1',
  lg: 'top-2 left-2.5',
};

interface PlayingCardProps {
  card: string; // e.g. "A♠"
  size?: Size;
  faceDown?: boolean;
  className?: string;
}

function PlayingCardImpl({ card, size = 'md', faceDown = false, className }: PlayingCardProps) {
  if (faceDown) {
    return (
      <div
        className={cn(
          DIMS[size],
          'relative overflow-hidden border border-gold/40 bg-gradient-to-br from-violet to-surface-3 shadow-md',
          className,
        )}
      >
        <div
          className="absolute inset-0.5 rounded-[inherit] opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, var(--color-gold) 0, var(--color-gold) 1px, transparent 1px, transparent 6px)',
          }}
        />
      </div>
    );
  }

  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  const isRed = RED_SUITS.has(suit);

  return (
    <div
      className={cn(
        DIMS[size],
        'relative flex flex-col items-center justify-center border border-black/10 bg-white font-mono font-bold shadow-md',
        className,
      )}
      style={{ color: isRed ? '#dc2626' : '#111827' }}
    >
      <span className={cn('absolute flex flex-col items-center leading-none', PIP_OFFSET[size])}>
        <span>{rank}</span>
        <span className="-mt-0.5">{suit}</span>
      </span>
      <span className="text-[1.6em] opacity-90">{suit}</span>
    </div>
  );
}

export const PlayingCard = memo(PlayingCardImpl);
