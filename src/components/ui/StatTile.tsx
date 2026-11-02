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
  gold: 'text-accent-text',
  violet: 'text-bone',
  success: 'text-good',
  error: 'text-bad',
  neutral: 'text-bone',
};

export function StatTile({ label, value, sublabel, tone = 'neutral' }: StatTileProps) {
  return (
    <Card className="p-5">
      <div className="text-sm text-faint">{label}</div>
      <div className={cn('mt-1 font-display text-3xl font-semibold tabular-nums', TONE_TEXT[tone])}>{value}</div>
      {sublabel && <div className="mt-1 text-sm text-graphite">{sublabel}</div>}
    </Card>
  );
}
