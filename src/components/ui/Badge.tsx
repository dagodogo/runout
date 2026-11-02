import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'gold' | 'violet' | 'raise' | 'call' | 'fold' | 'success' | 'error' | 'neutral';

// 'gold'/'raise' = the accent; 'success'/'error' = the blue/orange grade pair. Callers pair every tone with words.
const TONE_CLASSES: Record<Tone, string> = {
  gold: 'bg-accent/10 text-accent-text border-accent/40',
  violet: 'bg-raised text-bone border-rule',
  raise: 'bg-accent/10 text-accent-text border-accent/40',
  call: 'bg-bone/10 text-bone border-bone/30',
  fold: 'bg-fold/40 text-graphite border-fold',
  success: 'bg-good/10 text-good border-good/40',
  error: 'bg-bad/10 text-bad border-bad/40',
  neutral: 'bg-raised text-graphite border-rule',
};

// grade tones also carry a shape (circle good, triangle bad), so a grade never rests on colour alone
const SHAPE: Partial<Record<Tone, string>> = { success: '●', error: '▲' };

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = 'neutral', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-medium', TONE_CLASSES[tone], className)}
      {...props}
    >
      {SHAPE[tone] && (
        <span aria-hidden="true" className="text-[0.7em]">
          {SHAPE[tone]}
        </span>
      )}
      {children}
    </span>
  );
}
