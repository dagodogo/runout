import type { ReactNode } from 'react';
import { Card } from './Card';
import { cn } from '@/lib/cn';

interface StatTileProps {
  label: string;
  value: ReactNode;
  sublabel?: string;
  tone?: 'gold' | 'violet' | 'success' | 'error' | 'neutral';
}

const TONE_TEXT: Record<NonNullable<StatTileProps['tone']>, string> = {
  gold: 'text-gold',
  violet: 'text-violet-soft',
  success: 'text-success',
  error: 'text-error',
  neutral: 'text-ink',
};

export function StatTile({ label, value, sublabel, tone = 'neutral' }: StatTileProps) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={cn('mt-2 font-mono text-3xl font-semibold', TONE_TEXT[tone])}>{value}</div>
      {sublabel && <div className="mt-1 text-xs text-ink-muted">{sublabel}</div>}
    </Card>
  );
}
