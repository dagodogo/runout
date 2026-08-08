import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'gold' | 'violet' | 'raise' | 'call' | 'fold' | 'success' | 'error' | 'neutral';

const TONE_CLASSES: Record<Tone, string> = {
  gold: 'bg-gold/15 text-gold border-gold/30',
  violet: 'bg-violet/15 text-violet-soft border-violet/30',
  raise: 'bg-raise/15 text-raise-soft border-raise/30',
  call: 'bg-call/15 text-call-soft border-call/30',
  fold: 'bg-fold/15 text-fold-soft border-fold/30',
  success: 'bg-success/15 text-success border-success/30',
  error: 'bg-error/15 text-error border-error/30',
  neutral: 'bg-surface-2 text-ink-muted border-border',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      )}
      {...props}
    />
  );
}
