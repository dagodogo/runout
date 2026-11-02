import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** Flat panel: one depth device (a 1 px rule), no shadow, no blur. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-panel border border-rule bg-panel', className)} {...props} />;
}
