import { cn } from '@/lib/cn';

interface ChipStackProps {
  amountBb: number;
  size?: 'sm' | 'md';
  className?: string;
}

/** A small stylized poker chip stack — chip count scales (softly) with the
 * amount so bigger bets visibly read as bigger stacks. */
export function ChipStack({ amountBb, size = 'sm', className }: ChipStackProps) {
  const chipCount = Math.min(6, Math.max(1, Math.round(Math.sqrt(Math.max(amountBb, 1)) * 1.3)));
  const chipH = size === 'sm' ? 3 : 4;
  const chipW = size === 'sm' ? 16 : 20;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: chipW, height: chipH * chipCount + 4 }}>
        {Array.from({ length: chipCount }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-x-0 rounded-full border"
            style={{
              bottom: i * chipH,
              height: chipH + 2,
              borderColor: i % 2 === 0 ? 'var(--color-gold)' : 'var(--color-ink)',
              background:
                i % 2 === 0
                  ? 'linear-gradient(180deg, var(--color-gold-soft), var(--color-gold))'
                  : 'linear-gradient(180deg, #3a3a3a, #1a1a1a)',
            }}
          />
        ))}
      </div>
      <span className="mt-1 font-mono text-[9px] font-semibold text-ink-muted">{amountBb}bb</span>
    </div>
  );
}
