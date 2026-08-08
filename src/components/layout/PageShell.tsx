import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn('mx-auto max-w-7xl px-6 pb-24 pt-10', className)}>{children}</main>;
}
