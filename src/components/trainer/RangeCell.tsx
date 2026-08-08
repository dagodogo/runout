import { memo, useMemo } from 'react';
import type { HandCell } from '@/lib/poker/hands';
import type { ActionMix } from '@/lib/poker/ranges';

interface RangeCellProps {
  hand: HandCell;
  mix: ActionMix;
  selected?: boolean;
  dimmed?: boolean;
  onHover?: (hand: HandCell | null) => void;
  onClick?: (hand: HandCell) => void;
}

function RangeCellImpl({ hand, mix, selected, dimmed, onHover, onClick }: RangeCellProps) {
  const background = useMemo(() => {
    const raisePct = mix.raise * 100;
    const callPct = mix.call * 100;
    const stops: string[] = [];
    let cursor = 0;
    if (raisePct > 0.5) {
      stops.push(`var(--color-raise) ${cursor}% ${cursor + raisePct}%`);
      cursor += raisePct;
    }
    if (callPct > 0.5) {
      stops.push(`var(--color-call) ${cursor}% ${cursor + callPct}%`);
      cursor += callPct;
    }
    stops.push(`var(--color-fold) ${cursor}% 100%`);
    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }, [mix.raise, mix.call]);

  return (
    <button
      type="button"
      onMouseEnter={() => onHover?.(hand)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(hand)}
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-[4px] border transition-transform duration-150 hover:z-10 hover:scale-110 hover:shadow-lg focus-visible:z-10 focus-visible:scale-110"
      style={{
        background,
        borderColor: selected ? 'var(--color-gold)' : 'var(--color-border)',
        opacity: dimmed ? 0.35 : 1,
      }}
    >
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-semibold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.7)] sm:text-[10px] md:text-xs">
        {hand.label}
      </span>
    </button>
  );
}

export const RangeCell = memo(RangeCellImpl);
